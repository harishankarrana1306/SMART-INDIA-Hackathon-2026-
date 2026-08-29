import React, { useEffect, useState } from 'react';
import { Sparkles, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../api/client';
import { AlertItem } from '../types';
import AlertCard from '../components/alerts/AlertCard';
import AlertFilters from '../components/alerts/AlertFilters';
import LoadingState from '../components/common/LoadingState';
import DisclaimerBanner from '../components/common/DisclaimerBanner';

interface AlertsPageProps {
  onNavigateToGraph?: (caseCode?: string, nodeId?: string) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ onNavigateToGraph }) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('unreviewed');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAlerts({
        severity: severityFilter,
        status: statusFilter,
      });
      setAlerts(data);
    } catch (e) {
      console.error('Failed to load alerts:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const handleReload = () => fetchAlerts();
    window.addEventListener('netra-data-reloaded', handleReload);
    return () => window.removeEventListener('netra-data-reloaded', handleReload);
  }, [severityFilter, statusFilter]);

  const showFeedback = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const res = await api.scanAlerts();
      showFeedback(res.message);
      fetchAlerts();
    } catch (e) {
      console.error('Alert scan failed:', e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAcknowledge = async (id: string, notes?: string) => {
    try {
      await api.acknowledgeAlert(id, notes);
      showFeedback('Alert acknowledged and marked under active investigation.');
      fetchAlerts();
    } catch (e) {
      console.error('Acknowledge failed:', e);
    }
  };

  const handleDismiss = async (id: string, reason: string) => {
    try {
      await api.dismissAlert(id, reason);
      showFeedback('Alert dismissed and rationale logged to audit ledger.');
      fetchAlerts();
    } catch (e) {
      console.error('Dismiss failed:', e);
    }
  };

  const handleReset = () => {
    setSeverityFilter('ALL');
    setStatusFilter('ALL');
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-fadeIn text-[#2C241D]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E5DACB] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-[#9C6644]" />
            <h2 className="text-lg font-bold text-[#2C241D] tracking-tight">
              Investigative Pattern Alerts & Advisory Rules
            </h2>
          </div>
          <p className="text-xs text-[#7D7268] max-w-3xl">
            Surfaces graph discoveries and pattern intelligence: multi-case overlaps, high-degree hubs, circular wire structuring, and shared phone/vehicle identifiers with explainable reasoning and direct graph inspection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchAlerts}
            className="p-2.5 bg-[#F5EFE6] hover:bg-[#EAE1D5] text-[#43382F] rounded-xl transition-all border border-[#E5DACB] cursor-pointer"
            title="Refresh alerts"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleScan}
            disabled={isScanning}
            className="px-4 py-2.5 bg-[#9C6644] hover:bg-[#7F4F24] text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-[#9C6644]/25 flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#DDA15E]" />
            <span>{isScanning ? 'Evaluating Pattern Rules...' : 'Re-Evaluate Heuristic Rules'}</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filters Bar */}
      <AlertFilters
        selectedSeverity={severityFilter}
        selectedStatus={statusFilter}
        onSeverityChange={setSeverityFilter}
        onStatusChange={setStatusFilter}
        onReset={handleReset}
      />

      {/* Alerts Stream */}
      {isLoading ? (
        <LoadingState message="Scanning knowledge graph for heuristic pattern alerts..." />
      ) : alerts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#E5DACB] shadow-sm space-y-3">
          <ShieldAlert className="w-10 h-10 text-[#8C827A] mx-auto opacity-50" />
          <h3 className="text-sm font-bold text-[#2C241D]">No pattern alerts matching current filter</h3>
          <p className="text-xs text-[#7D7268] max-w-sm mx-auto">
            Click "Re-Evaluate Heuristic Rules" to analyze the updated knowledge graph for cross-case syndicates.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((al) => (
            <AlertCard
              key={al.id}
              alert={al}
              onAcknowledge={handleAcknowledge}
              onDismiss={handleDismiss}
              onViewGraph={(caseCode, nodeId) => onNavigateToGraph && onNavigateToGraph(caseCode, nodeId)}
            />
          ))}
        </div>
      )}

      {/* Mandatory Disclaimer */}
      <DisclaimerBanner variant="light" />
    </div>
  );
};

export default AlertsPage;
