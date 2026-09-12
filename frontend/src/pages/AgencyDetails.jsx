import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  AlertOctagon,
  FolderGit2,
  TrendingUp,
  Activity,
  Coins,
  ChevronRight,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import PeerComparisonChart from '../components/PeerComparisonChart';
import SpendingTrendChart from '../components/SpendingTrendChart';

export default function AgencyDetails() {
  const { id } = useParams();
  const [agency, setAgency] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getAgencyById(id);
        setAgency(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading || !agency) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/4" />
        <div className="h-44 bg-slate-800/50 rounded-xl" />
      </div>
    );
  }

  const isCritical = agency.risk_level === "Critical";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Back Link */}
      <div>
        <Link
          to="/agencies"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Agencies
        </Link>
      </div>

      {/* Agency Header Card */}
      <div className={`glass-card rounded-xl p-6 border ${
        isCritical ? "border-rose-600/50 bg-rose-950/20" : "border-white/10"
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 uppercase tracking-wider">
                State Jurisdiction: {agency.state}
              </span>
              <RiskBadge level={agency.risk_level} size="md" />
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              {agency.normalized_name}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Original Record Name: {agency.original_name}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-900/80 border border-white/5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Disbursed</span>
              <span className="text-lg font-bold text-white">₹{agency.total_spending}L</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-white/5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Mean Project Cost</span>
              <span className="text-lg font-bold text-white">₹{agency.avg_spending}L</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-white/5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Velocity Multiplier</span>
              <span className={`text-lg font-bold ${agency.spending_velocity >= 2.0 ? "text-rose-400" : "text-white"}`}>
                {agency.spending_velocity}×
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900/80 border border-white/5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Anomaly Flags</span>
              <span className="text-lg font-bold text-rose-400">{agency.anomaly_count}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Peer Comparison Narrative & Chart */}
      {agency.peer_comparison && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <PeerComparisonChart
                data={agency.peer_comparison.comparison_chart_data}
                agencyName={agency.normalized_name}
              />
            </div>
            <div className="lg:col-span-5 flex flex-col justify-between glass-card rounded-xl p-5 border border-white/10">
              <div>
                <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-rose-400" />
                  Peer Divergence Analysis
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {agency.peer_comparison.divergence_summary}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-slate-900/60">
                  <span className="text-slate-400 block text-[10px]">Peer Group Mean</span>
                  <strong className="text-white">₹{agency.peer_comparison.peer_benchmark?.avg_spending}L</strong>
                </div>
                <div className="p-2 rounded bg-slate-900/60">
                  <span className="text-slate-400 block text-[10px]">Peer Avg Velocity</span>
                  <strong className="text-white">{agency.peer_comparison.peer_benchmark?.spending_velocity}×</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spending Trajectory */}
      <div>
        <SpendingTrendChart
          data={agency.spending_trajectory}
          title={`Fiscal Spending Trajectory: ${agency.normalized_name}`}
        />
      </div>

      {/* Linked Projects & Linked Anomalies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Linked Projects */}
        <div className="glass-card rounded-xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-white">
              Assigned Works ({agency.projects?.length || 0})
            </h4>
          </div>

          <div className="space-y-2.5">
            {agency.projects?.map(p => (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="p-3 rounded-lg bg-slate-900/70 hover:bg-slate-900 border border-white/5 hover:border-white/15 transition items-center justify-between group block"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-white">{p.work_id}</span>
                    <RiskBadge level={p.risk_level} size="sm" />
                  </div>
                  <h5 className="text-xs font-medium text-slate-200 mt-1 truncate max-w-sm">
                    {p.title}
                  </h5>
                  <span className="text-[10px] text-slate-400">
                    Expenditure: ₹{p.expenditure}L / ₹{p.sanctioned_amount}L
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
              </Link>
            ))}
          </div>
        </div>

        {/* Linked Anomalies */}
        <div className="glass-card rounded-xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-white">
              Statistical Anomaly Flags ({agency.anomalies?.length || 0})
            </h4>
          </div>

          <div className="space-y-2.5">
            {agency.anomalies?.length ? (
              agency.anomalies.map(a => (
                <Link
                  key={a.id}
                  to={`/anomalies/${a.id}`}
                  className="p-3 rounded-lg bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 hover:border-rose-700/50 transition items-center justify-between group block"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-white">{a.work_id}</span>
                      <RiskBadge level={a.risk_level} size="sm" />
                      <span className="text-[10px] text-rose-400 font-bold">Score: {a.anomaly_score}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                      {a.reason}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition shrink-0" />
                </Link>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                No active statistical anomaly flags for this agency.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
