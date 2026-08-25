import React, { useEffect, useRef, useState } from 'react';
import cytoscape, { Core, EventObject } from 'cytoscape';
import { ZoomIn, ZoomOut, Maximize2, Crosshair } from 'lucide-react';
import { GraphNodeData, GraphEdgeData } from '../../types';

interface GraphCanvasProps {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  layoutName: string;
  onSelectNode: (nodeId: string) => void;
  onSelectEdge: (edgeId: string) => void;
  onCanvasClick: () => void;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  selectedEdgeId,
  layoutName = 'cose',
  onSelectNode,
  onSelectEdge,
  onCanvasClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{ id: string; label: string; name: string; x: number; y: number } | null>(null);

  // Initialize Cytoscape Instance
  useEffect(() => {
    if (!containerRef.current) return;

    const styles: any[] = [
      {
        selector: 'node',
        style: {
          'background-color': '#5F01FB',
          label: 'data(name)',
          'font-family': 'Inter, sans-serif',
          'font-size': '10px',
          'font-weight': 600,
          color: '#FFFFFF',
          'text-valign': 'bottom',
          'text-margin-y': 6,
          'text-background-opacity': 0.8,
          'text-background-color': '#0B0D1B',
          'text-background-padding': '3px',
          'text-background-shape': 'roundrectangle',
          'text-border-opacity': 0.3,
          'text-border-color': '#FFFFFF',
          'text-border-width': '1px',
          width: 38,
          height: 38,
          'border-width': 2,
          'border-color': '#FFFFFF',
          'border-opacity': 0.7,
          'transition-property': 'background-color, line-color, target-arrow-color, opacity, border-width',
          'transition-duration': '0.2s',
        },
      },
      // Entity Specific Colors
      {
        selector: 'node[label = "Person"]',
        style: { 'background-color': '#5F01FB' },
      },
      {
        selector: 'node[label = "Phone"]',
        style: { 'background-color': '#8B5CF6' },
      },
      {
        selector: 'node[label = "Vehicle"]',
        style: { 'background-color': '#514A85' },
      },
      {
        selector: 'node[label = "Location"]',
        style: { 'background-color': '#38BDF8' },
      },
      {
        selector: 'node[label = "Organisation"]',
        style: { 'background-color': '#A78BFA' },
      },
      {
        selector: 'node[label = "BankAccount"]',
        style: { 'background-color': '#14B8A6' },
      },
      {
        selector: 'node[label = "Case"]',
        style: {
          'background-color': '#F59E0B',
          shape: 'round-rectangle',
          width: 48,
          height: 32,
        },
      },
      // Edge styling
      {
        selector: 'edge',
        style: {
          width: 2,
          'line-color': '#475569',
          'target-arrow-color': '#475569',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'arrow-scale': 1.1,
          opacity: 0.7,
          label: 'data(rel_type)',
          'font-size': '8px',
          'font-family': 'Inter, sans-serif',
          color: '#94A3B8',
          'text-rotation': 'autorotate',
          'text-background-opacity': 0.8,
          'text-background-color': '#0B0D1B',
          'text-background-padding': '2px',
          'text-background-shape': 'roundrectangle',
        },
      },
      // Selected Node Highlight
      {
        selector: 'node:selected',
        style: {
          'border-width': 4,
          'border-color': '#F59E0B',
        },
      },
      // Selected Edge Highlight
      {
        selector: 'edge:selected',
        style: {
          width: 3.5,
          'line-color': '#F59E0B',
          'target-arrow-color': '#F59E0B',
          opacity: 1.0,
          color: '#F59E0B',
        },
      },
      // Highlighting Connected Subgraph
      {
        selector: '.highlighted',
        style: {
          opacity: 1.0,
          'line-color': '#A855F7',
          'target-arrow-color': '#A855F7',
          width: 3,
        },
      },
      {
        selector: '.dimmed',
        style: {
          opacity: 0.15,
        },
      },
    ];

    const cy = cytoscape({
      container: containerRef.current,
      style: styles,
      layout: { name: 'preset' },
      minZoom: 0.2,
      maxZoom: 3.0,
      wheelSensitivity: 0.3,
    });

    // Event listeners
    cy.on('tap', 'node', (evt: EventObject) => {
      const node = evt.target;
      onSelectNode(node.id());
    });

    cy.on('tap', 'edge', (evt: EventObject) => {
      const edge = evt.target;
      onSelectEdge(edge.id());
    });

    cy.on('tap', (evt: EventObject) => {
      if (evt.target === cy) {
        onCanvasClick();
      }
    });

    // Tooltip on Hover
    cy.on('mouseover', 'node', (evt: EventObject) => {
      const node = evt.target;
      const pos = node.renderedPosition();
      setHoveredNode({
        id: node.id(),
        label: node.data('label') || 'Entity',
        name: node.data('name') || node.id(),
        x: pos.x,
        y: pos.y,
      });
    });

    cy.on('mouseout', 'node', () => {
      setHoveredNode(null);
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, []);

  // Update Elements when nodes or edges change
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.batch(() => {
      cy.elements().remove();

      // Add nodes
      const cyNodes = nodes.map((n) => ({
        group: 'nodes' as const,
        data: {
          id: n.id,
          label: n.label,
          name: n.properties?.name || n.properties?.display_name || n.properties?.case_code || n.id,
          ...n.properties,
        },
      }));

      // Add edges
      const cyEdges = edges.map((e) => ({
        group: 'edges' as const,
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          type: e.type,
          rel_type: e.type.replace(/_/g, ' '),
          ...e.properties,
        },
      }));

      cy.add([...cyNodes, ...cyEdges]);
    });

    // Apply layout
    const layout = cy.layout({
      name: layoutName === 'cose' ? 'cose' : layoutName,
      animate: true,
      animationDuration: 600,
      padding: 50,
      nodeRepulsion: () => 6000,
      idealEdgeLength: () => 100,
    } as any);

    layout.run();
  }, [nodes, edges, layoutName]);

  // Handle Node/Edge Selection & Highlighting
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.batch(() => {
      cy.elements().removeClass('highlighted dimmed');

      if (selectedNodeId) {
        const selNode = cy.getElementById(selectedNodeId);
        if (selNode.length > 0) {
          selNode.select();
          const connectedEdges = selNode.connectedEdges();
          const connectedNodes = connectedEdges.connectedNodes();

          cy.elements().addClass('dimmed');
          selNode.removeClass('dimmed').addClass('highlighted');
          connectedEdges.removeClass('dimmed').addClass('highlighted');
          connectedNodes.removeClass('dimmed');
        }
      } else if (selectedEdgeId) {
        const selEdge = cy.getElementById(selectedEdgeId);
        if (selEdge.length > 0) {
          selEdge.select();
          const endpoints = selEdge.connectedNodes();
          cy.elements().addClass('dimmed');
          selEdge.removeClass('dimmed').addClass('highlighted');
          endpoints.removeClass('dimmed');
        }
      }
    });
  }, [selectedNodeId, selectedEdgeId]);

  // Zoom Controls
  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit(undefined, 40);
  const handleCenter = () => {
    if (selectedNodeId) {
      const node = cyRef.current?.getElementById(selectedNodeId);
      if (node && node.length > 0) cyRef.current?.center(node);
    } else {
      cyRef.current?.center();
    }
  };

  return (
    <div className="relative w-full h-full bg-[#0B0D1B] overflow-hidden">
      {/* Cytoscape Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Canvas Control Toolbar */}
      <div className="absolute top-4 left-4 flex items-center space-x-1.5 p-1.5 rounded-xl bg-[#111322]/90 border border-slate-800 backdrop-blur-md shadow-xl z-10">
        <button
          onClick={handleZoomIn}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-800" />
        <button
          onClick={handleFit}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          title="Fit Network to Viewport"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleCenter}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          title="Center Focus"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* Hover Node Tooltip */}
      {hoveredNode && (
        <div
          style={{
            position: 'absolute',
            left: `${hoveredNode.x + 12}px`,
            top: `${hoveredNode.y - 30}px`,
          }}
          className="pointer-events-none z-20 px-2.5 py-1.5 rounded-lg bg-slate-900/95 border border-slate-700 text-white shadow-2xl backdrop-blur-md animate-fadeIn"
        >
          <div className="text-[10px] uppercase font-bold text-brand-purple-light tracking-wider">
            {hoveredNode.label}
          </div>
          <div className="text-xs font-semibold">{hoveredNode.name}</div>
        </div>
      )}
    </div>
  );
};

export default GraphCanvas;
