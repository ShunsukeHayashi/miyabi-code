/**
 * GitHub Rate Limiting Tests
 * Miyabi AI Agent Framework - Rate Limit Management Testing
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  checkGitHubApiRateLimit,
  checkWebhookRateLimit,
  checkOAuthRateLimit,
  checkTierLimits,
  parseGitHubRateLimitHeaders,
  shouldRetryAfterRateLimit,
  getRateLimitStats,
} from '../../lib/github-app/rate-limit';

describe('GitHub Rate Limiting', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-07T10:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('checkGitHubApiRateLimit', () => {
    it('should allow requests within rate limit', () => {
      const installationId = 'test-installation-1';

      const result = checkGitHubApiRateLimit(installationId);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
      expect(result.limit).toBe(5000);
    });

    it('should track request count per installation', () => {
      const installationId = 'test-installation-2';

      const result1 = checkGitHubApiRateLimit(installationId);
      const result2 = checkGitHubApiRateLimit(installationId);

      expect(result1.remaining).toBeGreaterThan(result2.remaining);
      expect(result1.remaining - result2.remaining).toBe(1);
    });

    it('should separate rate limits by installation', () => {
      const installation1 = 'installation-a';
      const installation2 = 'installation-b';

      for (let i = 0; i < 10; i++) {
        checkGitHubApiRateLimit(installation1);
      }

      const result2 = checkGitHubApiRateLimit(installation2);
      expect(result2.remaining).toBe(5000 - 1);
    });
  });

  describe('checkWebhookRateLimit', () => {
    it('should allow requests within per-second limit', () => {
      const sourceIp = '192.168.1.1';

      const result = checkWebhookRateLimit(sourceIp);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(10);
    });

    it('should block requests exceeding per-second limit', () => {
      const sourceIp = '192.168.1.2';

      for (let i = 0; i < 50; i++) {
        checkWebhookRateLimit(sourceIp);
      }

      const result = checkWebhookRateLimit(sourceIp);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBe(1);
    });

    it('should reset after window expires', () => {
      const sourceIp = '192.168.1.3';

      for (let i = 0; i < 50; i++) {
        checkWebhookRateLimit(sourceIp);
      }

      jest.advanceTimersByTime(1001);

      const result = checkWebhookRateLimit(sourceIp);
      expect(result.allowed).toBe(true);
    });
  });

  describe('checkOAuthRateLimit', () => {
    it('should allow OAuth requests within limit', () => {
      const clientIp = '10.0.0.1';

      const result = checkOAuthRateLimit(clientIp);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(20);
    });

    it('should block excessive OAuth attempts', () => {
      const clientIp = '10.0.0.2';

      for (let i = 0; i < 20; i++) {
        checkOAuthRateLimit(clientIp);
      }

      const result = checkOAuthRateLimit(clientIp);
      expect(result.allowed).toBe(false);
    });
  });

  describe('checkTierLimits', () => {
    it('should allow free tier within monthly limit', () => {
      const result = checkTierLimits('inst-1', 'free', 50);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(100);
      expect(result.used).toBe(50);
    });

    it('should block free tier at monthly limit', () => {
      const result = checkTierLimits('inst-2', 'free', 100);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Monthly issue limit reached');
    });

    it('should allow unlimited for pro tier', () => {
      const result = checkTierLimits('inst-3', 'pro', 10000);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(-1);
    });

    it('should allow unlimited for enterprise tier', () => {
      const result = checkTierLimits('inst-4', 'enterprise', 100000);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(-1);
    });
  });

  describe('parseGitHubRateLimitHeaders', () => {
    it('should parse valid rate limit headers', () => {
      const headers = new Headers({
        'x-ratelimit-limit': '5000',
        'x-ratelimit-remaining': '4999',
        'x-ratelimit-reset': '1704628800',
        'x-ratelimit-used': '1',
        'x-ratelimit-resource': 'core',
      });

      const result = parseGitHubRateLimitHeaders(headers);

      expect(result).toBeDefined();
      expect(result?.limit).toBe(5000);
      expect(result?.remaining).toBe(4999);
      expect(result?.used).toBe(1);
      expect(result?.resource).toBe('core');
    });

    it('should return null for missing headers', () => {
      const headers = new Headers({});

      const result = parseGitHubRateLimitHeaders(headers);

      expect(result).toBeNull();
    });

    it('should calculate used from limit and remaining if not provided', () => {
      const headers = new Headers({
        'x-ratelimit-limit': '5000',
        'x-ratelimit-remaining': '4500',
        'x-ratelimit-reset': '1704628800',
      });

      const result = parseGitHubRateLimitHeaders(headers);

      expect(result).toBeDefined();
      expect(result?.used).toBe(500);
    });
  });

  describe('shouldRetryAfterRateLimit', () => {
    it('should not retry if remaining > 0', () => {
      const rateLimitInfo = {
        limit: 5000,
        remaining: 100,
        reset: Math.floor(Date.now() / 1000) + 3600,
        used: 4900,
        resource: 'core' as const,
      };

      const result = shouldRetryAfterRateLimit(rateLimitInfo);

      expect(result.shouldRetry).toBe(true);
      expect(result.waitSeconds).toBe(0);
    });

    it('should calculate wait time when rate limited', () => {
      const resetTime = Math.floor(Date.now() / 1000) + 30;
      const rateLimitInfo = {
        limit: 5000,
        remaining: 0,
        reset: resetTime,
        used: 5000,
        resource: 'core' as const,
      };

      const result = shouldRetryAfterRateLimit(rateLimitInfo, 60);

      expect(result.shouldRetry).toBe(true);
      expect(result.waitSeconds).toBeGreaterThan(0);
      expect(result.waitSeconds).toBeLessThanOrEqual(30);
    });

    it('should not retry if wait time exceeds max', () => {
      const resetTime = Math.floor(Date.now() / 1000) + 3600;
      const rateLimitInfo = {
        limit: 5000,
        remaining: 0,
        reset: resetTime,
        used: 5000,
        resource: 'core' as const,
      };

      const result = shouldRetryAfterRateLimit(rateLimitInfo, 60);

      expect(result.shouldRetry).toBe(false);
    });
  });

  describe('getRateLimitStats', () => {
    it('should return current rate limit statistics', () => {
      const installationId = 'stats-test-installation';

      for (let i = 0; i < 5; i++) {
        checkGitHubApiRateLimit(installationId);
      }

      const stats = getRateLimitStats(installationId);

      expect(stats.hourly.used).toBe(5);
      expect(stats.hourly.limit).toBe(5000);
      expect(stats.perMinute.used).toBe(5);
      expect(stats.perMinute.limit).toBe(100);
    });
  });
});
