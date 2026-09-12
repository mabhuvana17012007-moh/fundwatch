from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import get_db
from app.models.project import Project
from app.models.agency import Agency
from app.models.verification import VerificationCase
from app.schemas.api_schemas import MapProjectResponse

router = APIRouter(prefix="/api/map", tags=["Map"])

@router.get("", response_model=List[MapProjectResponse])
def get_map_markers(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    results = []
    for p in projects:
        ag = db.query(Agency).filter(Agency.id == p.agency_id).first()
        vc = db.query(VerificationCase).filter(VerificationCase.project_id == p.id).first()
        v_status = vc.status if vc else "Not Queued"

        results.append(
            MapProjectResponse(
                id=p.id,
                work_id=p.work_id,
                title=p.title,
                agency=ag.normalized_name if ag else "Public Works Department",
                state=p.state,
                district=p.district,
                category=p.category,
                expenditure=p.expenditure,
                anomaly_score=p.anomaly_score,
                risk_level=p.risk_level,
                verification_status=v_status,
                latitude=p.latitude,
                longitude=p.longitude
            )
        )
    return results
