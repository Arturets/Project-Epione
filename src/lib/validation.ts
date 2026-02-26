import { ApiError } from './http';
import {
  Contraindication,
  DISTANCE_UNITS,
  GraphCustomEdge,
  GraphCustomMetric,
  GraphDomain,
  Intervention,
  InterventionEffect,
  InterventionVersion,
  METRIC_NAMES,
  MetricName,
  WEIGHT_UNITS
} from './types';
import { isMetricName, toNumber } from './utils';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GRAPH_NODE_ID_REGEX = /^[a-z0-9_]+$/;

export type SignupPayload = {
  email: string;
  password: string;
};

export function parseSignupPayload(raw: unknown): SignupPayload {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError(400, 'Request body must be an object', 'invalid_body');
  }

  const body = raw as Record<string, unknown>;
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!EMAIL_REGEX.test(email)) {
    throw new ApiError(400, 'Invalid email address', 'invalid_email');
  }

  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters', 'invalid_password');
  }

  return { email, password };
}

export type LoginPayload = {
  email: string;
  password: string;
};

export function parseLoginPayload(raw: unknown): LoginPayload {
  return parseSignupPayload(raw);
}

export type TwoFactorCodePayload = {
  code: string;
};

export function parseTwoFactorCodePayload(raw: unknown): TwoFactorCodePayload {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError(400, 'Request body must be an object', 'invalid_body');
  }

  const body = raw as Record<string, unknown>;
  const code = typeof body.code === 'string' ? body.code.trim() : '';

  if (!/^\d{6}$/.test(code)) {
    throw new ApiError(400, '2FA code must be a 6-digit number', 'invalid_two_factor_code');
  }

  return { code };
}

export type TwoFactorVerifyPayload = {
  challengeId: string;
  code: string;
};

export function parseTwoFactorVerifyPayload(raw: unknown): TwoFactorVerifyPayload {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError(400, 'Request body must be an object', 'invalid_body');
  }

  const body = raw as Record<string, unknown>;
  const challengeId =
    typeof body.challenge_id === 'string'
      ? body.challenge_id.trim()
      : typeof body.challengeId === 'string'
        ? body.challengeId.trim()
        : '';

  const code = typeof body.code === 'string' ? body.code.trim() : '';

  if (!challengeId) {
    throw new ApiError(400, 'challengeId is required', 'invalid_two_factor_challenge');
  }

  if (!/^\d{6}$/.test(code) && !/^[A-Z0-9]{8,16}$/.test(code.toUpperCase())) {
    throw new ApiError(400, 'Provide a valid 2FA code or recovery code', 'invalid_two_factor_code');
  }

  return {
    challengeId,
    code
  };
}

export type MetricUpsertPayload = {
  metricName: MetricName;
  value: number;
  unit: string;
  note: string | null;
  recordedAt: string;
  syncedFrom: 'manual' | 'apple_health' | null;
};

export function parseMetricUpsertPayload(raw: unknown): MetricUpsertPayload {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError(400, 'Request body must be an object', 'invalid_body');
  }

  const body = raw as Record<string, unknown>;
  const metricNameRaw = typeof body.metric_name === 'string' ? body.metric_name : body.metricName;
  const unit = typeof body.unit === 'string' ? body.unit.trim() : '';
  const recordedAtRaw = typeof body.recorded_at === 'string' ? body.recorded_at : body.recordedAt;
  const noteRaw = typeof body.note === 'string' ? body.note : null;
  const syncedFromRaw =
    body.synced_from === 'apple_health' || body.syncedFrom === 'apple_health' ? 'apple_health' : 'manual';

  if (typeof metricNameRaw !== 'string' || !isMetricName(metricNameRaw)) {
    throw new ApiError(400, 'metric_name must be a valid metric name', 'invalid_metric_name');
  }

  const value = toNumber(body.value);
  if (value === null) {
    throw new ApiError(400, 'value must be numeric', 'invalid_metric_value');
  }

  const recordedAt = recordedAtRaw && typeof recordedAtRaw === 'string' ? recordedAtRaw : new Date().toISOString();
  const parsedRecordedAt = new Date(recordedAt);
  if (Number.isNaN(parsedRecordedAt.getTime())) {
    throw new ApiError(400, 'recorded_at must be an ISO timestamp', 'invalid_recorded_at');
  }

  if (!unit) {
    throw new ApiError(400, 'unit is required', 'invalid_unit');
  }

  return {
    metricName: metricNameRaw,
    value,
    unit,
    note: noteRaw,
    recordedAt: parsedRecordedAt.toISOString(),
    syncedFrom: syncedFromRaw
  };
}

export function parseSnapshotPayload(raw: unknown): { userNote: string | null } {
  if (!raw || typeof raw !== 'object') {
    return { userNote: null };
  }

  const body = raw as Record<string, unknown>;
  const userNote = typeof body.user_note === 'string' ? body.user_note : typeof body.userNote === 'string' ? body.userNote : null;
  return { userNote: userNote?.trim() ? userNote.trim() : null };
}

export type SimulatePayload = {
  selectedInterventionIds: string[];
};

export function parseSimulatePayload(raw: unknown): SimulatePayload {
  if (!raw || typeof raw !== 'object') {
    return { selectedInterventionIds: [] };
  }

  const body = raw as Record<string, unknown>;
  const value = body.selectedInterventions ?? body.selected_interventions ?? body.selectedInterventionIds;

  if (!Array.isArray(value)) {
    return { selectedInterventionIds: [] };
  }

  return {
    selectedInterventionIds: value.filter((item): item is string => typeof item === 'string')
  };
}

export function parseSettingsPayload(raw: unknown): { weightUnit?: 'kg' | 'lbs'; distanceUnit?: 'km' | 'mi' } {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError(400, 'Request body must be an object', 'invalid_body');
  }

  const body = raw as Record<string, unknown>;
  const weightUnit = typeof body.weight_unit === 'string' ? body.weight_unit : body.weightUnit;
  const distanceUnit = typeof body.distance_unit === 'string' ? body.distance_unit : body.distanceUnit;

  const out: { weightUnit?: 'kg' | 'lbs'; distanceUnit?: 'km' | 'mi' } = {};

  if (typeof weightUnit === 'string') {
    if (!(WEIGHT_UNITS as readonly string[]).includes(weightUnit)) {
      throw new ApiError(400, 'weight_unit must be kg or lbs', 'invalid_weight_unit');
    }
    out.weightUnit = weightUnit as 'kg' | 'lbs';
  }

  if (typeof distanceUnit === 'string') {
    if (!(DISTANCE_UNITS as readonly string[]).includes(distanceUnit)) {
      throw new ApiError(400, 'distance_unit must be km or mi', 'invalid_distance_unit');
    }
    out.distanceUnit = distanceUnit as 'km' | 'mi';
  }

  if (!out.weightUnit && !out.distanceUnit) {
    throw new ApiError(400, 'At least one setting is required', 'invalid_settings_update');
  }

  return out;
}

export function parseHistoryMetricName(metricName: string): MetricName {
  if (!(METRIC_NAMES as readonly string[]).includes(metricName)) {
    throw new ApiError(400, 'Invalid metric name', 'invalid_metric_name');
  }
  return metricName as MetricName;
}

export type InterventionVersionPayload = {
  interventionId: string;
  name: string;
  category: Intervention['category'];
  durationWeeks: number;
  frequency: string;
  description: string;
  effects: InterventionEffect[];
  contraindications: Contraindication[];
  studySource: InterventionVersion['studySource'];
};

export function parseInterventionVersionPayload(raw: unknown): InterventionVersionPayload {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError(400, 'Request body must be an object', 'invalid_body');
  }

  const body = raw as Record<string, unknown>;
  const interventionId = normalizeString(body.intervention_id ?? body.interventionId);
  const name = normalizeString(body.name);
  const category = normalizeString(body.category);
  const frequency = normalizeString(body.frequency);
  const description = normalizeString(body.description);
  const durationWeeks = toNumber(body.duration_weeks ?? body.durationWeeks);
  const effectsRaw = Array.isArray(body.effects) ? body.effects : [];
  const contraindicationsRaw =
    Array.isArray(body.contraindications) ? body.contraindications : Array.isArray(body.contraindication) ? body.contraindication : [];

  const supportedCategories: Intervention['category'][] = ['strength', 'cardio', 'diet', 'sleep', 'stress', 'hybrid'];

  if (!interventionId) {
    throw new ApiError(400, 'intervention_id is required', 'invalid_intervention_id');
  }
  if (!name) {
    throw new ApiError(400, 'name is required', 'invalid_intervention_name');
  }
  if (!supportedCategories.includes(category as Intervention['category'])) {
    throw new ApiError(400, 'category is invalid', 'invalid_intervention_category');
  }
  if (!durationWeeks || durationWeeks <= 0) {
    throw new ApiError(400, 'duration_weeks must be a positive number', 'invalid_duration_weeks');
  }
  if (!frequency) {
    throw new ApiError(400, 'frequency is required', 'invalid_intervention_frequency');
  }
  if (!description) {
    throw new ApiError(400, 'description is required', 'invalid_intervention_description');
  }

  const effects = effectsRaw.map(parseInterventionEffect);
  if (!effects.length) {
    throw new ApiError(400, 'effects must contain at least one item', 'invalid_intervention_effects');
  }

  const contraindications = contraindicationsRaw.map(parseContraindication);
  const studySource = parseStudySource(body.study_source ?? body.studySource);

  return {
    interventionId,
    name,
    category: category as Intervention['category'],
    durationWeeks,
    frequency,
    description,
    effects,
    contraindications,
    studySource
  };
}

export type DeveloperReportPayload = {
  period: string;
  format: 'pdf' | 'csv' | 'json';
  sections: string[];
};

export function parseDeveloperReportPayload(raw: unknown): DeveloperReportPayload {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError(400, 'Request body must be an object', 'invalid_body');
  }

  const body = raw as Record<string, unknown>;
  const period = normalizeString(body.period) || 'last_30d';
  const format = normalizeString(body.format).toLowerCase();
  const sectionsRaw = Array.isArray(body.sections) ? body.sections : [];
  const sections = sectionsRaw.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);

  if (!['pdf', 'csv', 'json'].includes(format)) {
    throw new ApiError(400, 'format must be one of: pdf, csv, json', 'invalid_report_format');
  }

  return {
    period,
    format: format as 'pdf' | 'csv' | 'json',
    sections
  };
}

export type GraphMetricPayload = Omit<GraphCustomMetric, 'createdBy' | 'createdAt' | 'updatedAt'>;

export function parseGraphMetricPayload(raw: unknown): GraphMetricPayload {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError(400, 'Request body must be an object', 'invalid_body');
  }

  const body = raw as Record<string, unknown>;
  const id = normalizeString(body.id).toLowerCase();
  const label = normalizeString(body.label);
  const description = normalizeString(body.description);
  const domain = normalizeString(body.domain) as GraphDomain;
  const tierRaw = normalizeString(body.tier);
  const x = toNumber(body.x);
  const y = toNumber(body.y);

  const validDomains: GraphDomain[] = ['cardiovascular', 'respiratory', 'nervous', 'metabolic', 'musculoskeletal', 'recovery'];

  if (!id || !GRAPH_NODE_ID_REGEX.test(id)) {
    throw new ApiError(400, 'id must be lowercase alphanumeric plus underscores', 'graph_metric_invalid_id');
  }

  if (!label) {
    throw new ApiError(400, 'label is required', 'graph_metric_invalid_label');
  }

  if (!description) {
    throw new ApiError(400, 'description is required', 'graph_metric_invalid_description');
  }

  if (!validDomains.includes(domain)) {
    throw new ApiError(400, 'domain is invalid', 'graph_metric_invalid_domain');
  }

  if (x === null || y === null) {
    throw new ApiError(400, 'x and y must be numeric', 'graph_metric_invalid_position');
  }

  const tier: GraphCustomMetric['tier'] = tierRaw === 'core' ? 'core' : 'supporting';

  return {
    id,
    label,
    description,
    domain,
    tier,
    x,
    y
  };
}

export type GraphEdgePayload = {
  id?: string;
  source: string;
  target: string;
  direction: GraphCustomEdge['direction'];
  effectStrength: GraphCustomEdge['effectStrength'];
  type: GraphCustomEdge['type'];
  description: string;
};

export function parseGraphEdgePayload(raw: unknown): GraphEdgePayload {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError(400, 'Request body must be an object', 'invalid_body');
  }

  const body = raw as Record<string, unknown>;
  const id = normalizeString(body.id);
  const source = normalizeString(body.source);
  const target = normalizeString(body.target);
  const direction = normalizeString(body.direction);
  const effectStrength = normalizeString(body.effectStrength ?? body.effect_strength);
  const type = normalizeString(body.type);
  const description = normalizeString(body.description);

  if (!source || !target) {
    throw new ApiError(400, 'source and target are required', 'graph_edge_invalid_nodes');
  }

  if (!['direct', 'inverse'].includes(direction)) {
    throw new ApiError(400, 'direction must be direct or inverse', 'graph_edge_invalid_direction');
  }

  if (!['low', 'moderate', 'high'].includes(effectStrength)) {
    throw new ApiError(400, 'effectStrength must be low, moderate, or high', 'graph_edge_invalid_strength');
  }

  if (!['causal', 'correlative'].includes(type)) {
    throw new ApiError(400, 'type must be causal or correlative', 'graph_edge_invalid_type');
  }

  if (!description) {
    throw new ApiError(400, 'description is required', 'graph_edge_invalid_description');
  }

  return {
    ...(id ? { id } : {}),
    source,
    target,
    direction: direction as GraphCustomEdge['direction'],
    effectStrength: effectStrength as GraphCustomEdge['effectStrength'],
    type: type as GraphCustomEdge['type'],
    description
  };
}

export type GraphImportPayload = {
  mode: 'append' | 'replace_custom';
  metrics: GraphMetricPayload[];
  edges: GraphEdgePayload[];
};

export function parseGraphImportPayload(raw: unknown): GraphImportPayload {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError(400, 'Request body must be an object', 'invalid_body');
  }

  const body = raw as Record<string, unknown>;
  const importTemplate = body.importTemplate && typeof body.importTemplate === 'object' ? (body.importTemplate as Record<string, unknown>) : null;
  const custom = body.custom && typeof body.custom === 'object' ? (body.custom as Record<string, unknown>) : null;

  const metricsRaw = Array.isArray(body.metrics)
    ? body.metrics
    : Array.isArray(importTemplate?.metrics)
      ? (importTemplate?.metrics as unknown[])
      : Array.isArray(custom?.metrics)
        ? (custom?.metrics as unknown[])
        : [];

  const edgesRaw = Array.isArray(body.edges)
    ? body.edges
    : Array.isArray(importTemplate?.edges)
      ? (importTemplate?.edges as unknown[])
      : Array.isArray(custom?.edges)
        ? (custom?.edges as unknown[])
        : [];

  const modeRaw = normalizeString(body.mode ?? importTemplate?.mode).toLowerCase();
  const mode: GraphImportPayload['mode'] = modeRaw === 'replace_custom' ? 'replace_custom' : 'append';

  if (!metricsRaw.length && !edgesRaw.length) {
    throw new ApiError(400, 'Provide at least one metric or edge for import', 'graph_import_empty');
  }

  const metrics = metricsRaw.map((entry, index) => {
    try {
      return parseGraphMetricPayload(entry);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new ApiError(error.status, `metrics[${index}]: ${error.message}`, error.code);
      }
      throw error;
    }
  });

  const edges = edgesRaw.map((entry, index) => {
    try {
      return parseGraphEdgePayload(entry);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new ApiError(error.status, `edges[${index}]: ${error.message}`, error.code);
      }
      throw error;
    }
  });

  return {
    mode,
    metrics,
    edges
  };
}

function parseInterventionEffect(raw: unknown): InterventionEffect {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError(400, 'effect must be an object', 'invalid_intervention_effect');
  }

  const effect = raw as Record<string, unknown>;
  const metric = normalizeString(effect.metric);
  const changeValue = toNumber(effect.change ?? effect.changeValue);
  const unit = normalizeString(effect.unit);
  const confidence = normalizeString(effect.confidence).toLowerCase();
  const assumptions = normalizeString(effect.assumptions);

  if (!metric || !isMetricName(metric)) {
    throw new ApiError(400, 'effect.metric must be a valid metric name', 'invalid_effect_metric');
  }
  if (changeValue === null) {
    throw new ApiError(400, 'effect.change must be numeric', 'invalid_effect_change');
  }
  if (!unit) {
    throw new ApiError(400, 'effect.unit is required', 'invalid_effect_unit');
  }
  if (!['low', 'moderate', 'high'].includes(confidence)) {
    throw new ApiError(400, 'effect.confidence must be low, moderate, or high', 'invalid_effect_confidence');
  }
  if (!assumptions) {
    throw new ApiError(400, 'effect.assumptions is required', 'invalid_effect_assumptions');
  }

  return {
    metric,
    changeValue,
    unit,
    confidence: confidence as InterventionEffect['confidence'],
    assumptions
  };
}

function parseContraindication(raw: unknown): Contraindication {
  if (!raw || typeof raw !== 'object') {
    throw new ApiError(400, 'contraindication must be an object', 'invalid_contraindication');
  }

  const data = raw as Record<string, unknown>;
  const scenario = normalizeString(data.scenario);
  const warning = normalizeString(data.warning);

  if (!scenario || !warning) {
    throw new ApiError(400, 'contraindication scenario and warning are required', 'invalid_contraindication');
  }

  return { scenario, warning };
}

function parseStudySource(raw: unknown): InterventionVersion['studySource'] {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const data = raw as Record<string, unknown>;
  const url = normalizeString(data.url);
  const title = normalizeString(data.title);
  const authors = normalizeString(data.authors);
  const year = toNumber(data.year);
  const doi = normalizeString(data.doi);
  const scrapedAtRaw = normalizeString(data.scraped_at ?? data.scrapedAt);
  const scrapedAt = scrapedAtRaw ? new Date(scrapedAtRaw).toISOString() : new Date().toISOString();

  if (!url || !title || !authors || !year || !doi) {
    return null;
  }

  return {
    url,
    title,
    authors,
    year,
    doi,
    scrapedAt
  };
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}
