"""Webhook-эндпоинты для Telegram."""
from fastapi import APIRouter, Request
from app.core.config import settings

router = APIRouter()


@router.post("/telegram")
async def telegram_webhook(request: Request):
    """Обработка webhook от Telegram Bot."""
    data = await request.json()

    # Обработка команды /start
    if "message" in data:
        message = data["message"]
        chat_id = message["chat"]["id"]
        text = message.get("text", "")

        if text == "/start":
            # Здесь можно привязать telegram_id к клиенту
            return {
                "method": "sendMessage",
                "chat_id": chat_id,
                "text": "👋 Добро пожаловать в LIFE Studio!\n\nТеперь вы будете получать напоминания о тренировках."
            }

    return {"ok": True}
