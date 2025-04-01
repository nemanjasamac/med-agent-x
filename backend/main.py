import re
import fitz
import os
import io
from datetime import datetime, timezone
from io import BytesIO
from fpdf import FPDF
from sqlalchemy.orm import Session
from fastapi import Body, FastAPI, File, UploadFile, Form, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from openai import OpenAI
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from db import init_db, engine
from models import Summary, Feedback, Diagnosis, DiagnosisHistory, RecommendationHistory, Patient #MODELS
from sqlmodel import Session, select, delete
from uuid import UUID, uuid4
from pydantic import BaseModel
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from textwrap import wrap
from fastapi.responses import StreamingResponse
from sqlalchemy import cast, func, text, String
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
    patient_id: Optional[str] = Form(...),
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
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
):
    with Session(engine) as session:
        query = select(Summary)

        if file_name:
            query = query.where(func.lower(Summary.file_name).ilike(f"%{file_name.lower()}%"))

        if patient_id:
            query = query.where(cast(Summary.patient_id, String).ilike(f"%{patient_id.lower()}%"))

        if keyword:
            query = query.where(
                text("""
                    EXISTS (
                        SELECT 1 FROM jsonb_array_elements_text(summary.keywords) AS kw
                        WHERE LOWER(kw) LIKE :kw
                    )
                """)
    ).params(kw=f"%{keyword.lower()}%")

        query = query.order_by(Summary.created_at.desc())

        total_count = session.exec(select(func.count()).select_from(query.subquery())).one()
        summaries = session.exec(query.offset((page - 1) * per_page).limit(per_page)).all()

        return {
            "total": total_count,
            "page": page,
            "per_page": per_page,
            "summaries": [s.dict() for s in summaries]
        }
    
@app.get("/summaries/{summary_id}")
def get_summary_by_id(summary_id: UUID):
    with Session(engine) as session:
        summary = session.get(Summary, summary_id)
        if not summary:
            raise HTTPException(status_code=404, detail="Summary not found")
        return summary

####### PDF and TXT Export #######

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

        pdf = FPDF()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=15)

        pdf.set_font("Arial", "B", 16)
        pdf.cell(0, 10, "MedAgentX - Patient Case Report", ln=True, align="C")
        pdf.ln(10)

        pdf.set_font("Arial", "B", 12)
        pdf.cell(0, 8, f"Patient ID: {summary.patient_id}", ln=True)
        pdf.cell(0, 8, f"File Name: {summary.file_name}", ln=True)
        pdf.cell(0, 8, f"Date: {summary.created_at.strftime('%Y-%m-%d')}", ln=True)
        pdf.ln(5)

        pdf.set_font("Arial", "B", 12)
        pdf.cell(0, 8, "Keywords:", ln=True)
        pdf.set_font("Arial", "", 12)
        pdf.multi_cell(0, 8, ', '.join(summary.keywords) if summary.keywords else "N/A")
        pdf.ln(5)

        pdf.set_font("Arial", "B", 12)
        pdf.cell(0, 8, "Summary:", ln=True)
        pdf.set_font("Arial", "", 12)
        pdf.multi_cell(0, 8, summary.summary if summary.summary else "N/A")
        pdf.ln(5)

        pdf.set_font("Arial", "B", 12)
        pdf.cell(0, 8, "Diagnosis:", ln=True)
        pdf.set_font("Arial", "", 12)
        pdf.multi_cell(0, 8, diagnosis.result if diagnosis else "N/A")

        pdf_output = pdf.output(dest='S').encode('latin1')
        buffer = BytesIO(pdf_output)
        buffer.seek(0)

        return StreamingResponse(buffer, media_type="application/pdf", headers={
            "Content-Disposition": f"attachment; filename={summary.file_name.replace('.txt','')}_report.pdf"
        })
    
@app.get("/export-txt/{summary_id}")
def export_txt(summary_id: str):
    with Session(engine) as session:
        summary = session.get(Summary, UUID(summary_id))
        if not summary:
            raise HTTPException(status_code=404, detail="Summary not found")

        diagnosis = session.exec(select(Diagnosis).where(Diagnosis.summary_id == UUID(summary_id))).first()

        content = f"""Patient ID: {summary.patient_id}
File Name: {summary.file_name}
Uploaded: {summary.created_at.strftime('%Y-%m-%d')}
        
Summary:
{summary.summary}

Notes:
{summary.notes or 'N/A'}

Diagnosis:
{diagnosis.result if diagnosis else 'Diagnosis not available'}
"""

        return Response(content, media_type="text/plain", headers={
            "Content-Disposition": f"attachment; filename={summary.file_name.replace('.txt', '')}_report.txt"
        })



####### Diagnosis API #######

@app.post("/diagnose")
async def run_diagnosis(data: DiagnosisRequest):
    prompt = f"""
You are a clinical assistant. Based on the following patient summary, suggest potential diagnoses and next steps a doctor should consider:

Patient Summary:
{data.summary}

Respond with a clear, clinical-style explanation.
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
        diagnosis_text = response.choices[0].message.content
    except Exception as e:
        print("Diagnosis agent error: ", e)
        diagnosis_text = "Unable to generate diagnosis due to an error."

    with Session(engine) as session:
        summary_id = UUID(data.summary_id)
        summary = session.get(Summary, summary_id)

        if not summary:
            raise HTTPException(status_code=404, detail="Summary not found")

        history = DiagnosisHistory(
            summary_id=summary_id,
            result=diagnosis_text
        )
        session.add(history)

        diagnosis = session.exec(
            select(Diagnosis).where(Diagnosis.summary_id == summary_id)
        ).first()

        if diagnosis:
            diagnosis.result = diagnosis_text
            diagnosis.created_at = datetime.now(timezone.utc)
        else:
            diagnosis = Diagnosis(
                id=uuid4(),
                summary_id=summary_id,
                result=diagnosis_text,
                created_at=datetime.now(timezone.utc)
            )
            session.add(diagnosis)

        session.commit()

    return {"diagnosis": diagnosis_text}

@app.get("/diagnoses/{summary_id}")
def get_diagnoses(summary_id: str):
    with Session(engine) as session:
        diagnoses = session.exec(
            select(DiagnosisHistory)
            .where(DiagnosisHistory.summary_id == UUID(summary_id))
            .order_by(DiagnosisHistory.created_at.desc())
        ).all()

        return [
            {
                "id": str(d.id),
                "result": d.result,
                "created_at": d.created_at.isoformat(),
            } for d in diagnoses
        ]

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
    

####### Dashboard #######

@app.get('/dashboard-stats')
def get_dashboard_stats():
    with Session(engine) as session:
        total_summaries = len(session.exec(select(Summary)).all())
        total_diagnoses = len(session.exec(select(Diagnosis)).all())
        total_feedbacks = len(session.exec(select(Feedback)).all())
        # avg_feedback = session.exec(select(func.avg(Feedback.helpful))).first()

        return {
            "total_summaries": total_summaries,
            "total_diagnoses": total_diagnoses,
            "total_feedbacks": total_feedbacks,
            # "average_feedback": round(avg_feedback[0], 2) if avg_feedback[0] else "N/A",
        }
    
@app.get("/recent-summaries")
def get_recent_summaries():
    with Session(engine) as session:
        summaries = session.exec(
            select(Summary).order_by(Summary.created_at.desc()).limit(5)
        ).all()
        return summaries

class RecommendationRequest(BaseModel):
    summary_id: str
    summary: str
    diagnosis: str

@app.post("/recommendations")
def generate_recommendations(data: RecommendationRequest):
    prompt = f"""
    You are a helpful and professional medical assistant. Based on the following patient summary and diagnosis, suggest clear and concise medical recommendations for the doctor.

    Patient Summary:
    {data.summary}

    Diagnosis:
    {data.diagnosis}

    Recommendations:
    """
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500,
        temperature=0.3
    )
    recommendations_text = response.choices[0].message.content.strip()

    with Session(engine) as session:
        history = RecommendationHistory(
            summary_id=UUID(data.summary_id),
            result=recommendations_text,
        )
        session.add(history)
        session.commit()

    return {"recommendations": recommendations_text}

@app.get("/recommendations/{summary_id}")
def get_recommendations(summary_id: str):
    with Session(engine) as session:
        recommendations = session.exec(
            select(RecommendationHistory)
            .where(RecommendationHistory.summary_id == UUID(summary_id))
            .order_by(RecommendationHistory.created_at.desc())
        ).all()

        return [
            {
                "id": str(r.id),
                "result": r.result,
                "created_at": r.created_at.isoformat(),
            } for r in recommendations
        ]
    
########## Patient API #######

@app.post("/patients", response_model=Patient)
def create_patient(patient: Patient):
    with Session(engine) as session:
        session.add(patient)
        session.commit()
        session.refresh(patient)
        return patient

@app.get("/patients", response_model=List[Patient])
def get_patients():
    with Session(engine) as session:
        patients = session.exec(select(Patient)).all()
        return patients

@app.get("/patients/{patient_id}", response_model=Patient)
def get_patient(patient_id: UUID):
    with Session(engine) as session:
        patient = session.get(Patient, patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        return patient

@app.put("/patients/{patient_id}", response_model=Patient)
def update_patient(patient_id: UUID, updated_patient: Patient):
    with Session(engine) as session:
        patient = session.get(Patient, patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        patient.name = updated_patient.name
        patient.gender = updated_patient.gender
        patient.age = updated_patient.age
        patient.contact = updated_patient.contact

        session.commit()
        session.refresh(patient)
        return patient

@app.delete("/patients/{patient_id}", status_code=204)
def delete_patient(patient_id: str):
    with Session(engine) as session:
        patient = session.get(Patient, patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        summaries = session.exec(select(Summary).where(Summary.patient_id == patient_id)).all()
        for summary in summaries:
            session.exec(
                delete(Diagnosis).where(Diagnosis.summary_id == summary.id)
            )
            session.exec(
                delete(DiagnosisHistory).where(DiagnosisHistory.summary_id == summary.id)
            )
            session.exec(
                delete(RecommendationHistory).where(RecommendationHistory.summary_id == summary.id)
            )
            session.delete(summary)

        session.delete(patient)
        session.commit()

    return {"message": "Patient and related summaries deleted successfully."}

