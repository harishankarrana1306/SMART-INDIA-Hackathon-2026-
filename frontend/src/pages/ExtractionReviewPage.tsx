import React, { useEffect, useState, useMemo } from 'react';
import {
  ListFilter,
  RefreshCw,
  CheckCircle2,
  Users,
  Car,
  Phone,
  MapPin,
  Building2,
  CreditCard,
  Layers,
  Search,
  CheckCheck,
} from 'lucide-react';
import { api } from '../api/client';
import { ExtractedEntity } from '../types';
import ExtractionTable from '../components/extraction/ExtractionTable';
import EntityCorrectionModal from '../components/extraction/EntityCorrectionModal';
import LoadingState from '../components/common/LoadingState';
import DisclaimerBanner from '../components/common/DisclaimerBanner';

interface ExtractionReviewPageProps {
  initialRecordId?: string;
  onNavigateToGraph?: (caseCode?: string, nodeIdOrName?: string) => void;
}

interface CategoryConfig {
  id: string;
  label: string;
  types: string[];
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'ALL', label: 'All Entities', types: [], icon: Layers, color: 'text-[#9C6644] bg-[#9C6644]/10 border-[#9C6644]/20' },
  { id: 'NAMES', label: 'Names / Persons', types: ['Person'], icon: Users, color: 'text-[#4F46E5] bg-[#EEF2FF] border-[#C7D2FE]' },
  { id: 'VEHICLES', label: 'Vehicles', types: ['Vehicle'], icon: Car, color: 'text-[#D97706] bg-[#FEF3C7] border-[#FDE68A]' },
  { id: 'PHONES', label: 'Phone Numbers', types: ['Phone'], icon: Phone, color: 'text-[#7C3AED] bg-[#F5F3FF] border-[#DDD6FE]' },
  { id: 'LOCATIONS', label: 'Locations', types: ['Location'], icon: MapPin, color: 'text-[#0284C7] bg-[#E0F2FE] border-[#BAE6FD]' },
  { id: 'ORGANISATIONS', label: 'Organizations', types: ['Organisation'], icon: Building2, color: 'text-[#9333EA] bg-[#FAF5FF] border-[#E9D5FF]' },
  { id: 'FINANCIAL', label: 'Financial Information', types: ['BankAccount', 'Amount', 'Transaction'], icon: CreditCard, color: 'text-[#0D9488] bg-[#CCFBF1] border-[#99F6E4]' },
];

export const ExtractionReviewPage: React.FC<ExtractionReviewPageProps> = ({ initialRecordId, onNavigateToGraph }) => {
  const [entities, setEntities] = useState<ExtractedEntity[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingEntity, setEditingEntity] = useState<ExtractedEntity | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchEntities = async () => {
    setIsLoading(true);
    try {
      const data = await api.listExtractedEntities({
        record_id: initialRecordId,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
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
    const handleReload = () => fetchEntities();
    window.addEventListener('netra-data-reloaded', handleReload);
    return () => window.removeEventListener('netra-data-reloaded', handleReload);
  }, [statusFilter, initialRecordId]);

  const showFeedback = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4500);
  };

  // Compute category counts dynamically
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: entities.length };
    CATEGORIES.forEach((cat) => {
      if (cat.id !== 'ALL') {
        counts[cat.id] = entities.filter((e) => cat.types.includes(e.entity_type)).length;
      }
    });
    return counts;
  }, [entities]);

  // Filter entities by active category and search term
  const filteredEntities = useMemo(() => {
    let list = entities;
    const cat = CATEGORIES.find((c) => c.id === activeCategory);
    if (cat && cat.id !== 'ALL' && cat.types.length > 0) {
      list = list.filter((e) => cat.types.includes(e.entity_type));
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (e) =>
          e.normalized_value.toLowerCase().includes(q) ||
          e.raw_value.toLowerCase().includes(q) ||
          (e.context_snippet && e.context_snippet.toLowerCase().includes(q)) ||
          (e.record_code && e.record_code.toLowerCase().includes(q))
      );
    }
    return list;
  }, [entities, activeCategory, searchTerm]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const pendingInView = filteredEntities.filter((e) => e.status === 'pending');
    if (pendingInView.every((e) => selectedIds.includes(e.id))) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingInView.map((e) => e.id));
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setEntities((prev) => prev.filter((e) => e.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      await api.approveEntity(id);
      showFeedback('Entity approved, added to graph canvas, and removed from review staging.');
      fetchEntities();
    } catch (e) {
      console.error('Approval failed:', e);
      fetchEntities();
    }
  };

  const handleCorrectSave = async (id: string, normalizedVal: string, entityType: string, reason?: string) => {
    try {
      setEntities((prev) => prev.filter((e) => e.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      await api.correctEntity(id, normalizedVal, entityType, reason);
      setEditingEntity(null);
      showFeedback('Entity corrected, approved to graph, and removed from review staging.');
      fetchEntities();
    } catch (e) {
      console.error('Correction failed:', e);
      fetchEntities();
    }
  };

  const handleReject = async (id: string) => {
    try {
      setEntities((prev) => prev.filter((e) => e.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      await api.rejectEntity(id);
      showFeedback('Entity rejected and removed from staging queue.');
      fetchEntities();
    } catch (e) {
      console.error('Rejection failed:', e);
      fetchEntities();
    }
  };

  const handleBatchApprove = async () => {
    const idsToApprove = [...selectedIds];
    if (idsToApprove.length === 0) return;
    try {
      setEntities((prev) => prev.filter((e) => !idsToApprove.includes(e.id)));
      setSelectedIds([]);
      await api.batchApproveEntities(idsToApprove);
      showFeedback(`Batch approved ${idsToApprove.length} entities to knowledge graph (removed from pending queue).`);
      fetchEntities();
    } catch (e) {
      console.error('Batch approval failed:', e);
      fetchEntities();
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn text-[#2C241D]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E5DACB] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ListFilter className="w-5 h-5 text-[#9C6644]" />
            <h2 className="text-lg font-bold text-[#2C241D] tracking-tight">
              Human-in-the-Loop Extraction Review Staging
            </h2>
          </div>
          <p className="text-xs text-[#7D7268] max-w-3xl">
            Review and verify extracted information dynamically organized by data type. Approve valid entities, correct identifiers, or reject extractions with full evidentiary source document linkage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchEntities}
            className="p-2.5 bg-[#F5EFE6] hover:bg-[#EAE1D5] text-[#43382F] rounded-xl transition-all border border-[#E5DACB] cursor-pointer"
            title="Refresh staged queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notification Toast with Graph Jump Action */}
      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 animate-fadeIn shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{notification}</span>
          </div>
          {onNavigateToGraph && (
            <button
              type="button"
              onClick={() => onNavigateToGraph('FIC-CASE-0001')}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer flex-shrink-0"
            >
              <span>View in Network Graph</span>
              <span>→</span>
            </button>
          )}
        </div>
      )}

      {/* Dynamic Entity Category Selector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const count = categoryCounts[cat.id] || 0;
          const isSelected = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'bg-[#9C6644] text-white border-[#9C6644] shadow-md shadow-[#9C6644]/25'
                  : 'bg-white border-[#E5DACB] text-[#43382F] hover:bg-[#F5EFE6]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#8C827A]'}`} />
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[#F5EFE6] text-[#5C5248] border border-[#E5DACB]'
                  }`}
                >
                  {count}
                </span>
              </div>
              <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-[#2C241D]'}`}>
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Bulk Action Bar */}
      <div className="p-4 bg-white rounded-3xl border border-[#E5DACB] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C827A]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search entity value, snippet, or FIR..."
              className="w-full pl-9 pr-4 py-2 bg-[#F5EFE6]/60 border border-[#E5DACB] rounded-xl text-xs text-[#2C241D] placeholder-[#9C9288] focus:outline-none focus:border-[#9C6644] focus:ring-1 focus:ring-[#9C6644]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-[#7D7268]">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#F5EFE6]/60 border border-[#E5DACB] rounded-xl text-xs font-semibold text-[#2C241D] focus:outline-none focus:border-[#9C6644]"
            >
              <option value="pending">Pending Review Only</option>
              <option value="approved">Approved Extractions</option>
              <option value="corrected">Corrected Entities</option>
              <option value="rejected">Rejected Items</option>
              <option value="ALL">All Records</option>
            </select>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <span className="text-xs font-bold text-[#9C6644]">
              {selectedIds.length} Selected
            </span>
            <button
              type="button"
              onClick={handleBatchApprove}
              className="px-4 py-2 bg-[#9C6644] hover:bg-[#7F4F24] text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-[#9C6644]/25 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Batch Approve ({selectedIds.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Extraction Review Table */}
      {isLoading ? (
        <LoadingState message="Filtering staged extractions..." />
      ) : (
        <ExtractionTable
          entities={filteredEntities}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onApprove={handleApprove}
          onReject={handleReject}
          onEdit={(entity) => setEditingEntity(entity)}
        />
      )}

      {/* Human-in-the-Loop Correction Modal */}
      {editingEntity && (
        <EntityCorrectionModal
          entity={editingEntity}
          onClose={() => setEditingEntity(null)}
          onSave={handleCorrectSave}
        />
      )}

      {/* Mandatory Disclaimer */}
      <DisclaimerBanner variant="light" />
    </div>
  );
};

export default ExtractionReviewPage;
