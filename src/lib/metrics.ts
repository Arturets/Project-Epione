import { METRIC_DEFINITIONS } from '../config/metrics';
import { MetricLatestView, MetricName, MetricRecord, WeightUnit } from './types';

export const METRIC_ORDER = METRIC_DEFINITIONS.map((metric) => metric.key);

export const IMPROVEMENT_DIRECTION: Record<MetricName, 'higher' | 'lower'> = {
  weight: 'lower',
  body_fat: 'lower',
  vo2_max: 'higher',
  rhr: 'lower',
  hrv: 'higher',
  sleep: 'higher',
  stress: 'lower'
};

export function convertWeight(value: number, from: 'kg' | 'lbs', to: 'kg' | 'lbs') {
  if (from === to) return value;
  if (from === 'kg') return value * 2.20462;
  return value / 2.20462;
}

export function formatMetricValue(value: number) {
  if (Math.abs(value) >= 100) return value.toFixed(0);
  if (Math.abs(value) >= 10) return value.toFixed(1);
  return value.toFixed(2);
}

export function buildLatestMetrics(records: MetricRecord[]): MetricLatestView[] {
  const latestByName = new Map<MetricName, MetricRecord>();

  for (const record of records) {
    const existing = latestByName.get(record.metricName);
    if (!existing || new Date(record.recordedAt).getTime() > new Date(existing.recordedAt).getTime()) {
      latestByName.set(record.metricName, record);
    }
  }

  return METRIC_ORDER.flatMap((metricName) => {
    const latest = latestByName.get(metricName);
    if (!latest) return [];

    const trend = records
      .filter((record) => record.metricName === metricName)
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .slice(-20)
      .map((record) => ({ recordedAt: record.recordedAt, value: record.value }));

    return [
      {
        metricName,
        value: latest.value,
        unit: latest.unit,
        recordedAt: latest.recordedAt,
        trend
      }
    ];
  });
}

export function defaultUnitForMetric(metricName: MetricName, weightUnit: WeightUnit): string {
  if (metricName === 'weight') {
    return weightUnit;
  }

  const found = METRIC_DEFINITIONS.find((metric) => metric.key === metricName);
  return found?.defaultUnit ?? '';
}

export function emptyMetricState() {
  return Object.fromEntries(METRIC_ORDER.map((metricName) => [metricName, null])) as Partial<Record<MetricName, number | null>>;
}
