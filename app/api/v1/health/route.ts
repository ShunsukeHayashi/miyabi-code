/**
 * GET /api/v1/health - Health check endpoint
 * 
 * Issue #1214: システムヘルスチェック
 */

import { NextResponse } from 'next/server';
import { getTaskStats } from '@/lib/task';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
};

/**
 * GET /api/v1/health
 * Health check (no authentication required)
 */
export async function GET() {
  try {
    const stats = getTaskStats();

    const response = NextResponse.json({
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      tasks: stats,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    });

    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('[GET /api/v1/health] Error:', error);
    
    const response = NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );

    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }
}

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
