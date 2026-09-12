import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';

export default function ScoreBreakdownChart({ components }) {
  const data = [
    {
      name: "Z-Score (30%)",
      points: components?.z_score_weighted ?? 28.5,
      max: 30,
      color: "#e11d48"
    },
    {
      name: "Velocity (30%)",
      points: components?.velocity_weighted ?? 28.0,
      max: 30,
      color: "#f43f5e"
    },
    {
      name: "IQR Outlier (20%)",
      points: components?.iqr_weighted ?? 20.0,
      max: 20,
      color: "#fb7185"
    },
    {
      name: "Deviation (20%)",
      points: components?.deviation_weighted ?? 15.5,
      max: 20,
      color: "#fda4af"
    }
  ];

  return (
    <div className="glass-card rounded-xl p-5 w-full">
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-white">Score Component Attribution</h4>
        <p className="text-xs text-slate-400">Weighted contribution to 0-100 composite anomaly score</p>
      </div>

      <div className="w-full h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis type="number" domain={[0, 30]} stroke="#64748b" fontSize={10} tickLine={false} />
            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} width={100} />
            <Tooltip
              formatter={(val) => [`${val} points`, "Attribution"]}
              contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 11 }}
            />
            <Bar dataKey="points" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
