import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { CheckCircle2, RefreshCw, X } from 'lucide-react';

interface AppShellProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  title: string;
  subtitle?: string;
  onRefreshData?: () => void;
  onNavigateToGraph?: (caseCode?: string, nodeIdOrName?: string) => void;
  onNavigateToAlerts?: () => void;
  onNavigateToTimeline?: (entityName?: string) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  onTabChange,
  title,
  subtitle,
  onRefreshData,
  onNavigateToGraph,
  onNavigateToAlerts,
  onNavigateToTimeline,
  children,
}) => {
  const [reloadNotice, setReloadNotice] = useState<string | null>(null);

  useEffect(() => {
    const handleReload = () => {
      setReloadNotice('Sample data reloaded successfully! All session files and graph additions have been wiped, restoring only original backend entries (54 canonical relationships).');
      const t = setTimeout(() => setReloadNotice(null), 5000);
      return () => clearTimeout(t);
    };
    window.addEventListener('netra-data-reloaded', handleReload);
    return () => window.removeEventListener('netra-data-reloaded', handleReload);
  }, []);

  return (
    <div className="flex h-screen w-screen bg-[#FBF8F3] overflow-hidden text-[#2C241D] relative">
      {/* Global Reload Notification Toast */}
      {reloadNotice && (
        <div className="fixed top-5 right-6 z-50 max-w-md p-4 rounded-3xl bg-[#1C120B] text-white border border-[#DDA15E] shadow-2xl animate-slideDown flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#3B2414] border border-[#F59E0B] flex items-center justify-center text-[#F59E0B] flex-shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-[#F5EFE6]">
              Data Reloaded Successfully
            </h4>
            <p className="text-[11px] text-[#C5B8AA] mt-0.5 leading-relaxed">
              {reloadNotice}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReloadNotice(null)}
            className="p-1 text-[#8C7A6B] hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Topbar
          title={title}
          subtitle={subtitle}
          onRefreshData={onRefreshData}
          onNavigateToGraph={onNavigateToGraph}
          onNavigateToAlerts={onNavigateToAlerts}
          onNavigateToTimeline={onNavigateToTimeline}
        />

        <main className="flex-1 overflow-hidden relative flex flex-col bg-[#FBF8F3]">
          <div className="flex-1 overflow-y-auto min-h-0 relative">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
