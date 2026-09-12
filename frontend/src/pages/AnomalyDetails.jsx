import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldAlert,
  FolderGit2,
  ExternalLink,
  Coins,
  Activity,
  CheckSquare,
  AlertOctagon,
  FileCheck2
} from 'lucide-react';
import { api } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import ExplanationCard from '../components/ExplanationCard';
import ScoreBreakdownChart from '../components/ScoreBreakdownChart';

export default function AnomalyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [anomaly, setAnomaly] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getAnomalyById(id);
        setAnomaly(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading || !anomaly) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/4" />
        <div className="h-56 bg-slate-800/50 rounded-xl" />
      </div>
    );
  }

  const isCritical = anomaly.risk_level === 'Critical';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          to="/anomalies"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Anomalies Register
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to={`/projects/${anomaly.project_id}`}
            className="text-xs text-slate-300 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10"
          >
            <FolderGit2 className="w-4 h-4 text-slate-400" />
            <span>Open Project Dossier</span>
          </Link>
          <Link
            to={`/verification/1`}
            className="text-xs text-white font-semibold flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 shadow-[0_0_12px_rgba(225,29,72,0.3)] transition"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Open Verification Workflow</span>
          </Link>
        </div>
      </div>

      {/* Main Diagnostic Header */}
      <div className={`glass-card rounded-xl p-6 border ${
        isCritical ? "border-rose-600/50 bg-rose-950/20" : "border-white/10"
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-white bg-slate-900 border border-white/10 px-2 py-0.5 rounded">
                {anomaly.work_id}
              </span>
              <RiskBadge level={anomaly.risk_level} size="md" />
              <span className="text-xs text-slate-400">
                {anomaly.category} • {anomaly.district}, {anomaly.state}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              {anomaly.project_title}
            </h1>
            <p className="text-xs text-slate-300">
              Implementing Agency: <strong className="text-white">{anomaly.agency_name}</strong>
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/80 p-4 rounded-xl border border-white/5">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Anomaly Score</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-rose-400 font-mono">{anomaly.anomaly_score}</span>
                <span className="text-xs text-slate-400">/100</span>
              </div>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="text-left">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Disbursed vs Base</span>
              <span className="text-lg font-bold text-white font-mono">
                ₹{anomaly.current_expenditure}L <span className="text-xs text-slate-400 font-normal">/ ₹{anomaly.historical_baseline}L</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Human-Readable Explainability Engine Banner */}
      <ExplanationCard
        explanation={anomaly.explanation}
        score={anomaly.anomaly_score}
        riskLevel={anomaly.risk_level}
        zScore={anomaly.z_score}
        iqrStatus={anomaly.iqr_status}
        velocity={anomaly.spending_velocity}
        historicalDeviation={anomaly.historical_deviation}
        components={anomaly.score_components}
      />

      {/* Attribution & Metric Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <ScoreBreakdownChart components={anomaly.score_components} />
        </div>

        <div className="lg:col-span-6 glass-card rounded-xl p-5 border border-white/10 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-rose-400" />
              Mathematical Anomaly Thresholds
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Underlying statistical detection algorithms evaluate 4 orthogonal dimensions to compute risk probability without black-box ML biases:
            </p>

            <ul className="mt-3 space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <span><strong>Z-Score ({Number(anomaly.z_score).toFixed(2)}σ):</strong> Exceeds the standard variance envelope of 3.0σ. Zero-standard-deviation guard applied.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <span><strong>IQR Status ({anomaly.iqr_status}):</strong> Value lies outside the 1.5× Interquartile Range dispersion fence.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <span><strong>Velocity Multiplier ({anomaly.spending_velocity}×):</strong> Current 60-day disbursement pace is {anomaly.spending_velocity} times the agency's historic average rate.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <span><strong>Baseline Deviation (+{anomaly.historical_deviation}%):</strong> Spend deviates substantially above the ₹{anomaly.historical_baseline}L normal reference baseline.</span>
              </li>
            </ul>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400">Non-accusatory statistical classification:</span>
            <span className="text-rose-400 font-semibold">Verification Required</span>
          </div>
        </div>
      </div>
    </div>
  );
}
