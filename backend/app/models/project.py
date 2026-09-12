from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    work_id = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    constituency = Column(String(100), nullable=False)
    mp_name = Column(String(150), nullable=False)
    agency_id = Column(Integer, ForeignKey("agencies.id"), nullable=True)
    category = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    sanctioned_amount = Column(Float, nullable=False, default=0.0) # In Lakhs (₹ Lakhs)
    released_amount = Column(Float, nullable=False, default=0.0)
    expenditure = Column(Float, nullable=False, default=0.0)
    physical_progress = Column(Float, nullable=False, default=0.0) # Percentage 0-100
    status = Column(String(50), nullable=False, default="Ongoing")
    completion_date = Column(String(50), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False, default="Low", index=True) # Low, Medium, High, Critical
    anomaly_score = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    agency = relationship("Agency", back_populates="projects")
    spending_records = relationship("SpendingRecord", back_populates="project", cascade="all, delete-orphan")
    anomalies = relationship("Anomaly", back_populates="project", cascade="all, delete-orphan")
    verification_cases = relationship("VerificationCase", back_populates="project", cascade="all, delete-orphan")
