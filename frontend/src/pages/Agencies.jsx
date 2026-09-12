import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ChevronRight, ArrowUpDown, AlertTriangle, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import RiskBadge from '../components/RiskBadge';

export default function Agencies() {
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getAgencies();
        setAgencies(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/4" />
        <div className="h-64 bg-slate-800/40 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Implementing Agencies</h1>
          <p className="text-xs text-slate-400 mt-1">
            Agency-level spending profiles, velocity multipliers, and historical anomaly frequency.
          </p>
        </div>
        <div className="text-xs text-slate-400">
          Showing <strong className="text-white">{agencies.length}</strong> Executing Agencies
        </div>
      </div>

      {/* Agencies Table */}
      <div className="glass-card rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 text-[11px] uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3 px-4">Implementing Agency</th>
                <th className="py-3 px-4">State Jurisdiction</th>
                <th className="py-3 px-4">Assigned Projects</th>
                <th className="py-3 px-4">Total Spending</th>
                <th className="py-3 px-4">Average Cost</th>
                <th className="py-3 px-4">Median Cost</th>
                <th className="py-3 px-4">Velocity Multiplier</th>
                <th className="py-3 px-4 text-center">Anomaly Count</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-normal">
              {agencies.map((agency) => (
                <tr
                  key={agency.id}
                  className="hover:bg-slate-900/60 transition group cursor-pointer"
                >
                  <td className="py-4 px-4 font-semibold text-white max-w-xs">
                    <Link
                      to={`/agencies/${agency.id}`}
                      className="hover:text-rose-400 transition block truncate"
                    >
                      {agency.normalized_name}
                    </Link>
                    <span className="text-[10px] text-slate-500 block truncate">
                      Orig: {agency.original_name}
                    </span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-slate-300">
                    {agency.state}
                  </td>
                  <td className="py-4 px-4 font-mono font-medium text-white">
                    {agency.project_count || 3} Works
                  </td>
                  <td className="py-4 px-4 font-bold text-white whitespace-nowrap">
                    ₹{agency.total_spending}L
                  </td>
                  <td className="py-4 px-4 text-slate-300 whitespace-nowrap">
                    ₹{agency.avg_spending}L
                  </td>
                  <td className="py-4 px-4 text-slate-400 whitespace-nowrap">
                    ₹{agency.median_spending}L
                  </td>
                  <td className="py-4 px-4 font-mono font-bold whitespace-nowrap">
                    <span className={agency.spending_velocity >= 2.0 ? "text-rose-400" : "text-slate-300"}>
                      {agency.spending_velocity}×
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center font-bold">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      agency.anomaly_count > 0 ? "bg-rose-950 text-rose-300 border border-rose-900" : "bg-slate-800 text-slate-400"
                    }`}>
                      {agency.anomaly_count}
                    </span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <RiskBadge level={agency.risk_level} size="sm" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Link
                      to={`/agencies/${agency.id}`}
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
