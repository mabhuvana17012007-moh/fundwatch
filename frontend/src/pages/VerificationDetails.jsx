import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  MapPin,
  Clock,
  UserCheck,
  Building2,
  FolderGit2,
  Camera,
  ExternalLink,
  Send
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import EvidenceModal from '../components/EvidenceModal';

export default function VerificationDetails() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  // Form states
  const [status, setStatus] = useState('Under Review');
  const [reviewer, setReviewer] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getVerificationCaseById(id);
        setCaseData(data);
        if (data) {
          setStatus(data.status);
          setReviewer(data.reviewer || 'Dr. Aniruddha Kulkarni');
          setRemarks(data.remarks || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const updated = await api.updateVerificationCase(id, {
        status,
        reviewer,
        remarks
      });

      if (updated) {
        setCaseData(updated);
        setSaveSuccess(true);
        if (status === 'Verified' || status === 'Resolved') {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !caseData) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/4" />
        <div className="h-56 bg-slate-800/50 rounded-xl" />
      </div>
    );
  }

  const meta = caseData.project_meta || {};
  const isCritical = caseData.risk_level === 'Critical';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          to="/verification"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Verification Queue
        </Link>
        <Link
          to={`/projects/${caseData.project_id}`}
          className="text-xs text-slate-300 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10"
        >
          <FolderGit2 className="w-4 h-4 text-slate-400" />
          <span>View Linked Project Dossier</span>
        </Link>
      </div>

      {/* Case Header Card */}
      <div className={`glass-card rounded-xl p-6 border ${
        isCritical ? "border-rose-600/50 bg-rose-950/20" : "border-white/10"
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-white bg-slate-900 border border-white/10 px-2 py-0.5 rounded">
                Case ID: {caseData.case_id}
              </span>
              <RiskBadge level={caseData.risk_level} size="md" />
              <span className="text-xs text-slate-400 font-mono">
                Work ID: {caseData.work_id}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              {caseData.project_title}
            </h1>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {caseData.agency_name}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Submitted: {new Date(caseData.submitted_date).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/80 p-4 rounded-xl border border-white/5">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Anomaly Score</span>
              <span className="text-2xl font-black text-rose-400 font-mono">{caseData.anomaly_score}/100</span>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="text-left">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Current Case Status</span>
              <span className="text-sm font-bold text-white block">{caseData.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Progress Bar */}
      <div className="glass-card rounded-xl p-5 border border-white/10">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
          Verification Governance Workflow
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          {[
            { step: "1. Anomaly Flagged", active: true },
            { step: "2. Verification Required", active: true },
            { step: "3. Evidence Submitted", active: caseData.evidence_count > 0 },
            { step: "4. Human Review", active: caseData.status === 'Under Review' || caseData.status === 'Verified' || caseData.status === 'Resolved' },
            { step: "5. Resolution Logged", active: caseData.status === 'Verified' || caseData.status === 'Resolved' || caseData.status === 'Rejected' }
          ].map((s, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-lg border text-xs font-semibold ${
                s.active
                  ? "bg-rose-950/40 border-rose-600/50 text-rose-300"
                  : "bg-slate-900/40 border-white/5 text-slate-500"
              }`}
            >
              {s.step}
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Evidence Ledger & Audit Update Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Tamper-Evident Evidence Ledger */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-card rounded-xl p-5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Field Evidence & Cryptographic Hashes ({caseData.evidence_list?.length || 0})
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-900 border border-white/10 px-2 py-0.5 rounded">
                SHA-256 Protected
              </span>
            </div>

            {caseData.evidence_list?.length ? (
              <div className="space-y-3">
                {caseData.evidence_list.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEvidence(ev)}
                    className="p-3.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 border border-white/5 hover:border-rose-900/40 cursor-pointer transition flex items-start justify-between gap-4 group"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs font-bold text-white truncate">{ev.file_name}</span>
                      </div>
                      <p className="font-mono text-[10px] text-rose-300/80 truncate">
                        SHA-256: {ev.file_hash}
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        {ev.comment}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1">
                        <span>GPS: {ev.latitude?.toFixed(4)}, {ev.longitude?.toFixed(4)}</span>
                        <span>•</span>
                        <span>{new Date(ev.timestamp).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-[10px] font-semibold text-rose-400 group-hover:text-rose-300 block">
                        Verify Bit Integrity →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-white/10 rounded-lg">
                No field photos or documents logged yet for this case.
              </div>
            )}
          </div>
        </div>

        {/* Right: Human Reviewer Form */}
        <div className="lg:col-span-5">
          <form onSubmit={handleUpdate} className="glass-card rounded-xl p-5 border border-white/10 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-rose-400" />
                Official Human Verification Decision
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Update investigation status and record formal audit findings.
              </p>
            </div>

            {/* Status Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Case Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="Submitted">Submitted (Queued)</option>
                <option value="Under Review">Under Review (Inspection in progress)</option>
                <option value="Verified">Verified (Expenditure substantiated by evidence)</option>
                <option value="Rejected">Rejected (Unsubstantiated / Bill withheld)</option>
                <option value="Resolved">Resolved (Corrective action closed)</option>
              </select>
            </div>

            {/* Reviewer Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Auditor / Reviewer In-Charge</label>
              <input
                type="text"
                value={reviewer}
                onChange={(e) => setReviewer(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                placeholder="e.g. Dr. Aniruddha Kulkarni, District Nodal Auditor"
              />
            </div>

            {/* Auditor Remarks */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Investigation Remarks & Findings</label>
              <textarea
                rows={4}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500 resize-none"
                placeholder="Log physical site observations, reconciliation with measurement books, or bill deferment notes..."
              />
            </div>

            {saveSuccess && (
              <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Verification findings logged successfully in tamper-evident registry.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition shadow-[0_0_15px_rgba(225,29,72,0.3)] flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{saving ? "Recording Update..." : "Submit Verification Decision"}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Evidence Modal */}
      {selectedEvidence && (
        <EvidenceModal
          evidence={selectedEvidence}
          onClose={() => setSelectedEvidence(null)}
        />
      )}
    </div>
  );
}
