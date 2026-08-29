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
    <div className="w-96 bg-[#F5EFE6] border-l border-[#E5DACB] h-full flex flex-col shadow-2xl z-20 overflow-y-auto animate-slideLeft text-[#2C241D]">
      {/* Panel Header */}
      <div className="p-5 border-b border-[#E5DACB] bg-[#EAE1D5] flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono font-bold uppercase text-[#9C6644] bg-[#9C6644]/10 px-2 py-0.5 rounded-lg border border-[#9C6644]/20">
              {evidence.relationship_type.replace(/_/g, ' ')}
            </span>
            <span className="text-[10px] uppercase font-semibold text-[#2D7A58] bg-[#EAF5EF] px-2 py-0.5 rounded border border-[#D0EADB]">
              Verified Link
            </span>
          </div>
          <h2 className="text-base font-bold text-[#2C241D] tracking-tight">
            Relationship Evidence Record
          </h2>
          <p className="text-xs font-mono text-[#7D7268] mt-0.5">
            Edge ID: {evidence.edge_id}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-[#7D7268] hover:text-[#2C241D] hover:bg-[#D8CBB9] transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Panel Content */}
      <div className="p-5 space-y-6 flex-1">
        {/* Connected Endpoints */}
        <div className="bg-white rounded-2xl p-4 border border-[#E5DACB] space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#7D7268]">
            Connected Entity Link
          </div>
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => onSelectNode(evidence.source_id)}
              className="flex-1 p-2.5 bg-[#F5EFE6] border border-[#E5DACB] hover:border-[#9C6644] rounded-xl text-left transition-all cursor-pointer"
            >
              <div className="text-[10px] text-[#7D7268] uppercase font-semibold">
                {evidence.source_label}
              </div>
              <div className="text-xs font-bold text-[#2C241D] truncate">
                {evidence.source_name}
              </div>
            </button>

            <ArrowRight className="w-4 h-4 text-[#9C6644] flex-shrink-0" />

            <button
              onClick={() => onSelectNode(evidence.target_id)}
              className="flex-1 p-2.5 bg-[#F5EFE6] border border-[#E5DACB] hover:border-[#9C6644] rounded-xl text-left transition-all cursor-pointer"
            >
              <div className="text-[10px] text-[#7D7268] uppercase font-semibold">
                {evidence.target_label}
              </div>
              <div className="text-xs font-bold text-[#2C241D] truncate">
                {evidence.target_name}
              </div>
            </button>
          </div>
        </div>

        {/* Traceable Explanation */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#7D7268] mb-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#9C6644]" />
            Investigative Relationship Explanation
          </h3>
          <div className="p-3.5 rounded-2xl bg-white border border-[#E5DACB] text-xs text-[#2C241D] leading-relaxed">
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7D7268] mb-2">
              Confidence Assessment
            </h3>
            <ConfidenceTag score={evidence.confidence} />
          </div>

          {evidence.date && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#E5DACB] text-xs">
              <span className="text-[#7D7268] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#8C827A]" /> Observation Date:
              </span>
              <span className="font-mono font-semibold text-[#2C241D]">{evidence.date}</span>
            </div>
          )}
        </div>

        {/* Source Record Traceability */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#7D7268] mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#9C6644]" />
            Originating Source Record
          </h3>
          <div className="p-4 rounded-2xl bg-white border border-[#E5DACB] text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold font-mono text-[#9C6644]">{evidence.source_record_code}</span>
              <Badge label={evidence.source_record_type} variant="indigo" size="sm" />
            </div>

            {evidence.raw_source_snippet && (
              <div className="p-3 rounded-xl bg-[#F5EFE6]/70 border border-[#E5DACB] text-[11px] text-[#43382F] italic">
                "{evidence.raw_source_snippet}"
              </div>
            )}

            <div className="text-[10px] text-[#2D7A58] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#2D7A58]" />
              <span>Full chain-of-custody recorded in system logs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="p-4 border-t border-[#E5DACB] bg-[#EAE1D5]">
        <DisclaimerBanner variant="light" />
      </div>
    </div>
  );
};

export default EdgeEvidencePanel;
