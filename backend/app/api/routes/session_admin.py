"""Защищённые операции расписания для администраторов."""
from datetime import datetime, timedelta
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.routes.auth import verify_admin
from app.core.database import get_db
from app.models.models import ClassSession
from app.schemas.session import RecurringSessionCreate, SessionCancel, SessionUpdate

router = APIRouter()


def _scope_sessions(db: Session, session: ClassSession, scope: str):
    if scope == "single" or not session.series_id:
        return [session]
    if scope != "future":
        raise HTTPException(status_code=400, detail="scope должен быть single или future")
    return db.query(ClassSession).filter(
        ClassSession.series_id == session.series_id,
        ClassSession.start_time >= session.start_time,
        ClassSession.is_active.is_(True),
    ).all()


def _get(db: Session, session_id: UUID) -> ClassSession:
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Занятие не найдено")
    return session


def _schedule_change_notification(session: ClassSession, event: str):
    from app.tasks.notifications import send_session_change_notifications
    delay = max(0, int((session.start_time - datetime.utcnow()).total_seconds()) - 7200)
    send_session_change_notifications.apply_async(args=[str(session.id), event], countdown=delay)


@router.post("/sessions/recurring")
def create_recurring(data: RecurringSessionCreate, db: Session = Depends(get_db), _=Depends(verify_admin)):
    if not data.weekdays or any(day not in range(7) for day in data.weekdays):
        raise HTTPException(status_code=400, detail="Укажите дни недели от 0 до 6")
    series_id = uuid4()
    hour, minute = (int(part) for part in data.start_time.split(":", 1))
    current = data.start_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
    created = []
    while current <= data.end_date:
        if current.weekday() in data.weekdays:
            created.append(ClassSession(
                class_type_id=data.class_type_id, trainer_id=data.trainer_id,
                start_time=current, end_time=current + timedelta(minutes=data.duration_minutes),
                description=data.description, series_id=series_id,
            ))
        current += timedelta(days=1)
    db.add_all(created)
    db.commit()
    return {"series_id": str(series_id), "created": len(created)}


@router.patch("/sessions/{session_id}")
def update_session(session_id: UUID, data: SessionUpdate, db: Session = Depends(get_db), _=Depends(verify_admin)):
    session = _get(db, session_id)
    changes = data.model_dump(exclude={"scope"}, exclude_unset=True)
    targets = _scope_sessions(db, session, data.scope)
    if data.scope not in {"single", "future"}:
        raise HTTPException(status_code=400, detail="scope должен быть single или future")
    for target in targets:
        for key, value in changes.items():
            setattr(target, key, value)
    db.commit()
    if any(key != "description" for key in changes):
        _schedule_change_notification(session, "Занятие изменено")
    return {"updated": len(targets)}


@router.post("/sessions/{session_id}/cancel")
def cancel_session(session_id: UUID, data: SessionCancel, db: Session = Depends(get_db), _=Depends(verify_admin)):
    session = _get(db, session_id)
    targets = _scope_sessions(db, session, data.scope)
    now = datetime.utcnow()
    for target in targets:
        target.is_cancelled = True
        target.cancelled_at = now
        target.cancellation_reason = data.reason
    db.commit()
    _schedule_change_notification(session, "Занятие отменено")
    return {"cancelled": len(targets)}


@router.delete("/sessions/{session_id}")
def delete_session(session_id: UUID, scope: str = "single", db: Session = Depends(get_db), _=Depends(verify_admin)):
    session = _get(db, session_id)
    targets = _scope_sessions(db, session, scope)
    for target in targets:
        target.is_active = False
    db.commit()
    return {"deleted": len(targets)}
