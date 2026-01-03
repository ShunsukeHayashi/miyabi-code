/**
 * Performance Metrics API Endpoint
 * Serves real-time performance data for the monitoring dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiCacheStats } from '@/lib/middleware/api-cache';
import { dbOptimizer } from '@/lib/database/query-optimizer';
import { cacheManager } from '@/lib/performance/cache-manager';
import os from 'os';

export async function GET(request: NextRequest) {
  try {
    // Collect cache statistics
    const cacheStats = cacheManager.getStats();
    const apiCacheStats = getApiCacheStats();
    const dbStats = dbOptimizer.getQueryMetrics();
    const poolStats = dbOptimizer.getPoolStats();

    // Collect system metrics
    const systemMetrics = await getSystemMetrics();

    // Collect frontend performance metrics (if available)
    const frontendMetrics = getFrontendMetrics();

    const metrics = {
      cache: {
        hitRate: cacheStats.hitRate,
        totalHits: cacheStats.totalHits,
        totalMisses: cacheStats.totalMisses,
        l1Stats: cacheStats.l1,
        l2Stats: cacheStats.l2
      },
      database: {
        totalQueries: dbStats.totalQueries,
        averageDuration: dbStats.averageDuration,
        slowQueries: dbStats.slowQueries.slice(0, 10), // Last 10 slow queries
        poolStats
      },
      api: {
        hitRate: apiCacheStats.hitRate,
        routes: apiCacheStats.routes.slice(0, 15) // Top 15 routes
      },
      system: systemMetrics,
      frontend: frontendMetrics,
      timestamp: Date.now()
    };

    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error collecting performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to collect metrics', code: 'METRICS_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * Collect system-level performance metrics
 */
async function getSystemMetrics() {
  try {
    // CPU Usage (simplified calculation)
    const cpus = os.cpus();
    const cpuUsage = await getCpuUsage();

    // Memory Usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;

    // Disk Usage (estimated - in production, use actual disk monitoring)
    const diskUsage = await getDiskUsage();

    // Network Latency (ping to localhost as a simple measure)
    const networkLatency = await getNetworkLatency();

    return {
      cpuUsage,
      memoryUsage,
      diskUsage,
      networkLatency,
      loadAverage: os.loadavg(),
      uptime: os.uptime(),
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      processMemory: process.memoryUsage()
    };

  } catch (error) {
    console.error('Error collecting system metrics:', error);
    return {
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      networkLatency: 0,
      loadAverage: [0, 0, 0],
      uptime: 0,
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      processMemory: process.memoryUsage()
    };
  }
}

/**
 * Calculate CPU usage percentage
 */
async function getCpuUsage(): Promise<number> {
  return new Promise((resolve) => {
    const startMeasure = getCpuInfo();

    setTimeout(() => {
      const endMeasure = getCpuInfo();
      const idleDifference = endMeasure.idle - startMeasure.idle;
      const totalDifference = endMeasure.total - startMeasure.total;
      const cpuUsage = 100 - (idleDifference / totalDifference) * 100;

      resolve(Math.max(0, Math.min(100, cpuUsage)));
    }, 100);
  });
}

/**
 * Get CPU info for usage calculation
 */
function getCpuInfo() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;

  for (const cpu of cpus) {
    for (const type in cpu.times) {
      total += cpu.times[type as keyof typeof cpu.times];
    }
    idle += cpu.times.idle;
  }

  return { idle, total };
}

/**
 * Get estimated disk usage
 */
async function getDiskUsage(): Promise<number> {
  try {
    // In production, use proper disk monitoring
    // For now, return a simulated value
    const { exec } = require('child_process');

    return new Promise((resolve) => {
      if (process.platform === 'win32') {
        resolve(50); // Windows - would need different implementation
        return;
      }

      exec('df -h /', (error: any, stdout: string) => {
        if (error) {
          resolve(50); // Default fallback
          return;
        }

        const lines = stdout.trim().split('\n');
        if (lines.length >= 2) {
          const usage = lines[1].split(/\s+/)[4];
          const percentage = parseInt(usage.replace('%', ''));
          resolve(isNaN(percentage) ? 50 : percentage);
        } else {
          resolve(50);
        }
      });
    });

  } catch (error) {
    return 50; // Fallback value
  }
}

/**
 * Measure network latency
 */
async function getNetworkLatency(): Promise<number> {
  try {
    const start = Date.now();

    // Simple HTTP request to measure latency
    const response = await fetch('http://localhost:' + (process.env.PORT || 3000) + '/api/health', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    }).catch(() => null);

    const latency = Date.now() - start;
    return response ? latency : 999; // Return high latency if request failed

  } catch (error) {
    return 999; // High latency as fallback
  }
}

/**
 * Get frontend performance metrics from global performance data
 */
function getFrontendMetrics() {
  // In a real implementation, this would collect data from a frontend monitoring system
  // For now, return mock data structure
  return {
    renderCount: {
      'OptimizedCourseList': 45,
      'OptimizedVideoPlayer': 23,
      'OptimizedAnalyticsDashboard': 12,
      'CourseCard': 156,
      'LazyImage': 89
    },
    componentPerformance: [
      { component: 'OptimizedCourseList', renderTime: 12.5, renderCount: 45 },
      { component: 'CourseCard', renderTime: 3.2, renderCount: 156 },
      { component: 'OptimizedVideoPlayer', renderTime: 8.7, renderCount: 23 },
      { component: 'LazyImage', renderTime: 1.8, renderCount: 89 },
      { component: 'OptimizedAnalyticsDashboard', renderTime: 25.4, renderCount: 12 }
    ]
  };
}

// Health check endpoint for latency testing
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}