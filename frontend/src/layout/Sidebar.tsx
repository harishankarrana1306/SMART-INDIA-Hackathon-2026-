import React from 'react';
import {
  LayoutDashboard,
  Network,
  ShieldCheck,
  FileUp,
  ListFilter,
  GitMerge,
  Clock,
  Bell,
  FileSpreadsheet,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Role } from '../types';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  phase?: number;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  // Phase 1 Core Modules
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'graph', label: 'Network Graph', icon: Network },
  { id: 'audit', label: 'Tamper-Proof Audit', icon: ShieldCheck },
  // Phase 2 Pipeline Modules
  { id: 'ingestion', label: 'Document Ingestion', icon: FileUp },
  { id: 'extraction', label: 'Extraction Review', icon: ListFilter },
  { id: 'resolution', label: 'Entity Resolution', icon: GitMerge },
  { id: 'timeline', label: 'Timeline Chronology', icon: Clock },
  // Phase 3 Modules (Active!)
  { id: 'alerts', label: 'Investigative Alerts', icon: Bell },
  { id: 'brief', label: 'Executive Briefs', icon: FileSpreadsheet },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();

  const getRoleBadge = (role?: Role) => {
    switch (role) {
      case 'administrator':
        return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">Admin</span>;
      case 'supervisor':
        return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">Supervisor</span>;
      default:
        return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-brand-purple/30 text-purple-200 border border-brand-purple/40">Investigator</span>;
    }
  };

  return (
    <aside className="w-64 bg-[#0B0D1B] border-r border-slate-800 text-white flex flex-col justify-between h-screen flex-shrink-0 select-none z-30">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-800/80 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-purple to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-purple/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold tracking-tight text-white truncate">
              NCRB Intelligence
            </h1>
            <p className="text-[11px] text-brand-muted truncate">Decision Support PS 26189</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Core Modules
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isPhaseLocked = !!item.phase && item.phase > 2;

            return (
              <button
                key={item.id}
                onClick={() => !isPhaseLocked && onTabChange(item.id)}
                disabled={isPhaseLocked}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/30'
                    : isPhaseLocked
                    ? 'opacity-40 text-slate-500 cursor-not-allowed hover:bg-transparent'
                    : 'text-slate-300 hover:bg-slate-850 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Logout */}
      <div className="p-3 border-t border-slate-800/80 bg-[#111322]/80">
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-200 truncate">
              {user?.full_name || 'Investigator'}
            </span>
            {getRoleBadge(user?.role)}
          </div>
          <p className="text-[11px] font-mono text-slate-400 truncate">
            @{user?.username || 'user'}
          </p>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
