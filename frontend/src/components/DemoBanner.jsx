import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export default function DemoBanner() {
  return (
    <div className="bg-rose-50 border-b border-rose-200 px-6 py-3 flex items-center justify-between text-slate-700">
      <div className="flex items-center space-x-2">
        
        <span className="text-xl font-extrabold tracking-tight text-rose-600">
          DashBoard
        </span>
      </div>
      <div className="flex items-center space-x-4 text-[11px] text-slate-600">
        <span className="flex items-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          
        </span>
        
      </div>
    </div>
  );
}
