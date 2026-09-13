"""
CheckLis Booking — FastAPI Application
Точка входа backend-сервиса.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

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
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Роутеры
from app.api.routes import sessions, bookings, clients, admin, webhooks

app.include_router(sessions.router, prefix="/api", tags=["Sessions"])
app.include_router(bookings.router, prefix="/api", tags=["Bookings"])
app.include_router(clients.router, prefix="/api", tags=["Clients"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(webhooks.router, prefix="/api/webhook", tags=["Webhooks"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}
