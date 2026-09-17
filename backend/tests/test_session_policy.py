from datetime import datetime, timedelta

from app.services.session_policy import apply_session_change, cancel_session, delete_session_scope


def test_cancel_keeps_session_and_marks_cancelled():
    session = {"is_active": True, "is_cancelled": False}
    result = cancel_session(session, "Тренер заболел")
    assert result["is_active"] is True
    assert result["is_cancelled"] is True
    assert result["cancellation_reason"] == "Тренер заболел"


def test_delete_future_scope_does_not_delete_previous_sessions():
    start = datetime(2026, 9, 21, 10)
    sessions = [
        {"start_time": start - timedelta(days=7)},
        {"start_time": start},
        {"start_time": start + timedelta(days=7)},
    ]
    assert delete_session_scope(sessions, start, "future") == sessions[:1]
    assert delete_session_scope(sessions, start, "single") == [sessions[0], sessions[2]]


def test_description_only_change_does_not_need_notification():
    assert apply_session_change({"description": "old"}, {"description": "new"}) == False
    assert apply_session_change({"description": "old"}, {"start_time": "new"}) == True
