from typing import Optional, Any
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Column
import uuid

class Summary(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    patient_id: Optional[str] = None
    file_name: Optional[str] = None
    raw_text: Optional[str] = None
    summary: Optional[str] = None
    keywords: Optional[Any] = Field(default=None, sa_column=Column(JSONB))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
