import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  FolderGit2,
  Building2,
  AlertOctagon,
  CheckSquare,
  MapPin,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/projects', label: 'Projects', icon: FolderGit2 },
  { path: '/agencies', label: 'Agencies', icon: Building2 },
  { path: '/anomalies', label: 'Anomalies', icon: AlertOctagon, badge: '7' },
  { path: '/verification', label: 'Verification', icon: CheckSquare, badge: '5' },
  { path: '/map', label: 'Map Explorer', icon: MapPin },
  { path: '/data-quality', label: 'Data Quality', icon: CheckCircle2 },
  { path: '/settings', label: 'Settings', icon: Sliders },
];

export default function Navbar() {
  const location = useLocation();
  const [readNotifications, setReadNotifications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fundwatch-read-notifications')) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const visitedItem = NAV_ITEMS.find((item) =>
      item.badge && (location.pathname === item.path || location.pathname.startsWith(`${item.path}/`))
    );

    if (visitedItem && !readNotifications.includes(visitedItem.path)) {
      const updatedNotifications = [...readNotifications, visitedItem.path];
      setReadNotifications(updatedNotifications);
      localStorage.setItem('fundwatch-read-notifications', JSON.stringify(updatedNotifications));
    }
  }, [location.pathname, readNotifications]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-xl shadow-sm">
      <div className="flex min-h-16 items-center gap-5 px-4 lg:px-6">
        <Link to="/dashboard" className="shrink-0 flex items-center gap-2 group">
          <span className="font-extrabold text-base tracking-wider text-slate-900 group-hover:text-rose-600 transition-colors">
            FUND<span className="text-rose-500">WATCH</span>
          </span>
          <span className="text-[10px] text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded">MPLADS</span>
        </Link>

        <nav aria-label="Primary navigation" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-2 scrollbar-none [&::-webkit-scrollbar]:hidden">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `shrink-0 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge && !readNotifications.includes(item.path) && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-900/50 text-rose-300 border border-rose-800/40">{item.badge}</span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
