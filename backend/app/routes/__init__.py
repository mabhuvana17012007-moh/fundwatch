from app.routes.summary import router as summary_router
from app.routes.projects import router as projects_router
from app.routes.agencies import router as agencies_router
from app.routes.anomalies import router as anomalies_router
from app.routes.verification import router as verification_router
from app.routes.evidence import router as evidence_router
from app.routes.map import router as map_router
from app.routes.data import router as data_router
from app.routes.data_quality import router as data_quality_router
from app.routes.settings import router as settings_router

__all__ = [
    "summary_router",
    "projects_router",
    "agencies_router",
    "anomalies_router",
    "verification_router",
    "evidence_router",
    "map_router",
    "data_router",
    "data_quality_router",
    "settings_router"
]
