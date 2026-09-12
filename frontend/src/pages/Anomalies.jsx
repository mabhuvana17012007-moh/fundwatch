import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertOctagon,
  Search,
  Download,
  Filter,
  ArrowUpDown,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import { exportAnomaliesToCSV } from '../services/csvExport';

export default function Anomalies() {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('score'); // score, velocity, z_score, deviation

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getAnomalies();
        setAnomalies(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const categories = useMemo(() => [...new Set(anomalies.map(a => a.category))].filter(Boolean), [anomalies]);

  const sortedAndFiltered = useMemo(() => {
    let result = anomalies.filter(a => {
      const matchSearch =
        !search ||
        a.work_id.toLowerCase().includes(search.toLowerCase()) ||
        a.project_title?.toLowerCase().includes(search.toLowerCase()) ||
        a.agency_name?.toLowerCase().includes(search.toLowerCase()) ||
        a.reason?.toLowerCase().includes(search.toLowerCase());

      const matchRisk = !riskFilter || a.risk_level === riskFilter;
      const matchCat = !categoryFilter || a.category === categoryFilter;

      return matchSearch && matchRisk && matchCat;
    });

    result.sort((a, b) => {
      if (sortBy === 'velocity') return (b.spending_velocity || 0) - (a.spending_velocity || 0);
      if (sortBy === 'z_score') return (b.z_score || 0) - (a.z_score || 0);
      if (sortBy === 'deviation') return (b.historical_deviation || 0) - (a.historical_deviation || 0);
      return (b.anomaly_score || 0) - (a.anomaly_score || 0);
    });

    return result;
  }, [anomalies, search, riskFilter, categoryFilter, sortBy]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs uppercase tracking-widest text-rose-400 font-bold">
              Explainable Outlier Engine
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Ranked Anomaly Detection Register
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Projects flagged by multi-dimensional statistical models (Z-score, IQR, Velocity, Baseline Deviation).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportAnomaliesToCSV(sortedAndFiltered, "fundwatch_ranked_anomalies.csv")}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export Anomaly Report</span>
          </button>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="glass-card rounded-xl p-4 border border-white/10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search anomalies by ID, agency, keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Risk Level */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900/90 border border-white/10 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-rose-500"
          >
            <option value="">All Risk Tiers</option>
            <option value="Critical">Critical Priority (81-100)</option>
            <option value="High">High Priority (61-80)</option>
            <option value="Medium">Medium Priority (31-60)</option>
            <option value="Low">Low (0-30)</option>
          </select>

          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900/90 border border-white/10 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-rose-500"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Sort Order */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-slate-900/90 border border-white/10 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-rose-500"
          >
            <option value="score">Sort by: Anomaly Score (Highest)</option>
            <option value="velocity">Sort by: Spending Velocity (Highest)</option>
            <option value="z_score">Sort by: Z-Score Divergence</option>
            <option value="deviation">Sort by: Baseline Deviation (%)</option>
          </select>
        </div>
      </div>

      {/* Anomalies Table */}
      <div className="glass-card rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 text-[11px] uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3 px-3">Rank</th>
                <th className="py-3 px-3">Work ID & Title</th>
                <th className="py-3 px-3">Agency</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Current Spend</th>
                <th className="py-3 px-3">Z-Score</th>
                <th className="py-3 px-3">IQR Status</th>
                <th className="py-3 px-3">Velocity</th>
                <th className="py-3 px-3">Baseline Dev</th>
                <th className="py-3 px-3">Anomaly Score</th>
                <th className="py-3 px-3">Risk Level</th>
                <th className="py-3 px-3 text-center">Diagnostic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedAndFiltered.map((a, idx) => (
                <tr
                  key={a.id}
                  className={`hover:bg-slate-900/60 transition group cursor-pointer ${
                    a.risk_level === 'Critical' ? 'bg-rose-950/15' : ''
                  }`}
                >
                  <td className="py-3.5 px-3 font-mono font-bold text-white">
                    #{idx + 1}
                  </td>
                  <td className="py-3.5 px-3 font-medium text-white max-w-xs">
                    <Link
                      to={`/anomalies/${a.id}`}
                      className="hover:text-rose-400 transition font-mono font-bold block"
                    >
                      {a.work_id}
                    </Link>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {a.project_title}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-300 max-w-[160px] truncate">
                    {a.agency_name}
                  </td>
                  <td className="py-3.5 px-3 text-slate-400 whitespace-nowrap">
                    {a.category}
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-white whitespace-nowrap">
                    ₹{a.current_expenditure}L
                  </td>
                  <td className="py-3.5 px-3 font-mono font-bold">
                    <span className={Math.abs(a.z_score) >= 3 ? "text-rose-400" : "text-slate-300"}>
                      {Number(a.z_score).toFixed(2)}σ
                    </span>
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      a.iqr_status === 'Flagged' ? "bg-rose-950 text-rose-300 border border-rose-900" : "bg-slate-800 text-slate-400"
                    }`}>
                      {a.iqr_status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-mono font-bold whitespace-nowrap">
                    <span className={a.spending_velocity >= 2.5 ? "text-rose-400 font-extrabold" : "text-slate-300"}>
                      {a.spending_velocity}×
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-mono whitespace-nowrap">
                    <span className={a.historical_deviation >= 50 ? "text-rose-400 font-bold" : "text-slate-300"}>
                      +{a.historical_deviation}%
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-mono font-extrabold text-rose-400 text-sm whitespace-nowrap">
                    {a.anomaly_score}
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <RiskBadge level={a.risk_level} size="sm" />
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <Link
                      to={`/anomalies/${a.id}`}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-rose-900/60 text-slate-200 hover:text-white rounded text-[11px] font-semibold border border-white/10 hover:border-rose-700/50 transition inline-flex items-center gap-1"
                    >
                      Explain <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
