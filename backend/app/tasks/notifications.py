"""Celery-задачи для отправки уведомлений."""
from datetime import datetime, timedelta
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "checklis",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.beat_schedule = {
    "send-reminders-every-15-min": {
        "task": "app.tasks.notifications.send_upcoming_reminders",
        "schedule": 900.0,  # Каждые 15 минут
    },
    "deactivate-expired-passes-daily": {
        "task": "app.tasks.notifications.deactivate_expired_passes",
        "schedule": 86400.0,  # Раз в сутки
    },
}


@celery_app.task(name="app.tasks.notifications.send_upcoming_reminders")
def send_upcoming_reminders():
    """Отправить напоминания за 2 часа до начала тренировки."""
    from app.core.database import SessionLocal
    from app.models.models import ClassSession, Booking, Client
    from sqlalchemy import and_

    db = SessionLocal()
    try:
        now = datetime.utcnow()
        reminder_window_start = now + timedelta(hours=1, minutes=45)
        reminder_window_end = now + timedelta(hours=2, minutes=15)

        # Находим занятия, которые начнутся через ~2 часа
        sessions = db.query(ClassSession).filter(
            and_(
                ClassSession.start_time >= reminder_window_start,
                ClassSession.start_time <= reminder_window_end,
                ClassSession.is_active == True
            )
        ).all()

        for session in sessions:
            bookings = db.query(Booking).filter(
                Booking.session_id == session.id,
                Booking.status_id == 1  # confirmed
            ).all()

            for booking in bookings:
                client = db.query(Client).filter(Client.id == booking.client_id).first()
                if not client or client.notification_preference == 'none':
                    continue

                message = (
                    f"🔔 Напоминание!\n\n"
                    f"{session.class_type.name} с {session.trainer.name}\n"
                    f"📅 {session.start_time.strftime('%d.%m.%Y в %H:%M')}\n\n"
                    f"Ждём вас в LIFE Studio!"
                )

                if client.notification_preference == 'telegram' and client.telegram_id:
                    send_telegram.delay(client.telegram_id, message)
                elif client.notification_preference == 'email' and client.email:
                    send_email.delay(client.email, "Напоминание о тренировке", message)

    finally:
        db.close()


@celery_app.task(name="app.tasks.notifications.send_telegram")
def send_telegram(chat_id: str, message: str):
    """Отправить сообщение через Telegram Bot API."""
    import httpx

    if not settings.telegram_bot_token:
        print(f"[Telegram] Нет токена. Сообщение для {chat_id}: {message}")
        return

    try:
        with httpx.Client() as client:
            response = client.post(
                f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": message,
                    "parse_mode": "HTML"
                },
                timeout=10
            )
            response.raise_for_status()
            print(f"[Telegram] Отправлено: {chat_id}")
    except Exception as e:
        print(f"[Telegram] Ошибка отправки {chat_id}: {e}")


@celery_app.task(name="app.tasks.notifications.send_email")
def send_email(to_email: str, subject: str, body: str):
    """Отправить email через SMTP."""
    import aiosmtplib
    from email.mime.text import MIMEText
    import asyncio

    if not settings.smtp_host:
        print(f"[Email] Нет SMTP. Сообщение для {to_email}: {body}")
        return

    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from
    msg["To"] = to_email

    async def _send():
        await aiosmtplib.send(
            msg,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user,
            password=settings.smtp_password,
            use_tls=True
        )

    try:
        asyncio.run(_send())
        print(f"[Email] Отправлено: {to_email}")
    except Exception as e:
        print(f"[Email] Ошибка отправки {to_email}: {e}")


@celery_app.task(name="app.tasks.notifications.deactivate_expired_passes")
def deactivate_expired_passes():
    """Деактивировать просроченные абонементы."""
    from app.core.database import SessionLocal
    from app.models.models import Pass
    from datetime import date

    db = SessionLocal()
    try:
        expired = db.query(Pass).filter(
            Pass.status == 'active',
            Pass.end_date < date.today()
        ).all()

        for pass_ in expired:
            pass_.status = 'expired'

        db.commit()
        print(f"[Passes] Деактивировано абонементов: {len(expired)}")
    finally:
        db.close()
