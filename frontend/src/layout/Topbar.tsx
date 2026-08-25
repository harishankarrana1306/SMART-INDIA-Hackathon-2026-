import React, { useState } from 'react';
import { Database, Lock, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

interface TopbarProps {
  title: string;
  subtitle?: string;
  onRefreshData?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ title, subtitle, onRefreshData }) => {
  const { user } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const handleSeedDemoData = async () => {
    setIsSeeding(true);
    try {
      await api.loadDemoData();
      setSeedSuccess(true);
      if (onRefreshData) onRefreshData();
      setTimeout(() => setSeedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to load demo data:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-brand-border px-6 flex items-center justify-between flex-shrink-0 z-10">
      <div>
        <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          {title}
        </h1>
        {subtitle && <p className="text-xs text-brand-muted">{subtitle}</p>}
      </div>

      <div className="flex items-center space-x-3">
        {/* Synthetic Sandbox Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-slate-700 text-xs font-medium">
          <Lock className="w-3 h-3 text-slate-500" />
          <span>Fictional Sandbox</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Demo Seed Data Button (Active for Admin & Evaluation) */}
        {user?.role === 'administrator' && (
          <button
            type="button"
            onClick={handleSeedDemoData}
            disabled={isSeeding}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-brand-purple/10 hover:bg-brand-purple/20 text-brand-purple border border-brand-purple/30 rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            {isSeeding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : seedSuccess ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Database className="w-3.5 h-3.5" />
            )}
            <span>{seedSuccess ? 'Data Synchronized' : 'Reload Demo Data'}</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Topbar;
