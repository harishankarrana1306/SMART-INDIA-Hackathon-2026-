import React, { useEffect, useState } from 'react';
import {
  FolderGit2,
  Network,
  FileText,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { api } from '../api/client';
import { DashboardSummary } from '../types';
import StatCard from '../components/dashboard/StatCard';
import RecentActivityList from '../components/dashboard/RecentActivityList';
import LoadingState from '../components/common/LoadingState';
import DisclaimerBanner from '../components/common/DisclaimerBanner';

interface DashboardPageProps {
  onNavigateToGraph: (caseCode?: string) => void;
  onNavigateToAudit: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToGraph,
  onNavigateToAudit,
}) => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const summary = await api.getDashboardSummary();
      setData(summary);
    } catch (e) {
      console.error('Failed to load dashboard summary:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <LoadingState message="Aggregating case and network metrics..." />;
  }

  const totals = data?.totals || {
    total_cases: 0,
    total_entities: 0,
    total_records: 0,
    total_alerts: 0,
    total_audit_events: 0,
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0B0D1B] to-[#1A1835] text-white shadow-xl relative overflow-hidden flex items-center justify-between">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-purple/30 border border-brand-purple/40 text-brand-purple-light text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Decision-Support Analytics Engine
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Investigative Intelligence Overview
          </h2>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Multi-source relationship extraction across FIRs, cellular CDR dumps, financial wire ledgers, and field surveillance.
          </p>
        </div>

        <div className="flex gap-3 relative z-10">
          <button
            type="button"
            onClick={() => onNavigateToGraph()}
            className="px-4 py-2.5 bg-brand-purple hover:bg-brand-purple-light text-white text-xs font-semibold rounded-xl shadow-lg shadow-brand-purple/30 transition-all flex items-center gap-2"
          >
            <Network className="w-4 h-4" />
            <span>Open Network Canvas</span>
          </button>
        </div>

        {/* Decorative subtle background circle */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-brand-purple/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Active Cases"
          value={totals.total_cases}
          subtitle="Fictional cases under inquiry"
          icon={FolderGit2}
          colorVariant="purple"
          onClick={() => onNavigateToGraph()}
        />
        <StatCard
          title="Mapped Graph Entities"
          value={totals.total_entities}
          subtitle="Persons, phones, vehicles, accounts"
          icon={Network}
          colorVariant="indigo"
          onClick={() => onNavigateToGraph()}
        />
        <StatCard
          title="Ingested Source Records"
          value={totals.total_records}
          subtitle="FIRs, CDRs, financial transcripts"
          icon={FileText}
          colorVariant="blue"
        />
        <StatCard
          title="Cryptographic Log Events"
          value={totals.total_audit_events}
          subtitle="SHA-256 chained audit records"
          icon={ShieldCheck}
          colorVariant="green"
          onClick={onNavigateToAudit}
        />
      </div>

      {/* Main Grid: Cases & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Cases Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-brand-purple" />
              Active Investigative Cases
            </h3>
            <span className="text-xs text-brand-muted">Click a case to explore subgraph</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.recent_cases.map((c) => (
              <div
                key={c.id}
                onClick={() => onNavigateToGraph(c.case_code)}
                className="p-5 rounded-2xl bg-white border border-brand-border hover:border-brand-purple/50 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-brand-purple bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                      {c.case_code}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand-purple transition-colors leading-snug">
                    {c.title}
                  </h4>
                  {c.case_type && (
                    <p className="text-xs text-brand-muted mt-1">{c.case_type}</p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-brand-purple font-medium">
                  <span>Explore Network Graph</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Cryptographic Activity Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Tamper-Proof Audit Stream
            </h3>
            <button
              onClick={onNavigateToAudit}
              className="text-xs text-brand-purple hover:underline flex items-center gap-1 font-semibold"
            >
              <span>View All</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden">
            <RecentActivityList activities={data?.recent_activity || []} />
          </div>
        </div>
      </div>

      {/* Mandatory Disclaimer */}
      <DisclaimerBanner variant="light" />
    </div>
  );
};

export default DashboardPage;
