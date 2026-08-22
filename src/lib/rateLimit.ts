// Pure sliding-window rate limiter, split out of security.ts so it is unit-testable:
// security.ts carries `import 'server-only'`, which throws unconditionally outside a
// bundler context and so cannot be exercised by a plain `node --test` run. This module
// has no server-only dependency of its own — it is pure computation over Date.now() and
// a Map — so it is safe to import directly from either side.

const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_RATE_LIMIT_KEYS = 10_000;

// Sliding-window counter: two fixed-size buckets (current + previous window), weighted by
// how far into the current window "now" is. A single request-timestamp log would be exact
// but is unbounded memory per key; this is the standard O(1)-per-request approximation
// (the same shape used by Cloudflare's rate limiter) and is close enough for abuse
// prevention. The thing a plain fixed window gets wrong: everyone sharing one IP (an
// office, a university, a mosque) goes fully silent for up to a full window the moment
// any one of them trips the limit, and a burst can smuggle up to 2x the limit through
// across a window boundary. Weighting the previous bucket's count by its remaining
// overlap fixes both without loosening the actual cap.
type RateLimitBucket = {
  windowIndex: number;
  currentCount: number;
  previousCount: number;
};

export type RateLimitResult = {
  limited: boolean;
  remaining: number;
  retryAfter: number;
  resetAt: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs = DEFAULT_RATE_LIMIT_WINDOW_MS,
): RateLimitResult {
  const now = Date.now();
  const bucketKey = key || 'anonymous';
  const windowIndex = Math.floor(now / windowMs);
  const windowStart = windowIndex * windowMs;
  const elapsedFraction = (now - windowStart) / windowMs;

  if (rateLimitBuckets.size > MAX_RATE_LIMIT_KEYS) {
    // A bucket is stale once both windows it could still weigh into have passed.
    for (const [storedKey, bucket] of rateLimitBuckets) {
      if (bucket.windowIndex < windowIndex - 1) {
        rateLimitBuckets.delete(storedKey);
      }
    }
  }

  const stored = rateLimitBuckets.get(bucketKey);
  let bucket: RateLimitBucket;
  if (!stored || stored.windowIndex < windowIndex - 1) {
    // No usable history: either a first request, or the gap since the last one spans
    // more than a full window, so the previous count no longer overlaps "now" at all.
    bucket = { windowIndex, currentCount: 1, previousCount: 0 };
  } else if (stored.windowIndex === windowIndex) {
    bucket = { ...stored, currentCount: stored.currentCount + 1 };
  } else {
    // Exactly one window elapsed: roll current into previous, start a fresh current.
    bucket = { windowIndex, currentCount: 1, previousCount: stored.currentCount };
  }
  rateLimitBuckets.set(bucketKey, bucket);

  const weightedCount = bucket.currentCount + bucket.previousCount * (1 - elapsedFraction);
  const resetAt = windowStart + windowMs;
  const retryAfter = Math.max(1, Math.ceil((resetAt - now) / 1000));

  return {
    limited: weightedCount > limit,
    remaining: Math.max(0, Math.floor(limit - weightedCount)),
    retryAfter,
    resetAt,
  };
}
