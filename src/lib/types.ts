export const METRIC_NAMES = [
  'weight',
  'body_fat',
  'vo2_max',
  'rhr',
  'hrv',
  'sleep',
  'stress'
] as const;

export type MetricName = (typeof METRIC_NAMES)[number];

export const WEIGHT_UNITS = ['kg', 'lbs'] as const;
export type WeightUnit = (typeof WEIGHT_UNITS)[number];

export const DISTANCE_UNITS = ['km', 'mi'] as const;
export type DistanceUnit = (typeof DISTANCE_UNITS)[number];

export const SYNC_SOURCES = ['manual', 'apple_health'] as const;
export type SyncSource = (typeof SYNC_SOURCES)[number];

export const OAUTH_PROVIDER_NAMES = ['apple', 'google', 'microsoft', 'samsung', 'github', 'linkedin'] as const;
export type OAuthProviderName = (typeof OAUTH_PROVIDER_NAMES)[number];

export type OAuthProviderEntry = {
  sub: string;
  email: string;
};

export type OAuthProviders = Partial<Record<OAuthProviderName, OAuthProviderEntry>>;

export type UserTwoFactorSettings = {
  enabled: boolean;
  secret: string | null;
  pendingSecret: string | null;
  enabledAt: string | null;
  recoveryCodes: string[];
};

export type UserRole = 'customer' | 'coach' | 'admin';

export type User = {
  id: string;
  email: string;
  passwordHash: string | null;
  oauthProviders: OAuthProviders;
  twoFactor: UserTwoFactorSettings;
  role: UserRole;
  adminApiKey: string | null;
  createdAt: string;
  updatedAt: string;
  appleHealthConsent: boolean;
  lastAppleHealthSyncAt: string | null;
};

export type AuthChallenge = {
  id: string;
  userId: string;
  method: 'password' | 'oauth';
  provider: OAuthProviderName | null;
  createdAt: string;
  expiresAt: string;
};

export type Session = {
  id: string;
  userId: string;
  csrfToken: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
};

export type MetricRecord = {
  id: string;
  userId: string;
  metricName: MetricName;
  value: number;
  unit: string;
  note: string | null;
  recordedAt: string;
  syncedFrom: SyncSource | null;
  createdAt: string;
  updatedAt: string;
};

export type UserPreference = {
  id: string;
  userId: string;
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  createdAt: string;
  updatedAt: string;
};

export type Snapshot = {
  id: string;
  userId: string;
  metricValues: Partial<Record<MetricName, number>>;
  userNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuditLogEvent =
  | 'signup'
  | 'login'
  | 'logout'
  | 'two_factor_setup_started'
  | 'two_factor_enabled'
  | 'two_factor_disabled'
  | 'two_factor_verified'
  | 'metric_logged'
  | 'metric_updated'
  | 'snapshot_saved'
  | 'snapshot_deleted'
  | 'apple_sync'
  | 'apple_sync_consent'
  | 'settings_updated';

export type AuditLog = {
  id: string;
  userId: string;
  eventType: AuditLogEvent;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type EventType =
  | 'metric_logged'
  | 'intervention_viewed'
  | 'intervention_selected'
  | 'snapshot_saved'
  | 'snapshot_deleted'
  | 'applehealth_sync'
  | 'suggestion_clicked'
  | 'intervention_stacked'
  | 'page_visited';

export type EventRecord = {
  id: string;
  userId: string;
  eventType: EventType;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type GraphDomain = 'cardiovascular' | 'respiratory' | 'nervous' | 'metabolic' | 'musculoskeletal' | 'recovery';
export type GraphNodeTier = 'core' | 'supporting';
export type GraphEdgeDirection = 'direct' | 'inverse';
export type GraphEdgeStrength = 'low' | 'moderate' | 'high';
export type GraphEdgeType = 'causal' | 'correlative';

export type GraphCustomMetric = {
  id: string;
  label: string;
  x: number;
  y: number;
  tier: GraphNodeTier;
  domain: GraphDomain;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type GraphCustomEdge = {
  id: string;
  source: string;
  target: string;
  direction: GraphEdgeDirection;
  effectStrength: GraphEdgeStrength;
  type: GraphEdgeType;
  description: string;
  createdBy: string;
  createdAt: string;
};

export type InterventionVersionStatus = 'draft' | 'published' | 'archived';

export type InterventionStudySource = {
  url: string;
  title: string;
  authors: string;
  year: number;
  doi: string;
  scrapedAt: string;
};

export type InterventionVersion = {
  id: string;
  interventionId: string;
  versionNumber: number;
  status: InterventionVersionStatus;
  name: string;
  category: Intervention['category'];
  durationWeeks: number;
  frequency: string;
  description: string;
  effects: InterventionEffect[];
  contraindications: Contraindication[];
  studySource: InterventionStudySource | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type AppDatabase = {
  users: User[];
  sessions: Session[];
  authChallenges: AuthChallenge[];
  metrics: MetricRecord[];
  userPreferences: UserPreference[];
  snapshots: Snapshot[];
  auditLogs: AuditLog[];
  events: EventRecord[];
  interventionVersions: InterventionVersion[];
  graphCustomMetrics: GraphCustomMetric[];
  graphCustomEdges: GraphCustomEdge[];
};

export type MetricLatestView = {
  metricName: MetricName;
  value: number;
  unit: string;
  recordedAt: string;
  trend: Array<{ recordedAt: string; value: number }>;
};

export type MetricEdgeType = 'causal' | 'correlative';

export type GraphEdge = {
  id: string;
  source: MetricName;
  target: MetricName;
  direction: 'direct' | 'inverse';
  effectStrength: 'low' | 'moderate' | 'high';
  type: MetricEdgeType;
  description: string;
};

export type InterventionEffect = {
  metric: MetricName;
  changeValue: number;
  unit: string;
  confidence: 'low' | 'moderate' | 'high';
  assumptions: string;
  range?: [number, number];
};

export type Contraindication = {
  scenario: string;
  warning: string;
};

export type Intervention = {
  id: string;
  name: string;
  category: 'strength' | 'cardio' | 'diet' | 'sleep' | 'stress' | 'hybrid';
  durationWeeks: number;
  frequency: string;
  description: string;
  effects: InterventionEffect[];
  contraindications: Contraindication[];
};

export type SuggestionOperator = 'above' | 'below';

export type SuggestionRule = {
  id: string;
  condition: {
    metric: MetricName;
    operator: SuggestionOperator;
    value: number;
    unit: string;
  };
  goal: string;
  suggestedInterventions: string[];
  message: string;
};
