import React, { useEffect, useState, useMemo } from 'react';
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
}

export const GraphPage: React.FC<GraphPageProps> = ({ initialCaseCode }) => {
  const [allNodes, setAllNodes] = useState<GraphNodeData[]>([]);
  const [allEdges, setAllEdges] = useState<GraphEdgeData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState<string>(initialCaseCode || '');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedRelType, setSelectedRelType] = useState<string>('ALL');
  const [selectedLayout, setSelectedLayout] = useState<string>('cose');

  // Drawer / Selection State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [nodeProfile, setNodeProfile] = useState<NodeProfile | null>(null);
  const [edgeEvidence, setEdgeEvidence] = useState<EdgeEvidence | null>(null);
  const [isDrawerLoading, setIsDrawerLoading] = useState<boolean>(false);

  // Fetch initial graph dataset
  const fetchGraphData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getSubgraph(undefined, undefined, 200);
      setAllNodes(res.nodes);
      setAllEdges(res.edges);
    } catch (e) {
      console.error('Failed to load initial graph:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphData();
  }, []);

  // Filtered nodes & edges
  const filteredData = useMemo(() => {
    let nodes = [...allNodes];
    let edges = [...allEdges];

    // Entity Type filter
    if (selectedType !== 'ALL') {
      nodes = nodes.filter((n) => n.label.toLowerCase() === selectedType.toLowerCase());
    }

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      nodes = nodes.filter((n) => {
        const name = (n.properties?.name || n.properties?.display_name || n.properties?.case_code || n.id).toLowerCase();
        return name.includes(q) || n.id.toLowerCase().includes(q);
      });
    }

    // Retain only edges whose endpoints exist in the filtered node set
    const nodeIds = new Set(nodes.map((n) => n.id));
    edges = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

    // Relationship Type filter
    if (selectedRelType !== 'ALL') {
      edges = edges.filter((e) => e.type === selectedRelType);
    }

    return { nodes, edges };
  }, [allNodes, allEdges, selectedType, selectedRelType, searchTerm]);

  // Handle Node Click
  const handleSelectNode = async (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    setEdgeEvidence(null);
    setIsDrawerLoading(true);
    try {
      const profile = await api.getNodeProfile(nodeId);
      setNodeProfile(profile);
    } catch (e) {
      console.error('Failed to fetch node profile:', e);
    } finally {
      setIsDrawerLoading(false);
    }
  };

  // Handle Edge Click
  const handleSelectEdge = async (edgeId: string) => {
    setSelectedEdgeId(edgeId);
    setSelectedNodeId(null);
    setNodeProfile(null);
    setIsDrawerLoading(true);
    try {
      const evidence = await api.getEdgeEvidence(edgeId);
      setEdgeEvidence(evidence);
    } catch (e) {
      console.error('Failed to fetch edge evidence:', e);
    } finally {
      setIsDrawerLoading(false);
    }
  };

  // Handle Node Expansion (Multi-Hop)
  const handleExpandNode = async (nodeId: string, depth = 2) => {
    try {
      const expansion = await api.expandNode(nodeId, depth);
      setAllNodes((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const newNodes = expansion.nodes.filter((n) => !existingIds.has(n.id));
        return [...prev, ...newNodes];
      });
      setAllEdges((prev) => {
        const existingEdgeIds = new Set(prev.map((e) => e.id));
        const newEdges = expansion.edges.filter((e) => !existingEdgeIds.has(e.id));
        return [...prev, ...newEdges];
      });
    } catch (e) {
      console.error('Failed to expand node:', e);
    }
  };

  const handleCloseDrawer = () => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setNodeProfile(null);
    setEdgeEvidence(null);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedType('ALL');
    setSelectedRelType('ALL');
    setSelectedLayout('cose');
    handleCloseDrawer();
  };

  if (isLoading) {
    return <LoadingState message="Loading interactive Cytoscape network graph..." />;
  }

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      {/* Left Filter Panel */}
      <GraphFilterPanel
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedRelType={selectedRelType}
        onRelTypeChange={setSelectedRelType}
        selectedLayout={selectedLayout}
        onLayoutChange={setSelectedLayout}
        onReset={handleResetFilters}
        nodeCount={filteredData.nodes.length}
        edgeCount={filteredData.edges.length}
      />

      {/* Main Cytoscape Canvas Area */}
      <div className="flex-1 relative h-full overflow-hidden flex flex-col">
        <GraphCanvas
          nodes={filteredData.nodes}
          edges={filteredData.edges}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          layoutName={selectedLayout}
          onSelectNode={handleSelectNode}
          onSelectEdge={handleSelectEdge}
          onCanvasClick={handleCloseDrawer}
        />

        {/* Floating Legend */}
        <div className="absolute top-4 right-4 z-10">
          <GraphLegend />
        </div>

        {/* Bottom Permanent Disclaimer */}
        <div className="absolute bottom-3 left-4 right-4 z-10 pointer-events-none">
          <div className="pointer-events-auto">
            <DisclaimerBanner variant="dark" />
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
