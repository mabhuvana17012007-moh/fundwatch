from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.settings import SystemSetting
from app.schemas.api_schemas import SettingsSchema

router = APIRouter(prefix="/api/settings", tags=["Settings"])

DEFAULT_SETTINGS = {
    "z_score_threshold": 3.0,
    "iqr_multiplier": 1.5,
    "weight_zscore": 0.30,
    "weight_iqr": 0.20,
    "weight_velocity": 0.30,
    "weight_deviation": 0.20
}

@router.get("", response_model=SettingsSchema)
def get_settings(db: Session = Depends(get_db)):
    settings_dict = {}
    rows = db.query(SystemSetting).all()
    for r in rows:
        try:
            settings_dict[r.key] = float(r.value)
        except ValueError:
            pass

    return SettingsSchema(
        z_score_threshold=settings_dict.get("z_score_threshold", DEFAULT_SETTINGS["z_score_threshold"]),
        iqr_multiplier=settings_dict.get("iqr_multiplier", DEFAULT_SETTINGS["iqr_multiplier"]),
        weight_zscore=settings_dict.get("weight_zscore", DEFAULT_SETTINGS["weight_zscore"]),
        weight_iqr=settings_dict.get("weight_iqr", DEFAULT_SETTINGS["weight_iqr"]),
        weight_velocity=settings_dict.get("weight_velocity", DEFAULT_SETTINGS["weight_velocity"]),
        weight_deviation=settings_dict.get("weight_deviation", DEFAULT_SETTINGS["weight_deviation"])
    )

@router.post("", response_model=SettingsSchema)
def update_settings(payload: SettingsSchema, db: Session = Depends(get_db)):
    updates = {
        "z_score_threshold": str(payload.z_score_threshold),
        "iqr_multiplier": str(payload.iqr_multiplier),
        "weight_zscore": str(payload.weight_zscore),
        "weight_iqr": str(payload.weight_iqr),
        "weight_velocity": str(payload.weight_velocity),
        "weight_deviation": str(payload.weight_deviation)
    }

    for k, v in updates.items():
        row = db.query(SystemSetting).filter(SystemSetting.key == k).first()
        if row:
            row.value = v
        else:
            db.add(SystemSetting(key=k, value=v, description=f"Updated parameter {k}"))
    db.commit()

    return payload
