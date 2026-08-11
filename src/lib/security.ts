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

const MAX_SEARCH_QUERY_CHARS = 200;

// Normalises untrusted query text before it reaches the index. The search engine
// applies its own stricter length cap; this is about removing things that should
// never reach it at all, and about not treating punctuation-only noise as a search.
export function sanitizeSearchQuery(raw: string | null | undefined): {
  query: string;
  suspicious: boolean;
} {
  const withoutControlChars = (raw ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ');
  const query = withoutControlChars.replace(/\s+/g, ' ').trim().slice(0, MAX_SEARCH_QUERY_CHARS);

  // Nothing alphanumeric means there is nothing to match; treat as empty rather
  // than handing the matcher a string of punctuation.
  if (!/[a-z0-9]/i.test(query)) {
    return { query: '', suspicious: query.length > 0 };
  }

  // Recorded, not blocked: these are searched literally, but a spike is worth seeing.
  const suspicious = /(\bunion\b\s+\bselect\b|--\s|\/\*|<script|\bdrop\s+table\b)/i.test(query);

  return { query, suspicious };
}
