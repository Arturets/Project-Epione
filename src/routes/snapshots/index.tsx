import { $, component$, useStore, useVisibleTask$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { AppShell } from '../../components/Common/AppShell';
import { TimelineChart } from '../../components/Snapshots/TimelineChart';
import { METRIC_DEFINITIONS } from '../../config/metrics';
import { fetchApi } from '../../lib/client';
import { fetchSession } from '../../lib/session-client';
import { MetricName } from '../../lib/types';

type Snapshot = {
  id: string;
  metricValues: Partial<Record<MetricName, number>>;
  userNote: string | null;
  createdAt: string;
  updatedAt: string;
};

type MetricsResponse = {
  latest: Array<{
    metricName: MetricName;
    value: number;
    unit: string;
    recordedAt: string;
  }>;
};

export default component$(() => {
  const state = useStore({
    loading: true,
    authenticated: false,
    userEmail: '',
    csrfToken: '',
    snapshots: [] as Snapshot[],
    selectedSnapshotId: '',
    currentMetricValues: {} as Partial<Record<MetricName, number>>,
    currentMetricUnits: {} as Partial<Record<MetricName, string>>,
    selectedTimelineMetric: 'weight' as MetricName,
    snapshotNote: '',
    error: '',
    message: ''
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

    const [snapshotsResponse, metricsResponse] = await Promise.all([
      fetchApi<Snapshot[]>('/api/snapshots'),
      fetchApi<MetricsResponse>('/api/metrics')
    ]);

    if (!snapshotsResponse.ok) {
      state.error = snapshotsResponse.error.message;
      state.loading = false;
      return;
    }

    state.snapshots = snapshotsResponse.data;
    if (!state.selectedSnapshotId && snapshotsResponse.data.length) {
      state.selectedSnapshotId = snapshotsResponse.data[0].id;
    }

    if (metricsResponse.ok) {
      state.currentMetricValues = Object.fromEntries(metricsResponse.data.latest.map((entry) => [entry.metricName, entry.value])) as Partial<
        Record<MetricName, number>
      >;
      state.currentMetricUnits = Object.fromEntries(metricsResponse.data.latest.map((entry) => [entry.metricName, entry.unit])) as Partial<
        Record<MetricName, string>
      >;
    }

    state.loading = false;
  });

  const saveSnapshot = $(async () => {
    if (!state.csrfToken) return;

    const response = await fetchApi('/api/snapshots', {
      method: 'POST',
      headers: {
        'x-csrf-token': state.csrfToken
      },
      body: JSON.stringify({
        user_note: state.snapshotNote
      })
    });

    if (!response.ok) {
      state.error = response.error.message;
      return;
    }

    state.snapshotNote = '';
    state.message = 'Snapshot saved.';
    await load();
  });

  const deleteSnapshot = $(async (snapshotId: string) => {
    if (!state.csrfToken) return;

    const response = await fetchApi(`/api/snapshots/${snapshotId}`, {
      method: 'DELETE',
      headers: {
        'x-csrf-token': state.csrfToken
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      state.error = response.error.message;
      return;
    }

    state.message = 'Snapshot deleted.';
    if (state.selectedSnapshotId === snapshotId) {
      state.selectedSnapshotId = '';
    }

    await load();
  });

  useVisibleTask$(async () => {
    await load();
  });

  const selectedSnapshot = state.snapshots.find((snapshot) => snapshot.id === state.selectedSnapshotId) ?? null;

  const timelinePoints = state.snapshots
    .slice()
    .reverse()
    .map((snapshot) => ({
      label: new Date(snapshot.createdAt).toLocaleDateString(),
      value: snapshot.metricValues[state.selectedTimelineMetric] ?? 0
    }))
    .filter((point) => Number.isFinite(point.value));

  if (Number.isFinite(state.currentMetricValues[state.selectedTimelineMetric] ?? Number.NaN)) {
    timelinePoints.push({
      label: 'Now',
      value: state.currentMetricValues[state.selectedTimelineMetric] ?? 0
    });
  }

  if (!state.authenticated && !state.loading) {
    return (
      <AppShell title="Snapshots" subtitle="Sign in to view and compare historical states.">
        <section class="card card-center">
          <h2>Authentication required</h2>
          <Link href="/auth/login" class="button">
            Login
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Snapshots & Time Tracking"
      subtitle="Save full-state snapshots and compare changes over time."
      userEmail={state.userEmail}
      csrfToken={state.csrfToken}
    >
      {state.loading ? <div class="card">Loading snapshots...</div> : null}
      {state.error ? <div class="banner banner-error">{state.error}</div> : null}
      {state.message ? <div class="banner banner-success">{state.message}</div> : null}

      <section class="grid two-col">
        <div class="card">
          <h3>Save Snapshot</h3>
          <textarea
            class="input"
            placeholder="Optional note for this snapshot"
            value={state.snapshotNote}
            onInput$={(event) => (state.snapshotNote = (event.target as HTMLTextAreaElement).value)}
          />
          <button class="button" type="button" onClick$={saveSnapshot}>
            Save current state
          </button>
        </div>

        <div class="card">
          <h3>Snapshot History</h3>
          <div class="snapshot-list">
            {state.snapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                class={`snapshot-item ${state.selectedSnapshotId === snapshot.id ? 'snapshot-item-active' : ''}`}
                onClick$={() => (state.selectedSnapshotId = snapshot.id)}
              >
                <div class="snapshot-top">
                  <strong>{new Date(snapshot.createdAt).toLocaleString()}</strong>
                  <button
                    class="button button-ghost small"
                    type="button"
                    onClick$={async (event) => {
                      event.stopPropagation();
                      await deleteSnapshot(snapshot.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
                <div class="muted small">Weight: {snapshot.metricValues.weight ?? 'N/A'} • Body Fat: {snapshot.metricValues.body_fat ?? 'N/A'}</div>
                {snapshot.userNote ? <div class="muted small">{snapshot.userNote}</div> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {selectedSnapshot ? (
        <section class="card">
          <h3>Snapshot vs Current Comparison</h3>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Snapshot</th>
                  <th>Current</th>
                  <th>Delta</th>
                </tr>
              </thead>
              <tbody>
                {METRIC_DEFINITIONS.map((definition) => {
                  const previous = selectedSnapshot.metricValues[definition.key] ?? 0;
                  const current = state.currentMetricValues[definition.key] ?? 0;
                  const delta = current - previous;
                  return (
                    <tr key={definition.key}>
                      <td>{definition.label}</td>
                      <td>{previous.toFixed(2)}</td>
                      <td>{current.toFixed(2)}</td>
                      <td class={delta >= 0 ? 'delta delta-up' : 'delta delta-down'}>
                        {delta >= 0 ? '+' : ''}
                        {delta.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section class="card">
        <div class="section-header section-header-row">
          <h3>Metric Timeline</h3>
          <select
            class="input input-compact"
            value={state.selectedTimelineMetric}
            onChange$={(event) => (state.selectedTimelineMetric = (event.target as HTMLSelectElement).value as MetricName)}
          >
            {METRIC_DEFINITIONS.map((metric) => (
              <option value={metric.key} key={metric.key}>
                {metric.label}
              </option>
            ))}
          </select>
        </div>
        <TimelineChart
          title={`Timeline for ${METRIC_DEFINITIONS.find((metric) => metric.key === state.selectedTimelineMetric)?.label ?? state.selectedTimelineMetric}`}
          points={timelinePoints}
        />
      </section>
    </AppShell>
  );
});
