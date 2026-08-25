import React, { useState } from 'react';
import { X, Check, Edit3 } from 'lucide-react';
import { ExtractedEntity, EntityType } from '../../types';

interface EntityCorrectionModalProps {
  entity: ExtractedEntity | null;
  onClose: () => void;
  onSave: (id: string, normalizedValue: string, entityType: string, reason?: string) => void;
}

const ENTITY_TYPES: EntityType[] = [
  'Person',
  'Phone',
  'Vehicle',
  'Location',
  'Organisation',
  'BankAccount',
  'Case',
  'Date',
];

export const EntityCorrectionModal: React.FC<EntityCorrectionModalProps> = ({
  entity,
  onClose,
  onSave,
}) => {
  if (!entity) return null;

  const [normalizedVal, setNormalizedVal] = useState(entity.normalized_value);
  const [selectedType, setSelectedType] = useState<EntityType>(entity.entity_type);
  const [reason, setReason] = useState('Investigator verified correction');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(entity.id, normalizedVal, selectedType, reason);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-brand-border animate-fadeIn">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-brand-purple" />
            Correct & Approve Extracted Entity
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Raw Text Snippet Context */}
          {entity.context_snippet && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
              <span className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                Extracted Context Window:
              </span>
              <p className="italic font-serif">"{entity.context_snippet}"</p>
            </div>
          )}

          {/* Raw Text */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Raw Extracted Text:</label>
            <input
              type="text"
              value={entity.raw_value}
              disabled
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono cursor-not-allowed"
            />
          </div>

          {/* Normalized Value Input */}
          <div>
            <label className="block text-slate-800 font-bold mb-1">Normalized / Corrected Value:</label>
            <input
              type="text"
              value={normalizedVal}
              onChange={(e) => setNormalizedVal(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple"
              required
            />
          </div>

          {/* Entity Type Select */}
          <div>
            <label className="block text-slate-800 font-bold mb-1">Entity Category Type:</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as EntityType)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-brand-purple"
            >
              {ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Correction Reason */}
          <div>
            <label className="block text-slate-800 font-bold mb-1">Investigator Audit Note:</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-brand-purple"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-purple hover:bg-brand-purple-light text-white font-bold rounded-xl shadow-md shadow-brand-purple/20 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Correct & Approve to Graph</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EntityCorrectionModal;
