import {
  AuthResponse,
  DashboardSummary,
  SubgraphResponse,
  GraphNodeData,
  NodeProfile,
  EdgeEvidence,
  AuditLog,
  AuditChainVerification,
  User,
  ExtractedEntity,
  IngestionUploadResult,
  EntityMatchCandidate,
  TimelineData,
  AlertItem,
  ExecutiveCaseBrief,
} from '../types';

const getApiBase = () => {
  if (import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    return `http://${host}:8000/api`;
  }
  return 'http://localhost:8000/api';
};

const API_BASE = getApiBase();

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('cna_jwt_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('cna_jwt_token', token);
    } else {
      localStorage.removeItem('cna_jwt_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.setToken(null);
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
      throw new Error(error.detail || `HTTP Error ${response.status}`);
    }

    return response.json();
  }

  // --- Auth Endpoints ---
  async login(username: string, password: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // --- Dashboard Endpoints ---
  async getDashboardSummary(): Promise<DashboardSummary> {
    return this.request<DashboardSummary>('/dashboard/summary');
  }

  // --- Graph Endpoints ---
  async getSubgraph(
    caseId?: string,
    nodeType?: string,
    limit?: number
  ): Promise<SubgraphResponse> {
    const params = new URLSearchParams();
    if (caseId && caseId !== 'ALL') params.append('case_id', caseId);
    if (nodeType && nodeType !== 'ALL') params.append('node_type', nodeType);
    if (limit) params.append('limit', limit.toString());
    return this.request<SubgraphResponse>(`/graph/subgraph?${params.toString()}`);
  }

  async getNodes(type?: string, search?: string): Promise<GraphNodeData[]> {
    const params = new URLSearchParams();
    if (type && type !== 'ALL') params.append('type', type);
    if (search) params.append('search', search);
    return this.request<GraphNodeData[]>(`/graph/nodes?${params.toString()}`);
  }

  async getNodeProfile(nodeId: string): Promise<NodeProfile> {
    return this.request<NodeProfile>(`/graph/node/${nodeId}`);
  }

  async getEdgeEvidence(edgeId: string): Promise<EdgeEvidence> {
    return this.request<EdgeEvidence>(`/graph/edge/${edgeId}`);
  }

  async expandNode(nodeId: string, depth: number = 2): Promise<SubgraphResponse> {
    return this.request<SubgraphResponse>(`/graph/expand?node_id=${nodeId}&depth=${depth}`);
  }

  async revealSensitive(nodeId: string, reason: string = 'Investigative need'): Promise<{
    node_id: string;
    unmasked_value: string;
    audited: boolean;
  }> {
    return this.request(`/graph/reveal-sensitive/${nodeId}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async updateNodePhoto(nodeId: string, photoUrl: string): Promise<{ status: string; node_id: string; photo_url: string }> {
    return this.request(`/graph/node/${nodeId}/photo`, {
      method: 'POST',
      body: JSON.stringify({ photo_url: photoUrl }),
    });
  }

  // --- Audit Endpoints ---
  async getAuditLogs(
    limit: number = 50,
    offset: number = 0,
    action?: string
  ): Promise<AuditLog[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (action && action !== 'ALL') params.append('action', action);
    return this.request<AuditLog[]>(`/audit/logs?${params.toString()}`);
  }

  async verifyAuditChain(): Promise<AuditChainVerification> {
    return this.request<AuditChainVerification>('/audit/verify-chain');
  }

  // --- Demo Seeder ---
  async loadDemoData(): Promise<{ status: string; message: string }> {
    return this.request('/seed/load-demo-data', { method: 'POST' });
  }

  // --- Phase 2: Ingestion Endpoints ---
  async uploadDocument(
    file: File,
    sourceType: string = 'fir',
    caseId?: string,
    title?: string
  ): Promise<IngestionUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_type', sourceType);
    if (caseId) formData.append('case_id', caseId);
    if (title) formData.append('title', title);

    return this.request<IngestionUploadResult>('/ingestion/upload', {
      method: 'POST',
      body: formData,
    });
  }

  // --- Phase 2: Extraction Review Endpoints ---
  async listExtractedEntities(params?: {
    record_id?: string;
    status?: string;
    entity_type?: string;
    min_confidence?: number;
    limit?: number;
    offset?: number;
  }): Promise<ExtractedEntity[]> {
    const q = new URLSearchParams();
    if (params?.record_id) q.append('record_id', params.record_id);
    if (params?.status && params.status !== 'ALL') q.append('status', params.status);
    if (params?.entity_type && params.entity_type !== 'ALL') q.append('entity_type', params.entity_type);
    if (params?.min_confidence) q.append('min_confidence', params.min_confidence.toString());
    if (params?.limit) q.append('limit', params.limit.toString());
    if (params?.offset) q.append('offset', params.offset.toString());
    return this.request<ExtractedEntity[]>(`/entities/extracted?${q.toString()}`);
  }

  async approveEntity(id: string): Promise<any> {
    return this.request(`/entities/${id}/approve`, { method: 'POST' });
  }

  async correctEntity(id: string, normalizedValue: string, entityType: string, reason?: string): Promise<any> {
    return this.request(`/entities/${id}/correct`, {
      method: 'POST',
      body: JSON.stringify({
        normalized_value: normalizedValue,
        entity_type: entityType,
        reason: reason || 'Investigator manual correction',
      }),
    });
  }

  async rejectEntity(id: string): Promise<any> {
    return this.request(`/entities/${id}/reject`, { method: 'POST' });
  }

  async batchApproveEntities(extractionIds: string[]): Promise<any[]> {
    return this.request('/entities/batch-approve', {
      method: 'POST',
      body: JSON.stringify({ extraction_ids: extractionIds }),
    });
  }

  // --- Phase 2: Entity Resolution Endpoints ---
  async listMatchCandidates(status?: string): Promise<EntityMatchCandidate[]> {
    const q = new URLSearchParams();
    if (status && status !== 'ALL') q.append('status', status);
    return this.request<EntityMatchCandidate[]>(`/resolution/candidates?${q.toString()}`);
  }

  async generateMatchCandidates(): Promise<{ generated_count: number; message: string }> {
    return this.request('/resolution/generate', { method: 'POST' });
  }

  async approveMerge(candidateId: string): Promise<any> {
    return this.request(`/resolution/${candidateId}/approve`, { method: 'POST' });
  }

  async rejectMatchCandidate(candidateId: string, reason?: string): Promise<any> {
    return this.request(`/resolution/${candidateId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || 'Rejected merge proposal' }),
    });
  }

  // --- Phase 2: Timeline Endpoints ---
  async getTimeline(params?: {
    entity_id?: string;
    case_id?: string;
    from_date?: string;
    to_date?: string;
    event_type?: string;
  }): Promise<TimelineData> {
    const q = new URLSearchParams();
    if (params?.entity_id) q.append('entity_id', params.entity_id);
    if (params?.case_id) q.append('case_id', params.case_id);
    if (params?.from_date) q.append('from_date', params.from_date);
    if (params?.to_date) q.append('to_date', params.to_date);
    if (params?.event_type && params.event_type !== 'ALL') q.append('event_type', params.event_type);
    return this.request<TimelineData>(`/timeline?${q.toString()}`);
  }

  // --- Phase 3: Pattern Alerts Endpoints ---
  async getAlerts(params?: {
    severity?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<AlertItem[]> {
    const q = new URLSearchParams();
    if (params?.severity && params.severity !== 'ALL') q.append('severity', params.severity);
    if (params?.status && params.status !== 'ALL') q.append('status', params.status);
    if (params?.limit) q.append('limit', params.limit.toString());
    if (params?.offset) q.append('offset', params.offset.toString());
    return this.request<AlertItem[]>(`/alerts?${q.toString()}`);
  }

  async scanAlerts(): Promise<{ new_alerts_count: number; total_active_alerts: number; message: string }> {
    return this.request('/alerts/scan', { method: 'POST' });
  }

  async acknowledgeAlert(id: string, notes?: string): Promise<AlertItem> {
    return this.request<AlertItem>(`/alerts/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ notes: notes || 'Acknowledged by investigator' }),
    });
  }

  async dismissAlert(id: string, reason: string): Promise<AlertItem> {
    return this.request<AlertItem>(`/alerts/${id}/dismiss`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // --- Phase 3: Executive Brief Endpoints ---
  async getCaseBrief(caseId: string, notes?: string): Promise<ExecutiveCaseBrief> {
    const q = new URLSearchParams();
    if (notes) q.append('notes', notes);
    return this.request<ExecutiveCaseBrief>(`/reports/brief/${caseId}?${q.toString()}`);
  }

  getCaseBriefPdfUrl(caseId: string): string {
    return `${API_BASE}/reports/brief/${caseId}/pdf`;
  }

  async downloadCaseBriefPdf(caseId: string, filename?: string): Promise<void> {
    const res = await fetch(`${API_BASE}/reports/brief/${caseId}/pdf`, {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
    });
    if (!res.ok) throw new Error('PDF download failed');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `Executive_Brief_${caseId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

export const api = new ApiClient();
export default api;
