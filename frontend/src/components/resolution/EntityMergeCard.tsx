import React from 'react';
import { GitMerge, X, Sparkles } from 'lucide-react';
import { EntityMatchCandidate } from '../../types';
import Badge from '../common/Badge';
import ConfidenceTag from '../common/ConfidenceTag';
import MaskedValue from '../common/MaskedValue';

interface EntityMergeCardProps {
  candidate: EntityMatchCandidate;
  onApproveMerge: (id: string) => void;
  onRejectMatch: (id: string) => void;
  canMerge: boolean; // supervisor or admin role
}

export const EntityMergeCard: React.FC<EntityMergeCardProps> = ({
  candidate,
  onApproveMerge,
  onRejectMatch,
  canMerge,
}) => {
  const isPending = candidate.status === 'pending';
  const { entity_a, entity_b } = candidate;

  return (
    <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-sm hover:shadow-md transition-all space-y-5">
      {/* Top Meta Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge label={entity_a.entity_type} variant="purple" />
          <ConfidenceTag score={candidate.match_confidence} />
        </div>

        {candidate.status === 'merged' ? (
          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Entities Merged
          </span>
        ) : candidate.status === 'rejected' ? (
          <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
            Merge Rejected
          </span>
        ) : (
          <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            Pending Supervisor Review
          </span>
        )}
      </div>

      {/* Match Reason Explanation */}
      <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-xl text-xs text-purple-950 flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-brand-purple flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-[11px] uppercase text-brand-purple">
            Similarity Intelligence Explanation:
          </span>
          <p className="mt-0.5">{candidate.match_reason}</p>
        </div>
      </div>

      {/* Side-by-Side Entity Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        {/* Entity A (Target) */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="text-[10px] uppercase font-bold text-brand-purple tracking-wider">
            Primary Entity A (Surviving Target)
          </div>
          <div className="text-sm font-bold text-slate-900">
            {entity_a.is_masked_sensitive ? (
              <MaskedValue value={entity_a.display_name} isSensitive={true} />
            ) : (
              entity_a.display_name
            )}
          </div>
          <p className="text-[11px] font-mono text-slate-500">
            Node ID: {entity_a.neo4j_id}
          </p>
        </div>

        {/* Entity B (Source to be merged) */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">
            Duplicate Entity B (To Merge into A)
          </div>
          <div className="text-sm font-bold text-slate-900">
            {entity_b.is_masked_sensitive ? (
              <MaskedValue value={entity_b.display_name} isSensitive={true} />
            ) : (
              entity_b.display_name
            )}
          </div>
          <p className="text-[11px] font-mono text-slate-500">
            Node ID: {entity_b.neo4j_id}
          </p>
        </div>
      </div>

      {/* Action Footer */}
      {isPending && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[11px] text-brand-muted">
            {canMerge
              ? 'Merging rewires all graph connections and consolidates aliases.'
              : 'Supervisor authorization required to merge entities.'}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onRejectMatch(candidate.id)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-600 border border-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reject Match</span>
            </button>

            {canMerge && (
              <button
                type="button"
                onClick={() => onApproveMerge(candidate.id)}
                className="px-4 py-1.5 bg-brand-purple hover:bg-brand-purple-light text-white text-xs font-bold rounded-xl shadow-md shadow-brand-purple/20 transition-all flex items-center gap-1.5"
              >
                <GitMerge className="w-3.5 h-3.5" />
                <span>Approve Merge (Supervisor)</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EntityMergeCard;
