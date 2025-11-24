/**
 * Token Bucket Rate Limiter Implementation
 * Provides configurable rate limiting for API calls to prevent quota exhaustion
 */
export interface RateLimiterConfig {
    /** Maximum number of tokens in the bucket */
    capacity: number;
    /** Number of tokens to refill per refill interval */
    tokensPerInterval: number;
    /** Refill interval in milliseconds */
    intervalMs: number;
    /** Maximum time to wait for a token (ms). If 0, fails immediately when no tokens */
    maxWaitTimeMs?: number;
}
export interface RateLimiterMetrics {
    /** Current number of available tokens */
    availableTokens: number;
    /** Total requests made */
    totalRequests: number;
    /** Total requests that were rate limited */
    rateLimitedRequests: number;
    /** Average wait time for requests (ms) */
    averageWaitTime: number;
    /** Last refill timestamp */
    lastRefill: number;
}
export declare class TokenBucketRateLimiter {
    private config;
    private tokens;
    private lastRefill;
    private totalRequests;
    private rateLimitedRequests;
    private totalWaitTime;
    constructor(config: RateLimiterConfig);
    /**
     * Attempt to consume a token. Returns a promise that resolves when a token is available.
     * @param tokensRequested Number of tokens to consume (default: 1)
     * @returns Promise that resolves to true if tokens were consumed, false if rate limited
     */
    consume(tokensRequested?: number): Promise<boolean>;
    /**
     * Refill tokens based on elapsed time
     */
    private refill;
    /**
     * Get current rate limiter metrics
     */
    getMetrics(): RateLimiterMetrics;
    /**
     * Reset the rate limiter to initial state
     */
    reset(): void;
    /**
     * Update rate limiter configuration
     */
    updateConfig(newConfig: Partial<RateLimiterConfig>): void;
    private delay;
}
/**
 * Multi-tier rate limiter that supports different limits for different types of operations
 */
export declare class TieredRateLimiter {
    private configs;
    private limiters;
    constructor(configs: Record<string, RateLimiterConfig>);
    /**
     * Consume tokens from a specific tier
     */
    consume(tier: string, tokensRequested?: number): Promise<boolean>;
    /**
     * Get metrics for all tiers
     */
    getAllMetrics(): Record<string, RateLimiterMetrics>;
    /**
     * Get metrics for a specific tier
     */
    getMetrics(tier: string): RateLimiterMetrics | null;
    /**
     * Reset all rate limiters
     */
    resetAll(): void;
    /**
     * Reset a specific tier
     */
    reset(tier: string): void;
}
/**
 * Default rate limiting configurations for Feishu/Lark API
 * Based on typical API rate limits and best practices
 */
export declare const DEFAULT_RATE_LIMITS: Record<string, RateLimiterConfig>;
