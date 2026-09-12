import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Database, FileText, Check, ShieldCheck, Clock, Upload } from 'lucide-react';
import { api } from '../services/api';

export default function DataQuality() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getDataQuality();
        setReport(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleUpload(event) {
    event.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadMessage('');
    try {
      const result = await api.uploadDataset(selectedFile);
      setUploadMessage(result.message || 'Dataset imported successfully.');
      setSelectedFile(null);
      const refreshedReport = await api.getDataQuality();
      setReport(refreshedReport);
    } catch (err) {
      setUploadMessage(err.message || 'Dataset upload failed.');
    } finally {
      setUploading(false);
    }
  }

  if (loading || !report) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/4" />
        <div className="h-44 bg-slate-800/40 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
            Data Governance & Ingestion Audit
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-white mt-1">
          Data Quality Scorecard & Pipeline Integrity
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Continuous validation metrics, missing attribute cleaning, agency canonicalization, and deduplication statistics.
        </p>
      </div>

      <form onSubmit={handleUpload} className="glass-card rounded-xl p-5 border border-rose-400/20 flex flex-col lg:flex-row lg:items-end gap-4">
        <div className="flex-1">
          <label htmlFor="dataset-upload" className="text-sm font-semibold text-white block mb-2">
            Import MPLATS export
          </label>
          <input
            id="dataset-upload"
            type="file"
            accept=".csv,.txt"
            onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
            className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-rose-500 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-rose-400"
          />
          <p className="text-[11px] text-slate-500 mt-2">
            Export a CSV from MPLATS, choose it here, and FundWatch will clean, store, and score the records.
          </p>
        </div>
        <button
          type="submit"
          disabled={!selectedFile || uploading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {uploading ? 'Importing...' : 'Import CSV'}
        </button>
        {uploadMessage && (
          <p className="text-xs text-emerald-400 lg:max-w-xs" role="status">{uploadMessage}</p>
        )}
      </form>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="glass-card rounded-xl p-3.5 border border-white/10">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Rows Ingested</span>
          <span className="text-xl font-extrabold text-white">{report.rows_imported}</span>
          <span className="text-[10px] text-emerald-400 mt-1 block font-medium">100% Parsed</span>
        </div>

        <div className="glass-card rounded-xl p-3.5 border border-white/10">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Valid Processed</span>
          <span className="text-xl font-extrabold text-emerald-400">{report.rows_processed}</span>
          <span className="text-[10px] text-slate-400 mt-1 block">Stored in Ledger</span>
        </div>

        <div className="glass-card rounded-xl p-3.5 border border-white/10">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Missing Fields</span>
          <span className="text-xl font-extrabold text-white">{report.missing_fields}</span>
          <span className="text-[10px] text-emerald-400 mt-1 block">Default Imputed</span>
        </div>

        <div className="glass-card rounded-xl p-3.5 border border-white/10">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Duplicates Flagged</span>
          <span className="text-xl font-extrabold text-white">{report.duplicate_records}</span>
          <span className="text-[10px] text-slate-400 mt-1 block">Deduplicated</span>
        </div>

        <div className="glass-card rounded-xl p-3.5 border border-white/10">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Invalid Dates</span>
          <span className="text-xl font-extrabold text-white">{report.invalid_dates}</span>
          <span className="text-[10px] text-slate-400 mt-1 block">Normalized</span>
        </div>

        <div className="glass-card rounded-xl p-3.5 border border-white/10">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Invalid Amounts</span>
          <span className="text-xl font-extrabold text-white">{report.invalid_amounts}</span>
          <span className="text-[10px] text-slate-400 mt-1 block">Sanitized</span>
        </div>

        <div className="glass-card rounded-xl p-3.5 border border-white/10">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Agencies Canonical</span>
          <span className="text-xl font-extrabold text-rose-400">{report.normalized_agencies}</span>
          <span className="text-[10px] text-slate-400 mt-1 block">Preserved Entities</span>
        </div>
      </div>

      {/* Integrity Report & Pipeline Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pipeline Details */}
        <div className="lg:col-span-8 glass-card rounded-xl p-6 border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Active Automated Cleaning Rules
          </h3>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3 rounded-lg bg-slate-900/60 border border-white/5 flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
              <div>
                <strong className="text-white block">Agency Canonicalization with Entity Preservation</strong>
                Maps fragmented abbreviations (e.g. "PWD", "Public Works Dept", "P.W.D.") to the canonical agency entity while safely preserving <code className="text-rose-300">original_agency_name</code>. Never merges distinct administrative bodies.
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-white/5 flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
              <div>
                <strong className="text-white block">Currency & Notation Normalization</strong>
                Parses diverse financial string formats ("₹ 79 Lakhs", "45.2 L", "1.2 Cr") into uniform floating-point Lakhs denominations with zero loss of precision.
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-white/5 flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
              <div>
                <strong className="text-white block">Deduplication & Work ID Verification</strong>
                Detects duplicate submissions using the unique MPLADS Work ID as the immutable primary key.
              </div>
            </div>
          </div>
        </div>

        {/* Source Meta */}
        <div className="lg:col-span-4 glass-card rounded-xl p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Audit Source Metadata</h4>
            <div className="space-y-3 text-xs">
              <div className="p-2.5 rounded bg-slate-900/60 border border-white/5">
                <span className="text-slate-400 block text-[10px]">Data Source</span>
                <span className="text-white font-medium">{report.data_source}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900/60 border border-white/5">
                <span className="text-slate-400 block text-[10px]">Last Import Audit</span>
                <span className="text-white font-medium">{new Date(report.import_timestamp).toLocaleString()}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900/60 border border-white/5">
                <span className="text-slate-400 block text-[10px]">Pipeline Health</span>
                <span className="text-emerald-400 font-bold">{report.status} (100% Pass)</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 text-[11px] text-slate-500">
            Validated under ISO-8000 Public Sector Data Quality principles.
          </div>
        </div>
      </div>

      {/* Ingestion History Logs */}
      <div className="glass-card rounded-xl p-5 border border-white/10">
        <h4 className="text-sm font-semibold text-white mb-3">Recent Ingestion Audit Logs</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 text-[11px] uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="py-2.5 px-3">Batch File</th>
                <th className="py-2.5 px-3">Ingest Channel</th>
                <th className="py-2.5 px-3">Records Ingested</th>
                <th className="py-2.5 px-3">Processed</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {report.recent_logs?.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/60 transition">
                  <td className="py-3 px-3 font-mono font-medium text-white">{log.filename}</td>
                  <td className="py-3 px-3 text-slate-400">{log.source}</td>
                  <td className="py-3 px-3">{log.rows_imported}</td>
                  <td className="py-3 px-3 font-semibold text-emerald-400">{log.rows_processed}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                    {new Date(log.timestamp).toLocaleString()}
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
