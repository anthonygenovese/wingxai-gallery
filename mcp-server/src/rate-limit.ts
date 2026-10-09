/**
 * Fixed-window limiter kept in process memory.
 *
 * NOT a global limit. On Vercel Fluid Compute the same instance can serve many
 * requests, but other instances keep their own counters. This is the scaffold
 * default (60/min per IP). A shared store can replace it later without
 * changing the HTTP contract: 429 and Retry-After.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;

export interface RateDecision {
  ok: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}

export function requestsPerMinute(): number {
  const raw = process.env.WINGXAI_RATE_LIMIT_PER_MIN;
  if (raw === undefined || raw.trim() === '') return 60;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return 60;
  return Math.floor(parsed);
}

export function takeToken(ip: string, now = Date.now()): RateDecision {
  const limit = requestsPerMinute();
  if (limit === 0) {
    return { ok: true, limit: 0, remaining: Number.POSITIVE_INFINITY, retryAfterSeconds: 0 };
  }

  if (buckets.size > 10_000) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }

  const current = buckets.get(ip);
  if (!current || current.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, limit, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (current.count >= limit) {
    return {
      ok: false,
      limit,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { ok: true, limit, remaining: limit - current.count, retryAfterSeconds: 0 };
}

export function resetRateLimitForTests(): void {
  buckets.clear();
}
