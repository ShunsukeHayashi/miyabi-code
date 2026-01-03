/**
 * Health Check API Endpoint
 * Provides application health status for monitoring and load balancers
 */

import { NextResponse } from 'next/server';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  uptime: number;
  environment: string;
  services: {
    database: 'healthy' | 'degraded' | 'unhealthy';
    cache: 'healthy' | 'degraded' | 'unhealthy';
    ai: 'healthy' | 'degraded' | 'unhealthy';
  };
}

export async function GET() {
  const startTime = Date.now();

  try {
    const health: HealthStatus = {
      status: 'healthy',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'healthy',
        cache: 'healthy',
        ai: 'healthy'
      }
    };

    // Basic service checks (simplified for testing)
    try {
      // Database check would go here
      // For now, just check if DATABASE_URL is configured
      if (!process.env.DATABASE_URL) {
        health.services.database = 'degraded';
        health.status = 'degraded';
      }
    } catch {
      health.services.database = 'unhealthy';
      health.status = 'unhealthy';
    }

    try {
      // Redis check would go here
      // For now, just check if REDIS_URL is configured
      if (!process.env.REDIS_URL) {
        health.services.cache = 'degraded';
        health.status = 'degraded';
      }
    } catch {
      health.services.cache = 'unhealthy';
      health.status = 'unhealthy';
    }

    try {
      // AI service check
      if (!process.env.GEMINI_API_KEY) {
        health.services.ai = 'degraded';
        health.status = 'degraded';
      }
    } catch {
      health.services.ai = 'unhealthy';
      health.status = 'unhealthy';
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json(health, {
      status: health.status === 'unhealthy' ? 503 : 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check-Duration': `${responseTime}ms`,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

// HEAD request for simple ping checks
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}