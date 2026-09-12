import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import DemoBanner from './components/DemoBanner';
import { SettingsProvider } from './context/SettingsContext';

// Pages
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Agencies from './pages/Agencies';
import AgencyDetails from './pages/AgencyDetails';
import Anomalies from './pages/Anomalies';
import AnomalyDetails from './pages/AnomalyDetails';
import Verification from './pages/Verification';
import VerificationDetails from './pages/VerificationDetails';
import MapView from './pages/MapView';
import DataQuality from './pages/DataQuality';
import Settings from './pages/Settings';

export default function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <div className="light-theme min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-rose-600 selection:text-white">
          {/* Top Demo Data Disclaimer Banner */}
          <DemoBanner />

          {/* Navigation Header */}
          <Navbar />

          <div className="flex-1 flex">
            <main className="flex-1 min-w-0 flex flex-col justify-between">
              <div className="flex-1">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/projects/:id" element={<ProjectDetails />} />
                  <Route path="/agencies" element={<Agencies />} />
                  <Route path="/agencies/:id" element={<AgencyDetails />} />
                  <Route path="/anomalies" element={<Anomalies />} />
                  <Route path="/anomalies/:id" element={<AnomalyDetails />} />
                  <Route path="/verification" element={<Verification />} />
                  <Route path="/verification/:id" element={<VerificationDetails />} />
                  <Route path="/map" element={<MapView />} />
                  <Route path="/data-quality" element={<DataQuality />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </div>

              {/* Minimal Professional Footer */}
              <footer className="mt-12 py-4 px-6 border-t border-white/5 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div>
                  FUNDWATCH • Explainable Public Spending Anomaly Detection & Monitoring Dashboard
                </div>
                <div className="text-slate-400">
                  Non-Accusatory Diagnostic Classification Framework
                </div>
              </footer>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </SettingsProvider>
  );
}
