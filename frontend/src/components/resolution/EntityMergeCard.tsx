import React from 'react';
import {
  GitMerge,
  X,
  Sparkles,
  Phone,
  Car,
  FileText,
  FolderGit2,
  CheckCircle2,
  Network,
} from 'lucide-react';
import { EntityMatchCandidate } from '../../types';
import Badge from '../common/Badge';
import ConfidenceTag from '../common/ConfidenceTag';
import MaskedValue from '../common/MaskedValue';

interface EntityMergeCardProps {
  candidate: EntityMatchCandidate;
  onApproveMerge: (id: string) => void;
  onRejectMatch: (id: string) => void;
  onViewInGraph?: (nodeId: string) => void;
}

export const EntityMergeCard: React.FC<EntityMergeCardProps> = ({
  candidate,
  onApproveMerge,
  onRejectMatch,
  onViewInGraph,
}) => {
  const isPending = candidate.status === 'pending';
  const { entity_a, entity_b } = candidate;

  return (
    <div className="p-6 rounded-3xl bg-white border border-[#E5DACB] shadow-sm hover:shadow-md transition-all space-y-5 text-[#2C241D]">
      {/* Top Meta Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Badge label={entity_a.entity_type} variant="purple" />
          <ConfidenceTag score={candidate.match_confidence} />
          <span className="text-[10px] font-mono font-bold uppercase text-[#5C5248] bg-[#F5EFE6] px-2 py-0.5 rounded-full border border-[#E5DACB]">
            Candidate Pair: #{candidate.id.slice(0, 8)}
          </span>
        </div>

        {candidate.status === 'merged' ? (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-[#2D7A58] bg-[#EAF5EF] px-2.5 py-1 rounded-full border border-[#D0EADB]">
            <CheckCircle2 className="w-3.5 h-3.5" /> Entity Match Approved & Merged
          </span>
        ) : candidate.status === 'rejected' ? (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-[#7D7268] bg-[#F5EFE6] px-2.5 py-1 rounded-full border border-[#E5DACB]">
            <X className="w-3.5 h-3.5" /> Kept as Separate Entities
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-[#9C6644] bg-[#FEF6E9] px-2.5 py-1 rounded-full border border-[#FCE4BE] animate-pulse">
            Pending Investigator Review
          </span>
        )}
      </div>

      {/* Match Reason Explanation */}
      <div className="p-4 bg-[#F5EFE6] border border-[#E5DACB] rounded-2xl text-xs text-[#2C241D] flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-[#9C6644] flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-[11px] uppercase tracking-wider text-[#9C6644]">
            Entity Resolution Match Analysis:
          </span>
          <p className="mt-0.5 leading-relaxed text-[#43382F]">{candidate.match_reason}</p>
        </div>
      </div>

      {/* Side-by-Side Entity Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        {/* Entity A (Target) */}
        <div className="p-4 rounded-2xl bg-[#F5EFE6]/60 border border-[#E5DACB] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#9C6644] tracking-wider">
              Primary Identity A (Canonical)
            </span>
            <span className="text-[10px] font-mono text-[#8C827A]">Node: {entity_a.neo4j_id}</span>
          </div>
          <div className="text-sm font-bold text-[#2C241D]">
            {entity_a.is_masked_sensitive ? (
              <MaskedValue value={entity_a.display_name} isSensitive={true} />
            ) : (
              entity_a.display_name
            )}
          </div>
        </div>

        {/* Entity B (Source to be merged) */}
        <div className="p-4 rounded-2xl bg-[#F5EFE6]/60 border border-[#E5DACB] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#D97706] tracking-wider">
              Variant Identity B (To Merge)
            </span>
            <span className="text-[10px] font-mono text-[#8C827A]">Node: {entity_b.neo4j_id}</span>
          </div>
          <div className="text-sm font-bold text-[#2C241D]">
            {entity_b.is_masked_sensitive ? (
              <MaskedValue value={entity_b.display_name} isSensitive={true} />
            ) : (
              entity_b.display_name
            )}
          </div>
        </div>
      </div>

      {/* Multi-Dimensional Context Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-[#E5DACB]/60 text-xs">
        {/* Name Variations */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#7D7268]">Name Variations:</span>
          <div className="flex flex-wrap gap-1">
            {(candidate.name_variations || [entity_a.display_name, entity_b.display_name]).map((v, i) => (
              <span key={i} className="px-2 py-0.5 bg-[#F5EFE6] text-[#43382F] font-semibold text-[11px] rounded-lg border border-[#E5DACB]">
                {v}
              </span>
            ))}
          </div>
        </div>

        {/* Associated Cases */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#7D7268] flex items-center gap-1">
            <FolderGit2 className="w-3 h-3 text-[#9C6644]" />
            Appears in Cases:
          </span>
          <div className="flex flex-wrap gap-1">
            {(candidate.cases && candidate.cases.length > 0 ? candidate.cases : ['FIC-CASE-0001']).map((c, i) => (
              <span key={i} className="px-2 py-0.5 bg-[#9C6644]/10 text-[#9C6644] font-mono font-bold text-[11px] rounded-lg border border-[#9C6644]/20">
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Associated Phones & Vehicles */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#7D7268] flex items-center gap-1">
            <Phone className="w-3 h-3 text-[#9C6644]" />
            Phones & Vehicles:
          </span>
          <div className="flex flex-wrap gap-1">
            {candidate.associated_phones && candidate.associated_phones.length > 0 ? (
              candidate.associated_phones.map((p, i) => (
                <span key={i} className="px-2 py-0.5 bg-[#EAF5EF] text-[#2D7A58] text-[11px] font-semibold rounded-lg border border-[#D0EADB]">
                  {p}
                </span>
              ))
            ) : null}
            {candidate.associated_vehicles && candidate.associated_vehicles.length > 0 ? (
              candidate.associated_vehicles.map((v, i) => (
                <span key={i} className="px-2 py-0.5 bg-[#FEF3C7] text-[#D97706] text-[11px] font-semibold rounded-lg border border-[#FDE68A] flex items-center gap-1">
                  <Car className="w-2.5 h-2.5" /> {v}
                </span>
              ))
            ) : null}
            {(!candidate.associated_phones?.length && !candidate.associated_vehicles?.length) && (
              <span className="text-[#8C827A] text-[11px] italic">Inferred from record citations</span>
            )}
          </div>
        </div>

        {/* Supporting Evidentiary Records */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#7D7268] flex items-center gap-1">
            <FileText className="w-3 h-3 text-[#9C6644]" />
            Evidentiary Sources:
          </span>
          <div className="flex flex-wrap gap-1">
            {(candidate.supporting_evidence && candidate.supporting_evidence.length > 0
              ? candidate.supporting_evidence
              : ['REC-000101', 'REC-000106']
            ).map((rec, i) => (
              <span key={i} className="px-2 py-0.5 bg-[#EBF2FA] text-[#4A6FA5] font-mono font-bold text-[11px] rounded-lg border border-[#D4E3F5]">
                {rec}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-[#E5DACB]/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {onViewInGraph && (
            <button
              type="button"
              onClick={() => onViewInGraph(entity_a.neo4j_id)}
              className="px-3 py-1.5 bg-[#F5EFE6] hover:bg-[#EAE1D5] text-[#2C241D] rounded-xl text-xs font-semibold transition-all border border-[#E5DACB] flex items-center gap-1.5 cursor-pointer"
            >
              <Network className="w-3.5 h-3.5 text-[#9C6644]" />
              <span>Inspect in Graph</span>
            </button>
          )}
          <p className="text-[11px] text-[#7D7268]">
            {isPending
              ? 'Approving merges identities into a single canonical node on the Network Graph.'
              : 'Decisions are logged to the cryptographic chain of custody.'}
          </p>
        </div>

        {isPending && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onRejectMatch(candidate.id)}
              className="px-3.5 py-1.5 bg-[#F5EFE6] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-[#43382F] border border-[#E5DACB] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reject / Keep Separate</span>
            </button>

            <button
              type="button"
              onClick={() => onApproveMerge(candidate.id)}
              className="px-4 py-1.5 bg-[#9C6644] hover:bg-[#7F4F24] text-white text-xs font-bold rounded-xl shadow-md shadow-[#9C6644]/25 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <GitMerge className="w-3.5 h-3.5" />
              <span>Approve Entity Match</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntityMergeCard;
