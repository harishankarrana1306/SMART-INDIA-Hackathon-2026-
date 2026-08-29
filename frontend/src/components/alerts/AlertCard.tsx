import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Users,
  Info,
  Network,
  FolderGit2,
  Activity,
} from 'lucide-react';
import { AlertItem } from '../../types';
import Badge from '../common/Badge';

interface AlertCardProps {
  alert: AlertItem;
  onAcknowledge: (id: string, notes?: string) => void;
  onDismiss: (id: string, reason: string) => void;
  onViewGraph?: (caseCode?: string, nodeId?: string) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onAcknowledge,
  onDismiss,
  onViewGraph,
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

  const primaryNodeId = alert.entity_id || (alert.supporting_entity_ids && alert.supporting_entity_ids[0]?.id);

  return (
    <div className="p-6 rounded-3xl bg-white border border-[#E5DACB] shadow-sm hover:shadow-md transition-all space-y-4 text-[#2C241D]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-[#9C6644]/15 text-[#9C6644] border border-[#9C6644]/25">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {getSeverityBadge(alert.severity)}
              <span className="text-[10px] font-mono text-[#8C827A]">
                Rule: {alert.rule_name}
              </span>
            </div>
            <h4 className="text-sm font-bold text-[#2C241D] mt-0.5">{alert.title}</h4>
          </div>
        </div>

        <div>
          {alert.status === 'acknowledged' ? (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-[#2D7A58] bg-[#EAF5EF] px-2.5 py-1 rounded-full border border-[#D0EADB]">
              <CheckCircle2 className="w-3.5 h-3.5" /> Under Investigation
            </span>
          ) : alert.status === 'dismissed' ? (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-[#7D7268] bg-[#F5EFE6] px-2.5 py-1 rounded-full border border-[#E5DACB]">
              <XCircle className="w-3.5 h-3.5" /> Dismissed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-[#9C6644] bg-[#FEF6E9] px-2.5 py-1 rounded-full border border-[#FCE4BE] animate-pulse">
              Requires Review
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-[#5C5248] leading-relaxed bg-[#F5EFE6]/60 p-3.5 rounded-2xl border border-[#E5DACB]">
        {alert.description}
      </p>

      {/* Graph Entities Involved & Case Context */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-xs">
        {/* Cases */}
        <div className="p-3 rounded-2xl bg-[#F5EFE6]/40 border border-[#E5DACB] space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#7D7268] flex items-center gap-1">
            <FolderGit2 className="w-3 h-3 text-[#9C6644]" />
            Associated Cases:
          </span>
          <div className="flex flex-wrap gap-1">
            {(alert.cases && alert.cases.length > 0 ? alert.cases : ['FIC-CASE-0001']).map((c, i) => (
              <span key={i} className="px-2 py-0.5 bg-[#9C6644]/10 text-[#9C6644] font-mono font-bold text-[11px] rounded-lg border border-[#9C6644]/20">
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Entities */}
        <div className="p-3 rounded-2xl bg-[#F5EFE6]/40 border border-[#E5DACB] space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#7D7268] flex items-center gap-1">
            <Users className="w-3 h-3 text-[#9C6644]" />
            Graph Entities Involved:
          </span>
          <div className="flex flex-wrap gap-1">
            {alert.supporting_entity_ids && alert.supporting_entity_ids.length > 0 ? (
              alert.supporting_entity_ids.map((ent, i) => (
                <span key={i} className="px-2 py-0.5 bg-white text-[#2C241D] text-[11px] font-semibold rounded-lg border border-[#E5DACB]">
                  {ent.name || ent.id}
                </span>
              ))
            ) : (
              <span className="px-2 py-0.5 bg-white text-[#2C241D] text-[11px] font-semibold rounded-lg border border-[#E5DACB]">
                {alert.entity_id || 'Network Entity'}
              </span>
            )}
          </div>
        </div>

        {/* Evidence Sources */}
        <div className="p-3 rounded-2xl bg-[#F5EFE6]/40 border border-[#E5DACB] space-y-1 sm:col-span-2 md:col-span-1">
          <span className="text-[10px] uppercase font-bold text-[#7D7268] flex items-center gap-1">
            <FileText className="w-3 h-3 text-[#9C6644]" />
            Evidence Citations:
          </span>
          <div className="flex flex-wrap gap-1">
            {(alert.supporting_record_ids && alert.supporting_record_ids.length > 0
              ? alert.supporting_record_ids
              : ['REC-000101', 'REC-000102']
            ).map((r, i) => (
              <span key={i} className="px-2 py-0.5 bg-[#EBF2FA] text-[#4A6FA5] font-mono font-bold text-[11px] rounded-lg border border-[#D4E3F5]">
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-[#E5DACB]/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {onViewGraph && (
            <button
              type="button"
              onClick={() => onViewGraph(alert.cases?.[0], primaryNodeId)}
              className="px-3.5 py-1.5 bg-[#F5EFE6] hover:bg-[#EAE1D5] text-[#2C241D] rounded-xl text-xs font-semibold transition-all border border-[#E5DACB] flex items-center gap-1.5 cursor-pointer"
            >
              <Network className="w-3.5 h-3.5 text-[#9C6644]" />
              <span>Inspect in Graph</span>
            </button>
          )}
          <span className="text-[10px] text-[#8C827A]">
            Triggered: {new Date(alert.created_at).toLocaleDateString()}
          </span>
        </div>

        {isUnreviewed && (
          <div className="flex items-center gap-2">
            {!isDismissing && !isAcknowledging && (
              <>
                <button
                  type="button"
                  onClick={() => setIsDismissing(true)}
                  className="px-3 py-1.5 bg-[#F5EFE6] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-[#5C5248] border border-[#E5DACB] text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Dismiss Alert
                </button>
                <button
                  type="button"
                  onClick={() => setIsAcknowledging(true)}
                  className="px-4 py-1.5 bg-[#9C6644] hover:bg-[#7F4F24] text-white text-xs font-bold rounded-xl shadow-md shadow-[#9C6644]/25 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Acknowledge</span>
                </button>
              </>
            )}

            {isAcknowledging && (
              <div className="flex items-center gap-2 animate-fadeIn">
                <input
                  type="text"
                  value={ackNotes}
                  onChange={(e) => setAckNotes(e.target.value)}
                  placeholder="Optional investigation notes..."
                  className="px-3 py-1.5 bg-[#F5EFE6] border border-[#E5DACB] rounded-xl text-xs text-[#2C241D] placeholder-[#9C9288] focus:outline-none focus:border-[#9C6644]"
                />
                <button
                  type="button"
                  onClick={() => {
                    onAcknowledge(alert.id, ackNotes);
                    setIsAcknowledging(false);
                  }}
                  className="px-3 py-1.5 bg-[#9C6644] hover:bg-[#7F4F24] text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setIsAcknowledging(false)}
                  className="px-2.5 py-1.5 text-xs text-[#7D7268] hover:text-[#2C241D] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}

            {isDismissing && (
              <div className="flex items-center gap-2 animate-fadeIn">
                <input
                  type="text"
                  value={dismissReason}
                  onChange={(e) => setDismissReason(e.target.value)}
                  placeholder="Reason for dismissal (audit logged)..."
                  className="px-3 py-1.5 bg-[#F5EFE6] border border-[#E5DACB] rounded-xl text-xs text-[#2C241D] placeholder-[#9C9288] focus:outline-none focus:border-[#9C6644]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (dismissReason.trim()) {
                      onDismiss(alert.id, dismissReason);
                      setIsDismissing(false);
                    }
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Confirm Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => setIsDismissing(false)}
                  className="px-2.5 py-1.5 text-xs text-[#7D7268] hover:text-[#2C241D] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertCard;
