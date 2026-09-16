"""Сервис для работы с абонементами (FIFO-списание)."""
from datetime import date
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.models import Pass


def get_active_pass(client_id: UUID, db: Session) -> Pass | None:
    """Получить самый старый активный абонемент клиента (FIFO)."""
    result = db.execute(
        select(Pass).where(
            Pass.client_id == client_id,
            Pass.status == 'active',
            Pass.remaining_visits > 0,
            Pass.end_date >= date.today()
        ).order_by(Pass.start_date.asc())
    )
    return result.scalar_one_or_none()


def deduct_visit(client_id: UUID, db: Session) -> bool:
    """
    Списать 1 посещение с самого старого активного абонемента (FIFO).
    Возвращает True если списание прошло успешно.
    """
    pass_ = get_active_pass(client_id, db)

    if not pass_:
        return False  # Нет активного абонемента → оплата на месте

    pass_.remaining_visits -= 1

    if pass_.remaining_visits == 0:
        pass_.status = 'exhausted'

    db.commit()
    return True


def create_pass(
    client_id: UUID,
    total_visits: int,
    valid_days: int,
    db: Session
) -> Pass:
    """Создать новый абонемент для клиента."""
    from datetime import timedelta

    new_pass = Pass(
        client_id=client_id,
        total_visits=total_visits,
        remaining_visits=total_visits,
        start_date=date.today(),
        end_date=date.today() + timedelta(days=valid_days),
        status='active'
    )

    db.add(new_pass)
    db.commit()
    db.refresh(new_pass)
    return new_pass
