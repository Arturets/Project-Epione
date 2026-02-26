import { randomBytes, randomUUID } from 'node:crypto';
import { MetricName, METRIC_NAMES } from './types';

export function nowIso() {
  return new Date().toISOString();
}

export function createId() {
  return randomUUID();
}

export function createToken(length = 32) {
  return randomBytes(length).toString('hex');
}

export function isMetricName(value: string): value is MetricName {
  return (METRIC_NAMES as readonly string[]).includes(value);
}

export function toNumber(input: unknown): number | null {
  if (typeof input === 'number' && Number.isFinite(input)) return input;
  if (typeof input === 'string') {
    const parsed = Number(input);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function toDateOrNull(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
