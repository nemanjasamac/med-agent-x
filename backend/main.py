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
    print(f"Received file: {file.filename}")
    print(f"Patiend ID: {patient_id}")
    print(f"Notes: {notes}")

    return {
        "summary": "Patient is a 62-year-old with hypertension and diabetes, presenting chest pain.",
        "keywords": ["Hypertension", "Diabetes", "Chest Pain"],
    }