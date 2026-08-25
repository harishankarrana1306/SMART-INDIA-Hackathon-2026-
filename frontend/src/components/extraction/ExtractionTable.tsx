import React from 'react';
import { Check, X, Edit3, CheckCheck } from 'lucide-react';
import { ExtractedEntity } from '../../types';
import Badge from '../common/Badge';
import ConfidenceTag from '../common/ConfidenceTag';

interface ExtractionTableProps {
  entities: ExtractedEntity[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onApprove: (id: string) => void;
  onCorrect: (entity: ExtractedEntity) => void;
  onReject: (id: string) => void;
  onBatchApprove: () => void;
}

export const ExtractionTable: React.FC<ExtractionTableProps> = ({
  entities,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onApprove,
  onCorrect,
  onReject,
  onBatchApprove,
}) => {
  const allPendingSelected =
    entities.filter((e) => e.status === 'pending').length > 0 &&
    entities
      .filter((e) => e.status === 'pending')
      .every((e) => selectedIds.includes(e.id));

  return (
    <div className="space-y-3">
      {/* Batch Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between animate-fadeIn">
          <span className="text-xs font-semibold text-purple-950 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-brand-purple text-white flex items-center justify-center text-[10px] font-bold">
              {selectedIds.length}
            </span>
            <span>Entities selected for batch staging approval</span>
          </span>
          <button
            type="button"
            onClick={onBatchApprove}
            className="px-4 py-1.5 bg-brand-purple hover:bg-brand-purple-light text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Approve Selected to Graph</span>
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-brand-border bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={allPendingSelected}
                    onChange={onSelectAll}
                    className="rounded border-slate-300 text-brand-purple focus:ring-brand-purple"
                  />
                </th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Extracted & Normalized Value</th>
                <th className="py-3 px-4">Context Snippet</th>
                <th className="py-3 px-4">Source Record</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Human Review Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60 text-xs text-slate-800">
              {entities.map((ent) => {
                const isSelected = selectedIds.includes(ent.id);
                const isPending = ent.status === 'pending';

                return (
                  <tr
                    key={ent.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-purple-50/40' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      {isPending ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelect(ent.id)}
                          className="rounded border-slate-300 text-brand-purple focus:ring-brand-purple cursor-pointer"
                        />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge label={ent.entity_type} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-900 font-mono">
                      {ent.normalized_value}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate text-[11px] italic" title={ent.context_snippet}>
                      {ent.context_snippet ? `"${ent.context_snippet}"` : '—'}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-indigo-900">
                      {ent.record_code || 'REC-SOURCE'}
                    </td>

                    <td className="py-3.5 px-4">
                      <ConfidenceTag score={ent.confidence} />
                    </td>

                    <td className="py-3.5 px-4">
                      {ent.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Check className="w-3 h-3" /> Approved
                        </span>
                      ) : ent.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <X className="w-3 h-3" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 animate-pulse">
                          Pending Review
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {isPending ? (
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => onApprove(ent.id)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 rounded-lg transition-all"
                            title="Approve to Graph"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onCorrect(ent)}
                            className="p-1.5 bg-purple-50 hover:bg-brand-purple hover:text-white text-brand-purple border border-purple-200 rounded-lg transition-all"
                            title="Correct & Approve"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onReject(ent.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 rounded-lg transition-all"
                            title="Reject Extraction"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">Reviewed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExtractionTable;
