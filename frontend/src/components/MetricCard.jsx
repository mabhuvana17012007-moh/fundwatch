import React from 'react';

export default function MetricCard({ title, value, subtitle, icon: Icon, trend, isCritical = false }) {
  return (
    <div className={`glass-card rounded-xl p-5 relative overflow-hidden transition-all duration-300 ${
      isCritical 
        ? "border-rose-600/40 bg-gradient-to-br from-rose-950/20 via-slate-900/60 to-slate-950 shadow-[0_0_20px_rgba(225,29,72,0.15)]" 
        : "hover:border-rose-900/40 hover:shadow-[0_0_15px_rgba(225,29,72,0.08)]"
    }`}>
      {/* Subtle background glow circle */}
      {isCritical && (
        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-rose-600/10 rounded-full blur-xl pointer-events-none" />
      )}

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl lg:text-3xl font-bold text-white mt-1.5 tracking-tight">{value}</h3>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${
            isCritical ? "bg-rose-500/20 text-rose-400" : "bg-slate-800/80 text-slate-300"
          }`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center text-xs">
          <span className={trend.positive ? "text-rose-400 font-semibold" : "text-emerald-400 font-semibold"}>
            {trend.text}
          </span>
          <span className="text-slate-500 ml-1.5">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
