"""Pydantic-схемы для занятий."""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from uuid import UUID


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
    sessions: List[SessionResponse]


class BookingCreate(BaseModel):
    client_phone: str
    client_first_name: str
    client_last_name: Optional[str] = None
    session_id: UUID
    notification_preference: str = "none"
    telegram_id: Optional[str] = None
    email: Optional[str] = None


class BookingResponse(BaseModel):
    booking_id: UUID
    status: str
    session: dict
    pass_info: Optional[dict] = None
