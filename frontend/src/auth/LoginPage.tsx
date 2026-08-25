import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Shield, KeyRound, UserCheck, AlertCircle, ArrowRight, Lock, Sparkles } from 'lucide-react';
import DisclaimerBanner from '../components/common/DisclaimerBanner';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('investigator1');
  const [password, setPassword] = useState('Investigator@123');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSelect = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-[#0B0D1B] flex flex-col justify-between text-white relative overflow-hidden">
      {/* Background ambient gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-purple/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-brand-indigo/30 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="p-6 flex items-center justify-between border-b border-slate-800/80 backdrop-blur-md z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-purple to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-purple/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              NCRB Network Intelligence
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-purple/20 text-brand-purple-light border border-brand-purple/30 font-medium">
                SIH 2026 #26189
              </span>
            </h1>
            <p className="text-xs text-brand-muted">Ministry of Home Affairs • Women Safety Division</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Fictional Sandbox Environment</span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="w-full max-w-md bg-[#111322]/90 border border-slate-800 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-brand-purple/10 border border-brand-purple/20 text-brand-purple-light mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Investigator Portal</h2>
            <p className="text-sm text-brand-muted mt-1">
              AI-Powered Network Relationship Discovery & Decision Support
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Investigator ID / Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all"
                placeholder="e.g. investigator1"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Security Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all"
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-brand-purple hover:bg-brand-purple-light text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-brand-purple/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Authenticate & Access Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Account Quick Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5">
              <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Demo Evaluation Accounts
              </span>
              <span className="text-[11px] text-slate-500">Click to autofill</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickSelect('investigator1', 'Investigator@123')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  username === 'investigator1'
                    ? 'bg-brand-purple/20 border-brand-purple text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-semibold flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-brand-purple-light" />
                  Investigator
                </div>
                <div className="text-[10px] text-slate-400 truncate">Rhea Sharma</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('supervisor1', 'Supervisor@123')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  username === 'supervisor1'
                    ? 'bg-brand-purple/20 border-brand-purple text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-semibold flex items-center gap-1">
                  <Shield className="w-3 h-3 text-sky-400" />
                  Supervisor
                </div>
                <div className="text-[10px] text-slate-400 truncate">V. Sen</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('admin1', 'Admin@123')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  username === 'admin1'
                    ? 'bg-brand-purple/20 border-brand-purple text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-400" />
                  Admin
                </div>
                <div className="text-[10px] text-slate-400 truncate">A. Deshmukh</div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Disclaimer */}
      <footer className="p-4 z-10">
        <DisclaimerBanner />
      </footer>
    </div>
  );
};
