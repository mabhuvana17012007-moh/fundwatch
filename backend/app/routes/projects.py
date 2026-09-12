from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import numpy as np
from app.database.connection import get_db
from app.models.project import Project
from app.models.agency import Agency
from app.models.spending import SpendingRecord
from app.models.anomaly import Anomaly
from app.schemas.api_schemas import ProjectResponse, ProjectDetailResponse, SpendingRecordResponse
from app.services.explainability import generate_explanation

router = APIRouter(prefix="/api/projects", tags=["Projects"])

@router.get("", response_model=List[ProjectResponse])
def get_projects(
    state: Optional[str] = None,
    district: Optional[str] = None,
    constituency: Optional[str] = None,
    agency_id: Optional[int] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Project)

    if state:
        query = query.filter(Project.state.ilike(f"%{state}%"))
    if district:
        query = query.filter(Project.district.ilike(f"%{district}%"))
    if constituency:
        query = query.filter(Project.constituency.ilike(f"%{constituency}%"))
    if agency_id:
        query = query.filter(Project.agency_id == agency_id)
    if category:
        query = query.filter(Project.category.ilike(f"%{category}%"))
    if status:
        query = query.filter(Project.status == status)
    if risk_level:
        query = query.filter(Project.risk_level == risk_level)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Project.work_id.ilike(search_fmt)) |
            (Project.title.ilike(search_fmt)) |
            (Project.mp_name.ilike(search_fmt)) |
            (Project.description.ilike(search_fmt))
        )

    projects = query.order_by(Project.anomaly_score.desc()).all()
    results = []
    for p in projects:
        ag = db.query(Agency).filter(Agency.id == p.agency_id).first()
        results.append(
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
                agency_name=ag.normalized_name if ag else "Public Works Department"
            )
        )
    return results

@router.get("/{id}", response_model=ProjectDetailResponse)
def get_project_by_id(id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    agency = db.query(Agency).filter(Agency.id == project.agency_id).first()
    spending_recs = db.query(SpendingRecord).filter(
        SpendingRecord.project_id == project.id
    ).order_by(SpendingRecord.month_index.asc()).all()

    anomaly = db.query(Anomaly).filter(Anomaly.project_id == project.id).first()

    if not spending_recs:
        # Imported project ledgers contain a completion date and total spend,
        # but not monthly rows. Provide a two-point derived series so the
        # detail chart remains useful without inventing a full monthly ledger.
        try:
            completion_date = datetime.fromisoformat(
                str(project.completion_date).replace("Z", "+00:00")
            )
        except (TypeError, ValueError):
            completion_date = datetime.utcnow()
        baseline = anomaly.historical_baseline if anomaly else project.sanctioned_amount
        month_index = completion_date.month
        previous_month = month_index - 1 or 12
        previous_year = completion_date.year if month_index > 1 else completion_date.year - 1
        previous_month_name = datetime(previous_year, previous_month, 1).strftime("%B")
        current_month_name = completion_date.strftime("%B")
        spending_recs = [
            {
                "id": 0,
                "month": previous_month_name,
                "year": previous_year,
                "month_index": previous_month,
                "actual_expenditure": round(float(baseline or 0.0), 2),
                "baseline_expenditure": round(float(baseline or 0.0), 2),
                "cumulative_expenditure": round(float(baseline or 0.0), 2),
                "velocity_multiplier": 1.0,
            },
            {
                "id": 0,
                "month": current_month_name,
                "year": completion_date.year,
                "month_index": month_index,
                "actual_expenditure": project.expenditure,
                "baseline_expenditure": round(float(baseline or 0.0), 2),
                "cumulative_expenditure": round(float(baseline or 0.0) + project.expenditure, 2),
                "velocity_multiplier": anomaly.spending_velocity if anomaly else 1.0,
            },
        ]

    # Calculate historical stats
    spending_history_resp = [SpendingRecordResponse.model_validate(r) for r in spending_recs]

    exp_values = [
        r["actual_expenditure"] if isinstance(r, dict) else r.actual_expenditure
        for r in spending_recs
    ]
    if exp_values:
        mean_val = float(np.mean(exp_values))
        median_val = float(np.median(exp_values))
        std_val = float(np.std(exp_values))
        q1 = float(np.percentile(exp_values, 25))
        q3 = float(np.percentile(exp_values, 75))
        iqr = q3 - q1
    else:
        mean_val = project.expenditure
        median_val = project.expenditure
        std_val = 0.0
        q1 = project.expenditure
        q3 = project.expenditure
        iqr = 0.0

    z_score = anomaly.z_score if anomaly else 0.0
    iqr_status = anomaly.iqr_status if anomaly else "Normal"
    velocity = anomaly.spending_velocity if anomaly else 1.0
    dev = anomaly.historical_deviation if anomaly else 0.0
    baseline = anomaly.historical_baseline if anomaly else (mean_val or 40.0)

    # Explanation text
    explanation_str = (
        anomaly.reason if anomaly else 
        generate_explanation(
            current_expenditure=project.expenditure,
            baseline=baseline,
            z_score=z_score,
            iqr_status=iqr_status,
            velocity=velocity,
            historical_deviation=dev,
            risk_level=project.risk_level
        )
    )

    stats = {
        "current_expenditure": project.expenditure,
        "historical_baseline": baseline,
        "average": round(mean_val, 2),
        "median": round(median_val, 2),
        "standard_deviation": round(std_val, 2),
        "z_score": round(z_score, 2),
        "iqr": round(iqr, 2),
        "q1": round(q1, 2),
        "q3": round(q3, 2),
        "iqr_status": iqr_status,
        "spending_velocity": velocity,
        "historical_deviation_pct": dev,
        "anomaly_score": project.anomaly_score,
        "risk_level": project.risk_level
    }

    anomaly_dict = None
    if anomaly:
        anomaly_dict = {
            "id": anomaly.id,
            "anomaly_score": anomaly.anomaly_score,
            "risk_level": anomaly.risk_level,
            "z_score": anomaly.z_score,
            "iqr_status": anomaly.iqr_status,
            "spending_velocity": anomaly.spending_velocity,
            "historical_deviation": anomaly.historical_deviation,
            "reason": anomaly.reason
        }

    return ProjectDetailResponse(
        id=project.id,
        work_id=project.work_id,
        title=project.title,
        state=project.state,
        district=project.district,
        constituency=project.constituency,
        mp_name=project.mp_name,
        category=project.category,
        description=project.description,
        sanctioned_amount=project.sanctioned_amount,
        released_amount=project.released_amount,
        expenditure=project.expenditure,
        physical_progress=project.physical_progress,
        status=project.status,
        completion_date=project.completion_date,
        latitude=project.latitude,
        longitude=project.longitude,
        risk_level=project.risk_level,
        anomaly_score=project.anomaly_score,
        agency_id=project.agency_id,
        agency_name=agency.normalized_name if agency else "Public Works Department",
        spending_history=spending_history_resp,
        historical_stats=stats,
        explanation=explanation_str,
        anomaly=anomaly_dict
    )
