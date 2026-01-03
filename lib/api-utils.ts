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