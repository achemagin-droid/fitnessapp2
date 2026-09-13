"""Сервис для работы с записями (защита от race conditions)."""
from uuid import UUID
from datetime import datetime
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.models.models import ClassSession, Booking, Client
from app.services.pass_service import get_active_pass


# ID статусов
STATUS_CONFIRMED = 1
STATUS_WAITLIST = 2
STATUS_CANCELLED_CLIENT = 3
STATUS_CANCELLED_ADMIN = 4
STATUS_COMPLETED = 5
STATUS_NO_SHOW = 6


def create_booking(
    session_id: UUID,
    client_id: UUID,
    db: Session
) -> Booking:
    """
    Создать запись на занятие с защитой от race conditions.
    Использует SELECT ... FOR UPDATE для блокировки строки.
    """
    with db.begin():
        # Блокируем строку занятия (FOR UPDATE)
        session = db.execute(
            select(ClassSession)
            .where(ClassSession.id == session_id)
            .with_for_update()
        ).scalar_one_or_none()

        if not session or not session.is_active:
            raise HTTPException(status_code=404, detail="Занятие не найдено")

        # Проверяем, не записан ли уже клиент
        existing = db.execute(
            select(Booking).where(
                Booking.client_id == client_id,
                Booking.session_id == session_id,
                Booking.status_id.in_([STATUS_CONFIRMED, STATUS_WAITLIST])
            )
        ).scalar_one_or_none()

        if existing:
            raise HTTPException(status_code=409, detail="Вы уже записаны на это занятие")

        # Считаем текущую заполненность
        occupancy = db.execute(
            select(func.count(Booking.id)).where(
                Booking.session_id == session_id,
                Booking.status_id.in_([STATUS_CONFIRMED, STATUS_WAITLIST])
            )
        ).scalar()

        if occupancy >= session.class_type.max_capacity:
            raise HTTPException(status_code=409, detail="Мест нет")

        # Создаём запись
        booking = Booking(
            client_id=client_id,
            session_id=session_id,
            status_id=STATUS_CONFIRMED,
            booked_at=datetime.utcnow()
        )
        db.add(booking)
        db.flush()

        return booking


def update_booking_status(
    booking_id: UUID,
    new_status: str,
    db: Session
) -> Booking:
    """Обновить статус записи. При completed/no_show — списать абонемент."""
    status_map = {
        'confirmed': STATUS_CONFIRMED,
        'waitlist': STATUS_WAITLIST,
        'cancelled_client': STATUS_CANCELLED_CLIENT,
        'cancelled_admin': STATUS_CANCELLED_ADMIN,
        'completed': STATUS_COMPLETED,
        'no_show': STATUS_NO_SHOW,
    }

    status_id = status_map.get(new_status)
    if not status_id:
        raise HTTPException(status_code=400, detail=f"Неизвестный статус: {new_status}")

    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Запись не найдена")

    booking.status_id = status_id

    if new_status in ('cancelled_client', 'cancelled_admin'):
        booking.cancelled_at = datetime.utcnow()

    # Списание абонемента при completed или no_show
    if new_status in ('completed', 'no_show'):
        from app.services.pass_service import deduct_visit
        deduct_visit(booking.client_id, db)

    db.commit()
    db.refresh(booking)
    return booking
