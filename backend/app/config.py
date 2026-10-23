import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "PayPilot AI"
    APP_ENV: str = "development"
    DATABASE_URL: str = "sqlite:///./paypilot.db"
    JWT_SECRET: str = os.getenv("JWT_SECRET", "paypilot-super-secret-key-hackathon-2026")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    DEFAULT_COMPANY_ID: str = "comp_ind_001"
    DEFAULT_COMPANY_NAME: str = "BharatTech Innovations Pvt. Ltd."

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
