/**
 * Rate Limiter Tests - Issue #1263
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  RateLimiter,
  ExponentialBackoff,
  createRateLimiter,
  createBackoff,
} from '../../lib/security/rate-limiter';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({
      windowMs: 1000,
      maxRequests: 5,
    });
  });

  afterEach(() => {
    limiter.destroy();
  });

  describe('check', () => {
    it('should allow requests within limit', () => {
      const result = limiter.check('user1');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
    });

    it('should track remaining requests', () => {
      limiter.check('user1');
      limiter.increment('user1');
      const result = limiter.check('user1');
      expect(result.remaining).toBe(4);
    });

    it('should block requests over limit', () => {
      for (let i = 0; i < 5; i++) {
        limiter.check('user1');
        limiter.increment('user1');
      }
      const result = limiter.check('user1');
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeDefined();
    });

    it('should track different identifiers separately', () => {
      for (let i = 0; i < 5; i++) {
        limiter.increment('user1');
      }
      const result1 = limiter.check('user1');
      const result2 = limiter.check('user2');
      expect(result1.allowed).toBe(false);
      expect(result2.allowed).toBe(true);
    });
  });

  describe('block', () => {
    it('should block identifier for specified duration', () => {
      limiter.block('user1', 5000);
      const result = limiter.check('user1');
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
    });
  });

  describe('reset', () => {
    it('should reset limit for identifier', () => {
      for (let i = 0; i < 5; i++) {
        limiter.increment('user1');
      }
      limiter.reset('user1');
      const result = limiter.check('user1');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
    });
  });

  describe('resetAll', () => {
    it('should reset all limits', () => {
      limiter.increment('user1');
      limiter.increment('user2');
      limiter.resetAll();
      const result1 = limiter.check('user1');
      const result2 = limiter.check('user2');
      expect(result1.remaining).toBe(5);
      expect(result2.remaining).toBe(5);
    });
  });

  describe('getStats', () => {
    it('should return statistics', () => {
      limiter.check('user1');
      limiter.block('user2', 5000);
      const stats = limiter.getStats();
      expect(stats.totalKeys).toBe(2);
      expect(stats.blockedKeys).toBe(1);
    });
  });

  describe('disabled limiter', () => {
    it('should allow all requests when disabled', () => {
      const disabledLimiter = new RateLimiter({ enabled: false });
      for (let i = 0; i < 100; i++) {
        disabledLimiter.increment('user1');
      }
      const result = disabledLimiter.check('user1');
      expect(result.allowed).toBe(true);
      disabledLimiter.destroy();
    });
  });
});

describe('ExponentialBackoff', () => {
  let backoff: ExponentialBackoff;

  beforeEach(() => {
    backoff = new ExponentialBackoff({
      baseDelay: 1000,
      maxDelay: 10000,
      factor: 2,
      jitter: 0,
    });
  });

  describe('getDelay', () => {
    it('should return base delay for first attempt', () => {
      const delay = backoff.getDelay('request1');
      expect(delay).toBe(1000);
    });
  });

  describe('recordFailure', () => {
    it('should increase delay exponentially', () => {
      backoff.recordFailure('request1');
      const delay1 = backoff.getDelay('request1');
      backoff.recordFailure('request1');
      const delay2 = backoff.getDelay('request1');
      expect(delay2).toBeGreaterThan(delay1);
    });

    it('should cap delay at maxDelay', () => {
      for (let i = 0; i < 20; i++) {
        backoff.recordFailure('request1');
      }
      const delay = backoff.getDelay('request1');
      expect(delay).toBeLessThanOrEqual(10000);
    });
  });

  describe('recordSuccess', () => {
    it('should reset attempts on success', () => {
      backoff.recordFailure('request1');
      backoff.recordFailure('request1');
      backoff.recordSuccess('request1');
      expect(backoff.getAttempts('request1')).toBe(0);
    });
  });

  describe('jitter', () => {
    it('should add jitter to delays', () => {
      const jitterBackoff = new ExponentialBackoff({
        baseDelay: 1000,
        jitter: 0.5,
      });
      const delays = new Set<number>();
      for (let i = 0; i < 10; i++) {
        delays.add(jitterBackoff.getDelay('request1'));
      }
      expect(delays.size).toBeGreaterThan(1);
    });
  });
});

describe('createRateLimiter', () => {
  it('should create rate limiter with config', () => {
    const limiter = createRateLimiter({ maxRequests: 10 });
    expect(limiter).toBeInstanceOf(RateLimiter);
    limiter.destroy();
  });
});

describe('createBackoff', () => {
  it('should create backoff with options', () => {
    const backoff = createBackoff({ baseDelay: 2000 });
    expect(backoff).toBeInstanceOf(ExponentialBackoff);
  });
});
