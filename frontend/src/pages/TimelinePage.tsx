import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  Clock,
  RefreshCw,
  Calendar,
  Layers,
  Filter,
  Maximize2,
  Minimize2,
  Search,
  RotateCcw,
  Network,
  ChevronDown,
  Sparkles,
  Zap,
  SlidersHorizontal,
  LayoutList,
  Compass,
} from 'lucide-react';
import { api } from '../api/client';
import { TimelineEvent } from '../types';
import TimelineStorylineChart from '../components/timeline/TimelineStorylineChart';
import TimelineStorylineCards from '../components/timeline/TimelineStorylineCards';
import TimelineEventDetailDrawer from '../components/timeline/TimelineEventDetailDrawer';
import TimelineEventCard from '../components/timeline/TimelineEventCard';
import LoadingState from '../components/common/LoadingState';
import DisclaimerBanner from '../components/common/DisclaimerBanner';

interface TimelinePageProps {
  initialEntityFilter?: string;
  initialCaseCode?: string;
  onNavigateToGraph?: (caseCode?: string, entityName?: string) => void;
}

const CASES = [
  { id: 'ALL', label: 'All Cases (Global Cross-Jurisdictional)' },
  { id: 'FIC-CASE-0001', label: 'FIC-CASE-0001: Operation Maya Orchid' },
  { id: 'FIC-CASE-0002', label: 'FIC-CASE-0002: Project Lotus Transit' },
  { id: 'FIC-CASE-0003', label: 'FIC-CASE-0003: Project Falcon Shield' },
  { id: 'FIC-CASE-0004', label: 'FIC-CASE-0004: Operation Silver Stream' },
  { id: 'FIC-CASE-0005', label: 'FIC-CASE-0005: Case Blue Horizon' },
  { id: 'FIC-CASE-0006', label: 'FIC-CASE-0006: Operation Asteroid' },
];

const EVENT_TYPES = [
  { id: 'ALL', label: 'All Events' },
  { id: 'phone_communication', label: 'Communication' },
  { id: 'location_visit', label: 'Location' },
  { id: 'vehicle_movement', label: 'Vehicle' },
  { id: 'financial_transaction', label: 'Financial' },
  { id: 'meeting_colocation', label: 'Meetings' },
  { id: 'document_fir', label: 'Documents / FIR' },
  { id: 'social_media_event', label: 'Digital / Social' },
];

export const TimelinePage: React.FC<TimelinePageProps> = ({
  initialEntityFilter,
  initialCaseCode,
  onNavigateToGraph,
}) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [selectedCase, setSelectedCase] = useState<string>(initialCaseCode || 'FIC-CASE-0001');
  const [entityFilter, setEntityFilter] = useState<string>(initialEntityFilter || '');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [highActivityOnly, setHighActivityOnly] = useState<boolean>(false);
  const [selectedClusterDate, setSelectedClusterDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [viewLayout, setViewLayout] = useState<'storyline' | 'vertical'>('storyline');
  const [showFilterBar, setShowFilterBar] = useState<boolean>(true);
  const [selectedDetailEvent, setSelectedDetailEvent] = useState<TimelineEvent | null>(null);

  // Synchronize props
  useEffect(() => {
    if (initialEntityFilter) {
      setEntityFilter(initialEntityFilter);
    }
  }, [initialEntityFilter]);

  useEffect(() => {
    if (initialCaseCode) {
      setSelectedCase(initialCaseCode);
    }
  }, [initialCaseCode]);

  // Fetch timeline dataset from backend based on case and filters
  const fetchTimeline = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTimeline({
        case_id: selectedCase !== 'ALL' ? selectedCase : undefined,
        entity_id: entityFilter.trim() || undefined,
        event_type: selectedType !== 'ALL' ? selectedType : undefined,
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
  }, [selectedCase, selectedType, entityFilter]);

  useEffect(() => {
    const handleReload = () => fetchTimeline();
    window.addEventListener('netra-data-reloaded', handleReload);
    return () => window.removeEventListener('netra-data-reloaded', handleReload);
  }, []);

  // Filter events locally by high activity or selected date cluster if needed
  const displayEvents = useMemo(() => {
    let list = [...events];

    if (selectedClusterDate) {
      list = list.filter((e) => e.timestamp?.startsWith(selectedClusterDate));
    }

    if (highActivityOnly) {
      list = list.filter(
        (e) =>
          e.event_type === 'financial_transaction' ||
          e.event_type === 'phone_communication' ||
          (e.actors && e.actors.length >= 2)
      );
    }

    return list;
  }, [events, selectedClusterDate, highActivityOnly]);

  // Calculate Date Range String
  const dateRangeStr = useMemo(() => {
    if (events.length === 0) return 'No Date Range';
    const dates = events
      .map((e) => (e.timestamp ? new Date(e.timestamp) : null))
      .filter(Boolean) as Date[];
    if (dates.length === 0) return 'Undetermined';
    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));

    const minStr = min.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    const maxStr = max.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    return minStr === maxStr ? minStr : `${minStr} - ${maxStr}`;
  }, [events]);

  const handleResetFilters = () => {
    setSelectedCase('ALL');
    setEntityFilter('');
    setSelectedType('ALL');
    setHighActivityOnly(false);
    setSelectedClusterDate(null);
  };

  const currentCaseObj = CASES.find((c) => c.id === selectedCase) || CASES[0];

  return (
    <div
      className={`space-y-6 transition-all duration-300 select-none ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#FAF7F2] p-6 sm:p-10 overflow-y-auto'
          : 'p-6 sm:p-8 max-w-7xl mx-auto'
      }`}
    >
      {/* 1. Page Header matching Reference Design */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-[32px] border border-[#E5DACB] shadow-sm">
        <div className="flex items-center space-x-3.5">
          {/* Header Stopwatch Icon Disc */}
          <div className="w-12 h-12 rounded-2xl bg-[#3B2414] border border-[#683F1E] flex items-center justify-center text-[#DDA15E] shadow-md flex-shrink-0">
            <Clock className="w-6 h-6 stroke-[2.2]" />
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-[#20150F] tracking-tight uppercase">
                4. TIMELINE STORYLINE
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#7D7268] mt-0.5 font-medium">
              How the network evolved over time
            </p>
          </div>
        </div>

        {/* Header Right Controls: Case Selector + Filter Toggle + Fullscreen */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Active Case Selector Pill */}
          <div className="relative">
            <select
              value={selectedCase}
              onChange={(e) => {
                setSelectedCase(e.target.value);
                setSelectedClusterDate(null);
              }}
              className="appearance-none pl-3.5 pr-8 py-2 text-xs font-bold bg-[#FAF7F2] border border-[#D8CBB9] rounded-2xl text-[#20150F] hover:border-[#9C6644] focus:outline-none cursor-pointer transition-all shadow-xs"
            >
              {CASES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#7D7268] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Filter Bar Toggle Button */}
          <button
            type="button"
            onClick={() => setShowFilterBar(!showFilterBar)}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
              showFilterBar
                ? 'bg-[#8A5A36] text-white border-[#8A5A36] shadow-sm'
                : 'bg-[#FAF7F2] text-[#43382F] border-[#D8CBB9] hover:bg-[#F5EFE6]'
            }`}
            title="Toggle Filter Panel"
          >
            <Filter className="w-4 h-4" />
          </button>

          {/* Fullscreen Expand / Collapse Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2.5 bg-[#FAF7F2] hover:bg-[#F5EFE6] text-[#43382F] rounded-2xl border border-[#D8CBB9] transition-all cursor-pointer shadow-xs"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Refresh Action */}
          <button
            type="button"
            onClick={fetchTimeline}
            className="p-2.5 bg-[#FAF7F2] hover:bg-[#F5EFE6] text-[#43382F] rounded-2xl border border-[#D8CBB9] transition-all cursor-pointer shadow-xs"
            title="Refresh Timeline"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Interactive Filter & Search Bar */}
      {showFilterBar && (
        <div className="bg-white p-4 rounded-[28px] border border-[#E5DACB] shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-[#2C241D] animate-fadeIn">
          <div className="flex flex-1 flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Entity & Location Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C827A]" />
              <input
                type="text"
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                placeholder="Search entities, locations, phones, vehicles, evidence..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF7F2] border border-[#E5DACB] rounded-xl focus:outline-none focus:border-[#9C6644] text-[#2C241D] placeholder-[#9C9288] font-medium"
              />
            </div>

            {/* Quick Type Filter Selector */}
            <div className="relative min-w-[170px]">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E5DACB] rounded-xl focus:outline-none focus:border-[#9C6644] text-[#2C241D] font-bold cursor-pointer"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* High Activity Only Toggle Pill */}
            <button
              type="button"
              onClick={() => setHighActivityOnly(!highActivityOnly)}
              className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                highActivityOnly
                  ? 'bg-[#E05A47] text-white border-[#E05A47] shadow-sm'
                  : 'bg-[#FAF7F2] text-[#6B5E51] border-[#E5DACB] hover:bg-[#F5EFE6]'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>High Activity Only</span>
            </button>

            {/* View Mode Toggle: Storyline vs Vertical */}
            <div className="flex items-center p-0.5 bg-[#FAF7F2] border border-[#E5DACB] rounded-xl">
              <button
                type="button"
                onClick={() => setViewLayout('storyline')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  viewLayout === 'storyline'
                    ? 'bg-white text-[#2C241D] shadow-xs'
                    : 'text-[#8C7A6B] hover:text-[#2C241D]'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Storyline</span>
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('vertical')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  viewLayout === 'vertical'
                    ? 'bg-white text-[#2C241D] shadow-xs'
                    : 'text-[#8C7A6B] hover:text-[#2C241D]'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Feed</span>
              </button>
            </div>
          </div>

          {/* Reset Filters */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="flex items-center space-x-1 px-3 py-2 text-xs text-[#6B5E51] hover:text-[#2C241D] hover:bg-[#FAF7F2] rounded-xl border border-[#E5DACB] transition-all cursor-pointer"
            title="Reset filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      )}

      {/* 3. Main Timeline Content */}
      {isLoading ? (
        <LoadingState message="Reconstructing case event chronology and temporal activity curve..." />
      ) : events.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-[32px] border border-[#E5DACB] shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#FAF7F2] border border-[#E5DACB] flex items-center justify-center mx-auto text-[#8C827A]">
            <Calendar className="w-8 h-8 opacity-60" />
          </div>
          <h3 className="text-base font-bold text-[#2C241D]">
            No chronological events are available for this case yet.
          </h3>
          <p className="text-xs text-[#7D7268] max-w-md mx-auto leading-relaxed">
            Add or process timestamped evidence to build the investigation timeline. Change the case scope or clear filter terms to inspect other cases.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Dark Charcoal Timeline Storyline Master Panel */}
          <div className="rounded-[36px] bg-[#140D08] border border-[#2E1C11] p-6 text-white shadow-2xl space-y-6">
            {/* Top Activity Curve Chart */}
            <TimelineStorylineChart
              events={events}
              selectedClusterDate={selectedClusterDate}
              onSelectClusterDate={setSelectedClusterDate}
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              eventTypesList={EVENT_TYPES}
            />

            {/* Bottom Storyline Cards Flow */}
            {viewLayout === 'storyline' ? (
              <TimelineStorylineCards
                events={displayEvents}
                selectedEventId={selectedDetailEvent?.event_id}
                onSelectEvent={(evt) => setSelectedDetailEvent(evt)}
                onNavigateToGraph={onNavigateToGraph}
              />
            ) : (
              /* Vertical Timeline Feed */
              <div className="relative pl-6 sm:pl-8 space-y-4 pt-4 border-t border-[#2C190F] before:absolute before:left-3 sm:before:left-4 before:top-6 before:bottom-3 before:w-0.5 before:bg-[#3E2819]">
                {displayEvents.map((evt, idx) => (
                  <TimelineEventCard
                    key={evt.event_id || idx}
                    event={evt}
                    onNavigateToGraph={(entityName) =>
                      onNavigateToGraph &&
                      onNavigateToGraph(selectedCase !== 'ALL' ? selectedCase : undefined, entityName)
                    }
                  />
                ))}
              </div>
            )}

            {/* Bottom Info Banner & Date Range Indicator matching Reference */}
            <div className="pt-4 border-t border-[#2C190F] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#A89A8C]">
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#24160E] border border-[#4A2C14] text-[#DDA15E] flex items-center justify-center font-bold text-[10px]">
                  i
                </div>
                <span>
                  Timeline shows key activities and interactions in chronological order. Click on any event to explore related entities and connections.
                </span>
              </div>

              {/* Date Range Badge */}
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#20140D] border border-[#3E2819] text-white text-xs font-mono font-bold">
                <Calendar className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>{dateRangeStr}</span>
                <ChevronDown className="w-3 h-3 text-[#8C7A6B]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Event Detail Modal / Drawer */}
      <TimelineEventDetailDrawer
        event={selectedDetailEvent}
        onClose={() => setSelectedDetailEvent(null)}
        onNavigateToGraph={onNavigateToGraph}
      />

      {/* Mandatory Disclaimer */}
      <DisclaimerBanner variant="light" />
    </div>
  );
};

export default TimelinePage;
