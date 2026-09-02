import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '../../api/client';

interface MaskedValueProps {
  nodeId?: string;
  value: string;
  entityType?: string;
  isSensitive?: boolean;
  className?: string;
}

export const MaskedValue: React.FC<MaskedValueProps> = ({
  nodeId,
  value,
  isSensitive = false,
  className = '',
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [unmaskedVal, setUnmaskedVal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAuditNotice, setShowAuditNotice] = useState(false);

  useEffect(() => {
    setIsRevealed(false);
    setUnmaskedVal(null);
    setShowAuditNotice(false);
  }, [nodeId, value]);

  const handleRevealToggle = async () => {
    if (isRevealed) {
      setIsRevealed(false);
      return;
    }

    if (unmaskedVal) {
      setIsRevealed(true);
      return;
    }

    if (!nodeId) {
      setIsRevealed(true);
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.revealSensitive(nodeId, 'Investigator verified display request');
      setUnmaskedVal(res.unmasked_value);
      setIsRevealed(true);
      setShowAuditNotice(true);
      setTimeout(() => setShowAuditNotice(false), 4000);
    } catch (e) {
      console.error('Failed to unmask value:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSensitive) {
    return <span className={`font-mono text-[#2C241D] ${className}`}>{value}</span>;
  }

  const displayVal = isRevealed && unmaskedVal ? unmaskedVal : value;

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <div className={`inline-flex items-center gap-1.5 font-mono text-xs ${className}`}>
        <span
          className={`px-2 py-0.5 rounded-lg font-semibold tracking-wide transition-colors ${
            isRevealed
              ? 'bg-[#FFF8E7] text-[#8A5A36] border border-[#E8D4B0] shadow-2xs font-bold'
              : 'bg-[#FAF7F2] text-[#5A4D41] border border-[#E5DACB]'
          }`}
        >
          {displayVal}
        </span>
        <button
          type="button"
          onClick={handleRevealToggle}
          disabled={isLoading}
          className="px-2 py-0.5 rounded-lg bg-white hover:bg-[#FAF7F2] text-[#8A5A36] hover:text-[#5A381E] transition-all text-[11px] font-medium flex items-center gap-1 border border-[#D5C7B8] shadow-2xs cursor-pointer disabled:opacity-50"
          title={isRevealed ? 'Mask Sensitive Data' : 'Audited Unmask Request'}
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin text-[#9C6644]" />
          ) : isRevealed ? (
            <>
              <EyeOff className="w-3 h-3 text-[#8A5A36]" />
              <span>Mask</span>
            </>
          ) : (
            <>
              <Eye className="w-3 h-3 text-[#9C6644]" />
              <span>Reveal (Audited)</span>
            </>
          )}
        </button>
      </div>

      {showAuditNotice && (
        <div className="text-[10px] text-[#2D7A58] flex items-center gap-1 bg-[#EAF5EF] px-2 py-0.5 rounded-md border border-[#D0EADB] animate-fadeIn text-right">
          <ShieldCheck className="w-3 h-3 text-[#2D7A58] flex-shrink-0" />
          <span>Audit logged: unmasking recorded in SHA-256 ledger</span>
        </div>
      )}
    </div>
  );
};

export default MaskedValue;
