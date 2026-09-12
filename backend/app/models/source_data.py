"""Models for the official MPLADS extracts imported at backend startup.

These tables intentionally remain separate from the demo ``projects`` and
``spending_records`` tables.  In particular, expenditure extracts do not have
Work ID, so treating an expenditure row as a project expenditure would create
false links.
"""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, Numeric, String, Text, UniqueConstraint

from app.database.connection import Base


class ImportedWork(Base):
    __tablename__ = "imported_works"
    __table_args__ = (UniqueConstraint("source_file", "row_hash", name="uq_imported_work_file_hash"),)

    id = Column(Integer, primary_key=True, index=True)
    source_file = Column(String(255), nullable=False, index=True)
    record_type = Column(String(20), nullable=False, index=True)  # recommended or completed
    source_row_number = Column(Integer, nullable=False)
    row_hash = Column(String(64), nullable=False, index=True)
    work_id = Column(String(100), nullable=True, index=True)
    work_description = Column(Text, nullable=True)
    category = Column(String(255), nullable=True)
    mp_name = Column(String(255), nullable=True, index=True)
    constituency = Column(String(255), nullable=True, index=True)
    state = Column(String(100), nullable=True, index=True)
    house = Column(String(50), nullable=True)
    amount_rupees = Column(Numeric(20, 2), nullable=True)
    event_date = Column(DateTime, nullable=True)
    has_images = Column(Boolean, nullable=True)
    average_rating = Column(Float, nullable=True)
    ida = Column(String(500), nullable=True, index=True)
    imported_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class ExpenditureAggregate(Base):
    """An expenditure transaction which cannot be assigned to a Work ID."""

    __tablename__ = "expenditure_aggregates"
    __table_args__ = (UniqueConstraint("source_file", "row_hash", name="uq_expenditure_file_hash"),)

    id = Column(Integer, primary_key=True, index=True)
    source_file = Column(String(255), nullable=False, index=True)
    source_row_number = Column(Integer, nullable=False)
    row_hash = Column(String(64), nullable=False, index=True)
    mp_name = Column(String(255), nullable=True, index=True)
    constituency = Column(String(255), nullable=True, index=True)
    state = Column(String(100), nullable=True, index=True)
    house = Column(String(50), nullable=True)
    work_description = Column(Text, nullable=True)
    vendor = Column(String(255), nullable=True)
    ida = Column(String(500), nullable=True, index=True)
    amount_rupees = Column(Numeric(20, 2), nullable=True)
    expenditure_date = Column(DateTime, nullable=True)
    payment_status = Column(String(100), nullable=True)
    linkage_status = Column(String(30), nullable=False, default="unlinked")
    imported_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class MpSummaryRecord(Base):
    __tablename__ = "mp_summary_records"
    __table_args__ = (UniqueConstraint("source_file", "row_hash", name="uq_mp_summary_file_hash"),)

    id = Column(Integer, primary_key=True, index=True)
    source_file = Column(String(255), nullable=False, index=True)
    source_row_number = Column(Integer, nullable=False)
    row_hash = Column(String(64), nullable=False, index=True)
    mp_name = Column(String(255), nullable=True, index=True)
    constituency = Column(String(255), nullable=True, index=True)
    state = Column(String(100), nullable=True, index=True)
    house = Column(String(50), nullable=True)
    allocated_amount_rupees = Column(Numeric(20, 2), nullable=True)
    recommended_amount_rupees = Column(Numeric(20, 2), nullable=True)
    expenditure_amount_rupees = Column(Numeric(20, 2), nullable=True)
    utilization_percentage = Column(Float, nullable=True)
    completed_works = Column(Integer, nullable=True)
    recommended_works = Column(Integer, nullable=True)
    completion_rate_percentage = Column(Float, nullable=True)
    balance_not_paid_rupees = Column(Numeric(20, 2), nullable=True)
    transaction_count = Column(Integer, nullable=True)
    successful_payments = Column(Integer, nullable=True)
    pending_payments = Column(Integer, nullable=True)
    average_rating = Column(Float, nullable=True)
    imported_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class DashboardSnapshot(Base):
    __tablename__ = "dashboard_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    source_file = Column(String(255), nullable=False, unique=True)
    file_hash = Column(String(64), nullable=False, index=True)
    captured_at = Column(DateTime, nullable=True)
    payload_json = Column(Text, nullable=False)
    total_allocated_rupees = Column(Numeric(20, 2), nullable=True)
    total_expenditure_rupees = Column(Numeric(20, 2), nullable=True)
    total_recommended_rupees = Column(Numeric(20, 2), nullable=True)
    total_mps = Column(Integer, nullable=True)
    total_works_completed = Column(Integer, nullable=True)
    total_works_recommended = Column(Integer, nullable=True)
    total_transactions = Column(Integer, nullable=True)
    imported_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class ImportFileAudit(Base):
    """Hash-based import audit used to make startup imports idempotent."""

    __tablename__ = "import_file_audits"
    __table_args__ = (UniqueConstraint("filename", "file_hash", name="uq_import_file_hash"),)

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False, index=True)
    file_hash = Column(String(64), nullable=False, index=True)
    file_mtime_ns = Column(Integer, nullable=True)
    file_size = Column(Integer, nullable=True)
    rows_seen = Column(Integer, nullable=False, default=0)
    rows_imported = Column(Integer, nullable=False, default=0)
    status = Column(String(30), nullable=False, default="Success")
    error_message = Column(Text, nullable=True)
    imported_at = Column(DateTime, default=datetime.utcnow, nullable=False)
