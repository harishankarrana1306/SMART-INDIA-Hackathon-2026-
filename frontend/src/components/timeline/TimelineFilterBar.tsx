import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

interface TimelineFilterBarProps {
  selectedCase: string;
  onCaseChange: (val: string) => void;
  entityFilter: string;
  onEntityFilterChange: (val: string) => void;
  selectedType: string;
  onTypeChange: (val: string) => void;
  onReset: () => void;
}

const CASES = [
  { id: 'ALL', label: 'All Cases (Global)' },
  { id: 'FIC-CASE-0001', label: 'Case 0001: Maya Orchid' },
  { id: 'FIC-CASE-0002', label: 'Case 0002: Lotus Transit' },
  { id: 'FIC-CASE-0003', label: 'Case 0003: Falcon Shield' },
  { id: 'FIC-CASE-0004', label: 'Case 0004: Silver Stream' },
  { id: 'FIC-CASE-0005', label: 'Case 0005: Blue Horizon' },
  { id: 'FIC-CASE-0006', label: 'Case 0006: Operation Asteroid' },
];

const EVENT_TYPES = [
  { id: 'ALL', label: 'All Event Types' },
  { id: 'document_fir', label: 'FIR Complaints & Case Filings' },
  { id: 'phone_communication', label: 'Cellular Calls (CDR)' },
  { id: 'financial_transaction', label: 'Bank Wire Transfers' },
  { id: 'vehicle_movement', label: 'Vehicle Toll Movements' },
  { id: 'surveillance_observation', label: 'Field Surveillance Sightings' },
  { id: 'meeting_colocation', label: 'Meeting / Co-Locations' },
  { id: 'social_media_event', label: 'Digital / Social Sightings' },
];

export const TimelineFilterBar: React.FC<TimelineFilterBarProps> = ({
  selectedCase,
  onCaseChange,
  entityFilter,
  onEntityFilterChange,
  selectedType,
  onTypeChange,
  onReset,
}) => {
  return (
    <div className="bg-white p-4 rounded-3xl border border-[#E5DACB] shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-[#2C241D]">
      <div className="flex flex-1 flex-wrap items-center gap-2.5 w-full md:w-auto">
        {/* Case Scope Selector */}
        <div className="relative min-w-[200px]">
          <select
            value={selectedCase}
            onChange={(e) => onCaseChange(e.target.value)}
            className="w-full px-3.5 py-2 text-xs bg-[#F5EFE6]/60 border border-[#E5DACB] rounded-xl focus:outline-none focus:border-[#9C6644] text-[#2C241D] font-semibold"
          >
            {CASES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Event Type Filter */}
        <div className="relative min-w-[200px]">
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full px-3.5 py-2 text-xs bg-[#F5EFE6]/60 border border-[#E5DACB] rounded-xl focus:outline-none focus:border-[#9C6644] text-[#2C241D] font-semibold"
          >
            {EVENT_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Entity Search Input */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827A]" />
          <input
            type="text"
            value={entityFilter}
            onChange={(e) => onEntityFilterChange(e.target.value)}
            placeholder="Filter by subject or phone..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-[#F5EFE6]/60 border border-[#E5DACB] rounded-xl focus:outline-none focus:border-[#9C6644] text-[#2C241D] placeholder-[#9C9288]"
          />
        </div>
      </div>

      {/* Reset Controls Button */}
      <button
        type="button"
        onClick={onReset}
        className="flex items-center space-x-1 px-3 py-2 text-xs text-[#5C5248] hover:text-[#2C241D] hover:bg-[#F5EFE6] rounded-xl border border-[#E5DACB] transition-all cursor-pointer"
        title="Reset timeline filters"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Reset</span>
      </button>
    </div>
  );
};

export default TimelineFilterBar;
