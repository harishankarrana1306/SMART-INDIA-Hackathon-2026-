import React, { useEffect, useState } from 'react';
import { Sparkles, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../api/client';
import { AlertItem } from '../types';
import AlertCard from '../components/alerts/AlertCard';
import AlertFilters from '../components/alerts/AlertFilters';
import LoadingState from '../components/common/LoadingState';
import DisclaimerBanner from '../components/common/DisclaimerBanner';

export const AlertsPage: React.FC = () => {
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
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-brand-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-brand-purple" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Investigative Pattern Alerts & Advisory Rules
            </h2>
          </div>
          <p className="text-xs text-brand-muted max-w-2xl">
            Deterministic graph pattern detectors surface multi-record co-occurrences, high-frequency communication relays, circular money transfers, and shared high-risk identifiers for human investigator evaluation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchAlerts}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
            title="Refresh alert feed"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleScan}
            disabled={isScanning}
            className="px-4 py-2.5 bg-brand-purple hover:bg-brand-purple-light text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-purple/20 transition-all flex items-center gap-2"
          >
            {isScanning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>Scan Rule Patterns</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter Bar */}
      <AlertFilters
        severityFilter={severityFilter}
        onSeverityChange={setSeverityFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        onReset={handleReset}
      />

      {/* Alerts Stream */}
      {isLoading ? (
        <LoadingState message="Evaluating graph topology and rule conditions..." />
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-border p-12 text-center text-xs text-brand-muted space-y-2">
          <p className="font-semibold text-slate-700">No pattern alerts match active filters.</p>
          <p>Click 'Scan Rule Patterns' to evaluate newly ingested records across all 4 deterministic rules.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((al) => (
            <AlertCard
              key={al.id}
              alert={al}
              onAcknowledge={handleAcknowledge}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <DisclaimerBanner variant="light" />
    </div>
  );
};

export default AlertsPage;
