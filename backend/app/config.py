import os
from pydantic import BaseModel

class Settings(BaseModel):
    APP_NAME: str = "FundWatch"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database Configuration:
    # Uses PostgreSQL if DATABASE_URL is set; otherwise uses local SQLite.
    # Otherwise gracefully falls back to a local SQLite database for zero-config hackathon demo
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./fundwatch.db")
    # Keep a new database empty unless demo records are explicitly requested.
    SEED_DEMO_DATA: bool = os.getenv("SEED_DEMO_DATA", "false").lower() == "true"
    # Empty means the repository's fundwatch-data directory.
    FUNDWATCH_DATA_DIR: str = os.getenv("FUNDWATCH_DATA_DIR", "")
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "fundwatch-secure-demo-secret-key-2026")
    API_KEY: str = os.getenv("API_KEY", "fundwatch-live-key-2026")
    
    # Anomaly Engine Defaults
    DEFAULT_Z_SCORE_THRESHOLD: float = 3.0
    DEFAULT_IQR_MULTIPLIER: float = 1.5
    DEFAULT_WEIGHT_Z_SCORE: float = 0.30
    DEFAULT_WEIGHT_IQR: float = 0.20
    DEFAULT_WEIGHT_VELOCITY: float = 0.30
    DEFAULT_WEIGHT_DEVIATION: float = 0.20

settings = Settings()
