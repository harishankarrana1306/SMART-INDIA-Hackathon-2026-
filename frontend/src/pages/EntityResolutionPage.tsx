import React, { useEffect, useState } from 'react';
import { GitMerge, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { EntityMatchCandidate } from '../types';
import EntityMergeCard from '../components/resolution/EntityMergeCard';
import LoadingState from '../components/common/LoadingState';
import DisclaimerBanner from '../components/common/DisclaimerBanner';

interface EntityResolutionPageProps {
  onNavigateToGraph?: (caseCode?: string, nodeId?: string) => void;
}

export const EntityResolutionPage: React.FC<EntityResolutionPageProps> = ({ onNavigateToGraph }) => {
  const [candidates, setCandidates] = useState<EntityMatchCandidate[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchCandidates = async () => {
    setIsLoading(true);
    try {
      const data = await api.listMatchCandidates(statusFilter);
      setCandidates(data);
    } catch (e) {
      console.error('Failed to load match candidates:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
    const handleReload = () => fetchCandidates();
    window.addEventListener('netra-data-reloaded', handleReload);
    return () => window.removeEventListener('netra-data-reloaded', handleReload);
  }, [statusFilter]);

  const showFeedback = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleRunScan = async () => {
    setIsScanning(true);
    try {
      const res = await api.generateMatchCandidates();
      showFeedback(res.message);
      fetchCandidates();
    } catch (e) {
      console.error('Scan failed:', e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleApproveMerge = async (candidateId: string) => {
    try {
      await api.approveMerge(candidateId);
      showFeedback('Entities merged successfully. Graph relationships updated and logged to audit ledger.');
      window.dispatchEvent(new CustomEvent('netra-graph-invalidated'));
      fetchCandidates();
    } catch (e) {
      console.error('Merge failed:', e);
    }
  };

  const handleRejectMatch = async (candidateId: string) => {
    try {
      await api.rejectMatchCandidate(candidateId);
      showFeedback('Entity match candidate rejected. Entities will remain separate in graph.');
      fetchCandidates();
    } catch (e) {
      console.error('Rejection failed:', e);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 animate-fadeIn text-[#2C241D]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E5DACB] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GitMerge className="w-5 h-5 text-[#9C6644]" />
            <h2 className="text-lg font-bold text-[#2C241D] tracking-tight">
              Entity Resolution & Deduplication Workbench
            </h2>
          </div>
          <p className="text-xs text-[#7D7268] max-w-3xl">
            Detects candidate identical entities appearing under different name variations or formats (e.g. initials, middle names, alias variants). Approve entity merges to recalculate network topology or keep entities distinct.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchCandidates}
            className="p-2.5 bg-[#F5EFE6] hover:bg-[#EAE1D5] text-[#43382F] rounded-xl transition-all border border-[#E5DACB] cursor-pointer"
            title="Refresh candidate list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRunScan}
            disabled={isScanning}
            className="px-4 py-2.5 bg-[#9C6644] hover:bg-[#7F4F24] text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-[#9C6644]/25 flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#DDA15E]" />
            <span>{isScanning ? 'Scanning Knowledge Graph...' : 'Run Resolution Algorithm'}</span>
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

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-[#E5DACB] shadow-sm text-xs">
        <div className="flex items-center gap-2 font-medium text-[#7D7268]">
          <span>Resolution Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#F5EFE6]/60 border border-[#E5DACB] rounded-xl text-xs font-semibold text-[#2C241D] focus:outline-none focus:border-[#9C6644]"
          >
            <option value="pending">Pending Human Review</option>
            <option value="approved">Approved Merged Records</option>
            <option value="rejected">Rejected Candidates</option>
            <option value="ALL">All Candidates</option>
          </select>
        </div>

        <span className="text-xs font-semibold text-[#7D7268]">
          {candidates.length} Candidate Pair{candidates.length === 1 ? '' : 's'} in Queue
        </span>
      </div>

      {/* Candidates List */}
      {isLoading ? (
        <LoadingState message="Scanning entity pairs for potential aliases..." />
      ) : candidates.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#E5DACB] shadow-sm space-y-3">
          <GitMerge className="w-10 h-10 text-[#8C827A] mx-auto opacity-50" />
          <h3 className="text-sm font-bold text-[#2C241D]">No candidate matches in this status</h3>
          <p className="text-xs text-[#7D7268] max-w-sm mx-auto">
            Click "Run Resolution Algorithm" to evaluate the graph for fuzzy name matches and identifier overlaps.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {candidates.map((c) => (
            <EntityMergeCard
              key={c.id}
              candidate={c}
              onApproveMerge={handleApproveMerge}
              onRejectMatch={handleRejectMatch}
              onViewInGraph={(nodeId) => onNavigateToGraph && onNavigateToGraph(undefined, nodeId)}
            />
          ))}
        </div>
      )}

      {/* Mandatory Disclaimer */}
      <DisclaimerBanner variant="light" />
    </div>
  );
};

export default EntityResolutionPage;
