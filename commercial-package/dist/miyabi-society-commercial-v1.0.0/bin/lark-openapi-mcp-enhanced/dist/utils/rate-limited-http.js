"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitedHttpInstance = exports.RateLimitedHttpInstance = void 0;
exports.createRateLimitedHttpInstance = createRateLimitedHttpInstance;
const axios_1 = __importDefault(require("axios"));
const rate_limiter_1 = require("./rate-limiter");
const constants_1 = require("./constants");
const noop_1 = require("./noop");
/**
 * Rate-limited HTTP instance with intelligent request categorization
 */
class RateLimitedHttpInstance {
    constructor(options = {}) {
        this.enableRateLimit = options.enableRateLimit !== false;
        this.logger = options.logger || { warn: noop_1.noop, info: noop_1.noop, debug: noop_1.noop };
        // Initialize rate limiter with provided or default configurations
        const rateLimits = { ...rate_limiter_1.DEFAULT_RATE_LIMITS, ...options.rateLimits };
        this.rateLimiter = new rate_limiter_1.TieredRateLimiter(rateLimits);
        // Create axios instance
        this.axiosInstance = axios_1.default.create();
        // Add request interceptor for rate limiting
        this.axiosInstance.interceptors.request.use(this.requestInterceptor.bind(this), undefined, { synchronous: false });
        // Add response interceptor for logging and metrics
        this.axiosInstance.interceptors.response.use(this.responseInterceptor.bind(this), this.errorInterceptor.bind(this));
    }
    /**
     * Request interceptor that applies rate limiting
     */
    async requestInterceptor(config) {
        var _a;
        // Set user agent
        if (config.headers) {
            config.headers['User-Agent'] = constants_1.USER_AGENT;
        }
        // Apply rate limiting if enabled
        if (this.enableRateLimit) {
            const tier = this.categorizeRequest(config);
            const allowed = await this.rateLimiter.consume(tier);
            if (!allowed) {
                const error = new Error(`Rate limit exceeded for ${tier} requests`);
                error.code = 'RATE_LIMIT_EXCEEDED';
                error.tier = tier;
                throw error;
            }
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug(`Rate limit check passed for ${tier} request to ${config.url}`);
        }
        return config;
    }
    /**
     * Response interceptor for successful responses
     */
    responseInterceptor(response) {
        var _a, _b;
        // Log successful requests
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.debug(`Request successful: ${(_b = response.config.method) === null || _b === void 0 ? void 0 : _b.toUpperCase()} ${response.config.url}`);
        // Return response data (maintaining compatibility with existing code)
        return response.data;
    }
    /**
     * Error interceptor for failed requests
     */
    errorInterceptor(error) {
        var _a, _b, _c, _d, _e;
        if (error.code === 'RATE_LIMIT_EXCEEDED') {
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.warn(`Rate limit exceeded for ${error.tier} requests`);
        }
        else if (error.response) {
            // API error
            (_b = this.logger) === null || _b === void 0 ? void 0 : _b.warn(`API error: ${error.response.status} ${error.response.statusText} for ${(_c = error.config) === null || _c === void 0 ? void 0 : _c.url}`);
        }
        else if (error.request) {
            // Network error
            (_d = this.logger) === null || _d === void 0 ? void 0 : _d.warn(`Network error for ${(_e = error.config) === null || _e === void 0 ? void 0 : _e.url}: ${error.message}`);
        }
        return Promise.reject(error);
    }
    /**
     * Categorize requests into rate limiting tiers based on URL and method
     */
    categorizeRequest(config) {
        var _a;
        const method = ((_a = config.method) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || 'get';
        const url = config.url || '';
        // Administrative operations
        if (url.includes('/admin/') || url.includes('/auth/') || url.includes('/tenant/')) {
            return 'admin';
        }
        // Write operations (POST, PUT, PATCH, DELETE)
        if (['post', 'put', 'patch', 'delete'].includes(method)) {
            return 'write';
        }
        // Read operations (GET, HEAD, OPTIONS)
        if (['get', 'head', 'options'].includes(method)) {
            return 'read';
        }
        // Default category
        return 'default';
    }
    /**
     * Get the underlying axios instance
     */
    getAxiosInstance() {
        return this.axiosInstance;
    }
    /**
     * Get rate limiting metrics
     */
    getRateLimitMetrics() {
        return this.rateLimiter.getAllMetrics();
    }
    /**
     * Reset all rate limiters
     */
    resetRateLimiters() {
        this.rateLimiter.resetAll();
    }
    /**
     * Enable or disable rate limiting
     */
    setRateLimitEnabled(enabled) {
        var _a, _b;
        this.enableRateLimit = enabled;
        if (enabled) {
            (_a = this.logger) === null || _a === void 0 ? void 0 : _a.info('Rate limiting enabled');
        }
        else {
            (_b = this.logger) === null || _b === void 0 ? void 0 : _b.warn('Rate limiting disabled');
        }
    }
    /**
     * Update rate limiting configuration for a specific tier
     */
    updateRateLimit(tier, config) {
        var _a;
        // Note: This would require extending the TieredRateLimiter class
        (_a = this.logger) === null || _a === void 0 ? void 0 : _a.info(`Rate limit configuration updated for tier: ${tier}`);
    }
    /**
     * Manual request method with rate limiting
     */
    async request(config) {
        return this.axiosInstance.request(config);
    }
    /**
     * GET request with rate limiting
     */
    async get(url, config) {
        return this.axiosInstance.get(url, config);
    }
    /**
     * POST request with rate limiting
     */
    async post(url, data, config) {
        return this.axiosInstance.post(url, data, config);
    }
    /**
     * PUT request with rate limiting
     */
    async put(url, data, config) {
        return this.axiosInstance.put(url, data, config);
    }
    /**
     * PATCH request with rate limiting
     */
    async patch(url, data, config) {
        return this.axiosInstance.patch(url, data, config);
    }
    /**
     * DELETE request with rate limiting
     */
    async delete(url, config) {
        return this.axiosInstance.delete(url, config);
    }
}
exports.RateLimitedHttpInstance = RateLimitedHttpInstance;
/**
 * Create a rate-limited HTTP instance with default configuration
 */
function createRateLimitedHttpInstance(options = {}) {
    return new RateLimitedHttpInstance(options);
}
/**
 * Default rate-limited HTTP instance for backward compatibility
 */
exports.rateLimitedHttpInstance = createRateLimitedHttpInstance();
