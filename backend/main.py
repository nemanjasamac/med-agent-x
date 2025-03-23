import re
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    try:
        decoded = contents.decode("utf-8")
    except UnicodeDecodeError:
        return {"error": "Unable to read file - must be a text file for now."}
    
    print(f"File contents: {decoded}")

    summary = decoded[:200] + "..." if len(decoded) > 200 else decoded

    keywords_list = ["diabetes", "hypertension", "chest pain", "shortness of breath", "headache", "fever"]
    found_keywords = []

    for kw in keywords_list:
        if re.search(rf"\b{re.escape(kw)}\b", decoded, re.IGNORECASE):
            found_keywords.append(kw.capitalize())

    if not found_keywords:
        found_keywords = ["No key medical terms found."]

    return {
        "summary": summary.strip(),
        "keywords": found_keywords,
    }