from datetime import date

from app.services.recurrence import recurring_dates


def test_recurring_dates_returns_selected_weekdays_in_range():
    dates = recurring_dates(date(2026, 9, 14), date(2026, 9, 27), [0, 2])

    assert dates == [date(2026, 9, 14), date(2026, 9, 16), date(2026, 9, 21), date(2026, 9, 23)]


def test_recurring_dates_rejects_empty_weekdays():
    assert recurring_dates(date(2026, 9, 14), date(2026, 9, 27), []) == []
