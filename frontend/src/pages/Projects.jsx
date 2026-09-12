import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ArrowUpDown, ChevronRight, Download, RefreshCw } from 'lucide-react';
import { api, DATASET_UPDATED_EVENT } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import { exportAnomaliesToCSV } from '../services/csvExport';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getProjects();
        setProjects(data);
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

  // Filter options dynamically extracted from dataset
  const states = useMemo(() => [...new Set(projects.map(p => p.state))].filter(Boolean), [projects]);
  const categories = useMemo(() => [...new Set(projects.map(p => p.category))].filter(Boolean), [projects]);
  const statuses = useMemo(() => [...new Set(projects.map(p => p.status))].filter(Boolean), [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.work_id.toLowerCase().includes(search.toLowerCase()) ||
        p.mp_name.toLowerCase().includes(search.toLowerCase()) ||
        p.district.toLowerCase().includes(search.toLowerCase());

      const matchState = !stateFilter || p.state === stateFilter;
      const matchCat = !categoryFilter || p.category === categoryFilter;
      const matchRisk = !riskFilter || p.risk_level === riskFilter;
      const matchStatus = !statusFilter || p.status === statusFilter;

      return matchSearch && matchState && matchCat && matchRisk && matchStatus;
    });
  }, [projects, search, stateFilter, categoryFilter, riskFilter, statusFilter]);

  const resetFilters = () => {
    setSearch('');
    setStateFilter('');
    setCategoryFilter('');
    setRiskFilter('');
    setStatusFilter('');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">MPLADS Projects Directory</h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse and inspect all sanctioned public works, actual expenditures, and anomaly statuses.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportAnomaliesToCSV(filteredProjects, "mplads_projects_directory.csv")}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card rounded-xl p-4 border border-white/10 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Work ID, title, MP, district..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* State Filter */}
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900/90 border border-white/10 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-rose-500"
          >
            <option value="">All States ({states.length})</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900/90 border border-white/10 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-rose-500"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Risk Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900/90 border border-white/10 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-rose-500"
          >
            <option value="">All Risk Tiers</option>
            <option value="Critical">Critical Only</option>
            <option value="High">High Only</option>
            <option value="Medium">Medium Only</option>
            <option value="Low">Low Only</option>
          </select>
        </div>

        {/* Active Filters Summary & Reset */}
        {(search || stateFilter || categoryFilter || riskFilter || statusFilter) && (
          <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5 text-slate-400">
            <span>Showing {filteredProjects.length} of {projects.length} works matching criteria</span>
            <button
              onClick={resetFilters}
              className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Projects Table */}
      <div className="glass-card rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 text-[11px] uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3 px-3">Work ID</th>
                <th className="py-3 px-3">Project Title</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Executing Agency</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Sanctioned</th>
                <th className="py-3 px-3">Expenditure</th>
                <th className="py-3 px-3">Progress</th>
                <th className="py-3 px-3">Risk Tier</th>
                <th className="py-3 px-3 text-right">Score</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProjects.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-slate-900/60 transition group cursor-pointer"
                >
                  <td className="py-3.5 px-3 font-mono font-bold text-white whitespace-nowrap">
                    {p.work_id}
                  </td>
                  <td className="py-3.5 px-3 font-medium text-white max-w-xs">
                    <Link
                      to={`/projects/${p.id}`}
                      className="hover:text-rose-400 transition block truncate"
                      title={p.title}
                    >
                      {p.title}
                    </Link>
                    <span className="text-[10px] text-slate-400 block truncate">
                      MP: {p.mp_name}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span className="text-white block">{p.district}</span>
                    <span className="text-[10px] text-slate-500">{p.state}</span>
                  </td>
                  <td className="py-3.5 px-3 max-w-40 truncate text-slate-300">
                    {p.agency_name}
                  </td>
                  <td className="py-3.5 px-3 text-slate-400 whitespace-nowrap">
                    {p.category}
                  </td>
                  <td className="py-3.5 px-3 font-medium text-slate-300">
                    ₹{p.sanctioned_amount}L
                  </td>
                  <td className="py-3.5 px-3 font-bold text-white">
                    ₹{p.expenditure}L
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="w-20">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>{p.physical_progress}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${p.physical_progress}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <RiskBadge level={p.risk_level} size="sm" />
                  </td>
                  <td className="py-3.5 px-3 text-right font-extrabold text-rose-400 font-mono">
                    {p.anomaly_score}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <Link
                      to={`/projects/${p.id}`}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded inline-block transition"
                    >
                      <ChevronRight className="w-4 h-4" />
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
