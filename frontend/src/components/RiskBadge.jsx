import React from 'react';

export default function RiskBadge({ level, size = "md" }) {
  const norm = (level || "Low").toLowerCase();

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm"
  };

  if (norm === "critical") {
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-rose-950/80 text-rose-300 border border-rose-600/60 shadow-[0_0_12px_rgba(225,29,72,0.3)] ${sizeClasses[size] || sizeClasses.md}`}>
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
        Critical
      </span>
    );
  }

  if (norm === "high") {
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-orange-950/70 text-orange-300 border border-orange-500/40 ${sizeClasses[size] || sizeClasses.md}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
        High
      </span>
    );
  }

  if (norm === "medium") {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-950/60 text-amber-300 border border-amber-500/30 ${sizeClasses[size] || sizeClasses.md}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        Medium
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 ${sizeClasses[size] || sizeClasses.md}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      Low
    </span>
  );
}
