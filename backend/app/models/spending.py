from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base

class SpendingRecord(Base):
    __tablename__ = "spending_records"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    agency_id = Column(Integer, ForeignKey("agencies.id"), nullable=False, index=True)
    month = Column(String(20), nullable=False) # e.g. January
    year = Column(Integer, nullable=False, default=2024)
    month_index = Column(Integer, nullable=False, default=1) # 1 to 12
    actual_expenditure = Column(Float, nullable=False, default=0.0) # Lakhs
    baseline_expenditure = Column(Float, nullable=False, default=0.0)
    cumulative_expenditure = Column(Float, nullable=False, default=0.0)
    velocity_multiplier = Column(Float, nullable=False, default=1.0)

    # Relationships
    project = relationship("Project", back_populates="spending_records")
    agency = relationship("Agency", back_populates="spending_records")
