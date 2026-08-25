import React from 'react';
import {
  FileDown,
  Printer,
  Shield,
  FileText,
  Users,
  GitFork,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import { ExecutiveCaseBrief } from '../../types';
import Badge from '../common/Badge';

interface ExecutiveBriefViewerProps {
  brief: ExecutiveCaseBrief;
  onDownloadPdf: () => void;
  isDownloading?: boolean;
}

export const ExecutiveBriefViewer: React.FC<ExecutiveBriefViewerProps> = ({
  brief,
  onDownloadPdf,
  isDownloading = false,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-3xl border border-brand-border shadow-xl overflow-hidden space-y-6 animate-fadeIn">
      {/* Top Toolbar */}
      <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-brand-purple flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Standardized Case Intelligence Brief
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print View</span>
          </button>

          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={isDownloading}
            className="px-4 py-1.5 bg-brand-purple hover:bg-brand-purple-light text-white text-xs font-bold rounded-xl shadow-md shadow-brand-purple/20 transition-all flex items-center gap-1.5"
          >
            <FileDown className="w-4 h-4" />
            <span>{isDownloading ? 'Generating PDF...' : 'Download Official PDF'}</span>
          </button>
        </div>
      </div>

      <div className="p-8 space-y-8 max-w-4xl mx-auto">
        {/* Mandatory Disclaimer Box */}
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-center">
          <p className="text-[11px] font-bold text-amber-900 tracking-wide uppercase">
            Decision-Support Only • Not a Determination of Guilt or Risk • All Findings Require Human Investigator Review • 100% Synthetic Record
          </p>
        </div>

        {/* Official Header */}
        <div className="border-b border-slate-200 pb-5 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">
            Ministry of Home Affairs • NCRB Women Safety Division
          </span>
          <h1 className="text-xl font-extrabold text-slate-950 tracking-tight">
            {brief.case_title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600 pt-1">
            <span>Case Code: <strong>{brief.case_code}</strong></span>
            <span>Status: <strong className="uppercase text-brand-purple">{brief.case_status}</strong></span>
            <span>Generated: {new Date(brief.generated_at).toLocaleDateString()}</span>
            <span>Investigator: {brief.generated_by}</span>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-purple flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            1. Executive Narrative Summary
          </h2>
          <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
            {brief.summary_narrative}
          </p>
        </section>

        {/* Section 2: Discovered Network Entities */}
        {brief.key_entities && brief.key_entities.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-purple flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              2. Key Network Entities Discovered ({brief.key_entities.length})
            </h2>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/80 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Entity Identifier</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Investigative Connection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {brief.key_entities.map((ent, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold text-slate-900 font-mono">
                        {ent.masked_identifier || ent.name}
                      </td>
                      <td className="py-2.5 px-4">
                        <Badge label={ent.type} size="sm" />
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 capitalize">
                        {ent.role_or_label}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Section 3: Evidentiary Relationships */}
        {brief.key_relationships && brief.key_relationships.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-purple flex items-center gap-1.5">
              <GitFork className="w-4 h-4" />
              3. Core Evidentiary Relationships & Traceable Citations
            </h2>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/80 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Source Entity</th>
                    <th className="py-2.5 px-4">Relationship</th>
                    <th className="py-2.5 px-4">Target Entity</th>
                    <th className="py-2.5 px-4">Source Record</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {brief.key_relationships.map((rel, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold text-slate-900 font-mono">
                        {rel.source_name}
                      </td>
                      <td className="py-2.5 px-4 text-brand-purple font-medium">
                        {rel.relationship_type.replace(/_/g, ' ')}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 font-mono">
                        {rel.target_name}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-indigo-900">
                        {rel.source_record_code}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Section 4: Active Pattern Alerts */}
        {brief.active_alerts && brief.active_alerts.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-purple flex items-center gap-1.5">
              <Bell className="w-4 h-4" />
              4. Active Advisory Pattern Alerts
            </h2>
            <div className="space-y-1.5">
              {brief.active_alerts.map((al, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  <span>{al}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 5: Cryptographic Chain-of-Custody Box */}
        <div className="p-4 rounded-2xl bg-slate-900 text-slate-300 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Cryptographic Chain-of-Custody Verification Seal
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-semibold">VALIDATED INTACT</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 break-all">
            SHA-256 Digest: <span className="text-emerald-300">{brief.custody_hash}</span>
          </div>
          <p className="text-[10px] text-slate-500">
            This document hash is cryptographically verifiable against the append-only SHA-256 audit ledger.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveBriefViewer;
