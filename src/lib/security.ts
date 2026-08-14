import 'server-only';

import { NextResponse } from 'next/server';
import { checkRateLimit, type RateLimitResult } from './rateLimit';

// Re-exported so every existing call site (`@/lib/security`) keeps working unchanged.
// The implementation itself lives in rateLimit.ts, which has no server-only dependency
// and so can be unit-tested directly — this file's own server-only guard would otherwise
// throw under a plain `node --test` run, outside a bundler context.
export { checkRateLimit };

export function getClientIp(headers: Headers) {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip')?.trim() ||
    headers.get('cf-connecting-ip')?.trim() ||
    'unknown'
  );
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
