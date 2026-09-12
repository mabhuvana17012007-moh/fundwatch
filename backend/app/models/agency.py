from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base

class Agency(Base):
    __tablename__ = "agencies"

    id = Column(Integer, primary_key=True, index=True)
    original_name = Column(String(255), nullable=False)
    normalized_name = Column(String(255), unique=True, index=True, nullable=False)
    state = Column(String(100), nullable=False)
    total_spending = Column(Float, nullable=False, default=0.0)
    avg_spending = Column(Float, nullable=False, default=0.0)
    median_spending = Column(Float, nullable=False, default=0.0)
    std_dev = Column(Float, nullable=False, default=0.0)
    spending_velocity = Column(Float, nullable=False, default=1.0) # Multiplier e.g. 1.2x
    anomaly_count = Column(Integer, nullable=False, default=0)
    risk_level = Column(String(20), nullable=False, default="Low")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    projects = relationship("Project", back_populates="agency")
    spending_records = relationship("SpendingRecord", back_populates="agency")
    anomalies = relationship("Anomaly", back_populates="agency")
