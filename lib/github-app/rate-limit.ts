/**
 * GitHub App Rate Limiting
 * Miyabi AI Agent Framework - GitHub API Rate Limit Management
 *
 * Rate Limits:
 * - GitHub API: 5000 requests/hour per installation
 * - Miyabi Platform: 100 requests/minute per user
 */

import { RATE_LIMITS, TIER_LIMITS } from './config';
import { RateLimitInfo } from './types';

interface RateLimitEntry {
  count: number;
  windowStart: number;
  violations: number;
}

interface RateLimitStore {
  hourly: Map<string, RateLimitEntry>;
  perMinute: Map<string, RateLimitEntry>;
  perSecond: Map<string, RateLimitEntry>;
}

const rateLimitStore: RateLimitStore = {
  hourly: new Map(),
  perMinute: new Map(),
  perSecond: new Map(),
};

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const SECOND_MS = 1000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
  retryAfter?: number;
}

function cleanupExpiredEntries(store: Map<string, RateLimitEntry>, windowMs: number): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  store.forEach((entry, key) => {
    if (now - entry.windowStart > windowMs) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => store.delete(key));
}

function getOrCreateEntry(
  store: Map<string, RateLimitEntry>,
  key: string,
  windowMs: number
): RateLimitEntry {
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    entry = {
      count: 0,
      windowStart: now,
      violations: entry?.violations || 0,
    };
    store.set(key, entry);
  }

  return entry;
}

export function checkGitHubApiRateLimit(
  installationId: number | string
): RateLimitResult {
  const key = `github:${installationId}`;

  cleanupExpiredEntries(rateLimitStore.hourly, HOUR_MS);
  cleanupExpiredEntries(rateLimitStore.perMinute, MINUTE_MS);

  const hourlyEntry = getOrCreateEntry(rateLimitStore.hourly, key, HOUR_MS);
  const minuteEntry = getOrCreateEntry(rateLimitStore.perMinute, key, MINUTE_MS);

  const hourlyLimit = RATE_LIMITS.github_api.hourly;
  const minuteLimit = RATE_LIMITS.github_api.per_minute;

  const hourlyRemaining = Math.max(0, hourlyLimit - hourlyEntry.count);
  const minuteRemaining = Math.max(0, minuteLimit - minuteEntry.count);

  const hourlyAllowed = hourlyEntry.count < hourlyLimit;
  const minuteAllowed = minuteEntry.count < minuteLimit;

  if (!hourlyAllowed) {
    const resetAt = hourlyEntry.windowStart + HOUR_MS;
    return {
      allowed: false,
      remaining: 0,
      limit: hourlyLimit,
      resetAt,
      retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
    };
  }

  if (!minuteAllowed) {
    const resetAt = minuteEntry.windowStart + MINUTE_MS;
    return {
      allowed: false,
      remaining: 0,
      limit: minuteLimit,
      resetAt,
      retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
    };
  }

  hourlyEntry.count++;
  minuteEntry.count++;

  return {
    allowed: true,
    remaining: Math.min(hourlyRemaining - 1, minuteRemaining - 1),
    limit: hourlyLimit,
    resetAt: hourlyEntry.windowStart + HOUR_MS,
  };
}

export function checkWebhookRateLimit(sourceIp: string): RateLimitResult {
  const key = `webhook:${sourceIp}`;

  cleanupExpiredEntries(rateLimitStore.perSecond, SECOND_MS);

  const entry = getOrCreateEntry(rateLimitStore.perSecond, key, SECOND_MS);
  const limit = RATE_LIMITS.webhooks.per_second;
  const burstLimit = RATE_LIMITS.webhooks.burst;

  const effectiveLimit = entry.count < limit ? limit : burstLimit;
  const allowed = entry.count < effectiveLimit;

  if (!allowed) {
    entry.violations++;
    const resetAt = entry.windowStart + SECOND_MS;
    return {
      allowed: false,
      remaining: 0,
      limit,
      resetAt,
      retryAfter: 1,
    };
  }

  entry.count++;

  return {
    allowed: true,
    remaining: effectiveLimit - entry.count,
    limit,
    resetAt: entry.windowStart + SECOND_MS,
  };
}

export function checkOAuthRateLimit(clientIp: string): RateLimitResult {
  const key = `oauth:${clientIp}`;

  cleanupExpiredEntries(rateLimitStore.perMinute, MINUTE_MS);

  const entry = getOrCreateEntry(rateLimitStore.perMinute, key, MINUTE_MS);
  const limit = RATE_LIMITS.oauth.per_minute;

  const allowed = entry.count < limit;

  if (!allowed) {
    entry.violations++;
    const resetAt = entry.windowStart + MINUTE_MS;
    return {
      allowed: false,
      remaining: 0,
      limit,
      resetAt,
      retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
    };
  }

  entry.count++;

  return {
    allowed: true,
    remaining: limit - entry.count,
    limit,
    resetAt: entry.windowStart + MINUTE_MS,
  };
}

export function checkTierLimits(
  installationId: string,
  tier: 'free' | 'pro' | 'enterprise',
  currentMonthlyIssues: number
): { allowed: boolean; reason?: string; limit: number; used: number } {
  const limits = TIER_LIMITS[tier];

  if (limits.monthly_issues !== -1 && currentMonthlyIssues >= limits.monthly_issues) {
    return {
      allowed: false,
      reason: `Monthly issue limit reached (${limits.monthly_issues} issues/month for ${tier} tier)`,
      limit: limits.monthly_issues,
      used: currentMonthlyIssues,
    };
  }

  return {
    allowed: true,
    limit: limits.monthly_issues,
    used: currentMonthlyIssues,
  };
}

export function parseGitHubRateLimitHeaders(headers: Headers): RateLimitInfo | null {
  const limit = headers.get('x-ratelimit-limit');
  const remaining = headers.get('x-ratelimit-remaining');
  const reset = headers.get('x-ratelimit-reset');
  const used = headers.get('x-ratelimit-used');
  const resource = headers.get('x-ratelimit-resource');

  if (!limit || !remaining || !reset) {
    return null;
  }

  return {
    limit: parseInt(limit, 10),
    remaining: parseInt(remaining, 10),
    reset: parseInt(reset, 10),
    used: used ? parseInt(used, 10) : parseInt(limit, 10) - parseInt(remaining, 10),
    resource: (resource as RateLimitInfo['resource']) || 'core',
  };
}

export function shouldRetryAfterRateLimit(
  rateLimitInfo: RateLimitInfo,
  maxWaitSeconds: number = 60
): { shouldRetry: boolean; waitSeconds: number } {
  if (rateLimitInfo.remaining > 0) {
    return { shouldRetry: true, waitSeconds: 0 };
  }

  const now = Math.floor(Date.now() / 1000);
  const waitSeconds = Math.max(0, rateLimitInfo.reset - now);

  if (waitSeconds <= maxWaitSeconds) {
    return { shouldRetry: true, waitSeconds };
  }

  return { shouldRetry: false, waitSeconds };
}

export async function withRateLimit<T>(
  installationId: number | string,
  operation: () => Promise<T>,
  retries: number = 3
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const rateLimitResult = checkGitHubApiRateLimit(installationId);

    if (!rateLimitResult.allowed) {
      if (attempt === retries) {
        throw new Error(
          `Rate limit exceeded. Retry after ${rateLimitResult.retryAfter} seconds.`
        );
      }

      const waitMs = (rateLimitResult.retryAfter || 1) * 1000;
      console.log(`Rate limited. Waiting ${waitMs}ms before retry ${attempt + 1}/${retries}`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      continue;
    }

    try {
      return await operation();
    } catch (error) {
      if (error instanceof Error && error.message.includes('rate limit')) {
        if (attempt === retries) {
          throw error;
        }
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 30000);
        console.log(`Rate limit error. Backing off ${backoffMs}ms`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        continue;
      }
      throw error;
    }
  }

  throw new Error('Unexpected end of rate limit retry loop');
}

export function getRateLimitStats(installationId: number | string): {
  hourly: { used: number; limit: number; resetAt: number };
  perMinute: { used: number; limit: number; resetAt: number };
} {
  const key = `github:${installationId}`;

  const hourlyEntry = rateLimitStore.hourly.get(key);
  const minuteEntry = rateLimitStore.perMinute.get(key);

  const now = Date.now();

  return {
    hourly: {
      used: hourlyEntry?.count || 0,
      limit: RATE_LIMITS.github_api.hourly,
      resetAt: hourlyEntry ? hourlyEntry.windowStart + HOUR_MS : now + HOUR_MS,
    },
    perMinute: {
      used: minuteEntry?.count || 0,
      limit: RATE_LIMITS.github_api.per_minute,
      resetAt: minuteEntry ? minuteEntry.windowStart + MINUTE_MS : now + MINUTE_MS,
    },
  };
}
