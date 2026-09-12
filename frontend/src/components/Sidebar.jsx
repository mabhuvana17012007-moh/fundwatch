import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  Building2,
  AlertOctagon,
  CheckSquare,
  MapPin,
  CheckCircle2,
  Sliders
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/projects', label: 'Projects', icon: FolderGit2 },
  { path: '/agencies', label: 'Agencies', icon: Building2 },
  { path: '/anomalies', label: 'Anomalies', icon: AlertOctagon, badge: '7' },
  { path: '/verification', label: 'Verification', icon: CheckSquare, badge: '5' },
  { path: '/map', label: 'Map Explorer', icon: MapPin },
  { path: '/data-quality', label: 'Data Quality', icon: CheckCircle2 },
  { path: '/settings', label: 'Settings', icon: Sliders }
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-950/95 lg:bg-slate-950/70 backdrop-blur-xl border-r border-white/10 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand in sidebar header */}
        <div className="h-16 px-6 flex items-center border-b border-white/10">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-base tracking-wider text-white">
              FUND<span className="text-rose-500">WATCH</span>
            </span>
            <span className="text-[10px] text-slate-400 border border-white/10 px-1.5 py-0.5 rounded">
              MPLADS
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-rose-950/70 text-rose-300 border border-rose-800/40 shadow-[0_0_15px_rgba(225,29,72,0.15)] font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 transition-colors group-hover:text-rose-400" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-900/50 text-rose-300 border border-rose-800/40">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info in sidebar */}
        <div className="p-4 border-t border-white/10 text-[11px] text-slate-500 space-y-1">
          <div className="flex items-center justify-between">
            <span>Z-Score Baseline:</span>
            <strong className="text-slate-300">3.0σ</strong>
          </div>
          <div className="flex items-center justify-between">
            <span>IQR Boundary:</span>
            <strong className="text-slate-300">1.5×</strong>
          </div>
          <div className="pt-2 text-[10px] text-slate-500 leading-tight">
            FundWatch Anomaly Engine v1.0
          </div>
        </div>
      </aside>
    </>
  );
}
