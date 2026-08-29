export type Role = 'investigator' | 'supervisor';

export interface User {
  id: string;
  username: string;
  full_name: string;
  role: Role;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export interface DashboardTotals {
  total_cases: number;
  total_entities: number;
  total_records: number;
  total_alerts: number;
  total_relationships?: number;
  total_high_risk_entities?: number;
  total_audit_events: number;
  entity_breakdown?: Record<string, number>;
}

export interface CaseSummary {
  id: string;
  case_code: string;
  title: string;
  case_type?: string;
  status: string;
  opened_on?: string;
  records_count: number;
  entities_count: number;
}

export interface ActivityItem {
  id: number;
  action: string;
  user: string;
  target_type?: string;
  target_id?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface DashboardAlertItem {
  id: string;
  rule_name: string;
  title: string;
  severity: string;
  description: string;
  created_at: string;
}

export interface DashboardRecordItem {
  id: string;
  record_code: string;
  source_type: string;
  file_name?: string;
  ingested_at: string;
}

export interface DashboardSummary {
  totals: DashboardTotals;
  recent_cases: CaseSummary[];
  recent_alerts?: DashboardAlertItem[];
  recent_records?: DashboardRecordItem[];
  recent_activity?: ActivityItem[];
  entity_breakdown?: Record<string, number>;
  disclaimer: string;
}

export type EntityType =
  | 'Person'
  | 'Phone'
  | 'Vehicle'
  | 'Location'
  | 'Organisation'
  | 'BankAccount'
  | 'Case'
  | 'Date';

export type RelationshipType =
  | 'INVOLVED_IN'
  | 'LINKED_THROUGH_REPORT'
  | 'CALLED'
  | 'TRANSFERRED_MONEY_TO'
  | 'OWNS_OR_USES'
  | 'REGISTERED_AT'
  | 'PRESENT_AT'
  | 'ASSOCIATED_WITH'
  | 'OWNS_PHONE';

export interface GraphNodeData {
  id: string;
  label: string;
  properties: {
    name?: string;
    display_name?: string;
    case_code?: string;
    number_masked?: string;
    account_masked?: string;
    is_synthetic?: boolean;
    is_masked_sensitive?: boolean;
    dob?: string;
    vehicle_type?: string;
    bank_name?: string;
    lat?: number;
    lng?: number;
    [key: string]: any;
  };
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  type: string;
  properties: {
    source_record_id?: string;
    source_record_type?: string;
    explanation?: string;
    confidence?: number;
    date?: string;
    raw_source_snippet?: string;
    [key: string]: any;
  };
}

export interface SubgraphResponse {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  disclaimer: string;
}

export interface NodeProfile {
  id: string;
  label: string;
  display_name: string;
  properties: Record<string, any>;
  connected_entities: Array<{
    id: string;
    label: string;
    display_name: string;
    relationship_type: string;
  }>;
  linked_cases: Array<{
    id: string;
    case_code: string;
    title: string;
    status: string;
  }>;
  source_records: Array<{
    record_code: string;
    source_type: string;
    snippet?: string;
  }>;
  disclaimer: string;
}

export interface EdgeEvidence {
  edge_id: string;
  relationship_type: string;
  source_id: string;
  source_name: string;
  source_label: string;
  target_id: string;
  target_name: string;
  target_label: string;
  source_record_code: string;
  source_record_type: string;
  explanation: string;
  confidence: number;
  date?: string;
  raw_source_snippet?: string;
  disclaimer: string;
}

export interface AuditLog {
  id: number;
  seq_no: number;
  user_id?: string;
  username?: string;
  action: string;
  target_type?: string;
  target_id?: string;
  metadata_json?: Record<string, any>;
  timestamp: string;
  prev_hash: string;
  record_hash: string;
}

export interface AuditChainVerification {
  valid: boolean;
  total_records: number;
  first_broken_seq?: number;
  verified_at: string;
  message: string;
}

// --- Phase 2 Types ---

export interface ExtractedEntity {
  id: string;
  record_id: string;
  record_code?: string;
  case_id?: string;
  entity_type: EntityType;
  raw_value: string;
  normalized_value: string;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected';
  char_start?: number;
  char_end?: number;
  context_snippet?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface IngestionUploadResult {
  job_id: string;
  record_id: string;
  record_code: string;
  source_type: string;
  title: string;
  filename: string;
  entities_extracted_count: number;
  status: string;
  message: string;
  disclaimer: string;
}

export interface EntityMatchCandidate {
  id: string;
  entity_a_id: string;
  entity_b_id: string;
  entity_a: {
    id: string;
    neo4j_id: string;
    display_name: string;
    entity_type: string;
    properties: Record<string, any>;
    is_masked_sensitive: boolean;
  };
  entity_b: {
    id: string;
    neo4j_id: string;
    display_name: string;
    entity_type: string;
    properties: Record<string, any>;
    is_masked_sensitive: boolean;
  };
  name_variations?: string[];
  cases?: string[];
  associated_phones?: string[];
  associated_vehicles?: string[];
  associated_locations?: string[];
  other_identifiers?: string[];
  supporting_evidence?: string[];
  match_confidence: number;
  match_reason: string;
  status: 'pending' | 'merged' | 'rejected';
  created_at: string;
  reviewed_at?: string;
}

export interface TimelineEvent {
  event_id: string;
  event_type:
    | 'call'
    | 'phone_communication'
    | 'financial_transfer'
    | 'financial_transaction'
    | 'surveillance_sighting'
    | 'surveillance_observation'
    | 'fir_filed'
    | 'document_fir'
    | 'vehicle_movement'
    | 'meeting_colocation'
    | 'social_media_event'
    | 'bank_activity'
    | string;
  timestamp: string;
  title: string;
  description: string;
  source_record_code: string;
  source_record_type: string;
  confidence: number;
  actors: Array<Record<string, any>>;
  location?: string;
  properties: Record<string, any>;
}

export interface TimelineData {
  events: TimelineEvent[];
  total_events: number;
  from_date?: string;
  to_date?: string;
  entity_filter?: string;
  disclaimer: string;
}

// --- Phase 3 Types ---

export interface AlertItem {
  id: string;
  rule_name: string;
  title: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  threshold_description?: string;
  entity_id?: string;
  entity_name?: string;
  entity_type?: string;
  risk_indicator?: string;
  connections_count?: number;
  related_entities?: Array<{ id: string; name: string; type: string; role?: string }>;
  cases?: string[];
  supporting_entity_ids: Array<{ id: string; name: string; type: string }>;
  supporting_record_ids: string[];
  status: 'unreviewed' | 'acknowledged' | 'dismissed' | 'investigating';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  disclaimer: string;
}

export interface BriefEntityHighlight {
  id: string;
  name: string;
  type: string;
  role_or_label: string;
  masked_identifier?: string;
}

export interface BriefRelationshipHighlight {
  source_name: string;
  target_name: string;
  relationship_type: string;
  source_record_code: string;
  confidence: number;
  explanation: string;
}

export interface BriefTimelineMilestone {
  timestamp: string;
  event_type: string;
  title: string;
  source_record_code: string;
}

export interface ExecutiveCaseBrief {
  brief_id: string;
  case_id: string;
  case_code: string;
  case_title: string;
  case_status: string;
  summary_narrative: string;
  key_entities: BriefEntityHighlight[];
  key_relationships: BriefRelationshipHighlight[];
  timeline_highlights: BriefTimelineMilestone[];
  active_alerts: string[];
  custody_hash: string;
  generated_by: string;
  generated_at: string;
  is_synthetic: boolean;
  disclaimer: string;
}
