import React, { useState } from 'react';
import { Sliders, RefreshCw, CheckCircle2, Info, Save, ShieldAlert } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function Settings() {
  const { settings, saveSettings, resetDefaults } = useSettings();
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  const totalWeight = Math.round(
    (form.weight_zscore + form.weight_iqr + form.weight_velocity + form.weight_deviation) * 100
  );

  const handleChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: parseFloat(val) }));
    setSaved(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await saveSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = async () => {
    await resetDefaults();
    setForm({
      z_score_threshold: 3.0,
      iqr_multiplier: 1.5,
      weight_zscore: 0.30,
      weight_iqr: 0.20,
      weight_velocity: 0.30,
      weight_deviation: 0.20,
      low_risk_max: 30,
      medium_risk_max: 60,
      high_risk_max: 80,
      critical_risk_min: 81
    });
    setSaved(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-rose-400" />
            <span className="text-xs uppercase tracking-widest text-rose-400 font-bold">
              Algorithm Configuration
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Statistical Thresholds & Scoring Weights
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Calibrate statistical sensitivity parameters and component weights for composite anomaly detection.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Statistical Cutoff Thresholds */}
        <div className="glass-card rounded-xl p-6 border border-white/10 space-y-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Core Statistical Cutoff Thresholds
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Z-score threshold */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-300">Z-Score Cutoff (σ)</label>
                <span className="font-mono font-bold text-rose-400 text-sm">
                  {form.z_score_threshold.toFixed(1)}σ
                </span>
              </div>
              <input
                type="range"
                min="1.5"
                max="4.5"
                step="0.1"
                value={form.z_score_threshold}
                onChange={(e) => handleChange('z_score_threshold', e.target.value)}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Default: 3.0σ (Gaussian outlier boundary). Safeguarded against zero standard deviation.
              </p>
            </div>

            {/* IQR Multiplier */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-300">IQR Multiplier Fence</label>
                <span className="font-mono font-bold text-rose-400 text-sm">
                  {form.iqr_multiplier.toFixed(1)}×
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="3.0"
                step="0.1"
                value={form.iqr_multiplier}
                onChange={(e) => handleChange('iqr_multiplier', e.target.value)}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Default: 1.5× IQR (Tukey's standard fence for non-parametric outlier boundaries).
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Composite Score Weight Distribution */}
        <div className="glass-card rounded-xl p-6 border border-white/10 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">
                Composite Anomaly Score Weights (0–100 Scale)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Total weight must sum to 100%. Current sum:
                <strong className={`ml-1 font-mono ${totalWeight === 100 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {totalWeight}%
                </strong>
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Weight 1: Z-Score */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">Z-Score Divergence Weight</span>
                <span className="font-mono text-white font-bold">{Math.round(form.weight_zscore * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.60"
                step="0.05"
                value={form.weight_zscore}
                onChange={(e) => handleChange('weight_zscore', e.target.value)}
                className="w-full accent-rose-500"
              />
            </div>

            {/* Weight 2: IQR Status */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">IQR Dispersion Outlier Weight</span>
                <span className="font-mono text-white font-bold">{Math.round(form.weight_iqr * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.60"
                step="0.05"
                value={form.weight_iqr}
                onChange={(e) => handleChange('weight_iqr', e.target.value)}
                className="w-full accent-rose-500"
              />
            </div>

            {/* Weight 3: Spending Velocity */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">Disbursement Velocity Multiplier Weight</span>
                <span className="font-mono text-white font-bold">{Math.round(form.weight_velocity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.60"
                step="0.05"
                value={form.weight_velocity}
                onChange={(e) => handleChange('weight_velocity', e.target.value)}
                className="w-full accent-rose-500"
              />
            </div>

            {/* Weight 4: Historical Deviation */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">Historical Baseline Deviation Weight</span>
                <span className="font-mono text-white font-bold">{Math.round(form.weight_deviation * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.60"
                step="0.05"
                value={form.weight_deviation}
                onChange={(e) => handleChange('weight_deviation', e.target.value)}
                className="w-full accent-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Risk Classification Tiers */}
        <div className="glass-card rounded-xl p-6 border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white">Risk Classification Scale</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-center">
              <span className="font-bold text-emerald-400 block text-[11px]">Low Risk</span>
              <span className="font-mono text-white font-semibold mt-1 block">0 – 30 pts</span>
            </div>
            <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/20 text-center">
              <span className="font-bold text-amber-400 block text-[11px]">Medium Risk</span>
              <span className="font-mono text-white font-semibold mt-1 block">31 – 60 pts</span>
            </div>
            <div className="p-3 rounded-lg bg-orange-950/40 border border-orange-500/20 text-center">
              <span className="font-bold text-orange-400 block text-[11px]">High Risk</span>
              <span className="font-mono text-white font-semibold mt-1 block">61 – 80 pts</span>
            </div>
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-500/30 text-center">
              <span className="font-bold text-rose-400 block text-[11px]">Critical Risk</span>
              <span className="font-mono text-white font-semibold mt-1 block">81 – 100 pts</span>
            </div>
          </div>
        </div>

        {/* Save button & status */}
        <div className="flex items-center justify-between pt-2">
          {saved && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" /> Settings updated and applied to detection engine!
            </div>
          )}
          {!saved && <div />}

          <button
            type="submit"
            className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition shadow-[0_0_15px_rgba(225,29,72,0.3)] flex items-center gap-2 ml-auto"
          >
            <Save className="w-4 h-4" />
            <span>Apply Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
