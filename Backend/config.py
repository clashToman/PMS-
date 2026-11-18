
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    APP_NAME: str = "PMS API"

    DATABASE_URL: str

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Frontend URLs: local development and Render deployment
    FRONTEND_URL: str = "https://pms-frontend-wx2l.onrender.com"
    FRONTEND_URLS: str = (
        "http://localhost:5173,"
        "http://127.0.0.1:5173,"
        "https://pms-frontend-wx2l.onrender.com"
    )

    ADMIN_NAME: str = "System Admin"
    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
