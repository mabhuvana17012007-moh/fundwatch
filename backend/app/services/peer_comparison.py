import numpy as np
from typing import Dict, Any, List

def compute_agency_peer_comparison(agency_id: int, all_agencies: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Compares target agency against all peer agencies across key spending metrics.
    """
    target = None
    peers = []
    
    for ag in all_agencies:
        if ag.get("id") == agency_id:
            target = ag
        else:
            peers.append(ag)
            
    if not target or not peers:
        return {
            "agency_id": agency_id,
            "peer_count": len(peers),
            "metrics": {},
            "divergence_summary": "Insufficient peer data for statistical comparison."
        }
        
    peer_avg_spending = float(np.mean([p.get("avg_spending", 0) for p in peers]))
    peer_median_spending = float(np.median([p.get("median_spending", 0) for p in peers]))
    peer_velocity = float(np.mean([p.get("spending_velocity", 1.0) for p in peers]))
    peer_anomaly_freq = float(np.mean([p.get("anomaly_count", 0) for p in peers]))

    target_avg = target.get("avg_spending", 0.0)
    target_vel = target.get("spending_velocity", 1.0)
    target_anomalies = target.get("anomaly_count", 0)

    # Calculate variances
    avg_diff_pct = ((target_avg - peer_avg_spending) / (peer_avg_spending or 1.0)) * 100.0
    vel_ratio = target_vel / (peer_velocity or 1.0)
    
    divergence_points = []
    if avg_diff_pct > 30.0:
        divergence_points.append(f"average project cost is {avg_diff_pct:.1f}% higher than the peer group mean (₹{peer_avg_spending:.1f}L)")
    elif avg_diff_pct < -25.0:
        divergence_points.append(f"average project cost is {abs(avg_diff_pct):.1f}% below the peer benchmark")

    if vel_ratio > 1.8:
        divergence_points.append(f"spending velocity ({target_vel:.1f}×) is {vel_ratio:.1f}× the peer group average ({peer_velocity:.1f}×)")

    if target_anomalies > peer_anomaly_freq * 2.0 and target_anomalies > 1:
        divergence_points.append(f"anomaly incidence ({target_anomalies} flags) is significantly above peer average ({peer_anomaly_freq:.1f})")

    if divergence_points:
        summary = f"Peer comparison indicates notable divergence: {'; '.join(divergence_points)}. Baseline monitoring and peer-level verification recommended."
    else:
        summary = "Agency operating metrics conform closely to peer group norms and historical state benchmarks."

    return {
        "agency_id": agency_id,
        "agency_name": target.get("normalized_name"),
        "peer_count": len(peers),
        "target_metrics": {
            "avg_spending": round(target_avg, 2),
            "median_spending": round(target.get("median_spending", 0.0), 2),
            "spending_velocity": round(target_vel, 2),
            "anomaly_count": target_anomalies
        },
        "peer_benchmark": {
            "avg_spending": round(peer_avg_spending, 2),
            "median_spending": round(peer_median_spending, 2),
            "spending_velocity": round(peer_velocity, 2),
            "avg_anomaly_count": round(peer_anomaly_freq, 1)
        },
        "comparison_chart_data": [
            {
                "metric": "Avg Cost (₹ Lakhs)",
                "Agency": round(target_avg, 1),
                "Peer Average": round(peer_avg_spending, 1)
            },
            {
                "metric": "Median Cost (₹ Lakhs)",
                "Agency": round(target.get("median_spending", 0.0), 1),
                "Peer Average": round(peer_median_spending, 1)
            },
            {
                "metric": "Velocity (Index)",
                "Agency": round(target_vel, 1),
                "Peer Average": round(peer_velocity, 1)
            },
            {
                "metric": "Anomaly Flags",
                "Agency": target_anomalies,
                "Peer Average": round(peer_anomaly_freq, 1)
            }
        ],
        "divergence_summary": summary
    }
