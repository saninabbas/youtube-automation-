import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_EXACT_ROUTES = new Set([
  '/',
  '/landing',
  '/login',
  '/signup',
  '/onboarding',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/admin', // Admin page renders its own login prompt when unauthenticated
  '/favicon.ico',
  '/icon.svg',
  '/robots.txt',
  '/sitemap.xml',
]);

const PUBLIC_PREFIXES = [
  '/_next/',
  '/static/',
  '/blog',
  '/api/auth/',
  '/api/customer/',
  '/api/health',
  '/api/assets/',
  '/api/billing/polar-webhook',
  '/api/billing/webhook',
  '/api/admin/auth',
];

const CUSTOMER_SESSION_COOKIE = 'auth_session_token';
const ADMIN_SESSION_COOKIE = 'admin_session_token';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Whitelist exact public paths
  if (PUBLIC_EXACT_ROUTES.has(pathname)) {
    return NextResponse.next();
  }

  // 2. Whitelist public prefixes
  if (PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // 3. Admin API endpoints require admin token
  if (pathname.startsWith('/api/admin/')) {
    const adminToken =
      request.cookies.get(ADMIN_SESSION_COOKIE)?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '').trim();

    if (!adminToken || !adminToken.includes('.')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin authentication required' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // 4. Protected API routes require customer session token or bearer token
  if (pathname.startsWith('/api/')) {
    // Special scheduler run check
    if (pathname === '/api/scheduler/run') {
      const cronSecret = process.env.CRON_SECRET || process.env.ADMIN_SECRET;
      const authHeader = request.headers.get('authorization')?.replace('Bearer ', '').trim();
      const adminToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
      if (!cronSecret || (authHeader !== cronSecret && !adminToken)) {
        return NextResponse.json({ error: 'Unauthorized scheduler trigger' }, { status: 401 });
      }
      return NextResponse.next();
    }

    const token =
      request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '').trim();

    if (!token || token.length < 16) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // 5. Protected customer web pages: redirect to login if session cookie is missing
  const customerToken = request.cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!customerToken || customerToken.length < 16) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

