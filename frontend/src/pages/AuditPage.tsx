import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Search,
  Eye,
  Shield,
  Database,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Hash,
  Lock,
} from 'lucide-react';
import { api } from '../api/client';
import { AuditLog, AuditChainVerification } from '../types';
import { useAuth } from '../auth/AuthContext';
import LoadingState from '../components/common/LoadingState';
import DisclaimerBanner from '../components/common/DisclaimerBanner';

export const AuditPage: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [verification, setVerification] = useState<AuditChainVerification | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const act = selectedAction === 'ALL' ? undefined : selectedAction;
      const data = await api.getAuditLogs(100, 0, act);
      setLogs(data);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyChain = async () => {
    setIsVerifying(true);
    try {
      const res = await api.verifyAuditChain();
      setVerification(res);
    } catch (e) {
      console.error('Verification failed:', e);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [selectedAction]);

  const getActionBadge = (action: string) => {
    const map: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      login: { bg: 'bg-purple-100 border-purple-200', text: 'text-purple-800', icon: <KeyRound className="w-3 h-3" /> },
      search: { bg: 'bg-sky-100 border-sky-200', text: 'text-sky-800', icon: <Search className="w-3 h-3" /> },
      record_view: { bg: 'bg-indigo-100 border-indigo-200', text: 'text-indigo-800', icon: <Eye className="w-3 h-3" /> },
      reveal_sensitive: { bg: 'bg-amber-100 border-amber-200', text: 'text-amber-800', icon: <Shield className="w-3 h-3" /> },
      seed_data: { bg: 'bg-emerald-100 border-emerald-200', text: 'text-emerald-800', icon: <Database className="w-3 h-3" /> },
    };
    const c = map[action] || { bg: 'bg-slate-100 border-slate-200', text: 'text-slate-700', icon: <FileText className="w-3 h-3" /> };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.bg} ${c.text}`}>
        {c.icon}
        <span className="capitalize">{action.replace('_', ' ')}</span>
      </span>
    );
  };

  // RBAC Access Restriction View
  if (user?.role === 'investigator') {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 inline-flex flex-col items-center">
          <Lock className="w-10 h-10 text-amber-500 mb-2" />
          <h2 className="text-lg font-bold">Role-Based Access Restriction</h2>
          <p className="text-xs text-amber-800 mt-1 max-w-md">
            Cryptographic audit chain verification and tamper-evident logs are restricted to <strong>Supervisor</strong> and <strong>Administrator</strong> roles to safeguard chain-of-custody.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Page Header & Verification Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-brand-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-brand-purple" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Tamper-Evident SHA-256 Audit Chain
            </h2>
          </div>
          <p className="text-xs text-brand-muted max-w-2xl">
            Append-only cryptographic ledger tracking all investigator actions. Hash chaining guarantees non-repudiation and evidence integrity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchAuditLogs}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleVerifyChain}
            disabled={isVerifying}
            className="px-4 py-2.5 bg-brand-purple hover:bg-brand-purple-light text-white text-xs font-semibold rounded-xl shadow-lg shadow-brand-purple/25 transition-all flex items-center gap-2"
          >
            {isVerifying ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>Verify Cryptographic Chain</span>
          </button>
        </div>
      </div>

      {/* Verification Status Card (If run) */}
      {verification && (
        <div
          className={`p-5 rounded-2xl border transition-all animate-fadeIn ${
            verification.valid
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/80 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-xl ${verification.valid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {verification.valid ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold">
                  {verification.valid ? 'Hash Chain Integrity Verified' : 'Cryptographic Tampering Detected'}
                </h3>
                <p className="text-xs mt-0.5 opacity-90">{verification.message}</p>
                <div className="flex items-center gap-4 text-xs font-mono mt-2 opacity-80">
                  <span>Total Sequence Blocks: {verification.total_records}</span>
                  {verification.first_broken_seq && (
                    <span className="font-bold text-rose-700">
                      Break Point: Sequence #{verification.first_broken_seq}
                    </span>
                  )}
                  <span>Verified: {new Date(verification.verified_at).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Table Container */}
      <div className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-4 border-b border-brand-border bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Filter Action:
            </span>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-brand-purple"
            >
              <option value="ALL">All Actions</option>
              <option value="login">Login</option>
              <option value="search">Search</option>
              <option value="record_view">Record View</option>
              <option value="reveal_sensitive">Reveal Sensitive</option>
              <option value="seed_data">Seed Data</option>
            </select>
          </div>

          <span className="text-xs font-mono text-slate-500">
            {logs.length} Sequential Blocks Loaded
          </span>
        </div>

        {/* Table */}
        {isLoading ? (
          <LoadingState message="Loading cryptographic ledger..." />
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-brand-muted">
            No audit logs match current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Seq #</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Target</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">SHA-256 Digest</th>
                  <th className="py-3 px-4 text-right">Block Inspector</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60 text-xs text-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-brand-purple">
                      #{log.seq_no}
                    </td>
                    <td className="py-3 px-4">{getActionBadge(log.action)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {log.username || 'System'}
                    </td>
                    <td className="py-3 px-4">
                      {log.target_type ? (
                        <span className="font-mono text-slate-600">
                          {log.target_type} {log.target_id ? `(${log.target_id})` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      <span className="truncate block max-w-[120px]" title={log.record_hash}>
                        {log.record_hash.slice(0, 10)}...{log.record_hash.slice(-6)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-brand-purple hover:text-white rounded-lg transition-all border border-slate-200"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Block Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-brand-border">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Hash className="w-5 h-5 text-brand-purple" />
                Cryptographic Block #{selectedLog.seq_no} Inspector
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border space-y-2">
                <div>
                  <span className="text-slate-500 block mb-0.5 font-semibold uppercase text-[10px]">Previous Block Hash (prev_hash):</span>
                  <span className="font-mono text-[11px] text-slate-700 break-all">{selectedLog.prev_hash}</span>
                </div>
                <div className="border-t pt-2">
                  <span className="text-slate-500 block mb-0.5 font-semibold uppercase text-[10px]">Computed Record Hash (record_hash):</span>
                  <span className="font-mono text-[11px] text-brand-purple font-bold break-all">{selectedLog.record_hash}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block mb-1 font-semibold uppercase text-[10px]">Block Payload Metadata:</span>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.metadata_json || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <DisclaimerBanner variant="light" />
    </div>
  );
};

export default AuditPage;
