import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Users,
  Info,
} from 'lucide-react';
import { AlertItem } from '../../types';
import Badge from '../common/Badge';

interface AlertCardProps {
  alert: AlertItem;
  onAcknowledge: (id: string, notes?: string) => void;
  onDismiss: (id: string, reason: string) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onAcknowledge,
  onDismiss,
}) => {
  const [isDismissing, setIsDismissing] = useState(false);
  const [dismissReason, setDismissReason] = useState('');
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [ackNotes, setAckNotes] = useState('');

  const isUnreviewed = alert.status === 'unreviewed';

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'HIGH':
        return <Badge label="HIGH ADVISORY" variant="red" size="sm" />;
      case 'MEDIUM':
        return <Badge label="MEDIUM ADVISORY" variant="amber" size="sm" />;
      default:
        return <Badge label="LOW ADVISORY" variant="sky" size="sm" />;
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white border border-brand-border shadow-sm hover:shadow-md transition-all space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-50 text-brand-purple border border-purple-100">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              {getSeverityBadge(alert.severity)}
              <span className="text-[10px] font-mono font-semibold uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {alert.rule_name.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>

        {alert.status === 'acknowledged' ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledged by Investigator
          </span>
        ) : alert.status === 'dismissed' ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            <XCircle className="w-3.5 h-3.5" /> Dismissed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" /> Action Required
          </span>
        )}
      </div>

      {/* Title & Description */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 leading-snug">{alert.title}</h3>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{alert.description}</p>
      </div>

      {/* Threshold Explanation */}
      {alert.threshold_description && (
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
          <Info className="w-4 h-4 text-brand-purple flex-shrink-0" />
          <span className="text-[11px] font-medium">{alert.threshold_description}</span>
        </div>
      )}

      {/* Involved Entities & Source Records */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
        {/* Supporting Entities */}
        {alert.supporting_entity_ids && alert.supporting_entity_ids.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
              <Users className="w-3 h-3 text-slate-400" />
              Involved Entities ({alert.supporting_entity_ids.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {alert.supporting_entity_ids.map((ent, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-purple-50 text-brand-purple font-medium text-[11px] rounded-lg border border-purple-100"
                >
                  {ent.name || ent.id}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Supporting Source Records */}
        {alert.supporting_record_ids && alert.supporting_record_ids.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-400" />
              Evidentiary Records ({alert.supporting_record_ids.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {alert.supporting_record_ids.map((rec, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-indigo-50 text-indigo-900 font-mono font-bold text-[11px] rounded-lg border border-indigo-100"
                >
                  {rec}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Notes / Metadata if reviewed */}
      {alert.review_notes && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
          <span className="block text-[10px] uppercase font-bold text-slate-500">
            Investigator Review Note:
          </span>
          <p className="italic">"{alert.review_notes}"</p>
        </div>
      )}

      {/* Action Footer for Unreviewed Alerts */}
      {isUnreviewed && (
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-brand-muted">
            Evaluate pattern before logging decision in chain-of-custody ledger.
          </p>

          <div className="flex items-center gap-2">
            {!isDismissing && !isAcknowledging && (
              <>
                <button
                  type="button"
                  onClick={() => setIsDismissing(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-600 border border-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Dismiss</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAcknowledging(true)}
                  className="px-4 py-1.5 bg-brand-purple hover:bg-brand-purple-light text-white text-xs font-bold rounded-xl shadow-md shadow-brand-purple/20 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Acknowledge & Investigate</span>
                </button>
              </>
            )}

            {/* In-Card Dismiss Prompt */}
            {isDismissing && (
              <div className="flex items-center gap-2 animate-fadeIn">
                <input
                  type="text"
                  value={dismissReason}
                  onChange={(e) => setDismissReason(e.target.value)}
                  placeholder="Provide dismissal justification..."
                  className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-brand-purple"
                />
                <button
                  type="button"
                  onClick={() => {
                    onDismiss(alert.id, dismissReason || 'Deemed benign');
                    setIsDismissing(false);
                  }}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg"
                >
                  Confirm Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => setIsDismissing(false)}
                  className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* In-Card Acknowledge Prompt */}
            {isAcknowledging && (
              <div className="flex items-center gap-2 animate-fadeIn">
                <input
                  type="text"
                  value={ackNotes}
                  onChange={(e) => setAckNotes(e.target.value)}
                  placeholder="Optional investigation note..."
                  className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-brand-purple"
                />
                <button
                  type="button"
                  onClick={() => {
                    onAcknowledge(alert.id, ackNotes);
                    setIsAcknowledging(false);
                  }}
                  className="px-3 py-1 bg-brand-purple hover:bg-brand-purple-light text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Save & Acknowledge
                </button>
                <button
                  type="button"
                  onClick={() => setIsAcknowledging(false)}
                  className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertCard;
