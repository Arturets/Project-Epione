import { $, component$, useSignal, useStore, useVisibleTask$ } from '@builder.io/qwik';
import { GraphEdgeConfig, GraphNodeConfig } from '../../../config/graph';
import { fetchApi } from '../../../lib/client';
import { fetchSession } from '../../../lib/session-client';
import {
  GraphCustomEdge,
  GraphCustomMetric,
  GraphDomain,
  GraphEdgeDirection,
  GraphEdgeStrength,
  GraphEdgeType,
  GraphNodeTier,
  METRIC_NAMES,
  MetricName
} from '../../../lib/types';

type ConsoleTab = 'interventions' | 'sitemap' | 'stats' | 'graph';

type FormEffect = {
  metric: MetricName;
  changeValue: number;
  unit: string;
  confidence: 'low' | 'moderate' | 'high';
  assumptions: string;
};

type FormState = {
  interventionId: string;
  name: string;
  category: 'strength' | 'cardio' | 'diet' | 'sleep' | 'stress' | 'hybrid';
  durationWeeks: number;
  frequency: string;
  description: string;
  effects: FormEffect[];
  contraindications: Array<{ scenario: string; warning: string }>;
  studySource: {
    url: string;
    title: string;
    authors: string;
    year: number;
    doi: string;
    scrapedAt: string;
  };
};

type DeveloperInterventionVersion = {
  id: string;
  interventionId: string;
  versionNumber: number;
  status: 'draft' | 'published' | 'archived';
  name: string;
  category: 'strength' | 'cardio' | 'diet' | 'sleep' | 'stress' | 'hybrid';
  durationWeeks: number;
  frequency: string;
  description: string;
  effects: Array<{
    metric: MetricName;
    changeValue: number;
    unit: string;
    confidence: 'low' | 'moderate' | 'high';
    assumptions: string;
  }>;
  contraindications: Array<{ scenario: string; warning: string }>;
  studySource: {
    url: string;
    title: string;
    authors: string;
    year: number;
    doi: string;
    scrapedAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

type RouteManifestPayload = {
  routes: Array<{
    id: string;
    path: string;
    title: string;
    role: 'public' | 'customer' | 'coach' | 'admin';
    components: string[];
    linksTo: string[];
    subroutes?: Array<{ id: string; name: string }>;
  }>;
  sharedComponents: Array<{
    id: string;
    role: string;
    appearsIn: string[];
  }>;
};

type StatsResponse = {
  kpis: {
    usersOnline: number;
    metricsLogged: { value: number; trend: { direction: string; deltaPercent: number } };
    interventionsViewed: {
      value: number;
      trend: { direction: string; deltaPercent: number };
      mostSelected: { key: string; count: number } | null;
    };
    snapshotsSaved: { value: number; trend: { direction: string; deltaPercent: number } };
    appleHealthSyncs: { success: number; failed: number };
    pageVisits: { value: number; trend: { direction: string; deltaPercent: number } };
  } | null;
  events: Array<{
    eventType: string;
    count: number;
    percentage: number;
    trend: { direction: string; deltaPercent: number };
  }>;
  metrics: Array<{ metricName: string; count: number; percentage: number }>;
  interventions: Array<{ interventionId: string; views: number; selected: number; conversion: number }>;
  pageTraffic: Array<{ route: string; count: number; percentage: number }>;
  cohorts: Array<{ role: string; users: number; avgSessions: number }>;
};

type DeveloperGraphConfigResponse = {
  baseNodes: GraphNodeConfig[];
  baseEdges: GraphEdgeConfig[];
  customNodes: GraphCustomMetric[];
  customEdges: GraphCustomEdge[];
  nodes: GraphNodeConfig[];
  edges: GraphEdgeConfig[];
};

type GraphJsonImportPayload = {
  mode?: 'append' | 'replace_custom';
  metrics: Array<{
    id: string;
    label: string;
    domain: GraphDomain;
    tier: GraphNodeTier;
    x: number;
    y: number;
    description: string;
  }>;
  edges: Array<{
    id?: string;
    source: string;
    target: string;
    direction: GraphEdgeDirection;
    effectStrength: GraphEdgeStrength;
    type: GraphEdgeType;
    description: string;
  }>;
};

type GraphJsonExportResponse = {
  exportedAt: string;
  base: {
    nodes: GraphNodeConfig[];
    edges: GraphEdgeConfig[];
  };
  custom: {
    metrics: GraphCustomMetric[];
    edges: GraphCustomEdge[];
  };
  merged: {
    nodes: GraphNodeConfig[];
    edges: GraphEdgeConfig[];
  };
  importTemplate: GraphJsonImportPayload;
};

type GraphMetricFormState = {
  id: string;
  label: string;
  domain: GraphDomain;
  tier: GraphNodeTier;
  x: number;
  y: number;
  description: string;
};

type GraphEdgeFormState = {
  id: string;
  source: string;
  target: string;
  direction: GraphEdgeDirection;
  effectStrength: GraphEdgeStrength;
  type: GraphEdgeType;
  description: string;
};

function emptyEffect(): FormEffect {
  return {
    metric: 'weight' as MetricName,
    changeValue: 0,
    unit: 'kg',
    confidence: 'moderate' as const,
    assumptions: ''
  };
}

function emptyContraindication() {
  return {
    scenario: '',
    warning: ''
  };
}

function emptyForm(): FormState {
  return {
    interventionId: 'intervention_new',
    name: '',
    category: 'strength',
    durationWeeks: 8,
    frequency: '3x/week',
    description: '',
    effects: [emptyEffect()],
    contraindications: [] as Array<{ scenario: string; warning: string }>,
    studySource: {
      url: '',
      title: '',
      authors: '',
      year: new Date().getUTCFullYear(),
      doi: '',
      scrapedAt: ''
    }
  };
}

function emptyGraphMetricForm(): GraphMetricFormState {
  return {
    id: '',
    label: '',
    domain: 'metabolic',
    tier: 'supporting',
    x: 640,
    y: 420,
    description: ''
  };
}

function emptyGraphEdgeForm(): GraphEdgeFormState {
  return {
    id: '',
    source: '',
    target: '',
    direction: 'direct',
    effectStrength: 'moderate',
    type: 'correlative',
    description: ''
  };
}

function graphJsonTemplate(): string {
  return JSON.stringify(
    {
      mode: 'append',
      metrics: [],
      edges: []
    } satisfies GraphJsonImportPayload,
    null,
    2
  );
}

export default component$(() => {
  const activeTab = useSignal<ConsoleTab>('interventions');

  const state = useStore({
    loading: true,
    csrfToken: '',
    apiKey: '',
    apiKeyMasked: '',
    keyLoading: false,
    keyError: '',
    message: '',
    error: '',

    versions: [] as DeveloperInterventionVersion[],
    selectedInterventionId: '',
    selectedVersionNumber: 0,
    form: emptyForm(),

    routesManifest: null as RouteManifestPayload | null,
    selectedRouteId: '',

    graphLoading: false,
    graphConfig: null as DeveloperGraphConfigResponse | null,
    graphMetricForm: emptyGraphMetricForm(),
    graphEdgeForm: emptyGraphEdgeForm(),
    graphJsonInput: graphJsonTemplate(),
    graphJsonMode: 'append' as 'append' | 'replace_custom',
    graphJsonBusy: false,

    statsRange: 'last_24h',
    stats: {
      kpis: null,
      events: [],
      metrics: [],
      interventions: [],
      pageTraffic: [],
      cohorts: []
    } as StatsResponse,
    statsLoading: false
  });

  const withAdminHeaders = $((extraHeaders: Record<string, string> = {}) => ({
    ...(state.apiKey ? { 'x-admin-key': state.apiKey } : {}),
    ...extraHeaders
  }));

  const loadAdminKey = $(async () => {
    state.keyLoading = true;
    state.keyError = '';

    const existing = typeof localStorage !== 'undefined' ? localStorage.getItem('developer_admin_key') : null;
    if (existing) {
      state.apiKey = existing;
      state.apiKeyMasked = `••••••••-${existing.slice(-8)}`;
      state.keyLoading = false;
      return;
    }

    const response = await fetchApi<{ apiKey: string; masked: string }>('/api/developer/account/key');
    if (!response.ok) {
      state.keyLoading = false;
      state.keyError = response.error.message;
      return;
    }

    state.apiKey = response.data.apiKey;
    state.apiKeyMasked = response.data.masked;
    localStorage.setItem('developer_admin_key', response.data.apiKey);
    state.keyLoading = false;
  });

  const rotateAdminKey = $(async () => {
    state.keyLoading = true;
    state.keyError = '';

    const response = await fetchApi<{ apiKey: string; masked: string }>('/api/developer/account/key', {
      method: 'POST',
      body: JSON.stringify({})
    });

    if (!response.ok) {
      state.keyLoading = false;
      state.keyError = response.error.message;
      return;
    }

    state.apiKey = response.data.apiKey;
    state.apiKeyMasked = response.data.masked;
    localStorage.setItem('developer_admin_key', response.data.apiKey);
    state.keyLoading = false;
    state.message = 'Admin API key rotated.';
  });

  const hydrateFormFromVersion = $((version: DeveloperInterventionVersion) => {
    state.form.interventionId = version.interventionId;
    state.form.name = version.name;
    state.form.category = version.category;
    state.form.durationWeeks = version.durationWeeks;
    state.form.frequency = version.frequency;
    state.form.description = version.description;
    state.form.effects = version.effects.map((effect) => ({ ...effect }));
    state.form.contraindications = version.contraindications.map((item) => ({ ...item }));
    state.form.studySource = {
      url: version.studySource?.url ?? '',
      title: version.studySource?.title ?? '',
      authors: version.studySource?.authors ?? '',
      year: version.studySource?.year ?? new Date().getUTCFullYear(),
      doi: version.studySource?.doi ?? '',
      scrapedAt: version.studySource?.scrapedAt ?? ''
    };
    state.selectedInterventionId = version.interventionId;
    state.selectedVersionNumber = version.versionNumber;
  });

  const loadVersions = $(async () => {
    if (!state.apiKey) return;

    const response = await fetchApi<DeveloperInterventionVersion[]>('/api/developer/interventions', {
      headers: await withAdminHeaders()
    });

    if (!response.ok) {
      state.error = response.error.message;
      return;
    }

    state.versions = response.data;

    const first = response.data[0];
    if (first && !state.selectedInterventionId) {
      await hydrateFormFromVersion(first);
    }
  });

  const saveDraft = $(async () => {
    if (!state.apiKey) {
      state.error = 'Admin API key is required.';
      return;
    }

    state.error = '';
    state.message = '';

    const payload = {
      interventionId: state.form.interventionId,
      name: state.form.name,
      category: state.form.category,
      durationWeeks: state.form.durationWeeks,
      frequency: state.form.frequency,
      description: state.form.description,
      effects: state.form.effects,
      contraindications: state.form.contraindications,
      studySource: state.form.studySource.url
        ? {
            url: state.form.studySource.url,
            title: state.form.studySource.title,
            authors: state.form.studySource.authors,
            year: state.form.studySource.year,
            doi: state.form.studySource.doi,
            scrapedAt: state.form.studySource.scrapedAt || new Date().toISOString()
          }
        : null
    };

    let response;
    if (state.selectedInterventionId === state.form.interventionId && state.selectedVersionNumber > 0) {
      const selectedVersion = state.versions.find(
        (item) => item.interventionId === state.selectedInterventionId && item.versionNumber === state.selectedVersionNumber
      );

      if (selectedVersion?.status === 'draft') {
        response = await fetchApi<DeveloperInterventionVersion>(
          `/api/developer/interventions/${state.form.interventionId}/v/${state.selectedVersionNumber}`,
          {
            method: 'PUT',
            headers: await withAdminHeaders(),
            body: JSON.stringify(payload)
          }
        );
      } else {
        response = await fetchApi<DeveloperInterventionVersion>('/api/developer/interventions', {
          method: 'POST',
          headers: await withAdminHeaders(),
          body: JSON.stringify(payload)
        });
      }
    } else {
      response = await fetchApi<DeveloperInterventionVersion>('/api/developer/interventions', {
        method: 'POST',
        headers: await withAdminHeaders(),
        body: JSON.stringify(payload)
      });
    }

    if (!response.ok) {
      state.error = response.error.message;
      return;
    }

    state.message = `Draft saved for ${state.form.interventionId}.`;
    await loadVersions();
    await hydrateFormFromVersion(response.data);
  });

  const publishDraft = $(async () => {
    if (!state.apiKey || !state.form.interventionId) {
      state.error = 'Select an intervention first.';
      return;
    }

    const response = await fetchApi<DeveloperInterventionVersion>(`/api/developer/interventions/${state.form.interventionId}/publish`, {
      method: 'POST',
      headers: await withAdminHeaders(),
      body: JSON.stringify({})
    });

    if (!response.ok) {
      state.error = response.error.message;
      return;
    }

    state.message = `Published ${response.data.interventionId} v${response.data.versionNumber}.`;
    await loadVersions();
    await hydrateFormFromVersion(response.data);
  });

  const revertToVersion = $(async (interventionId: string, versionNumber: number) => {
    const response = await fetchApi<{ version: DeveloperInterventionVersion }>(
      `/api/developer/interventions/${interventionId}/revert/${versionNumber}`,
      {
        method: 'POST',
        headers: await withAdminHeaders(),
        body: JSON.stringify({})
      }
    );

    if (!response.ok) {
      state.error = response.error.message;
      return;
    }

    await hydrateFormFromVersion(response.data.version);
    state.message = `Loaded version v${versionNumber} into the editor.`;
  });

  const deleteDraft = $(async (interventionId: string, versionNumber: number) => {
    const response = await fetchApi<DeveloperInterventionVersion>(`/api/developer/interventions/${interventionId}/v/${versionNumber}`, {
      method: 'DELETE',
      headers: await withAdminHeaders()
    });

    if (!response.ok) {
      state.error = response.error.message;
      return;
    }

    state.message = `Deleted draft v${versionNumber}.`;
    await loadVersions();
  });

  const loadRoutesManifest = $(async () => {
    if (!state.apiKey) return;

    const response = await fetchApi<RouteManifestPayload>('/api/developer/routes-manifest', {
      headers: await withAdminHeaders()
    });

    if (!response.ok) {
      state.error = response.error.message;
      return;
    }

    state.routesManifest = response.data;
    if (!state.selectedRouteId && response.data.routes.length) {
      state.selectedRouteId = response.data.routes[0].id;
    }
  });

  const loadGraphConfig = $(async () => {
    if (!state.apiKey) return;
    state.graphLoading = true;

    const response = await fetchApi<DeveloperGraphConfigResponse>('/api/developer/graph/config', {
      headers: await withAdminHeaders()
    });

    if (!response.ok) {
      state.error = response.error.message;
      state.graphLoading = false;
      return;
    }

    state.graphConfig = response.data;

    if (!state.graphEdgeForm.source && response.data.nodes.length) {
      state.graphEdgeForm.source = response.data.nodes[0].id;
    }

    if (!state.graphEdgeForm.target && response.data.nodes.length > 1) {
      state.graphEdgeForm.target = response.data.nodes[1].id;
    }

    state.graphLoading = false;
  });

  const saveGraphMetric = $(async () => {
    if (!state.apiKey) {
      state.error = 'Admin API key is required.';
      return;
    }

    state.error = '';
    state.message = '';

    const payload = {
      id: state.graphMetricForm.id,
      label: state.graphMetricForm.label,
      domain: state.graphMetricForm.domain,
      tier: state.graphMetricForm.tier,
      x: Number(state.graphMetricForm.x),
      y: Number(state.graphMetricForm.y),
      description: state.graphMetricForm.description
    };

    const response = await fetchApi<GraphCustomMetric>('/api/developer/graph/metrics', {
      method: 'POST',
      headers: await withAdminHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      state.error = response.error.message;
      return;
    }

    state.message = `Added graph metric ${response.data.id}.`;
    state.graphMetricForm = emptyGraphMetricForm();
    await loadGraphConfig();
  });

  const removeGraphMetric = $(async (metricId: string) => {
    if (!state.apiKey) {
      state.error = 'Admin API key is required.';
      return;
    }

    state.error = '';
    state.message = '';

    const response = await fetchApi<GraphCustomMetric>(`/api/developer/graph/metrics/${metricId}`, {
      method: 'DELETE',
      headers: await withAdminHeaders()
    });

    if (!response.ok) {
      state.error = response.error.message;
      return;
    }

    state.message = `Removed graph metric ${response.data.id}.`;
    await loadGraphConfig();
  });

  const saveGraphEdge = $(async () => {
    if (!state.apiKey) {
      state.error = 'Admin API key is required.';
      return;
    }

    state.error = '';
    state.message = '';

    const payload = {
      ...(state.graphEdgeForm.id.trim() ? { id: state.graphEdgeForm.id.trim() } : {}),
      source: state.graphEdgeForm.source,
      target: state.graphEdgeForm.target,
      direction: state.graphEdgeForm.direction,
      effectStrength: state.graphEdgeForm.effectStrength,
      type: state.graphEdgeForm.type,
      description: state.graphEdgeForm.description
    };

    const response = await fetchApi<GraphCustomEdge>('/api/developer/graph/edges', {
      method: 'POST',
      headers: await withAdminHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      state.error = response.error.message;
      return;
    }

    state.message = `Added graph edge ${response.data.id}.`;
    state.graphEdgeForm = emptyGraphEdgeForm();
    await loadGraphConfig();
  });

  const removeGraphEdge = $(async (edgeId: string) => {
    if (!state.apiKey) {
      state.error = 'Admin API key is required.';
      return;
    }

    state.error = '';
    state.message = '';

    const response = await fetchApi<GraphCustomEdge>(`/api/developer/graph/edges/${edgeId}`, {
      method: 'DELETE',
      headers: await withAdminHeaders()
    });

    if (!response.ok) {
      state.error = response.error.message;
      return;
    }

    state.message = `Removed graph edge ${response.data.id}.`;
    await loadGraphConfig();
  });

  const importGraphFromJson = $(async () => {
    if (!state.apiKey) {
      state.error = 'Admin API key is required.';
      return;
    }

    state.error = '';
    state.message = '';
    state.graphJsonBusy = true;

    let parsed: unknown;
    try {
      parsed = JSON.parse(state.graphJsonInput);
    } catch {
      state.error = 'JSON import failed: invalid JSON syntax.';
      state.graphJsonBusy = false;
      return;
    }

    if (!parsed || typeof parsed !== 'object') {
      state.error = 'JSON import failed: expected a top-level object.';
      state.graphJsonBusy = false;
      return;
    }

    const body = parsed as Record<string, unknown>;

    const response = await fetchApi<{ mode: 'append' | 'replace_custom'; createdMetrics: number; createdEdges: number }>(
      '/api/developer/graph/import',
      {
        method: 'POST',
        headers: await withAdminHeaders(),
        body: JSON.stringify({
          ...body,
          mode: state.graphJsonMode
        })
      }
    );

    state.graphJsonBusy = false;

    if (!response.ok) {
      state.error = response.error.message;
      return;
    }

    state.message = `Imported ${response.data.createdMetrics} metrics and ${response.data.createdEdges} edges (${response.data.mode}).`;
    await loadGraphConfig();
  });

  const exportGraphAsJson = $(async () => {
    if (!state.apiKey) {
      state.error = 'Admin API key is required.';
      return;
    }

    state.error = '';
    state.message = '';
    state.graphJsonBusy = true;

    const response = await fetchApi<GraphJsonExportResponse>('/api/developer/graph/export', {
      headers: await withAdminHeaders()
    });

    state.graphJsonBusy = false;

    if (!response.ok) {
      state.error = response.error.message;
      return;
    }

    const payloadText = JSON.stringify(response.data, null, 2);
    state.graphJsonInput = JSON.stringify(response.data.importTemplate, null, 2);
    state.graphJsonMode = response.data.importTemplate.mode === 'replace_custom' ? 'replace_custom' : 'append';

    const blob = new Blob([payloadText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `graph-export-${response.data.exportedAt.slice(0, 19).replace(/:/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);

    state.message = 'Graph JSON exported. Import template loaded into the editor.';
  });

  const exportSvg = $(async () => {
    const response = await fetch('/api/developer/routes-manifest/export-svg', {
      method: 'GET',
      headers: {
        'x-admin-key': state.apiKey
      }
    });

    if (!response.ok) {
      state.error = 'Unable to export SVG.';
      return;
    }

    const content = await response.text();
    const blob = new Blob([content], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'routes-manifest.svg';
    link.click();
    URL.revokeObjectURL(url);
  });

  const loadStats = $(async () => {
    if (!state.apiKey) return;
    state.statsLoading = true;

    const periodParams =
      state.statsRange === 'last_24h'
        ? '?start_date=' + new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        : state.statsRange === 'last_7d'
          ? '?start_date=' + new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          : '?start_date=' + new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [kpis, events, metrics, interventions, pageTraffic, cohorts] = await Promise.all([
      fetchApi<StatsResponse['kpis']>(`/api/developer/stats/kpis${periodParams}`, { headers: await withAdminHeaders() }),
      fetchApi<StatsResponse['events']>(`/api/developer/stats/events${periodParams}`, { headers: await withAdminHeaders() }),
      fetchApi<StatsResponse['metrics']>(`/api/developer/stats/metrics-breakdown${periodParams}`, { headers: await withAdminHeaders() }),
      fetchApi<StatsResponse['interventions']>(`/api/developer/stats/interventions-breakdown${periodParams}`, {
        headers: await withAdminHeaders()
      }),
      fetchApi<StatsResponse['pageTraffic']>(`/api/developer/stats/page-traffic${periodParams}`, { headers: await withAdminHeaders() }),
      fetchApi<StatsResponse['cohorts']>(`/api/developer/stats/cohorts${periodParams}`, { headers: await withAdminHeaders() })
    ]);

    if (!kpis.ok || !events.ok || !metrics.ok || !interventions.ok || !pageTraffic.ok || !cohorts.ok) {
      state.error =
        (kpis.ok ? '' : kpis.error.message) ||
        (events.ok ? '' : events.error.message) ||
        (metrics.ok ? '' : metrics.error.message) ||
        (interventions.ok ? '' : interventions.error.message) ||
        (pageTraffic.ok ? '' : pageTraffic.error.message) ||
        (cohorts.ok ? '' : cohorts.error.message);
      state.statsLoading = false;
      return;
    }

    state.stats.kpis = kpis.data;
    state.stats.events = events.data;
    state.stats.metrics = metrics.data;
    state.stats.interventions = interventions.data;
    state.stats.pageTraffic = pageTraffic.data;
    state.stats.cohorts = cohorts.data;
    state.statsLoading = false;
  });

  const generateReport = $(async (format: 'pdf' | 'csv' | 'json') => {
    const response = await fetch(`/api/developer/stats/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': state.apiKey
      },
      body: JSON.stringify({
        period: state.statsRange,
        format,
        sections: ['KPI Summary', 'Event Breakdown Table', 'Top Metrics Logged', 'Top Interventions', 'Page Traffic', 'User Cohorts']
      })
    });

    if (!response.ok) {
      state.error = 'Report generation failed.';
      return;
    }

    if (format === 'json') {
      const payload = await response.json();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'developer-report.json';
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = format === 'csv' ? 'developer-report.csv' : 'developer-report.pdf';
    link.click();
    URL.revokeObjectURL(url);
  });

  useVisibleTask$(async ({ cleanup }) => {
    state.loading = true;
    const session = await fetchSession();

    if (!session.ok) {
      state.error = 'Please sign in with an admin account.';
      state.loading = false;
      return;
    }

    state.csrfToken = session.data.csrfToken;

    await loadAdminKey();

    if (state.apiKey) {
      await Promise.all([loadVersions(), loadRoutesManifest(), loadGraphConfig(), loadStats()]);
    }

    state.loading = false;

    const timer = window.setInterval(async () => {
      if (activeTab.value === 'stats' && state.apiKey) {
        await loadStats();
      }
    }, 30_000);

    cleanup(() => {
      window.clearInterval(timer);
    });
  });

  const groupedVersions = state.versions.reduce(
    (acc, version) => {
      const existing = acc.get(version.interventionId) ?? [];
      existing.push(version);
      existing.sort((a, b) => b.versionNumber - a.versionNumber);
      acc.set(version.interventionId, existing);
      return acc;
    },
    new Map<string, DeveloperInterventionVersion[]>()
  );

  return (
    <div class="grid">
      {state.loading ? <section class="card">Loading developer console...</section> : null}
      {state.message ? <div class="banner banner-success">{state.message}</div> : null}
      {state.error ? <div class="banner banner-error">{state.error}</div> : null}

      <section class="card">
        <div class="section-header-row">
          <div>
            <h3>Developer Access</h3>
            <p class="muted">All developer endpoints require session auth + X-Admin-Key.</p>
          </div>
          <div class="actions-row">
            <span class="muted">{state.apiKeyMasked || 'No key loaded'}</span>
            <button class="button button-ghost" type="button" onClick$={loadAdminKey} disabled={state.keyLoading}>
              Refresh Key
            </button>
            <button class="button button-ghost" type="button" onClick$={rotateAdminKey} disabled={state.keyLoading}>
              Rotate Key
            </button>
          </div>
        </div>
        {state.keyError ? <div class="banner banner-error">{state.keyError}</div> : null}
      </section>

      <section class="card">
        <div class="actions-row">
          <button
            class={`button ${activeTab.value === 'interventions' ? 'button-active' : 'button-ghost'}`}
            type="button"
            onClick$={() => (activeTab.value = 'interventions')}
          >
            Intervention Builder
          </button>
          <button class={`button ${activeTab.value === 'sitemap' ? 'button-active' : 'button-ghost'}`} type="button" onClick$={() => (activeTab.value = 'sitemap')}>
            Site Map
          </button>
          <button class={`button ${activeTab.value === 'stats' ? 'button-active' : 'button-ghost'}`} type="button" onClick$={() => (activeTab.value = 'stats')}>
            Usage Stats
          </button>
          <button
            class={`button ${activeTab.value === 'graph' ? 'button-active' : 'button-ghost'}`}
            type="button"
            onClick$={async () => {
              activeTab.value = 'graph';
              if (!state.graphConfig && state.apiKey) {
                await loadGraphConfig();
              }
            }}
          >
            Graph Metrics
          </button>
        </div>
      </section>

      {activeTab.value === 'interventions' ? (
        <section class="grid two-col">
          <div class="card">
            <h3>Intervention Form</h3>
            <label class="field-label">Intervention ID (slug)</label>
            <input class="input" value={state.form.interventionId} onInput$={(e) => (state.form.interventionId = (e.target as HTMLInputElement).value)} />

            <label class="field-label">Name</label>
            <input class="input" value={state.form.name} onInput$={(e) => (state.form.name = (e.target as HTMLInputElement).value)} />

            <label class="field-label">Category</label>
            <select class="input" value={state.form.category} onChange$={(e) => (state.form.category = (e.target as HTMLSelectElement).value as typeof state.form.category)}>
              <option value="strength">strength</option>
              <option value="cardio">cardio</option>
              <option value="diet">diet</option>
              <option value="sleep">sleep</option>
              <option value="stress">stress</option>
              <option value="hybrid">hybrid</option>
            </select>

            <label class="field-label">Duration (weeks)</label>
            <input
              class="input"
              type="number"
              value={String(state.form.durationWeeks)}
              onInput$={(e) => (state.form.durationWeeks = Number((e.target as HTMLInputElement).value) || 0)}
            />

            <label class="field-label">Frequency</label>
            <input class="input" value={state.form.frequency} onInput$={(e) => (state.form.frequency = (e.target as HTMLInputElement).value)} />

            <label class="field-label">Description</label>
            <textarea
              class="input"
              rows={4}
              value={state.form.description}
              onInput$={(e) => (state.form.description = (e.target as HTMLTextAreaElement).value)}
            />

            <h4>Study Source (optional)</h4>
            <input class="input" placeholder="URL" value={state.form.studySource.url} onInput$={(e) => (state.form.studySource.url = (e.target as HTMLInputElement).value)} />
            <input
              class="input"
              placeholder="Title"
              value={state.form.studySource.title}
              onInput$={(e) => (state.form.studySource.title = (e.target as HTMLInputElement).value)}
            />
            <input
              class="input"
              placeholder="Authors"
              value={state.form.studySource.authors}
              onInput$={(e) => (state.form.studySource.authors = (e.target as HTMLInputElement).value)}
            />
            <div class="actions-row">
              <input
                class="input input-compact"
                type="number"
                value={String(state.form.studySource.year)}
                onInput$={(e) => (state.form.studySource.year = Number((e.target as HTMLInputElement).value) || new Date().getUTCFullYear())}
              />
              <input class="input" placeholder="DOI" value={state.form.studySource.doi} onInput$={(e) => (state.form.studySource.doi = (e.target as HTMLInputElement).value)} />
            </div>

            <h4>Effects</h4>
            {state.form.effects.map((effect, index) => (
              <div key={`${effect.metric}-${index}`} class="metric-grid">
                <select class="input" value={effect.metric} onChange$={(e) => (effect.metric = (e.target as HTMLSelectElement).value as MetricName)}>
                  {METRIC_NAMES.map((metricName) => (
                    <option key={metricName} value={metricName}>
                      {metricName}
                    </option>
                  ))}
                </select>
                <input
                  class="input"
                  type="number"
                  value={String(effect.changeValue)}
                  onInput$={(e) => (effect.changeValue = Number((e.target as HTMLInputElement).value) || 0)}
                />
                <input class="input" value={effect.unit} onInput$={(e) => (effect.unit = (e.target as HTMLInputElement).value)} />
                <select class="input" value={effect.confidence} onChange$={(e) => (effect.confidence = (e.target as HTMLSelectElement).value as typeof effect.confidence)}>
                  <option value="low">low</option>
                  <option value="moderate">moderate</option>
                  <option value="high">high</option>
                </select>
                <input class="input" value={effect.assumptions} onInput$={(e) => (effect.assumptions = (e.target as HTMLInputElement).value)} />
                <button
                  class="button button-ghost"
                  type="button"
                  onClick$={() => {
                    state.form.effects.splice(index, 1);
                    if (!state.form.effects.length) {
                      state.form.effects.push(emptyEffect());
                    }
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            <button class="button button-ghost" type="button" onClick$={() => state.form.effects.push(emptyEffect())}>
              + Add Effect
            </button>

            <h4>Contraindications</h4>
            {state.form.contraindications.map((item, index) => (
              <div key={`${item.scenario}-${index}`} class="grid">
                <input class="input" placeholder="Scenario" value={item.scenario} onInput$={(e) => (item.scenario = (e.target as HTMLInputElement).value)} />
                <textarea class="input" placeholder="Warning" rows={2} value={item.warning} onInput$={(e) => (item.warning = (e.target as HTMLTextAreaElement).value)} />
                <button class="button button-ghost" type="button" onClick$={() => state.form.contraindications.splice(index, 1)}>
                  Remove
                </button>
              </div>
            ))}
            <button class="button button-ghost" type="button" onClick$={() => state.form.contraindications.push(emptyContraindication())}>
              + Add Contraindication
            </button>

            <div class="actions-row">
              <button class="button" type="button" onClick$={saveDraft}>
                Save Draft
              </button>
              <button class="button" type="button" onClick$={publishDraft}>
                Publish
              </button>
            </div>
          </div>

          <div class="card">
            <h3>Version History</h3>
            {Array.from(groupedVersions.entries()).map(([interventionId, history]) => (
              <div key={interventionId} class="card">
                <div class="section-header-row">
                  <strong>{interventionId}</strong>
                  <button class="button button-ghost" type="button" onClick$={() => hydrateFormFromVersion(history[0])}>
                    Open Latest
                  </button>
                </div>
                <div class="table-wrap">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Version</th>
                        <th>Status</th>
                        <th>Updated</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((version) => (
                        <tr key={version.id}>
                          <td>v{version.versionNumber}</td>
                          <td>{version.status}</td>
                          <td>{new Date(version.updatedAt).toLocaleString()}</td>
                          <td>
                            <div class="actions-row">
                              <button class="button button-ghost" type="button" onClick$={() => hydrateFormFromVersion(version)}>
                                View
                              </button>
                              <button class="button button-ghost" type="button" onClick$={() => revertToVersion(version.interventionId, version.versionNumber)}>
                                Revert
                              </button>
                              {version.status === 'draft' ? (
                                <button class="button button-ghost" type="button" onClick$={() => deleteDraft(version.interventionId, version.versionNumber)}>
                                  Delete
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab.value === 'sitemap' ? (
        <section class="grid two-col">
          <div class="card">
            <div class="section-header-row">
              <h3>Hierarchy View</h3>
              <button class="button button-ghost" type="button" onClick$={exportSvg}>
                Export as SVG
              </button>
            </div>
            {!state.routesManifest ? <p class="muted">Loading route manifest...</p> : null}
            {state.routesManifest ? (
              <div class="grid">
                {['public', 'customer', 'coach', 'admin'].map((role) => (
                  <div key={role} class="card">
                    <strong>{role.toUpperCase()}</strong>
                    <ul class="simple-list">
                      {state.routesManifest!.routes
                        .filter((route) => route.role === role)
                        .map((route) => (
                          <li key={route.id}>
                            <button class="button button-ghost" type="button" onClick$={() => (state.selectedRouteId = route.id)}>
                              {route.title} ({route.path})
                            </button>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div class="card">
            <h3>Cross-Links Graph View</h3>
            {state.routesManifest ? (
              <svg class="graph-svg" viewBox="0 0 980 520" role="img" aria-label="Routes graph">
                <defs>
                  <marker id="route-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3.5" orient="auto">
                    <polygon points="0 0, 8 3.5, 0 7" fill="var(--route-arrow)" />
                  </marker>
                </defs>
                {state.routesManifest.routes.map((route, index) => {
                  const x = 40 + (index % 4) * 230;
                  const y = 40 + Math.floor(index / 4) * 120;
                  return (
                    <g key={route.id}>
                      <rect
                        x={x}
                        y={y}
                        width={190}
                        height={68}
                        rx={10}
                        fill={state.selectedRouteId === route.id ? 'var(--route-node-selected-fill)' : 'var(--route-node-fill)'}
                        stroke="var(--route-node-stroke)"
                      />
                      <text x={x + 10} y={y + 24} font-size="12" fill="var(--route-node-title)">
                        {route.title}
                      </text>
                      <text x={x + 10} y={y + 44} font-size="10" fill="var(--route-node-subtitle)">
                        {route.path}
                      </text>
                    </g>
                  );
                })}

                {state.routesManifest.routes.flatMap((route, index) => {
                  const sourceX = 40 + (index % 4) * 230 + 190;
                  const sourceY = 40 + Math.floor(index / 4) * 120 + 34;

                  return route.linksTo.map((targetId) => {
                    const targetIndex = state.routesManifest!.routes.findIndex((item) => item.id === targetId);
                    if (targetIndex < 0) return null;
                    const targetX = 40 + (targetIndex % 4) * 230;
                    const targetY = 40 + Math.floor(targetIndex / 4) * 120 + 34;
                    return (
                      <path
                        key={`${route.id}-${targetId}`}
                        d={`M ${sourceX} ${sourceY} C ${sourceX + 35} ${sourceY}, ${targetX - 35} ${targetY}, ${targetX} ${targetY}`}
                        stroke={state.selectedRouteId === route.id ? 'var(--route-link-selected)' : 'var(--route-link)'}
                        stroke-width="1.2"
                        fill="none"
                        marker-end="url(#route-arrow)"
                      />
                    );
                  });
                })}
              </svg>
            ) : (
              <p class="muted">Loading graph...</p>
            )}

            {state.selectedRouteId && state.routesManifest ? (
              <div class="card">
                <strong>Selected Route</strong>
                {(() => {
                  const route = state.routesManifest?.routes.find((entry) => entry.id === state.selectedRouteId);
                  if (!route) return <p class="muted">Route not found.</p>;
                  return (
                    <>
                      <p>{route.title}</p>
                      <p class="muted">Links to: {route.linksTo.join(', ') || 'none'}</p>
                      <p class="muted">Components: {route.components.join(', ') || 'none'}</p>
                    </>
                  );
                })()}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {activeTab.value === 'graph' ? (
        <section class="grid two-col">
          <div class="card">
            <div class="section-header-row">
              <div>
                <h3>Add Graph Metric</h3>
                <p class="muted">Create custom nodes for new physiological metrics on the graph.</p>
              </div>
              <button class="button button-ghost" type="button" onClick$={loadGraphConfig} disabled={state.graphLoading}>
                Refresh Graph Data
              </button>
            </div>

            {state.graphConfig ? (
              <p class="small muted">
                Base nodes: {state.graphConfig.baseNodes.length} • Custom nodes: {state.graphConfig.customNodes.length} • Total nodes: {state.graphConfig.nodes.length}
              </p>
            ) : null}
            {state.graphLoading ? <p class="muted">Loading graph configuration...</p> : null}

            <label class="field-label">Metric ID (lowercase + underscores)</label>
            <input class="input" value={state.graphMetricForm.id} onInput$={(e) => (state.graphMetricForm.id = (e.target as HTMLInputElement).value)} />

            <label class="field-label">Label</label>
            <input class="input" value={state.graphMetricForm.label} onInput$={(e) => (state.graphMetricForm.label = (e.target as HTMLInputElement).value)} />

            <div class="metric-grid">
              <div>
                <label class="field-label">Domain</label>
                <select
                  class="input"
                  value={state.graphMetricForm.domain}
                  onChange$={(e) => (state.graphMetricForm.domain = (e.target as HTMLSelectElement).value as GraphDomain)}
                >
                  <option value="cardiovascular">cardiovascular</option>
                  <option value="respiratory">respiratory</option>
                  <option value="nervous">nervous</option>
                  <option value="metabolic">metabolic</option>
                  <option value="musculoskeletal">musculoskeletal</option>
                  <option value="recovery">recovery</option>
                </select>
              </div>

              <div>
                <label class="field-label">Tier</label>
                <select class="input" value={state.graphMetricForm.tier} onChange$={(e) => (state.graphMetricForm.tier = (e.target as HTMLSelectElement).value as GraphNodeTier)}>
                  <option value="core">core</option>
                  <option value="supporting">supporting</option>
                </select>
              </div>

              <div>
                <label class="field-label">X</label>
                <input
                  class="input"
                  type="number"
                  value={String(state.graphMetricForm.x)}
                  onInput$={(e) => (state.graphMetricForm.x = Number((e.target as HTMLInputElement).value) || 0)}
                />
              </div>

              <div>
                <label class="field-label">Y</label>
                <input
                  class="input"
                  type="number"
                  value={String(state.graphMetricForm.y)}
                  onInput$={(e) => (state.graphMetricForm.y = Number((e.target as HTMLInputElement).value) || 0)}
                />
              </div>
            </div>

            <label class="field-label">Description</label>
            <textarea
              class="input"
              rows={3}
              value={state.graphMetricForm.description}
              onInput$={(e) => (state.graphMetricForm.description = (e.target as HTMLTextAreaElement).value)}
            />

            <div class="actions-row">
              <button class="button" type="button" onClick$={saveGraphMetric}>
                Add Metric
              </button>
              <button class="button button-ghost" type="button" onClick$={() => (state.graphMetricForm = emptyGraphMetricForm())}>
                Reset
              </button>
            </div>
          </div>

          <div class="card">
            <h3>Add Graph Edge</h3>
            <p class="muted">Create custom links between existing graph nodes.</p>

            {state.graphConfig ? (
              <p class="small muted">
                Base edges: {state.graphConfig.baseEdges.length} • Custom edges: {state.graphConfig.customEdges.length} • Total edges: {state.graphConfig.edges.length}
              </p>
            ) : null}

            <label class="field-label">Edge ID (optional)</label>
            <input class="input" value={state.graphEdgeForm.id} onInput$={(e) => (state.graphEdgeForm.id = (e.target as HTMLInputElement).value)} />

            <div class="metric-grid">
              <div>
                <label class="field-label">Source</label>
                <select class="input" value={state.graphEdgeForm.source} onChange$={(e) => (state.graphEdgeForm.source = (e.target as HTMLSelectElement).value)}>
                  {(state.graphConfig?.nodes ?? []).map((node) => (
                    <option key={`source-${node.id}`} value={node.id}>
                      {`${node.label} (${node.id})`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label class="field-label">Target</label>
                <select class="input" value={state.graphEdgeForm.target} onChange$={(e) => (state.graphEdgeForm.target = (e.target as HTMLSelectElement).value)}>
                  {(state.graphConfig?.nodes ?? []).map((node) => (
                    <option key={`target-${node.id}`} value={node.id}>
                      {`${node.label} (${node.id})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div class="metric-grid">
              <div>
                <label class="field-label">Direction</label>
                <select
                  class="input"
                  value={state.graphEdgeForm.direction}
                  onChange$={(e) => (state.graphEdgeForm.direction = (e.target as HTMLSelectElement).value as GraphEdgeDirection)}
                >
                  <option value="direct">direct</option>
                  <option value="inverse">inverse</option>
                </select>
              </div>
              <div>
                <label class="field-label">Strength</label>
                <select
                  class="input"
                  value={state.graphEdgeForm.effectStrength}
                  onChange$={(e) => (state.graphEdgeForm.effectStrength = (e.target as HTMLSelectElement).value as GraphEdgeStrength)}
                >
                  <option value="low">low</option>
                  <option value="moderate">moderate</option>
                  <option value="high">high</option>
                </select>
              </div>
              <div>
                <label class="field-label">Type</label>
                <select class="input" value={state.graphEdgeForm.type} onChange$={(e) => (state.graphEdgeForm.type = (e.target as HTMLSelectElement).value as GraphEdgeType)}>
                  <option value="causal">causal</option>
                  <option value="correlative">correlative</option>
                </select>
              </div>
            </div>

            <label class="field-label">Description</label>
            <textarea
              class="input"
              rows={3}
              value={state.graphEdgeForm.description}
              onInput$={(e) => (state.graphEdgeForm.description = (e.target as HTMLTextAreaElement).value)}
            />

            <div class="actions-row">
              <button class="button" type="button" onClick$={saveGraphEdge}>
                Add Edge
              </button>
              <button class="button button-ghost" type="button" onClick$={() => (state.graphEdgeForm = emptyGraphEdgeForm())}>
                Reset
              </button>
            </div>
          </div>

          <div class="card">
            <h3>Graph JSON Import / Export</h3>
            <p class="muted">Batch create custom metrics and edges from JSON, or export current graph JSON.</p>

            <label class="field-label">Import mode</label>
            <select class="input" value={state.graphJsonMode} onChange$={(e) => (state.graphJsonMode = (e.target as HTMLSelectElement).value as 'append' | 'replace_custom')}>
              <option value="append">append (keep existing custom graph)</option>
              <option value="replace_custom">replace_custom (clear existing custom graph first)</option>
            </select>

            <label class="field-label">JSON payload</label>
            <textarea
              class="input"
              rows={14}
              value={state.graphJsonInput}
              onInput$={(e) => (state.graphJsonInput = (e.target as HTMLTextAreaElement).value)}
            />

            <div class="actions-row">
              <button class="button" type="button" onClick$={importGraphFromJson} disabled={state.graphJsonBusy}>
                Import JSON
              </button>
              <button class="button button-ghost" type="button" onClick$={exportGraphAsJson} disabled={state.graphJsonBusy}>
                Export JSON
              </button>
              <button class="button button-ghost" type="button" onClick$={() => (state.graphJsonInput = graphJsonTemplate())} disabled={state.graphJsonBusy}>
                Load Template
              </button>
            </div>

            <p class="small muted">Expected payload shape: {`{ "metrics": [...], "edges": [...] }`}</p>
          </div>

          <div class="card table-wrap">
            <h3>Custom Metrics</h3>
            {!state.graphConfig?.customNodes.length ? <p class="muted">No custom metrics added yet.</p> : null}
            {state.graphConfig?.customNodes.length ? (
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Label</th>
                    <th>Tier</th>
                    <th>Domain</th>
                    <th>Pos</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {state.graphConfig.customNodes.map((metric) => (
                    <tr key={metric.id}>
                      <td>{metric.id}</td>
                      <td>{metric.label}</td>
                      <td>{metric.tier}</td>
                      <td>{metric.domain}</td>
                      <td>
                        {metric.x}, {metric.y}
                      </td>
                      <td>
                        <button class="button button-ghost" type="button" onClick$={() => removeGraphMetric(metric.id)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>

          <div class="card table-wrap">
            <h3>Custom Edges</h3>
            {!state.graphConfig?.customEdges.length ? <p class="muted">No custom edges added yet.</p> : null}
            {state.graphConfig?.customEdges.length ? (
              <table class="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Link</th>
                    <th>Type</th>
                    <th>Strength</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {state.graphConfig.customEdges.map((edge) => (
                    <tr key={edge.id}>
                      <td>{edge.id}</td>
                      <td>
                        {edge.source} → {edge.target}
                      </td>
                      <td>
                        {edge.type} ({edge.direction})
                      </td>
                      <td>{edge.effectStrength}</td>
                      <td>
                        <button class="button button-ghost" type="button" onClick$={() => removeGraphEdge(edge.id)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
        </section>
      ) : null}

      {activeTab.value === 'stats' ? (
        <section class="grid">
          <div class="card">
            <div class="section-header-row">
              <h3>Real-Time Analytics</h3>
              <div class="actions-row">
                <select class="input input-compact" value={state.statsRange} onChange$={(e) => (state.statsRange = (e.target as HTMLSelectElement).value)}>
                  <option value="last_24h">Last 24h</option>
                  <option value="last_7d">Last 7d</option>
                  <option value="last_30d">Last 30d</option>
                </select>
                <button class="button button-ghost" type="button" onClick$={loadStats}>
                  Refresh
                </button>
                <button class="button button-ghost" type="button" onClick$={() => generateReport('pdf')}>
                  Report PDF
                </button>
                <button class="button button-ghost" type="button" onClick$={() => generateReport('csv')}>
                  Report CSV
                </button>
                <button class="button button-ghost" type="button" onClick$={() => generateReport('json')}>
                  Report JSON
                </button>
              </div>
            </div>
            {state.statsLoading ? <p class="muted">Refreshing stats...</p> : null}

            {state.stats.kpis ? (
              <div class="metric-grid">
                <div class="metric-tile">
                  <div class="metric-name">Users Online</div>
                  <div class="metric-value">{state.stats.kpis.usersOnline}</div>
                </div>
                <div class="metric-tile">
                  <div class="metric-name">Metrics Logged</div>
                  <div class="metric-value">{state.stats.kpis.metricsLogged.value}</div>
                </div>
                <div class="metric-tile">
                  <div class="metric-name">Intervention Views</div>
                  <div class="metric-value">{state.stats.kpis.interventionsViewed.value}</div>
                </div>
                <div class="metric-tile">
                  <div class="metric-name">Snapshots Saved</div>
                  <div class="metric-value">{state.stats.kpis.snapshotsSaved.value}</div>
                </div>
                <div class="metric-tile">
                  <div class="metric-name">Apple Sync Success/Fail</div>
                  <div class="metric-value">
                    {state.stats.kpis.appleHealthSyncs.success}/{state.stats.kpis.appleHealthSyncs.failed}
                  </div>
                </div>
                <div class="metric-tile">
                  <div class="metric-name">Page Visits</div>
                  <div class="metric-value">{state.stats.kpis.pageVisits.value}</div>
                </div>
              </div>
            ) : null}
          </div>

          <div class="grid two-col">
            <div class="card table-wrap">
              <h4>Event Breakdown</h4>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Count</th>
                    <th>%</th>
                    <th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {state.stats.events.map((row) => (
                    <tr key={row.eventType}>
                      <td>{row.eventType}</td>
                      <td>{row.count}</td>
                      <td>{row.percentage}</td>
                      <td>
                        {row.trend.direction} ({row.trend.deltaPercent}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div class="card table-wrap">
              <h4>Top Metrics Logged</h4>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Count</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {state.stats.metrics.map((row) => (
                    <tr key={row.metricName}>
                      <td>{row.metricName}</td>
                      <td>{row.count}</td>
                      <td>{row.percentage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div class="card table-wrap">
              <h4>Top Interventions</h4>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Intervention</th>
                    <th>Views</th>
                    <th>Selected</th>
                    <th>Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {state.stats.interventions.map((row) => (
                    <tr key={row.interventionId}>
                      <td>{row.interventionId}</td>
                      <td>{row.views}</td>
                      <td>{row.selected}</td>
                      <td>{row.conversion}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div class="card table-wrap">
              <h4>Page Traffic</h4>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Route</th>
                    <th>Visits</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {state.stats.pageTraffic.map((row) => (
                    <tr key={row.route}>
                      <td>{row.route}</td>
                      <td>{row.count}</td>
                      <td>{row.percentage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div class="card table-wrap">
              <h4>User Cohorts</h4>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Users</th>
                    <th>Avg sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {state.stats.cohorts.map((row) => (
                    <tr key={row.role}>
                      <td>{row.role}</td>
                      <td>{row.users}</td>
                      <td>{row.avgSessions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
});
