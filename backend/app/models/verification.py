from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base

class VerificationCase(Base):
    __tablename__ = "verification_cases"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. VER-2024-001
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    agency_id = Column(Integer, ForeignKey("agencies.id"), nullable=False)
    anomaly_id = Column(Integer, ForeignKey("anomalies.id"), nullable=True)
    work_id = Column(String(50), nullable=False)
    anomaly_score = Column(Float, nullable=False, default=0.0)
    risk_level = Column(String(20), nullable=False, default="Low")
    status = Column(String(50), nullable=False, default="Submitted", index=True) 
    # Statuses: Submitted, Under Review, Verified, Rejected, Resolved
    reviewer = Column(String(100), nullable=True, default="Assigned Inspector")
    comment = Column(Text, nullable=True)
    remarks = Column(Text, nullable=True)
    submitted_date = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="verification_cases")
    anomaly = relationship("Anomaly", back_populates="verification_case")
    evidence = relationship("Evidence", back_populates="verification_case", cascade="all, delete-orphan")
