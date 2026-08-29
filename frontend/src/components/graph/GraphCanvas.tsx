import React, { useEffect, useRef, useState } from 'react';
import cytoscape, { Core, EventObject } from 'cytoscape';
import { ZoomIn, ZoomOut, Maximize2, Crosshair, Eye, Layers } from 'lucide-react';
import { GraphNodeData, GraphEdgeData } from '../../types';

interface GraphCanvasProps {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  layoutName: string;
  viewMode?: 'focused' | 'all';
  isHighRiskFocus?: boolean;
  highRiskNodeIds?: Set<string>;
  onSelectNode: (nodeId: string) => void;
  onSelectEdge: (edgeId: string) => void;
  onCanvasClick: () => void;
  onViewModeChange?: (mode: 'focused' | 'all') => void;
  onResetFocus?: () => void;
}

// Exact 1-to-1 Lucide icons matching Entity Types Legend, centered at 25% scale inside a 96x96 canvas
const MINIMAL_SVG_ICONS = {
  Person: `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(36, 36)"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></g></svg>`
  )}`,
  Phone: `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(36, 36)"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></g></svg>`
  )}`,
  Vehicle: `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(36, 36)"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></g></svg>`
  )}`,
  Location: `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(36, 36)"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></g></svg>`
  )}`,
  Organisation: `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(36, 36)"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></g></svg>`
  )}`,
  BankAccount: `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(36, 36)"><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></g></svg>`
  )}`,
  Case: `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(36, 36)"><path d="M9 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v2"/><circle cx="13" cy="12" r="2"/><path d="m18 19-3-3"/><circle cx="20" cy="20" r="2"/></g></svg>`
  )}`,
};

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  selectedEdgeId,
  layoutName = 'cose',
  viewMode = 'focused',
  isHighRiskFocus = false,
  highRiskNodeIds,
  onSelectNode,
  onSelectEdge,
  onCanvasClick,
  onViewModeChange,
  onResetFocus,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{ id: string; label: string; name: string; x: number; y: number } | null>(null);

  // Initialize Cytoscape Instance
  useEffect(() => {
    if (!containerRef.current) return;

    const styles: any[] = [
      // Base Node Style: Colored circular node with tiny centered glyph icon
      {
        selector: 'node',
        style: {
          'background-color': '#4F46E5',
          label: 'data(name)',
          'font-family': 'Inter, system-ui, sans-serif',
          'font-size': 'data(font_size)',
          'font-weight': 700,
          color: '#2C241D',
          'text-valign': 'bottom',
          'text-margin-y': 6,
          'text-background-opacity': 0.95,
          'text-background-color': '#FFFFFF',
          'text-background-padding': '3px 7px',
          'text-background-shape': 'roundrectangle',
          'text-border-opacity': 0.9,
          'text-border-color': '#E5DACB',
          'text-border-width': '1.5px',
          width: 'data(node_size)',
          height: 'data(node_size)',
          'border-width': 2.5,
          'border-color': '#FFFFFF',
          'border-opacity': 0.95,
          'background-fit': 'contain',
          'background-clip': 'none',
          'background-repeat': 'no-repeat',
          'background-position-x': '50%',
          'background-position-y': '50%',
          'background-image-opacity': 1.0,
          'transition-property': 'background-color, line-color, target-arrow-color, opacity, border-width, width, height',
          'transition-duration': '0.2s',
        },
      },
      // Entity Specific Palette & Minimal Vector Icons
      {
        selector: 'node[label = "Person"]',
        style: {
          'background-color': '#4F46E5',
          'background-image': MINIMAL_SVG_ICONS.Person,
        },
      },
      {
        selector: 'node[label = "Phone"]',
        style: {
          'background-color': '#7C3AED',
          'background-image': MINIMAL_SVG_ICONS.Phone,
        },
      },
      {
        selector: 'node[label = "Vehicle"]',
        style: {
          'background-color': '#D97706',
          'background-image': MINIMAL_SVG_ICONS.Vehicle,
        },
      },
      {
        selector: 'node[label = "Location"]',
        style: {
          'background-color': '#0284C7',
          'background-image': MINIMAL_SVG_ICONS.Location,
        },
      },
      {
        selector: 'node[label = "Organisation"]',
        style: {
          'background-color': '#9333EA',
          'background-image': MINIMAL_SVG_ICONS.Organisation,
        },
      },
      {
        selector: 'node[label = "BankAccount"]',
        style: {
          'background-color': '#0D9488',
          'background-image': MINIMAL_SVG_ICONS.BankAccount,
        },
      },
      {
        selector: 'node[label = "Case"]',
        style: {
          'background-color': '#B45309',
          shape: 'round-rectangle',
          'background-image': MINIMAL_SVG_ICONS.Case,
        },
      },
      // Photo Override: If person has a dossier photo, crop as clean circular avatar
      {
        selector: 'node[photo_url]',
        style: {
          'background-image': 'data(photo_url)',
          'background-fit': 'cover',
          'background-clip': 'node',
          'background-width': '100%',
          'background-height': '100%',
          'border-width': 3,
          'border-color': '#9C6644',
        },
      },
      // Edge styling on warm canvas
      {
        selector: 'edge',
        style: {
          width: 2.0,
          'line-color': '#8C827A',
          'target-arrow-color': '#8C827A',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'arrow-scale': 1.1,
          opacity: 0.85,
          label: 'data(rel_type)',
          'font-size': '9px',
          'font-family': 'Inter, system-ui, sans-serif',
          'font-weight': 600,
          color: '#43382F',
          'text-rotation': 'autorotate',
          'text-background-opacity': 0.95,
          'text-background-color': '#F5EFE6',
          'text-background-padding': '3px 6px',
          'text-background-shape': 'roundrectangle',
          'text-border-opacity': 0.9,
          'text-border-color': '#E5DACB',
          'text-border-width': '1px',
          'transition-property': 'line-color, target-arrow-color, opacity, width',
          'transition-duration': '0.2s',
        },
      },
      // Focused / Selected Root Node
      {
        selector: '.focused-root',
        style: {
          'border-width': 4.5,
          'border-color': '#9C6644',
          'border-opacity': 1.0,
          opacity: 1.0,
        },
      },
      // Selected Edge Highlight
      {
        selector: 'edge:selected',
        style: {
          width: 3.5,
          'line-color': '#9C6644',
          'target-arrow-color': '#9C6644',
          opacity: 1.0,
          color: '#9C6644',
        },
      },
      // Highlighting Connected Subgraph (Focused Mode)
      {
        selector: '.highlighted',
        style: {
          opacity: 1.0,
          'line-color': '#9C6644',
          'target-arrow-color': '#9C6644',
          width: 3.0,
        },
      },
      // Greyed out / Dimmed / Blurred Unrelated Nodes (Focused / High-Risk Mode)
      {
        selector: '.dimmed',
        style: {
          opacity: 0.12,
          'background-color': '#D8CBB9',
          'text-opacity': 0.15,
          'line-color': '#E5DACB',
          'target-arrow-color': '#E5DACB',
          'border-opacity': 0.15,
          'background-image-opacity': 0.15,
        },
      },
      // High-Risk Prioritized Targets (Prominent Red / Cognac Glowing Border Ring)
      {
        selector: '.high-risk-highlight',
        style: {
          opacity: 1.0,
          'border-width': 5.5,
          'border-color': '#DC2626',
          'border-opacity': 1.0,
          'text-opacity': 1.0,
          'font-weight': 'bold',
          'shadow-blur': 28,
          'shadow-color': '#DC2626',
          'shadow-opacity': 0.85,
        },
      },
    ];

    const cy = cytoscape({
      container: containerRef.current,
      style: styles,
      layout: { name: 'cose' },
      minZoom: 0.15,
      maxZoom: 4.0,
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
      cyRef.current = null;
    };
  }, []);

  // Update Cytoscape Graph Data on Change
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.batch(() => {
      cy.elements().remove();

      // Add Nodes
      nodes.forEach((n) => {
        const isPerson = n.label === 'Person';
        const isCase = n.label === 'Case';
        const displayName = n.properties?.display_name || n.properties?.name || n.properties?.case_code || n.id;
        const photoUrl = n.properties?.photo_url;

        cy.add({
          group: 'nodes',
          data: {
            id: n.id,
            label: n.label,
            name: displayName,
            photo_url: photoUrl,
            node_size: isCase ? 56 : isPerson ? 48 : 38,
            font_size: isCase ? '11px' : isPerson ? '10px' : '9px',
          },
        });
      });

      // Add Edges (deduplicate any identical parallel links between same source, target and type)
      const seenEdgePairs = new Set<string>();
      edges.forEach((e) => {
        const pairKey = `${e.source}->${e.target}:${e.type}`;
        if (seenEdgePairs.has(pairKey)) return;
        seenEdgePairs.add(pairKey);

        const formattedRel = e.type.replace(/_/g, ' ');
        cy.add({
          group: 'edges',
          data: {
            id: e.id,
            source: e.source,
            target: e.target,
            type: e.type,
            rel_type: formattedRel,
          },
        });
      });
    });

    // Run Layout
    let layoutOptions: any = { name: layoutName, animate: true, animationDuration: 400 };

    if (layoutName === 'cose') {
      layoutOptions = {
        name: 'cose',
        animate: true,
        animationDuration: 450,
        nodeRepulsion: () => 450000,
        idealEdgeLength: () => 140,
        edgeElasticity: () => 80,
        nestingFactor: 1.2,
        gravity: 0.25,
        numIter: 1000,
        padding: 50,
      };
    } else if (layoutName === 'concentric') {
      layoutOptions = {
        name: 'concentric',
        animate: true,
        concentric: (node: any) => (node.data('label') === 'Case' ? 3 : node.data('label') === 'Person' ? 2 : 1),
        levelWidth: () => 1,
        padding: 50,
      };
    } else if (layoutName === 'breadthfirst') {
      layoutOptions = {
        name: 'breadthfirst',
        animate: true,
        directed: true,
        padding: 50,
        spacingFactor: 1.3,
      };
    } else if (layoutName === 'circle') {
      layoutOptions = {
        name: 'circle',
        animate: true,
        padding: 50,
      };
    }

    const layout = cy.layout(layoutOptions);
    layout.run();
  }, [nodes, edges, layoutName]);

  // Handle Focus, Selection & Dimming
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.batch(() => {
      cy.elements().removeClass('dimmed focused-root highlighted high-risk-highlight');

      if (selectedNodeId) {
        const selNode = cy.getElementById(selectedNodeId);
        if (selNode.length > 0) {
          selNode.select();
          const connectedEdges = selNode.connectedEdges();
          const connectedNodes = connectedEdges.connectedNodes();

          if (viewMode === 'focused') {
            cy.elements().addClass('dimmed');
            selNode.removeClass('dimmed').addClass('focused-root');
            connectedEdges.removeClass('dimmed').addClass('highlighted');
            connectedNodes.removeClass('dimmed');
          } else {
            selNode.addClass('focused-root');
          }
        }
      } else if (selectedEdgeId) {
        const selEdge = cy.getElementById(selectedEdgeId);
        if (selEdge.length > 0) {
          selEdge.select();
          const endpoints = selEdge.connectedNodes();

          if (viewMode === 'focused') {
            cy.elements().addClass('dimmed');
            selEdge.removeClass('dimmed').addClass('highlighted');
            endpoints.removeClass('dimmed');
          } else {
            selEdge.addClass('highlighted');
          }
        }
      } else if (isHighRiskFocus && highRiskNodeIds && highRiskNodeIds.size > 0) {
        cy.elements().addClass('dimmed');
        highRiskNodeIds.forEach((nid) => {
          const node = cy.getElementById(nid);
          if (node.length > 0) {
            node.removeClass('dimmed').addClass('high-risk-highlight');
          }
        });
        cy.edges().forEach((edge) => {
          if (highRiskNodeIds.has(edge.data('source')) && highRiskNodeIds.has(edge.data('target'))) {
            edge.removeClass('dimmed').addClass('highlighted');
          }
        });
      }
    });
  }, [selectedNodeId, selectedEdgeId, viewMode, isHighRiskFocus, highRiskNodeIds]);

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
    <div className="w-full h-full relative overflow-hidden bg-[#FBF8F3]" ref={containerRef}>
      {/* Zoom / Navigation Floating Toolbar */}
      <div className="absolute bottom-5 left-5 z-10 flex items-center gap-1.5 bg-[#FFFDFB]/95 backdrop-blur-md p-1.5 rounded-2xl border border-[#E2D7C8] shadow-md">
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-2 text-[#7D7268] hover:text-[#2C241D] hover:bg-[#F5EFE6] rounded-xl transition-all cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-2 text-[#7D7268] hover:text-[#2C241D] hover:bg-[#F5EFE6] rounded-xl transition-all cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-[#E2D7C8] my-auto" />
        <button
          type="button"
          onClick={handleFit}
          className="p-2 text-[#7D7268] hover:text-[#2C241D] hover:bg-[#F5EFE6] rounded-xl transition-all cursor-pointer"
          title="Fit to Screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleCenter}
          className="p-2 text-[#7D7268] hover:text-[#2C241D] hover:bg-[#F5EFE6] rounded-xl transition-all cursor-pointer"
          title="Center Selection"
        >
          <Crosshair className="w-4 h-4" />
        </button>
        {onViewModeChange && (
          <>
            <div className="w-px h-4 bg-[#E2D7C8] my-auto" />
            <button
              type="button"
              onClick={() => onViewModeChange(viewMode === 'focused' ? 'all' : 'focused')}
              className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                viewMode === 'focused'
                  ? 'bg-[#9C6644] text-white shadow-xs'
                  : 'text-[#7D7268] hover:text-[#2C241D] hover:bg-[#F5EFE6]'
              }`}
              title={viewMode === 'focused' ? 'Show Full Network' : 'Focus Active Cluster'}
            >
              {viewMode === 'focused' ? <Layers className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="hidden sm:inline">{viewMode === 'focused' ? 'Focus Mode' : 'All Nodes'}</span>
            </button>
          </>
        )}
      </div>

      {/* Hover Node Tooltip */}
      {hoveredNode && (
        <div
          className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 px-3 py-1.5 bg-[#20150F]/95 backdrop-blur-md text-white text-xs rounded-xl shadow-xl border border-[#3E2819] flex items-center gap-2 whitespace-nowrap"
          style={{ left: hoveredNode.x, top: hoveredNode.y }}
        >
          <span className="w-2 h-2 rounded-full bg-[#DDA15E]" />
          <span className="font-bold">{hoveredNode.name}</span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/10 text-[#DDA15E]">
            {hoveredNode.label}
          </span>
        </div>
      )}
    </div>
  );
};

export default GraphCanvas;
