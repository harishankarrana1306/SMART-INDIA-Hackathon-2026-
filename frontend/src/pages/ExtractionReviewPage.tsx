import React, { useEffect, useState } from 'react';
import { ListFilter, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { ExtractedEntity } from '../types';
import ExtractionTable from '../components/extraction/ExtractionTable';
import EntityCorrectionModal from '../components/extraction/EntityCorrectionModal';
import LoadingState from '../components/common/LoadingState';
import DisclaimerBanner from '../components/common/DisclaimerBanner';

interface ExtractionReviewPageProps {
  initialRecordId?: string;
}

export const ExtractionReviewPage: React.FC<ExtractionReviewPageProps> = ({ initialRecordId }) => {
  const [entities, setEntities] = useState<ExtractedEntity[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingEntity, setEditingEntity] = useState<ExtractedEntity | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchEntities = async () => {
    setIsLoading(true);
    try {
      const data = await api.listExtractedEntities({
        record_id: initialRecordId,
        status: statusFilter,
        entity_type: typeFilter,
      });
      setEntities(data);
      setSelectedIds([]);
    } catch (e) {
      console.error('Failed to load extractions:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntities();
  }, [statusFilter, typeFilter, initialRecordId]);

  const showFeedback = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const pending = entities.filter((e) => e.status === 'pending');
    if (pending.every((e) => selectedIds.includes(e.id))) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pending.map((e) => e.id));
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.approveEntity(id);
      showFeedback('Entity approved and synchronized to graph canvas.');
      fetchEntities();
    } catch (e) {
      console.error('Approval failed:', e);
    }
  };

  const handleCorrectSave = async (id: string, normalizedVal: string, entityType: string, reason?: string) => {
    try {
      await api.correctEntity(id, normalizedVal, entityType, reason);
      setEditingEntity(null);
      showFeedback('Entity corrected, approved, and synchronized to graph canvas.');
      fetchEntities();
    } catch (e) {
      console.error('Correction failed:', e);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.rejectEntity(id);
      showFeedback('Entity marked as rejected.');
      fetchEntities();
    } catch (e) {
      console.error('Rejection failed:', e);
    }
  };

  const handleBatchApprove = async () => {
    try {
      await api.batchApproveEntities(selectedIds);
      showFeedback(`Batch approved ${selectedIds.length} entities to knowledge graph.`);
      fetchEntities();
    } catch (e) {
      console.error('Batch approval failed:', e);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-brand-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ListFilter className="w-5 h-5 text-brand-purple" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Human-in-the-Loop Extraction Review Staging
            </h2>
          </div>
          <p className="text-xs text-brand-muted max-w-2xl">
            Review and verify NLP-extracted entities before graph insertion. Approve valid entities, correct typos or categories, or reject hallucinations to ensure 100% evidentiary integrity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchEntities}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
            title="Refresh staged queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-brand-border shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Status Tabs */}
          <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl">
            {['pending', 'approved', 'rejected', 'ALL'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-white text-brand-purple shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'All Records' : st}
              </button>
            ))}
          </div>

          {/* Entity Type Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-purple"
            >
              <option value="ALL">All Categories</option>
              <option value="Person">Person</option>
              <option value="Phone">Phone</option>
              <option value="Vehicle">Vehicle</option>
              <option value="Location">Location</option>
              <option value="Organisation">Organisation</option>
              <option value="BankAccount">Bank Account</option>
              <option value="Case">Case</option>
              <option value="Date">Date</option>
            </select>
          </div>
        </div>

        <span className="text-xs font-mono text-slate-500">
          {entities.length} Staged Extractions
        </span>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <LoadingState message="Loading staged entities from NLP parser..." />
      ) : entities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-border p-12 text-center text-xs text-brand-muted space-y-2">
          <p className="font-semibold text-slate-700">No staged entities in this filter view.</p>
          <p>Upload new FIR or CDR documents in the Ingestion pipeline to extract entities.</p>
        </div>
      ) : (
        <ExtractionTable
          entities={entities}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onApprove={handleApprove}
          onCorrect={(ent) => setEditingEntity(ent)}
          onReject={handleReject}
          onBatchApprove={handleBatchApprove}
        />
      )}

      {/* Correction Modal */}
      {editingEntity && (
        <EntityCorrectionModal
          entity={editingEntity}
          onClose={() => setEditingEntity(null)}
          onSave={handleCorrectSave}
        />
      )}

      {/* Disclaimer */}
      <DisclaimerBanner variant="light" />
    </div>
  );
};

export default ExtractionReviewPage;
