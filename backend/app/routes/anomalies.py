import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.connection import get_db
from app.models.anomaly import Anomaly
from app.models.agency import Agency
from app.models.project import Project
from app.models.verification import VerificationCase
from app.schemas.api_schemas import AnomalyResponse, AnomalyDetailResponse, ExplanationResponse
from app.services.explainability import generate_explanation

router = APIRouter(prefix="/api/anomalies", tags=["Anomalies"])

@router.get("", response_model=List[AnomalyResponse])
def get_anomalies(
    state: Optional[str] = None,
    agency_id: Optional[int] = None,
    category: Optional[str] = None,
    risk_level: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "score", # score, velocity, deviation, z_score
    sort_order: Optional[str] = "desc",
    db: Session = Depends(get_db)
):
    query = db.query(Anomaly)

    if agency_id:
        query = query.filter(Anomaly.agency_id == agency_id)
    if category:
        query = query.filter(Anomaly.category.ilike(f"%{category}%"))
    if risk_level:
        query = query.filter(Anomaly.risk_level == risk_level)
    if search:
        search_fmt = f"%{search}%"
        query = query.join(Project).filter(
            (Anomaly.work_id.ilike(search_fmt)) |
            (Project.title.ilike(search_fmt)) |
            (Anomaly.reason.ilike(search_fmt))
        )

    # Sorting
    if sort_by == "velocity":
        col = Anomaly.spending_velocity
    elif sort_by == "deviation":
        col = Anomaly.historical_deviation
    elif sort_by == "z_score":
        col = Anomaly.z_score
    else:
        col = Anomaly.anomaly_score

    if sort_order == "asc":
        query = query.order_by(col.asc())
    else:
        query = query.order_by(col.desc())

    anomalies = query.all()
    results = []
    for a in anomalies:
        ag = db.query(Agency).filter(Agency.id == a.agency_id).first()
        prj = db.query(Project).filter(Project.id == a.project_id).first()
        if state and prj and state.lower() not in prj.state.lower():
            continue

        results.append(
            AnomalyResponse(
                id=a.id,
                project_id=a.project_id,
                agency_id=a.agency_id,
                work_id=a.work_id,
                category=a.category,
                current_expenditure=a.current_expenditure,
                historical_baseline=a.historical_baseline,
                z_score=a.z_score,
                iqr_status=a.iqr_status,
                spending_velocity=a.spending_velocity,
                historical_deviation=a.historical_deviation,
                anomaly_score=a.anomaly_score,
                risk_level=a.risk_level,
                reason=a.reason,
                agency_name=ag.normalized_name if ag else "Public Works Department",
                project_title=prj.title if prj else "MPLADS Project",
                state=prj.state if prj else "",
                district=prj.district if prj else ""
            )
        )
    return results

@router.get("/{id}", response_model=AnomalyDetailResponse)
def get_anomaly_by_id(id: int, db: Session = Depends(get_db)):
    anomaly = db.query(Anomaly).filter(Anomaly.id == id).first()
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly record not found")

    agency = db.query(Agency).filter(Agency.id == anomaly.agency_id).first()
    project = db.query(Project).filter(Project.id == anomaly.project_id).first()
    verification = db.query(VerificationCase).filter(VerificationCase.anomaly_id == anomaly.id).first()

    components = {}
    if anomaly.score_components:
        try:
            components = json.loads(anomaly.score_components)
        except Exception:
            components = {}

    explanation_str = generate_explanation(
        current_expenditure=anomaly.current_expenditure,
        baseline=anomaly.historical_baseline,
        z_score=anomaly.z_score,
        iqr_status=anomaly.iqr_status,
        velocity=anomaly.spending_velocity,
        historical_deviation=anomaly.historical_deviation,
        anomaly_score=anomaly.anomaly_score,
        risk_level=anomaly.risk_level
    )

    return AnomalyDetailResponse(
        id=anomaly.id,
        project_id=anomaly.project_id,
        agency_id=anomaly.agency_id,
        work_id=anomaly.work_id,
        category=anomaly.category,
        current_expenditure=anomaly.current_expenditure,
        historical_baseline=anomaly.historical_baseline,
        z_score=anomaly.z_score,
        iqr_status=anomaly.iqr_status,
        spending_velocity=anomaly.spending_velocity,
        historical_deviation=anomaly.historical_deviation,
        anomaly_score=anomaly.anomaly_score,
        risk_level=anomaly.risk_level,
        reason=anomaly.reason,
        agency_name=agency.normalized_name if agency else "Public Works Department",
        project_title=project.title if project else "MPLADS Project",
        state=project.state if project else "",
        district=project.district if project else "",
        score_components=components,
        verification_case_id=verification.case_id if verification else None,
        explanation=explanation_str
    )

@router.get("/{id}/explanation", response_model=ExplanationResponse)
def get_anomaly_explanation(id: int, db: Session = Depends(get_db)):
    anomaly = db.query(Anomaly).filter(Anomaly.id == id).first()
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly record not found")

    explanation_str = generate_explanation(
        current_expenditure=anomaly.current_expenditure,
        baseline=anomaly.historical_baseline,
        z_score=anomaly.z_score,
        iqr_status=anomaly.iqr_status,
        velocity=anomaly.spending_velocity,
        historical_deviation=anomaly.historical_deviation,
        anomaly_score=anomaly.anomaly_score,
        risk_level=anomaly.risk_level
    )

    return ExplanationResponse(
        anomaly_id=anomaly.id,
        work_id=anomaly.work_id,
        anomaly_score=anomaly.anomaly_score,
        risk_level=anomaly.risk_level,
        explanation=explanation_str,
        metrics={
            "current_expenditure": anomaly.current_expenditure,
            "historical_baseline": anomaly.historical_baseline,
            "z_score": anomaly.z_score,
            "iqr_status": anomaly.iqr_status,
            "spending_velocity": anomaly.spending_velocity,
            "historical_deviation_pct": anomaly.historical_deviation
        }
    )
