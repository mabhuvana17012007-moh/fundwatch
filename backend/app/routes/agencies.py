from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from app.database.connection import get_db
from app.models.agency import Agency
from app.models.project import Project
from app.models.anomaly import Anomaly
from app.models.spending import SpendingRecord
from app.schemas.api_schemas import AgencyResponse, AgencyDetailResponse, ProjectResponse
from app.services.peer_comparison import compute_agency_peer_comparison

router = APIRouter(prefix="/api/agencies", tags=["Agencies"])

@router.get("", response_model=List[AgencyResponse])
def get_agencies(db: Session = Depends(get_db)):
    agencies = db.query(Agency).order_by(Agency.anomaly_count.desc(), Agency.total_spending.desc()).all()
    results = []
    for ag in agencies:
        p_count = db.query(Project).filter(Project.agency_id == ag.id).count()
        results.append(
            AgencyResponse(
                id=ag.id,
                original_name=ag.original_name,
                normalized_name=ag.normalized_name,
                state=ag.state,
                total_spending=ag.total_spending,
                avg_spending=ag.avg_spending,
                median_spending=ag.median_spending,
                std_dev=ag.std_dev,
                spending_velocity=ag.spending_velocity,
                anomaly_count=ag.anomaly_count,
                risk_level=ag.risk_level,
                project_count=p_count
            )
        )
    return results

@router.get("/{id}", response_model=AgencyDetailResponse)
def get_agency_by_id(id: int, db: Session = Depends(get_db)):
    agency = db.query(Agency).filter(Agency.id == id).first()
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")

    projects = db.query(Project).filter(Project.agency_id == agency.id).all()
    project_responses = [
        ProjectResponse(
            id=p.id,
            work_id=p.work_id,
            title=p.title,
            state=p.state,
            district=p.district,
            constituency=p.constituency,
            mp_name=p.mp_name,
            category=p.category,
            description=p.description,
            sanctioned_amount=p.sanctioned_amount,
            released_amount=p.released_amount,
            expenditure=p.expenditure,
            physical_progress=p.physical_progress,
            status=p.status,
            completion_date=p.completion_date,
            latitude=p.latitude,
            longitude=p.longitude,
            risk_level=p.risk_level,
            anomaly_score=p.anomaly_score,
            agency_name=agency.normalized_name
        )
        for p in projects
    ]

    # Anomalies for this agency
    anomalies = db.query(Anomaly).filter(Anomaly.agency_id == agency.id).all()
    anomaly_list = [
        {
            "id": a.id,
            "work_id": a.work_id,
            "category": a.category,
            "current_expenditure": a.current_expenditure,
            "historical_baseline": a.historical_baseline,
            "z_score": a.z_score,
            "iqr_status": a.iqr_status,
            "spending_velocity": a.spending_velocity,
            "historical_deviation": a.historical_deviation,
            "anomaly_score": a.anomaly_score,
            "risk_level": a.risk_level,
            "reason": a.reason
        }
        for a in anomalies
    ]

    # Monthly spending trajectory
    months_order = ["January", "February", "March", "April", "May", "June", "July", "August"]
    trajectory = []
    for month in months_order:
        recs = db.query(SpendingRecord).filter(
            SpendingRecord.agency_id == agency.id,
            SpendingRecord.month == month
        ).all()
        if recs:
            spent = sum(r.actual_expenditure for r in recs)
            base = sum(r.baseline_expenditure for r in recs)
            trajectory.append({
                "month": month,
                "month_short": month[:3],
                "actual": round(spent, 1),
                "baseline": round(base, 1)
            })

    # Peer comparison
    all_agencies = db.query(Agency).all()
    all_agencies_dicts = [
        {
            "id": a.id,
            "normalized_name": a.normalized_name,
            "avg_spending": a.avg_spending,
            "median_spending": a.median_spending,
            "spending_velocity": a.spending_velocity,
            "anomaly_count": a.anomaly_count
        }
        for a in all_agencies
    ]
    peer_comp = compute_agency_peer_comparison(agency.id, all_agencies_dicts)

    return AgencyDetailResponse(
        id=agency.id,
        original_name=agency.original_name,
        normalized_name=agency.normalized_name,
        state=agency.state,
        total_spending=agency.total_spending,
        avg_spending=agency.avg_spending,
        median_spending=agency.median_spending,
        std_dev=agency.std_dev,
        spending_velocity=agency.spending_velocity,
        anomaly_count=agency.anomaly_count,
        risk_level=agency.risk_level,
        project_count=len(projects),
        projects=project_responses,
        anomalies=anomaly_list,
        spending_trajectory=trajectory,
        peer_comparison=peer_comp
    )
