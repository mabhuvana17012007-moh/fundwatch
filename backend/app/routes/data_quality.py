from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.data_import import DataImport
from app.schemas.api_schemas import DataQualityResponse

router = APIRouter(prefix="/api/data-quality", tags=["Data Quality"])

@router.get("", response_model=DataQualityResponse)
def get_data_quality_metrics(db: Session = Depends(get_db)):
    latest_import = db.query(DataImport).order_by(DataImport.created_at.desc()).first()
    all_imports = db.query(DataImport).order_by(DataImport.created_at.desc()).limit(10).all()

    recent_logs = [
        {
            "id": imp.id,
            "filename": imp.filename,
            "source": imp.source,
            "rows_imported": imp.rows_imported,
            "rows_processed": imp.rows_processed,
            "missing_fields": imp.missing_fields,
            "duplicate_records": imp.duplicate_records,
            "normalized_agencies": imp.normalized_agencies,
            "status": imp.status,
            "timestamp": imp.created_at.isoformat()
        }
        for imp in all_imports
    ]

    if not latest_import:
        return DataQualityResponse(
            rows_imported=18,
            rows_processed=18,
            missing_fields=0,
            duplicate_records=0,
            invalid_dates=0,
            invalid_amounts=0,
            normalized_agencies=7,
            import_timestamp="2024-08-15T10:00:00Z",
            data_source="MPLADS Integrated State Monitoring Cell (Demo Baseline)",
            status="Healthy",
            recent_logs=recent_logs
        )

    return DataQualityResponse(
        rows_imported=latest_import.rows_imported,
        rows_processed=latest_import.rows_processed,
        missing_fields=latest_import.missing_fields,
        duplicate_records=latest_import.duplicate_records,
        invalid_dates=latest_import.invalid_dates,
        invalid_amounts=latest_import.invalid_amounts,
        normalized_agencies=latest_import.normalized_agencies,
        import_timestamp=latest_import.created_at.isoformat(),
        data_source=latest_import.source,
        status=latest_import.status,
        recent_logs=recent_logs
    )
