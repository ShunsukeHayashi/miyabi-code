/**
 * Common API utilities
 * Issue #1298: API Helper Functions
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser, AuthenticatedUser } from './auth';
import { APIException, APIErrors, createErrorResponse } from './api-error';

// CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-ID, X-User-Email, X-User-Role, X-Username',
};

/**
 * Add CORS headers to response
 */
export function addCorsHeaders(response: NextResponse): NextResponse {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Handle OPTIONS request for CORS
 */
export function handleOptions(): NextResponse {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

/**
 * Parse query parameters with schema validation
 */
export function parseQuery<T extends z.ZodSchema>(
  request: NextRequest,
  schema: T
): z.infer<T> {
  const { searchParams } = new URL(request.url);
  const query = Object.fromEntries(searchParams.entries());
  return schema.parse(query);
}

/**
 * Parse JSON body with schema validation
 */
export async function parseBody<T extends z.ZodSchema>(
  request: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  const body = await request.json();
  return schema.parse(body);
}

/**
 * Create success response with pagination
 */
export function createSuccessResponse<T = any>(
  data: T,
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }
): NextResponse {
  const response = NextResponse.json({
    success: true,
    data,
    meta,
    timestamp: new Date().toISOString(),
  });

  return addCorsHeaders(response);
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  total: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
  };
}

/**
 * Higher-order function for API routes with authentication
 */
export function withAuth<T extends any[], R>(
  handler: (user: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const user = await getAuthenticatedUser(request);

      if (!user) {
        return createErrorResponse(APIErrors.UNAUTHORIZED);
      }

      return await handler(user, request, ...args);
    } catch (error) {
      console.error('[Auth Error]', error);
      return createErrorResponse(APIErrors.UNAUTHORIZED);
    }
  };
}

/**
 * Higher-order function for API routes with role-based authorization
 */
export function withRoles<T extends any[], R>(
  roles: string | string[],
  handler: (user: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return withAuth<T, R>(async (user, ...args) => {
    if (!allowedRoles.includes(user.role)) {
      throw APIErrors.FORBIDDEN;
    }

    return await handler(user, ...args);
  });
}

/**
 * Create 'where' clause for Prisma queries based on filters
 */
export function buildWhereClause(filters: Record<string, any>): Record<string, any> {
  const where: Record<string, any> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (key === 'q') {
        // Text search
        where.OR = [
          { title: { contains: value, mode: 'insensitive' } },
          { description: { contains: value, mode: 'insensitive' } },
        ];
      } else if (key === 'tags') {
        where.tags = { hasSome: Array.isArray(value) ? value : [value] };
      } else {
        where[key] = value;
      }
    }
  });

  return where;
}

/**
 * Rate Limiting Implementation
 * Issue #1298: API Rate Limiting
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number;      // Maximum requests per window
}

const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  api: { windowMs: 60 * 1000, max: 100 },      // 100 requests per minute
  auth: { windowMs: 15 * 60 * 1000, max: 5 },   // 5 requests per 15 minutes
  ai: { windowMs: 60 * 1000, max: 10 },         // 10 AI requests per minute
  upload: { windowMs: 60 * 1000, max: 5 },      // 5 uploads per minute
};

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  const userId = request.headers.get('x-user-id') || 'anonymous';
  return `${ip}:${userId}`;
}

/**
 * Check rate limit
 */
function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const key = identifier;
  const entry = rateLimitStore.get(key);

  // Clean up expired entries periodically
  if (Math.random() < 0.01) { // 1% chance to clean up
    const cutoff = now - config.windowMs;
    for (const [k, v] of rateLimitStore) {
      if (v.resetAt < cutoff) {
        rateLimitStore.delete(k);
      }
    }
  }

  if (!entry || entry.resetAt < now) {
    // New window
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.max - 1, resetIn: config.windowMs };
  }

  if (entry.count >= config.max) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, remaining: config.max - entry.count, resetIn: entry.resetAt - now };
}

/**
 * Rate limit response
 */
function createRateLimitResponse(resetIn: number): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(resetIn / 1000),
      },
      timestamp: new Date().toISOString(),
    },
    { status: 429 }
  );

  response.headers.set('Retry-After', String(Math.ceil(resetIn / 1000)));
  response.headers.set('X-RateLimit-Remaining', '0');
  response.headers.set('X-RateLimit-Reset', String(Date.now() + resetIn));

  return addCorsHeaders(response);
}

/**
 * Higher-order function for API routes with rate limiting
 */
export function withRateLimit<T extends any[]>(
  limitType: 'api' | 'auth' | 'ai' | 'upload' = 'api',
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  const config = DEFAULT_RATE_LIMITS[limitType];

  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const identifier = getClientIdentifier(request);
    const { allowed, remaining, resetIn } = checkRateLimit(`${limitType}:${identifier}`, config);

    if (!allowed) {
      return createRateLimitResponse(resetIn);
    }

    const response = await handler(request, ...args);

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', String(config.max));
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    response.headers.set('X-RateLimit-Reset', String(Date.now() + resetIn));

    return response;
  };
}

/**
 * Higher-order function for authenticated routes with rate limiting
 */
export function withAuthAndRateLimit<T extends any[]>(
  limitType: 'api' | 'auth' | 'ai' | 'upload' = 'api',
  handler: (user: AuthenticatedUser, request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return withRateLimit(limitType, withAuth(handler));
}

/**
 * Higher-order function for role-based routes with rate limiting
 */
export function withRolesAndRateLimit<T extends any[]>(
  roles: string | string[],
  limitType: 'api' | 'auth' | 'ai' | 'upload' = 'api',
  handler: (user: AuthenticatedUser, request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return withRateLimit(limitType, withRoles(roles, handler));
}