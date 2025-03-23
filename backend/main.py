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
    fake_summary = decoded[:150] + "..." if len(decoded) > 150 else decoded
    fake_keywords = ["Keyword A", "Keyword B", "Keyword C"]

    return {
        "summary": fake_summary.strip(),
        "keywords": fake_keywords,
    }