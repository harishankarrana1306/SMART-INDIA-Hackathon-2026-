import React from 'react';
import { X, FileText, ArrowRight, ShieldCheck, Calendar, Info } from 'lucide-react';
import { EdgeEvidence } from '../../types';
import Badge from '../common/Badge';
import ConfidenceTag from '../common/ConfidenceTag';
import DisclaimerBanner from '../common/DisclaimerBanner';

interface EdgeEvidencePanelProps {
  evidence: EdgeEvidence | null;
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
}

export const EdgeEvidencePanel: React.FC<EdgeEvidencePanelProps> = ({
  evidence,
  onClose,
  onSelectNode,
}) => {
  if (!evidence) return null;

  return (
    <div className="w-96 bg-white border-l border-brand-border h-full flex flex-col shadow-2xl z-20 overflow-y-auto animate-slideLeft">
      {/* Panel Header */}
      <div className="p-5 border-b border-brand-border bg-slate-50/70 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono font-bold uppercase text-brand-purple bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
              {evidence.relationship_type.replace(/_/g, ' ')}
            </span>
            <span className="text-[10px] uppercase font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Verified Link
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Relationship Evidence Record
          </h2>
          <p className="text-xs font-mono text-slate-500 mt-0.5">
            Edge ID: {evidence.edge_id}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Panel Content */}
      <div className="p-5 space-y-6 flex-1">
        {/* Connected Endpoints */}
        <div className="bg-slate-50/90 rounded-xl p-4 border border-slate-200/80 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Connected Entity Link
          </div>
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => onSelectNode(evidence.source_id)}
              className="flex-1 p-2.5 bg-white border border-slate-200 hover:border-brand-purple rounded-xl text-left transition-all"
            >
              <div className="text-[10px] text-brand-muted uppercase font-semibold">
                {evidence.source_label}
              </div>
              <div className="text-xs font-bold text-slate-900 truncate">
                {evidence.source_name}
              </div>
            </button>

            <ArrowRight className="w-4 h-4 text-brand-purple flex-shrink-0" />

            <button
              onClick={() => onSelectNode(evidence.target_id)}
              className="flex-1 p-2.5 bg-white border border-slate-200 hover:border-brand-purple rounded-xl text-left transition-all"
            >
              <div className="text-[10px] text-brand-muted uppercase font-semibold">
                {evidence.target_label}
              </div>
              <div className="text-xs font-bold text-slate-900 truncate">
                {evidence.target_name}
              </div>
            </button>
          </div>
        </div>

        {/* Traceable Explanation */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-brand-purple" />
            Investigative Relationship Explanation
          </h3>
          <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100 text-xs text-purple-950 leading-relaxed">
            {evidence.explanation ? (
              <p>{evidence.explanation}</p>
            ) : (
              <p className="font-semibold text-amber-800">Insufficient evidence.</p>
            )}
          </div>
        </div>

        {/* Link Confidence & Timestamp */}
        <div className="space-y-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Confidence Assessment
            </h3>
            <ConfidenceTag score={evidence.confidence} />
          </div>

          {evidence.date && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Observation Date:
              </span>
              <span className="font-mono font-semibold text-slate-800">{evidence.date}</span>
            </div>
          )}
        </div>

        {/* Source Record Traceability */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            Originating Source Record
          </h3>
          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold font-mono text-indigo-950">{evidence.source_record_code}</span>
              <Badge label={evidence.source_record_type} variant="indigo" size="sm" />
            </div>

            {evidence.raw_source_snippet && (
              <div className="p-3 rounded-lg bg-white/90 border border-indigo-100/80 text-[11px] text-slate-700 italic">
                "{evidence.raw_source_snippet}"
              </div>
            )}

            <div className="text-[10px] text-indigo-700 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-600" />
              <span>Full chain-of-custody recorded in system logs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="p-4 border-t border-brand-border bg-slate-50">
        <DisclaimerBanner variant="light" />
      </div>
    </div>
  );
};

export default EdgeEvidencePanel;
