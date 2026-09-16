"""Pydantic-схемы для занятий."""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


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

    class Config:
        from_attributes = True


class SessionListResponse(BaseModel):
    sessions: list[SessionResponse]


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
