import { $, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import * as d3 from 'd3';
import { GRAPH_CANVAS, GRAPH_EDGES, GRAPH_NODES, GraphEdgeConfig, GraphNodeConfig, GraphNodeId } from '../../config/graph';
import { IMPROVEMENT_DIRECTION } from '../../lib/metrics';
import { METRIC_NAMES, MetricName } from '../../lib/types';

type MetricGraphDatum = {
  value: number;
  unit: string;
  recordedAt: string;
};

type Props = {
  currentMetrics: Partial<Record<MetricName, MetricGraphDatum>>;
  predictedMetrics?: Partial<Record<MetricName, number>>;
  graphNodes?: GraphNodeConfig[];
  graphEdges?: GraphEdgeConfig[];
};

type TraversalMode = 'upstream' | 'downstream';
type ViewMode = 'current' | 'predicted';
type DetailMode = 'core' | 'full';

type ImpactDirection = 'upstream' | 'downstream';

type ImpactConnection = {
  edge: GraphEdgeConfig;
  node: GraphNodeConfig;
  score: number;
};

const EDGE_STRENGTH_SCORE: Record<GraphEdgeConfig['effectStrength'], number> = {
  high: 3,
  moderate: 2,
  low: 1
};

function isCoreMetric(metricName: GraphNodeId): metricName is MetricName {
  return (METRIC_NAMES as readonly string[]).includes(metricName);
}

function getTraversalSet(focused: GraphNodeId, traversalMode: TraversalMode, edges: GraphEdgeConfig[]) {
  const visited = new Set<GraphNodeId>([focused]);
  const queue: GraphNodeId[] = [focused];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    for (const edge of edges) {
      const next =
        traversalMode === 'upstream'
          ? edge.target === current
            ? edge.source
            : null
          : edge.source === current
            ? edge.target
            : null;

      if (next && !visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }

  return visited;
}

function nodeStatus(
  metricName: GraphNodeId,
  currentMetrics: Props['currentMetrics'],
  predictedMetrics: Props['predictedMetrics']
): 'improved' | 'worsened' | 'unchanged' {
  if (!isCoreMetric(metricName)) return 'unchanged';

  const current = currentMetrics[metricName]?.value;
  const predicted = predictedMetrics?.[metricName];

  if (typeof current !== 'number' || typeof predicted !== 'number') {
    return 'unchanged';
  }

  const delta = predicted - current;
  if (Math.abs(delta) < 0.0001) return 'unchanged';

  if (IMPROVEMENT_DIRECTION[metricName] === 'higher') {
    return delta > 0 ? 'improved' : 'worsened';
  }

  return delta < 0 ? 'improved' : 'worsened';
}

function impactScore(edge: GraphEdgeConfig) {
  return EDGE_STRENGTH_SCORE[edge.effectStrength] + (edge.type === 'causal' ? 0.35 : 0);
}

function getMostImpactfulConnections(
  nodeId: GraphNodeId,
  direction: ImpactDirection,
  edges: GraphEdgeConfig[],
  nodeMap: Map<GraphNodeId, GraphNodeConfig>,
  limit = 5
): ImpactConnection[] {
  const candidates =
    direction === 'upstream'
      ? edges.filter((edge) => edge.target === nodeId).map((edge) => ({ edge, otherId: edge.source }))
      : edges.filter((edge) => edge.source === nodeId).map((edge) => ({ edge, otherId: edge.target }));

  return candidates
    .map(({ edge, otherId }) => {
      const node = nodeMap.get(otherId);
      if (!node) return null;
      return {
        edge,
        node,
        score: impactScore(edge)
      };
    })
    .filter((entry): entry is ImpactConnection => Boolean(entry))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function visibleGraphEdges(detailMode: DetailMode, allEdges: GraphEdgeConfig[], nodeMap: Map<GraphNodeId, GraphNodeConfig>) {
  if (detailMode === 'full') return allEdges;

  return allEdges.filter((edge) => nodeMap.get(edge.source)?.tier === 'core' && nodeMap.get(edge.target)?.tier === 'core');
}

function getMetricDatum(currentMetrics: Props['currentMetrics'], metricName: GraphNodeId): MetricGraphDatum | undefined {
  return (currentMetrics as Partial<Record<string, MetricGraphDatum>>)[metricName];
}

function getPredictedValue(predictedMetrics: Props['predictedMetrics'], metricName: GraphNodeId): number | undefined {
  return (predictedMetrics as Partial<Record<string, number>> | undefined)?.[metricName];
}

export const Graph = component$<Props>(({ currentMetrics, predictedMetrics, graphNodes, graphEdges }) => {
  const svgRef = useSignal<SVGSVGElement>();
  const tooltipRef = useSignal<HTMLDivElement>();
  const graphSectionRef = useSignal<HTMLElement>();

  const focusedNode = useSignal<GraphNodeId>();
  const selectedNode = useSignal<GraphNodeId>();
  const traversalMode = useSignal<TraversalMode>('upstream');
  const viewMode = useSignal<ViewMode>('current');
  const detailMode = useSignal<DetailMode>('full');
  const isFullscreen = useSignal(false);
  const resetCounter = useSignal(0);

  const resetView = $(() => {
    resetCounter.value += 1;
    focusedNode.value = undefined;
    selectedNode.value = undefined;
  });

  const toggleFullscreen = $(async () => {
    const section = graphSectionRef.value;
    if (!section) return;

    try {
      if (document.fullscreenElement === section) {
        await document.exitFullscreen();
      } else {
        await section.requestFullscreen();
      }
    } catch {
      // Ignore fullscreen API failures; UI stays usable in normal mode.
    }
  });

  useVisibleTask$(({ cleanup }) => {
    const onFullscreenChange = () => {
      isFullscreen.value = document.fullscreenElement === graphSectionRef.value;
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    cleanup(() => document.removeEventListener('fullscreenchange', onFullscreenChange));
  });

  useVisibleTask$(({ track }) => {
    const focused = track(() => focusedNode.value);
    const traversal = track(() => traversalMode.value);
    const view = track(() => viewMode.value);
    const detail = track(() => detailMode.value);
    track(() => resetCounter.value);
    track(() => JSON.stringify(currentMetrics));
    track(() => JSON.stringify(predictedMetrics ?? {}));
    track(() => JSON.stringify(graphNodes ?? []));
    track(() => JSON.stringify(graphEdges ?? []));

    const svgElement = svgRef.value;
    const tooltipElement = tooltipRef.value;

    if (!svgElement || !tooltipElement) return;

    const allNodes = graphNodes?.length ? graphNodes : GRAPH_NODES;
    const nodeIds = new Set(allNodes.map((node) => node.id));
    const allEdges = (graphEdges?.length ? graphEdges : GRAPH_EDGES).filter(
      (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );

    const rootStyle = getComputedStyle(document.documentElement);
    const color = (name: string, fallback: string) => rootStyle.getPropertyValue(name).trim() || fallback;
    const colors = {
      edgeMuted: color('--graph-edge-muted', 'rgba(148, 163, 184, 0.2)'),
      edgeCausal: color('--graph-causal', 'rgba(20, 184, 166, 0.9)'),
      edgeInverse: color('--graph-inverse', 'rgba(245, 158, 11, 0.9)'),
      edgeCorrelation: color('--graph-correlation', 'rgba(59, 130, 246, 0.75)'),
      nodeInactive: color('--graph-node-inactive', 'rgba(30, 41, 59, 0.5)'),
      nodeImprove: color('--graph-node-improved', 'rgba(34, 197, 94, 0.85)'),
      nodeRisk: color('--graph-node-worsened', 'rgba(239, 68, 68, 0.85)'),
      nodeNeutral: color('--graph-node-neutral', 'rgba(100, 116, 139, 0.75)'),
      nodeCurrent: color('--graph-node', 'rgba(37, 99, 235, 0.82)'),
      nodeSupporting: color('--graph-node-supporting', 'rgba(79, 70, 229, 0.66)'),
      strokeFocused: color('--graph-node-stroke-focused', '#f8fafc'),
      strokeDefault: color('--graph-node-stroke', 'rgba(15, 23, 42, 0.9)')
    };

    const width = svgElement.clientWidth || GRAPH_CANVAS.width;
    const height = svgElement.clientHeight || 620;
    const xScale = width / GRAPH_CANVAS.width;
    const yScale = height / GRAPH_CANVAS.height;
    const scale = Math.max(0.65, Math.min(1.1, Math.min(xScale, yScale)));

    const visibleNodes = detail === 'core' ? allNodes.filter((node) => node.tier === 'core') : allNodes;
    const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
    const visibleEdges = allEdges.filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target));

    const effectiveFocused = focused && visibleNodeIds.has(focused) ? focused : undefined;

    const highlightSet = effectiveFocused ? getTraversalSet(effectiveFocused, traversal, visibleEdges) : null;

    const nodeById = new Map(visibleNodes.map((node) => [node.id, node]));

    const svg = d3
      .select(svgElement)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    svg.selectAll('*').remove();

    const defs = svg.append('defs');
    const glow = defs.append('filter').attr('id', 'node-glow');
    glow.append('feGaussianBlur').attr('stdDeviation', 3.4).attr('result', 'coloredBlur');
    const merge = glow.append('feMerge');
    merge.append('feMergeNode').attr('in', 'coloredBlur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    const background = svg.append('rect').attr('x', 0).attr('y', 0).attr('width', width).attr('height', height).attr('fill', 'transparent');

    const root = svg.append('g').attr('class', 'graph-root');

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.75, 2.5])
      .on('zoom', (event) => {
        root.attr('transform', event.transform.toString());
      });

    svg.call(zoom as never);

    background.on('click', () => {
      focusedNode.value = undefined;
      selectedNode.value = undefined;
    });

    const edgeGroup = root.append('g').attr('class', 'edges');

    edgeGroup
      .selectAll('line')
      .data(visibleEdges)
      .enter()
      .append('line')
      .attr('x1', (edge) => (nodeById.get(edge.source)?.x ?? 0) * xScale)
      .attr('y1', (edge) => (nodeById.get(edge.source)?.y ?? 0) * yScale)
      .attr('x2', (edge) => (nodeById.get(edge.target)?.x ?? 0) * xScale)
      .attr('y2', (edge) => (nodeById.get(edge.target)?.y ?? 0) * yScale)
      .attr('stroke', (edge) => {
        if (highlightSet && !(highlightSet.has(edge.source) && highlightSet.has(edge.target))) {
          return colors.edgeMuted;
        }

        if (edge.type === 'causal') {
          return edge.direction === 'direct' ? colors.edgeCausal : colors.edgeInverse;
        }

        return colors.edgeCorrelation;
      })
      .attr('stroke-width', (edge) => {
        const base = edge.effectStrength === 'high' ? 3.2 : edge.effectStrength === 'moderate' ? 2.3 : 1.6;
        return Number((base * scale).toFixed(2));
      })
      .attr('stroke-linecap', 'round')
      .attr('opacity', (edge) => (highlightSet && !(highlightSet.has(edge.source) && highlightSet.has(edge.target)) ? 0.22 : 1))
      .on('mouseenter', function onMouseEnter(event, edge) {
        d3.select(this).attr('stroke-width', Number((4.2 * scale).toFixed(2)));

        tooltipElement.style.opacity = '1';
        tooltipElement.style.left = `${event.offsetX + 16}px`;
        tooltipElement.style.top = `${event.offsetY + 16}px`;
        tooltipElement.innerHTML = `<strong>${edge.source} → ${edge.target}</strong><br/>${edge.description}`;
      })
      .on('mouseleave', function onMouseLeave(_, edge) {
        const base = edge.effectStrength === 'high' ? 3.2 : edge.effectStrength === 'moderate' ? 2.3 : 1.6;
        d3.select(this).attr('stroke-width', Number((base * scale).toFixed(2)));
        tooltipElement.style.opacity = '0';
      });

    const nodeGroup = root.append('g').attr('class', 'nodes');

    const node = nodeGroup
      .selectAll('g')
      .data(visibleNodes)
      .enter()
      .append('g')
      .attr('transform', (item) => `translate(${item.x * xScale}, ${item.y * yScale})`)
      .style('cursor', 'pointer')
      .on('click', (_, item) => {
        focusedNode.value = item.id;
        selectedNode.value = item.id;
      })
      .on('mouseenter', (event, item) => {
        const datum = getMetricDatum(currentMetrics, item.id);

        tooltipElement.style.opacity = '1';
        tooltipElement.style.left = `${event.offsetX + 16}px`;
        tooltipElement.style.top = `${event.offsetY + 16}px`;

        tooltipElement.innerHTML = `<strong>${item.label}</strong><br/>${
          datum
            ? `${datum.value.toFixed(2)} ${datum.unit}<br/>Updated: ${new Date(datum.recordedAt).toLocaleString()}<br/>`
            : item.tier === 'core'
              ? 'No data yet<br/>'
              : `${item.domain} supporting metric<br/>`
        }${item.description}`;
      })
      .on('mouseleave', () => {
        tooltipElement.style.opacity = '0';
      });

    node
      .append('circle')
      .attr('r', (item) => {
        const base = item.tier === 'core' ? 48 : 32;
        return Math.round(base * scale);
      })
      .attr('fill', (item) => {
        if (highlightSet && !highlightSet.has(item.id)) {
          return colors.nodeInactive;
        }

        if (view === 'predicted' && isCoreMetric(item.id)) {
          const status = nodeStatus(item.id, currentMetrics, predictedMetrics);
          if (status === 'improved') return colors.nodeImprove;
          if (status === 'worsened') return colors.nodeRisk;
          return colors.nodeNeutral;
        }

        return item.tier === 'core' ? colors.nodeCurrent : colors.nodeSupporting;
      })
      .attr('stroke', (item) => {
        if (effectiveFocused === item.id) return colors.strokeFocused;
        return colors.strokeDefault;
      })
      .attr('stroke-width', (item) => {
        const base = effectiveFocused === item.id ? 4 : 2;
        return Number((base * scale).toFixed(2));
      })
      .attr('filter', 'url(#node-glow)');

    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', (item) => {
        const base = item.tier === 'core' ? 13 : 10;
        return -Math.round(base * scale);
      })
      .attr('class', 'graph-node-label')
      .style('font-size', `${Math.max(9, Math.round(13 * scale))}px`)
      .text((item) => item.label);

    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', (item) => {
        const base = item.tier === 'core' ? 14 : 11;
        return Math.round(base * scale);
      })
      .attr('class', 'graph-node-value')
      .style('font-size', `${Math.max(8, Math.round(11 * scale))}px`)
      .text((item) => {
        const current = getMetricDatum(currentMetrics, item.id);
        const predicted = getPredictedValue(predictedMetrics, item.id);

        if (view === 'predicted' && typeof predicted === 'number') {
          const unit = current?.unit ?? '';
          return `${predicted.toFixed(1)} ${unit}`;
        }

        if (current) return `${current.value.toFixed(1)} ${current.unit}`;
        return item.tier === 'core' ? 'No data' : item.domain;
      });
  });

  const allNodes = graphNodes?.length ? graphNodes : GRAPH_NODES;
  const nodeMap = new Map(allNodes.map((node) => [node.id, node]));
  const nodeIds = new Set(allNodes.map((node) => node.id));
  const allEdges = (graphEdges?.length ? graphEdges : GRAPH_EDGES).filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));

  const selected = selectedNode.value ? nodeMap.get(selectedNode.value) ?? null : null;
  const panelEdges = visibleGraphEdges(detailMode.value, allEdges, nodeMap);
  const upstream = selected ? getMostImpactfulConnections(selected.id, 'upstream', panelEdges, nodeMap, 6) : [];
  const downstream = selected ? getMostImpactfulConnections(selected.id, 'downstream', panelEdges, nodeMap, 6) : [];

  const currentValueText = (() => {
    if (!selected) return 'Select a node to inspect metric details.';
    const datum = getMetricDatum(currentMetrics, selected.id);
    if (!datum) {
      return selected.tier === 'core' ? 'No value logged yet.' : 'Context-only metric in this MVP (not directly tracked yet).';
    }
    return `${datum.value.toFixed(2)} ${datum.unit}`;
  })();

  const currentValueMeta = (() => {
    if (!selected) return '';
    const datum = getMetricDatum(currentMetrics, selected.id);
    if (!datum) return '';

    return `Updated ${new Date(datum.recordedAt).toLocaleString()}`;
  })();

  const predictedValueText = (() => {
    if (!selected || !predictedMetrics) return '';

    const predicted = getPredictedValue(predictedMetrics, selected.id);
    if (typeof predicted !== 'number') return '';

    const unit = getMetricDatum(currentMetrics, selected.id)?.unit ?? '';
    return `${predicted.toFixed(2)} ${unit}`;
  })();

  return (
    <section ref={graphSectionRef} class={`card graph-card ${isFullscreen.value ? 'graph-card-fullscreen' : ''}`}>
      <div class="section-header section-header-row">
        <div>
          <h3>Metric Interconnection Graph</h3>
          <p class="muted">Expanded body-systems-inspired map. Click nodes for detailed metric intelligence.</p>
        </div>
        <div class="graph-controls">
          <button
            class={`button button-ghost ${detailMode.value === 'full' ? 'button-active' : ''}`}
            type="button"
            onClick$={() => {
              detailMode.value = detailMode.value === 'full' ? 'core' : 'full';

              const nextMode = detailMode.value;
              const selectedTier = selectedNode.value ? nodeMap.get(selectedNode.value)?.tier : undefined;
              if (nextMode === 'core' && selectedNode.value && selectedTier !== 'core') {
                selectedNode.value = undefined;
                focusedNode.value = undefined;
              }
            }}
          >
            {detailMode.value === 'full' ? 'Show core only' : 'Show full map'}
          </button>
          <button
            class={`button button-ghost ${traversalMode.value === 'upstream' ? 'button-active' : ''}`}
            type="button"
            onClick$={() => (traversalMode.value = 'upstream')}
          >
            Highlight upstream
          </button>
          <button
            class={`button button-ghost ${traversalMode.value === 'downstream' ? 'button-active' : ''}`}
            type="button"
            onClick$={() => (traversalMode.value = 'downstream')}
          >
            Highlight downstream
          </button>
          {predictedMetrics ? (
            <button
              class={`button button-ghost ${viewMode.value === 'predicted' ? 'button-active' : ''}`}
              type="button"
              onClick$={() => (viewMode.value = viewMode.value === 'current' ? 'predicted' : 'current')}
            >
              {viewMode.value === 'current' ? 'Show predicted' : 'Show current'}
            </button>
          ) : null}
          <button class="button button-ghost" type="button" onClick$={toggleFullscreen}>
            {isFullscreen.value ? 'Exit fullscreen' : 'Fullscreen'}
          </button>
          <button class="button button-ghost" type="button" onClick$={resetView}>
            Reset view
          </button>
        </div>
      </div>

      <div class={`graph-stage ${selected ? 'graph-stage-with-panel' : ''}`}>
        <div class="graph-canvas">
          <div class="graph-wrapper">
            <svg ref={svgRef} class="graph-svg" />
            <div ref={tooltipRef} class="graph-tooltip" />
          </div>
        </div>

        {selected ? (
          <aside class="graph-side-panel">
            <div class="graph-side-header">
              <h4>{selected.label}</h4>
              <button
                class="button button-ghost"
                type="button"
                onClick$={() => {
                  selectedNode.value = undefined;
                  focusedNode.value = undefined;
                }}
              >
                Close
              </button>
            </div>

            <p class="muted">{selected.description}</p>

            <div class="graph-value-row">
              <div class="graph-value-pill">
                <span class="small muted">Current value</span>
                <strong>{currentValueText}</strong>
                {currentValueMeta ? <span class="small muted">{currentValueMeta}</span> : null}
              </div>
              {predictedValueText ? (
                <div class="graph-value-pill">
                  <span class="small muted">Predicted value</span>
                  <strong>{predictedValueText}</strong>
                </div>
              ) : null}
            </div>

            <div class="graph-impact-section">
              <h5>Most Impactful Upstream</h5>
              {upstream.length ? (
                <ul class="graph-impact-list">
                  {upstream.map((entry) => (
                    <li key={entry.edge.id} class="graph-impact-item">
                      <div class="graph-impact-head">
                        <strong>{entry.node.label}</strong>
                        <span class="small muted">{entry.edge.effectStrength}</span>
                      </div>
                      <p class="small muted">{entry.edge.type} • {entry.edge.direction} • {entry.edge.description}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p class="small muted">No upstream links in this view.</p>
              )}
            </div>

            <div class="graph-impact-section">
              <h5>Most Impactful Downstream</h5>
              {downstream.length ? (
                <ul class="graph-impact-list">
                  {downstream.map((entry) => (
                    <li key={entry.edge.id} class="graph-impact-item">
                      <div class="graph-impact-head">
                        <strong>{entry.node.label}</strong>
                        <span class="small muted">{entry.edge.effectStrength}</span>
                      </div>
                      <p class="small muted">{entry.edge.type} • {entry.edge.direction} • {entry.edge.description}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p class="small muted">No downstream links in this view.</p>
              )}
            </div>
          </aside>
        ) : null}
      </div>

      <div class="graph-legend-row">
        <span class="legend-item"><span class="legend-swatch legend-core" /> Core metrics</span>
        <span class="legend-item"><span class="legend-swatch legend-supporting" /> Supporting metrics</span>
        <span class="legend-item"><span class="legend-swatch legend-causal" /> Causal</span>
        <span class="legend-item"><span class="legend-swatch legend-correlation" /> Correlative</span>
        <span class="legend-item"><span class="legend-swatch legend-inverse" /> Inverse effect</span>
        <span class="legend-item"><span class="legend-swatch legend-improve" /> Improvement</span>
        <span class="legend-item"><span class="legend-swatch legend-risk" /> Risk</span>
      </div>
    </section>
  );
});
