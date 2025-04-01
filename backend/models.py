from typing import Optional, Any
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Column
import uuid
from uuid import UUID, uuid4

class Summary(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    patient_id: Optional[UUID] = Field(default=None, foreign_key="patient.id")
    file_name: Optional[str] = None
    raw_text: Optional[str] = None
    summary: Optional[str] = None
    keywords: Optional[Any] = Field(default=None, sa_column=Column(JSONB))
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Patient(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    contact: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Feedback(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    summary_id: UUID
    helpful: bool
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Diagnosis(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    summary_id: uuid.UUID = Field(foreign_key="summary.id")
    result: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DiagnosisHistory(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    summary_id: uuid.UUID = Field(foreign_key="summary.id")
    result: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RecommendationHistory(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    summary_id: uuid.UUID = Field(foreign_key="summary.id")
    result: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
