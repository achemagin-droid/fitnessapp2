"""Эндпоинты для работы с клиентами."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Client
from app.services.pass_service import get_active_pass

router = APIRouter()


@router.get("/clients/lookup")
async def lookup_client(
    phone: str = Query(..., description="Телефон клиента"),
    db: Session = Depends(get_db)
):
    """Поиск клиента по телефону (для автозаполнения виджета)."""
    client = db.query(Client).filter(Client.phone == phone).first()

    if not client:
        return {"found": False}

    active_pass = get_active_pass(client.id, db)

    return {
        "found": True,
        "client": {
            "id": str(client.id),
            "first_name": client.first_name,
            "last_name": client.last_name,
            "phone": client.phone,
            "email": client.email,
            "telegram_id": client.telegram_id,
            "notification_preference": client.notification_preference,
        },
        "pass": {
            "remaining": active_pass.remaining_visits,
            "total": active_pass.total_visits,
            "end_date": active_pass.end_date.isoformat(),
        } if active_pass else None,
    }
