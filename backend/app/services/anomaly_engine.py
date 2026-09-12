import numpy as np
from typing import Dict, Any, List, Optional

def calculate_z_score(x: float, mean: float, std: float) -> float:
    """
    Calculate Z-score: Z = (x - mean) / std.
    Includes zero-standard-deviation safeguard to prevent division by zero.
    """
    if std == 0 or np.isnan(std) or np.isclose(std, 0.0):
        # Safe fallback: if variance is zero, any divergence from mean is flagged based on absolute difference
        return 0.0 if np.isclose(x, mean) else (1.0 if x > mean else -1.0)
    return float((x - mean) / std)

def calculate_iqr(series: List[float], val: float, multiplier: float = 1.5) -> Dict[str, Any]:
    """
    Calculate Interquartile Range (IQR):
    Q1 (25th percentile), Q3 (75th percentile), IQR = Q3 - Q1.
    Lower Bound = Q1 - multiplier * IQR
    Upper Bound = Q3 + multiplier * IQR
    """
    if not series or len(series) < 2:
        return {
            "q1": val,
            "q3": val,
            "iqr": 0.0,
            "lower_bound": val,
            "upper_bound": val,
            "is_outlier": False,
            "status": "Normal"
        }
    
    arr = np.array(series, dtype=float)
    q1 = float(np.percentile(arr, 25))
    q3 = float(np.percentile(arr, 75))
    iqr = float(q3 - q1)
    
    lower_bound = float(q1 - multiplier * iqr)
    upper_bound = float(q3 + multiplier * iqr)
    
    is_outlier = bool(val < lower_bound or val > upper_bound)
    status = "Flagged" if is_outlier else "Normal"
    
    return {
        "q1": round(q1, 2),
        "q3": round(q3, 2),
        "iqr": round(iqr, 2),
        "lower_bound": round(lower_bound, 2),
        "upper_bound": round(upper_bound, 2),
        "is_outlier": is_outlier,
        "status": status
    }

def calculate_spending_velocity(current_rate: float, historical_avg_rate: float) -> float:
    """
    Spending Velocity: compares current period expenditure rate against historical average rate.
    Example: 4.2x indicates spending is accelerating at 4.2 times the historical baseline.
    """
    if historical_avg_rate <= 0:
        return 1.0 if current_rate <= 0 else 2.0
    velocity = float(current_rate / historical_avg_rate)
    return round(max(0.1, velocity), 2)

def calculate_historical_deviation(current: float, baseline: float) -> float:
    """
    Historical Deviation: percentage difference between current expenditure and baseline.
    Formula: ((current - baseline) / baseline) * 100
    """
    if baseline <= 0:
        return 0.0
    dev = ((current - baseline) / baseline) * 100.0
    return round(float(dev), 2)

def calculate_anomaly_score(
    z_score: float,
    iqr_flagged: bool,
    velocity: float,
    historical_deviation_pct: float,
    weights: Optional[Dict[str, float]] = None,
    z_threshold: float = 3.0
) -> Dict[str, Any]:
    """
    Computes a transparent 0-100 anomaly score with component breakdowns.
    Default weights:
      - Z-score: 30%
      - IQR: 20%
      - Velocity: 30%
      - Historical Deviation: 20%
    """
    if weights is None:
        weights = {
            "z_score": 0.30,
            "iqr": 0.20,
            "velocity": 0.30,
            "deviation": 0.20
        }

    # Normalize individual components into 0-100 sub-scores
    # 1. Z-score component: 0 at z <= 1, 50 at threshold, 100 at 2 * threshold
    abs_z = abs(z_score)
    if abs_z <= 1.0:
        z_sub = 0.0
    elif abs_z <= z_threshold:
        z_sub = ((abs_z - 1.0) / (z_threshold - 1.0)) * 50.0
    else:
        z_sub = 50.0 + min(50.0, ((abs_z - z_threshold) / z_threshold) * 50.0)

    # 2. IQR component: 100 if flagged, 0 if within bounds
    iqr_sub = 100.0 if iqr_flagged else 0.0

    # 3. Velocity component: 0 at <= 1.2x, 50 at 2.5x, 100 at >= 4.0x
    if velocity <= 1.2:
        vel_sub = 0.0
    elif velocity <= 2.5:
        vel_sub = ((velocity - 1.2) / (2.5 - 1.2)) * 50.0
    else:
        vel_sub = 50.0 + min(50.0, ((velocity - 2.5) / 1.5) * 50.0)

    # 4. Historical Deviation component: 0 at <= 15%, 50 at 50%, 100 at >= 80%
    abs_dev = max(0.0, historical_deviation_pct)
    if abs_dev <= 15.0:
        dev_sub = 0.0
    elif abs_dev <= 50.0:
        dev_sub = ((abs_dev - 15.0) / 35.0) * 50.0
    else:
        dev_sub = 50.0 + min(50.0, ((abs_dev - 50.0) / 30.0) * 50.0)

    # Weighted sum
    raw_score = (
        z_sub * weights.get("z_score", 0.30) +
        iqr_sub * weights.get("iqr", 0.20) +
        vel_sub * weights.get("velocity", 0.30) +
        dev_sub * weights.get("deviation", 0.20)
    )

    score = round(min(100.0, max(0.0, raw_score)), 1)

    # Determine risk level
    if score >= 81.0:
        risk_level = "Critical"
    elif score >= 61.0:
        risk_level = "High"
    elif score >= 31.0:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    return {
        "anomaly_score": score,
        "risk_level": risk_level,
        "components": {
            "z_score_sub": round(z_sub, 1),
            "z_score_weighted": round(z_sub * weights.get("z_score", 0.30), 1),
            "iqr_sub": round(iqr_sub, 1),
            "iqr_weighted": round(iqr_sub * weights.get("iqr", 0.20), 1),
            "velocity_sub": round(vel_sub, 1),
            "velocity_weighted": round(vel_sub * weights.get("velocity", 0.30), 1),
            "deviation_sub": round(dev_sub, 1),
            "deviation_weighted": round(dev_sub * weights.get("deviation", 0.20), 1),
            "weights_used": weights
        }
    }
