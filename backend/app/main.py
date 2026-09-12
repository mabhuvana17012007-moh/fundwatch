from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database.connection import engine, Base, SessionLocal
from app.services.seed_data import seed_database
from app.services.startup_importer import import_fundwatch_data
from app.routes import (
    summary_router,
    projects_router,
    agencies_router,
    anomalies_router,
    verification_router,
    evidence_router,
    map_router,
    data_router,
    data_quality_router,
    settings_router
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    
    # Demo data is opt-in so official imports are not mixed with sample records.
    if settings.SEED_DEMO_DATA:
        db = SessionLocal()
        try:
            seed_database(db)
        finally:
            db.close()

    # Import official extracts after tables exist.  The importer uses file
    # hashes, so reloads do not duplicate unchanged rows.
    db = SessionLocal()
    try:
        import_fundwatch_data(db, settings.FUNDWATCH_DATA_DIR or None)
    finally:
        db.close()
    yield

app = FastAPI(
    title="FundWatch API",
    description="Explainable public-spending anomaly detection and monitoring platform for MPLADS projects.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routes
app.include_router(summary_router)
app.include_router(projects_router)
app.include_router(agencies_router)
app.include_router(anomalies_router)
app.include_router(verification_router)
app.include_router(evidence_router)
app.include_router(map_router)
app.include_router(data_router)
app.include_router(data_quality_router)
app.include_router(settings_router)

@app.get("/")
def read_root():
    return {
        "message": "FundWatch backend is running",
        "service": "FundWatch",
        "version": "1.0.0",
        "status": "Healthy"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
