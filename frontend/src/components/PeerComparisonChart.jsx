import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export default function PeerComparisonChart({ data = [], agencyName = "Target Agency" }) {
  return (
    <div className="glass-card rounded-xl p-5 w-full">
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-white">Cross-Agency Peer Benchmarking</h4>
        <p className="text-xs text-slate-400">Comparing {agencyName} against peer executing agencies</p>
      </div>

      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="metric" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 11 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value) => <span className="text-slate-300">{value}</span>}
            />
            <Bar dataKey="Agency" name={agencyName} fill="#e11d48" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Peer Average" name="Peer Average" fill="#64748b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
