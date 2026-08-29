import React from 'react';
import {
  MapPin,
  Phone,
  Users,
  Landmark,
  Car,
  FileText,
  MessageSquare,
  ArrowRight,
  ShieldAlert,
  Clock,
  Network,
  Eye,
  FileCheck,
} from 'lucide-react';
import { TimelineEvent } from '../../types';

interface TimelineStorylineCardsProps {
  events: TimelineEvent[];
  selectedEventId?: string | null;
  onSelectEvent: (event: TimelineEvent) => void;
  onNavigateToGraph?: (caseCode?: string, entityName?: string) => void;
  hotspotEventId?: string | null;
}

export const TimelineStorylineCards: React.FC<TimelineStorylineCardsProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
  onNavigateToGraph,
  hotspotEventId,
}) => {
  if (!events || events.length === 0) return null;

  const getEventStyling = (type: string, isHotspot: boolean) => {
    switch (type) {
      case 'location_visit':
      case 'surveillance_observation':
      case 'surveillance_sighting':
        return {
          icon: <MapPin className="w-5 h-5 text-white" />,
          nodeColor: '#E05A47',
          nodeBorder: '#992B1C',
          discBg: 'linear-gradient(135deg, #E05A47 0%, #A83220 100%)',
          cardBorder: isHotspot ? 'border-[#F59E0B]' : 'border-[#382115]',
          badgeText: 'Location Visit',
          badgeBg: 'bg-[#451A14] text-[#FCA5A5] border-[#7F291C]',
        };
      case 'phone_communication':
      case 'call':
        return {
          icon: <Phone className="w-5 h-5 text-white" />,
          nodeColor: '#F59E0B',
          nodeBorder: '#B45309',
          discBg: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
          cardBorder: isHotspot ? 'border-[#F59E0B]' : 'border-[#382115]',
          badgeText: 'Communication',
          badgeBg: 'bg-[#3B240B] text-[#FCD34D] border-[#78350F]',
        };
      case 'meeting_colocation':
        return {
          icon: <Users className="w-5 h-5 text-white" />,
          nodeColor: '#F59E0B',
          nodeBorder: '#B45309',
          discBg: 'linear-gradient(135deg, #F59E0B 0%, #92400E 100%)',
          cardBorder: isHotspot ? 'border-[#F59E0B] shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'border-[#382115]',
          badgeText: 'Meeting',
          badgeBg: 'bg-[#3B240B] text-[#FCD34D] border-[#78350F]',
        };
      case 'financial_transaction':
      case 'financial_transfer':
        return {
          icon: <Landmark className="w-5 h-5 text-white" />,
          nodeColor: '#EAB308',
          nodeBorder: '#A16207',
          discBg: 'linear-gradient(135deg, #EAB308 0%, #854D0E 100%)',
          cardBorder: isHotspot ? 'border-[#EAB308]' : 'border-[#382115]',
          badgeText: 'Transaction',
          badgeBg: 'bg-[#372A08] text-[#FEF08A] border-[#713F12]',
        };
      case 'vehicle_movement':
        return {
          icon: <Car className="w-5 h-5 text-white" />,
          nodeColor: '#38BDF8',
          nodeBorder: '#0284C7',
          discBg: 'linear-gradient(135deg, #38BDF8 0%, #0369A1 100%)',
          cardBorder: isHotspot ? 'border-[#38BDF8]' : 'border-[#382115]',
          badgeText: 'Vehicle Activity',
          badgeBg: 'bg-[#0E2938] text-[#7DD3FC] border-[#075985]',
        };
      case 'social_media_event':
        return {
          icon: <MessageSquare className="w-5 h-5 text-white" />,
          nodeColor: '#38BDF8',
          nodeBorder: '#0284C7',
          discBg: 'linear-gradient(135deg, #38BDF8 0%, #0369A1 100%)',
          badgeText: 'Digital / Social',
          cardBorder: isHotspot ? 'border-[#38BDF8]' : 'border-[#382115]',
          badgeBg: 'bg-[#0E2938] text-[#7DD3FC] border-[#075985]',
        };
      case 'document_fir':
      case 'fir_filed':
      default:
        return {
          icon: <FileText className="w-5 h-5 text-white" />,
          nodeColor: '#10B981',
          nodeBorder: '#047857',
          discBg: 'linear-gradient(135deg, #10B981 0%, #065F46 100%)',
          cardBorder: isHotspot ? 'border-[#10B981]' : 'border-[#382115]',
          badgeText: 'Document / FIR',
          badgeBg: 'bg-[#0A2E20] text-[#6EE7B7] border-[#065F46]',
        };
    }
  };

  const formatTimeOnly = (timestampStr?: string) => {
    if (!timestampStr) return 'Time unavailable';
    const parts = timestampStr.split(' ');
    if (parts.length >= 2) {
      const timeParts = parts[1].split(':');
      if (timeParts.length >= 2) {
        let hour = parseInt(timeParts[0], 10);
        const minute = timeParts[1];
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        return `${hour < 10 ? '0' + hour : hour}:${minute} ${ampm}`;
      }
    }
    return 'Time unavailable';
  };

  return (
    <div className="relative w-full pt-4 pb-2 select-none overflow-x-auto scrollbar-none">
      {/* Horizontal Connected Storyline Cards Flow */}
      <div className="min-w-max flex items-start gap-4 sm:gap-6 px-4">
        {events.map((evt, idx) => {
          const isHot = evt.event_id === hotspotEventId || idx === 2;
          const isSelected = evt.event_id === selectedEventId;
          const style = getEventStyling(evt.event_type, isHot);
          const timeStr = formatTimeOnly(evt.timestamp);
          const primaryEntity =
            evt.actors?.[0]?.name || evt.actors?.[0]?.phone || evt.actors?.[0]?.account;
          const caseCode = evt.properties?.case_code;

          return (
            <div
              key={evt.event_id || idx}
              className="flex flex-col items-center group relative min-w-[220px] max-w-[260px] flex-shrink-0"
            >
              {/* Connector Node on Track */}
              <div className="relative flex items-center justify-center mb-3">
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-125"
                  style={{
                    backgroundColor: '#140D08',
                    border: `3px solid ${style.nodeColor}`,
                    boxShadow: `0 0 10px ${style.nodeColor}`,
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: style.nodeColor }} />
                </div>
              </div>

              {/* Storyline Card */}
              <div
                onClick={() => onSelectEvent(evt)}
                className={`w-full rounded-3xl p-5 text-center flex flex-col justify-between items-center transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-[#DDA15E] shadow-2xl scale-[1.02]'
                    : isHot
                    ? 'shadow-[0_8px_25px_rgba(245,158,11,0.25)] ring-1 ring-[#F59E0B]/60 hover:ring-[#F59E0B]'
                    : 'hover:border-[#523522] hover:shadow-xl'
                }`}
                style={{
                  background: isHot
                    ? 'linear-gradient(180deg, #24160E 0%, #170E08 100%)'
                    : 'linear-gradient(180deg, #1C120B 0%, #120A05 100%)',
                  border: isHot ? '1.5px solid #F59E0B' : '1px solid #2E1C11',
                  minHeight: '260px',
                }}
              >
                {/* Top Timestamp */}
                <div className="flex items-center justify-center gap-1 text-xs font-mono font-bold text-[#E5DACB] mb-3">
                  <Clock className="w-3 h-3 text-[#A89A8C]" />
                  <span>{timeStr}</span>
                </div>

                {/* Circular Icon Disc */}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg mb-3 transform group-hover:scale-110 transition-transform"
                  style={{
                    background: style.discBg,
                    boxShadow: `0 8px 18px -4px ${style.nodeColor}40`,
                  }}
                >
                  {style.icon}
                </div>

                {/* Event Title & Summary */}
                <div className="space-y-1 mb-3 flex-1 flex flex-col justify-center">
                  <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">
                    {evt.title}
                  </h4>
                  <p className="text-[11px] text-[#A89A8C] line-clamp-2 leading-relaxed">
                    {evt.description}
                  </p>
                </div>

                {/* Key Entities / Evidence Citation */}
                {evt.actors && evt.actors.length > 0 && (
                  <div className="w-full text-center text-[10px] text-[#C5B8AA] font-semibold truncate mb-2 px-1">
                    <span className="text-[#8C7A6B]">Actors: </span>
                    <span className="text-[#F5EFE6]">
                      {evt.actors
                        .map((a) => a.name || a.phone || a.account)
                        .filter(Boolean)
                        .slice(0, 2)
                        .join(', ')}
                    </span>
                  </div>
                )}

                {/* Bottom Tags & Graph Jump Button */}
                <div className="w-full pt-2.5 border-t border-[#2C190F] flex items-center justify-between gap-1.5">
                  <span
                    className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${style.badgeBg} truncate`}
                  >
                    {style.badgeText}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onNavigateToGraph) {
                        onNavigateToGraph(caseCode, primaryEntity);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-[#2C190F] hover:bg-[#8A5A36] text-[#DDA15E] hover:text-white transition-all text-[10px] font-bold flex items-center gap-1 cursor-pointer flex-shrink-0"
                    title="View in Network Graph"
                  >
                    <Network className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineStorylineCards;
