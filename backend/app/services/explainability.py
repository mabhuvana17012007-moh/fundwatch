from typing import Dict, Any, List

def generate_explanation(
    current_expenditure: float,
    baseline: float,
    z_score: float,
    iqr_status: str,
    velocity: float,
    historical_deviation: float,
    z_threshold: float = 3.0,
    anomaly_score: float = 0.0,
    risk_level: str = "Low"
) -> str:
    """
    Synthesizes clear, objective, non-defamatory human-readable explanations 
    grounded strictly in statistical metrics.
    
    STRICT GOVERNANCE RULES:
    - Never uses accusatory or defamatory terminology such as 'fraud', 'scam', or 'corruption'.
    - Uses non-judgmental diagnostic terms: 'Anomaly Detected', 'Requires Verification',
      'Unusual Spending Pattern', 'Baseline Violated', 'Verification Required'.
    """
    reasons: List[str] = []
    
    # 1. Historical Baseline & Deviation Check
    if historical_deviation > 50.0:
        reasons.append(
            f"current expenditure (₹{current_expenditure:.1f}L) is {historical_deviation:.1f}% above the historical agency baseline (₹{baseline:.1f}L)"
        )
    elif historical_deviation > 20.0:
        reasons.append(
            f"current spending exceeds the historical baseline by {historical_deviation:.1f}%"
        )
    elif historical_deviation < -30.0:
        reasons.append(
            f"spending is significantly stalled, lagging {abs(historical_deviation):.1f}% below baseline expectations"
        )

    # 2. Z-Score Indicator
    abs_z = abs(z_score)
    if abs_z >= z_threshold:
        reasons.append(
            f"the Z-score ({z_score:.2f}) exceeds the configured statistical threshold of {z_threshold:.1f}"
        )
    elif abs_z >= 2.0:
        reasons.append(
            f"the Z-score ({z_score:.2f}) shows elevated variance beyond 2 standard deviations"
        )

    # 3. IQR Outlier Bound
    if iqr_status == "Flagged":
        reasons.append("the value falls outside the interquartile range (IQR) expected dispersion boundaries")

    # 4. Spending Velocity Acceleration
    if velocity >= 3.0:
        reasons.append(f"recent spending velocity is accelerating rapidly at {velocity:.1f}× the historical average")
    elif velocity >= 1.8:
        reasons.append(f"spending velocity ({velocity:.1f}×) is noticeably elevated compared to peer cycles")

    # Compose synthesis
    if not reasons:
        return (
            "Spending pattern aligns within normal statistical parameters. No baseline violation detected. "
            "Continuous automated monitoring remains active."
        )

    explanation_body = ", ".join(reasons)
    
    if risk_level in ["Critical", "High"]:
        conclusion = "Multiple statistical indicators are simultaneously flagged. Anomaly Detected — Verification Required before further fund disbursal."
    elif risk_level == "Medium":
        conclusion = "Unusual spending pattern observed. Baseline Violated — Requires Verification by field audit."
    else:
        conclusion = "Minor variance observed within acceptable tolerance limits."

    return f"Anomaly detected because {explanation_body}. {conclusion}"
