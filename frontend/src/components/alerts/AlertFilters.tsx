import React from 'react';
import { RotateCcw } from 'lucide-react';

interface AlertFiltersProps {
  severityFilter: string;
  onSeverityChange: (val: string) => void;
  statusFilter: string;
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
  onSeverityChange,
  statusFilter,
  onStatusChange,
  onReset,
}) => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Filter */}
        <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl">
          {STATUS_OPTIONS.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => onStatusChange(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === st.id
                  ? 'bg-white text-brand-purple shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Severity Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => onSeverityChange(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-purple"
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
        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all text-xs flex items-center gap-1.5"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Reset</span>
      </button>
    </div>
  );
};

export default AlertFilters;
