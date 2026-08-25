import React from 'react';
import { X, Network, FolderGit2, FileText, ArrowUpRight, Shield, Expand, Calendar, MapPin, Loader2 } from 'lucide-react';
import { NodeProfile } from '../../types';
import Badge from '../common/Badge';
import MaskedValue from '../common/MaskedValue';
import DisclaimerBanner from '../common/DisclaimerBanner';

interface NodeProfileDrawerProps {
  profile: NodeProfile | null;
  onClose: () => void;
  onExpand: (nodeId: string, depth: number) => void;
  onSelectEntity: (entityId: string) => void;
  isLoading?: boolean;
}

export const NodeProfileDrawer: React.FC<NodeProfileDrawerProps> = ({
  profile,
  onClose,
  onExpand,
  onSelectEntity,
  isLoading = false,
}) => {
  if (!profile) return null;

  const isSensitive = profile.label.toLowerCase() === 'phone' || profile.label.toLowerCase().includes('account');

  return (
    <div className="w-96 bg-white border-l border-brand-border h-full flex flex-col shadow-2xl z-20 overflow-y-auto animate-slideLeft">
      {/* Drawer Header */}
      <div className="p-5 border-b border-brand-border bg-slate-50/70 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge label={profile.label} variant="purple" />
            {profile.properties?.is_synthetic && (
              <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Synthetic Record
              </span>
            )}
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-purple" />}
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {profile.display_name}
          </h2>
          <p className="text-xs font-mono text-slate-500 mt-0.5">
            Entity ID: {profile.id}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="p-5 space-y-6 flex-1">
        {/* Quick Expand Action */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onExpand(profile.id, 2)}
            className="flex-1 py-2 px-3 bg-brand-purple hover:bg-brand-purple-light text-white text-xs font-medium rounded-xl shadow-md shadow-brand-purple/20 transition-all flex items-center justify-center gap-2"
          >
            <Expand className="w-3.5 h-3.5" />
            <span>Expand 2nd-Degree Network</span>
          </button>
        </div>

        {/* Entity Attributes & Privacy Masking */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-brand-purple" />
            Entity Attributes & Identifiers
          </h3>
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80 space-y-2.5 text-xs">
            {isSensitive ? (
              <div>
                <span className="text-slate-500 block mb-1">Masked Identifier:</span>
                <MaskedValue
                  nodeId={profile.id}
                  value={profile.display_name}
                  entityType={profile.label}
                  isSensitive={true}
                />
              </div>
            ) : (
              <div>
                <span className="text-slate-500 block mb-0.5">Primary Identifier:</span>
                <span className="font-semibold text-slate-900">{profile.display_name}</span>
              </div>
            )}

            {profile.properties?.dob && (
              <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                <span className="text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" /> Date of Birth:
                </span>
                <span className="font-mono text-slate-800">{profile.properties.dob}</span>
              </div>
            )}

            {profile.properties?.vehicle_type && (
              <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                <span className="text-slate-500">Vehicle Type:</span>
                <span className="font-medium text-slate-800">{profile.properties.vehicle_type}</span>
              </div>
            )}

            {profile.properties?.bank_name && (
              <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                <span className="text-slate-500">Financial Institution:</span>
                <span className="font-medium text-slate-800">{profile.properties.bank_name}</span>
              </div>
            )}

            {profile.properties?.lat && profile.properties?.lng && (
              <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                <span className="text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" /> Geo Coordinates:
                </span>
                <span className="font-mono text-slate-800">
                  {profile.properties.lat}, {profile.properties.lng}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Linked Cases */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <FolderGit2 className="w-3.5 h-3.5 text-amber-500" />
            Associated Case Files ({profile.linked_cases?.length || 0})
          </h3>
          {profile.linked_cases && profile.linked_cases.length > 0 ? (
            <div className="space-y-2">
              {profile.linked_cases.map((c) => (
                <div
                  key={c.id}
                  className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold font-mono text-amber-900">{c.case_code}</span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      {c.status}
                    </span>
                  </div>
                  <p className="text-slate-700 mt-1">{c.title}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-brand-muted italic">No direct primary case files linked.</p>
          )}
        </div>

        {/* Connected Entities in Network */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Network className="w-3.5 h-3.5 text-brand-purple" />
            Connected First-Degree Links ({profile.connected_entities?.length || 0})
          </h3>
          {profile.connected_entities && profile.connected_entities.length > 0 ? (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {profile.connected_entities.map((ce, idx) => (
                <div
                  key={`${ce.id}-${idx}`}
                  onClick={() => onSelectEntity(ce.id)}
                  className="p-2.5 bg-slate-50 hover:bg-purple-50/70 border border-slate-200 hover:border-brand-purple/40 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs group"
                >
                  <div>
                    <span className="font-semibold text-slate-900 group-hover:text-brand-purple">
                      {ce.display_name}
                    </span>
                    <div className="text-[11px] text-brand-muted flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono">{ce.relationship_type.replace(/_/g, ' ')}</span>
                      <span>•</span>
                      <Badge label={ce.label} size="sm" variant="slate" />
                    </div>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-purple" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-brand-muted italic">No first-degree connections found.</p>
          )}
        </div>

        {/* Source Evidence References */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            Originating Source Records ({profile.source_records?.length || 0})
          </h3>
          {profile.source_records && profile.source_records.length > 0 ? (
            <div className="space-y-2">
              {profile.source_records.map((sr) => (
                <div
                  key={sr.record_code}
                  className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold font-mono text-indigo-900">{sr.record_code}</span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                      {sr.source_type}
                    </span>
                  </div>
                  {sr.snippet && (
                    <p className="text-slate-600 text-[11px] italic">"{sr.snippet}"</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-brand-muted italic">No source record references indexed.</p>
          )}
        </div>
      </div>

      {/* Drawer Footer Disclaimer */}
      <div className="p-4 border-t border-brand-border bg-slate-50">
        <DisclaimerBanner variant="light" />
      </div>
    </div>
  );
};

export default NodeProfileDrawer;
