import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Filter, ExternalLink, ShieldAlert, Layers } from 'lucide-react';
import { api } from '../services/api';
import RiskBadge from '../components/RiskBadge';

// Custom SVG map marker generator for Leaflet
function createCustomMarker(riskLevel) {
  let color = '#10b981'; // Low emerald
  let pulse = '';

  if (riskLevel === 'Critical') {
    color = '#e11d48'; // Crimson
    pulse = '<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>';
  } else if (riskLevel === 'High') {
    color = '#f97316'; // Orange
  } else if (riskLevel === 'Medium') {
    color = '#f59e0b'; // Amber
  }

  const html = `
    <div class="relative flex items-center justify-center w-7 h-7">
      ${pulse}
      <div style="background-color: ${color};" class="w-5 h-5 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-[9px] font-bold">
        !
      </div>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-leaflet-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
}

export default function MapView() {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getMapMarkers();
        setMarkers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredMarkers = riskFilter
    ? markers.filter(m => m.risk_level === riskFilter)
    : markers;

  // Center of India (Nagpur/Pune region)
  const defaultCenter = [20.5937, 78.9629];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Geographic Project Explorer</h1>
          <p className="text-xs text-slate-400 mt-1">
            Spatial distribution of MPLADS works across Indian states, styled by statistical anomaly severity.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">Filter by Risk:</span>
          {['', 'Critical', 'High', 'Medium', 'Low'].map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                riskFilter === r
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {r || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden relative h-155">
        {/* Map Legend Floating Badge */}
        <div className="absolute top-4 right-4 z-1000 bg-slate-950/90 backdrop-blur-md border border-white/10 p-3 rounded-xl text-xs space-y-1.5 shadow-2xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Marker Anomaly Risk
          </span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping inline-block" />
            <span className="text-rose-300 font-semibold">Critical (≥81)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
            <span className="text-orange-300">High (61-80)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span className="text-amber-300">Medium (31-60)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <span className="text-emerald-300">Low (0-30)</span>
          </div>
        </div>

        {/* Info pill */}
        <div className="absolute bottom-4 left-4 z-1000 bg-slate-950/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-[11px] text-slate-400">
          Showing <strong className="text-white">{filteredMarkers.length}</strong> geocoded works • OpenStreetMap Tile Layer
        </div>

        <MapContainer
          center={defaultCenter}
          zoom={5}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {filteredMarkers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.latitude, marker.longitude]}
              icon={createCustomMarker(marker.risk_level)}
            >
              <Popup>
                <div className="p-1 min-w-55 text-xs space-y-2">
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1">
                    <span className="font-mono text-[10px] font-bold text-rose-400">
                      {marker.work_id}
                    </span>
                    <RiskBadge level={marker.risk_level} size="sm" />
                  </div>

                  <h4 className="font-bold text-white text-xs leading-tight">
                    {marker.title}
                  </h4>

                  <div className="text-[11px] text-slate-300 space-y-0.5">
                    <div>Agency: <strong className="text-slate-100">{marker.agency}</strong></div>
                    <div>Location: <span className="text-slate-300">{marker.district}, {marker.state}</span></div>
                    <div>Expenditure: <strong className="text-white">₹{marker.expenditure}L</strong></div>
                    <div>Verification: <span className="text-amber-300 font-semibold">{marker.verification_status}</span></div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="font-mono text-rose-400 font-bold">
                      Score: {marker.anomaly_score}
                    </span>
                    <Link
                      to={`/projects/${marker.id}`}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold inline-flex items-center gap-1"
                    >
                      Dossier →
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
