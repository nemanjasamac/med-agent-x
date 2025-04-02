from typing import Optional, Any
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Column, ForeignKey
import uuid
from uuid import UUID, uuid4
from passlib.hash import bcrypt

class Summary(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    patient_id: Optional[UUID] = Field(default=None, sa_column=Column(ForeignKey("patient.id", ondelete="CASCADE")))
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
    summary_id: uuid.UUID = Field(sa_column=Column(ForeignKey("summary.id", ondelete="CASCADE")))
    result: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DiagnosisHistory(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    summary_id: uuid.UUID = Field(sa_column=Column(ForeignKey("summary.id", ondelete="CASCADE")))
    result: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RecommendationHistory(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    summary_id: uuid.UUID = Field(sa_column=Column(ForeignKey("summary.id", ondelete="CASCADE")))
    result: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Doctor(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, nullable=False)
    username: str = Field(unique=True, index=True, nullable=False)
    email: str = Field(unique=True, index=True, nullable=False)
    hashed_password: str = Field(nullable=False)

    def set_password(self, password: str):
        self.hashed_password = bcrypt.hash(password)

    def verify_password(self, password: str) -> bool:
        return bcrypt.verify(password, self.hashed_password)
    
    @staticmethod
    def hash_password(password: str) -> str:
        return bcrypt.hash(password)