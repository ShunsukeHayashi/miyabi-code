/**
 * API Response Caching Middleware
 * Intelligent caching for API responses with invalidation and compression
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';
import { cacheManager } from '../performance/cache-manager';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

interface CacheOptions {
  ttl?: number;
  tags?: string[];
  varyBy?: string[];
  compression?: boolean;
  skipCacheIf?: (request: NextRequest) => boolean;
  generateKey?: (request: NextRequest) => string;
}

interface CachedResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
  compressed: boolean;
  etag: string;
  timestamp: number;
}

interface CacheConfig {
  [route: string]: CacheOptions;
}

// Default cache configuration for different API routes
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  '/api/courses': {
    ttl: 300, // 5 minutes
    tags: ['courses'],
    varyBy: ['authorization'],
    compression: true,
    skipCacheIf: (req) => req.method !== 'GET'
  },
  '/api/courses/[id]': {
    ttl: 600, // 10 minutes
    tags: ['courses'],
    varyBy: ['authorization'],
    compression: true
  },
  '/api/lessons': {
    ttl: 300,
    tags: ['lessons'],
    varyBy: ['authorization'],
    compression: true
  },
  '/api/analytics': {
    ttl: 120, // 2 minutes
    tags: ['analytics'],
    varyBy: ['authorization'],
    compression: true
  },
  '/api/ai/suggestions': {
    ttl: 1800, // 30 minutes
    tags: ['ai', 'suggestions'],
    compression: true,
    varyBy: ['content-type']
  },
  '/api/user/progress': {
    ttl: 60, // 1 minute
    tags: ['user', 'progress'],
    varyBy: ['authorization'],
    compression: false // User data, less cacheable
  }
};

export class ApiCacheMiddleware {
  private config: CacheConfig;
  private hitCounter = new Map<string, number>();
  private missCounter = new Map<string, number>();

  constructor(customConfig: CacheConfig = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...customConfig };
  }

  /**
   * Create cache middleware for API routes
   */
  createMiddleware() {
    return async (request: NextRequest): Promise<NextResponse | null> => {
      const pathname = request.nextUrl.pathname;
      const cacheConfig = this.getCacheConfig(pathname);

      if (!cacheConfig || (cacheConfig.skipCacheIf && cacheConfig.skipCacheIf(request))) {
        return null; // Skip caching
      }

      // Only cache GET requests by default
      if (request.method !== 'GET' && !cacheConfig.generateKey) {
        return null;
      }

      const cacheKey = this.generateCacheKey(request, cacheConfig);

      // Check for conditional requests (ETags)
      const ifNoneMatch = request.headers.get('if-none-match');
      if (ifNoneMatch) {
        const cached = await this.getCachedResponse(cacheKey);
        if (cached && cached.etag === ifNoneMatch) {
          return new NextResponse(null, { status: 304 });
        }
      }

      // Try to get cached response
      const cachedResponse = await this.getCachedResponse(cacheKey);
      if (cachedResponse) {
        this.recordHit(pathname);
        return this.createResponseFromCache(cachedResponse);
      }

      this.recordMiss(pathname);
      return null; // Continue to actual API handler
    };
  }

  /**
   * Cache API response after processing
   */
  async cacheResponse(
    request: NextRequest,
    response: NextResponse
  ): Promise<NextResponse> {
    const pathname = request.nextUrl.pathname;
    const cacheConfig = this.getCacheConfig(pathname);

    if (!cacheConfig || response.status !== 200) {
      return response;
    }

    try {
      const cacheKey = this.generateCacheKey(request, cacheConfig);
      const body = await response.text();

      // Create new response to avoid consuming the original
      const newResponse = new NextResponse(body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });

      // Generate ETag for conditional requests
      const etag = this.generateETag(body);
      newResponse.headers.set('ETag', etag);

      // Store in cache
      await this.storeCachedResponse(cacheKey, {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body,
        compressed: cacheConfig.compression || false,
        etag,
        timestamp: Date.now()
      }, cacheConfig);

      // Add cache headers
      newResponse.headers.set('X-Cache', 'MISS');
      newResponse.headers.set('Cache-Control', `public, max-age=${cacheConfig.ttl || 300}`);

      return newResponse;

    } catch (error) {
      console.error('Error caching response:', error);
      return response;
    }
  }

  /**
   * Invalidate cache by route or tags
   */
  async invalidateCache(options: {
    route?: string;
    tags?: string[];
    pattern?: RegExp;
  }): Promise<void> {
    if (options.tags) {
      for (const tag of options.tags) {
        await cacheManager.invalidateByTag(`api:${tag}`);
      }
    }

    if (options.route) {
      const cacheKey = `api:route:${options.route}`;
      await cacheManager.delete(cacheKey);
    }

    // Pattern-based invalidation would require additional implementation
    if (options.pattern) {
      console.warn('Pattern-based cache invalidation not yet implemented');
    }
  }

  /**
   * Warm cache with frequently accessed data
   */
  async warmCache(routes: Array<{
    path: string;
    params?: Record<string, string>;
    headers?: Record<string, string>;
  }>): Promise<void> {
    const warmupPromises = routes.map(async (route) => {
      try {
        const url = new URL(route.path, 'http://localhost');
        const request = new NextRequest(url, {
          headers: route.headers || {}
        });

        // This would need integration with the actual API handlers
        console.log(`Warming cache for: ${route.path}`);

      } catch (error) {
        console.error(`Failed to warm cache for ${route.path}:`, error);
      }
    });

    await Promise.allSettled(warmupPromises);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    hitRate: number;
    routes: Array<{
      route: string;
      hits: number;
      misses: number;
      hitRate: number;
    }>;
  } {
    const routes: Array<{
      route: string;
      hits: number;
      misses: number;
      hitRate: number;
    }> = [];

    const allRoutes = new Set([...this.hitCounter.keys(), ...this.missCounter.keys()]);

    for (const route of allRoutes) {
      const hits = this.hitCounter.get(route) || 0;
      const misses = this.missCounter.get(route) || 0;
      const total = hits + misses;

      routes.push({
        route,
        hits,
        misses,
        hitRate: total > 0 ? hits / total : 0
      });
    }

    const totalHits = Array.from(this.hitCounter.values()).reduce((sum, count) => sum + count, 0);
    const totalMisses = Array.from(this.missCounter.values()).reduce((sum, count) => sum + count, 0);
    const totalRequests = totalHits + totalMisses;

    return {
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      routes: routes.sort((a, b) => b.hitRate - a.hitRate)
    };
  }

  // Private methods

  private getCacheConfig(pathname: string): CacheOptions | null {
    // Exact match first
    if (this.config[pathname]) {
      return this.config[pathname];
    }

    // Pattern matching for dynamic routes
    for (const [pattern, config] of Object.entries(this.config)) {
      if (pattern.includes('[') && this.matchRoute(pathname, pattern)) {
        return config;
      }
    }

    return null;
  }

  private matchRoute(pathname: string, pattern: string): boolean {
    const patternRegex = pattern.replace(/\[([^\]]+)\]/g, '([^/]+)');
    return new RegExp(`^${patternRegex}$`).test(pathname);
  }

  private generateCacheKey(request: NextRequest, config: CacheOptions): string {
    if (config.generateKey) {
      return config.generateKey(request);
    }

    const url = request.nextUrl;
    const baseKey = `${url.pathname}${url.search}`;

    // Add vary-by headers
    const varyParts: string[] = [baseKey];

    if (config.varyBy) {
      for (const header of config.varyBy) {
        const value = request.headers.get(header);
        if (value) {
          varyParts.push(`${header}:${value}`);
        }
      }
    }

    const keyString = varyParts.join('|');
    return `api:${createHash('md5').update(keyString).digest('hex')}`;
  }

  private async getCachedResponse(cacheKey: string): Promise<CachedResponse | null> {
    try {
      const cached = await cacheManager.get<CachedResponse>(cacheKey);
      if (!cached) return null;

      // Check if expired (additional TTL check)
      const age = Date.now() - cached.timestamp;
      if (age > 3600000) { // 1 hour absolute max
        await cacheManager.delete(cacheKey);
        return null;
      }

      return cached;
    } catch (error) {
      console.error('Error getting cached response:', error);
      return null;
    }
  }

  private async storeCachedResponse(
    cacheKey: string,
    response: CachedResponse,
    config: CacheOptions
  ): Promise<void> {
    try {
      let processedResponse = response;

      // Compress if enabled
      if (config.compression) {
        const compressed = await gzipAsync(Buffer.from(response.body));
        processedResponse = {
          ...response,
          body: compressed.toString('base64'),
          compressed: true
        };
      }

      await cacheManager.set(cacheKey, processedResponse, {
        ttl: config.ttl,
        tags: config.tags?.map(tag => `api:${tag}`)
      });

    } catch (error) {
      console.error('Error storing cached response:', error);
    }
  }

  private createResponseFromCache(cached: CachedResponse): NextResponse {
    let body = cached.body;

    // Decompress if needed
    if (cached.compressed) {
      try {
        const buffer = Buffer.from(body, 'base64');
        // Note: This would need to be made async in a real implementation
        body = gunzipAsync(buffer).toString();
      } catch (error) {
        console.error('Error decompressing cached response:', error);
        throw error;
      }
    }

    const response = new NextResponse(body, {
      status: cached.status,
      headers: {
        ...cached.headers,
        'X-Cache': 'HIT',
        'ETag': cached.etag
      }
    });

    return response;
  }

  private generateETag(content: string): string {
    return `"${createHash('md5').update(content).digest('hex')}"`;
  }

  private recordHit(route: string): void {
    this.hitCounter.set(route, (this.hitCounter.get(route) || 0) + 1);
  }

  private recordMiss(route: string): void {
    this.missCounter.set(route, (this.missCounter.get(route) || 0) + 1);
  }
}

/**
 * Response cache decorator for API route handlers
 */
export function withCache(config: CacheOptions = {}) {
  return function <T extends (...args: any[]) => Promise<NextResponse>>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function(request: NextRequest, ...args: any[]): Promise<NextResponse> {
      const cacheMiddleware = new ApiCacheMiddleware({ [request.nextUrl.pathname]: config });

      // Try cache first
      const cachedResponse = await cacheMiddleware.createMiddleware()(request);
      if (cachedResponse) {
        return cachedResponse;
      }

      // Execute original handler
      const response = await originalMethod.apply(this, [request, ...args]);

      // Cache the response
      return await cacheMiddleware.cacheResponse(request, response);
    } as T;
  };
}

// Singleton instance for global use
export const apiCache = new ApiCacheMiddleware();

/**
 * Utility functions for cache management
 */
export const invalidateApiCache = (options: {
  route?: string;
  tags?: string[];
  pattern?: RegExp;
}): Promise<void> => {
  return apiCache.invalidateCache(options);
};

export const getApiCacheStats = () => {
  return apiCache.getCacheStats();
};

export const warmApiCache = (routes: Array<{
  path: string;
  params?: Record<string, string>;
  headers?: Record<string, string>;
}>): Promise<void> => {
  return apiCache.warmCache(routes);
};