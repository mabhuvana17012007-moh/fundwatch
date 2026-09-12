/**
 * Utility for exporting anomaly tables and project lists into formatted CSV files.
 */

export function exportAnomaliesToCSV(anomalies, filename = "fundwatch_anomalies_report.csv") {
  if (!anomalies || !anomalies.length) return;

  const headers = [
    "Work ID",
    "Project Title",
    "Agency",
    "Category",
    "Current Expenditure (₹ Lakhs)",
    "Historical Baseline (₹ Lakhs)",
    "Z-Score",
    "IQR Status",
    "Spending Velocity",
    "Historical Deviation (%)",
    "Anomaly Score (0-100)",
    "Risk Level",
    "Statistical Reason"
  ];

  const rows = anomalies.map(a => [
    `"${a.work_id || ''}"`,
    `"${(a.project_title || a.title || '').replace(/"/g, '""')}"`,
    `"${(a.agency_name || a.agency || '').replace(/"/g, '""')}"`,
    `"${a.category || ''}"`,
    a.current_expenditure != null ? a.current_expenditure : a.expenditure,
    a.historical_baseline != null ? a.historical_baseline : '',
    a.z_score != null ? a.z_score : '',
    `"${a.iqr_status || 'Normal'}"`,
    a.spending_velocity != null ? `${a.spending_velocity}x` : '',
    a.historical_deviation != null ? `${a.historical_deviation}%` : '',
    a.anomaly_score != null ? a.anomaly_score : '',
    `"${a.risk_level || ''}"`,
    `"${(a.reason || a.explanation || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [
    headers.join(","),
    ...rows.map(e => e.join(","))
  ].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
