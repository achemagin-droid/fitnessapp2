"""
CheckLis Booking — FastAPI Application
Точка входа backend-сервиса.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.dialects.postgresql import insert

from app.api.routes.auth import hash_password
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
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
from app.api.routes import admin, auth, bookings, clients, sessions, webhooks

app.include_router(sessions.router, prefix="/api", tags=["Sessions"])
app.include_router(bookings.router, prefix="/api", tags=["Bookings"])
app.include_router(clients.router, prefix="/api", tags=["Clients"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(webhooks.router, prefix="/api/webhook", tags=["Webhooks"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}


@app.on_event("startup")
def initialize_auth_tables():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
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
