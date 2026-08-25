import React from 'react';
import { Search, Filter, RotateCcw, Network, Layers } from 'lucide-react';

interface GraphFilterPanelProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedType: string;
  onTypeChange: (val: string) => void;
  selectedRelType: string;
  onRelTypeChange: (val: string) => void;
  selectedLayout: string;
  onLayoutChange: (val: string) => void;
  onReset: () => void;
  nodeCount: number;
  edgeCount: number;
}

const ENTITY_TYPES: { id: string; label: string }[] = [
  { id: 'ALL', label: 'All Entity Types' },
  { id: 'Person', label: 'Person' },
  { id: 'Phone', label: 'Phone' },
  { id: 'Vehicle', label: 'Vehicle' },
  { id: 'Location', label: 'Location' },
  { id: 'Organisation', label: 'Organisation' },
  { id: 'BankAccount', label: 'Bank Account' },
  { id: 'Case', label: 'Case' },
];

const RELATIONSHIP_TYPES: { id: string; label: string }[] = [
  { id: 'ALL', label: 'All Relationships' },
  { id: 'INVOLVED_IN', label: 'Involved In' },
  { id: 'LINKED_THROUGH_REPORT', label: 'Linked In Report' },
  { id: 'CALLED', label: 'Called (CDR)' },
  { id: 'TRANSFERRED_MONEY_TO', label: 'Transferred Money' },
  { id: 'OWNS_OR_USES', label: 'Owns / Uses Vehicle' },
  { id: 'REGISTERED_AT', label: 'Registered At' },
  { id: 'PRESENT_AT', label: 'Present At (Surveillance)' },
  { id: 'ASSOCIATED_WITH', label: 'Associated With' },
  { id: 'OWNS_PHONE', label: 'Owns Phone' },
];

export const GraphFilterPanel: React.FC<GraphFilterPanelProps> = ({
  searchTerm,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedRelType,
  onRelTypeChange,
  selectedLayout,
  onLayoutChange,
  onReset,
  nodeCount,
  edgeCount,
}) => {
  return (
    <aside className="w-80 bg-white border-r border-brand-border flex flex-col h-full overflow-y-auto shadow-sm">
      {/* Panel Header */}
      <div className="p-4 border-b border-brand-border bg-slate-50/50">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Filter className="w-4 h-4 text-brand-purple" />
            Network Graph Filters
          </h2>
          <button
            type="button"
            onClick={onReset}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-all text-xs flex items-center gap-1"
            title="Reset Filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs text-brand-muted mt-2 font-mono">
          <span className="bg-purple-50 text-brand-purple px-2 py-0.5 rounded border border-purple-100 font-semibold">
            {nodeCount} Nodes
          </span>
          <span className="bg-indigo-50 text-brand-indigo px-2 py-0.5 rounded border border-indigo-100 font-semibold">
            {edgeCount} Edges
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-brand-border">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Search Entities & Cases
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search person, phone, vehicle, etc..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all text-slate-800"
          />
        </div>
      </div>

      {/* Entity Type Filter */}
      <div className="p-4 border-b border-brand-border">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Entity Type Filter
        </label>
        <select
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value)}
          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-purple text-slate-800"
        >
          {ENTITY_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Relationship Type Filter */}
      <div className="p-4 border-b border-brand-border">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Relationship Type
        </label>
        <select
          value={selectedRelType}
          onChange={(e) => onRelTypeChange(e.target.value)}
          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-purple text-slate-800"
        >
          {RELATIONSHIP_TYPES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Physics / Layout Engine */}
      <div className="p-4 border-b border-brand-border">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-brand-purple" />
          Graph Layout Algorithm
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'cose', label: 'Force-Directed' },
            { id: 'concentric', label: 'Concentric' },
            { id: 'circle', label: 'Circular' },
            { id: 'breadthfirst', label: 'Hierarchical' },
          ].map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => onLayoutChange(l.id)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                selectedLayout === l.id
                  ? 'bg-brand-purple text-white border-brand-purple shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Help / Guide Box */}
      <div className="p-4 mt-auto">
        <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 text-purple-900 text-xs space-y-1.5">
          <p className="font-semibold flex items-center gap-1">
            <Network className="w-3.5 h-3.5 text-brand-purple" />
            Investigator Controls
          </p>
          <ul className="text-[11px] text-purple-800/90 space-y-1 list-disc list-inside">
            <li>Click a node to inspect entity profile.</li>
            <li>Click an edge to review origin evidence.</li>
            <li>Use <strong>Expand</strong> to load 2nd-degree links.</li>
          </ul>
        </div>
      </div>
    </aside>
  );
};

export default GraphFilterPanel;
