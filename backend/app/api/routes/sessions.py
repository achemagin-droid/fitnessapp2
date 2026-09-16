"""Эндпоинты для работы с расписанием."""
from datetime import date, datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Booking, ClassSession
from app.schemas.session import SessionListResponse, SessionResponse

router = APIRouter()


@router.get("/sessions", response_model=SessionListResponse)
async def get_sessions(
    date_from: date | None = Query(None, description="Начальная дата"),
    date_to: date | None = Query(None, description="Конечная дата"),
    db: Session = Depends(get_db)
):
    """Получить список занятий с фильтрацией по дате."""
    query = db.query(ClassSession).filter(ClassSession.is_active == True)

    if date_from:
        query = query.filter(ClassSession.start_time >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        query = query.filter(ClassSession.start_time <= datetime.combine(date_to, datetime.max.time()))

    sessions = query.order_by(ClassSession.start_time).all()

    # Подсчёт заполненности для каждого занятия
    result = []
    for session in sessions:
        occupancy = db.query(func.count(Booking.id)).filter(
            Booking.session_id == session.id,
            Booking.status_id.in_([1, 2])  # confirmed, waitlist
        ).scalar()

        result.append(SessionResponse(
            id=session.id,
            class_type_id=session.class_type_id,
            trainer_id=session.trainer_id,
            start_time=session.start_time,
            end_time=session.end_time,
            occupancy=occupancy,
            max_capacity=session.class_type.max_capacity,
            class_name=session.class_type.name,
            trainer_name=session.trainer.name,
        ))

    return SessionListResponse(sessions=result)


@router.get("/sessions/{session_id}")
async def get_session_detail(session_id: str, db: Session = Depends(get_db)):
    """Получить детали конкретного занятия."""
    session = db.query(ClassSession).filter(
        ClassSession.id == session_id,
        ClassSession.is_active == True
    ).first()

    if not session:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Занятие не найдено")

    occupancy = db.query(func.count(Booking.id)).filter(
        Booking.session_id == session_id,
        Booking.status_id.in_([1, 2])
    ).scalar()

    return {
        "id": session.id,
        "class_name": session.class_type.name,
        "class_description": session.class_type.description,
        "duration_minutes": session.class_type.duration_minutes,
        "trainer_name": session.trainer.name,
        "start_time": session.start_time,
        "end_time": session.end_time,
        "occupancy": occupancy,
        "max_capacity": session.class_type.max_capacity,
        "spots_left": session.class_type.max_capacity - occupancy,
        "color_code": session.class_type.color_code,
    }
