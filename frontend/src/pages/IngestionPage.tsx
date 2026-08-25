import React, { useState } from 'react';
import {
  FileUp,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { api } from '../api/client';
import { IngestionUploadResult } from '../types';
import FileUploadDropzone from '../components/ingestion/FileUploadDropzone';
import DisclaimerBanner from '../components/common/DisclaimerBanner';

interface IngestionPageProps {
  onNavigateToReview?: (recordId?: string) => void;
}

export const IngestionPage: React.FC<IngestionPageProps> = ({ onNavigateToReview }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState<string>('fir');
  const [docTitle, setDocTitle] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<IngestionUploadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setUploadResult(null);

    try {
      const res = await api.uploadDocument(
        selectedFile,
        sourceType,
        undefined,
        docTitle || selectedFile.name
      );
      setUploadResult(res);
      setSelectedFile(null);
      setDocTitle('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Ingestion failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSample = (sampleType: string) => {
    let content = '';
    let filename = '';
    let title = '';

    if (sampleType === 'fir') {
      filename = 'FIR_142_2026_Cyber_Fraud.txt';
      title = 'FIR No. 142/2026 - Cyber Cell New Delhi';
      content = `FIRST INFORMATION REPORT (SYNTHETIC RECORD)\nPolice Station: Cyber Crime Cell, New Delhi\nFIR No.: 142/2026 | Date: 2026-08-20\nComplainant states Priya Verma called from mobile +91-98765-43210 instructing unauthorized wire transfers to bank account A/C 987654321098 at State Bank of India.\nSuspect vehicle DL-01-AB-1234 driven by Vikram Singh was spotted at Sector 18 Noida ATM withdrawal point.\nCoordinated communication with +91 91234 56789 noted.`;
      setSourceType('fir');
    } else if (sampleType === 'surveillance') {
      filename = 'Surveillance_Khan_Market_Log.txt';
      title = 'Field Surveillance Observation - Khan Market';
      content = `FIELD SURVEILLANCE OBSERVATION LOG (SYNTHETIC RECORD)\nDate: 2026-08-21 | Location: Khan Market Parking\nSubject 1 identified as Vikram Singh arrived in vehicle DL-01-AB-1234.\nObserved meeting Rohan Sharma while speaking on mobile +91-99887-76655.\nAssociate in vehicle HR-26-CD-5678 arrived at 20:15 IST and departed towards Gurugram.`;
      setSourceType('surveillance_log');
    } else {
      filename = 'Financial_Ledger_Wire_Transfers.csv';
      title = 'Corporate Bank Ledger - Wire Audit';
      content = `transaction_id,timestamp,sender_name,sender_account,receiver_name,receiver_account,amount_inr,bank_ifsc\nTXN-90812,2026-08-20 10:14:00,Apex Global Traders,112233445566,Priya Verma,987654321098,1500000,SBIN0001234\nTXN-90813,2026-08-21 15:30:12,Vikram Singh,223344556677,Apex Global Traders,112233445566,850000,HDFC0004567`;
      setSourceType('financial');
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const file = new File([blob], filename, { type: 'text/plain' });
    setSelectedFile(file);
    setDocTitle(title);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <FileUp className="w-5 h-5 text-brand-purple" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Multi-Source Document Ingestion & NLP Extraction Pipeline
          </h2>
        </div>
        <p className="text-xs text-brand-muted max-w-3xl">
          Upload unstructured FIR complaints, cellular CDR files, banking wire records, or surveillance logs.
          The automated NLP extractor recognizes entities (Persons, Phones, Vehicles, Bank Accounts, Locations) and stages them in the human-in-the-loop review queue.
        </p>
      </div>

      {/* Quick Demo Sample Loader */}
      <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-purple flex-shrink-0" />
          <span className="text-xs font-semibold text-purple-950">
            Quick Evaluation Samples (1-Click Load Synthetic Documents):
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleLoadSample('fir')}
            className="px-3 py-1.5 bg-white hover:bg-brand-purple hover:text-white text-slate-700 text-xs font-medium rounded-xl border border-purple-200 shadow-sm transition-all"
          >
            Sample FIR (.txt)
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('surveillance')}
            className="px-3 py-1.5 bg-white hover:bg-brand-purple hover:text-white text-slate-700 text-xs font-medium rounded-xl border border-purple-200 shadow-sm transition-all"
          >
            Surveillance Log (.txt)
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('financial')}
            className="px-3 py-1.5 bg-white hover:bg-brand-purple hover:text-white text-slate-700 text-xs font-medium rounded-xl border border-purple-200 shadow-sm transition-all"
          >
            Financial Ledger (.csv)
          </button>
        </div>
      </div>

      {/* Main Ingestion Form */}
      <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Document Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Document Title / Reference
            </label>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="e.g., FIR No. 142/2026 - Cyber Cell"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-brand-purple"
            />
          </div>

          {/* Source Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Source Record Category
            </label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-brand-purple"
            >
              <option value="fir">FIR / Police Complaint (.txt / .pdf)</option>
              <option value="cdr">Call Detail Records (CDR .csv)</option>
              <option value="financial">Financial Wire / Banking Ledger (.csv)</option>
              <option value="surveillance_log">Physical Surveillance Observation Log (.txt)</option>
              <option value="social_media">Social Media Intelligence Extract (.json)</option>
            </select>
          </div>
        </div>

        {/* File Dropzone */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            Upload Document File
          </label>
          <FileUploadDropzone
            onFileSelect={setSelectedFile}
            selectedFile={selectedFile}
            disabled={isProcessing}
          />
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isProcessing}
            className={`px-6 py-3 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center gap-2 ${
              selectedFile && !isProcessing
                ? 'bg-brand-purple hover:bg-brand-purple-light shadow-brand-purple/25 cursor-pointer'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running spaCy NER & Regex Parser...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Process & Extract Entities</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Result Card */}
      {uploadResult && (
        <div className="bg-emerald-50/90 border border-emerald-200 p-6 rounded-2xl shadow-sm text-emerald-950 space-y-4 animate-fadeIn">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Document Successfully Ingested</h3>
                <p className="text-xs text-emerald-800 mt-0.5">{uploadResult.message}</p>
                <div className="flex flex-wrap gap-4 text-xs font-mono mt-3 text-emerald-900">
                  <span>Record Code: <strong>{uploadResult.record_code}</strong></span>
                  <span>Category: <strong>{uploadResult.source_type.toUpperCase()}</strong></span>
                  <span>Entities Extracted: <strong>{uploadResult.entities_extracted_count}</strong></span>
                </div>
              </div>
            </div>

            {onNavigateToReview && (
              <button
                type="button"
                onClick={() => onNavigateToReview(uploadResult.record_id)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 flex-shrink-0"
              >
                <span>Review Staged Entities</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-rose-900 text-xs flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Disclaimer */}
      <DisclaimerBanner variant="light" />
    </div>
  );
};

export default IngestionPage;
