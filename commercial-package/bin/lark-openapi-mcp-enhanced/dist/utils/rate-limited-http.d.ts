import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { RateLimiterConfig } from './rate-limiter';
export interface RateLimitedHttpOptions {
    /** Custom rate limiting configurations */
    rateLimits?: Record<string, RateLimiterConfig>;
    /** Enable rate limiting (default: true) */
    enableRateLimit?: boolean;
    /** Logger for rate limiting events */
    logger?: {
        warn: (message: string) => void;
        info: (message: string) => void;
        debug: (message: string) => void;
    };
}
/**
 * Rate-limited HTTP instance with intelligent request categorization
 */
export declare class RateLimitedHttpInstance {
    private axiosInstance;
    private rateLimiter;
    private enableRateLimit;
    private logger;
    constructor(options?: RateLimitedHttpOptions);
    /**
     * Request interceptor that applies rate limiting
     */
    private requestInterceptor;
    /**
     * Response interceptor for successful responses
     */
    private responseInterceptor;
    /**
     * Error interceptor for failed requests
     */
    private errorInterceptor;
    /**
     * Categorize requests into rate limiting tiers based on URL and method
     */
    private categorizeRequest;
    /**
     * Get the underlying axios instance
     */
    getAxiosInstance(): AxiosInstance;
    /**
     * Get rate limiting metrics
     */
    getRateLimitMetrics(): Record<string, import("./rate-limiter").RateLimiterMetrics>;
    /**
     * Reset all rate limiters
     */
    resetRateLimiters(): void;
    /**
     * Enable or disable rate limiting
     */
    setRateLimitEnabled(enabled: boolean): void;
    /**
     * Update rate limiting configuration for a specific tier
     */
    updateRateLimit(tier: string, config: Partial<RateLimiterConfig>): void;
    /**
     * Manual request method with rate limiting
     */
    request(config: AxiosRequestConfig): Promise<any>;
    /**
     * GET request with rate limiting
     */
    get(url: string, config?: AxiosRequestConfig): Promise<any>;
    /**
     * POST request with rate limiting
     */
    post(url: string, data?: any, config?: AxiosRequestConfig): Promise<any>;
    /**
     * PUT request with rate limiting
     */
    put(url: string, data?: any, config?: AxiosRequestConfig): Promise<any>;
    /**
     * PATCH request with rate limiting
     */
    patch(url: string, data?: any, config?: AxiosRequestConfig): Promise<any>;
    /**
     * DELETE request with rate limiting
     */
    delete(url: string, config?: AxiosRequestConfig): Promise<any>;
}
/**
 * Create a rate-limited HTTP instance with default configuration
 */
export declare function createRateLimitedHttpInstance(options?: RateLimitedHttpOptions): RateLimitedHttpInstance;
/**
 * Default rate-limited HTTP instance for backward compatibility
 */
export declare const rateLimitedHttpInstance: RateLimitedHttpInstance;
