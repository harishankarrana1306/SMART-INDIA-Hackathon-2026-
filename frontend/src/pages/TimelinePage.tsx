import React, { useEffect, useState } from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { TimelineEvent } from '../types';
import TimelineFilterBar from '../components/timeline/TimelineFilterBar';
import TimelineEventCard from '../components/timeline/TimelineEventCard';
import LoadingState from '../components/common/LoadingState';
import DisclaimerBanner from '../components/common/DisclaimerBanner';

export const TimelinePage: React.FC = () => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [entityFilter, setEntityFilter] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchTimeline = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTimeline({
        entity_id: entityFilter || undefined,
        event_type: selectedType,
      });
      setEvents(data.events || []);
    } catch (e) {
      console.error('Failed to load timeline:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [selectedType, entityFilter]);

  const handleReset = () => {
    setEntityFilter('');
    setSelectedType('ALL');
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-brand-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-brand-purple" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Investigative Event Chronology & Sequence Reconstruction
            </h2>
          </div>
          <p className="text-xs text-brand-muted max-w-2xl">
            Correlates cellular call interactions (CDR), inter-bank wire transfers, physical surveillance sightings, and formal complaint registrations along a unified chronological timeline.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchTimeline}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
          title="Refresh event chronology"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Bar */}
      <TimelineFilterBar
        entityFilter={entityFilter}
        onEntityFilterChange={setEntityFilter}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        onReset={handleReset}
      />

      {/* Timeline Event Stream */}
      {isLoading ? (
        <LoadingState message="Reconstructing temporal event sequence..." />
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-border p-12 text-center text-xs text-brand-muted space-y-2">
          <p className="font-semibold text-slate-700">No chronological events found matching active filters.</p>
          <p>Ingest new CDR, banking, or surveillance records to populate timeline events.</p>
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          {events.map((evt, idx) => (
            <TimelineEventCard
              key={evt.event_id}
              event={evt}
              isLast={idx === events.length - 1}
            />
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <DisclaimerBanner variant="light" />
    </div>
  );
};

export default TimelinePage;
