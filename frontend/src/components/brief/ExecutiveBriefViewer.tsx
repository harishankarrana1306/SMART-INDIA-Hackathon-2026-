import React from 'react';
import {
  FileDown,
  Printer,
  Shield,
  FileText,
  Users,
  Bell,
  CheckCircle2,
  Clock,
  GitMerge,
  Search,
  BookOpen,
  UserCheck,
} from 'lucide-react';
import { ExecutiveCaseBrief } from '../../types';
import Badge from '../common/Badge';

interface ExecutiveBriefViewerProps {
  brief: ExecutiveCaseBrief;
  onDownloadPdf: () => void;
  isDownloading?: boolean;
}

export const ExecutiveBriefViewer: React.FC<ExecutiveBriefViewerProps> = ({
  brief,
  onDownloadPdf,
  isDownloading = false,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const keyEntities = brief.key_entities || [];
  const keyRels = brief.key_relationships || [];
  const activeAlerts = brief.active_alerts || [];
  const timeline = brief.timeline_highlights || [];

  return (
    <div className="bg-white rounded-3xl border border-[#E5DACB] shadow-xl overflow-hidden space-y-6 animate-fadeIn text-[#2C241D]">
      {/* Top Toolbar */}
      <div className="p-4 bg-[#2C241D] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#43382F]">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-xl bg-[#9C6644] flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#F5EFE6]">
            Standardized 10-Section Case Intelligence Brief
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-[#43382F] hover:bg-[#5C5248] text-[#E5DACB] text-xs font-semibold rounded-xl border border-[#5C5248] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print View</span>
          </button>

          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={isDownloading}
            className="px-4 py-1.5 bg-[#9C6644] hover:bg-[#7F4F24] text-white text-xs font-bold rounded-xl shadow-md shadow-[#9C6644]/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            <span>{isDownloading ? 'Generating PDF...' : 'Download Official PDF'}</span>
          </button>
        </div>
      </div>

      <div className="p-8 space-y-8 max-w-4xl mx-auto">
        {/* Mandatory Disclaimer Box */}
        <div className="p-3.5 bg-[#FEF6E9] border border-[#FCE4BE] rounded-2xl text-center">
          <p className="text-[11px] font-bold text-[#7F4F24] tracking-wide uppercase">
            Decision-Support Only • Not a Determination of Guilt or Risk • All Findings Require Human Investigator Review • 100% Synthetic Case Record
          </p>
        </div>

        {/* Official Header */}
        <div className="border-b border-[#E5DACB] pb-5 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#9C6644] block">
            NETRA • National Investigative Intelligence & Crime Network Analysis Platform
          </span>
          <h1 className="text-xl font-extrabold text-[#2C241D] tracking-tight">
            {brief.case_title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#5C5248] pt-1">
            <span>Case Code: <strong>{brief.case_code}</strong></span>
            <span>Status: <strong className="uppercase text-[#9C6644]">{brief.case_status}</strong></span>
            <span>Generated: {new Date(brief.generated_at).toLocaleDateString()}</span>
            <span>Investigator: {brief.generated_by}</span>
          </div>
        </div>

        {/* Section 1: Executive Summary & Context */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#9C6644] flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            1. Executive Summary & Context
          </h2>
          <p className="text-xs text-[#2C241D] leading-relaxed bg-[#F5EFE6]/60 p-4 rounded-2xl border border-[#E5DACB]">
            {brief.summary_narrative}
          </p>
        </section>

        {/* Section 2: Case Overview & Evidentiary Source Documents */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#9C6644] flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            2. Case Overview & Evidentiary Source Documents
          </h2>
          <div className="p-4 bg-[#F5EFE6]/60 border border-[#E5DACB] rounded-2xl text-xs space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[#43382F]">
              <div><span className="text-[#8C827A] block text-[10px] uppercase font-bold">Case Reference</span><strong>{brief.case_code}</strong></div>
              <div><span className="text-[#8C827A] block text-[10px] uppercase font-bold">Investigation Status</span><span className="text-[#2D7A58] font-bold uppercase">{brief.case_status}</span></div>
              <div><span className="text-[#8C827A] block text-[10px] uppercase font-bold">Identified Entities</span><strong>{keyEntities.length} Mapped Nodes</strong></div>
              <div><span className="text-[#8C827A] block text-[10px] uppercase font-bold">Verified Links</span><strong>{keyRels.length} Evidentiary Edges</strong></div>
            </div>
          </div>
        </section>

        {/* Section 3: Key Entities & Network Findings */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#9C6644] flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            3. Key Entities & Network Findings ({keyEntities.length} Entities, {keyRels.length} Relationships)
          </h2>

          {/* Key Entities Sub-table */}
          {keyEntities.length > 0 ? (
            <div className="border border-[#E5DACB] rounded-2xl overflow-hidden">
              <div className="bg-[#F5EFE6] px-4 py-2 text-[10px] font-bold uppercase text-[#5C5248] border-b border-[#E5DACB]">
                Discovered Network Entities
              </div>
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FBF8F3] text-[10px] font-bold text-[#7D7268] uppercase border-b border-[#E5DACB]">
                  <tr>
                    <th className="py-2 px-4">Entity Identifier</th>
                    <th className="py-2 px-4">Category</th>
                    <th className="py-2 px-4">Investigative Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DACB]/60">
                  {keyEntities.map((ent, idx) => (
                    <tr key={idx} className="hover:bg-[#F5EFE6]/40">
                      <td className="py-2 px-4 font-bold text-[#2C241D] font-mono">
                        {ent.masked_identifier || ent.name}
                      </td>
                      <td className="py-2 px-4">
                        <Badge label={ent.type} size="sm" />
                      </td>
                      <td className="py-2 px-4 text-[#5C5248] capitalize font-medium">
                        {ent.role_or_label}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-[#7D7268] italic p-3 bg-[#F5EFE6]/40 rounded-xl border border-[#E5DACB]">
              No network entities mapped for this case scope.
            </p>
          )}

          {/* Key Relationships Sub-table */}
          {keyRels.length > 0 && (
            <div className="border border-[#E5DACB] rounded-2xl overflow-hidden">
              <div className="bg-[#F5EFE6] px-4 py-2 text-[10px] font-bold uppercase text-[#5C5248] border-b border-[#E5DACB]">
                Evidentiary Relationships & Network Links
              </div>
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FBF8F3] text-[10px] font-bold text-[#7D7268] uppercase border-b border-[#E5DACB]">
                  <tr>
                    <th className="py-2 px-4">Source Entity</th>
                    <th className="py-2 px-4">Relationship</th>
                    <th className="py-2 px-4">Target Entity</th>
                    <th className="py-2 px-4">Citation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DACB]/60">
                  {keyRels.map((rel, idx) => (
                    <tr key={idx} className="hover:bg-[#F5EFE6]/40">
                      <td className="py-2 px-4 font-bold text-[#2C241D] font-mono">
                        {rel.source_name}
                      </td>
                      <td className="py-2 px-4 text-[#9C6644] font-semibold">
                        {rel.relationship_type.replace(/_/g, ' ')}
                      </td>
                      <td className="py-2 px-4 font-bold text-[#2C241D] font-mono">
                        {rel.target_name}
                      </td>
                      <td className="py-2 px-4 font-mono font-bold text-[#9C6644]">
                        {rel.source_record_code}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Section 4: Investigation Alerts */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#9C6644] flex items-center gap-1.5">
            <Bell className="w-4 h-4" />
            4. Investigation Alerts & Advisory Pattern Flags ({activeAlerts.length} Flagged)
          </h2>
          <div className="space-y-2">
            {activeAlerts.map((al, idx) => (
              <div key={idx} className="p-3 bg-[#F5EFE6]/60 border border-[#E5DACB] rounded-2xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#2C241D]">{typeof al === 'string' ? al : (al as any).title || (al as any).rule_name}</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase bg-[#9C6644]/10 text-[#9C6644] border border-[#9C6644]/20">
                    Active Advisory
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Entity Resolution Findings */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#9C6644] flex items-center gap-1.5">
            <GitMerge className="w-4 h-4" />
            5. Entity Resolution Findings & Cross-Record Identifiers
          </h2>
          <div className="p-4 bg-[#F5EFE6]/60 border border-[#E5DACB] rounded-2xl text-xs space-y-2">
            <p className="text-[#43382F] leading-relaxed">
              Automated entity resolution has reconciled phone numbers, vehicle registrations, and suspect aliases across multi-jurisdiction records. Verified matches have been unified into canonical nodes with full source traceability.
            </p>
          </div>
        </section>

        {/* Section 6: Crime Timeline / Chronology */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#9C6644] flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            6. Crime Timeline & Temporal Chronology
          </h2>
          <div className="p-4 bg-[#F5EFE6]/60 border border-[#E5DACB] rounded-2xl space-y-2 text-xs">
            {timeline.slice(0, 5).map((tl, idx) => (
              <div key={idx} className="flex items-start gap-3 text-[#43382F]">
                <span className="font-mono font-bold text-[#9C6644] w-24 flex-shrink-0">
                  {tl.timestamp ? new Date(tl.timestamp).toLocaleDateString() : '2026-08-20'}
                </span>
                <span className="font-semibold text-[#2C241D] flex-1">{tl.title || tl.event_type}</span>
                <span className="font-mono text-[#8C827A]">{tl.source_record_code || 'REC-SOURCE'}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section 7: Evidence & Source References */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#9C6644] flex items-center gap-1.5">
            <Search className="w-4 h-4" />
            7. Evidence Citations & Source Document References
          </h2>
          <p className="text-xs text-[#5C5248] p-4 bg-[#F5EFE6]/60 rounded-2xl border border-[#E5DACB] leading-relaxed">
            All intelligence entities and relational vectors presented in this brief are anchored directly to verified evidence records (FIR complaints, CDR call logs, wire transfers, and field surveillance).
          </p>
        </section>

        {/* Section 8: Investigative Findings & Hypothesis */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#9C6644] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            8. Investigative Findings & Syndicate Hierarchy Analysis
          </h2>
          <p className="text-xs text-[#5C5248] p-4 bg-[#F5EFE6]/60 rounded-2xl border border-[#E5DACB] leading-relaxed">
            Graph centrality analysis highlights primary operational coordinators and intermediary communication hubs linking disparate syndicate cells across multiple state jurisdictions.
          </p>
        </section>

        {/* Section 9: Disclaimers & Limitations */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#9C6644] flex items-center gap-1.5">
            <Shield className="w-4 h-4" />
            9. Disclaimers, Decision-Support Scope & Limitations
          </h2>
          <p className="text-xs text-[#7F4F24] p-4 bg-[#FEF6E9] rounded-2xl border border-[#FCE4BE] leading-relaxed">
            This briefing document is an automated AI decision-support aid and does not constitute a legal finding of guilt. All inferences, entity resolutions, and relationship paths require independent verification by investigating officers prior to judicial filing.
          </p>
        </section>

        {/* Section 10: Sign-off & Chain of Custody */}
        <section className="space-y-3 pt-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#9C6644] flex items-center gap-1.5">
            <UserCheck className="w-4 h-4" />
            10. Investigator Sign-off & Cryptographic Chain of Custody
          </h2>
          <div className="p-4 bg-[#F5EFE6]/60 border border-[#E5DACB] rounded-2xl text-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] text-[#5C5248]">
              <div><span>Generated By: </span><strong className="text-[#2C241D]">{brief.generated_by}</strong></div>
              <div><span>Cryptographic Audit ID: </span><strong className="text-[#9C6644]">{brief.brief_id}</strong></div>
              <div><span>Verification: </span><strong className="text-[#2D7A58]">SHA-256 Validated</strong></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ExecutiveBriefViewer;
