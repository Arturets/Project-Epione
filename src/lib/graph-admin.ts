import { GRAPH_EDGES, GRAPH_NODES, GraphEdgeConfig, GraphNodeConfig } from '../config/graph';
import { AppDatabase, GraphCustomEdge, GraphCustomMetric } from './types';
import { ApiError } from './http';
import { createId, nowIso } from './utils';

export function getBaseGraphConfig() {
  return {
    nodes: GRAPH_NODES.map((node) => ({ ...node })),
    edges: GRAPH_EDGES.map((edge) => ({ ...edge }))
  };
}

export function getMergedGraphConfig(db: AppDatabase): { nodes: GraphNodeConfig[]; edges: GraphEdgeConfig[] } {
  const base = getBaseGraphConfig();
  const customNodes = db.graphCustomMetrics.map(toGraphNodeConfig);
  const customEdges = db.graphCustomEdges.map(toGraphEdgeConfig);

  const nodeIds = new Set<string>(base.nodes.map((node) => node.id));
  for (const node of customNodes) {
    if (!nodeIds.has(node.id)) {
      nodeIds.add(node.id);
      base.nodes.push(node);
    }
  }

  const validNodeIds = new Set(base.nodes.map((node) => node.id));
  const edgeIds = new Set<string>(base.edges.map((edge) => edge.id));
  for (const edge of customEdges) {
    if (!validNodeIds.has(edge.source) || !validNodeIds.has(edge.target)) continue;
    if (edgeIds.has(edge.id)) continue;
    edgeIds.add(edge.id);
    base.edges.push(edge);
  }

  return base;
}

export function addCustomMetric(db: AppDatabase, input: Omit<GraphCustomMetric, 'createdAt' | 'updatedAt' | 'createdBy'>, userId: string) {
  const { nodes } = getMergedGraphConfig(db);
  if (nodes.some((node) => node.id === input.id)) {
    throw new ApiError(409, 'Graph metric id already exists', 'graph_metric_exists');
  }

  const now = nowIso();
  const metric: GraphCustomMetric = {
    ...input,
    createdBy: userId,
    createdAt: now,
    updatedAt: now
  };

  db.graphCustomMetrics.push(metric);
  return metric;
}

export function removeCustomMetric(db: AppDatabase, metricId: string) {
  const index = db.graphCustomMetrics.findIndex((entry) => entry.id === metricId);
  if (index < 0) {
    throw new ApiError(404, 'Graph metric not found', 'graph_metric_not_found');
  }

  const removed = db.graphCustomMetrics[index];
  db.graphCustomMetrics.splice(index, 1);

  // Remove only custom edges that reference this custom metric.
  db.graphCustomEdges = db.graphCustomEdges.filter((edge) => edge.source !== metricId && edge.target !== metricId);

  return removed;
}

export function addCustomEdge(
  db: AppDatabase,
  input: Omit<GraphCustomEdge, 'id' | 'createdAt' | 'createdBy'> & { id?: string },
  userId: string
) {
  const { nodes, edges } = getMergedGraphConfig(db);
  const nodeIds = new Set(nodes.map((node) => node.id));

  if (!nodeIds.has(input.source) || !nodeIds.has(input.target)) {
    throw new ApiError(400, 'source and target must reference existing graph nodes', 'graph_edge_invalid_nodes');
  }

  const edgeId = input.id?.trim() || createId();
  if (edges.some((edge) => edge.id === edgeId) || db.graphCustomEdges.some((edge) => edge.id === edgeId)) {
    throw new ApiError(409, 'Graph edge id already exists', 'graph_edge_exists');
  }

  const edge: GraphCustomEdge = {
    id: edgeId,
    source: input.source,
    target: input.target,
    direction: input.direction,
    effectStrength: input.effectStrength,
    type: input.type,
    description: input.description,
    createdBy: userId,
    createdAt: nowIso()
  };

  db.graphCustomEdges.push(edge);
  return edge;
}

export function removeCustomEdge(db: AppDatabase, edgeId: string) {
  const index = db.graphCustomEdges.findIndex((entry) => entry.id === edgeId);
  if (index < 0) {
    throw new ApiError(404, 'Graph edge not found', 'graph_edge_not_found');
  }

  const removed = db.graphCustomEdges[index];
  db.graphCustomEdges.splice(index, 1);
  return removed;
}

export function importCustomGraph(
  db: AppDatabase,
  input: {
    mode: 'append' | 'replace_custom';
    metrics: Array<Omit<GraphCustomMetric, 'createdBy' | 'createdAt' | 'updatedAt'>>;
    edges: Array<Omit<GraphCustomEdge, 'id' | 'createdAt' | 'createdBy'> & { id?: string }>;
  },
  userId: string
) {
  if (input.mode === 'replace_custom') {
    db.graphCustomMetrics = [];
    db.graphCustomEdges = [];
  }

  const createdMetrics = input.metrics.map((metric) => addCustomMetric(db, metric, userId));
  const createdEdges = input.edges.map((edge) => addCustomEdge(db, edge, userId));

  return {
    mode: input.mode,
    createdMetrics: createdMetrics.length,
    createdEdges: createdEdges.length
  };
}

function toGraphNodeConfig(node: GraphCustomMetric): GraphNodeConfig {
  return {
    id: node.id,
    label: node.label,
    x: node.x,
    y: node.y,
    tier: node.tier,
    domain: node.domain,
    description: node.description
  };
}

function toGraphEdgeConfig(edge: GraphCustomEdge): GraphEdgeConfig {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    direction: edge.direction,
    effectStrength: edge.effectStrength,
    type: edge.type,
    description: edge.description
  };
}
