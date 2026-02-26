import { MetricName } from '../lib/types';

export type MetricDefinition = {
  key: MetricName;
  label: string;
  defaultUnit: string;
  min?: number;
  max?: number;
  description: string;
};

export const METRIC_DEFINITIONS: MetricDefinition[] = [
  {
    key: 'weight',
    label: 'Weight',
    defaultUnit: 'kg',
    min: 30,
    max: 300,
    description: 'Body mass in kg or lbs.'
  },
  {
    key: 'body_fat',
    label: 'Body Fat %',
    defaultUnit: '%',
    min: 2,
    max: 70,
    description: 'Estimated or measured body fat percentage.'
  },
  {
    key: 'vo2_max',
    label: 'VO2 Max',
    defaultUnit: 'ml/kg/min',
    min: 10,
    max: 90,
    description: 'Aerobic capacity score.'
  },
  {
    key: 'rhr',
    label: 'Resting Heart Rate',
    defaultUnit: 'bpm',
    min: 30,
    max: 130,
    description: 'Heart beats per minute at rest.'
  },
  {
    key: 'hrv',
    label: 'Heart Rate Variability',
    defaultUnit: 'ms',
    min: 5,
    max: 250,
    description: 'Variability in heartbeat intervals.'
  },
  {
    key: 'sleep',
    label: 'Sleep Duration',
    defaultUnit: 'hours',
    min: 0,
    max: 16,
    description: 'Average nightly sleep duration.'
  },
  {
    key: 'stress',
    label: 'Stress Level',
    defaultUnit: '1-10',
    min: 1,
    max: 10,
    description: 'Self-reported stress level.'
  }
];

export const METRIC_LABEL_BY_NAME = Object.fromEntries(METRIC_DEFINITIONS.map((metric) => [metric.key, metric.label])) as Record<
  MetricName,
  string
>;
