import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderGit2,
  Coins,
  Building2,
  AlertTriangle,
  ClipboardCheck,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { api, DATASET_UPDATED_EVENT } from '../services/api';
import MetricCard from '../components/MetricCard';
import Hero3DVisual from '../components/Hero3DVisual';
import SpendingTrendChart from '../components/SpendingTrendChart';
import RiskBadge from '../components/RiskBadge';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getSummary();
        setSummary(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();

    window.addEventListener(DATASET_UPDATED_EVENT, load);
    return () => window.removeEventListener(DATASET_UPDATED_EVENT, load);
  }, []);

  if (loading || !summary) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800/60 rounded w-1/4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-800/40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const verStatuses = [
    { label: "Submitted", count: summary.verification_status_distribution?.Submitted || 0, color: "bg-sky-500" },
    { label: "Under Review", count: summary.verification_status_distribution?.["Under Review"] || 0, color: "bg-amber-500" },
    { label: "Verified", count: summary.verification_status_distribution?.Verified || 0, color: "bg-emerald-500" },
    { label: "Rejected", count: summary.verification_status_distribution?.Rejected || 0, color: "bg-rose-500" },
    { label: "Resolved", count: summary.verification_status_distribution?.Resolved || 0, color: "bg-slate-400" }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs uppercase tracking-widest text-rose-400 font-bold">
              FundWatch Intelligence Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            MPLADS Spending Anomaly Monitor
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Explainable statistical outlier detection for Members of Parliament Local Area Development Scheme funds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/anomalies"
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-[0_0_15px_rgba(225,29,72,0.3)] transition flex items-center gap-2"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>View All Anomalies ({summary.priority_anomalies?.length || 7})</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Projects"
          value={summary.total_projects}
          subtitle="Monitored works"
          icon={FolderGit2}
          trend={{ text: "100%", label: "Centralized Ledger" }}
        />
        <MetricCard
          title="Total Expenditure"
          value={`₹${summary.total_expenditure}L`}
          subtitle="Disbursed across works"
          icon={Coins}
          trend={{ text: "Active", label: "Financial Cycle" }}
        />
        <MetricCard
          title="Agencies Analysed"
          value={summary.agencies_analysed}
          subtitle="Implementing bodies"
          icon={Building2}
          trend={{ text: "7 State", label: "Departments" }}
        />
        <MetricCard
          title="High/Critical"
          value={summary.high_critical_anomalies}
          subtitle="Require verification"
          icon={AlertTriangle}
          isCritical={true}
          trend={{ text: "Flagged", label: "Statistical Outliers" }}
        />
        <MetricCard
          title="Under Verification"
          value={summary.cases_under_verification}
          subtitle="Human review queue"
          icon={ClipboardCheck}
          trend={{ text: "Active", label: "Field Audits" }}
        />
      </div>

      {/* Hero Visual & Spending Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Hero3DVisual />

          {/* Anomaly Distribution Card */}
          <div className="glass-card rounded-xl p-5 border border-white/10">
            <h4 className="text-sm font-semibold text-white mb-1">Anomaly Severity Breakdown</h4>
            <p className="text-xs text-slate-400 mb-4">Calculated from 4-dimensional statistical weights</p>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/20">
                <span className="text-[10px] text-emerald-400 block font-semibold">LOW</span>
                <span className="text-xl font-bold text-emerald-300">
                  {summary.anomaly_distribution?.Low || 0}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/20">
                <span className="text-[10px] text-amber-400 block font-semibold">MEDIUM</span>
                <span className="text-xl font-bold text-amber-300">
                  {summary.anomaly_distribution?.Medium || 0}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-orange-950/40 border border-orange-500/20">
                <span className="text-[10px] text-orange-400 block font-semibold">HIGH</span>
                <span className="text-xl font-bold text-orange-300">
                  {summary.anomaly_distribution?.High || 0}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-500/30">
                <span className="text-[10px] text-rose-400 block font-semibold">CRITICAL</span>
                <span className="text-xl font-bold text-rose-300">
                  {summary.anomaly_distribution?.Critical || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <SpendingTrendChart data={summary.spending_trend} />
        </div>
      </div>

      {/* Priority Anomalies Section */}
      <div className="glass-card rounded-xl p-5 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">
              High Priority Alerts
            </span>
            <h3 className="text-base font-bold text-white">Priority Anomalies Requiring Verification</h3>
          </div>
          <Link
            to="/anomalies"
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
          >
            Full Table <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 text-[11px] uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3 px-3">Rank</th>
                <th className="py-3 px-3">Agency</th>
                <th className="py-3 px-3">Work Category</th>
                <th className="py-3 px-3">Current Spend</th>
                <th className="py-3 px-3">Score</th>
                <th className="py-3 px-3">Risk Level</th>
                <th className="py-3 px-3">Statistical Rationale</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-normal">
              {summary.priority_anomalies?.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-900/60 transition group">
                  <td className="py-3.5 px-3 font-bold text-white">#{idx + 1}</td>
                  <td className="py-3.5 px-3 font-medium text-white max-w-45 truncate">
                    {item.agency_name}
                  </td>
                  <td className="py-3.5 px-3 text-slate-400">{item.category}</td>
                  <td className="py-3.5 px-3 font-semibold text-white">₹{item.current_expenditure}L</td>
                  <td className="py-3.5 px-3 font-extrabold text-rose-400">
                    {item.anomaly_score}
                  </td>
                  <td className="py-3.5 px-3">
                    <RiskBadge level={item.risk_level} size="sm" />
                  </td>
                  <td className="py-3.5 px-3 max-w-xs truncate text-slate-400">
                    {item.reason}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <Link
                      to={`/anomalies/${item.id}`}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-rose-900/60 text-slate-200 hover:text-white rounded text-[11px] font-semibold border border-white/10 hover:border-rose-700/50 transition inline-flex items-center gap-1"
                    >
                      Explain <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Status Distribution Pipeline */}
      <div className="glass-card rounded-xl p-5 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-semibold text-white">Human Verification Pipeline</h4>
            <p className="text-xs text-slate-400">Current status of flagged spending anomalies across inspection stages</p>
          </div>
          <Link to="/verification" className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1">
            Verification Queue <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {verStatuses.map((st) => (
            <div key={st.label} className="p-3.5 rounded-lg bg-slate-900/80 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${st.color}`} />
                <span className="text-xs text-slate-400">{st.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{st.count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
