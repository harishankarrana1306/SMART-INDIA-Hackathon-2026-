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
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fadeIn text-[#2C241D]">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-[#E5DACB] shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <FileUp className="w-5 h-5 text-[#9C6644]" />
          <h2 className="text-lg font-bold text-[#2C241D] tracking-tight">
            Multi-Source Document Ingestion & NLP Extraction Pipeline
          </h2>
        </div>
        <p className="text-xs text-[#7D7268] max-w-3xl">
          Upload unstructured FIR complaints, cellular CDR files, banking wire records, or surveillance logs.
          The automated NLP extractor recognizes entities (Persons, Phones, Vehicles, Bank Accounts, Locations) and stages them in the human-in-the-loop review queue.
        </p>
      </div>

      {/* Quick Demo Sample Loader */}
      <div className="p-4 rounded-2xl bg-[#F5EFE6] border border-[#E5DACB] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#9C6644] flex-shrink-0" />
          <span className="text-xs font-semibold text-[#2C241D]">
            Quick Evaluation Samples (1-Click Load Synthetic Documents):
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleLoadSample('fir')}
            className="px-3 py-1.5 bg-white hover:bg-[#EAE1D5] text-[#9C6644] border border-[#E5DACB] rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
          >
            FIR Complaint (.txt)
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('surveillance')}
            className="px-3 py-1.5 bg-white hover:bg-[#EAE1D5] text-[#9C6644] border border-[#E5DACB] rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
          >
            Surveillance Log (.txt)
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('financial')}
            className="px-3 py-1.5 bg-white hover:bg-[#EAE1D5] text-[#9C6644] border border-[#E5DACB] rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
          >
            Bank Wire CSV (.csv)
          </button>
        </div>
      </div>

      {/* Main Upload Box */}
      <div className="bg-white p-6 rounded-3xl border border-[#E5DACB] shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5248] mb-1.5">
              Source Record Type
            </label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#F5EFE6]/60 border border-[#E5DACB] rounded-xl text-[#2C241D] text-xs font-medium focus:outline-none focus:border-[#9C6644] focus:ring-1 focus:ring-[#9C6644]"
            >
              <option value="fir">First Information Report (FIR)</option>
              <option value="cdr">Call Detail Record (CDR / IMEI)</option>
              <option value="financial">Financial Wire / Banking Ledger</option>
              <option value="surveillance_log">Field Surveillance Observation Log</option>
              <option value="witness_statement">Witness / Interrogation Statement</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#5C5248] mb-1.5">
              Document Reference / Title
            </label>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="e.g. FIR-142/2026 New Delhi Cyber Station"
              className="w-full px-3.5 py-2.5 bg-[#F5EFE6]/60 border border-[#E5DACB] rounded-xl text-[#2C241D] text-xs placeholder-[#9C9288] focus:outline-none focus:border-[#9C6644] focus:ring-1 focus:ring-[#9C6644]"
            />
          </div>
        </div>

        {/* Drag & Drop File Zone */}
        <FileUploadDropzone
          onFileSelect={setSelectedFile}
          selectedFile={selectedFile}
          disabled={isProcessing}
        />

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isProcessing}
            className="px-6 py-2.5 bg-[#9C6644] hover:bg-[#7F4F24] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-[#9C6644]/25 flex items-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running NLP Pipeline & Entity Extraction...</span>
              </>
            ) : (
              <>
                <FileUp className="w-4 h-4" />
                <span>Ingest & Extract Entities</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success / Result Feedback */}
      {uploadResult && (
        <div className="p-6 bg-white rounded-3xl border border-emerald-300 shadow-md space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold">
                Document Ingested & Staged Successfully!
              </h3>
            </div>
            <span className="text-xs font-mono text-[#7D7268]">
              Record ID: {uploadResult.record_id}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-[#F5EFE6] rounded-xl border border-[#E5DACB]">
              <span className="text-[10px] uppercase font-bold text-[#8C827A]">Extracted Entities</span>
              <p className="text-base font-bold text-[#2C241D] mt-0.5">{uploadResult.entities_extracted_count}</p>
            </div>
            <div className="p-3 bg-[#F5EFE6] rounded-xl border border-[#E5DACB]">
              <span className="text-[10px] uppercase font-bold text-[#8C827A]">Source Type</span>
              <p className="text-xs font-semibold text-[#2C241D] mt-1 capitalize">{uploadResult.source_type.replace('_', ' ')}</p>
            </div>
            <div className="p-3 bg-[#F5EFE6] rounded-xl border border-[#E5DACB]">
              <span className="text-[10px] uppercase font-bold text-[#8C827A]">Status</span>
              <p className="text-xs font-semibold text-amber-700 mt-1 capitalize">{uploadResult.status}</p>
            </div>
            <div className="p-3 bg-[#F5EFE6] rounded-xl border border-[#E5DACB]">
              <span className="text-[10px] uppercase font-bold text-[#8C827A]">Review Queue</span>
              <p className="text-xs font-semibold text-[#9C6644] mt-1">Pending Human Review</p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => onNavigateToReview && onNavigateToReview(uploadResult.record_id)}
              className="px-5 py-2 bg-[#9C6644] hover:bg-[#7F4F24] text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-[#9C6644]/25 flex items-center gap-2 cursor-pointer"
            >
              <span>Review Extracted Entities in Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Mandatory Disclaimer */}
      <DisclaimerBanner variant="light" />
    </div>
  );
};

export default IngestionPage;
