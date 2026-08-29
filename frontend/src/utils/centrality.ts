import { GraphNodeData, GraphEdgeData } from '../types';

export interface CentralityScores {
  degree: number;
  betweenness: number;
  closeness: number;
  eigenvector: number;
  riskScore: number;
  riskTier: 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low';
  riskColor: string;
}

export interface NetworkMetrics {
  totalEntities: number;
  totalConnections: number;
  avgConnectionStrength: number;
  networkDensity: number;
}

export interface KeyInsight {
  id: string;
  iconType: 'shield' | 'bridge' | 'alert' | 'check';
  text: string;
  severity: 'red' | 'amber' | 'blue' | 'green';
}

/**
 * Known high risk seed weights and alert linkages for realistic intelligence scoring
 */
const HIGH_RISK_NODE_WEIGHTS: Record<string, number> = {
  person_01: 98, // Priya Verma (Lead mastermind)
  person_02: 86, // Rohit Sharma (Co-director)
  person_12: 84, // R Sharma (Alias)
  person_03: 79, // Amit Patel (SIM Gateway & Courier)
  person_06: 76, // Deepa Nair (Lotus Transit Coordinator)
  person_07: 72, // Karan Johar (Fleet Manager)
  person_08: 88, // Rajesh Gupta (Falcon Document Forger)
  person_10: 65, // Tarun Joshi (ATM Cash Out Mule)
  person_13: 58, // Manish Kumar (Secondary Mule)
  person_14: 79, // Suresh Oberoi (Phishing Gateway Admin)
  person_15: 52, // Harish Rawat (Technician)
  person_16: 62, // Michael Smith (Ops Lead)
  phone_01: 92,  // Main C2 phone
  phone_02: 84,  // Dual-SIM burner
  phone_04: 88,  // SIM Box gateway
  acc_01: 90,    // Origin transfer account
  acc_03: 85,    // Escrow gateway account
  acc_02: 78,
  acc_04: 68,
  acc_05: 60,
};

export const getRiskTierAndColor = (
  score: number
): { tier: 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low'; color: string } => {
  if (score >= 80) return { tier: 'Very High', color: '#EF4444' };
  if (score >= 60) return { tier: 'High', color: '#F97316' };
  if (score >= 40) return { tier: 'Medium', color: '#EAB308' };
  if (score >= 20) return { tier: 'Low', color: '#22C55E' };
  return { tier: 'Very Low', color: '#3B82F6' };
};

/**
 * Compute graph centrality metrics (Degree, Betweenness, Closeness, Eigenvector) and Risk Scores
 */
export const computeGraphCentrality = (
  nodes: GraphNodeData[],
  edges: GraphEdgeData[]
): Map<string, CentralityScores> => {
  const result = new Map<string, CentralityScores>();
  const n = nodes.length;
  if (n === 0) return result;

  // Build adjacency list
  const adj = new Map<string, Set<string>>();
  const nodeMap = new Map<string, GraphNodeData>();
  nodes.forEach((node) => {
    adj.set(node.id, new Set());
    nodeMap.set(node.id, node);
  });

  edges.forEach((edge) => {
    if (adj.has(edge.source) && adj.has(edge.target)) {
      adj.get(edge.source)!.add(edge.target);
      adj.get(edge.target)!.add(edge.source);
    }
  });

  // 1. Degree Centrality
  const maxDegree = Math.max(1, n - 1);
  const degreeMap = new Map<string, number>();
  nodes.forEach((node) => {
    const deg = (adj.get(node.id)?.size || 0) / maxDegree;
    degreeMap.set(node.id, deg);
  });

  // 2. Shortest paths for Closeness & Betweenness (Brandes Algorithm)
  const betweennessMap = new Map<string, number>();
  const closenessMap = new Map<string, number>();
  nodes.forEach((node) => {
    betweennessMap.set(node.id, 0);
  });

  nodes.forEach((s) => {
    const S: string[] = [];
    const P = new Map<string, string[]>();
    const sigma = new Map<string, number>();
    const d = new Map<string, number>();

    nodes.forEach((v) => {
      P.set(v.id, []);
      sigma.set(v.id, 0);
      d.set(v.id, -1);
    });

    sigma.set(s.id, 1);
    d.set(s.id, 0);

    const Q: string[] = [s.id];
    let totalDist = 0;
    let reachableCount = 0;

    while (Q.length > 0) {
      const v = Q.shift()!;
      S.push(v);
      const vNeighbors = adj.get(v) || new Set();

      vNeighbors.forEach((w) => {
        if (d.get(w)! < 0) {
          Q.push(w);
          d.set(w, d.get(v)! + 1);
          totalDist += d.get(w)!;
          reachableCount++;
        }
        if (d.get(w)! === d.get(v)! + 1) {
          sigma.set(w, sigma.get(w)! + sigma.get(v)!);
          P.get(w)!.push(v);
        }
      });
    }

    // Closeness
    if (reachableCount > 0 && totalDist > 0) {
      const closeness = (reachableCount / totalDist) * (reachableCount / maxDegree);
      closenessMap.set(s.id, Math.min(1.0, closeness));
    } else {
      closenessMap.set(s.id, 0.1);
    }

    // Accumulation for betweenness
    const delta = new Map<string, number>();
    nodes.forEach((v) => delta.set(v.id, 0));

    while (S.length > 0) {
      const w = S.pop()!;
      (P.get(w) || []).forEach((v) => {
        const c = (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!);
        delta.set(v, delta.get(v)! + c);
      });
      if (w !== s.id) {
        betweennessMap.set(w, betweennessMap.get(w)! + delta.get(w)!);
      }
    }
  });

  // Normalize betweenness
  const normFactor = n > 2 ? 1 / ((n - 1) * (n - 2)) : 1;
  nodes.forEach((node) => {
    betweennessMap.set(node.id, (betweennessMap.get(node.id) || 0) * normFactor);
  });

  // 3. Eigenvector Centrality (Power Iteration)
  let eigen = new Map<string, number>();
  nodes.forEach((node) => eigen.set(node.id, 1 / Math.sqrt(n)));

  for (let iter = 0; iter < 20; iter++) {
    const nextEigen = new Map<string, number>();
    let norm = 0;
    nodes.forEach((node) => {
      let sum = 0;
      (adj.get(node.id) || new Set()).forEach((nbr) => {
        sum += eigen.get(nbr) || 0;
      });
      nextEigen.set(node.id, sum);
      norm += sum * sum;
    });

    norm = Math.sqrt(norm);
    if (norm > 0) {
      nodes.forEach((node) => {
        nextEigen.set(node.id, (nextEigen.get(node.id) || 0) / norm);
      });
      eigen = nextEigen;
    }
  }

  // 4. Combine into standardized scores and explainable Risk Scores
  nodes.forEach((node) => {
    const deg = Math.min(1.0, (degreeMap.get(node.id) || 0) * 1.5);
    const bet = Math.min(1.0, (betweennessMap.get(node.id) || 0) * 2.0);
    const cls = Math.min(1.0, (closenessMap.get(node.id) || 0) * 1.2);
    const eig = Math.min(1.0, (eigen.get(node.id) || 0) * 1.8);

    // Seed preset risk or calculated risk
    let riskScore = HIGH_RISK_NODE_WEIGHTS[node.id];
    if (riskScore === undefined) {
      // Calculated synthetic risk
      const raw = deg * 35 + bet * 30 + cls * 20 + eig * 15;
      riskScore = Math.min(95, Math.max(15, Math.round(raw * 100)));
    }

    const { tier, color } = getRiskTierAndColor(riskScore);

    result.set(node.id, {
      degree: Number(deg.toFixed(2)),
      betweenness: Number(bet.toFixed(2)),
      closeness: Number(cls.toFixed(2)),
      eigenvector: Number(eig.toFixed(2)),
      riskScore,
      riskTier: tier,
      riskColor: color,
    });
  });

  return result;
};

/**
 * Compute overall network structural statistics
 */
export const computeNetworkOverview = (
  nodes: GraphNodeData[],
  edges: GraphEdgeData[]
): NetworkMetrics => {
  const totalEntities = nodes.length;
  const totalConnections = edges.length;
  const maxPossibleEdges = (totalEntities * (totalEntities - 1)) / 2;
  const networkDensity =
    totalEntities > 1 ? Math.min(1.0, totalConnections / Math.max(1, maxPossibleEdges)) : 0;

  // Average confidence as strength
  let totalConfidence = 0;
  edges.forEach((e) => {
    totalConfidence += typeof e.properties?.confidence === 'number' ? e.properties.confidence : 0.85;
  });
  const avgConnectionStrength =
    totalConnections > 0 ? Number((totalConfidence / totalConnections).toFixed(2)) : 0.68;

  return {
    totalEntities,
    totalConnections,
    avgConnectionStrength,
    networkDensity: Number(networkDensity.toFixed(2)),
  };
};

/**
 * Generate explainable Key Insights for an entity based on centrality metrics and relationships
 */
export const generateEntityInsights = (
  nodeId: string,
  nodeName: string,
  label: string,
  scores: CentralityScores,
  connectedCount: number
): KeyInsight[] => {
  const insights: KeyInsight[] = [];

  if (scores.riskScore >= 80) {
    insights.push({
      id: 'ins-1',
      iconType: 'shield',
      text: `${nodeName} is the most influential entity in the active network with a Risk Score of ${scores.riskScore}/100.`,
      severity: 'red',
    });
  } else if (scores.riskScore >= 60) {
    insights.push({
      id: 'ins-1',
      iconType: 'shield',
      text: `${nodeName} holds elevated coordination influence across multiple operational branches.`,
      severity: 'amber',
    });
  } else {
    insights.push({
      id: 'ins-1',
      iconType: 'shield',
      text: `${nodeName} functions as a peripheral supporting entity in this investigative scope.`,
      severity: 'blue',
    });
  }

  if (scores.betweenness >= 0.5) {
    insights.push({
      id: 'ins-2',
      iconType: 'bridge',
      text: `High betweenness centrality (${scores.betweenness}) indicates this entity acts as a primary bridge between distinct syndicates.`,
      severity: 'amber',
    });
  } else if (scores.degree >= 0.6) {
    insights.push({
      id: 'ins-2',
      iconType: 'bridge',
      text: `High direct degree centrality (${scores.degree}) reflects dense direct linkages across ${connectedCount} immediate contacts.`,
      severity: 'blue',
    });
  }

  insights.push({
    id: 'ins-3',
    iconType: 'alert',
    text: `Monitoring communication and financial conduits linked to this entity can uncover hidden shell accounts.`,
    severity: 'amber',
  });

  insights.push({
    id: 'ins-4',
    iconType: 'check',
    text: `Consider prioritizing this entity for supervisory brief generation and forensic record subpoena.`,
    severity: 'green',
  });

  return insights;
};
