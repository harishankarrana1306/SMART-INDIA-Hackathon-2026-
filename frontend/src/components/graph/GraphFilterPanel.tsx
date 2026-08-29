import React from 'react';
import { Search, Filter, RotateCcw, Network, Layers, Shield } from 'lucide-react';

interface GraphFilterPanelProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedCase: string;
  onCaseChange: (val: string) => void;
  selectedType: string;
  onTypeChange: (val: string) => void;
  selectedRelType: string;
  onRelTypeChange: (val: string) => void;
  selectedLayout: string;
  onLayoutChange: (val: string) => void;
  onReset: () => void;
  nodeCount: number;
  edgeCount: number;
  isHighRiskFocus?: boolean;
  onToggleHighRiskFocus?: () => void;
}

const CASE_OPTIONS: { id: string; label: string }[] = [
  { id: 'ALL', label: 'All Cases (Global Cross-Case Network)' },
  { id: 'FIC-CASE-0001', label: 'FIC-CASE-0001: Cyber Remittance Syndicate (Maya Orchid)' },
  { id: 'FIC-CASE-0002', label: 'FIC-CASE-0002: Inter-State Transport & Hawala (Lotus Transit)' },
  { id: 'FIC-CASE-0003', label: 'FIC-CASE-0003: Counterfeit Identity & Forgery (Falcon Shield)' },
  { id: 'FIC-CASE-0004', label: 'FIC-CASE-0004: ATM Cash-Out & Rapid Mule (Silver Stream)' },
  { id: 'FIC-CASE-0005', label: 'FIC-CASE-0005: Cellular SIM Relay & GSM Array (Blue Horizon)' },
  { id: 'FIC-CASE-0006', label: 'FIC-CASE-0006: Phishing Gateway Infrastructure (Asteroid)' },
];

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
  selectedCase,
  onCaseChange,
  selectedType,
  onTypeChange,
  selectedRelType,
  onRelTypeChange,
  selectedLayout,
  onLayoutChange,
  onReset,
  nodeCount,
  edgeCount,
  isHighRiskFocus = false,
  onToggleHighRiskFocus,
}) => {
  return (
    <aside className="w-80 bg-[#F5EFE6] border-r border-[#E5DACB] flex flex-col h-full overflow-y-auto shadow-sm text-[#2C241D]">
      {/* Panel Header */}
      <div className="p-4 border-b border-[#E5DACB] bg-[#EAE1D5]">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold text-[#2C241D] flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#9C6644]" />
            Network Graph Filters
          </h2>
          <button
            type="button"
            onClick={onReset}
            className="p-1 text-[#7D7268] hover:text-[#2C241D] hover:bg-[#D8CBB9] rounded-lg transition-all text-xs flex items-center gap-1 cursor-pointer"
            title="Reset Filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs mt-2 font-mono">
          <span className="bg-[#9C6644]/15 text-[#9C6644] px-2 py-0.5 rounded-lg border border-[#9C6644]/25 font-bold">
            {nodeCount} Nodes
          </span>
          <span className="bg-[#4A6FA5]/15 text-[#4A6FA5] px-2 py-0.5 rounded-lg border border-[#4A6FA5]/25 font-bold">
            {edgeCount} Edges
          </span>
        </div>
      </div>

      {/* Case Selector Filter */}
      <div className="p-4 border-b border-[#E5DACB] space-y-2">
        <label className="block text-xs font-bold text-[#5A4D41] uppercase tracking-wider">
          Active Case Scope
        </label>
        <select
          value={selectedCase}
          onChange={(e) => onCaseChange(e.target.value)}
          className="w-full px-3 py-2 text-xs bg-[#FFFDFB] border border-[#E5DACB] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#9C6644] focus:border-[#9C6644] font-semibold text-[#2C241D] shadow-xs"
        >
          {CASE_OPTIONS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-[#7D7268] mt-1">
          {selectedCase === 'ALL'
            ? 'Viewing all interconnected syndicates across the full cross-case network.'
            : 'Focusing on entities and cross-case bridges originating from this investigation.'}
        </p>

        {/* High Risk Focus Toggle Button */}
        {onToggleHighRiskFocus && (
          <button
            type="button"
            onClick={onToggleHighRiskFocus}
            className={`w-full mt-2 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
              isHighRiskFocus
                ? 'bg-[#7F1D1D] text-white border border-[#EF4444] shadow-md ring-2 ring-[#EF4444]/20'
                : 'bg-[#FFFDFB] text-[#7F1D1D] border border-[#E5DACB] hover:bg-[#FCE8E6]'
            }`}
          >
            <Shield className={`w-3.5 h-3.5 ${isHighRiskFocus ? 'text-[#FCA5A5]' : 'text-[#DC2626]'}`} />
            <span>
              {isHighRiskFocus ? 'Clear High Risk Focus' : 'Focus 14 High Risk Entities'}
            </span>
          </button>
        )}
      </div>

      {/* Search Filter */}
      <div className="p-4 border-b border-[#E5DACB] space-y-2">
        <label className="block text-xs font-bold text-[#5A4D41] uppercase tracking-wider">
          Search Entities
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-[#7D7268] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Name, phone, vehicle, account..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#FFFDFB] border border-[#E5DACB] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#9C6644] focus:border-[#9C6644] text-[#2C241D] placeholder-[#A89F91]"
          />
        </div>
      </div>

      {/* Entity Type Filter */}
      <div className="p-4 border-b border-[#E5DACB] space-y-2">
        <label className="block text-xs font-bold text-[#5A4D41] uppercase tracking-wider">
          Entity Type
        </label>
        <select
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value)}
          className="w-full px-3 py-2 text-xs bg-[#FFFDFB] border border-[#E5DACB] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#9C6644] focus:border-[#9C6644] text-[#2C241D]"
        >
          {ENTITY_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Relationship Type Filter */}
      <div className="p-4 border-b border-[#E5DACB] space-y-2">
        <label className="block text-xs font-bold text-[#5A4D41] uppercase tracking-wider">
          Relationship Type
        </label>
        <select
          value={selectedRelType}
          onChange={(e) => onRelTypeChange(e.target.value)}
          className="w-full px-3 py-2 text-xs bg-[#FFFDFB] border border-[#E5DACB] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#9C6644] focus:border-[#9C6644] text-[#2C241D]"
        >
          {RELATIONSHIP_TYPES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Layout Selector */}
      <div className="p-4 border-b border-[#E5DACB] space-y-2">
        <label className="block text-xs font-bold text-[#5A4D41] uppercase tracking-wider">
          Graph Layout
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { id: 'cose', label: 'Force-Directed' },
            { id: 'concentric', label: 'Concentric' },
            { id: 'breadthfirst', label: 'Tree / Hierarchy' },
            { id: 'circle', label: 'Circular' },
          ].map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => onLayoutChange(l.id)}
              className={`py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all text-center cursor-pointer ${
                selectedLayout === l.id
                  ? 'bg-[#9C6644] text-white shadow-xs'
                  : 'bg-[#FFFDFB] text-[#5A4D41] border border-[#E5DACB] hover:bg-[#EAE1D5]'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default GraphFilterPanel;
