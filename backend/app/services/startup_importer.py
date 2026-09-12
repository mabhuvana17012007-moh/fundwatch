"""Idempotent importer for the official files shipped in ``fundwatch-data``."""

import csv
import hashlib
import json
import re
from datetime import datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple, Type

from sqlalchemy.orm import Session

from app.models.data_import import DataImport
from app.models.source_data import (
    DashboardSnapshot,
    ExpenditureAggregate,
    ImportFileAudit,
    ImportedWork,
    MpSummaryRecord,
)


REQUIRED_HEADERS = {
    "recommended": {"Work ID", "Work Description", "MP Name", "State", "Recommended Amount (₹)"},
    "completed": {"Work ID", "Work Description", "MP Name", "State", "Final Amount (₹)"},
    "expenditures": {"MP Name", "Work Description", "Vendor", "Expenditure Amount (₹)"},
    "mp_summary": {"MP Name", "Constituency", "State", "Allocated Amount (₹)"},
}


def _clean(value: Any) -> str:
    return str(value or "").replace("\ufeff", "").strip()


def _parse_rupees(value: Any) -> Optional[Decimal]:
    """Parse Indian/CSV currency values and retain rupees (never lakhs)."""
    text = _clean(value)
    if not text or text.upper() in {"N/A", "NA", "NULL", "NONE", "-"}:
        return None
    negative = text.startswith("(") and text.endswith(")")
    text = text.strip("()").replace("₹", "").replace(",", "").replace(" ", "")
    text = re.sub(r"[^\d.+-]", "", text)
    if not text or text in {".", "+", "-"}:
        return None
    try:
        amount = Decimal(text)
    except InvalidOperation:
        return None
    return -amount if negative else amount


def _parse_number(value: Any) -> Optional[float]:
    text = _clean(value)
    if not text or text.upper() in {"N/A", "NA", "NULL", "NONE", "-"}:
        return None
    try:
        return float(text.replace(",", "").replace("%", ""))
    except ValueError:
        return None


def _parse_int(value: Any) -> Optional[int]:
    parsed = _parse_number(value)
    return int(parsed) if parsed is not None else None


def _parse_date(value: Any) -> Optional[datetime]:
    text = _clean(value)
    if not text:
        return None
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00")).replace(tzinfo=None)
    except ValueError:
        return None


def _parse_bool(value: Any) -> Optional[bool]:
    text = _clean(value).lower()
    if text in {"true", "1", "yes", "y"}:
        return True
    if text in {"false", "0", "no", "n"}:
        return False
    return None


def _row_hash(row: Dict[str, Any]) -> str:
    normalized = {key: (str(value) if value is not None else "") for key, value in row.items()}
    return hashlib.sha256(
        json.dumps(normalized, sort_keys=True, ensure_ascii=False).encode("utf-8")
    ).hexdigest()


def _file_hash(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _kind_for_csv(path: Path) -> Optional[str]:
    name = path.name.lower()
    if "recommended" in name:
        return "recommended"
    if "completed" in name:
        return "completed"
    if "expenditure" in name:
        return "expenditures"
    if "mp_summary" in name or "summary" in name:
        return "mp_summary"
    return None


def _audit(
    db: Session,
    path: Path,
    digest: str,
    rows_seen: int,
    rows_imported: int,
    status: str = "Success",
    error_message: Optional[str] = None,
) -> None:
    stat = path.stat()
    db.add(
        ImportFileAudit(
            filename=path.name,
            file_hash=digest,
            file_mtime_ns=stat.st_mtime_ns,
            file_size=stat.st_size,
            rows_seen=rows_seen,
            rows_imported=rows_imported,
            status=status,
            error_message=error_message,
        )
    )
    db.add(
        DataImport(
            filename=path.name,
            source="fundwatch-data startup import",
            rows_imported=rows_seen,
            rows_processed=rows_imported,
            status=status,
            report_json=json.dumps({"file_hash": digest, "error": error_message}),
        )
    )


def _read_csv(path: Path, kind: str) -> Tuple[List[Dict[str, Any]], int, int, int]:
    """Return ORM mappings, rows seen, invalid dates, and invalid amounts."""
    mappings: List[Dict[str, Any]] = []
    seen_hashes = set()
    invalid_dates = 0
    invalid_amounts = 0

    with path.open("r", encoding="utf-8-sig", newline="", errors="replace") as source:
        reader = csv.DictReader(source)
        headers = {_clean(header) for header in (reader.fieldnames or [])}
        missing = REQUIRED_HEADERS[kind] - headers
        if missing:
            raise ValueError(f"missing required columns: {', '.join(sorted(missing))}")

        rows_seen = 0
        for row_number, raw in enumerate(reader, start=2):
            rows_seen += 1
            row = {_clean(key): _clean(value) for key, value in raw.items() if key is not None}
            amount_column = {
                "recommended": "Recommended Amount (₹)",
                "completed": "Final Amount (₹)",
                "expenditures": "Expenditure Amount (₹)",
                "mp_summary": "Allocated Amount (₹)",
            }[kind]
            amount = _parse_rupees(row.get(amount_column))
            if row.get(amount_column) and amount is None:
                invalid_amounts += 1
            if kind == "recommended" or kind == "completed":
                date_column = "Recommendation Date" if kind == "recommended" else "Completed Date"
                event_date = _parse_date(row.get(date_column))
                if row.get(date_column) and event_date is None:
                    invalid_dates += 1
                mapping = {
                    "source_file": path.name,
                    "record_type": kind,
                    "source_row_number": row_number,
                    "work_id": row.get("Work ID") or None,
                    "work_description": row.get("Work Description") or None,
                    "category": row.get("Category") or None,
                    "mp_name": row.get("MP Name") or None,
                    "constituency": row.get("Constituency") or None,
                    "state": row.get("State") or None,
                    "house": row.get("House") or None,
                    "amount_rupees": amount,
                    "event_date": event_date,
                    "has_images": _parse_bool(row.get("Has Images")),
                    "average_rating": _parse_number(row.get("Average Rating")),
                    "ida": row.get("IDA") or None,
                }
            elif kind == "expenditures":
                expenditure_date = _parse_date(row.get("Expenditure Date"))
                if row.get("Expenditure Date") and expenditure_date is None:
                    invalid_dates += 1
                mapping = {
                    "source_file": path.name,
                    "source_row_number": row_number,
                    "mp_name": row.get("MP Name") or None,
                    "constituency": row.get("Constituency") or None,
                    "state": row.get("State") or None,
                    "house": row.get("House") or None,
                    "work_description": row.get("Work Description") or None,
                    "vendor": row.get("Vendor") or None,
                    "ida": row.get("IDA") or None,
                    "amount_rupees": amount,
                    "expenditure_date": expenditure_date,
                    "payment_status": row.get("Payment Status") or None,
                    "linkage_status": "unlinked",
                }
            else:
                mapping = {
                    "source_file": path.name,
                    "source_row_number": row_number,
                    "mp_name": row.get("MP Name") or None,
                    "constituency": row.get("Constituency") or None,
                    "state": row.get("State") or None,
                    "house": row.get("House") or None,
                    "allocated_amount_rupees": amount,
                    "recommended_amount_rupees": _parse_rupees(row.get("Amount Recommended (₹)")),
                    "expenditure_amount_rupees": _parse_rupees(row.get("Total Expenditure (₹)")),
                    "utilization_percentage": _parse_number(row.get("Utilization %")),
                    "completed_works": _parse_int(row.get("Completed Works")),
                    "recommended_works": _parse_int(row.get("Recommended Works")),
                    "completion_rate_percentage": _parse_number(row.get("Completion Rate %")),
                    "balance_not_paid_rupees": _parse_rupees(row.get("Balance Not Yet Paid to Vendors (₹)")),
                    "transaction_count": _parse_int(row.get("Transaction Count")),
                    "successful_payments": _parse_int(row.get("Successful Payments")),
                    "pending_payments": _parse_int(row.get("Pending Payments")),
                    "average_rating": _parse_number(row.get("Average Rating")),
                }
            # The source has no transaction identifier.  Include the source
            # row number so two identical-looking expenditure transactions
            # are retained rather than silently treated as duplicates.
            digest = _row_hash({"source_row_number": row_number, **row})
            if digest in seen_hashes:
                continue
            seen_hashes.add(digest)
            mapping["row_hash"] = digest
            mappings.append(mapping)
    return mappings, rows_seen, invalid_dates, invalid_amounts


def _model_for_kind(kind: str) -> Type[Any]:
    return {
        "recommended": ImportedWork,
        "completed": ImportedWork,
        "expenditures": ExpenditureAggregate,
        "mp_summary": MpSummaryRecord,
    }[kind]


def _replace_csv_rows(db: Session, model: Type[Any], filename: str, mappings: Iterable[Dict[str, Any]]) -> None:
    db.query(model).filter(model.source_file == filename).delete(synchronize_session=False)
    db.bulk_insert_mappings(model, list(mappings))


def _import_csv(db: Session, path: Path, digest: str, kind: str) -> Dict[str, Any]:
    mappings, rows_seen, invalid_dates, invalid_amounts = _read_csv(path, kind)
    _replace_csv_rows(db, _model_for_kind(kind), path.name, mappings)
    _audit(db, path, digest, rows_seen, len(mappings), "Success")
    # Keep the existing data-quality API useful for imported files.
    latest = db.query(DataImport).order_by(DataImport.id.desc()).first()
    if latest:
        latest.invalid_dates = invalid_dates
        latest.invalid_amounts = invalid_amounts
    db.commit()
    return {"filename": path.name, "rows_seen": rows_seen, "rows_imported": len(mappings), "status": "imported"}


def _import_dashboard_json(db: Session, path: Path, digest: str) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8-sig") as source:
        document = json.load(source)
    payload = document.get("data", document)
    if not isinstance(payload, dict):
        raise ValueError("dashboard JSON data must be an object")
    db.query(DashboardSnapshot).filter(DashboardSnapshot.source_file == path.name).delete(
        synchronize_session=False
    )
    db.add(
        DashboardSnapshot(
            source_file=path.name,
            file_hash=digest,
            captured_at=_parse_date(document.get("cache_timestamp")),
            payload_json=json.dumps(payload, ensure_ascii=False),
            total_allocated_rupees=_parse_rupees(payload.get("totalAllocated")),
            total_expenditure_rupees=_parse_rupees(payload.get("totalExpenditure")),
            total_recommended_rupees=_parse_rupees(payload.get("totalRecommendedAmount")),
            total_mps=_parse_int(payload.get("totalMPs")),
            total_works_completed=_parse_int(payload.get("totalWorksCompleted")),
            total_works_recommended=_parse_int(payload.get("totalWorksRecommended")),
            total_transactions=_parse_int(payload.get("totalTransactions")),
        )
    )
    _audit(db, path, digest, 1, 1, "Success")
    db.commit()
    return {"filename": path.name, "rows_seen": 1, "rows_imported": 1, "status": "imported"}


def _default_data_dir() -> Path:
    # services/startup_importer.py -> app -> backend -> repository root.
    return Path(__file__).resolve().parents[3] / "fundwatch-data"


def import_fundwatch_data(db: Session, data_dir: Optional[str] = None) -> List[Dict[str, Any]]:
    """Import all supported extracts, safely skipping unchanged file hashes."""
    root = Path(data_dir).expanduser() if data_dir else _default_data_dir()
    if not root.exists() or not root.is_dir():
        return []

    results: List[Dict[str, Any]] = []
    paths = sorted(list(root.glob("*.csv")) + list(root.glob("*.json")))
    for path in paths:
        kind = _kind_for_csv(path) if path.suffix.lower() == ".csv" else "dashboard"
        if kind is None:
            continue
        digest = _file_hash(path)
        if db.query(ImportFileAudit).filter_by(filename=path.name, file_hash=digest).first():
            results.append({"filename": path.name, "status": "skipped"})
            continue
        try:
            if kind == "dashboard":
                result = _import_dashboard_json(db, path, digest)
            else:
                result = _import_csv(db, path, digest, kind)
            results.append(result)
        except Exception as exc:
            db.rollback()
            _audit(db, path, digest, 0, 0, "Failed", str(exc))
            db.commit()
            results.append({"filename": path.name, "status": "failed", "error": str(exc)})
    return results


# A short alias makes the startup hook easy to discover for callers/tests.
import_data_files = import_fundwatch_data
