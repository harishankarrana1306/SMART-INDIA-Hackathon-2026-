import React, { useMemo } from 'react';
import {
  Search,
  Filter,
  RotateCcw,
  Network,
  Layers,
  Shield,
  X,
  User,
  Phone,
  Car,
  MapPin,
  Building2,
  Landmark,
  FolderGit2,
  Activity,
} from 'lucide-react';
import { GraphNodeData } from '../../types';

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
  allNodes?: GraphNodeData[];
  onSelectEntity?: (nodeId: string) => void;
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
  allNodes = [],
  onSelectEntity,
}) => {
  const getEntityIcon = (label: string) => {
    switch (label) {
      case 'Person':
        return <User className="w-3 h-3 text-white" />;
      case 'Phone':
        return <Phone className="w-3 h-3 text-white" />;
      case 'Vehicle':
        return <Car className="w-3 h-3 text-white" />;
      case 'Location':
        return <MapPin className="w-3 h-3 text-white" />;
      case 'Organisation':
        return <Building2 className="w-3 h-3 text-white" />;
      case 'BankAccount':
        return <Landmark className="w-3 h-3 text-white" />;
      case 'Case':
        return <FolderGit2 className="w-3 h-3 text-white" />;
      default:
        return <Activity className="w-3 h-3 text-white" />;
    }
  };

  const getEntityBg = (label: string) => {
    switch (label) {
      case 'Person':
        return '#3B82F6';
      case 'Phone':
        return '#8B5CF6';
      case 'Vehicle':
        return '#F59E0B';
      case 'Location':
        return '#06B6D4';
      case 'Organisation':
        return '#F43F5E';
      case 'BankAccount':
        return '#10B981';
      case 'Case':
        return '#B45309';
      default:
        return '#9C6644';
    }
  };

  // Live matching entities in graph dataset
  const matchingEntities = useMemo(() => {
    if (!searchTerm.trim() || allNodes.length === 0) return [];
    const q = searchTerm.toLowerCase().trim();
    const tokens = q.replace(/[,;]/g, ' ').split(/\s+/).filter((w) => w.length >= 2);

    return allNodes
      .filter((n) => {
        const name = (n.properties?.display_name || n.properties?.name || '').toLowerCase();
        const code = (n.properties?.case_code || '').toLowerCase();
        const aliases = (n.properties?.merged_aliases || []).join(' ').toLowerCase();
        const raw = JSON.stringify(n.properties || {}).toLowerCase();
        const targetText = `${name} ${n.id.toLowerCase()} ${code} ${aliases} ${raw}`;

        if (targetText.includes(q)) return true;

        for (let i = 0; i < tokens.length - 1; i++) {
          const bigram = `${tokens[i]} ${tokens[i + 1]}`;
          if (targetText.includes(bigram)) return true;
        }

        for (const t of tokens) {
          if (t.length >= 3 && (name.includes(t) || aliases.includes(t))) {
            return true;
          }
        }
        return false;
      })
      .slice(0, 8);
  }, [searchTerm, allNodes]);

  const handleSelectSuggestion = (nodeId: string) => {
    if (onSelectEntity) {
      onSelectEntity(nodeId);
    }
    onSearchChange('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && matchingEntities.length > 0) {
      handleSelectSuggestion(matchingEntities[0].id);
    } else if (e.key === 'Escape') {
      onSearchChange('');
    }
  };
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
      <div className="p-4 border-b border-[#E5DACB] space-y-2 relative">
        <label className="block text-xs font-bold text-[#5A4D41] uppercase tracking-wider">
          Search Entities
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-[#7D7268] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Name, phone, vehicle, account..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-[#FFFDFB] border border-[#E5DACB] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#9C6644] focus:border-[#9C6644] text-[#2C241D] placeholder-[#A89F91] shadow-xs font-semibold"
          />
          {searchTerm.trim() && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C827A] hover:text-[#2C241D] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Live Matching Entities Dropdown */}
        {matchingEntities.length > 0 && (
          <div className="absolute top-full left-4 right-4 mt-1 bg-white rounded-xl border border-[#E0D5C5] shadow-xl overflow-hidden z-50 divide-y divide-[#EAE0D5]">
            <div className="px-3 py-1.5 bg-[#F5EFE6] flex items-center justify-between text-[10px] font-bold text-[#7D7268]">
              <span>MATCHING ENTITIES ({matchingEntities.length})</span>
              <span className="text-[#9C6644]">Click to highlight</span>
            </div>
            <div className="max-h-56 overflow-y-auto">
              {matchingEntities.map((n) => {
                const displayName = n.properties?.display_name || n.properties?.name || n.id;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(n.id)}
                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-[#FAF7F2] transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 shadow-2xs"
                        style={{ backgroundColor: getEntityBg(n.label) }}
                      >
                        {getEntityIcon(n.label)}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#20150F] group-hover:text-[#9C6644] truncate">
                          {displayName}
                        </div>
                        <div className="text-[10px] text-[#7D7065] flex items-center gap-1.5">
                          <span>{n.label}</span>
                          {n.properties?.case_code && (
                            <span className="font-mono text-[9px] bg-[#F5EFE6] px-1 rounded text-[#8A5A36]">
                              {n.properties.case_code}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
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
