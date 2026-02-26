import { $, component$, useStore, useVisibleTask$ } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';
import { AppShell } from '../../components/Common/AppShell';
import { Graph } from '../../components/MetricGraph/Graph';
import { GraphEdgeConfig, GraphNodeConfig } from '../../config/graph';
import { fetchApi } from '../../lib/client';
import { fetchSession } from '../../lib/session-client';
import { MetricName } from '../../lib/types';

type Intervention = {
  id: string;
  name: string;
  category: string;
  durationWeeks: number;
  frequency: string;
  description: string;
  effects: Array<{
    metric: MetricName;
    changeValue: number;
    unit: string;
    confidence: 'low' | 'moderate' | 'high';
    assumptions: string;
    range?: [number, number];
  }>;
  contraindications: Array<{
    scenario: string;
    warning: string;
  }>;
};

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

type SimulationResponse = {
  interventionId: string;
  selectedInterventions: string[];
  simulation: {
    current: Record<MetricName, number>;
    predicted: Record<MetricName, number>;
    warnings: string[];
    table: Array<{
      metricName: MetricName;
      metricLabel: string;
      current: number;
      predicted: number;
      delta: number;
      confidence: 'low' | 'moderate' | 'high';
      direction: 'improved' | 'worsened' | 'unchanged';
    }>;
    interventions: Intervention[];
  };
};

export default component$(() => {
  const location = useLocation();
  const state = useStore({
    loading: true,
    authenticated: false,
    userEmail: '',
    csrfToken: '',
    interventions: [] as Intervention[],
    selectedInterventionId: '',
    stackSelection: {} as Record<string, boolean>,
    simulation: null as SimulationResponse['simulation'] | null,
    metricMap: {} as Partial<Record<MetricName, { value: number; unit: string; recordedAt: string }>>,
    predictedMetricMap: {} as Partial<Record<MetricName, number>>,
    graphNodes: [] as GraphNodeConfig[],
    graphEdges: [] as GraphEdgeConfig[],
    error: ''
  });

  const runSimulation = $(async () => {
    if (!state.selectedInterventionId || !state.csrfToken) return;

    const selectedStackIds = Object.entries(state.stackSelection)
      .filter(([, checked]) => checked)
      .map(([id]) => id)
      .filter((id) => id !== state.selectedInterventionId);

    const response = await fetchApi<SimulationResponse>(`/api/interventions/${state.selectedInterventionId}/simulate`, {
      method: 'POST',
      headers: {
        'x-csrf-token': state.csrfToken
      },
      body: JSON.stringify({
        selectedInterventionIds: selectedStackIds
      })
    });

    if (!response.ok) {
      state.error = response.error.message;
      return;
    }

    state.simulation = response.data.simulation;
    state.predictedMetricMap = response.data.simulation.predicted;
  });

  const load = $(async () => {
    state.loading = true;
    state.error = '';

    const session = await fetchSession();
    if (!session.ok) {
      state.authenticated = false;
      state.loading = false;
      return;
    }

    state.authenticated = true;
    state.userEmail = session.data.user.email;
    state.csrfToken = session.data.csrfToken;

    const [interventionsResponse, metricsResponse, graphConfigResponse] = await Promise.all([
      fetchApi<Intervention[]>('/api/interventions'),
      fetchApi<MetricsResponse>('/api/metrics'),
      fetchApi<GraphConfigResponse>('/api/graph/config')
    ]);

    if (!interventionsResponse.ok) {
      state.error = interventionsResponse.error.message;
      state.loading = false;
      return;
    }

    state.interventions = interventionsResponse.data;

    if (!state.selectedInterventionId) {
      const fromQuery = location.url.searchParams.get('select');
      const fallback = interventionsResponse.data[0]?.id ?? '';
      state.selectedInterventionId = fromQuery && interventionsResponse.data.some((item) => item.id === fromQuery) ? fromQuery : fallback;
    }

    if (metricsResponse.ok) {
      state.metricMap = Object.fromEntries(
        metricsResponse.data.latest.map((entry) => [entry.metricName, { value: entry.value, unit: entry.unit, recordedAt: entry.recordedAt }])
      ) as Partial<Record<MetricName, { value: number; unit: string; recordedAt: string }>>;
    }

    if (graphConfigResponse.ok) {
      state.graphNodes = graphConfigResponse.data.nodes;
      state.graphEdges = graphConfigResponse.data.edges;
    }

    state.loading = false;

    await runSimulation();
  });

  useVisibleTask$(async () => {
    await load();
  });

  if (!state.authenticated && !state.loading) {
    return (
      <AppShell title="Interventions" subtitle="Sign in to run before/after simulations.">
        <section class="card card-center">
          <h2>Authentication required</h2>
          <p class="muted">Sign in to simulate interventions against your current metrics.</p>
          <Link href="/auth/login" class="button">
            Login
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Intervention Explorer"
      subtitle="Select one or more interventions, inspect predicted metric deltas, and review contraindications."
      userEmail={state.userEmail}
      csrfToken={state.csrfToken}
    >
      {state.loading ? <div class="card">Loading interventions...</div> : null}
      {state.error ? <div class="banner banner-error">{state.error}</div> : null}

      <section class="grid two-col">
        <div class="card">
          <h3>Intervention Library</h3>
          <div class="intervention-list">
            {state.interventions.map((intervention) => (
              <button
                key={intervention.id}
                type="button"
                class={`intervention-item ${state.selectedInterventionId === intervention.id ? 'intervention-item-active' : ''}`}
                onClick$={async () => {
                  state.selectedInterventionId = intervention.id;
                  await runSimulation();
                }}
              >
                <div class="intervention-title">{intervention.name}</div>
                <div class="muted small">
                  {intervention.durationWeeks} weeks • {intervention.frequency}
                </div>
                <p>{intervention.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div class="card">
          <h3>Stack Interventions</h3>
          <p class="muted">Select additional interventions to simulate conflicts and compounding effects.</p>
          <div class="stack-grid">
            {state.interventions
              .filter((item) => item.id !== state.selectedInterventionId)
              .map((intervention) => (
                <label key={intervention.id} class="checkbox-row">
                  <input
                    type="checkbox"
                    checked={Boolean(state.stackSelection[intervention.id])}
                    onChange$={(event) => {
                      state.stackSelection[intervention.id] = (event.target as HTMLInputElement).checked;
                    }}
                  />
                  <span>{intervention.name}</span>
                </label>
              ))}
          </div>
          <button class="button" type="button" onClick$={runSimulation}>
            Simulate before/after
          </button>
        </div>
      </section>

      {state.simulation ? (
        <>
          <Graph
            currentMetrics={state.metricMap}
            predictedMetrics={state.predictedMetricMap}
            graphNodes={state.graphNodes}
            graphEdges={state.graphEdges}
          />

          <section class="card">
            <h3>Predicted Outcome Table</h3>
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Current</th>
                    <th>Predicted</th>
                    <th>Change</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {state.simulation.table.map((row) => (
                    <tr key={row.metricName}>
                      <td>{row.metricLabel}</td>
                      <td>{row.current.toFixed(2)}</td>
                      <td>{row.predicted.toFixed(2)}</td>
                      <td class={`delta delta-${row.direction}`}>{row.delta > 0 ? '+' : ''}{row.delta.toFixed(2)}</td>
                      <td>{row.confidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {state.simulation.warnings.length ? (
            <section class="card">
              <h3>Contraindication Warnings</h3>
              {state.simulation.warnings.map((warning, index) => (
                <div class="banner banner-warning" key={`${warning}-${index}`}>
                  {warning}
                </div>
              ))}
            </section>
          ) : null}
        </>
      ) : null}
    </AppShell>
  );
});
