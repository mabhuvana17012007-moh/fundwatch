import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Search, Filter, ShieldCheck, ChevronRight, FileCheck, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import RiskBadge from '../components/RiskBadge';

export default function Verification() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getVerificationCases();
        setCases(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredCases = cases.filter(c => {
    const matchStatus = !statusFilter || c.status === statusFilter;
    const matchSearch =
      !search ||
      c.case_id.toLowerCase().includes(search.toLowerCase()) ||
      c.work_id.toLowerCase().includes(search.toLowerCase()) ||
      c.project_title?.toLowerCase().includes(search.toLowerCase()) ||
      c.agency_name?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Under Review':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-600/40">Under Review</span>;
      case 'Verified':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-600/40">Verified</span>;
      case 'Rejected':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-600/40">Rejected</span>;
      case 'Resolved':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-600/40">Resolved</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-950/80 text-sky-300 border border-sky-600/40">Submitted</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
              Human-in-the-Loop Review System
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Verification Cases Queue
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Investigate statistical triggers, review tamper-evident SHA-256 field photos, and log official auditor remarks.
          </p>
        </div>

        <div className="text-xs text-slate-400">
          Total Queue: <strong className="text-white">{cases.length} Cases</strong>
        </div>
      </div>

      {/* Toolbar & Status Filters */}
      <div className="glass-card rounded-xl p-4 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search cases by Case ID, work, agency..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        {/* Status Pill Filters */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {['', 'Submitted', 'Under Review', 'Verified', 'Rejected', 'Resolved'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === st
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-white/5'
              }`}
            >
              {st || 'All Cases'}
            </button>
          ))}
        </div>
      </div>

      {/* Cases Table */}
      <div className="glass-card rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 text-[11px] uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Work ID & Project</th>
                <th className="py-3 px-4">Implementing Agency</th>
                <th className="py-3 px-4 text-center">Anomaly Score</th>
                <th className="py-3 px-4">Risk Tier</th>
                <th className="py-3 px-4">Assigned Auditor</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Submitted Date</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCases.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-slate-900/60 transition group cursor-pointer"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                    <Link to={`/verification/${c.id}`} className="hover:text-rose-400 transition">
                      {c.case_id}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <span className="font-mono text-[11px] text-slate-400 block">{c.work_id}</span>
                    <span className="text-white font-medium truncate block">{c.project_title}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 max-w-40 truncate">
                    {c.agency_name}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-400">
                    {c.anomaly_score}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <RiskBadge level={c.risk_level} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                    {c.reviewer || 'Unassigned'}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getStatusBadge(c.status)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                    {new Date(c.submitted_date).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Link
                      to={`/verification/${c.id}`}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-rose-900/60 text-slate-200 hover:text-white rounded text-[11px] font-semibold border border-white/10 hover:border-rose-700/50 transition inline-flex items-center gap-1"
                    >
                      Audit <ArrowRight className="w-3 h-3" />
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
