"""
CheckLis Booking — FastAPI Application
Точка входа backend-сервиса.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import insert

from app.api.routes.auth import hash_password
from app.core.config import settings
from app.core.database import SessionLocal, engine
from app.models.auth import TrainerCredential
from app.models.models import Trainer

app = FastAPI(
    title="CheckLis Booking API",
    description="Система онлайн-записи для LIFE Fitness Studio",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Роутеры
from app.api.routes import admin, auth, bookings, clients, session_admin, sessions, webhooks

app.include_router(sessions.router, prefix="/api", tags=["Sessions"])
app.include_router(session_admin.router, prefix="/api/admin", tags=["Admin sessions"])
app.include_router(bookings.router, prefix="/api", tags=["Bookings"])
app.include_router(clients.router, prefix="/api", tags=["Clients"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(webhooks.router, prefix="/api/webhook", tags=["Webhooks"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}


def initialize_auth_schema():
    """Создаёт auth-таблицы один раз, безопасно для нескольких workers."""
    with engine.begin() as connection:
        connection.execute(text("SELECT pg_advisory_xact_lock(4815162342)"))
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS trainer_credentials (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                trainer_id UUID NOT NULL UNIQUE,
                username VARCHAR(100) NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                is_active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """))
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS app_settings (
                key VARCHAR(100) PRIMARY KEY,
                value TEXT NOT NULL DEFAULT '',
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        """))
        for statement in (
            "ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS description TEXT",
            "ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS series_id UUID",
            "ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN NOT NULL DEFAULT FALSE",
            "ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ",
            "ALTER TABLE class_sessions ADD COLUMN IF NOT EXISTS cancellation_reason TEXT",
        ):
            connection.execute(text(statement))


@app.on_event("startup")
def initialize_auth_tables():
    initialize_auth_schema()
    db = SessionLocal()
    try:
        if settings.admin_password:
            trainers = db.query(Trainer).filter(Trainer.is_active.is_(True)).all()
            for trainer in trainers:
                db.execute(insert(TrainerCredential).values(
                    trainer_id=trainer.id,
                    username=trainer.name,
                    password_hash=hash_password(settings.admin_password),
                ).on_conflict_do_nothing(index_elements=["trainer_id"]))
            db.commit()
    finally:
        db.close()
