"""Аутентификация тренеров и управление настройками."""
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Cookie, Depends, Header, HTTPException, Response
from jose import JWTError, jwt
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.auth import AppSetting, TrainerCredential
from app.models.models import Trainer

router = APIRouter()


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 240_000)
    return f"pbkdf2_sha256$240000${salt.hex()}${digest.hex()}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, rounds, salt_hex, digest_hex = encoded.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256", password.encode(), bytes.fromhex(salt_hex), int(rounds)
        )
        return hmac.compare_digest(digest.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def create_token(credential: TrainerCredential) -> str:
    expires = datetime.now(timezone.utc) + timedelta(hours=12)
    return jwt.encode(
        {"sub": str(credential.id), "username": credential.username, "exp": expires},
        settings.secret_key,
        algorithm="HS256",
    )


def verify_admin(
    authorization: str | None = Header(None),
    admin_session: str | None = Cookie(None),
    db: Session = Depends(get_db),
) -> TrainerCredential:
    token = authorization[7:] if authorization and authorization.startswith("Bearer ") else admin_session
    if not token:
        raise HTTPException(status_code=401, detail="Требуется авторизация")
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        credential = db.query(TrainerCredential).filter(
            TrainerCredential.id == payload.get("sub"), TrainerCredential.is_active.is_(True)
        ).first()
    except (JWTError, ValueError):
        credential = None
    if not credential:
        raise HTTPException(status_code=401, detail="Недействительная авторизация")
    return credential


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=1, max_length=200)


class TrainerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(default="", max_length=1000)
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=8, max_length=200)


class NotificationSettings(BaseModel):
    telegram_bot_token: str = ""
    smtp_host: str = ""
    smtp_port: int = Field(default=465, ge=1, le=65535)
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""


@router.post("/login")
def login(data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    credential = db.query(TrainerCredential).filter(
        TrainerCredential.username == data.username, TrainerCredential.is_active.is_(True)
    ).first()
    if not credential or not verify_password(data.password, credential.password_hash):
        raise HTTPException(status_code=401, detail="Неверное имя тренера или пароль")
    response.set_cookie("admin_session", create_token(credential), httponly=True, samesite="lax", secure=False, max_age=43200)
    return {"username": credential.username}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("admin_session")
    return {"ok": True}


@router.get("/me")
def me(credential: TrainerCredential = Depends(verify_admin)):
    return {"username": credential.username}


@router.get("/trainers")
def list_trainers(_: TrainerCredential = Depends(verify_admin), db: Session = Depends(get_db)):
    credentials = {str(c.trainer_id): c.username for c in db.query(TrainerCredential).all()}
    trainers = db.query(Trainer).filter(Trainer.is_active.is_(True)).order_by(Trainer.name).all()
    return {"trainers": [
        {
            "id": str(t.id),
            "name": t.name,
            "description": t.description or "",
            "username": credentials.get(str(t.id), t.name),
        }
        for t in trainers
    ]}


@router.post("/trainers", status_code=201)
def create_trainer(data: TrainerCreate, _: TrainerCredential = Depends(verify_admin), db: Session = Depends(get_db)):
    if db.query(TrainerCredential).filter(TrainerCredential.username == data.username).first():
        raise HTTPException(status_code=409, detail="Такое имя пользователя уже существует")
    trainer = Trainer(name=data.name, description=data.description, is_active=True)
    db.add(trainer)
    db.flush()
    db.add(TrainerCredential(trainer_id=trainer.id, username=data.username, password_hash=hash_password(data.password)))
    db.commit()
    return {"id": str(trainer.id), "name": trainer.name, "username": data.username}


@router.delete("/trainers/{trainer_id}")
def delete_trainer(trainer_id: str, current: TrainerCredential = Depends(verify_admin), db: Session = Depends(get_db)):
    credential = db.query(TrainerCredential).filter(TrainerCredential.trainer_id == trainer_id).first()
    if not credential or credential.id == current.id:
        raise HTTPException(status_code=400, detail="Нельзя удалить текущего тренера или неизвестную учётную запись")
    trainer = db.query(Trainer).filter(Trainer.id == trainer_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Тренер не найден")
    trainer.is_active = False
    credential.is_active = False
    db.commit()
    return {"ok": True}


SETTING_KEYS = ("telegram_bot_token", "smtp_host", "smtp_port", "smtp_user", "smtp_password", "smtp_from")


@router.get("/settings/notifications")
def get_notification_settings(_: TrainerCredential = Depends(verify_admin), db: Session = Depends(get_db)):
    values = {row.key: row.value for row in db.query(AppSetting).filter(AppSetting.key.in_(SETTING_KEYS)).all()}
    return {
        "telegram_bot_token_configured": bool(values.get("telegram_bot_token")),
        "smtp_host": values.get("smtp_host", ""),
        "smtp_port": int(values.get("smtp_port", settings.smtp_port)),
        "smtp_user": values.get("smtp_user", ""),
        "smtp_password_configured": bool(values.get("smtp_password")),
        "smtp_from": values.get("smtp_from", ""),
    }


@router.put("/settings/notifications")
def update_notification_settings(
    data: NotificationSettings,
    _: TrainerCredential = Depends(verify_admin),
    db: Session = Depends(get_db),
):
    payload = data.model_dump()
    for key, value in payload.items():
        if key in ("telegram_bot_token", "smtp_password") and value == "":
            continue
        row = db.query(AppSetting).filter(AppSetting.key == key).first()
        if row:
            row.value = str(value)
        else:
            db.add(AppSetting(key=key, value=str(value)))
    db.commit()
    return {"ok": True}
