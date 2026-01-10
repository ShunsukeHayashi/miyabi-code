/**
 * Security Types - Issue #1263
 * Type definitions for security hardening module
 */

export interface SecurityConfig {
  rateLimit: RateLimitConfig;
  csp: CSPConfig;
  csrf: CSRFConfig;
  sanitization: SanitizationConfig;
  headers: SecurityHeadersConfig;
}

export interface RateLimitConfig {
  enabled: boolean;
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (identifier: string) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface CSPConfig {
  enabled: boolean;
  directives: CSPDirectives;
  reportOnly?: boolean;
  reportUri?: string;
}

export interface CSPDirectives {
  'default-src'?: string[];
  'script-src'?: string[];
  'style-src'?: string[];
  'img-src'?: string[];
  'font-src'?: string[];
  'connect-src'?: string[];
  'frame-src'?: string[];
  'frame-ancestors'?: string[];
  'object-src'?: string[];
  'base-uri'?: string[];
  'form-action'?: string[];
  'upgrade-insecure-requests'?: boolean;
  'block-all-mixed-content'?: boolean;
}

export interface CSRFConfig {
  enabled: boolean;
  tokenLength: number;
  cookieName: string;
  headerName: string;
  cookieOptions: CookieOptions;
}

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
  domain?: string;
}

export interface SanitizationConfig {
  allowedTags: string[];
  allowedAttributes: Record<string, string[]>;
  stripIgnoreTag: boolean;
  stripIgnoreTagBody: string[];
  maxInputLength: number;
}

export interface SecurityHeadersConfig {
  hsts: HSTSConfig;
  xFrameOptions: 'DENY' | 'SAMEORIGIN' | false;
  xContentTypeOptions: boolean;
  xXSSProtection: boolean;
  referrerPolicy: ReferrerPolicy;
  permissionsPolicy?: PermissionsPolicyConfig;
}

export interface HSTSConfig {
  enabled: boolean;
  maxAge: number;
  includeSubDomains: boolean;
  preload: boolean;
}

export type ReferrerPolicy =
  | 'no-referrer'
  | 'no-referrer-when-downgrade'
  | 'origin'
  | 'origin-when-cross-origin'
  | 'same-origin'
  | 'strict-origin'
  | 'strict-origin-when-cross-origin'
  | 'unsafe-url';

export interface PermissionsPolicyConfig {
  camera?: boolean;
  microphone?: boolean;
  geolocation?: boolean;
  payment?: boolean;
  usb?: boolean;
  fullscreen?: boolean;
}

export interface SanitizeResult {
  sanitized: string;
  removed: string[];
  warnings: string[];
}

export interface ValidationRule {
  type: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'uuid' | 'custom';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  validate?: (value: unknown) => boolean;
  message?: string;
}

export interface InputValidationResult {
  valid: boolean;
  value?: unknown;
  errors: InputValidationError[];
}

export interface InputValidationError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

export interface APIKeyConfig {
  headerName: string;
  hashAlgorithm: 'sha256' | 'sha512';
  rotationDays: number;
}

export interface SecurityAuditResult {
  timestamp: Date;
  passed: boolean;
  score: number;
  findings: SecurityFinding[];
}

export interface SecurityFinding {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  title: string;
  description: string;
  recommendation?: string;
}
