import React, { useState } from 'react';
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
    return <span className={`font-mono text-slate-800 ${className}`}>{value}</span>;
  }

  const displayVal = isRevealed && unmaskedVal ? unmaskedVal : value;

  return (
    <div className="inline-flex flex-col gap-1">
      <div className={`inline-flex items-center gap-2 font-mono text-xs ${className}`}>
        <span className={`px-2 py-0.5 rounded ${isRevealed ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
          {displayVal}
        </span>
        <button
          type="button"
          onClick={handleRevealToggle}
          disabled={isLoading}
          className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all text-[11px] flex items-center gap-1 border border-slate-200"
          title={isRevealed ? 'Mask Sensitive Data' : 'Audited Unmask Request'}
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 animate-spin text-brand-purple" />
          ) : isRevealed ? (
            <>
              <EyeOff className="w-3 h-3 text-slate-500" />
              <span>Mask</span>
            </>
          ) : (
            <>
              <Eye className="w-3 h-3 text-brand-purple" />
              <span>Reveal (Audited)</span>
            </>
          )}
        </button>
      </div>

      {showAuditNotice && (
        <div className="text-[10px] text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 animate-fadeIn">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          <span>Unmasking action recorded in tamper-evident audit ledger</span>
        </div>
      )}
    </div>
  );
};

export default MaskedValue;
