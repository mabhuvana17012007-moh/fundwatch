import React from 'react';
import { Info, AlertCircle, ShieldAlert, CheckCircle } from 'lucide-react';
import RiskBadge from './RiskBadge';

export default function ExplanationCard({
  explanation,
  score = 0,
  riskLevel = "Low",
  zScore = 0,
  iqrStatus = "Normal",
  velocity = 1.0,
  historicalDeviation = 0,
  components = null
}) {
  // Default component score estimations if not passed
  const zScorePoints = components?.z_score_weighted ?? (Math.min(30, (Math.abs(zScore) / 3.0) * 30));
  const iqrPoints = components?.iqr_weighted ?? (iqrStatus === "Flagged" ? 20 : 0);
  const velocityPoints = components?.velocity_weighted ?? (Math.min(30, (velocity / 4.0) * 30));
  const deviationPoints = components?.deviation_weighted ?? (Math.min(20, (Math.max(0, historicalDeviation) / 80) * 20));

  const isCritical = riskLevel === "Critical" || score >= 81;
  const isHigh = riskLevel === "High" || (score >= 61 && score < 81);

  return (
    <div className={`glass-card rounded-xl p-6 border ${
      isCritical ? "border-rose-600/50 bg-rose-950/20" : isHigh ? "border-orange-500/40 bg-orange-950/20" : "border-white/10"
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${isCritical ? "bg-rose-500/20 text-rose-400" : "bg-slate-800 text-slate-300"}`}>
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Diagnostic Explainability Module
            </span>
            <h3 className="text-base font-bold text-white">Statistical Anomaly Rationale</h3>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Composite Anomaly Score</span>
            <span className="text-xl font-extrabold text-white">{score}<span className="text-xs text-slate-400 font-normal">/100</span></span>
          </div>
          <RiskBadge level={riskLevel} size="lg" />
        </div>
      </div>

      {/* Human-Readable Synthesized Explanation */}
      <div className="my-5 p-4 rounded-lg bg-slate-950/80 border border-white/10 relative">
        <div className="flex items-start gap-3">
          <Info className={`w-5 h-5 mt-0.5 shrink-0 ${isCritical ? "text-rose-400" : "text-sky-400"}`} />
          <p className="text-sm text-slate-200 leading-relaxed font-medium">
            {explanation}
          </p>
        </div>
      </div>

      {/* 4 Core Underlying Metrics Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
        {/* Metric 1: Z-Score */}
        <div className="p-3 rounded-lg bg-slate-900/60 border border-white/5">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
            <span>Z-Score</span>
            <span className="text-[10px] text-rose-400 font-semibold">{zScorePoints.toFixed(1)} / 30 pts</span>
          </div>
          <p className="text-lg font-bold text-white">{Number(zScore).toFixed(2)}σ</p>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${Math.abs(zScore) >= 3 ? "bg-rose-500" : "bg-sky-500"}`}
              style={{ width: `${Math.min(100, (Math.abs(zScore) / 4) * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {Math.abs(zScore) >= 3 ? "Baseline Violated (≥ 3.0)" : "Within Threshold (< 3.0)"}
          </span>
        </div>

        {/* Metric 2: IQR Status */}
        <div className="p-3 rounded-lg bg-slate-900/60 border border-white/5">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
            <span>IQR Dispersion</span>
            <span className="text-[10px] text-rose-400 font-semibold">{iqrPoints.toFixed(1)} / 20 pts</span>
          </div>
          <p className="text-lg font-bold text-white">{iqrStatus}</p>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${iqrStatus === "Flagged" ? "bg-rose-500" : "bg-emerald-500"}`}
              style={{ width: iqrStatus === "Flagged" ? "100%" : "25%" }}
            />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {iqrStatus === "Flagged" ? "Outside 1.5× IQR Bounds" : "Normal Interquartile Range"}
          </span>
        </div>

        {/* Metric 3: Spending Velocity */}
        <div className="p-3 rounded-lg bg-slate-900/60 border border-white/5">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
            <span>Spending Velocity</span>
            <span className="text-[10px] text-rose-400 font-semibold">{velocityPoints.toFixed(1)} / 30 pts</span>
          </div>
          <p className="text-lg font-bold text-white">{Number(velocity).toFixed(1)}×</p>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${velocity >= 2.5 ? "bg-rose-500" : "bg-amber-500"}`}
              style={{ width: `${Math.min(100, (velocity / 4.5) * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {velocity >= 3.0 ? "Severe Acceleration" : velocity >= 1.5 ? "Moderate Velocity" : "Standard Pace"}
          </span>
        </div>

        {/* Metric 4: Historical Deviation */}
        <div className="p-3 rounded-lg bg-slate-900/60 border border-white/5">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
            <span>Baseline Deviation</span>
            <span className="text-[10px] text-rose-400 font-semibold">{deviationPoints.toFixed(1)} / 20 pts</span>
          </div>
          <p className="text-lg font-bold text-white">
            {historicalDeviation > 0 ? `+${Number(historicalDeviation).toFixed(1)}%` : `${Number(historicalDeviation).toFixed(1)}%`}
          </p>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${historicalDeviation >= 50 ? "bg-rose-500" : "bg-sky-500"}`}
              style={{ width: `${Math.min(100, (Math.max(0, historicalDeviation) / 100) * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Divergence from historical mean
          </span>
        </div>
      </div>
    </div>
  );
}
