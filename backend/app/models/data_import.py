from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from app.database.connection import Base

class DataImport(Base):
    __tablename__ = "data_imports"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    source = Column(String(100), nullable=False, default="CSV Upload")
    rows_imported = Column(Integer, nullable=False, default=0)
    rows_processed = Column(Integer, nullable=False, default=0)
    missing_fields = Column(Integer, nullable=False, default=0)
    duplicate_records = Column(Integer, nullable=False, default=0)
    invalid_dates = Column(Integer, nullable=False, default=0)
    invalid_amounts = Column(Integer, nullable=False, default=0)
    normalized_agencies = Column(Integer, nullable=False, default=0)
    status = Column(String(50), nullable=False, default="Success") # Success, Partial, Failed
    report_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
