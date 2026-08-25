import React from 'react';
import { Phone, Landmark, Eye, FileText, MapPin, Clock } from 'lucide-react';
import { TimelineEvent } from '../../types';
import Badge from '../common/Badge';

interface TimelineEventCardProps {
  event: TimelineEvent;
  isLast?: boolean;
}

export const TimelineEventCard: React.FC<TimelineEventCardProps> = ({ event, isLast = false }) => {
  const getEventMeta = (type: string) => {
    switch (type) {
      case 'call':
        return {
          icon: <Phone className="w-4 h-4 text-brand-purple" />,
          bgColor: 'bg-purple-100',
          borderColor: 'border-purple-200',
          badgeText: 'Cellular CDR Call',
          badgeVariant: 'purple' as const,
        };
      case 'financial_transfer':
        return {
          icon: <Landmark className="w-4 h-4 text-teal-600" />,
          bgColor: 'bg-teal-100',
          borderColor: 'border-teal-200',
          badgeText: 'Bank Wire Transfer',
          badgeVariant: 'teal' as const,
        };
      case 'surveillance_sighting':
        return {
          icon: <Eye className="w-4 h-4 text-sky-600" />,
          bgColor: 'bg-sky-100',
          borderColor: 'border-sky-200',
          badgeText: 'Field Sighting',
          badgeVariant: 'sky' as const,
        };
      default:
        return {
          icon: <FileText className="w-4 h-4 text-amber-600" />,
          bgColor: 'bg-amber-100',
          borderColor: 'border-amber-200',
          badgeText: 'FIR Incident',
          badgeVariant: 'amber' as const,
        };
    }
  };

  const meta = getEventMeta(event.event_type);

  return (
    <div className="relative flex items-start space-x-4">
      {/* Vertical Spine Line */}
      {!isLast && (
        <div className="absolute left-4 top-9 -bottom-4 w-0.5 bg-slate-200" />
      )}

      {/* Event Node Bullet */}
      <div className={`relative z-10 w-8 h-8 rounded-xl ${meta.bgColor} border ${meta.borderColor} flex items-center justify-center shadow-sm flex-shrink-0`}>
        {meta.icon}
      </div>

      {/* Event Card Content */}
      <div className="flex-1 p-5 rounded-2xl bg-white border border-brand-border shadow-sm hover:shadow-md transition-all space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <Badge label={meta.badgeText} variant={meta.badgeVariant} size="sm" />
            <span className="font-mono text-xs font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              {event.source_record_code}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{event.timestamp}</span>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-900 leading-snug">{event.title}</h4>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{event.description}</p>
        </div>

        {/* Location tag if available */}
        {event.location && (
          <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 inline-flex">
            <MapPin className="w-3.5 h-3.5 text-sky-600" />
            <span>{event.location}</span>
          </div>
        )}

        {/* Actors Involved */}
        {event.actors && event.actors.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
            {event.actors.map((actor, idx) => (
              <div key={idx} className="p-1.5 px-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-[11px]">
                <span className="text-slate-400 uppercase text-[9px] font-bold mr-1">
                  {actor.role.replace('_', ' ')}:
                </span>
                <span className="font-semibold text-slate-800">
                  {actor.name || actor.phone || actor.account || actor.identifier || 'Unknown'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineEventCard;
