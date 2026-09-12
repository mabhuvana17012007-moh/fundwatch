from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.database.connection import get_db
from app.models.verification import VerificationCase
from app.models.evidence import Evidence
from app.schemas.api_schemas import EvidenceResponse
from app.utils.hashing import calculate_sha256

router = APIRouter(prefix="/api/evidence", tags=["Evidence"])

@router.post("/upload", response_model=EvidenceResponse)
async def upload_evidence(
    verification_id: int = Form(...),
    file: UploadFile = File(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    comment: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    case = db.query(VerificationCase).filter(VerificationCase.id == verification_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Verification case not found")

    content = await file.read()
    file_sha256 = calculate_sha256(content)

    new_evidence = Evidence(
        verification_id=verification_id,
        file_name=file.filename or "evidence_document.jpg",
        file_hash=file_sha256,
        file_url="https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80",
        latitude=latitude or case.project.latitude,
        longitude=longitude or case.project.longitude,
        timestamp=datetime.utcnow(),
        comment=comment or f"Field evidence uploaded: {file.filename}. SHA-256 computed on ingest.",
        is_verified=True
    )
    db.add(new_evidence)
    db.commit()
    db.refresh(new_evidence)

    return EvidenceResponse(
        id=new_evidence.id,
        verification_id=new_evidence.verification_id,
        file_name=new_evidence.file_name,
        file_hash=new_evidence.file_hash,
        file_url=new_evidence.file_url,
        latitude=new_evidence.latitude,
        longitude=new_evidence.longitude,
        timestamp=new_evidence.timestamp,
        comment=new_evidence.comment,
        is_verified=new_evidence.is_verified
    )
