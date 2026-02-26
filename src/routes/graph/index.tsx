import { $, component$, useStore, useVisibleTask$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { AppShell } from '../../components/Common/AppShell';
import { Graph } from '../../components/MetricGraph/Graph';
import { GraphEdgeConfig, GraphNodeConfig } from '../../config/graph';
import { fetchApi } from '../../lib/client';
import { fetchSession } from '../../lib/session-client';
import { MetricName } from '../../lib/types';

type MetricsResponse = {
  latest: Array<{
    metricName: MetricName;
    value: number;
    unit: string;
    recordedAt: string;
  }>;
};

type GraphConfigResponse = {
  nodes: GraphNodeConfig[];
  edges: GraphEdgeConfig[];
};

export default component$(() => {
  const state = useStore({
    loading: true,
    authenticated: false,
    userEmail: '',
    csrfToken: '',
    metricMap: {} as Partial<Record<MetricName, { value: number; unit: string; recordedAt: string }>>,
    graphNodes: [] as GraphNodeConfig[],
    graphEdges: [] as GraphEdgeConfig[],
    error: ''
  });

  const load = $(async () => {
    state.loading = true;
    state.error = '';
    const session = await fetchSession();

    if (!session.ok) {
      state.loading = false;
      state.authenticated = false;
      return;
    }

    state.authenticated = true;
    state.userEmail = session.data.user.email;
    state.csrfToken = session.data.csrfToken;

    const [metrics, graphConfig] = await Promise.all([
      fetchApi<MetricsResponse>('/api/metrics'),
      fetchApi<GraphConfigResponse>('/api/graph/config')
    ]);

    if (!metrics.ok) {
      state.error = metrics.error.message;
      state.loading = false;
      return;
    }

    state.metricMap = Object.fromEntries(
      metrics.data.latest.map((entry) => [entry.metricName, { value: entry.value, unit: entry.unit, recordedAt: entry.recordedAt }])
    ) as Partial<Record<MetricName, { value: number; unit: string; recordedAt: string }>>;

    if (graphConfig.ok) {
      state.graphNodes = graphConfig.data.nodes;
      state.graphEdges = graphConfig.data.edges;
    }

    state.loading = false;
  });

  useVisibleTask$(async () => {
    await load();
  });

  if (!state.authenticated && !state.loading) {
    return (
      <AppShell title="Metric Graph" subtitle="Sign in to inspect interconnections.">
        <section class="card card-center">
          <h2>Authentication required</h2>
          <p class="muted">Sign in to view your personalized metric graph.</p>
          <Link href="/auth/login" class="button">
            Login
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Metric Interconnection Graph"
      subtitle="Core + supporting body-systems metrics with causal and correlative links."
      userEmail={state.userEmail}
      csrfToken={state.csrfToken}
    >
      {state.loading ? <div class="card">Loading graph...</div> : null}
      {state.error ? <div class="banner banner-error">{state.error}</div> : null}

      {!state.loading ? <Graph currentMetrics={state.metricMap} graphNodes={state.graphNodes} graphEdges={state.graphEdges} /> : null}

      <section class="card">
        <div class="section-header-row">
          <div>
            <h3>Anatomical Drilldown</h3>
            <p class="muted">Open the muscle map to select specific heads front and back.</p>
          </div>
          <Link href="/anatomy" class="button">
            Open Anatomy Diagram
          </Link>
        </div>
      </section>

      <section class="card">
        <h3>How to use this graph</h3>
        <ul class="simple-list">
          <li>Use “Show full map” / “Show core only” to switch between dense and focused views.</li>
          <li>Click a node and toggle upstream/downstream to see what drives it or what it affects.</li>
          <li>Hover an edge to inspect effect type and qualitative strength.</li>
          <li>Core nodes display your tracked values; supporting nodes provide physiological context.</li>
        </ul>
      </section>
    </AppShell>
  );
});
