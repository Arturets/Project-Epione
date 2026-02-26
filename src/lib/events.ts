import { mutateDatabase } from './db';
import { ApiError } from './http';
import { EventRecord, EventType } from './types';
import { createId } from './utils';

export async function logEvent(userId: string, eventType: EventType, metadata: Record<string, unknown> = {}) {
  await mutateDatabase(async (db) => {
    db.events.push({
      id: createId(),
      userId,
      eventType,
      metadata,
      createdAt: new Date().toISOString()
    });
  });
}

export function parseDateRange(
  searchParams: URLSearchParams,
  defaults: { days?: number; hours?: number } = { days: 7 }
): { startDate: Date; endDate: Date } {
  const now = new Date();
  const requestedStart = parseDate(searchParams.get('start_date'));
  const requestedEnd = parseDate(searchParams.get('end_date'));

  const endDate = requestedEnd ?? now;
  let startDate = requestedStart;

  if (!startDate) {
    const next = new Date(endDate);
    if (defaults.hours) {
      next.setHours(next.getHours() - defaults.hours);
    } else {
      next.setDate(next.getDate() - (defaults.days ?? 7));
    }
    startDate = next;
  }

  if (startDate.getTime() > endDate.getTime()) {
    throw new ApiError(400, 'start_date must be before end_date', 'invalid_date_range');
  }

  return { startDate, endDate };
}

export function eventInRange(event: EventRecord, startDate: Date, endDate: Date) {
  const ts = new Date(event.createdAt).getTime();
  return Number.isFinite(ts) && ts >= startDate.getTime() && ts <= endDate.getTime();
}

export function eventMetadataString(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key];
  return typeof value === 'string' ? value : null;
}

export function countBy<T extends string>(items: T[]): Array<{ key: T; count: number }> {
  const counts = new Map<T, number>();
  for (const item of items) {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

export function percentage(count: number, total: number): number {
  if (total <= 0) return 0;
  return Number(((count / total) * 100).toFixed(1));
}

export function trend(current: number, previous: number) {
  if (previous <= 0) {
    return {
      direction: current > 0 ? 'up' : 'stable',
      deltaPercent: current > 0 ? 100 : 0
    } as const;
  }

  const delta = ((current - previous) / previous) * 100;
  if (Math.abs(delta) < 1) {
    return { direction: 'stable', deltaPercent: Number(delta.toFixed(1)) } as const;
  }

  return {
    direction: delta > 0 ? 'up' : 'down',
    deltaPercent: Number(delta.toFixed(1))
  } as const;
}

function parseDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
