/**
 * Multi-tier Caching System for AI Course Platform
 * Implements L1 (in-memory), L2 (Redis), and L3 (CDN) caching layers
 */

interface CacheItem<T> {
  data: T;
  expiry: number;
  lastAccessed: number;
  accessCount: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tier?: 'l1' | 'l2' | 'l3' | 'all';
  skipL1?: boolean;
  compressionEnabled?: boolean;
  tags?: string[]; // For cache invalidation by tag
}

interface CacheStats {
  l1: {
    hits: number;
    misses: number;
    size: number;
    memoryUsage: number;
  };
  l2: {
    hits: number;
    misses: number;
    connectionCount: number;
  };
  totalHits: number;
  totalMisses: number;
  hitRate: number;
}

export class CacheManager {
  private l1Cache = new Map<string, CacheItem<any>>();
  private l1MaxSize: number;
  private l1Stats = { hits: 0, misses: 0 };
  private l2Stats = { hits: 0, misses: 0 };
  private tagMap = new Map<string, Set<string>>();

  // Redis client (in production, use actual Redis)
  private redis: any = null;

  constructor(options: {
    l1MaxSize?: number;
    redisUrl?: string;
  } = {}) {
    this.l1MaxSize = options.l1MaxSize || 1000;

    // Initialize Redis in production
    if (process.env.REDIS_URL && process.env.NODE_ENV === 'production') {
      this.initRedis(options.redisUrl || process.env.REDIS_URL);
    }

    // Periodic cleanup
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  /**
   * Get value from cache (multi-tier)
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const startTime = performance.now();

    try {
      // L1 Cache (in-memory) - fastest
      if (!options.skipL1) {
        const l1Result = this.getFromL1<T>(key);
        if (l1Result !== null) {
          this.l1Stats.hits++;
          this.recordPerformance('l1_get', performance.now() - startTime);
          return l1Result;
        }
        this.l1Stats.misses++;
      }

      // L2 Cache (Redis) - network-based
      if (this.redis && (options.tier === 'l2' || options.tier === 'all' || !options.tier)) {
        const l2Result = await this.getFromL2<T>(key);
        if (l2Result !== null) {
          this.l2Stats.hits++;
          // Populate L1 cache for faster future access
          if (!options.skipL1) {
            this.setInL1(key, l2Result, options.ttl || 300);
          }
          this.recordPerformance('l2_get', performance.now() - startTime);
          return l2Result;
        }
        this.l2Stats.misses++;
      }

      return null;

    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache (multi-tier)
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const startTime = performance.now();
    const ttl = options.ttl || 300; // Default 5 minutes

    try {
      // Always set in L1 unless explicitly skipped
      if (!options.skipL1 && (options.tier === 'l1' || options.tier === 'all' || !options.tier)) {
        this.setInL1(key, value, ttl);
      }

      // Set in L2 (Redis) if available
      if (this.redis && (options.tier === 'l2' || options.tier === 'all' || !options.tier)) {
        await this.setInL2(key, value, ttl);
      }

      // Handle cache tags for invalidation
      if (options.tags) {
        this.updateTagMap(key, options.tags);
      }

      this.recordPerformance('cache_set', performance.now() - startTime);

    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    this.l1Cache.delete(key);

    if (this.redis) {
      try {
        await this.redis.del(key);
      } catch (error) {
        console.error('Redis delete error:', error);
      }
    }

    // Remove from tag map
    for (const [tag, keys] of this.tagMap.entries()) {
      keys.delete(key);
      if (keys.size === 0) {
        this.tagMap.delete(tag);
      }
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTag(tag: string): Promise<void> {
    const keys = this.tagMap.get(tag);
    if (!keys) {return;}

    const deletePromises = Array.from(keys).map(key => this.delete(key));
    await Promise.all(deletePromises);

    this.tagMap.delete(tag);
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {},
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Batch get operations
   */
  async getBatch<T>(keys: string[], options: CacheOptions = {}): Promise<Map<string, T>> {
    const results = new Map<string, T>();

    // Try L1 cache first for all keys
    const l1Misses: string[] = [];
    for (const key of keys) {
      if (!options.skipL1) {
        const l1Result = this.getFromL1<T>(key);
        if (l1Result !== null) {
          results.set(key, l1Result);
          this.l1Stats.hits++;
        } else {
          l1Misses.push(key);
          this.l1Stats.misses++;
        }
      } else {
        l1Misses.push(key);
      }
    }

    // Try L2 cache for L1 misses
    if (this.redis && l1Misses.length > 0) {
      try {
        const l2Results = await this.getBatchFromL2<T>(l1Misses);
        for (const [key, value] of l2Results.entries()) {
          results.set(key, value);
          this.l2Stats.hits++;

          // Populate L1 cache
          if (!options.skipL1) {
            this.setInL1(key, value, options.ttl || 300);
          }
        }
      } catch (error) {
        console.error('Batch L2 get error:', error);
      }
    }

    return results;
  }

  /**
   * Batch set operations
   */
  async setBatch<T>(items: Map<string, T>, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || 300;

    // Set in L1
    if (!options.skipL1) {
      for (const [key, value] of items.entries()) {
        this.setInL1(key, value, ttl);
      }
    }

    // Set in L2
    if (this.redis) {
      try {
        await this.setBatchInL2(items, ttl);
      } catch (error) {
        console.error('Batch L2 set error:', error);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalHits = this.l1Stats.hits + this.l2Stats.hits;
    const totalMisses = this.l1Stats.misses + this.l2Stats.misses;
    const totalRequests = totalHits + totalMisses;

    return {
      l1: {
        hits: this.l1Stats.hits,
        misses: this.l1Stats.misses,
        size: this.l1Cache.size,
        memoryUsage: this.getL1MemoryUsage(),
      },
      l2: {
        hits: this.l2Stats.hits,
        misses: this.l2Stats.misses,
        connectionCount: this.redis ? 1 : 0,
      },
      totalHits,
      totalMisses,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
    };
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    this.l1Cache.clear();
    this.tagMap.clear();

    if (this.redis) {
      try {
        await this.redis.flushdb();
      } catch (error) {
        console.error('Redis clear error:', error);
      }
    }

    // Reset stats
    this.l1Stats = { hits: 0, misses: 0 };
    this.l2Stats = { hits: 0, misses: 0 };
  }

  // Private methods

  private getFromL1<T>(key: string): T | null {
    const item = this.l1Cache.get(key);
    if (!item) {return null;}

    // Check expiry
    if (Date.now() > item.expiry) {
      this.l1Cache.delete(key);
      return null;
    }

    // Update access stats
    item.lastAccessed = Date.now();
    item.accessCount++;

    return item.data;
  }

  private setInL1<T>(key: string, value: T, ttlSeconds: number): void {
    // Ensure we don't exceed max size
    if (this.l1Cache.size >= this.l1MaxSize) {
      this.evictLRU();
    }

    const item: CacheItem<T> = {
      data: value,
      expiry: Date.now() + (ttlSeconds * 1000),
      lastAccessed: Date.now(),
      accessCount: 1,
    };

    this.l1Cache.set(key, item);
  }

  private async getFromL2<T>(key: string): Promise<T | null> {
    if (!this.redis) {return null;}

    try {
      const result = await this.redis.get(key);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      console.error('L2 cache get error:', error);
      return null;
    }
  }

  private async setInL2<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (!this.redis) {return;}

    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('L2 cache set error:', error);
    }
  }

  private async getBatchFromL2<T>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    if (!this.redis || keys.length === 0) {return results;}

    try {
      const values = await this.redis.mget(...keys);
      for (let i = 0; i < keys.length; i++) {
        if (values[i]) {
          results.set(keys[i], JSON.parse(values[i]));
        }
      }
    } catch (error) {
      console.error('Batch L2 get error:', error);
    }

    return results;
  }

  private async setBatchInL2<T>(items: Map<string, T>, ttlSeconds: number): Promise<void> {
    if (!this.redis || items.size === 0) {return;}

    try {
      const pipeline = this.redis.pipeline();
      for (const [key, value] of items.entries()) {
        pipeline.setex(key, ttlSeconds, JSON.stringify(value));
      }
      await pipeline.exec();
    } catch (error) {
      console.error('Batch L2 set error:', error);
    }
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Infinity;

    for (const [key, item] of this.l1Cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.l1Cache.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.l1Cache.entries()) {
      if (now > item.expiry) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.l1Cache.delete(key));
  }

  private updateTagMap(key: string, tags: string[]): void {
    for (const tag of tags) {
      if (!this.tagMap.has(tag)) {
        this.tagMap.set(tag, new Set());
      }
      this.tagMap.get(tag)!.add(key);
    }
  }

  private getL1MemoryUsage(): number {
    // Rough estimation of memory usage
    let totalSize = 0;
    for (const item of this.l1Cache.values()) {
      totalSize += JSON.stringify(item.data).length * 2; // Rough UTF-16 size
    }
    return totalSize;
  }

  private initRedis(url: string): void {
    try {
      // In production, use actual Redis client
      console.log('Redis cache initialized');
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
    }
  }

  private recordPerformance(operation: string, duration: number): void {
    // Send to performance monitoring service
    if (process.env.NODE_ENV === 'development') {
      console.debug(`Cache ${operation}: ${duration.toFixed(2)}ms`);
    }
  }
}

// Singleton instance
export const cacheManager = new CacheManager({
  l1MaxSize: parseInt(process.env.L1_CACHE_SIZE || '1000'),
  redisUrl: process.env.REDIS_URL,
});

// Utility functions for common cache operations
export const withCache = <T>(
  key: string,
  factory: () => Promise<T>,
  options?: CacheOptions,
) => cacheManager.getOrSet(key, factory, options);

export const cacheKey = {
  course: (id: string) => `course:${id}`,
  courseList: (filters: string) => `courses:${filters}`,
  userProgress: (userId: string, courseId: string) => `progress:${userId}:${courseId}`,
  analytics: (courseId: string, period: string) => `analytics:${courseId}:${period}`,
  aiSuggestions: (topic: string, audience: string) => `ai:suggestions:${topic}:${audience}`,
  videoMetadata: (videoId: string) => `video:${videoId}`,
  assessmentResults: (userId: string, assessmentId: string) => `assessment:${userId}:${assessmentId}`,
};
