import React from 'react';
import {
  LayoutDashboard,
  Network,
  FileUp,
  ListFilter,
  GitMerge,
  Clock,
  Bell,
  FileSpreadsheet,
  LogOut,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { api } from '../api/client';
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
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'graph', label: 'Network Graph', icon: Network },
  { id: 'ingestion', label: 'Document Ingestion', icon: FileUp },
  { id: 'extraction', label: 'Extraction Review', icon: ListFilter },
  { id: 'resolution', label: 'Entity Resolution', icon: GitMerge },
  { id: 'alerts', label: 'Investigation Alerts', icon: Bell },
  { id: 'brief', label: 'Executive Briefs', icon: FileSpreadsheet },
  { id: 'timeline', label: 'Crime Timeline', icon: Clock },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();

  const getInitials = (name?: string) => {
    if (!name) return 'RS';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <aside className="relative w-64 bg-[#140C07] border-r border-[#2C190F] text-[#E5DACB] flex flex-col justify-between h-screen flex-shrink-0 select-none z-30 shadow-2xl overflow-hidden">
      {/* Full-Height Ambient 3D Glowing Chocolate Cubes Background */}
      <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
        <img
          src="/sidebar_chocolate_cubes.jpg"
          alt="Cryptographic Intelligence Chain"
          className="w-full h-full object-cover object-bottom opacity-40 mix-blend-screen scale-110"
        />
        {/* Soft Vignette Overlay so contents and text are 100% visible and sharp */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#140C07] via-[#140C07]/75 to-[#140C07]/90" />
      </div>

      {/* Top Section: Official Netra Eye Logo Header & 3D Bubble Navigation Container */}
      <div className="relative z-10 overflow-y-auto flex-1 flex flex-col justify-between scrollbar-none py-2">
        <div className="space-y-3">
          {/* Brand Header with Netra Eye Logo */}
          <div className="px-5 py-3 flex items-center space-x-3">
            <div className="w-12 h-10 relative flex items-center justify-center flex-shrink-0">
              <img
                src="/netra_eye_logo_transparent.png"
                alt="NETRA Official Logo"
                className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(221,161,94,0.45)]"
              />
            </div>

            <div className="min-w-0">
              <h1 className="text-base font-black tracking-wider text-white leading-tight">
                NETRA
              </h1>
              <p className="text-[8px] font-black uppercase tracking-widest text-[#DDA15E] truncate mt-0.5">
                Criminal Network Analysis
              </p>
            </div>
          </div>

          {/* 3D Bubble Navigation Container for Investigative Workflow Tabs */}
          <div className="px-3">
            <div
              className="p-2.5 rounded-[28px] border border-[#3E2819] backdrop-blur-md space-y-1"
              style={{
                background: 'linear-gradient(180deg, rgba(32, 19, 12, 0.90) 0%, rgba(18, 10, 6, 0.95) 100%)',
                boxShadow:
                  '0 16px 36px -8px rgba(0, 0, 0, 0.65), inset 0 1px 2px rgba(255, 255, 255, 0.18), inset 0 -2px 6px rgba(0, 0, 0, 0.45)',
              }}
            >
              <div className="px-3 py-1 text-[9.5px] font-black uppercase tracking-widest text-[#8C7A6B]">
                Investigative Workflow
              </div>

              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'text-white shadow-xl'
                        : 'text-[#C5B8AA] hover:bg-[#2C1D13]/70 hover:text-white'
                    }`}
                    style={
                      isActive
                        ? {
                            background: 'linear-gradient(180deg, #9C6644 0%, #7A4822 50%, #583112 100%)',
                            boxShadow:
                              '0 8px 20px -2px rgba(104, 63, 30, 0.6), 0 2px 0 #3E1E08, inset 0 1.5px 2px rgba(255, 255, 255, 0.40)',
                            border: '1px solid #B07D58',
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white stroke-[2.5]' : 'text-[#9C8A7B]'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ${
                          isActive
                            ? 'bg-[#4A2C14] text-[#DDA15E] border border-[#8A5A36]'
                            : 'bg-[#5C381E] text-[#DDA15E] border border-[#7D5337]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Supervisory Governance (Supervisor Only) */}
              {user?.role === 'supervisor' && (
                <div className="pt-2 mt-1.5 border-t border-[#2C190F]/80 space-y-1.5">
                  <div className="px-3 py-1 text-[9.5px] font-black uppercase tracking-widest text-[#DDA15E]">
                    Supervisory Governance
                  </div>
                  <button
                    type="button"
                    onClick={() => onTabChange('audit')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'audit'
                        ? 'text-white shadow-xl'
                        : 'text-[#C5B8AA] hover:bg-[#2C1D13]/70 hover:text-white'
                    }`}
                    style={
                      activeTab === 'audit'
                        ? {
                            background: 'linear-gradient(180deg, #9C6644 0%, #7A4822 50%, #583112 100%)',
                            boxShadow:
                              '0 8px 20px -2px rgba(104, 63, 30, 0.6), 0 2px 0 #3E1E08, inset 0 1.5px 2px rgba(255, 255, 255, 0.40)',
                            border: '1px solid #B07D58',
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-center space-x-3">
                      <ShieldCheck className={`w-4 h-4 ${activeTab === 'audit' ? 'text-white' : 'text-[#DDA15E]'}`} />
                      <span>Tamper-Proof Audit</span>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#3A2214] text-[#DDA15E] border border-[#5C381E]">
                      SHA-256
                    </span>
                  </button>

                  {/* Reload Sample Data Button — SUPERVISOR ONLY */}
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await api.loadDemoData();
                        window.dispatchEvent(new CustomEvent('netra-data-reloaded'));
                        setTimeout(() => {
                          window.location.reload();
                        }, 500);
                      } catch (e) {
                        console.error('Failed to reload demo data:', e);
                      }
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2 rounded-2xl text-xs font-bold text-[#E5DACB] hover:text-white hover:bg-[#382114] border border-[#4A2C18] transition-all cursor-pointer shadow-sm"
                    title="Supervisor Reset: Wipe session files, extra extractions, and restore canonical 54 graph relationships"
                  >
                    <div className="flex items-center space-x-2.5">
                      <RefreshCw className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span className="text-[11px]">Reload Sample Data</span>
                    </div>
                    <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-[#2A150B] text-[#F59E0B] border border-[#5C381E]">
                      RESET
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: 3D Bubble User Profile Card */}
      <div className="relative z-10 p-3">
        <div
          className="p-3 rounded-2xl border border-[#3E2819] flex items-center justify-between"
          style={{
            background: 'linear-gradient(145deg, #24160E 0%, #160D07 100%)',
            boxShadow: '0 10px 25px -4px rgba(0,0,0,0.55), inset 0 1px 1.5px rgba(255,255,255,0.18)',
          }}
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            {/* Circular RS Avatar */}
            <div className="w-10 h-10 rounded-full bg-[#5C381E] border border-[#8A5A36] flex items-center justify-center text-[#F5EFE6] flex-shrink-0 font-black text-xs shadow-inner">
              {getInitials(user?.full_name)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-white truncate">
                {user?.full_name || 'Rhea Sharma'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[8.5px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-[#140C07] text-[#C5B8AA] border border-[#3E2819]">
                  {user?.role === 'supervisor' ? 'Supervisor' : 'Investigator'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="p-2 text-[#8C7A6B] hover:text-white hover:bg-[#3A1F18] rounded-xl transition-all cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
