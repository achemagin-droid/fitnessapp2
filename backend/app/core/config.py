"""Конфигурация приложения из переменных окружения."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "checklis"
    postgres_user: str = "checklis_user"
    postgres_password: str = ""

    @property
    def database_url(self) -> str:
        return f"postgresql://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"

    @property
    def async_database_url(self) -> str:
        return f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"

    # App
    secret_key: str = ""
    # Comma-separated to support Docker Compose environment variables.
    cors_origins: str = "http://localhost,http://localhost:3000,http://localhost:5173"
    admin_password: str = ""

    # Telegram
    telegram_bot_token: str = ""
    telegram_webhook_url: str = ""

    # SMTP
    smtp_host: str = ""
    smtp_port: int = 465
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
