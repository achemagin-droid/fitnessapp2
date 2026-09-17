"""Утилиты для расчёта дат повторяющихся занятий."""
from datetime import date, timedelta


def recurring_dates(start: date, end: date, weekdays: list[int]) -> list[date]:
    """Возвращает даты в диапазоне для дней недели ISO 0=понедельник...6=воскресенье."""
    selected = set(weekdays)
    if not selected:
        return []
    result = []
    current = start
    while current <= end:
        if current.weekday() in selected:
            result.append(current)
        current += timedelta(days=1)
    return result
