import 'server-only';

import path from 'path';
import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';

const ADMIN_TOKEN_COOKIE = 'admin_token';
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

export function hasAdminAccess(headers: Headers) {
  const expected = (process.env.ADMIN_API_TOKEN || process.env.ADMIN_TOKEN || '').trim();

  if (!expected && process.env.NODE_ENV !== 'production') {
    return true;
  }

  if (!expected) {
    return false;
  }

  const cookieHeader = headers.get('cookie');
  const provided =
    headers.get('x-admin-token') ||
    readCookie(cookieHeader, ADMIN_TOKEN_COOKIE) ||
    readCookie(cookieHeader, 'ADMIN_API_TOKEN');

  return safeCompare(provided, expected);
}

export function requireAdminRequest(request: Request) {
  if (hasAdminAccess(request.headers)) {
    return null;
  }

  return NextResponse.json(
    { error: 'Forbidden' },
    {
      status: 403,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}

export function parsePositiveInt(value: unknown, max = Number.MAX_SAFE_INTEGER) {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= max) {
    return value;
  }

  if (typeof value === 'string' && /^[1-9]\d*$/.test(value)) {
    const parsed = Number(value);
    if (Number.isSafeInteger(parsed) && parsed <= max) {
      return parsed;
    }
  }

  return null;
}

export function hasUnsafePathCharacters(value: string) {
  return value.includes('/') || value.includes('\\') || value.includes('\0');
}

export function resolvePathWithin(root: string, ...segments: string[]) {
  const resolvedRoot = path.resolve(root);
  const target = path.resolve(resolvedRoot, ...segments);
  const relative = path.relative(resolvedRoot, target);

  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
    return target;
  }

  return null;
}

export function jsonByteLength(value: unknown) {
  return Buffer.byteLength(JSON.stringify(value), 'utf8');
}

function safeCompare(provided: string | null | undefined, expected: string) {
  if (!provided) {
    return false;
  }

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

function readCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [rawName, ...rest] = cookie.trim().split('=');
    if (rawName === name) {
      return decodeURIComponent(rest.join('='));
    }
  }

  return null;
}
