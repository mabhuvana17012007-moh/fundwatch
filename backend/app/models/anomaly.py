from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base

class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    agency_id = Column(Integer, ForeignKey("agencies.id"), nullable=False, index=True)
    work_id = Column(String(50), nullable=False, index=True)
    category = Column(String(100), nullable=False)
    current_expenditure = Column(Float, nullable=False, default=0.0) # In Lakhs
    historical_baseline = Column(Float, nullable=False, default=0.0)
    z_score = Column(Float, nullable=False, default=0.0)
    iqr_status = Column(String(50), nullable=False, default="Normal") # Flagged or Normal
    spending_velocity = Column(Float, nullable=False, default=1.0) # e.g. 4.2x
    historical_deviation = Column(Float, nullable=False, default=0.0) # Percentage e.g. +79.0%
    anomaly_score = Column(Float, nullable=False, default=0.0, index=True) # 0-100
    risk_level = Column(String(20), nullable=False, default="Low", index=True) # Low, Medium, High, Critical
    score_components = Column(Text, nullable=True) # JSON serialized component weights
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="anomalies")
    agency = relationship("Agency", back_populates="anomalies")
    verification_case = relationship("VerificationCase", back_populates="anomaly", uselist=False)
