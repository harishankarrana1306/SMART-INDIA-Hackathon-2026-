import React from 'react';
import {
  X,
  Network,
  FolderGit2,
  FileText,
  ArrowUpRight,
  Shield,
  Expand,
  Calendar,
  MapPin,
  Loader2,
  Clock,
  Maximize2,
  User,
  Camera,
  Upload,
  Trash2,
} from 'lucide-react';
import { NodeProfile } from '../../types';
import Badge from '../common/Badge';
import MaskedValue from '../common/MaskedValue';
import DisclaimerBanner from '../common/DisclaimerBanner';

const formatPropertyLabel = (key: string): string => {
  const map: Record<string, string> = {
    dob: 'Date of Birth',
    vehicle_type: 'Vehicle Type',
    org_type: 'Organisation Type',
    case_code: 'Case Code',
    lat: 'Latitude',
    lng: 'Longitude',
    ifsc: 'IFSC Code',
    ifsc_code: 'IFSC Code',
    created_at: 'Registered At',
    bank_name: 'Bank Name',
    phone_number: 'Phone Number',
    account_number: 'Account Number',
  };
  if (map[key]) return map[key];
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getDisplayProperties = (
  profile: NodeProfile
): { label: string; value: string; isSensitive: boolean }[] => {
  const props = profile.properties || {};
  const labelLower = (profile.label || '').toLowerCase();
  const results: { label: string; value: string; isSensitive: boolean }[] = [];

  // Special Handling for Phone Entity: Only ONE single row for Phone Number
  if (labelLower === 'phone') {
    const maskedPhone =
      props.number_masked || props.phone_number || props.number || props.name || profile.display_name;
    results.push({
      label: 'Phone Number',
      value: String(maskedPhone),
      isSensitive: true,
    });

    const ignoredPhoneKeys = new Set([
      'id',
      'label',
      'name',
      'display_name',
      'number',
      'number_masked',
      'phone_number',
      'is_masked',
      'is_synthetic',
      'photo_url',
    ]);
    for (const [k, v] of Object.entries(props)) {
      if (ignoredPhoneKeys.has(k) || v === null || v === undefined) continue;
      results.push({
        label: formatPropertyLabel(k),
        value: String(v),
        isSensitive: false,
      });
    }
    return results;
  }

  // Special Handling for Bank Account Entity: Only ONE single row for Account Number
  if (labelLower.includes('account') || labelLower === 'bankaccount') {
    if (props.bank_name) {
      results.push({
        label: 'Bank Name',
        value: String(props.bank_name),
        isSensitive: false,
      });
    }

    const maskedAcc =
      props.account_masked || props.account_number || props.name || profile.display_name;
    results.push({
      label: 'Account Number',
      value: String(maskedAcc),
      isSensitive: true,
    });

    if (props.ifsc || props.ifsc_code) {
      results.push({
        label: 'IFSC Code',
        value: String(props.ifsc || props.ifsc_code),
        isSensitive: false,
      });
    }

    const ignoredAccKeys = new Set([
      'id',
      'label',
      'name',
      'display_name',
      'bank_name',
      'account_number',
      'account_masked',
      'ifsc',
      'ifsc_code',
      'is_masked',
      'is_synthetic',
      'photo_url',
    ]);
    for (const [k, v] of Object.entries(props)) {
      if (ignoredAccKeys.has(k) || v === null || v === undefined) continue;
      results.push({
        label: formatPropertyLabel(k),
        value: String(v),
        isSensitive: false,
      });
    }
    return results;
  }

  // General Entities (Person, Vehicle, Location, Organisation, Case, etc.)
  const ignoredGeneralKeys = new Set([
    'id',
    'label',
    'display_name',
    'is_synthetic',
    'is_masked',
    'photo_url',
  ]);

  for (const [k, v] of Object.entries(props)) {
    if (ignoredGeneralKeys.has(k) || v === null || v === undefined) continue;
    // Avoid repeating name if it's already shown as display_name in the drawer header
    if (k === 'name' && String(v) === profile.display_name) continue;
    results.push({
      label: formatPropertyLabel(k),
      value: String(v),
      isSensitive: false,
    });
  }

  return results;
};

interface NodeProfileDrawerProps {
  profile: NodeProfile | null;
  onClose: () => void;
  onExpand: (nodeId: string, depth: number) => void;
  onSelectEntity: (entityId: string) => void;
  onNavigateToTimeline?: (entityName: string) => void;
  onResetFocus?: () => void;
  onUpdatePhoto?: (nodeId: string, photoUrl: string) => void;
  isLoading?: boolean;
}

export const NodeProfileDrawer: React.FC<NodeProfileDrawerProps> = ({
  profile,
  onClose,
  onExpand,
  onSelectEntity,
  onNavigateToTimeline,
  onResetFocus,
  onUpdatePhoto,
  isLoading = false,
}) => {
  if (!profile) return null;

  const isSensitive =
    profile.label.toLowerCase() === 'phone' || profile.label.toLowerCase().includes('account');
  const isPerson = profile.label.toLowerCase() === 'person';
  const currentPhoto = profile.properties?.photo_url;
  const displayProperties = React.useMemo(() => getDisplayProperties(profile), [profile]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdatePhoto) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdatePhoto(profile.id, event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-96 bg-[#F5EFE6] border-l border-[#E5DACB] h-full flex flex-col shadow-2xl z-20 overflow-y-auto animate-slideLeft text-[#2C241D]">
      {/* Drawer Header */}
      <div className="p-5 border-b border-[#E5DACB] bg-[#EAE1D5] flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge label={profile.label} variant="purple" />
            {profile.properties?.is_synthetic && (
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#2D7A58] bg-[#EAF5EF] px-2 py-0.5 rounded border border-[#D0EADB]">
                Synthetic Record
              </span>
            )}
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#9C6644]" />}
          </div>
          <h2 className="text-lg font-bold text-[#2C241D] tracking-tight">
            {profile.display_name}
          </h2>
          <p className="text-xs font-mono text-[#7D7268] mt-0.5">Entity ID: {profile.id}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-[#7D7268] hover:text-[#2C241D] hover:bg-[#D8CBB9] transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="p-5 space-y-6 flex-1">
        {/* Quick Investigative Actions */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onExpand(profile.id, 2)}
              className="flex-1 py-2 px-3 bg-[#9C6644] hover:bg-[#7F4F24] text-white text-xs font-semibold rounded-xl shadow-md shadow-[#9C6644]/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Expand className="w-3.5 h-3.5" />
              <span>Expand 2-Hop Network</span>
            </button>

            {onResetFocus && (
              <button
                type="button"
                onClick={onResetFocus}
                className="py-2 px-3 bg-white hover:bg-[#EAE1D5] text-[#2C241D] text-xs font-semibold rounded-xl border border-[#E5DACB] transition-all flex items-center justify-center gap-1 cursor-pointer"
                title="Full Case View"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Full Case</span>
              </button>
            )}
          </div>

          {onNavigateToTimeline && isPerson && (
            <button
              type="button"
              onClick={() => onNavigateToTimeline(profile.display_name)}
              className="w-full py-2 px-3 bg-[#FAF7F2] hover:bg-[#EAE1D5] text-[#8A5A36] text-xs font-semibold rounded-xl border border-[#D5C7B8] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Trace Timeline Activity</span>
            </button>
          )}
        </div>

        {/* Entity Dossier Photo for Suspects / Persons */}
        {isPerson && (
          <div className="p-4 bg-white rounded-2xl border border-[#E5DACB] shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-[#5A4D41] uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#9C6644]" />
                Dossier Identity Photo
              </span>
              {currentPhoto && (
                <span className="text-[10px] text-[#2D7A58] font-semibold bg-[#EAF5EF] px-1.5 py-0.5 rounded">
                  Active Photo
                </span>
              )}
            </h3>

            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-2xl bg-[#F5EFE6] border-2 border-[#D8CBB9] overflow-hidden flex items-center justify-center flex-shrink-0 shadow-inner group">
                {currentPhoto ? (
                  <img
                    src={currentPhoto}
                    alt={profile.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-[#A89F91]" />
                )}

                {/* Hover overlay for changing photo */}
                {onUpdatePhoto && (
                  <label
                    htmlFor="photo-upload-input"
                    className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[9px] font-semibold text-center p-1"
                  >
                    <Camera className="w-4 h-4 mb-0.5" />
                    <span>Upload</span>
                  </label>
                )}
              </div>

              <div className="flex-1 space-y-1.5 text-xs">
                <p className="text-[11px] text-[#7D7268] leading-tight">
                  Upload a photo to instantly display this suspect's avatar directly inside the Cytoscape graph nodes.
                </p>

                <div className="flex items-center gap-2 pt-1">
                  {onUpdatePhoto && (
                    <>
                      <input
                        type="file"
                        id="photo-upload-input"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <label
                        htmlFor="photo-upload-input"
                        className="px-2.5 py-1 bg-[#9C6644] hover:bg-[#7F4F24] text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>{currentPhoto ? 'Change Photo' : 'Upload Photo'}</span>
                      </label>

                      {currentPhoto && (
                        <button
                          type="button"
                          onClick={() => onUpdatePhoto(profile.id, '')}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Properties / Attributes */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[#5A4D41] uppercase tracking-wider">
            Entity Properties
          </h3>
          <div className="bg-white rounded-2xl border border-[#E5DACB] p-4 space-y-3 shadow-xs">
            {displayProperties.length > 0 ? (
              displayProperties.map((prop, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center text-xs border-b border-[#F5EFE6] pb-2.5 last:border-0 last:pb-0 gap-3"
                >
                  <span className="text-[#7D7268] font-medium whitespace-nowrap">
                    {prop.label}
                  </span>
                  <div className="text-right">
                    {prop.isSensitive ? (
                      <MaskedValue
                        nodeId={profile.id}
                        value={prop.value}
                        entityType={profile.label}
                        isSensitive={true}
                      />
                    ) : (
                      <span className="font-semibold text-[#2C241D] break-words">
                        {prop.value}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#7D7268] italic">No additional properties recorded.</p>
            )}
          </div>
        </div>

        {/* Connected Entities */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#5A4D41] uppercase tracking-wider flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-[#9C6644]" />
              Connected Entities ({profile.connected_entities.length})
            </h3>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {profile.connected_entities.map((conn) => (
              <div
                key={conn.id}
                onClick={() => onSelectEntity(conn.id)}
                className="p-3 bg-white hover:bg-[#FAF7F2] rounded-xl border border-[#E5DACB] transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 bg-[#F5EFE6] text-[#7D7268] rounded border border-[#E5DACB]">
                      {conn.label}
                    </span>
                    <span className="text-[10px] text-[#9C6644] font-semibold truncate">
                      {conn.relationship_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#2C241D] group-hover:text-[#9C6644] truncate">
                    {conn.display_name}
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#A89F91] group-hover:text-[#9C6644] transition-colors" />
              </div>
            ))}
          </div>
        </div>

        {/* Linked Cases */}
        {profile.linked_cases.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#5A4D41] uppercase tracking-wider flex items-center gap-1.5">
              <FolderGit2 className="w-3.5 h-3.5 text-[#9C6644]" />
              Associated Cases ({profile.linked_cases.length})
            </h3>
            <div className="space-y-2">
              {profile.linked_cases.map((cs) => (
                <div key={cs.id} className="p-3 bg-white rounded-xl border border-[#E5DACB] shadow-2xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-[#9C6644]">{cs.case_code}</span>
                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-[#FAF7F2] text-[#7D7268] border border-[#E5DACB] font-semibold">
                      {cs.status}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#2C241D]">{cs.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Source Evidence Records */}
        {profile.source_records.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#5A4D41] uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#9C6644]" />
              Evidentiary Records ({profile.source_records.length})
            </h3>
            <div className="space-y-2">
              {profile.source_records.map((rec, i) => (
                <div key={i} className="p-3 bg-white rounded-xl border border-[#E5DACB] text-xs shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#2C241D]">{rec.record_code}</span>
                    <span className="text-[10px] font-semibold text-[#7D7268] uppercase bg-[#F5EFE6] px-1.5 py-0.5 rounded">
                      {rec.source_type}
                    </span>
                  </div>
                  {rec.snippet && (
                    <p className="text-[11px] text-[#5A4D41] italic bg-[#FAF7F2] p-2 rounded-lg border border-[#EAE1D5]">
                      "{rec.snippet}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NodeProfileDrawer;
