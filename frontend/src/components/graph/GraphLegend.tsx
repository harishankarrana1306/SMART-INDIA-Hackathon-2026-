import React, { useState } from 'react';
import { User, Phone, Car, MapPin, Building2, Landmark, FolderGit2, ChevronUp, ChevronDown, Layers, Minimize2, Maximize2 } from 'lucide-react';

export const GRAPH_NODE_COLORS: Record<string, { bg: string; label: string; icon: React.ReactNode }> = {
  Person: { bg: '#4F46E5', label: 'Person', icon: <User className="w-3 h-3 text-white" /> },
  Phone: { bg: '#7C3AED', label: 'Phone Number', icon: <Phone className="w-3 h-3 text-white" /> },
  Vehicle: { bg: '#D97706', label: 'Vehicle', icon: <Car className="w-3 h-3 text-white" /> },
  Location: { bg: '#0284C7', label: 'Location', icon: <MapPin className="w-3 h-3 text-white" /> },
  Organisation: { bg: '#9333EA', label: 'Organisation', icon: <Building2 className="w-3 h-3 text-white" /> },
  BankAccount: { bg: '#0D9488', label: 'Bank Account', icon: <Landmark className="w-3 h-3 text-white" /> },
  Case: { bg: '#B45309', label: 'Case / FIR', icon: <FolderGit2 className="w-3 h-3 text-white" /> },
};

export const GraphLegend: React.FC<{ className?: string; defaultMinimized?: boolean }> = ({
  className = '',
  defaultMinimized = false,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(defaultMinimized);

  if (isMinimized) {
    return (
      <button
        type="button"
        onClick={() => setIsMinimized(false)}
        className={`flex items-center gap-2 px-3 py-2 bg-[#F5EFE6]/95 hover:bg-[#EAE1D5] border border-[#E5DACB] backdrop-blur-md rounded-2xl shadow-lg text-[#2C241D] transition-all cursor-pointer hover:shadow-xl group ${className}`}
        title="Click to expand Entity Types Legend"
      >
        <div className="flex items-center -space-x-1.5">
          {Object.values(GRAPH_NODE_COLORS).slice(0, 4).map((c, i) => (
            <span
              key={i}
              className="w-3.5 h-3.5 rounded-full border border-white flex-shrink-0 shadow-2xs"
              style={{ backgroundColor: c.bg }}
            />
          ))}
        </div>
        <span className="text-[11px] font-bold text-[#5C5248] tracking-tight group-hover:text-[#2C241D]">
          Entity Legend
        </span>
        <Maximize2 className="w-3 h-3 text-[#8C827A] group-hover:text-[#2C241D] ml-0.5" />
      </button>
    );
  }

  return (
    <div
      className={`p-3.5 bg-[#F5EFE6]/95 border border-[#E5DACB] backdrop-blur-md rounded-2xl shadow-lg text-[#2C241D] transition-all animate-fadeIn ${className}`}
    >
      <div className="flex items-center justify-between gap-4 mb-2.5 pb-1 border-b border-[#E5DACB]/60">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#9C6644]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D7268]">
            Entity Types Legend
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsMinimized(true)}
          className="p-1 text-[#8C827A] hover:text-[#2C241D] hover:bg-[#EAE1D5] rounded-lg transition-all cursor-pointer flex items-center gap-1"
          title="Minimize legend to save canvas space"
        >
          <span className="text-[10px] font-semibold text-[#8C827A] hover:text-[#2C241D]">Minimize</span>
          <Minimize2 className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        {Object.entries(GRAPH_NODE_COLORS).map(([type, config]) => (
          <div key={type} className="flex items-center space-x-2">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center shadow-xs flex-shrink-0"
              style={{ backgroundColor: config.bg }}
            >
              {config.icon}
            </span>
            <span className="text-[#2C241D] text-[11px] font-semibold">{config.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GraphLegend;
