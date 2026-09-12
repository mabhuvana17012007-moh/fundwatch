from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from collections import defaultdict
from datetime import datetime
from app.database.connection import get_db
from app.models.project import Project
from app.models.agency import Agency
from app.models.anomaly import Anomaly
from app.models.verification import VerificationCase
from app.models.spending import SpendingRecord
from app.models.source_data import (
    DashboardSnapshot,
    ExpenditureAggregate,
    ImportedWork,
    MpSummaryRecord,
)
from app.schemas.api_schemas import SummaryResponse, AnomalyResponse

router = APIRouter(prefix="/api/summary", tags=["Summary"])

@router.get("", response_model=SummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_projects = db.query(Project).count()
    
    # Calculate total expenditure
    exp_sum = db.query(func.sum(Project.expenditure)).scalar() or 0.0
    total_expenditure = round(float(exp_sum), 2)
    
    agencies_analysed = db.query(Agency).count()

    # Official extracts are stored separately because their amounts are in
    # rupees and expenditure rows have no Work ID.  Use the dashboard
    # snapshot as a safe aggregate fallback when no demo Projects exist.
    if total_projects == 0:
        snapshot = db.query(DashboardSnapshot).order_by(
            DashboardSnapshot.imported_at.desc()
        ).first()
        if snapshot:
            total_projects = int(snapshot.total_works_recommended or 0)
            total_expenditure = round(float(snapshot.total_expenditure_rupees or 0), 2)
            agencies_analysed = int(snapshot.total_mps or 0)
        else:
            total_projects = db.query(ImportedWork).filter(
                ImportedWork.record_type == "recommended"
            ).count()
            source_exp_sum = db.query(func.sum(ExpenditureAggregate.amount_rupees)).scalar() or 0
            total_expenditure = round(float(source_exp_sum), 2)
            agencies_analysed = db.query(
                func.count(func.distinct(MpSummaryRecord.mp_name))
            ).scalar() or 0
    
    high_critical_anomalies = db.query(Anomaly).filter(
        Anomaly.risk_level.in_(["High", "Critical"])
    ).count()
    
    cases_under_verification = db.query(VerificationCase).filter(
        VerificationCase.status.in_(["Submitted", "Under Review"])
    ).count()
    
    # Priority Anomalies: top 5 by anomaly_score desc
    priority_query = db.query(Anomaly).order_by(Anomaly.anomaly_score.desc()).limit(5).all()
    priority_list = []
    for a in priority_query:
        ag = db.query(Agency).filter(Agency.id == a.agency_id).first()
        prj = db.query(Project).filter(Project.id == a.project_id).first()
        priority_list.append(
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
                agency_name=ag.normalized_name if ag else "Unknown",
                project_title=prj.title if prj else "Unknown Project",
                state=prj.state if prj else "",
                district=prj.district if prj else ""
            )
        )
        
    # Monthly spending trend aggregated
    months_order = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]
    spending_trend = []
    
    # Aggregate monthly spending across projects
    for idx, month in enumerate(months_order, start=1):
        recs = db.query(SpendingRecord).filter(SpendingRecord.month == month).all()
        if recs:
            actual_sum = sum(r.actual_expenditure for r in recs)
            baseline_sum = sum(r.baseline_expenditure for r in recs)
            cum_sum = sum(r.cumulative_expenditure for r in recs)
            spending_trend.append({
                "month": month,
                "month_short": month[:3],
                "actual": round(actual_sum, 1),
                "baseline": round(baseline_sum, 1),
                "cumulative": round(cum_sum, 1)
            })

    # Uploaded ledger CSVs contain completion dates but no monthly spending
    # records. Derive the chart series from that ledger when needed.
    if len(spending_trend) < 2 and total_projects:
        monthly_actual = defaultdict(float)
        dated_projects = db.query(Project.completion_date, Project.expenditure).all()
        for completion_date, expenditure in dated_projects:
            try:
                parsed_date = datetime.fromisoformat(str(completion_date).replace("Z", "+00:00"))
            except (TypeError, ValueError):
                continue
            monthly_actual[parsed_date.strftime("%B")] += expenditure or 0.0

        if monthly_actual:
            spending_trend = []
            active_months = [month for month in months_order if month in monthly_actual]
            if len(active_months) < 2:
                monthly_total = sum(monthly_actual.values())
                monthly_actual = {
                    month: monthly_total / len(months_order)
                    for month in months_order
                }
                active_months = months_order
            monthly_baseline = sum(monthly_actual.values()) / len(active_months)
            cumulative = 0.0
            for month in active_months:
                actual = monthly_actual[month]
                cumulative += actual
                spending_trend.append({
                    "month": month,
                    "month_short": month[:3],
                    "actual": round(actual, 1),
                    "baseline": round(monthly_baseline, 1),
                    "cumulative": round(cumulative, 1)
                })
            
    # Anomaly distribution
    dist = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
    for row in db.query(Anomaly.risk_level, func.count(Anomaly.id)).group_by(Anomaly.risk_level).all():
        level, count = row
        if level in dist:
            dist[level] = count
            
    # Verification distribution
    v_dist = {"Submitted": 0, "Under Review": 0, "Verified": 0, "Rejected": 0, "Resolved": 0}
    for row in db.query(VerificationCase.status, func.count(VerificationCase.id)).group_by(VerificationCase.status).all():
        status, count = row
        if status in v_dist:
            v_dist[status] = count

    return SummaryResponse(
        total_projects=total_projects,
        total_expenditure=total_expenditure,
        agencies_analysed=agencies_analysed,
        high_critical_anomalies=high_critical_anomalies,
        cases_under_verification=cases_under_verification,
        priority_anomalies=priority_list,
        spending_trend=spending_trend,
        anomaly_distribution=dist,
        verification_status_distribution=v_dist
    )
