import 'server-only';

import { NextResponse } from 'next/server';

const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_RATE_LIMIT_KEYS = 10_000;

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  limited: boolean;
  remaining: number;
  retryAfter: number;
  resetAt: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();

export function getClientIp(headers: Headers) {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip')?.trim() ||
    headers.get('cf-connecting-ip')?.trim() ||
    'unknown'
  );
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs = DEFAULT_RATE_LIMIT_WINDOW_MS,
): RateLimitResult {
  const now = Date.now();
  const bucketKey = key || 'anonymous';
  const current = rateLimitBuckets.get(bucketKey);

  if (rateLimitBuckets.size > MAX_RATE_LIMIT_KEYS) {
    for (const [storedKey, bucket] of rateLimitBuckets) {
      if (bucket.resetAt <= now) {
        rateLimitBuckets.delete(storedKey);
      }
    }
  }

  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs;
    rateLimitBuckets.set(bucketKey, { count: 1, resetAt });

    return {
      limited: false,
      remaining: Math.max(0, limit - 1),
      retryAfter: Math.ceil(windowMs / 1000),
      resetAt,
    };
  }

  current.count += 1;
  const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
  const remaining = Math.max(0, limit - current.count);

  return {
    limited: current.count > limit,
    remaining,
    retryAfter,
    resetAt: current.resetAt,
  };
}

export function rateLimitResponse(result: RateLimitResult) {
  return NextResponse.json(
    { error: 'Too many requests. Please try again shortly.' },
    {
      status: 429,
      headers: {
        'Cache-Control': 'no-store',
        'Retry-After': String(result.retryAfter),
        'X-RateLimit-Remaining': String(result.remaining),
      },
    },
  );
}
