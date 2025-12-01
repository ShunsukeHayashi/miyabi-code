/**
 * Next.js Middleware for CORS
 * Handles preflight requests and adds CORS headers
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only handle OPTIONS preflight requests in middleware
  // Let the route handlers handle actual requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Requested-With, Accept, Origin, openai-conversation-id, openai-ephemeral-user-id',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // For non-OPTIONS requests, just pass through
  // CORS headers are added by the route handlers
  return NextResponse.next();
}

// Only apply to API routes
export const config = {
  matcher: '/api/:path*',
};
