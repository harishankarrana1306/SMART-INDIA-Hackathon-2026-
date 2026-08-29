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
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-[#E5DACB] animate-fadeIn text-[#2C241D]">
        <div className="flex items-center justify-between border-b border-[#E5DACB] pb-3">
          <h3 className="text-base font-bold text-[#2C241D] flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-[#9C6644]" />
            Correct & Approve Extracted Entity
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-[#8C827A] hover:text-[#2C241D] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Raw Text Snippet Context */}
          {entity.context_snippet && (
            <div className="p-3 bg-[#F5EFE6] rounded-2xl border border-[#E5DACB] text-[#43382F]">
              <span className="block text-[10px] uppercase font-bold text-[#8C827A] mb-1">
                Extracted Context Window:
              </span>
              <p className="italic font-serif">"{entity.context_snippet}"</p>
            </div>
          )}

          {/* Raw Text */}
          <div>
            <label className="block text-[#7D7268] font-semibold mb-1">Raw Extracted Text:</label>
            <input
              type="text"
              value={entity.raw_value}
              disabled
              className="w-full px-3 py-2 bg-[#F5EFE6]/60 border border-[#E5DACB] rounded-xl text-[#7D7268] font-mono cursor-not-allowed"
            />
          </div>

          {/* Normalized Value Input */}
          <div>
            <label className="block text-[#2C241D] font-bold mb-1">Normalized / Corrected Value:</label>
            <input
              type="text"
              value={normalizedVal}
              onChange={(e) => setNormalizedVal(e.target.value)}
              className="w-full px-3 py-2 bg-[#F5EFE6]/40 border border-[#E5DACB] rounded-xl text-[#2C241D] font-semibold focus:outline-none focus:border-[#9C6644] focus:ring-1 focus:ring-[#9C6644]"
              required
            />
          </div>

          {/* Entity Type Select */}
          <div>
            <label className="block text-[#2C241D] font-bold mb-1">Entity Category Type:</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as EntityType)}
              className="w-full px-3 py-2 bg-[#F5EFE6]/40 border border-[#E5DACB] rounded-xl text-[#2C241D] font-semibold focus:outline-none focus:border-[#9C6644]"
            >
              {ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Reason for Correction */}
          <div>
            <label className="block text-[#2C241D] font-bold mb-1">
              Investigator Correction Rationale:
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Standardized formatting of bank account or phone"
              className="w-full px-3 py-2 bg-[#F5EFE6]/40 border border-[#E5DACB] rounded-xl text-[#2C241D] focus:outline-none focus:border-[#9C6644]"
              required
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E5DACB]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#F5EFE6] hover:bg-[#EAE1D5] text-[#5C5248] border border-[#E5DACB] rounded-xl font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#9C6644] hover:bg-[#7F4F24] text-white rounded-xl font-bold shadow-md shadow-[#9C6644]/25 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Approve Corrected Entity</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EntityCorrectionModal;
