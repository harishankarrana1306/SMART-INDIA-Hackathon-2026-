import React from 'react';
import { RotateCcw } from 'lucide-react';

interface AlertFiltersProps {
  severityFilter?: string;
  selectedSeverity?: string;
  onSeverityChange: (val: string) => void;
  statusFilter?: string;
  selectedStatus?: string;
  onStatusChange: (val: string) => void;
  onReset: () => void;
}

const SEVERITY_OPTIONS = [
  { id: 'ALL', label: 'All Severities' },
  { id: 'HIGH', label: 'High Priority' },
  { id: 'MEDIUM', label: 'Medium Priority' },
  { id: 'LOW', label: 'Low Priority' },
];

const STATUS_OPTIONS = [
  { id: 'ALL', label: 'All Statuses' },
  { id: 'unreviewed', label: 'Requires Review' },
  { id: 'acknowledged', label: 'Acknowledged' },
  { id: 'dismissed', label: 'Dismissed' },
];

export const AlertFilters: React.FC<AlertFiltersProps> = ({
  severityFilter,
  selectedSeverity,
  onSeverityChange,
  statusFilter,
  selectedStatus,
  onStatusChange,
  onReset,
}) => {
  const currentSeverity = selectedSeverity || severityFilter || 'ALL';
  const currentStatus = selectedStatus || statusFilter || 'ALL';

  return (
    <div className="bg-white p-4 rounded-3xl border border-[#E5DACB] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 text-[#2C241D]">
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 p-1 bg-[#F5EFE6] rounded-2xl border border-[#E5DACB]">
          {STATUS_OPTIONS.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => onStatusChange(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentStatus === st.id
                  ? 'bg-[#9C6644] text-white shadow-sm'
                  : 'text-[#5C5248] hover:text-[#2C241D] hover:bg-[#EAE1D5]'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Severity Filter Dropdown */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-[#7D7268] uppercase tracking-wider">Severity:</span>
          <select
            value={currentSeverity}
            onChange={(e) => onSeverityChange(e.target.value)}
            className="px-3 py-1.5 bg-[#F5EFE6]/60 border border-[#E5DACB] rounded-xl text-xs font-semibold text-[#2C241D] focus:outline-none focus:border-[#9C6644]"
          >
            {SEVERITY_OPTIONS.map((sev) => (
              <option key={sev.id} value={sev.id}>
                {sev.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#F5EFE6] hover:bg-[#EAE1D5] text-[#5C5248] border border-[#E5DACB] rounded-xl text-xs font-semibold transition-all cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Reset Filters</span>
      </button>
    </div>
  );
};

export default AlertFilters;
