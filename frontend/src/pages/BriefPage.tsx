import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { ExecutiveCaseBrief, CaseSummary } from '../types';
import ExecutiveBriefViewer from '../components/brief/ExecutiveBriefViewer';
import LoadingState from '../components/common/LoadingState';
import DisclaimerBanner from '../components/common/DisclaimerBanner';

export const BriefPage: React.FC = () => {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [brief, setBrief] = useState<ExecutiveCaseBrief | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadCases = async () => {
      try {
        const summary = await api.getDashboardSummary();
        setCases(summary.recent_cases || []);
        if (summary.recent_cases && summary.recent_cases.length > 0) {
          const firstCase = summary.recent_cases[0];
          setSelectedCaseId(firstCase.id);
          loadBrief(firstCase.id);
        }
      } catch (e) {
        console.error('Failed to load cases:', e);
      }
    };
    loadCases();
  }, []);

  const loadBrief = async (caseId: string, notes?: string) => {
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const data = await api.getCaseBrief(caseId, notes);
      setBrief(data);
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to generate brief');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCaseId) {
      loadBrief(selectedCaseId, customNotes);
    }
  };

  const handleDownloadPdf = async () => {
    if (!brief) return;
    setIsDownloadingPdf(true);
    try {
      await api.downloadCaseBriefPdf(brief.case_id, `Executive_Brief_${brief.case_code}.pdf`);
    } catch (e: any) {
      console.error('PDF download error:', e);
      alert('PDF download failed. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <FileSpreadsheet className="w-5 h-5 text-brand-purple" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Standardized Executive Case Briefs & PDF Reporting
          </h2>
        </div>
        <p className="text-xs text-brand-muted max-w-3xl">
          Generates standardized decision-support case intelligence summaries with traceable evidentiary citations, discovered network entities, chronological milestones, and SHA-256 digital chain-of-custody seals for formal inter-agency coordination.
        </p>
      </div>

      {/* Case Selector Form */}
      <form
        onSubmit={handleGenerate}
        className="bg-white p-6 rounded-2xl border border-brand-border shadow-sm space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Select Case */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Select Investigation Case
            </label>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-brand-purple font-medium"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_code} — {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Investigator Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Custom Supervisory Notes (Optional)
            </label>
            <input
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g., Prepared for inter-state review meeting..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-brand-purple"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isGenerating || !selectedCaseId}
            className="px-6 py-2.5 bg-brand-purple hover:bg-brand-purple-light text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-purple/20 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? 'Synthesizing Intelligence...' : 'Generate Case Brief'}</span>
          </button>
        </div>
      </form>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Brief Content Viewer */}
      {isGenerating ? (
        <LoadingState message="Aggregating case graph nodes, citations, and generating custody hash..." />
      ) : brief ? (
        <ExecutiveBriefViewer
          brief={brief}
          onDownloadPdf={handleDownloadPdf}
          isDownloading={isDownloadingPdf}
        />
      ) : null}

      {/* Disclaimer */}
      <DisclaimerBanner variant="light" />
    </div>
  );
};

export default BriefPage;
