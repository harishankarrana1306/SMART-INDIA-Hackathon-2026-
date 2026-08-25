import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface AppShellProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  title: string;
  subtitle?: string;
  onRefreshData?: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  onTabChange,
  title,
  subtitle,
  onRefreshData,
  children,
}) => {
  return (
    <div className="flex h-screen w-screen bg-[#F7F7FC] overflow-hidden">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Topbar title={title} subtitle={subtitle} onRefreshData={onRefreshData} />

        <main className="flex-1 overflow-hidden relative flex flex-col">
          <div className="flex-1 overflow-y-auto min-h-0 relative">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
