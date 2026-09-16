"""Эндпоинты для работы с записями."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.schemas.session import BookingCreate, BookingResponse
from app.services.booking_service import create_booking
from app.services.pass_service import get_active_pass
from app.models.models import Client, ClassSession

router = APIRouter()


@router.post("/bookings")
async def create_new_booking(data: BookingCreate, db: Session = Depends(get_db)):
    """Создать запись на занятие."""
    # Найти или создать клиента
    client = db.query(Client).filter(Client.phone == data.client_phone).first()

    if not client:
        client = Client(
            first_name=data.client_first_name,
            last_name=data.client_last_name or "",
            phone=data.client_phone,
            email=data.email,
            telegram_id=data.telegram_id,
            notification_preference=data.notification_preference,
        )
        db.add(client)
        db.flush()

    # Создать запись
    booking = create_booking(
        session_id=data.session_id,
        client_id=client.id,
        db=db
    )

    # Получить информацию о занятии
    session = db.query(ClassSession).filter(ClassSession.id == data.session_id).first()
    active_pass = get_active_pass(client.id, db)

    return {
        "booking_id": str(booking.id),
        "status": "confirmed",
        "session": {
            "class_name": session.class_type.name,
            "trainer": session.trainer.name,
            "start_time": session.start_time.isoformat(),
            "spots_left": session.class_type.max_capacity - 1,
        },
        "pass": {
            "remaining": active_pass.remaining_visits,
            "total": active_pass.total_visits,
        } if active_pass else None,
    }
