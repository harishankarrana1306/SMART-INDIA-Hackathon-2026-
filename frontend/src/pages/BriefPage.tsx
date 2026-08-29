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

    const handleReload = () => loadCases();
    window.addEventListener('netra-data-reloaded', handleReload);
    return () => window.removeEventListener('netra-data-reloaded', handleReload);
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
      await api.downloadCaseBriefPdf(brief.case_id, `NETRA_Executive_Brief_${brief.case_code}.pdf`);
    } catch (err: any) {
      setErrorMessage(err.message || 'PDF export failed');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-fadeIn text-[#2C241D]">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-[#E5DACB] shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <FileSpreadsheet className="w-5 h-5 text-[#9C6644]" />
          <h2 className="text-lg font-bold text-[#2C241D] tracking-tight">
            Standardized Executive Case Brief & Court-Ready PDF Reporting
          </h2>
        </div>
        <p className="text-xs text-[#7D7268] max-w-3xl">
          Compiles synthesized case intelligence including network topology hubs, prioritized suspect profiles, CDR triangulation, heuristic pattern alerts, temporal crime timelines, and SHA-256 evidence chain of custody.
        </p>
      </div>

      {/* Case Selector & Custom Notes Bar */}
      <form onSubmit={handleGenerate} className="p-5 bg-white rounded-3xl border border-[#E5DACB] shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5248] mb-1.5">
              Select Active Case
            </label>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#F5EFE6]/60 border border-[#E5DACB] rounded-xl text-xs font-semibold text-[#2C241D] focus:outline-none focus:border-[#9C6644]"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_code}: {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5248] mb-1.5">
              Investigator Annotations / Supervisory Remarks (Optional)
            </label>
            <input
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. Prepared for Senior Supervisory Briefing & Court Charge-Sheet Annexure"
              className="w-full px-3.5 py-2 bg-[#F5EFE6]/60 border border-[#E5DACB] rounded-xl text-xs text-[#2C241D] placeholder-[#9C9288] focus:outline-none focus:border-[#9C6644]"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={!selectedCaseId || isGenerating}
            className="px-5 py-2 bg-[#9C6644] hover:bg-[#7F4F24] text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-[#9C6644]/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-[#DDA15E]" />
            <span>{isGenerating ? 'Compiling Intelligence Brief...' : 'Generate Case Brief'}</span>
          </button>
        </div>
      </form>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Brief Viewer Component */}
      {isGenerating ? (
        <LoadingState message="Synthesizing multi-source entity relationships and timeline..." />
      ) : brief ? (
        <ExecutiveBriefViewer
          brief={brief}
          isDownloading={isDownloadingPdf}
          onDownloadPdf={handleDownloadPdf}
        />
      ) : null}

      {/* Mandatory Disclaimer */}
      <DisclaimerBanner variant="light" />
    </div>
  );
};

export default BriefPage;
