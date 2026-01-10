/**
 * Security Module - Issue #1263
 * Comprehensive security hardening for Miyabi
 *
 * Features:
 * - Input validation and sanitization
 * - Rate limiting with exponential backoff
 * - CSRF protection
 * - CSP and security headers
 * - API key management
 * - Request signing and verification
 */

export * from './types';

export {
  InputSanitizer,
  createSanitizer,
  defaultSanitizer,
} from './sanitizer';

export {
  RateLimiter,
  ExponentialBackoff,
  createRateLimiter,
  createBackoff,
} from './rate-limiter';

export {
  CSPBuilder,
  SecurityHeadersBuilder,
  createCSPBuilder,
  createSecurityHeaders,
  buildDefaultCSP,
  buildDefaultSecurityHeaders,
} from './csp';

export {
  CSRFProtection,
  OriginValidator,
  DoubleSubmitCookie,
  createCSRFProtection,
  createOriginValidator,
  createDoubleSubmitCookie,
} from './csrf';

export {
  InputValidator,
  createValidator,
  validateRequest,
  isValidEmail,
  isValidURL,
  isValidUUID,
  isValidJSON,
  isValidBase64,
  isValidHex,
  isValidIPv4,
  isValidIPv6,
  sanitizeInteger,
  sanitizeString,
} from './validation';

export {
  APIKeyManager,
  RequestSigner,
  BearerTokenValidator,
  createAPIKeyManager,
  createRequestSigner,
  createBearerValidator,
  generateSecureToken,
  hashToken,
  type APIKey,
  type APIKeyValidationResult,
} from './api-protection';

export {
  SecurityConfigManager,
  getSecurityConfig,
  createSecurityConfigManager,
  resetGlobalConfig,
  DEFAULT_SECURITY_CONFIG,
  ENVIRONMENT_CONFIGS,
} from './config';

import { InputSanitizer } from './sanitizer';
import { RateLimiter, ExponentialBackoff } from './rate-limiter';
import { CSPBuilder, SecurityHeadersBuilder } from './csp';
import { CSRFProtection, OriginValidator } from './csrf';
import { InputValidator } from './validation';
import { APIKeyManager, RequestSigner } from './api-protection';
import { SecurityConfigManager, getSecurityConfig } from './config';

export class SecurityService {
  readonly sanitizer: InputSanitizer;
  readonly rateLimiter: RateLimiter;
  readonly backoff: ExponentialBackoff;
  readonly csp: CSPBuilder;
  readonly headers: SecurityHeadersBuilder;
  readonly csrf: CSRFProtection;
  readonly originValidator: OriginValidator;
  readonly inputValidator: InputValidator;
  readonly apiKeyManager: APIKeyManager;
  readonly requestSigner: RequestSigner;
  readonly configManager: SecurityConfigManager;

  constructor(options?: {
    environment?: string;
    signingSecret?: string;
    allowedOrigins?: string[];
  }) {
    const config = getSecurityConfig(options?.environment);

    this.configManager = new SecurityConfigManager(options?.environment);
    this.sanitizer = new InputSanitizer(config.sanitization);
    this.rateLimiter = new RateLimiter(config.rateLimit);
    this.backoff = new ExponentialBackoff();
    this.csp = new CSPBuilder(config.csp);
    this.headers = new SecurityHeadersBuilder(config.headers);
    this.csrf = new CSRFProtection(config.csrf);
    this.originValidator = new OriginValidator(options?.allowedOrigins);
    this.inputValidator = new InputValidator();
    this.apiKeyManager = new APIKeyManager();
    this.requestSigner = new RequestSigner(
      options?.signingSecret || 'default-signing-secret-change-me'
    );
  }

  sanitizeInput(input: string): string {
    return this.sanitizer.sanitizeText(input);
  }

  sanitizeHTML(input: string) {
    return this.sanitizer.sanitizeHTML(input);
  }

  sanitizePrompt(input: string) {
    return this.sanitizer.sanitizePrompt(input);
  }

  checkRateLimit(identifier: string) {
    return this.rateLimiter.check(identifier);
  }

  incrementRateLimit(identifier: string, success?: boolean) {
    this.rateLimiter.increment(identifier, success);
  }

  generateCSRFToken(sessionId?: string): string {
    return this.csrf.generateToken(sessionId);
  }

  validateCSRFToken(token: string, sessionId?: string): boolean {
    return this.csrf.validateToken(token, sessionId);
  }

  getSecurityHeaders(): Record<string, string> {
    const headers = this.headers.build();
    const cspHeader = this.csp.toHeader();
    headers[cspHeader.name] = cspHeader.value;
    return headers;
  }

  generateAPIKey(options?: { scopes?: string[]; expiresInDays?: number }) {
    return this.apiKeyManager.generateKey(options);
  }

  validateAPIKey(key: string) {
    return this.apiKeyManager.validateKey(key);
  }

  signRequest(payload: string | object) {
    return this.requestSigner.sign(payload);
  }

  verifyRequest(payload: string | object, signature: string) {
    return this.requestSigner.verify(payload, signature);
  }

  validateOrigin(origin: string | null | undefined): boolean {
    return this.originValidator.validateOrigin(origin);
  }

  destroy(): void {
    this.rateLimiter.destroy();
  }
}

export function createSecurityService(options?: {
  environment?: string;
  signingSecret?: string;
  allowedOrigins?: string[];
}): SecurityService {
  return new SecurityService(options);
}

let globalSecurityService: SecurityService | null = null;

export function getSecurityService(options?: {
  environment?: string;
  signingSecret?: string;
  allowedOrigins?: string[];
}): SecurityService {
  if (!globalSecurityService) {
    globalSecurityService = new SecurityService(options);
  }
  return globalSecurityService;
}

export function resetSecurityService(): void {
  if (globalSecurityService) {
    globalSecurityService.destroy();
    globalSecurityService = null;
  }
}
