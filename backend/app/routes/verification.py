from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database.connection import get_db
from app.models.verification import VerificationCase
from app.models.project import Project
from app.models.agency import Agency
from app.models.anomaly import Anomaly
from app.models.evidence import Evidence
from app.schemas.api_schemas import (
    VerificationResponse,
    VerificationDetailResponse,
    VerificationUpdateRequest,
    VerificationCreateRequest,
    EvidenceResponse,
    EvidenceUploadRequest
)
from app.utils.hashing import calculate_sha256

router = APIRouter(prefix="/api/verification", tags=["Verification"])

@router.get("", response_model=List[VerificationResponse])
def get_verification_cases(
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(VerificationCase)

    if status:
        query = query.filter(VerificationCase.status == status)
    if risk_level:
        query = query.filter(VerificationCase.risk_level == risk_level)
    if search:
        search_fmt = f"%{search}%"
        query = query.join(Project).filter(
            (VerificationCase.case_id.ilike(search_fmt)) |
            (VerificationCase.work_id.ilike(search_fmt)) |
            (Project.title.ilike(search_fmt))
        )

    cases = query.order_by(VerificationCase.updated_at.desc()).all()
    results = []
    for c in cases:
        ag = db.query(Agency).filter(Agency.id == c.agency_id).first()
        prj = db.query(Project).filter(Project.id == c.project_id).first()
        ev_count = db.query(Evidence).filter(Evidence.verification_id == c.id).count()

        results.append(
            VerificationResponse(
                id=c.id,
                case_id=c.case_id,
                project_id=c.project_id,
                work_id=c.work_id,
                agency_id=c.agency_id,
                agency_name=ag.normalized_name if ag else "Public Works Department",
                project_title=prj.title if prj else "MPLADS Project",
                anomaly_score=c.anomaly_score,
                risk_level=c.risk_level,
                status=c.status,
                reviewer=c.reviewer,
                comment=c.comment,
                remarks=c.remarks,
                submitted_date=c.submitted_date,
                updated_at=c.updated_at,
                evidence_count=ev_count
            )
        )
    return results

@router.get("/{id}", response_model=VerificationDetailResponse)
def get_verification_case_by_id(id: int, db: Session = Depends(get_db)):
    case = db.query(VerificationCase).filter(VerificationCase.id == id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Verification case not found")

    agency = db.query(Agency).filter(Agency.id == case.agency_id).first()
    project = db.query(Project).filter(Project.id == case.project_id).first()
    anomaly = db.query(Anomaly).filter(Anomaly.id == case.anomaly_id).first()
    ev_records = db.query(Evidence).filter(Evidence.verification_id == case.id).all()

    evidence_responses = [
        EvidenceResponse(
            id=e.id,
            verification_id=e.verification_id,
            file_name=e.file_name,
            file_hash=e.file_hash,
            file_url=e.file_url,
            latitude=e.latitude,
            longitude=e.longitude,
            timestamp=e.timestamp,
            comment=e.comment,
            is_verified=e.is_verified
        )
        for e in ev_records
    ]

    project_meta = {
        "title": project.title if project else "MPLADS Project",
        "work_id": project.work_id if project else case.work_id,
        "state": project.state if project else "",
        "district": project.district if project else "",
        "constituency": project.constituency if project else "",
        "mp_name": project.mp_name if project else "",
        "sanctioned_amount": project.sanctioned_amount if project else 0.0,
        "expenditure": project.expenditure if project else 0.0,
        "physical_progress": project.physical_progress if project else 0.0,
        "latitude": project.latitude if project else 18.5204,
        "longitude": project.longitude if project else 73.8567
    }

    return VerificationDetailResponse(
        id=case.id,
        case_id=case.case_id,
        project_id=case.project_id,
        work_id=case.work_id,
        agency_id=case.agency_id,
        agency_name=agency.normalized_name if agency else "Public Works Department",
        project_title=project.title if project else "MPLADS Project",
        anomaly_score=case.anomaly_score,
        risk_level=case.risk_level,
        status=case.status,
        reviewer=case.reviewer,
        comment=case.comment,
        remarks=case.remarks,
        submitted_date=case.submitted_date,
        updated_at=case.updated_at,
        evidence_count=len(evidence_responses),
        explanation=anomaly.reason if anomaly else "Unusual spending pattern requires verification.",
        project_meta=project_meta,
        evidence_list=evidence_responses
    )

@router.post("", response_model=VerificationResponse)
def create_verification_case(req: VerificationCreateRequest, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    anomaly = db.query(Anomaly).filter(Anomaly.project_id == project.id).first()
    case_num = db.query(VerificationCase).count() + 1
    case_id = f"VER-2024-{case_num:03d}"

    new_case = VerificationCase(
        case_id=case_id,
        project_id=project.id,
        agency_id=project.agency_id or 1,
        anomaly_id=anomaly.id if anomaly else None,
        work_id=project.work_id,
        anomaly_score=project.anomaly_score,
        risk_level=project.risk_level,
        status="Submitted",
        reviewer=req.reviewer,
        comment=req.comment,
        remarks="Case created and queued for field verification.",
        submitted_date=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    agency = db.query(Agency).filter(Agency.id == new_case.agency_id).first()
    return VerificationResponse(
        id=new_case.id,
        case_id=new_case.case_id,
        project_id=new_case.project_id,
        work_id=new_case.work_id,
        agency_id=new_case.agency_id,
        agency_name=agency.normalized_name if agency else "Public Works Department",
        project_title=project.title,
        anomaly_score=new_case.anomaly_score,
        risk_level=new_case.risk_level,
        status=new_case.status,
        reviewer=new_case.reviewer,
        comment=new_case.comment,
        remarks=new_case.remarks,
        submitted_date=new_case.submitted_date,
        updated_at=new_case.updated_at,
        evidence_count=0
    )

@router.patch("/{id}", response_model=VerificationDetailResponse)
def update_verification_case(id: int, req: VerificationUpdateRequest, db: Session = Depends(get_db)):
    case = db.query(VerificationCase).filter(VerificationCase.id == id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Verification case not found")

    valid_statuses = ["Submitted", "Under Review", "Verified", "Rejected", "Resolved"]
    if req.status and req.status in valid_statuses:
        case.status = req.status
    if req.reviewer:
        case.reviewer = req.reviewer
    if req.remarks:
        case.remarks = req.remarks
    if req.comment:
        case.comment = req.comment

    case.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(case)

    return get_verification_case_by_id(id, db)
