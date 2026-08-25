import React, { useEffect, useState } from 'react';
import { GitMerge, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { EntityMatchCandidate } from '../types';
import { useAuth } from '../auth/AuthContext';
import EntityMergeCard from '../components/resolution/EntityMergeCard';
import LoadingState from '../components/common/LoadingState';
import DisclaimerBanner from '../components/common/DisclaimerBanner';

export const EntityResolutionPage: React.FC = () => {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<EntityMatchCandidate[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const isSupervisorOrAdmin = user?.role === 'supervisor' || user?.role === 'administrator';

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
      fetchCandidates();
    } catch (e) {
      console.error('Merge failed:', e);
    }
  };

  const handleRejectMatch = async (candidateId: string) => {
    try {
      await api.rejectMatchCandidate(candidateId);
      showFeedback('Entity match candidate rejected.');
      fetchCandidates();
    } catch (e) {
      console.error('Rejection failed:', e);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-brand-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GitMerge className="w-5 h-5 text-brand-purple" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Entity Resolution & Deduplication Workbench
            </h2>
          </div>
          <p className="text-xs text-brand-muted max-w-2xl">
            Detects duplicate person names, phone numbers, vehicles, and bank accounts across disparate investigation cases using lexical and phonetic similarity algorithms with supervisor merge approval.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchCandidates}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
            title="Refresh candidate list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {isSupervisorOrAdmin && (
            <button
              type="button"
              onClick={handleRunScan}
              disabled={isScanning}
              className="px-4 py-2.5 bg-brand-purple hover:bg-brand-purple-light text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-purple/20 transition-all flex items-center gap-2"
            >
              {isScanning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Run Resolution Scan</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl">
          {['pending', 'merged', 'rejected', 'ALL'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                statusFilter === st
                  ? 'bg-white text-brand-purple shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'ALL' ? 'All Proposals' : st}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-slate-500">
          {candidates.length} Match Proposals
        </span>
      </div>

      {/* Candidate Cards Grid */}
      {isLoading ? (
        <LoadingState message="Scanning entity match candidates..." />
      ) : candidates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-border p-12 text-center text-xs text-brand-muted space-y-2">
          <p className="font-semibold text-slate-700">No match candidates in this view.</p>
          <p>
            {isSupervisorOrAdmin
              ? "Click 'Run Resolution Scan' to evaluate similarity across newly ingested records."
              : 'No pending merge proposals require review.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {candidates.map((cand) => (
            <EntityMergeCard
              key={cand.id}
              candidate={cand}
              onApproveMerge={handleApproveMerge}
              onRejectMatch={handleRejectMatch}
              canMerge={isSupervisorOrAdmin}
            />
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <DisclaimerBanner variant="light" />
    </div>
  );
};

export default EntityResolutionPage;
