import re
import fitz
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import io
import os
from openai import OpenAI
from dotenv import load_dotenv

app = FastAPI()

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
            return {"error": "Unsupported file type. Please upload a .txt of .pdf file."}    

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            temperature=0.4,
            max_tokens=300,
            messages=[
                {"role": "system", "content": "You are a medial AI assistant that summarizes patient records into concise summaries for doctors."},
                {"role": "user", "content": f"Please summarize the following patient notes: \n\n{file_text[:2000]}"}
            ]
        )
        summary = response.choices[0].message.content
    except Exception as e:
        print("OpenAI API error:", e)
        summary = "Error: Failed to generate summary from AI Agent"

    keywords_list = ["diabetes", "hypertension", "chest pain", "shortness of breath", "headache", "fever"]
    found_keywords = [
        kw.capitalize()
        for kw in keywords_list
        if re.search(rf"\b{re.escape(kw)}\b", file_text, re.IGNORECASE)
    ]
    if not found_keywords:
        found_keywords = ["No key medical terms found."]

    return {
        "summary": summary.strip(),
        "keywords": found_keywords,
    }