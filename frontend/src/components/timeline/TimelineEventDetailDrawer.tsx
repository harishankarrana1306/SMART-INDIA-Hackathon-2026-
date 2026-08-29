import React from 'react';
import {
  X,
  Clock,
  MapPin,
  FileText,
  Network,
  Users,
  ShieldCheck,
  Building,
  Phone,
  Landmark,
  Car,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { TimelineEvent } from '../../types';

interface TimelineEventDetailDrawerProps {
  event: TimelineEvent | null;
  onClose: () => void;
  onNavigateToGraph?: (caseCode?: string, entityName?: string) => void;
}

export const TimelineEventDetailDrawer: React.FC<TimelineEventDetailDrawerProps> = ({
  event,
  onClose,
  onNavigateToGraph,
}) => {
  if (!event) return null;

  const caseCode = event.properties?.case_code;
  const fileName = event.properties?.file_name;
  const primaryEntity = event.actors?.[0]?.name || event.actors?.[0]?.phone || event.actors?.[0]?.account;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#180E08] border border-[#3E2819] rounded-[32px] p-6 text-[#E5DACB] shadow-2xl space-y-5 animate-scaleUp max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#2C190F] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#3B240B] text-[#F59E0B] border border-[#78350F]">
                {event.event_type.replace(/_/g, ' ').toUpperCase()}
              </span>
              <span className="font-mono text-[10px] font-bold text-[#DDA15E] bg-[#24160E] px-2 py-0.5 rounded-md border border-[#3E2819]">
                {event.source_record_code}
              </span>
              {caseCode && (
                <span className="font-mono text-[10px] font-bold text-white bg-[#2A180E] px-2 py-0.5 rounded-md border border-[#523522]">
                  {caseCode}
                </span>
              )}
            </div>
            <h3 className="text-base font-black text-white leading-snug">
              {event.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#8C7A6B] hover:text-white hover:bg-[#2C190F] rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timestamp & Location Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-2xl bg-[#20140D] border border-[#2E1C11] text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
            <div>
              <p className="text-[10px] text-[#8C7A6B] font-bold">EVENT TIMESTAMP</p>
              <p className="font-mono font-bold text-white">{event.timestamp || 'Time unavailable'}</p>
            </div>
          </div>

          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#38BDF8] flex-shrink-0" />
              <div>
                <p className="text-[10px] text-[#8C7A6B] font-bold">LOCATION / TOWER</p>
                <p className="font-semibold text-white truncate">{event.location}</p>
              </div>
            </div>
          )}
        </div>

        {/* Description & Evidentiary Narrative */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#A89A8C]">
            Evidentiary Narrative
          </h4>
          <p className="text-xs text-[#E5DACB] bg-[#120A05] p-3.5 rounded-2xl border border-[#2C190F] leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Actors & Key Entities Involved */}
        {event.actors && event.actors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#A89A8C]">
              Involved Entities & Subjects ({event.actors.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {event.actors.map((actor, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-[#20140D] border border-[#2E1C11] flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase font-bold text-[#8C7A6B] block">
                      {actor.role?.replace(/_/g, ' ') || 'Subject'}
                    </span>
                    <span className="font-bold text-white truncate block">
                      {actor.name || actor.phone || actor.account || 'Unknown'}
                    </span>
                  </div>
                  {actor.type && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2C190F] text-[#DDA15E] font-bold flex-shrink-0">
                      {actor.type}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button: View in Network Graph */}
        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onNavigateToGraph) {
                onNavigateToGraph(caseCode, primaryEntity);
              }
            }}
            className="flex-1 py-3 px-4 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-[#9C6644] to-[#7F4F24] hover:from-[#B57A4D] hover:to-[#9C6644] transition-all shadow-lg shadow-[#9C6644]/30 flex items-center justify-center gap-2 cursor-pointer border border-[#B07D58]"
          >
            <Network className="w-4 h-4" />
            <span>Open in Network Graph & Highlight Entities</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimelineEventDetailDrawer;
