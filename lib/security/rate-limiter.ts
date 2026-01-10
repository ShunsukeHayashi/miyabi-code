/**
 * Rate Limiter - Issue #1263
 * Client-side rate limiting with exponential backoff
 */

import type { RateLimitConfig, RateLimitResult } from './types';

interface RateLimitEntry {
  count: number;
  windowStart: number;
  blocked: boolean;
  backoffUntil?: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  enabled: true,
  windowMs: 60000,
  maxRequests: 100,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};

export class RateLimiter {
  private config: RateLimitConfig;
  private store: Map<string, RateLimitEntry>;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.store = new Map();

    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), this.config.windowMs);
    }
  }

  check(identifier: string): RateLimitResult {
    if (!this.config.enabled) {
      return { allowed: true, remaining: this.config.maxRequests, resetTime: 0 };
    }

    const key = this.config.keyGenerator
      ? this.config.keyGenerator(identifier)
      : identifier;

    const now = Date.now();
    let entry = this.store.get(key);

    if (entry?.backoffUntil && now < entry.backoffUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.backoffUntil,
        retryAfter: Math.ceil((entry.backoffUntil - now) / 1000),
      };
    }

    if (!entry || now - entry.windowStart >= this.config.windowMs) {
      entry = {
        count: 0,
        windowStart: now,
        blocked: false,
      };
      this.store.set(key, entry);
    }

    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    const resetTime = entry.windowStart + this.config.windowMs;

    if (entry.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil((resetTime - now) / 1000),
      };
    }

    return { allowed: true, remaining, resetTime };
  }

  increment(identifier: string, success: boolean = true): void {
    if (!this.config.enabled) return;

    if (this.config.skipSuccessfulRequests && success) return;
    if (this.config.skipFailedRequests && !success) return;

    const key = this.config.keyGenerator
      ? this.config.keyGenerator(identifier)
      : identifier;

    const entry = this.store.get(key);
    if (entry) {
      entry.count++;
    }
  }

  block(identifier: string, durationMs: number): void {
    const key = this.config.keyGenerator
      ? this.config.keyGenerator(identifier)
      : identifier;

    const now = Date.now();
    const entry = this.store.get(key) || {
      count: this.config.maxRequests,
      windowStart: now,
      blocked: true,
    };

    entry.blocked = true;
    entry.backoffUntil = now + durationMs;
    this.store.set(key, entry);
  }

  reset(identifier: string): void {
    const key = this.config.keyGenerator
      ? this.config.keyGenerator(identifier)
      : identifier;

    this.store.delete(key);
  }

  resetAll(): void {
    this.store.clear();
  }

  getStats(): { totalKeys: number; blockedKeys: number } {
    let blockedKeys = 0;
    const now = Date.now();

    for (const entry of Array.from(this.store.values())) {
      if (entry.blocked || (entry.backoffUntil && now < entry.backoffUntil)) {
        blockedKeys++;
      }
    }

    return { totalKeys: this.store.size, blockedKeys };
  }

  private cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of Array.from(this.store.entries())) {
      const expired = now - entry.windowStart >= this.config.windowMs * 2;
      const backoffExpired = !entry.backoffUntil || now >= entry.backoffUntil;

      if (expired && backoffExpired) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

export class ExponentialBackoff {
  private baseDelay: number;
  private maxDelay: number;
  private factor: number;
  private jitter: number;
  private attempts: Map<string, number>;

  constructor(options?: {
    baseDelay?: number;
    maxDelay?: number;
    factor?: number;
    jitter?: number;
  }) {
    this.baseDelay = options?.baseDelay ?? 1000;
    this.maxDelay = options?.maxDelay ?? 60000;
    this.factor = options?.factor ?? 2;
    this.jitter = options?.jitter ?? 0.1;
    this.attempts = new Map();
  }

  getDelay(identifier: string): number {
    const attempts = this.attempts.get(identifier) || 0;
    const delay = Math.min(
      this.baseDelay * Math.pow(this.factor, attempts),
      this.maxDelay
    );

    const jitterRange = delay * this.jitter;
    const jitterOffset = (Math.random() - 0.5) * 2 * jitterRange;

    return Math.round(delay + jitterOffset);
  }

  recordFailure(identifier: string): number {
    const attempts = (this.attempts.get(identifier) || 0) + 1;
    this.attempts.set(identifier, attempts);
    return this.getDelay(identifier);
  }

  recordSuccess(identifier: string): void {
    this.attempts.delete(identifier);
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  resetAll(): void {
    this.attempts.clear();
  }

  getAttempts(identifier: string): number {
    return this.attempts.get(identifier) || 0;
  }
}

export function createRateLimiter(config?: Partial<RateLimitConfig>): RateLimiter {
  return new RateLimiter(config);
}

export function createBackoff(options?: {
  baseDelay?: number;
  maxDelay?: number;
  factor?: number;
  jitter?: number;
}): ExponentialBackoff {
  return new ExponentialBackoff(options);
}
