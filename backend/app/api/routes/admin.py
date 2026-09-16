"""Админские эндпоинты."""
from datetime import datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.models import Booking, ClassSession, Client
from app.services.booking_service import update_booking_status
from app.services.pass_service import create_pass

router = APIRouter()


def verify_admin(authorization: str = Header(None)):
    """Проверка админского токена."""
    if not authorization or authorization != f"Bearer {settings.admin_password}":
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.get("/sessions/week")
async def get_week_schedule(
    week_offset: int = 0,
    db: Session = Depends(get_db),
    _=Depends(verify_admin)
):
    """Расписание на неделю с заполненностью."""
    now = datetime.utcnow()
    start = now - timedelta(days=now.weekday()) + timedelta(weeks=week_offset)
    end = start + timedelta(days=7)

    sessions = db.query(ClassSession).filter(
        ClassSession.start_time >= start,
        ClassSession.start_time < end,
        ClassSession.is_active == True
    ).order_by(ClassSession.start_time).all()

    result = []
    for session in sessions:
        occupancy = db.query(func.count(Booking.id)).filter(
            Booking.session_id == session.id,
            Booking.status_id.in_([1, 2])
        ).scalar()

        result.append({
            "id": str(session.id),
            "class_name": session.class_type.name,
            "color_code": session.class_type.color_code,
            "trainer": session.trainer.name,
            "start_time": session.start_time.isoformat(),
            "end_time": session.end_time.isoformat(),
            "occupancy": occupancy,
            "max_capacity": session.class_type.max_capacity,
        })

    return {"sessions": result}


@router.get("/sessions/{session_id}/bookings")
async def get_session_bookings(
    session_id: str,
    db: Session = Depends(get_db),
    _=Depends(verify_admin)
):
    """Список записей на занятие."""
    bookings = db.query(Booking).filter(
        Booking.session_id == session_id,
        Booking.status_id.in_([1, 2, 5, 6])  # confirmed, waitlist, completed, no_show
    ).all()

    result = []
    for booking in bookings:
        client = db.query(Client).filter(Client.id == booking.client_id).first()
        status_names = {1: "confirmed", 2: "waitlist", 3: "cancelled_client",
                       4: "cancelled_admin", 5: "completed", 6: "no_show"}
        result.append({
            "id": str(booking.id),
            "client": {
                "id": str(client.id),
                "first_name": client.first_name,
                "last_name": client.last_name,
                "phone": client.phone,
            },
            "status": status_names.get(booking.status_id, "unknown"),
            "booked_at": booking.booked_at.isoformat(),
        })

    return {"bookings": result}


@router.put("/bookings/{booking_id}/checkin")
async def checkin_booking(
    booking_id: str,
    status: str,
    db: Session = Depends(get_db),
    _=Depends(verify_admin)
):
    """Отметить статус записи (пришёл/отменил/no-show)."""
    booking = update_booking_status(UUID(booking_id), status, db)
    return {"booking_id": str(booking.id), "status": status}


@router.post("/walkin")
async def add_walkin(
    session_id: str,
    name: str,
    phone: str,
    db: Session = Depends(get_db),
    _=Depends(verify_admin)
):
    """Добавить walk-in клиента."""
    client = db.query(Client).filter(Client.phone == phone).first()
    if not client:
        name_parts = name.split(" ", 1)
        client = Client(
            first_name=name_parts[0],
            last_name=name_parts[1] if len(name_parts) > 1 else "",
            phone=phone,
            notification_preference="none",
        )
        db.add(client)
        db.flush()

    booking = Booking(
        client_id=client.id,
        session_id=session_id,
        status_id=5,  # completed сразу
        booked_at=datetime.utcnow(),
    )
    db.add(booking)
    db.commit()

    return {"booking_id": str(booking.id), "status": "completed"}


@router.get("/clients")
async def search_clients(
    phone: str | None = None,
    db: Session = Depends(get_db),
    _=Depends(verify_admin)
):
    """Поиск клиентов."""
    query = db.query(Client)
    if phone:
        query = query.filter(Client.phone.ilike(f"%{phone}%"))
    clients = query.limit(20).all()

    return {
        "clients": [
            {
                "id": str(c.id),
                "first_name": c.first_name,
                "last_name": c.last_name,
                "phone": c.phone,
            }
            for c in clients
        ]
    }


@router.post("/passes")
async def create_new_pass(
    client_id: str,
    total_visits: int,
    valid_days: int = 30,
    db: Session = Depends(get_db),
    _=Depends(verify_admin)
):
    """Выпустить новый абонемент."""
    pass_ = create_pass(UUID(client_id), total_visits, valid_days, db)
    return {
        "id": str(pass_.id),
        "total_visits": pass_.total_visits,
        "remaining_visits": pass_.remaining_visits,
        "start_date": pass_.start_date.isoformat(),
        "end_date": pass_.end_date.isoformat(),
    }
