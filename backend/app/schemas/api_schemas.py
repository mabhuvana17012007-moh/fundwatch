from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ProjectBase(BaseModel):
    work_id: str
    title: str
    state: str
    district: str
    constituency: str
    mp_name: str
    category: str
    description: Optional[str] = None
    sanctioned_amount: float
    released_amount: float
    expenditure: float
    physical_progress: float
    status: str
    completion_date: Optional[str] = None
    latitude: float
    longitude: float
    risk_level: str
    anomaly_score: float

class ProjectResponse(ProjectBase):
    id: int
    agency_name: Optional[str] = None

    class Config:
        from_attributes = True

class SpendingRecordResponse(BaseModel):
    id: int
    month: str
    year: int
    month_index: int
    actual_expenditure: float
    baseline_expenditure: float
    cumulative_expenditure: float
    velocity_multiplier: float

    class Config:
        from_attributes = True

class ProjectDetailResponse(ProjectResponse):
    agency_id: Optional[int] = None
    spending_history: List[SpendingRecordResponse] = []
    historical_stats: Optional[Dict[str, Any]] = None
    explanation: Optional[str] = None
    anomaly: Optional[Dict[str, Any]] = None

class AgencyResponse(BaseModel):
    id: int
    original_name: str
    normalized_name: str
    state: str
    total_spending: float
    avg_spending: float
    median_spending: float
    std_dev: float
    spending_velocity: float
    anomaly_count: int
    risk_level: str
    project_count: Optional[int] = 0

    class Config:
        from_attributes = True

class AgencyDetailResponse(AgencyResponse):
    projects: List[ProjectResponse] = []
    anomalies: List[Dict[str, Any]] = []
    spending_trajectory: List[Dict[str, Any]] = []
    peer_comparison: Optional[Dict[str, Any]] = None

class AnomalyResponse(BaseModel):
    id: int
    project_id: int
    agency_id: int
    work_id: str
    category: str
    current_expenditure: float
    historical_baseline: float
    z_score: float
    iqr_status: str
    spending_velocity: float
    historical_deviation: float
    anomaly_score: float
    risk_level: str
    reason: str
    agency_name: Optional[str] = None
    project_title: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None

    class Config:
        from_attributes = True

class AnomalyDetailResponse(AnomalyResponse):
    score_components: Optional[Dict[str, Any]] = None
    verification_case_id: Optional[str] = None
    explanation: str

class ExplanationResponse(BaseModel):
    anomaly_id: int
    work_id: str
    anomaly_score: float
    risk_level: str
    explanation: str
    metrics: Dict[str, Any]

class EvidenceResponse(BaseModel):
    id: int
    verification_id: int
    file_name: str
    file_hash: str
    file_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    timestamp: datetime
    comment: Optional[str] = None
    is_verified: bool

    class Config:
        from_attributes = True

class VerificationResponse(BaseModel):
    id: int
    case_id: str
    project_id: int
    work_id: str
    agency_id: int
    agency_name: Optional[str] = None
    project_title: Optional[str] = None
    anomaly_score: float
    risk_level: str
    status: str
    reviewer: Optional[str] = None
    comment: Optional[str] = None
    remarks: Optional[str] = None
    submitted_date: datetime
    updated_at: datetime
    evidence_count: int = 0

    class Config:
        from_attributes = True

class VerificationDetailResponse(VerificationResponse):
    explanation: Optional[str] = None
    project_meta: Optional[Dict[str, Any]] = None
    evidence_list: List[EvidenceResponse] = []

class VerificationUpdateRequest(BaseModel):
    status: str # Submitted, Under Review, Verified, Rejected, Resolved
    reviewer: Optional[str] = None
    remarks: Optional[str] = None
    comment: Optional[str] = None

class VerificationCreateRequest(BaseModel):
    project_id: int
    work_id: str
    comment: Optional[str] = "Field verification requested"
    reviewer: Optional[str] = "Assigned Inspector"

class EvidenceUploadRequest(BaseModel):
    verification_id: int
    file_name: str
    file_content_base64: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    comment: Optional[str] = None

class MapProjectResponse(BaseModel):
    id: int
    work_id: str
    title: str
    agency: str
    state: str
    district: str
    category: str
    expenditure: float
    anomaly_score: float
    risk_level: str
    verification_status: str
    latitude: float
    longitude: float

class DataQualityResponse(BaseModel):
    rows_imported: int
    rows_processed: int
    missing_fields: int
    duplicate_records: int
    invalid_dates: int
    invalid_amounts: int
    normalized_agencies: int
    import_timestamp: str
    data_source: str
    status: str
    recent_logs: List[Dict[str, Any]] = []

class SettingsSchema(BaseModel):
    z_score_threshold: float = 3.0
    iqr_multiplier: float = 1.5
    weight_zscore: float = 0.30
    weight_iqr: float = 0.20
    weight_velocity: float = 0.30
    weight_deviation: float = 0.20

class SummaryResponse(BaseModel):
    total_projects: int
    total_expenditure: float
    agencies_analysed: int
    high_critical_anomalies: int
    cases_under_verification: int
    priority_anomalies: List[AnomalyResponse] = []
    spending_trend: List[Dict[str, Any]] = []
    anomaly_distribution: Dict[str, int] = {}
    verification_status_distribution: Dict[str, int] = {}
