"""
Seed-скрипт для заполнения начальных данных.
Запуск: python -m app.seed
"""
from app.core.database import Base, SessionLocal, engine
from app.models.models import BookingStatus, ClassType, Trainer


def seed():
    """Заполнить БД начальными данными."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Статусы записей
    statuses = [
        (1, "confirmed"),
        (2, "waitlist"),
        (3, "cancelled_client"),
        (4, "cancelled_admin"),
        (5, "completed"),
        (6, "no_show"),
    ]
    for id_, name in statuses:
        existing = db.query(BookingStatus).filter(BookingStatus.id == id_).first()
        if not existing:
            db.add(BookingStatus(id=id_, name=name))

    # Тренеры
    trainers_data = [
        ("Марта", "Йога, Пилатес, Растяжка"),
        ("Алексей", "Силовые тренировки, Кроссфит"),
        ("Елена", "Танцы, Zumba, Stretching"),
    ]
    trainers = {}
    for name, desc in trainers_data:
        existing = db.query(Trainer).filter(Trainer.name == name).first()
        if not existing:
            t = Trainer(name=name, description=desc, is_active=True)
            db.add(t)
            db.flush()
            trainers[name] = t.id
        else:
            trainers[name] = existing.id

    # Типы занятий
    class_types_data = [
        ("Йога", "Хатха-йога для всех уровней", 60, 12, "#10B981"),
        ("Пилатес", "Укрепление мышечного корсета", 55, 10, "#8B5CF6"),
        ("Силовая", "Тренировка с весом", 60, 8, "#F59E0B"),
        ("Растяжка", "Гибкость и мобильность", 45, 15, "#EC4899"),
        ("Zumba", "Танцевальный фитнес", 60, 20, "#3B82F6"),
        ("Кроссфит", "Функциональный тренинг", 60, 8, "#EF4444"),
    ]
    for name, desc, duration, capacity, color in class_types_data:
        existing = db.query(ClassType).filter(ClassType.name == name).first()
        if not existing:
            db.add(ClassType(
                name=name, description=desc,
                duration_minutes=duration, max_capacity=capacity,
                color_code=color, is_mock=True
            ))

    db.commit()
    db.close()
    print("✅ База данных заполнена начальными данными")


if __name__ == "__main__":
    seed()
