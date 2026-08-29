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
    const handleReload = () => fetchAuditLogs();
    window.addEventListener('netra-data-reloaded', handleReload);
    return () => window.removeEventListener('netra-data-reloaded', handleReload);
  }, [selectedAction]);

  const getActionBadge = (action: string) => {
    const map: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      login: { bg: 'bg-[#FEF6E9] border-[#FCE4BE]', text: 'text-[#9C6644]', icon: <KeyRound className="w-3 h-3" /> },
      search: { bg: 'bg-[#EBF2FA] border-[#D4E3F5]', text: 'text-[#4A6FA5]', icon: <Search className="w-3 h-3" /> },
      record_view: { bg: 'bg-[#F3ECF8] border-[#E3D4ED]', text: 'text-[#7B5294]', icon: <Eye className="w-3 h-3" /> },
      reveal_sensitive: { bg: 'bg-[#FEF3C7] border-[#FDE68A]', text: 'text-[#D97706]', icon: <Shield className="w-3 h-3" /> },
      seed_data: { bg: 'bg-[#EAF5EF] border-[#D0EADB]', text: 'text-[#2D7A58]', icon: <Database className="w-3 h-3" /> },
    };
    const c = map[action] || { bg: 'bg-[#F5EFE6] border-[#E5DACB]', text: 'text-[#5C5248]', icon: <FileText className="w-3 h-3" /> };
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
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4 text-[#2C241D]">
        <div className="p-6 rounded-3xl bg-[#FEF6E9] border border-[#FCE4BE] text-[#7F4F24] inline-flex flex-col items-center shadow-sm">
          <Lock className="w-10 h-10 text-[#9C6644] mb-2" />
          <h2 className="text-lg font-bold">Role-Based Access Restriction</h2>
          <p className="text-xs text-[#7D7268] mt-1 max-w-md">
            Cryptographic audit chain verification and tamper-evident logs are restricted to <strong>Supervisor</strong> role to safeguard chain-of-custody.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn text-[#2C241D]">
      {/* Page Header & Verification Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E5DACB] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-[#9C6644]" />
            <h2 className="text-lg font-bold text-[#2C241D] tracking-tight">
              Tamper-Proof SHA-256 Audit Chain
            </h2>
          </div>
          <p className="text-xs text-[#7D7268] max-w-2xl">
            Append-only cryptographic ledger tracking all investigator actions. Hash chaining guarantees non-repudiation and evidence integrity.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={async () => {
              try {
                await api.loadDemoData();
                window.dispatchEvent(new CustomEvent('netra-data-reloaded'));
                fetchAuditLogs();
              } catch (e) {
                console.error('Failed to reload demo data:', e);
              }
            }}
            className="px-3.5 py-2.5 bg-[#FAF7F2] hover:bg-[#F5EFE6] text-[#7A4B27] text-xs font-bold rounded-xl border border-[#D8CBB9] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            title="Supervisor Action: Clear session modifications and restore canonical prototype data"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#9C6644]" />
            <span>Reload Sample Data</span>
          </button>
          <button
            type="button"
            onClick={fetchAuditLogs}
            className="p-2.5 bg-[#F5EFE6] hover:bg-[#EAE1D5] text-[#43382F] rounded-xl transition-all border border-[#E5DACB] cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleVerifyChain}
            disabled={isVerifying}
            className="px-4 py-2.5 bg-[#9C6644] hover:bg-[#7F4F24] text-white text-xs font-semibold rounded-xl shadow-md shadow-[#9C6644]/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            {isVerifying ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>Verify Audit Integrity</span>
          </button>
        </div>
      </div>

      {/* Verification Status Card */}
      {verification && (
        <div
          className={`p-5 rounded-3xl border transition-all animate-fadeIn ${
            verification.valid
              ? 'bg-[#EAF5EF] border-[#D0EADB] text-[#1E523A]'
              : 'bg-[#FCEEED] border-[#F8D5D2] text-[#8C2318]'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-2xl ${verification.valid ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'}`}>
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
      <div className="bg-white rounded-3xl border border-[#E5DACB] shadow-sm overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-4 border-b border-[#E5DACB] bg-[#F5EFE6] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7D7268]">
              Filter Action:
            </span>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-[#E5DACB] rounded-xl text-[#2C241D] font-semibold focus:outline-none focus:border-[#9C6644]"
            >
              <option value="ALL">All Actions</option>
              <option value="login">Login</option>
              <option value="search">Search</option>
              <option value="record_view">Record View</option>
              <option value="reveal_sensitive">Reveal Sensitive</option>
              <option value="seed_data">Seed Data</option>
            </select>
          </div>

          <span className="text-xs font-mono font-semibold text-[#7D7268]">
            {logs.length} Sequential Blocks Loaded
          </span>
        </div>

        {/* Table */}
        {isLoading ? (
          <LoadingState message="Loading cryptographic ledger..." />
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#7D7268]">
            No audit logs match current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5DACB] bg-[#F5EFE6] text-[11px] font-bold uppercase tracking-wider text-[#5C5248]">
                  <th className="py-3.5 px-4">Seq #</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Target</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">SHA-256 Digest</th>
                  <th className="py-3.5 px-4 text-right">Block Inspector</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DACB]/60 text-xs text-[#2C241D]">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-[#F5EFE6]/50 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#9C6644]">
                      #{log.seq_no}
                    </td>
                    <td className="py-3.5 px-4">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#2C241D]">
                      {log.username || (log.user_id ? log.user_id.slice(0, 8) : 'system')}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#5C5248]">
                      {log.target_type || 'system'}: {log.target_id ? log.target_id.slice(0, 12) : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#7D7268] text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#8C827A] max-w-[140px] truncate" title={log.record_hash}>
                      {log.record_hash ? `${log.record_hash.slice(0, 16)}...` : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 bg-[#F5EFE6] hover:bg-[#EAE1D5] text-[#9C6644] rounded-lg text-xs font-semibold border border-[#E5DACB] transition-all cursor-pointer"
                      >
                        Inspect Hash
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E5DACB] p-6 max-w-lg w-full space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#E5DACB] pb-3">
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-[#9C6644]" />
                <h3 className="text-base font-bold text-[#2C241D]">
                  Audit Block #{selectedLog.seq_no}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-[#8C827A] hover:text-[#2C241D] text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono bg-[#F5EFE6] p-4 rounded-2xl border border-[#E5DACB] overflow-x-auto">
              <div><span className="text-[#8C827A]">Action: </span><strong>{selectedLog.action}</strong></div>
              <div><span className="text-[#8C827A]">User ID: </span><span>{selectedLog.user_id || 'system'}</span></div>
              <div><span className="text-[#8C827A]">Target Type: </span><span>{selectedLog.target_type || 'N/A'}</span></div>
              <div><span className="text-[#8C827A]">Target ID: </span><span>{selectedLog.target_id || 'N/A'}</span></div>
              <div><span className="text-[#8C827A]">Previous Block Hash: </span><span className="break-all text-[#5C5248]">{selectedLog.prev_hash}</span></div>
              <div><span className="text-[#8C827A]">Record Block Hash: </span><span className="break-all text-[#9C6644] font-bold">{selectedLog.record_hash}</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-[#9C6644] hover:bg-[#7F4F24] text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Disclaimer */}
      <DisclaimerBanner variant="light" />
    </div>
  );
};

export default AuditPage;
