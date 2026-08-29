import React from 'react';
import {
  Phone,
  Landmark,
  Eye,
  FileText,
  MapPin,
  Clock,
  Car,
  Users,
  Globe,
  Network,
  ArrowRight,
} from 'lucide-react';
import { TimelineEvent } from '../../types';
import Badge from '../common/Badge';

interface TimelineEventCardProps {
  event: TimelineEvent;
  isLast?: boolean;
  onNavigateToGraph?: (entityName?: string) => void;
}

export const TimelineEventCard: React.FC<TimelineEventCardProps> = ({
  event,
  isLast = false,
  onNavigateToGraph,
}) => {
  const getEventMeta = (type: string) => {
    switch (type) {
      case 'phone_communication':
      case 'call':
        return {
          icon: <Phone className="w-4 h-4 text-[#7C3AED]" />,
          bgColor: 'bg-[#F5F3FF]',
          borderColor: 'border-[#DDD6FE]',
          badgeText: 'Cellular CDR Call',
          badgeVariant: 'purple' as const,
        };
      case 'financial_transaction':
        return {
          icon: <Landmark className="w-4 h-4 text-[#0D9488]" />,
          bgColor: 'bg-[#CCFBF1]',
          borderColor: 'border-[#99F6E4]',
          badgeText: 'Financial Transfer',
          badgeVariant: 'teal' as const,
        };
      case 'vehicle_movement':
        return {
          icon: <Car className="w-4 h-4 text-[#D97706]" />,
          bgColor: 'bg-[#FEF3C7]',
          borderColor: 'border-[#FDE68A]',
          badgeText: 'Vehicle Movement',
          badgeVariant: 'amber' as const,
        };
      case 'surveillance_observation':
      case 'surveillance_sighting':
        return {
          icon: <Eye className="w-4 h-4 text-[#0284C7]" />,
          bgColor: 'bg-[#E0F2FE]',
          borderColor: 'border-[#BAE6FD]',
          badgeText: 'Field Surveillance',
          badgeVariant: 'sky' as const,
        };
      case 'meeting_colocation':
        return {
          icon: <Users className="w-4 h-4 text-[#9C6644]" />,
          bgColor: 'bg-[#FEF6E9]',
          borderColor: 'border-[#FCE4BE]',
          badgeText: 'Meeting / Co-Location',
          badgeVariant: 'purple' as const,
        };
      case 'social_media_event':
        return {
          icon: <Globe className="w-4 h-4 text-[#C24134]" />,
          bgColor: 'bg-[#FCEEED]',
          borderColor: 'border-[#F8D5D2]',
          badgeText: 'Digital / Web Sighting',
          badgeVariant: 'red' as const,
        };
      default:
        return {
          icon: <FileText className="w-4 h-4 text-[#2D7A58]" />,
          bgColor: 'bg-[#EAF5EF]',
          borderColor: 'border-[#D0EADB]',
          badgeText: 'FIR / Document Record',
          badgeVariant: 'green' as const,
        };
    }
  };

  const meta = getEventMeta(event.event_type);
  const caseCode = event.properties?.case_code;
  const fileName = event.properties?.file_name;
  const primaryEntity = event.actors?.[0]?.name || event.actors?.[0]?.phone || event.actors?.[0]?.account;

  return (
    <div className="relative flex items-start space-x-4 animate-fadeIn text-[#2C241D]">
      {/* Event Node Bullet */}
      <div className={`relative z-10 w-8 h-8 rounded-xl ${meta.bgColor} border ${meta.borderColor} flex items-center justify-center shadow-sm flex-shrink-0 mt-1`}>
        {meta.icon}
      </div>

      {/* Event Card Content */}
      <div className="flex-1 p-5 rounded-3xl bg-white border border-[#E5DACB] shadow-sm hover:shadow-md transition-all space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-[#E5DACB]/60 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge label={meta.badgeText} variant={meta.badgeVariant} size="sm" />
            <span className="font-mono text-xs font-bold text-[#9C6644] bg-[#9C6644]/10 px-2 py-0.5 rounded-lg border border-[#9C6644]/20">
              {event.source_record_code}
            </span>
            {caseCode && (
              <span className="font-mono text-xs font-bold text-[#43382F] bg-[#F5EFE6] px-2 py-0.5 rounded-lg border border-[#E5DACB]">
                {caseCode}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#7D7268] font-mono">
            <Clock className="w-3.5 h-3.5 text-[#8C827A]" />
            <span>{event.timestamp}</span>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-[#2C241D] leading-snug">{event.title}</h4>
          <p className="text-xs text-[#5C5248] mt-1 leading-relaxed">{event.description}</p>
        </div>

        {/* Location & Source File tags */}
        <div className="flex flex-wrap items-center gap-2">
          {event.location && (
            <div className="flex items-center gap-1.5 text-xs text-[#43382F] bg-[#F5EFE6] px-2.5 py-1 rounded-xl border border-[#E5DACB]">
              <MapPin className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>{event.location}</span>
            </div>
          )}

          {fileName && (
            <div className="flex items-center gap-1.5 text-xs text-[#7D7268] bg-[#F5EFE6] px-2.5 py-1 rounded-xl border border-[#E5DACB] font-mono text-[11px]">
              <FileText className="w-3.5 h-3.5 text-[#8C827A]" />
              <span>{fileName}</span>
            </div>
          )}
        </div>

        {/* Actors Involved */}
        {event.actors && event.actors.length > 0 && (
          <div className="pt-2 border-t border-[#E5DACB]/60 flex flex-wrap gap-2 text-xs">
            {event.actors.map((actor, idx) => (
              <div key={idx} className="p-1.5 px-2.5 bg-[#F5EFE6]/60 rounded-xl border border-[#E5DACB] text-[11px] flex items-center gap-1">
                <span className="text-[#8C827A] uppercase text-[9px] font-bold">
                  {actor.role.replace(/_/g, ' ')}:
                </span>
                <span className="font-bold text-[#2C241D]">
                  {actor.name || actor.phone || actor.account || actor.identifier || 'Unknown'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Action Button: View on Network Graph */}
        {onNavigateToGraph && (
          <div className="pt-2 border-t border-[#E5DACB]/60 flex justify-end">
            <button
              type="button"
              onClick={() => onNavigateToGraph(primaryEntity)}
              className="px-3.5 py-1.5 bg-[#F5EFE6] hover:bg-[#EAE1D5] text-[#9C6644] text-xs font-bold rounded-xl transition-all border border-[#E5DACB] flex items-center gap-1.5 cursor-pointer"
            >
              <Network className="w-3.5 h-3.5" />
              <span>View on Network Graph</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineEventCard;
