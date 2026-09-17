"""Бизнес-правила изменения занятий."""
from datetime import datetime
from typing import Any


def cancel_session(session: dict[str, Any], reason: str | None = None) -> dict[str, Any]:
    updated = dict(session)
    updated["is_cancelled"] = True
    updated["cancelled_at"] = datetime.utcnow()
    updated["cancellation_reason"] = reason
    return updated


def delete_session_scope(sessions: list[dict[str, Any]], start_time: datetime, scope: str) -> list[dict[str, Any]]:
    if scope == "single":
        return [item for item in sessions if item["start_time"] != start_time]
    if scope == "future":
        return [item for item in sessions if item["start_time"] < start_time]
    raise ValueError("scope must be single or future")


def apply_session_change(old: dict[str, Any], changes: dict[str, Any]) -> bool:
    return any(key != "description" and old.get(key) != value for key, value in changes.items())
