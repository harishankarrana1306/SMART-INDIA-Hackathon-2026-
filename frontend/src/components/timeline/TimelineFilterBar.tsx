import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

interface TimelineFilterBarProps {
  entityFilter: string;
  onEntityFilterChange: (val: string) => void;
  selectedType: string;
  onTypeChange: (val: string) => void;
  onReset: () => void;
}

const EVENT_TYPES = [
  { id: 'ALL', label: 'All Event Types' },
  { id: 'fir_filed', label: 'FIR Complaints' },
  { id: 'call', label: 'Cellular Calls (CDR)' },
  { id: 'financial_transfer', label: 'Bank Wire Transfers' },
  { id: 'surveillance_sighting', label: 'Surveillance Sightings' },
];

export const TimelineFilterBar: React.FC<TimelineFilterBarProps> = ({
  entityFilter,
  onEntityFilterChange,
  selectedType,
  onTypeChange,
  onReset,
}) => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
        {/* Search by Entity / Keyword */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={entityFilter}
            onChange={(e) => onEntityFilterChange(e.target.value)}
            placeholder="Filter by person, phone, or location..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-purple text-slate-900"
          />
        </div>

        {/* Event Type Filter */}
        <select
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-purple text-slate-900"
        >
          {EVENT_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all text-xs flex items-center gap-1.5"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Reset Filters</span>
      </button>
    </div>
  );
};

export default TimelineFilterBar;
