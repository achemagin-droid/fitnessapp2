"""Pydantic-схемы для занятий."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class SessionResponse(BaseModel):
    id: UUID
    class_type_id: UUID
    trainer_id: UUID
    start_time: datetime
    end_time: datetime
    occupancy: int
    max_capacity: int
    class_name: str
    trainer_name: str
    description: str | None = None
    series_id: UUID | None = None
    is_cancelled: bool = False
    cancellation_reason: str | None = None

    class Config:
        from_attributes = True


class SessionListResponse(BaseModel):
    sessions: list[SessionResponse]


class SessionUpdate(BaseModel):
    start_time: datetime | None = None
    end_time: datetime | None = None
    description: str | None = Field(None, max_length=1000)
    trainer_id: UUID | None = None
    scope: str = "single"


class SessionCancel(BaseModel):
    reason: str | None = Field(None, max_length=1000)
    scope: str = "single"


class RecurringSessionCreate(BaseModel):
    class_type_id: UUID
    trainer_id: UUID
    start_date: datetime
    end_date: datetime
    start_time: str
    duration_minutes: int
    weekdays: list[int]
    description: str | None = Field(None, max_length=1000)


class BookingCreate(BaseModel):
    client_phone: str
    client_first_name: str
    client_last_name: str | None = None
    session_id: UUID
    notification_preference: str = "none"
    telegram_id: str | None = None
    email: str | None = None


class BookingResponse(BaseModel):
    booking_id: UUID
    status: str
    session: dict
    pass_info: dict | None = None
