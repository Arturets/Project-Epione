import type { RequestEventBase } from '@builder.io/qwik-city';
import { ApiError } from './http';

type RateBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateBucket>();

function getClientIp(event: RequestEventBase) {
  const forwarded = event.request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }
  return event.request.headers.get('x-real-ip') ?? 'unknown';
}

export function assertRateLimit(event: RequestEventBase, key: string, limit: number, windowMs: number) {
  const ip = getClientIp(event);
  const now = Date.now();
  const bucketKey = `${ip}:${key}`;

  const current = buckets.get(bucketKey);
  if (!current || current.resetAt <= now) {
    buckets.set(bucketKey, {
      count: 1,
      resetAt: now + windowMs
    });
    return;
  }

  if (current.count >= limit) {
    const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
    throw new ApiError(429, `Too many requests. Retry in ${retryAfterSeconds}s.`, 'rate_limited');
  }

  current.count += 1;
}
