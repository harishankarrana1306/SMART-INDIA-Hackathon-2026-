import React from 'react';
import { ActivityItem } from '../../types';
import { Shield, Search, Eye, FileText, KeyRound, Database, Clock } from 'lucide-react';

interface RecentActivityListProps {
  activities: ActivityItem[];
}

export const RecentActivityList: React.FC<RecentActivityListProps> = ({ activities }) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login':
        return <KeyRound className="w-3.5 h-3.5 text-brand-purple" />;
      case 'search':
        return <Search className="w-3.5 h-3.5 text-sky-500" />;
      case 'record_view':
        return <Eye className="w-3.5 h-3.5 text-indigo-500" />;
      case 'reveal_sensitive':
        return <Shield className="w-3.5 h-3.5 text-amber-500" />;
      case 'seed_data':
        return <Database className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return iso;
    }
  };

  if (activities.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-brand-muted">
        No recent activity logged.
      </div>
    );
  }

  return (
    <div className="divide-y divide-brand-border/60">
      {activities.map((act) => (
        <div key={act.id} className="py-3 px-4 flex items-center justify-between hover:bg-slate-50/80 transition-all">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2 rounded-lg bg-slate-100/90 border border-slate-200">
              {getActionIcon(act.action)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">
                <span className="capitalize">{act.action.replace('_', ' ')}</span>
                {act.target_type && (
                  <span className="text-brand-muted font-normal ml-1">
                    on {act.target_type} {act.target_id ? `(${act.target_id})` : ''}
                  </span>
                )}
              </p>
              <p className="text-[11px] text-brand-muted">
                Initiated by <strong className="text-slate-700">{act.user}</strong>
              </p>
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1 flex-shrink-0">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{formatTimestamp(act.timestamp)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentActivityList;
