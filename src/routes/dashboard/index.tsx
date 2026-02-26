import { $, component$, useStore, useVisibleTask$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import { AppShell } from '../../components/Common/AppShell';
import { METRIC_DEFINITIONS } from '../../config/metrics';
import { fetchApi } from '../../lib/client';
import { SessionData, fetchSession } from '../../lib/session-client';
import { MetricName } from '../../lib/types';

type MetricsResponse = {
  latest: Array<{
    metricName: MetricName;
    value: number;
    unit: string;
    recordedAt: string;
    trend: Array<{ recordedAt: string; value: number }>;
  }>;
  records: Array<{
    id: string;
    metricName: MetricName;
    value: number;
    unit: string;
    recordedAt: string;
    note: string | null;
    syncedFrom: 'manual' | 'apple_health' | null;
  }>;
};

type SuggestionResponse = Array<{
  id: string;
  goal: string;
  message: string;
  suggestedInterventions: string[];
}>;

export default component$(() => {
  const state = useStore({
    loading: true,
    authenticated: false,
    userEmail: '',
    csrfToken: '',
    session: null as SessionData | null,
    metrics: [] as MetricsResponse['latest'],
    records: [] as MetricsResponse['records'],
    suggestions: [] as SuggestionResponse,
    error: '',
    message: '',
    singleMetricName: 'weight' as MetricName,
    singleValue: '',
    singleUnit: 'kg',
    singleNote: '',
    batchValues: {} as Partial<Record<MetricName, string>>,
    batchNote: '',
    snapshotNote: '',
    appleConsentTicked: false,
    syncingAppleHealth: false
  });

  const loadDashboard = $(async () => {
    state.loading = true;
    state.error = '';

    const session = await fetchSession();
    if (!session.ok) {
      state.loading = false;
      state.authenticated = false;
      return;
    }

    state.authenticated = true;
    state.session = session.data;
    state.userEmail = session.data.user.email;
    state.csrfToken = session.data.csrfToken;

    const [metricsResponse, suggestionsResponse] = await Promise.all([
      fetchApi<MetricsResponse>('/api/metrics'),
      fetchApi<SuggestionResponse>('/api/suggestions')
    ]);

    if (metricsResponse.ok) {
      state.metrics = metricsResponse.data.latest;
      state.records = metricsResponse.data.records;

      const latestByMetric = new Map(metricsResponse.data.latest.map((item) => [item.metricName, item]));
      for (const metric of METRIC_DEFINITIONS) {
        const latest = latestByMetric.get(metric.key);
        state.batchValues[metric.key] = latest ? String(latest.value) : '';
      }

      const currentUnit = latestByMetric.get(state.singleMetricName)?.unit;
      state.singleUnit = currentUnit ?? (state.singleMetricName === 'weight' ? session.data.preferences?.weightUnit ?? 'kg' : '');
    }

    if (suggestionsResponse.ok) {
      state.suggestions = suggestionsResponse.data;
    }

    state.loading = false;
  });

  const submitSingleMetric = $(async () => {
    if (!state.csrfToken) return;

    const value = Number(state.singleValue);
    if (!Number.isFinite(value)) {
      state.error = 'Please enter a numeric value for the selected metric.';
      return;
    }

    state.error = '';
    state.message = '';

    const response = await fetchApi('/api/metrics', {
      method: 'POST',
      headers: {
        'x-csrf-token': state.csrfToken
      },
      body: JSON.stringify({
        metric_name: state.singleMetricName,
        value,
        unit: state.singleUnit,
        note: state.singleNote,
        synced_from: 'manual'
      })
    });

    if (!response.ok) {
      state.error = response.error.message;
      return;
    }

    state.message = 'Metric logged successfully.';
    state.singleValue = '';
    state.singleNote = '';
    await loadDashboard();
  });

  const submitBatch = $(async () => {
    if (!state.csrfToken) return;

    const entries = METRIC_DEFINITIONS.map((definition) => {
      const raw = state.batchValues[definition.key];
      const value = raw ? Number(raw) : null;
      if (value === null || !Number.isFinite(value)) return null;

      return {
        metric_name: definition.key,
        value,
        unit:
          definition.key === 'weight'
            ? state.session?.preferences?.weightUnit ?? 'kg'
            : definition.defaultUnit,
        note: state.batchNote,
        synced_from: 'manual'
      };
    }).filter(Boolean) as Array<Record<string, unknown>>;

    if (!entries.length) {
      state.error = 'Fill at least one metric value for batch entry.';
      return;
    }

    state.error = '';
    state.message = '';

    for (const entry of entries) {
      const response = await fetchApi('/api/metrics', {
        method: 'POST',
        headers: {
          'x-csrf-token': state.csrfToken
        },
        body: JSON.stringify(entry)
      });

      if (!response.ok) {
        state.error = response.error.message;
        return;
      }
    }

    state.message = `Saved ${entries.length} metrics.`;
    state.batchNote = '';
    await loadDashboard();
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
  });

  const syncAppleHealth = $(async () => {
    if (!state.csrfToken) return;

    state.syncingAppleHealth = true;
    state.error = '';
    state.message = '';

    const response = await fetchApi<{ syncedAt: string; importedMetrics: number }>('/api/applehealth/sync', {
      method: 'POST',
      headers: {
        'x-csrf-token': state.csrfToken
      },
      body: JSON.stringify({
        consent: state.appleConsentTicked
      })
    });

    state.syncingAppleHealth = false;

    if (!response.ok) {
      state.error = response.error.message;
      return;
    }

    state.message = `Apple Health synced (${response.data.importedMetrics} metrics imported).`;
    await loadDashboard();
  });

  useVisibleTask$(async () => {
    await loadDashboard();
  });

  if (!state.authenticated && !state.loading) {
    return (
      <AppShell title="Project Epione" subtitle="Sign in to start logging metrics and simulating interventions.">
        <section class="card card-center">
          <h2>Welcome</h2>
          <p class="muted">
            Build your metric baseline, visualize interconnections, and run before/after intervention simulations.
          </p>
          <div class="actions-row">
            <Link href="/auth/login" class="button">
              Login
            </Link>
            <Link href="/auth/signup" class="button button-ghost">
              Sign up
            </Link>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Dashboard"
      subtitle="Manual logging, suggestions, Apple Health sync, and snapshots."
      userEmail={state.userEmail}
      csrfToken={state.csrfToken}
    >
      {state.loading ? <div class="card">Loading dashboard...</div> : null}

      {state.error ? <div class="banner banner-error">{state.error}</div> : null}
      {state.message ? <div class="banner banner-success">{state.message}</div> : null}

      <section class="grid two-col">
        <div class="card">
          <h3>Current Metrics</h3>
          <div class="metric-grid">
            {METRIC_DEFINITIONS.map((definition) => {
              const latest = state.metrics.find((entry) => entry.metricName === definition.key);
              return (
                <div class="metric-tile" key={definition.key}>
                  <div class="metric-name">{definition.label}</div>
                  <div class="metric-value">{latest ? `${latest.value.toFixed(2)} ${latest.unit}` : 'No data'}</div>
                  <div class="metric-meta">{latest ? new Date(latest.recordedAt).toLocaleString() : 'Log your first value'}</div>
                </div>
              );
            })}
          </div>
          <div class="actions-row">
            <Link href="/graph" class="button button-ghost">
              Open graph
            </Link>
            <Link href="/interventions" class="button button-ghost">
              Explore interventions
            </Link>
          </div>
        </div>

        <div class="card">
          <h3>Rule-Based Suggestions</h3>
          <p class="muted">Top 2-3 suggestions are derived from your latest state.</p>
          {state.suggestions.length ? (
            <div class="suggestion-list">
              {state.suggestions.map((suggestion) => (
                <div key={suggestion.id} class="suggestion-card">
                  <div class="suggestion-goal">Goal: {suggestion.goal.replaceAll('_', ' ')}</div>
                  <p>{suggestion.message}</p>
                  <div class="suggestion-links">
                    {suggestion.suggestedInterventions.map((intervention) => (
                      <a
                        key={intervention}
                        href={`/interventions?select=${intervention}`}
                        class="mini-chip"
                        onClick$={async () => {
                          if (!state.csrfToken) return;
                          await fetchApi('/api/suggestions/click', {
                            method: 'POST',
                            headers: {
                              'x-csrf-token': state.csrfToken
                            },
                            body: JSON.stringify({
                              suggestionId: suggestion.id,
                              route: '/dashboard',
                              interventionId: intervention
                            })
                          });
                        }}
                      >
                        {intervention}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p class="muted">No active rules triggered. Keep logging to improve suggestions.</p>
          )}
        </div>
      </section>

      <section class="grid two-col">
        <div class="card">
          <h3>Log Single Metric</h3>
          <label class="field-label">Metric</label>
          <select
            class="input"
            value={state.singleMetricName}
            onChange$={(event) => {
              const metricName = (event.target as HTMLSelectElement).value as MetricName;
              state.singleMetricName = metricName;
              const latest = state.metrics.find((entry) => entry.metricName === metricName);
              state.singleUnit = latest?.unit ?? METRIC_DEFINITIONS.find((item) => item.key === metricName)?.defaultUnit ?? '';
            }}
          >
            {METRIC_DEFINITIONS.map((definition) => (
              <option key={definition.key} value={definition.key}>
                {definition.label}
              </option>
            ))}
          </select>

          <label class="field-label">Value</label>
          <input class="input" type="number" value={state.singleValue} onInput$={(event) => (state.singleValue = (event.target as HTMLInputElement).value)} />

          <label class="field-label">Unit</label>
          <input class="input" type="text" value={state.singleUnit} onInput$={(event) => (state.singleUnit = (event.target as HTMLInputElement).value)} />

          <label class="field-label">Note (optional)</label>
          <textarea class="input" value={state.singleNote} onInput$={(event) => (state.singleNote = (event.target as HTMLTextAreaElement).value)} />

          <button class="button" type="button" onClick$={submitSingleMetric}>
            Save metric
          </button>
        </div>

        <div class="card">
          <h3>Batch Entry (all metrics)</h3>
          <div class="batch-grid">
            {METRIC_DEFINITIONS.map((definition) => (
              <label class="batch-field" key={definition.key}>
                <span>{definition.label}</span>
                <input
                  class="input"
                  type="number"
                  value={state.batchValues[definition.key] ?? ''}
                  onInput$={(event) => (state.batchValues[definition.key] = (event.target as HTMLInputElement).value)}
                />
              </label>
            ))}
          </div>

          <label class="field-label">Shared note (optional)</label>
          <textarea class="input" value={state.batchNote} onInput$={(event) => (state.batchNote = (event.target as HTMLTextAreaElement).value)} />

          <button class="button" type="button" onClick$={submitBatch}>
            Save batch
          </button>
        </div>
      </section>

      <section class="grid two-col">
        <div class="card">
          <h3>Apple Health Sync</h3>
          <p class="muted">Read-only sync for weight, body fat, RHR, HRV, and sleep metrics.</p>
          <label class="checkbox-row">
            <input
              type="checkbox"
              checked={state.appleConsentTicked}
              onChange$={(event) => (state.appleConsentTicked = (event.target as HTMLInputElement).checked)}
            />
            <span>I consent to importing Apple Health data into this app.</span>
          </label>
          <button class="button" type="button" onClick$={syncAppleHealth} disabled={state.syncingAppleHealth}>
            {state.syncingAppleHealth ? 'Syncing...' : 'Sync Apple Health now'}
          </button>
          <p class="muted">
            Last sync: {state.session?.user.lastAppleHealthSyncAt ? new Date(state.session.user.lastAppleHealthSyncAt).toLocaleString() : 'Never'}
          </p>
        </div>

        <div class="card">
          <h3>Snapshots</h3>
          <p class="muted">Save your current full-state snapshot for later comparison.</p>
          <textarea
            class="input"
            placeholder="Optional note"
            value={state.snapshotNote}
            onInput$={(event) => (state.snapshotNote = (event.target as HTMLTextAreaElement).value)}
          />
          <div class="actions-row">
            <button class="button" type="button" onClick$={saveSnapshot}>
              Save snapshot
            </button>
            <Link href="/snapshots" class="button button-ghost">
              Open snapshot history
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
});
