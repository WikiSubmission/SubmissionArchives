import { NextRequest, NextResponse } from 'next/server';

const ADMIN_TOKEN_COOKIE = 'admin_token';

export function proxy(request: NextRequest) {
  if (hasAdminAccess(request)) {
    return NextResponse.next();
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

function hasAdminAccess(request: NextRequest) {
  const expected = (process.env.ADMIN_API_TOKEN || process.env.ADMIN_TOKEN || '').trim();

  if (!expected && process.env.NODE_ENV !== 'production') {
    return true;
  }

  if (!expected) {
    return false;
  }

  const provided =
    request.headers.get('x-admin-token') ||
    request.cookies.get(ADMIN_TOKEN_COOKIE)?.value ||
    request.cookies.get('ADMIN_API_TOKEN')?.value;

  return provided === expected;
}

export const config = {
  matcher: [
    '/tools/:path*',
    '/api/match-tool',
    '/api/review-transcripts/:path*',
  ],
};
