import re
import fitz
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import os
from openai import OpenAI
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from db import init_db, engine
from models import Summary
from sqlmodel import Session, select
from uuid import UUID

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
            max_tokens=300,
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
def get_summaries():
    with Session(engine) as session:
        summaries = session.exec(select(Summary).order_by(Summary.created_at.desc())).all()
        return summaries
    
@app.get("/summaries/{summary_id}")
def get_summary_by_id(summary_id: UUID):
    with Session(engine) as session:
        summary = session.get(Summary, summary_id)
        if not summary:
            raise HTTPException(status_code=404, detail="Summary not found")
        return summary