/**
 * Next.js Security Middleware
 * Comprehensive security, CORS, rate limiting, and request validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// CORS configuration
const CORS_CONFIG = {
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://*.vercel.app'
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 'Authorization', 'X-API-Key', 'X-Requested-With',
    'Accept', 'Origin', 'X-Request-ID', 'openai-conversation-id', 'openai-ephemeral-user-id'
  ],
  exposedHeaders: ['X-Request-ID', 'X-Rate-Limit-Remaining'],
  credentials: true,
  maxAge: 86400
};

// Rate limiting configuration
const RATE_LIMITS = {
  '/api/ai/': { requests: 10, window: 60 }, // AI endpoints
  '/api/upload/': { requests: 5, window: 60 }, // Upload endpoints
  '/api/auth/': { requests: 20, window: 60 }, // Auth endpoints
  '/api/': { requests: 100, window: 60 }, // General API
  default: { requests: 200, window: 60 }
};

// Security headers
const SECURITY_HEADERS = {
  'X-DNS-Prefetch-Control': 'off',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'X-Request-ID': crypto.randomUUID()
};

export function middleware(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS(request);
    }

    const response = NextResponse.next();

    // Apply security headers
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, key === 'X-Request-ID' ? requestId : value);
    });

    // Apply CORS headers for actual requests
    applyCORSHeaders(request, response);

    // Rate limiting
    const rateLimitResult = checkRateLimit(request);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult);
    }

    response.headers.set('X-Rate-Limit-Remaining', rateLimitResult.remaining.toString());

    // Request size validation for uploads
    const contentLength = request.headers.get('content-length');
    const maxSize = getMaxRequestSize(request.nextUrl.pathname);
    if (contentLength && parseInt(contentLength) > maxSize) {
      return NextResponse.json(
        { error: 'Request payload too large', code: 'PAYLOAD_TOO_LARGE' },
        { status: 413, headers: getSecurityHeaders(requestId) }
      );
    }

    // Authentication check for protected routes
    if (isProtectedRoute(request.nextUrl.pathname)) {
      const authResult = verifyAuthentication(request);
      if (!authResult.valid) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'AUTH_REQUIRED' },
          { status: 401, headers: getSecurityHeaders(requestId) }
        );
      }
    }

    return response;

  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.json(
      { error: 'Security check failed', code: 'SECURITY_ERROR' },
      { status: 500, headers: getSecurityHeaders(requestId) }
    );
  }
}

function handleCORS(request: NextRequest): NextResponse {
  const origin = request.headers.get('origin');
  const requestId = crypto.randomUUID();

  if (origin && !isAllowedOrigin(origin)) {
    return NextResponse.json(
      { error: 'Origin not allowed', code: 'CORS_ERROR' },
      { status: 403, headers: getSecurityHeaders(requestId) }
    );
  }

  const headers = new Headers(getSecurityHeaders(requestId));

  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
  }

  headers.set('Access-Control-Allow-Methods', CORS_CONFIG.allowedMethods.join(', '));
  headers.set('Access-Control-Allow-Headers', CORS_CONFIG.allowedHeaders.join(', '));
  headers.set('Access-Control-Allow-Credentials', CORS_CONFIG.credentials.toString());
  headers.set('Access-Control-Max-Age', CORS_CONFIG.maxAge.toString());

  return new NextResponse(null, { status: 200, headers });
}

function applyCORSHeaders(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get('origin');

  if (origin && isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Expose-Headers', CORS_CONFIG.exposedHeaders.join(', '));
  }
}

function isAllowedOrigin(origin: string): boolean {
  return CORS_CONFIG.allowedOrigins.some(allowed =>
    allowed === origin ||
    allowed === '*' ||
    (allowed.includes('*') && origin.match(allowed.replace('*', '.*')))
  );
}

function checkRateLimit(request: NextRequest) {
  const ip = getClientIP(request);
  const pathname = request.nextUrl.pathname;
  const key = `${ip}:${pathname}`;
  const now = Date.now();

  const limit = getRateLimitForPath(pathname);
  const windowMs = limit.window * 1000;

  // Cleanup expired entries
  for (const [k, v] of rateLimitStore.entries()) {
    if (v.resetTime < now) rateLimitStore.delete(k);
  }

  const current = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };

  if (current.resetTime < now) {
    current.count = 1;
    current.resetTime = now + windowMs;
  } else {
    current.count++;
  }

  rateLimitStore.set(key, current);

  return {
    allowed: current.count <= limit.requests,
    remaining: Math.max(0, limit.requests - current.count),
    resetTime: current.resetTime
  };
}

function createRateLimitResponse(result: any): NextResponse {
  const requestId = crypto.randomUUID();
  const headers = new Headers(getSecurityHeaders(requestId));
  headers.set('X-Rate-Limit-Remaining', '0');
  headers.set('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000).toString());

  return NextResponse.json(
    { error: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' },
    { status: 429, headers }
  );
}

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
         request.headers.get('x-real-ip') ||
         request.headers.get('cf-connecting-ip') ||
         request.ip ||
         'unknown';
}

function getRateLimitForPath(pathname: string) {
  for (const [prefix, limit] of Object.entries(RATE_LIMITS)) {
    if (prefix !== 'default' && pathname.startsWith(prefix)) {
      return limit;
    }
  }
  return RATE_LIMITS.default;
}

function getMaxRequestSize(pathname: string): number {
  if (pathname.includes('/upload')) return 100 * 1024 * 1024; // 100MB
  if (pathname.startsWith('/api/')) return 10 * 1024 * 1024; // 10MB
  return 1 * 1024 * 1024; // 1MB default
}

function isProtectedRoute(pathname: string): boolean {
  const protectedPaths = [
    '/api/courses',
    '/api/lessons',
    '/api/assessments',
    '/api/ai/',
    '/api/analytics/',
    '/api/collaboration/',
    '/api/videos/upload'
  ];

  // Public AI endpoints (auth optional for personalization)
  const publicAIPaths = [
    '/api/ai/semantic-search',
  ];

  if (publicAIPaths.some(path => pathname.startsWith(path))) {
    return false;
  }

  return protectedPaths.some(path => pathname.startsWith(path)) &&
         !pathname.includes('/public');
}

function verifyAuthentication(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { valid: false, error: 'Missing authorization header' };
    }

    const token = authHeader.substring(7);
    verify(token, process.env.JWT_SECRET!);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid token' };
  }
}

function getSecurityHeaders(requestId: string): Record<string, string> {
  return {
    ...SECURITY_HEADERS,
    'X-Request-ID': requestId,
    'Content-Type': 'application/json'
  };
}

// Apply to all routes except static files
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
