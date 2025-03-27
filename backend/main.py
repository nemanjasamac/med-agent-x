import re
import fitz
import os
import io
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from openai import OpenAI
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from db import init_db, engine
from models import Summary, Feedback, Diagnosis
from sqlmodel import Session, select
from uuid import UUID
from pydantic import BaseModel
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from textwrap import wrap
from fastapi.responses import StreamingResponse
from sqlalchemy import cast, func, text
from sqlalchemy.dialects.postgresql import JSONB

####### Models #######

class DiagnosisRequest(BaseModel):
    summary: str
    summary_id: str

class FeedbackRequest(BaseModel):
    summary_id : str
    helpful: bool
    comment: str | None=None

####### FastAPI #######

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.get("/")
def read_root():
    return {"message": "MedAgentX backend is running!"}

####### Summary API #######

@app.post("/generate-summary")
async def generate_summary(
    file: UploadFile = File(...),
    patient_id: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
):
    contents = await file.read()
    file_text = ""

    if file.filename.endswith(".pdf"):
        try:
            pdf = fitz.open(stream=contents, filetype="pdf")
            for page in pdf:
                file_text += page.get_text()
        except Exception as e:
            return {"error": f"Failed to read PDF: {str(e)}"}
    else:
        try:
            file_text = contents.decode("utf-8")
        except UnicodeDecodeError:
            return {"error": "Unsupported file type. Please upload a .txt or .pdf file."}

    prompt_text = f"""
You are a medical assistant that reads raw patient documents and optional notes from the uploader, and produces a concise clinical summary.

{f"Uploader's notes: {notes}" if notes else ""}
Patient Notes:
{file_text[:2000]}

Return only the summary. Do not include introductions or explanations.
"""

    print("🧠 Prompt sent to GPT:\n", prompt_text)

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            temperature=0.4,
            max_tokens=1000,
            messages=[
                {"role": "system", "content": "You are a helpful medical AI assistant that summarizes patient records concisely and professionally."},
                {"role": "user", "content": prompt_text}
            ]
        )
        summary = response.choices[0].message.content
    except Exception as e:
        print("OpenAI API error:", e)
        summary = "Error: Failed to generate summary from AI Agent"

    keywords_list = ["diabetes", "hypertension", "chest pain", "shortness of breath", "headache", "fever", "cough", "nausea", "vomiting", "diarrhea", "fatigue", "weakness", "dizziness", "palpitations", "edema", "rash", "pain", "infection", "anemia", "depression", "anxiety", "insomnia", "sleep", "apnea", "seizure", "stroke", "heart attack", "heart failure", "kidney failure", "liver failure", "cancer", "pneumonia", "asthma", "COPD", "thyroid", "arthritis", "osteoporosis", "fracture", "injury", "surgery", "medication", "allergy", "smoking", "alcohol", "drug", "pregnancy", "contraception", "menstrual", "sexual", "STD", "HIV", "hepatitis", "COVID", "vaccine", "travel", "work", "exercise", "diet", "weight", "cholesterol", "blood pressure", "blood sugar", "heart rate", "respiratory rate", "temperature", "oxygen", "ECG", "EKG", "X-ray", "CT", "MRI", "ultrasound", "biopsy", "blood test", "urine test", "stool test", "sputum test", "swab test", "culture", "genetic", "screening", "diagnosis", "treatment", "medication", "surgery", "procedure", "therapy", "rehabilitation", "counseling", "support", "referral", "follow-up", "emergency", "hospital", "clinic", "office", "home", "telemedicine", "insurance", "payment", "privacy", "consent", "advance directive", "living will", "power of attorney", "healthcare", "provider", "nurse", "assistant", "technician", "therapist", "pharmacist", "social worker", "counselor", "psychologist", "psychiatrist", "surgeon", "specialist", "primary care", "urgent care", "emergency care", "hospital care", "home care", "palliative care", "hospice", "rehabilitation"]
    found_keywords = [
        kw.capitalize()
        for kw in keywords_list
        if re.search(rf"\b{re.escape(kw)}\b", file_text, re.IGNORECASE)
    ]
    if not found_keywords:
        found_keywords = ["No key medical terms found."]

    try:
        with Session(engine) as session:
            summary_record = Summary(
                patient_id=patient_id,
                file_name=file.filename,
                raw_text=file_text.strip(),
                summary=summary.strip(),
                keywords=found_keywords,
                notes=notes,
            )
            print("📥 Saving summary to DB:", file.filename, found_keywords)
            session.add(summary_record)
            session.commit()
            session.refresh(summary_record)
    except Exception as e:
        print("Failed to save summary to DB:", e)

    return {
        "summary": summary.strip(),
        "keywords": found_keywords,
    }

@app.get("/summaries")
def get_summaries(
    file_name: Optional[str] = Query(None),
    patient_id: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
):
    with Session(engine) as session:
        query = select(Summary)

        if file_name:
            query = query.where(func.lower(Summary.file_name).ilike(f"%{file_name.lower()}%"))

        if patient_id:
            query = query.where(func.lower(Summary.patient_id).ilike(f"%{patient_id.lower()}%"))

        if keyword:
            query = query.where(
                text("""
                    EXISTS (
                        SELECT 1 FROM jsonb_array_elements_text(summary.keywords) AS kw
                        WHERE LOWER(kw) LIKE :kw
                    )
                """)
    ).params(kw=f"%{keyword.lower()}%")

        results = session.exec(query).all()
        return [s.dict() for s in results]

    
@app.get("/summaries/{summary_id}")
def get_summary_by_id(summary_id: UUID):
    with Session(engine) as session:
        summary = session.get(Summary, summary_id)
        if not summary:
            raise HTTPException(status_code=404, detail="Summary not found")
        return summary

def draw_wrapped_text(pdf, text, x, y, max_width):
    lines = wrap(text, width=max_width)
    for line in lines:
        pdf.drawString(x, y, line)
        y -= 14
    return y

@app.get("/export-pdf/{summary_id}")
def export_pdf(summary_id: str):
    with Session(engine) as session:
        summary = session.get(Summary, UUID(summary_id))
        if not summary:
            raise HTTPException(status_code=404, detail="Summary not found")

        diagnosis = session.exec(
            select(Diagnosis).where(Diagnosis.summary_id == UUID(summary_id))
        ).first()
        if not diagnosis:
            raise HTTPException(status_code=404, detail="Diagnosis not found")

        buffer = io.BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=letter)
        pdf.setFont("Helvetica", 12)

        x, y = 50, 750
        y -= 20
        pdf.drawString(x, y, f"Patient ID: {summary.patient_id or '-'}")
        y -= 20
        pdf.drawString(x, y, f"File Name: {summary.file_name}")
        y -= 30

        pdf.drawString(x, y, "Summary:")
        y -= 20
        y = draw_wrapped_text(pdf, summary.summary or "", x + 10, y, 95)

        y -= 20
        pdf.drawString(x, y, "Diagnosis:")
        y -= 20
        y = draw_wrapped_text(pdf, diagnosis.result or "", x + 10, y, 95)

        pdf.showPage()
        pdf.save()
        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={summary.file_name.replace(' ', '_')}.pdf"}
        )

####### Diagnosis API #######

@app.post("/diagnose")
async def run_diagnosis(data: DiagnosisRequest):
    prompt = f"""
You are a clinical assistant. Based on the following patient summary, suggest potential diagnoses and next steps a doctor should consider:

Patient Summary:
{data.summary}

Respond with a clear, clinical-style explanation.PermissionError
"""
    print("Diagnosis prompt sent to GPT:", prompt)

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            temperature=0.3,
            max_tokens=1000,
            messages=[
                {"role": "system", "content": "You are a helpful clinical assistant trained to suggest differential diagnoses and next steps based on patient summaries."},
                {"role": "user", "content": prompt}
            ]
        )
        diagnosis = response.choices[0].message.content
    except Exception as e:
        print("Diagnosis agent error: ", e)
        diagnosis = "Unable to generate diagnosis due to an error."
    
    with Session(engine) as session:
        new_diagnosis = Diagnosis(summary_id=UUID(data.summary_id), result=diagnosis)
        session.add(new_diagnosis)
        session.commit()

    return {"diagnosis": diagnosis}

@app.get("/diagnosis/{summary_id}")
def get_diagnosis(summary_id: str):
    with Session(engine) as session:
        diagnosis = session.exec(
            select(Diagnosis)
            .where(Diagnosis.summary_id == UUID(summary_id))
            .order_by(Diagnosis.created_at.desc())
        ).first()

        if not diagnosis:
            return{"diagnosis": None}
        return {
            "diagnosis": diagnosis.result,
            "created_at": diagnosis.created_at.isoformat(),
            }

####### Feedback API #######

@app.post("/feedback")
def save_feedback(data: FeedbackRequest):
    with Session(engine) as session:
        feedback = Feedback(
            summary_id = UUID(data.summary_id),
            helpful = data.helpful,
            comment = data.comment
        )
        session.add(feedback)
        session.commit()
    return {"message": "Feedback saved successfully."}

@app.get("/feedbacks")
def get_feedbacks():
    with Session(engine) as session:
        feedbacks = session.exec(select(Feedback)).all()
        return feedbacks

@app.get("/feedback/{summary_id}")
def get_feedback(summary_id: str):
    with Session(engine) as session:
        feedback = session.exec(select(Feedback).where(Feedback.summary_id == summary_id)).first()
        if not feedback:
            return {"message": "No feedback found for this summary."}
        return feedback
    