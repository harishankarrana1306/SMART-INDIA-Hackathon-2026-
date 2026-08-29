import React, { useEffect, useState, useMemo } from 'react';
import { Shield } from 'lucide-react';
import { api } from '../api/client';
import { GraphNodeData, GraphEdgeData, NodeProfile, EdgeEvidence } from '../types';
import GraphCanvas from '../components/graph/GraphCanvas';
import GraphFilterPanel from '../components/graph/GraphFilterPanel';
import NodeProfileDrawer from '../components/graph/NodeProfileDrawer';
import EdgeEvidencePanel from '../components/graph/EdgeEvidencePanel';
import GraphLegend from '../components/graph/GraphLegend';
import DisclaimerBanner from '../components/common/DisclaimerBanner';
import LoadingState from '../components/common/LoadingState';

interface GraphPageProps {
  initialCaseCode?: string;
  initialNodeId?: string;
  initialHighRiskMode?: boolean;
  onNavigateToTimeline?: (entityName?: string, caseCode?: string) => void;
}

const HIGH_RISK_ENTITY_IDS = new Set([
  'person_01', // Priya Verma
  'person_02', // Rohit Sharma
  'person_03', // Amit Patel
  'person_06', // Deepa Nair
  'person_07', // Karan Johar
  'person_08', // Rajesh Gupta
  'person_10', // Tarun Joshi
  'person_12', // R Sharma
  'person_14', // Suresh Oberoi
  'phone_01',  // +9190XXXXXX01
  'phone_02',  // +9190XXXXXX02
  'phone_04',  // +9190XXXXXX04
  'acc_01',    // XXXX-XXXX-1122
  'acc_03',    // XXXX-XXXX-8899
]);

const getPersistedPhotos = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem('netra_persisted_node_photos');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const savePersistedPhoto = (nodeId: string, photoUrl: string) => {
  try {
    const map = getPersistedPhotos();
    if (photoUrl) {
      map[nodeId] = photoUrl;
    } else {
      delete map[nodeId];
    }
    localStorage.setItem('netra_persisted_node_photos', JSON.stringify(map));
  } catch (e) {
    console.error('Failed to persist photo in localStorage:', e);
  }
};

export const GraphPage: React.FC<GraphPageProps> = ({
  initialCaseCode,
  initialNodeId,
  initialHighRiskMode = false,
  onNavigateToTimeline,
}) => {
  const [allNodes, setAllNodes] = useState<GraphNodeData[]>([]);
  const [allEdges, setAllEdges] = useState<GraphEdgeData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters state
  const [selectedCase, setSelectedCase] = useState<string>(
    initialHighRiskMode ? 'ALL' : initialCaseCode || 'FIC-CASE-0001'
  );
  const [isHighRiskFocus, setIsHighRiskFocus] = useState<boolean>(initialHighRiskMode || false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedRelType, setSelectedRelType] = useState<string>('ALL');
  const [selectedLayout, setSelectedLayout] = useState<string>('cose');
  const [viewMode, setViewMode] = useState<'focused' | 'all'>('focused');

  // Drawer / Selection State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialNodeId || null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [nodeProfile, setNodeProfile] = useState<NodeProfile | null>(null);
  const [edgeEvidence, setEdgeEvidence] = useState<EdgeEvidence | null>(null);
  const [isDrawerLoading, setIsDrawerLoading] = useState<boolean>(false);

  // Update selected case if prop changes
  useEffect(() => {
    if (initialCaseCode) {
      setSelectedCase(initialCaseCode);
    }
  }, [initialCaseCode]);

  // Update high risk mode if prop changes
  useEffect(() => {
    if (initialHighRiskMode) {
      setSelectedCase('ALL');
      setIsHighRiskFocus(true);
    }
  }, [initialHighRiskMode]);

  // Update selected node if prop changes
  useEffect(() => {
    if (initialNodeId) {
      handleSelectNode(initialNodeId);
    }
  }, [initialNodeId]);

  // Fetch graph dataset based on selected case scope
  const fetchGraphData = async (caseCode?: string) => {
    setIsLoading(true);
    try {
      const targetCase = caseCode && caseCode !== 'ALL' ? caseCode : undefined;
      const res = await api.getSubgraph(targetCase, undefined, 300);
      const localPhotos = getPersistedPhotos();
      const enrichedNodes = res.nodes.map((n) => {
        const photo = localPhotos[n.id] || n.properties?.photo_url;
        return photo ? { ...n, properties: { ...n.properties, photo_url: photo } } : n;
      });
      setAllNodes(enrichedNodes);
      setAllEdges(res.edges);
    } catch (e) {
      console.error('Failed to load graph data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphData(selectedCase);
  }, [selectedCase]);

  // Listen to supervisory reset & entity resolution merges
  useEffect(() => {
    const handleReload = () => {
      setSelectedCase('FIC-CASE-0001');
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setIsHighRiskFocus(false);
      fetchGraphData('FIC-CASE-0001');
    };
    const handleInvalidate = () => {
      fetchGraphData(selectedCase);
    };
    window.addEventListener('netra-data-reloaded', handleReload);
    window.addEventListener('netra-graph-invalidated', handleInvalidate);
    return () => {
      window.removeEventListener('netra-data-reloaded', handleReload);
      window.removeEventListener('netra-graph-invalidated', handleInvalidate);
    };
  }, [selectedCase]);

  // Filter nodes & edges based on search, type, and relationships
  const filteredData = useMemo(() => {
    let nodesResult = allNodes;
    let edgesResult = allEdges;

    if (selectedType !== 'ALL') {
      nodesResult = nodesResult.filter((n) => n.label === selectedType);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      nodesResult = nodesResult.filter((n) => {
        const name = (n.properties?.display_name || n.properties?.name || '').toLowerCase();
        const code = (n.properties?.case_code || '').toLowerCase();
        const raw = JSON.stringify(n.properties || {}).toLowerCase();
        return name.includes(q) || code.includes(q) || raw.includes(q);
      });
    }

    const validNodeIds = new Set(nodesResult.map((n) => n.id));

    if (selectedRelType !== 'ALL') {
      edgesResult = edgesResult.filter((e) => e.type === selectedRelType);
    }

    edgesResult = edgesResult.filter(
      (e) => validNodeIds.has(e.source) && validNodeIds.has(e.target)
    );

    return { nodes: nodesResult, edges: edgesResult };
  }, [allNodes, allEdges, selectedType, selectedRelType, searchTerm]);

  // Node Selection & Profile Loading
  const handleSelectNode = async (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    setEdgeEvidence(null);
    setIsDrawerLoading(true);

    try {
      const profile = await api.getNodeProfile(nodeId);
      const localPhotos = getPersistedPhotos();
      if (localPhotos[nodeId]) {
        profile.properties.photo_url = localPhotos[nodeId];
      }
      setNodeProfile(profile);
    } catch (e) {
      console.error('Failed to load node profile:', e);
      const localNode = allNodes.find((n) => n.id === nodeId);
      if (localNode) {
        setNodeProfile({
          id: localNode.id,
          label: localNode.label,
          display_name:
            localNode.properties?.display_name || localNode.properties?.name || localNode.id,
          properties: localNode.properties || {},
          connected_entities: [],
          linked_cases: [],
          source_records: [],
          disclaimer: 'NETRA AI Criminal Network Analysis',
        });
      }
    } finally {
      setIsDrawerLoading(false);
    }
  };

  // Edge Selection & Evidence Loading
  const handleSelectEdge = async (edgeId: string) => {
    setSelectedEdgeId(edgeId);
    setSelectedNodeId(null);
    setNodeProfile(null);
    try {
      const evidence = await api.getEdgeEvidence(edgeId);
      setEdgeEvidence(evidence);
    } catch (e) {
      console.error('Failed to load edge evidence:', e);
    }
  };

  const handleCloseDrawer = () => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setNodeProfile(null);
    setEdgeEvidence(null);
  };

  const handleResetFocus = () => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setNodeProfile(null);
    setEdgeEvidence(null);
    setViewMode('focused');
  };

  const handleExpandNode = async (nodeId: string, depth: number = 2) => {
    setIsLoading(true);
    try {
      const res = await api.expandNode(nodeId, depth);
      setAllNodes((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const newNodes = res.nodes.filter((n) => !existingIds.has(n.id));
        return [...prev, ...newNodes];
      });
      setAllEdges((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const newEdges = res.edges.filter((e) => !existingIds.has(e.id));
        return [...prev, ...newEdges];
      });
    } catch (e) {
      console.error('Failed to expand node:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateNodePhoto = async (nodeId: string, photoUrl: string) => {
    savePersistedPhoto(nodeId, photoUrl);
    setAllNodes((prev) =>
      prev.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            properties: { ...n.properties, photo_url: photoUrl },
          };
        }
        return n;
      })
    );
    if (nodeProfile && nodeProfile.id === nodeId) {
      setNodeProfile({
        ...nodeProfile,
        properties: { ...nodeProfile.properties, photo_url: photoUrl },
      });
    }
    try {
      await api.updateNodePhoto(nodeId, photoUrl);
    } catch (e) {
      console.warn('Backend photo update error (saved locally):', e);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedType('ALL');
    setSelectedRelType('ALL');
    setSelectedLayout('cose');
    setViewMode('focused');
    setIsHighRiskFocus(false);
    handleCloseDrawer();
  };

  if (isLoading && allNodes.length === 0) {
    return <LoadingState message="Loading interactive Cytoscape network graph..." />;
  }

  return (
    <div className="flex h-full w-full overflow-hidden relative text-[#2C241D]">
      {/* Left Filter Panel */}
      <GraphFilterPanel
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCase={selectedCase}
        onCaseChange={(val) => {
          setSelectedCase(val);
        }}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedRelType={selectedRelType}
        onRelTypeChange={setSelectedRelType}
        selectedLayout={selectedLayout}
        onLayoutChange={setSelectedLayout}
        onReset={handleResetFilters}
        nodeCount={filteredData.nodes.length}
        edgeCount={filteredData.edges.length}
        isHighRiskFocus={isHighRiskFocus}
        onToggleHighRiskFocus={() => {
          if (!isHighRiskFocus) {
            setSelectedCase('ALL');
            setIsHighRiskFocus(true);
          } else {
            setIsHighRiskFocus(false);
          }
        }}
      />

      {/* Main Cytoscape Canvas Area */}
      <div className="flex-1 h-full overflow-hidden flex flex-col bg-[#FBF8F3]">
        {/* Dedicated Top Scope & Active Case Header Strip */}
        <div className="px-4 py-2.5 bg-[#FFFDFB] border-b border-[#E2D7C8] flex items-center justify-between shadow-xs z-10 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse flex-shrink-0" />
            <span className="text-xs font-black text-[#8A5A36] uppercase tracking-wide font-mono px-2 py-0.5 bg-[#F5EFE6] rounded-md border border-[#E0D5C5] flex-shrink-0">
              {selectedCase === 'ALL' ? 'GLOBAL NETWORK' : selectedCase}
            </span>
            <span className="text-[#D8CBB9] text-xs">|</span>
            <span className="text-xs font-bold text-[#20150F] truncate">
              {selectedCase === 'FIC-CASE-0001' && 'Operation Maya Orchid (Cyber Remittance)'}
              {selectedCase === 'FIC-CASE-0002' && 'Lotus Transit Syndicate (Transport & Hawala)'}
              {selectedCase === 'FIC-CASE-0003' && 'Project Falcon Shield (Identity Forgery)'}
              {selectedCase === 'FIC-CASE-0004' && 'Operation Silver Stream (ATM Mule Circuit)'}
              {selectedCase === 'FIC-CASE-0005' && 'Case Blue Horizon (Cellular SIM Relay)'}
              {selectedCase === 'FIC-CASE-0006' && 'Operation Asteroid (Phishing Infrastructure)'}
              {selectedCase === 'ALL' && 'All 6 Interconnected Syndicates & Case Bridges'}
            </span>
            <span className="text-[10px] bg-[#F5EFE6] text-[#7D7065] px-2 py-0.5 rounded-md font-mono font-bold border border-[#E0D5C5] flex-shrink-0">
              {filteredData.nodes.length} nodes · {filteredData.edges.length} edges
            </span>
          </div>

          {/* High-Risk Focus Active Badge */}
          {isHighRiskFocus && (
            <div className="flex items-center gap-2 bg-[#7F1D1D] text-white px-3 py-1 rounded-lg border border-[#EF4444]/60 text-xs shadow-sm flex-shrink-0">
              <Shield className="w-3.5 h-3.5 text-[#FCA5A5]" />
              <span className="font-bold text-[11px]">14 High Risk Entities Focused</span>
              <button
                type="button"
                onClick={() => setIsHighRiskFocus(false)}
                className="ml-1.5 text-[10px] font-black uppercase bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded text-white cursor-pointer transition-all"
              >
                Clear Focus
              </button>
            </div>
          )}
        </div>

        {/* Unobstructed Cytoscape Canvas Container */}
        <div className="flex-1 relative h-full overflow-hidden bg-[#FBF8F3]">
          <GraphCanvas
            nodes={filteredData.nodes}
            edges={filteredData.edges}
            selectedNodeId={selectedNodeId}
            selectedEdgeId={selectedEdgeId}
            layoutName={selectedLayout}
            viewMode={viewMode}
            isHighRiskFocus={isHighRiskFocus}
            highRiskNodeIds={HIGH_RISK_ENTITY_IDS}
            onSelectNode={handleSelectNode}
            onSelectEdge={handleSelectEdge}
            onCanvasClick={handleCloseDrawer}
            onViewModeChange={setViewMode}
            onResetFocus={handleResetFocus}
          />

          {/* Floating Legend */}
          <div className="absolute top-4 right-4 z-10">
            <GraphLegend />
          </div>

          {/* Bottom Permanent Disclaimer */}
          <div className="absolute bottom-3 left-4 right-4 z-10 pointer-events-none">
            <div className="pointer-events-auto">
              <DisclaimerBanner variant="light" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Drawer: Node Profile */}
      {selectedNodeId && (
        <NodeProfileDrawer
          profile={nodeProfile}
          onClose={handleCloseDrawer}
          onExpand={handleExpandNode}
          onSelectEntity={handleSelectNode}
          onNavigateToTimeline={onNavigateToTimeline}
          onResetFocus={handleResetFocus}
          onUpdatePhoto={handleUpdateNodePhoto}
          isLoading={isDrawerLoading}
        />
      )}

      {/* Right Drawer: Edge Evidence */}
      {selectedEdgeId && (
        <EdgeEvidencePanel
          evidence={edgeEvidence}
          onClose={handleCloseDrawer}
          onSelectNode={handleSelectNode}
        />
      )}
    </div>
  );
};

export default GraphPage;
