import React from 'react';
import { User, Phone, Car, MapPin, Building2, Landmark, FolderGit2 } from 'lucide-react';

export const GRAPH_NODE_COLORS: Record<string, { bg: string; label: string; icon: React.ReactNode }> = {
  Person: { bg: '#5F01FB', label: 'Person', icon: <User className="w-3 h-3 text-white" /> },
  Phone: { bg: '#8B5CF6', label: 'Phone Number', icon: <Phone className="w-3 h-3 text-white" /> },
  Vehicle: { bg: '#514A85', label: 'Vehicle', icon: <Car className="w-3 h-3 text-white" /> },
  Location: { bg: '#38BDF8', label: 'Location', icon: <MapPin className="w-3 h-3 text-white" /> },
  Organisation: { bg: '#A78BFA', label: 'Organisation', icon: <Building2 className="w-3 h-3 text-white" /> },
  BankAccount: { bg: '#14B8A6', label: 'Bank Account', icon: <Landmark className="w-3 h-3 text-white" /> },
  Case: { bg: '#F59E0B', label: 'Case / FIR', icon: <FolderGit2 className="w-3 h-3 text-white" /> },
};

export const GraphLegend: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`p-3 bg-[#111322]/90 border border-slate-800/90 backdrop-blur-md rounded-xl shadow-xl text-white ${className}`}>
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
        Entity Types Legend
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        {Object.entries(GRAPH_NODE_COLORS).map(([type, config]) => (
          <div key={type} className="flex items-center space-x-2">
            <span
              className="w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-sm flex-shrink-0"
              style={{ backgroundColor: config.bg }}
            />
            <span className="text-slate-300 text-[11px] font-medium">{config.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GraphLegend;
