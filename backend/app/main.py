"""
CheckLis Booking - Backend API
LIFE Fitness Studio
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title="CheckLis Booking API",
    description="Система онлайн-записи для фитнес-студии LIFE",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "CheckLis Booking API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Import and include routers here
# from app.api import routers
# app.include_router(routers.router)
