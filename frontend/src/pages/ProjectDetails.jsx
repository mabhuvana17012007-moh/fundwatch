import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Building2,
  Coins,
  Activity,
  AlertOctagon,
  FileText,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import SpendingTrendChart from '../components/SpendingTrendChart';
import ExplanationCard from '../components/ExplanationCard';

export default function ProjectDetails() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [complaint, setComplaint] = useState('');
  const [complaintPhoto, setComplaintPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [complaintStatus, setComplaintStatus] = useState('');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getProjectById(id);
        setProject(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function captureLocation() {
    if (!navigator.geolocation) {
      setComplaintStatus('This browser does not support location capture.');
      return;
    }
    setComplaintStatus('Requesting current location...');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({ latitude: coords.latitude, longitude: coords.longitude });
        setComplaintStatus('Location captured.');
      },
      (error) => {
        const messages = {
          1: 'Location permission was denied. Allow location access for localhost in the browser address-bar settings, then try again.',
          2: 'Your current location could not be determined. Check device location services and try again.',
          3: 'Location request timed out. Move to an area with GPS or network coverage and try again.'
        };
        setComplaintStatus(messages[error.code] || 'Location capture failed. Check browser location permissions and try again.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function submitComplaint(event) {
    event.preventDefault();
    if (!complaint.trim() || !complaintPhoto || !location) {
      setComplaintStatus('Please enter a complaint, add a photo, and capture your location.');
      return;
    }

    setSubmittingComplaint(true);
    setComplaintStatus('Submitting complaint and photo...');
    try {
      const verification = await api.raiseComplaint({ projectId: Number(id), comment: complaint.trim() });
      await api.uploadComplaintPhoto({
        verificationId: verification.id,
        file: complaintPhoto,
        latitude: location.latitude,
        longitude: location.longitude,
        comment: complaint.trim()
      });
      setComplaintStatus(`Complaint ${verification.case_id} submitted for officer verification.`);
      setComplaint('');
      setComplaintPhoto(null);
      setLocation(null);
    } catch (error) {
      setComplaintStatus(error.message || 'Complaint submission failed.');
    } finally {
      setSubmittingComplaint(false);
    }
  }

  if (loading || !project) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/4" />
        <div className="h-44 bg-slate-800/50 rounded-xl" />
      </div>
    );
  }

  const stats = project.historical_stats || {};
  const isCritical = project.risk_level === "Critical";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          to="/projects"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Projects Directory
        </Link>
        <div className="flex items-center gap-2">
          {project.anomaly && (
            <Link
              to={`/anomalies/${project.anomaly.id}`}
              className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_12px_rgba(225,29,72,0.3)] transition"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Inspect Anomaly Diagnostics</span>
            </Link>
          )}
        </div>
      </div>

      {/* Project Hero Summary Card */}
      <div className={`glass-card rounded-xl p-6 border ${isCritical ? "border-rose-600/40 bg-rose-950/15" : "border-white/10"
        }`}>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-300 bg-slate-900 border border-white/10 px-2 py-0.5 rounded">
                {project.work_id}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {project.category}
              </span>
              <RiskBadge level={project.risk_level} size="md" />
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              {project.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {project.description}
            </p>

            {/* Key Meta Badges */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                {project.district}, {project.state} ({project.constituency})
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {project.agency_name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Target: {project.completion_date}
              </span>
            </div>
          </div>

          {/* Quick Metrics Pillar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3 min-w-70">
            <div className="p-3 rounded-lg bg-slate-900/80 border border-white/5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Sanctioned</span>
              <span className="text-lg font-bold text-white">₹{project.sanctioned_amount}L</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-white/5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Released</span>
              <span className="text-lg font-bold text-white">₹{project.released_amount}L</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-white/5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Cumulative Spend</span>
              <span className="text-lg font-bold text-rose-400">₹{project.expenditure}L</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-white/5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Physical Progress</span>
              <span className="text-lg font-bold text-emerald-400">{project.physical_progress}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Explanation Engine Component */}
      <ExplanationCard
        explanation={project.explanation}
        score={project.anomaly_score}
        riskLevel={project.risk_level}
        zScore={stats.z_score || 0}
        iqrStatus={stats.iqr_status || "Normal"}
        velocity={stats.spending_velocity || 1.0}
        historicalDeviation={stats.historical_deviation_pct || 0}
        components={project.anomaly?.score_components}
      />

      <form onSubmit={submitComplaint} className="glass-card rounded-xl p-5 border border-amber-400/25 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white">Citizen Complaint</h3>
          <p className="text-xs text-slate-400 mt-1">Report incomplete work and attach a geotagged field photo for officer verification.</p>
        </div>
        <textarea
          value={complaint}
          onChange={(event) => setComplaint(event.target.value)}
          placeholder="Describe what is incomplete or different from the reported work..."
          rows={3}
          className="w-full rounded-lg bg-slate-900/80 border border-white/10 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
        />
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => setComplaintPhoto(event.target.files?.[0] || null)}
            className="block flex-1 text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-500 file:px-3 file:py-2 file:text-xs file:font-bold file:text-slate-950"
          />
          {complaintPhoto && (
            <span className="text-xs text-slate-300 truncate max-w-48">{complaintPhoto.name}</span>
          )}
          <button type="button" onClick={captureLocation} className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-400/40 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-400/10">
            <MapPin className="w-4 h-4" />
            {location ? 'Location Captured' : 'Capture Location'}
          </button>
          <button type="submit" disabled={submittingComplaint} className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 disabled:opacity-50">
            <FileText className="w-4 h-4" />
            {submittingComplaint ? 'Submitting...' : 'Raise Complaint'}
          </button>
        </div>
        {location && (
          <p className="text-xs text-emerald-300" role="status">
            Location: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
          </p>
        )}
        {complaintStatus && <p className="text-xs text-amber-300" role="status">{complaintStatus}</p>}
      </form>

      {/* Historical Spending Trajectory & Statistical Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <SpendingTrendChart
            data={project.spending_history?.map(h => ({
              month: h.month,
              month_short: h.month.substring(0, 3),
              actual: h.actual_expenditure,
              baseline: h.baseline_expenditure,
              cumulative: h.cumulative_expenditure
            })) || []}
            title={`Monthly Spending Ledger: ${project.work_id}`}
          />
        </div>

        {/* Statistical Summary Grid */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card rounded-xl p-5 border border-white/10">
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-rose-400" />
              Underlying Statistical Indicators
            </h4>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-white/5">
                <span className="text-slate-400">Historical Baseline</span>
                <span className="font-mono font-bold text-white">₹{stats.historical_baseline || 44.0}L</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-white/5">
                <span className="text-slate-400">Historical Mean</span>
                <span className="font-mono font-bold text-white">₹{stats.average || 40.0}L</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-white/5">
                <span className="text-slate-400">Standard Deviation (σ)</span>
                <span className="font-mono font-bold text-white">{stats.standard_deviation || 7.2}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-white/5">
                <span className="text-slate-400">Calculated Z-Score</span>
                <span className="font-mono font-bold text-rose-400">{stats.z_score || 0.0}σ</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-white/5">
                <span className="text-slate-400">IQR Interquartile Range</span>
                <span className="font-mono font-bold text-white">{stats.iqr || 0.0}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-white/5">
                <span className="text-slate-400">Spending Velocity</span>
                <span className="font-mono font-bold text-rose-400">{stats.spending_velocity || 1.0}×</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-white/5">
                <span className="text-slate-400">Baseline Deviation</span>
                <span className="font-mono font-bold text-rose-400">+{stats.historical_deviation_pct || 0}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Raw Monthly Spending Records Table */}
      <div className="glass-card rounded-xl p-5 border border-white/10">
        <h4 className="text-sm font-semibold text-white mb-3">Audited Monthly Disbursement Ledger</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 text-[11px] uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="py-2.5 px-3">Month</th>
                <th className="py-2.5 px-3">Fiscal Year</th>
                <th className="py-2.5 px-3">Actual Disbursed</th>
                <th className="py-2.5 px-3">Expected Baseline</th>
                <th className="py-2.5 px-3">Cumulative Spend</th>
                <th className="py-2.5 px-3">Disbursement Velocity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {project.spending_history?.map((rec, i) => (
                <tr key={i} className="hover:bg-slate-900/60 transition">
                  <td className="py-2.5 px-3 font-medium text-white">{rec.month}</td>
                  <td className="py-2.5 px-3 text-slate-400">{rec.year}</td>
                  <td className="py-2.5 px-3 font-semibold text-white">₹{rec.actual_expenditure}L</td>
                  <td className="py-2.5 px-3 text-slate-400">₹{rec.baseline_expenditure}L</td>
                  <td className="py-2.5 px-3 text-slate-300 font-mono">₹{rec.cumulative_expenditure}L</td>
                  <td className="py-2.5 px-3 text-rose-400 font-semibold">{rec.velocity_multiplier}×</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
