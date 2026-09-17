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


def notification_config(db):
    """Берёт настройки из БД, сохраняя fallback на переменные окружения."""
    from app.models.auth import AppSetting

    values = {row.key: row.value for row in db.query(AppSetting).all()}
    return {
        "telegram_bot_token": values.get("telegram_bot_token") or settings.telegram_bot_token,
        "smtp_host": values.get("smtp_host") or settings.smtp_host,
        "smtp_port": int(values.get("smtp_port") or settings.smtp_port),
        "smtp_user": values.get("smtp_user") or settings.smtp_user,
        "smtp_password": values.get("smtp_password") or settings.smtp_password,
        "smtp_from": values.get("smtp_from") or settings.smtp_from,
    }


@celery_app.task(name="app.tasks.notifications.send_upcoming_reminders")
def send_upcoming_reminders():
    """Отправить напоминания за 2 часа до начала тренировки."""
    from sqlalchemy import and_

    from app.core.database import SessionLocal
    from app.models.models import Booking, ClassSession, Client

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

    from app.core.database import SessionLocal

    db = SessionLocal()
    config = notification_config(db)
    db.close()
    if not config["telegram_bot_token"]:
        print(f"[Telegram] Нет токена. Сообщение для {chat_id}: {message}")
        return

    try:
        with httpx.Client() as client:
            response = client.post(
                f"https://api.telegram.org/bot{config['telegram_bot_token']}/sendMessage",
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
    import asyncio
    from email.mime.text import MIMEText

    import aiosmtplib

    from app.core.database import SessionLocal

    db = SessionLocal()
    config = notification_config(db)
    db.close()
    if not config["smtp_host"]:
        print(f"[Email] Нет SMTP. Сообщение для {to_email}: {body}")
        return

    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = config["smtp_from"]
    msg["To"] = to_email

    async def _send():
        await aiosmtplib.send(
            msg,
            hostname=config["smtp_host"],
            port=config["smtp_port"],
            username=config["smtp_user"],
            password=config["smtp_password"],
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
    from datetime import date

    from app.core.database import SessionLocal
    from app.models.models import Pass

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
