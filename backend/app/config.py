"""
Application configuration loaded from environment variables.
Uses Pydantic BaseSettings for validation and .env file support.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "ngo_impact"

    # JWT Authentication
    JWT_SECRET: str = "your-super-secret-jwt-key-change-this"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 10080  # 7 days

    # AI Provider: "openai", "gemini", or "mock"
    AI_PROVIDER: str = "mock"
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
