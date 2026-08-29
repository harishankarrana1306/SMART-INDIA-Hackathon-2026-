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
  onReject: (id: string) => void;
  onEdit: (entity: ExtractedEntity) => void;
}

export const ExtractionTable: React.FC<ExtractionTableProps> = ({
  entities,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onApprove,
  onReject,
  onEdit,
}) => {
  const allPendingSelected =
    entities.filter((e) => e.status === 'pending').length > 0 &&
    entities
      .filter((e) => e.status === 'pending')
      .every((e) => selectedIds.includes(e.id));

  if (entities.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-[#E5DACB] p-12 text-center space-y-3 shadow-xs animate-fadeIn">
        <div className="w-12 h-12 rounded-2xl bg-[#EAF5EF] text-[#2D7A58] flex items-center justify-center mx-auto border border-[#D0EADB] shadow-xs">
          <Check className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[#2C241D]">All Entities Synchronized to Graph</h3>
        <p className="text-xs text-[#7D7268] max-w-md mx-auto leading-relaxed">
          All baseline entities are already approved and active in the Knowledge Graph. When you ingest new FIRs, CDR files, or documents, newly extracted candidate entities will appear here for human review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-[#2C241D]">
      {/* Main Table Container */}
      <div className="bg-white rounded-3xl border border-[#E5DACB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5DACB] bg-[#F5EFE6] text-[11px] font-bold uppercase tracking-wider text-[#5C5248]">
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={allPendingSelected}
                    onChange={onSelectAll}
                    className="rounded border-[#E5DACB] text-[#9C6644] focus:ring-[#9C6644] cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">Entity Type</th>
                <th className="py-3.5 px-4">Extracted & Normalized Value</th>
                <th className="py-3.5 px-4">Context Snippet</th>
                <th className="py-3.5 px-4">Source Record</th>
                <th className="py-3.5 px-4">Confidence</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Human Review Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DACB]/60 text-xs text-[#2C241D]">
              {entities.map((ent) => {
                const isSelected = selectedIds.includes(ent.id);
                const isPending = ent.status === 'pending';

                return (
                  <tr
                    key={ent.id}
                    className={`hover:bg-[#F5EFE6]/50 transition-colors ${
                      isSelected ? 'bg-[#9C6644]/10' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      {isPending ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelect(ent.id)}
                          className="rounded border-[#E5DACB] text-[#9C6644] focus:ring-[#9C6644] cursor-pointer"
                        />
                      ) : (
                        <span className="text-[#8C827A]">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge label={ent.entity_type} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 font-bold text-[#2C241D] font-mono">
                      {ent.normalized_value}
                    </td>

                    <td className="py-3.5 px-4 text-[#7D7268] max-w-xs truncate text-[11px] italic" title={ent.context_snippet}>
                      {ent.context_snippet ? `"${ent.context_snippet}"` : '—'}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-[#9C6644]">
                      {ent.record_code || 'REC-SOURCE'}
                    </td>

                    <td className="py-3.5 px-4">
                      <ConfidenceTag score={ent.confidence} />
                    </td>

                    <td className="py-3.5 px-4">
                      {ent.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-[#2D7A58] bg-[#EAF5EF] px-2 py-0.5 rounded-full border border-[#D0EADB]">
                          <Check className="w-3 h-3" /> Approved
                        </span>
                      ) : ent.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-[#C24134] bg-[#FCEEED] px-2 py-0.5 rounded-full border border-[#F8D5D2]">
                          <X className="w-3 h-3" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-[#9C6644] bg-[#FEF6E9] px-2 py-0.5 rounded-full border border-[#FCE4BE] animate-pulse">
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
                            className="p-1.5 bg-[#EAF5EF] hover:bg-[#2D7A58] hover:text-white text-[#2D7A58] border border-[#D0EADB] rounded-lg transition-all cursor-pointer"
                            title="Approve to Graph"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEdit(ent)}
                            className="p-1.5 bg-[#FEF6E9] hover:bg-[#9C6644] hover:text-white text-[#9C6644] border border-[#FCE4BE] rounded-lg transition-all cursor-pointer"
                            title="Correct & Approve"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onReject(ent.id)}
                            className="p-1.5 bg-[#FCEEED] hover:bg-[#C24134] hover:text-white text-[#C24134] border border-[#F8D5D2] rounded-lg transition-all cursor-pointer"
                            title="Reject Extraction"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#8C827A] font-mono">Reviewed</span>
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
