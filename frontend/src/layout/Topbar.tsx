import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  CheckCircle2,
  Loader2,
  Activity,
  Search,
  Bell,
  X,
  User,
  Phone,
  Car,
  MapPin,
  Building2,
  Landmark,
  FolderGit2,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { GraphNodeData, AlertItem } from '../types';

interface TopbarProps {
  title: string;
  subtitle?: string;
  onRefreshData?: () => void;
  onNavigateToGraph?: (caseCode?: string, nodeIdOrName?: string) => void;
  onNavigateToAlerts?: () => void;
  onNavigateToTimeline?: (entityName?: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  title,
  subtitle,
  onRefreshData,
  onNavigateToGraph,
  onNavigateToAlerts,
  onNavigateToTimeline,
}) => {
  const { user } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GraphNodeData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Notification state
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const alertsContainerRef = useRef<HTMLDivElement>(null);

  // Fetch alerts for notification bell
  const loadAlerts = async () => {
    try {
      const data = await api.getAlerts();
      // Keep only active/unreviewed alerts
      const activeAlerts = (data || []).filter(
        (a) => a.status !== 'acknowledged' && a.status !== 'dismissed'
      );
      setAlerts(activeAlerts);
      setUnreadCount(activeAlerts.length);
    } catch (err) {
      console.error('Failed to load alerts for notification center:', err);
    }
  };

  const handleMarkAlertRead = async (e: React.MouseEvent, alertId: string) => {
    e.stopPropagation();
    try {
      await api.acknowledgeAlert(alertId, 'Read by investigator');
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    window.dispatchEvent(new CustomEvent('netra-data-reloaded'));
  };

  const handleAlertClick = async (alertId: string) => {
    setIsAlertsOpen(false);
    try {
      await api.acknowledgeAlert(alertId, 'Inspected by investigator');
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    window.dispatchEvent(new CustomEvent('netra-data-reloaded'));
    if (onNavigateToAlerts) onNavigateToAlerts();
  };

  useEffect(() => {
    loadAlerts();
    const handleReload = () => loadAlerts();
    window.addEventListener('netra-data-reloaded', handleReload);
    return () => window.removeEventListener('netra-data-reloaded', handleReload);
  }, []);

  // Debounced search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const nodes = await api.getNodes(undefined, searchQuery.trim());
        setSearchResults(nodes);
        setIsSearchOpen(true);
      } catch (e) {
        console.error('Search failed:', e);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Outside click listener to dismiss search / alerts dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
      if (
        alertsContainerRef.current &&
        !alertsContainerRef.current.contains(event.target as Node)
      ) {
        setIsAlertsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSeedDemoData = async () => {
    setIsSeeding(true);
    try {
      await api.loadDemoData();
      setSeedSuccess(true);
      window.dispatchEvent(new CustomEvent('netra-data-reloaded'));
      if (onRefreshData) onRefreshData();
      loadAlerts();
      setTimeout(() => setSeedSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to load demo data:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSelectSearchResult = (node: GraphNodeData) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    const caseCode = node.properties?.case_code || 'FIC-CASE-0001';
    if (onNavigateToGraph) {
      onNavigateToGraph(caseCode, node.id);
    }
    // Dispatch direct focus event so GraphPage instantly highlights and centers on node
    window.dispatchEvent(
      new CustomEvent('netra-focus-node', {
        detail: {
          nodeId: node.id,
          caseCode,
        },
      })
    );
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (searchResults.length > 0) {
        handleSelectSearchResult(searchResults[0]);
      } else if (searchQuery.trim() && onNavigateToGraph) {
        setIsSearchOpen(false);
        onNavigateToGraph('ALL', searchQuery.trim());
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  const getEntityIcon = (label: string) => {
    switch (label) {
      case 'Person':
        return <User className="w-3.5 h-3.5 text-white" />;
      case 'Phone':
        return <Phone className="w-3.5 h-3.5 text-white" />;
      case 'Vehicle':
        return <Car className="w-3.5 h-3.5 text-white" />;
      case 'Location':
        return <MapPin className="w-3.5 h-3.5 text-white" />;
      case 'Organisation':
        return <Building2 className="w-3.5 h-3.5 text-white" />;
      case 'BankAccount':
        return <Landmark className="w-3.5 h-3.5 text-white" />;
      case 'Case':
        return <FolderGit2 className="w-3.5 h-3.5 text-white" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-white" />;
    }
  };

  const getEntityBg = (label: string) => {
    switch (label) {
      case 'Person':
        return '#4F46E5';
      case 'Phone':
        return '#7C3AED';
      case 'Vehicle':
        return '#D97706';
      case 'Location':
        return '#0284C7';
      case 'Organisation':
        return '#9333EA';
      case 'BankAccount':
        return '#0D9488';
      case 'Case':
        return '#B45309';
      default:
        return '#9C6644';
    }
  };

  const displayName = user?.full_name || 'Rhea Sharma';

  return (
    <header className="h-16 bg-[#FAF7F2] border-b border-[#E2D7C8] px-6 sm:px-8 flex items-center justify-between flex-shrink-0 z-20 select-none relative shadow-xs">
      {/* Greeting / Page Context */}
      <div className="min-w-0 pr-4">
        <h1 className="text-base sm:text-lg font-black text-[#20150F] tracking-tight flex items-center gap-1.5 truncate">
          <span>Good Morning, {displayName}</span>
          <span>👋</span>
        </h1>
        <p className="text-xs text-[#7D7065] truncate font-medium">
          {subtitle || 'Multi-source decision-support analytics and case activity overview'}
        </p>
      </div>

      {/* Integrated Live Global Search Bar */}
      <div ref={searchContainerRef} className="hidden md:flex items-center flex-1 max-w-md mx-6 relative">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#8C7A6B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim() && searchResults.length > 0) setIsSearchOpen(true);
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search entities, phone numbers, vehicles, locations..."
            className="w-full pl-10 pr-9 py-2 bg-[#F5EFE6] border border-[#E0D5C5] rounded-full text-xs font-semibold text-[#20150F] placeholder-[#8C7A6B] focus:bg-white focus:outline-none focus:border-[#8A5A36] focus:ring-3 focus:ring-[#8A5A36]/15 transition-all shadow-inner shadow-black/5"
          />

          {isSearching && (
            <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-[#9C6644]" />
          )}

          {!isSearching && searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
                setIsSearchOpen(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C827A] hover:text-[#2C241D] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Live Search Results Dropdown Popover */}
        {isSearchOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-[#E5DACB] shadow-2xl overflow-hidden z-50 animate-fadeIn max-h-96 flex flex-col">
            <div className="p-3 bg-[#F5EFE6] border-b border-[#E5DACB] flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D7268]">
                Search Intelligence Results ({searchResults.length})
              </span>
              <span className="text-[10px] text-[#9C6644] font-semibold">Press Enter to inspect</span>
            </div>

            <div className="overflow-y-auto divide-y divide-[#E5DACB]/50 max-h-80">
              {searchResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#7D7268]">
                  {isSearching ? 'Searching active knowledge graph...' : 'No entities found matching your query.'}
                </div>
              ) : (
                searchResults.map((node) => {
                  const displayName = node.properties?.display_name || node.properties?.name || node.id;
                  const caseCode = node.properties?.case_code;
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => handleSelectSearchResult(node)}
                      className="w-full p-3 flex items-center justify-between hover:bg-[#F5EFE6] transition-all text-left cursor-pointer group"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <span
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-xs"
                          style={{ backgroundColor: getEntityBg(node.label) }}
                        >
                          {getEntityIcon(node.label)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#2C241D] group-hover:text-[#9C6644] truncate">
                            {displayName}
                          </p>
                          <p className="text-[10px] text-[#7D7268] flex items-center gap-1.5 mt-0.5">
                            <span className="font-semibold uppercase">{node.label}</span>
                            {caseCode && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-[#9C6644]">{caseCode}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-[#9C6644] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>View in Graph</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Controls & Notification Center */}
      <div className="flex items-center space-x-3">
        {/* Interactive Notification Bell Popover */}
        {/* Live Notification Bell with Dropdown */}
        <div ref={alertsContainerRef} className="relative">
          <button
            type="button"
            onClick={() => setIsAlertsOpen(!isAlertsOpen)}
            className={`relative p-2 rounded-full transition-all cursor-pointer border ${
              isAlertsOpen
                ? 'bg-[#8A5A36] text-white border-[#8A5A36] shadow-md'
                : 'bg-[#FAF7F2] text-[#3D2C20] border-[#E0D5C5] hover:bg-[#F5EFE6] shadow-xs'
            }`}
            title="Investigation Alerts & Pattern Indicators"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-4 text-[9px] font-black bg-rose-600 text-white rounded-full ring-2 ring-[#FAF7F2] flex items-center justify-center shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Center Dropdown */}
          {isAlertsOpen && (
            <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white rounded-3xl border border-[#E5DACB] shadow-2xl overflow-hidden z-50 animate-fadeIn">
              <div className="p-4 bg-[#F5EFE6] border-b border-[#E5DACB] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#9C6644]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C241D]">
                    Investigation Alerts ({unreadCount})
                  </h3>
                </div>
                <span className="text-[10px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                  Priority Telemetry
                </span>
              </div>

              <div className="divide-y divide-[#E5DACB]/50 max-h-80 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#7D7268]">
                    No unread pattern alerts. All caught up!
                  </div>
                ) : (
                  alerts.slice(0, 6).map((a) => (
                    <div
                      key={a.id}
                      onClick={() => handleAlertClick(a.id)}
                      className="p-3.5 hover:bg-[#F5EFE6] transition-all cursor-pointer group flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                              a.severity === 'HIGH'
                                ? 'bg-rose-600 text-white'
                                : a.severity === 'MEDIUM'
                                ? 'bg-amber-500 text-white'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            {a.severity}
                          </span>
                          <span className="text-xs font-bold text-[#2C241D] group-hover:text-[#9C6644] truncate">
                            {a.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7D7268] line-clamp-2 leading-relaxed">
                          {a.description}
                        </p>
                        <span className="text-[9px] text-[#8C827A] flex items-center gap-1 mt-1 font-mono">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleMarkAlertRead(e, a.id)}
                        className="px-2 py-1 bg-[#F5EFE6] hover:bg-emerald-100 text-[#5C5248] hover:text-emerald-800 text-[10px] font-bold rounded-lg border border-[#E5DACB] hover:border-emerald-300 transition-all flex-shrink-0 cursor-pointer shadow-xs"
                        title="Mark as read"
                      >
                        Mark Read
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* View All Alerts Action Footer */}
              <div className="p-3 bg-[#F5EFE6] border-t border-[#E5DACB] text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsAlertsOpen(false);
                    if (onNavigateToAlerts) onNavigateToAlerts();
                  }}
                  className="w-full py-2 bg-[#9C6644] hover:bg-[#7F4F24] text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-[#9C6644]/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>View All Alerts in Workbench</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Intelligence Session Badge */}
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#20140D] border border-[#3E2819] text-white rounded-full text-xs font-bold shadow-inner">
          <Activity className="w-3.5 h-3.5 text-[#DDA15E] animate-pulse" />
          <span className="font-semibold text-[#F5EFE6]">NETRA Session</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400 ml-0.5 animate-pulse" />
        </div>

        {/* Reload Sample Data Button — SUPERVISOR ONLY */}
        {user?.role === 'supervisor' && (
          <button
            type="button"
            onClick={handleSeedDemoData}
            disabled={isSeeding}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#9C6644] hover:bg-[#7F4F24] text-white rounded-full text-xs font-semibold transition-all shadow-md shadow-[#9C6644]/20 cursor-pointer"
            title="Supervisor Reset: Restore original canonical starting demo dataset"
          >
            {isSeeding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : seedSuccess ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            ) : (
              <Database className="w-3.5 h-3.5" />
            )}
            <span>{isSeeding ? 'Reloading Dataset...' : seedSuccess ? 'Dataset Restored (54 Entries)' : 'Reload Sample Data'}</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Topbar;
