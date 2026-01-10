/**
 * Content Security Policy - Issue #1263
 * CSP header generation and management
 */

import type { CSPConfig, CSPDirectives, SecurityHeadersConfig } from './types';
import { randomBytes } from 'crypto';

const DEFAULT_CSP_DIRECTIVES: CSPDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'"],
  'connect-src': ["'self'"],
  'frame-src': ["'none'"],
  'frame-ancestors': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'upgrade-insecure-requests': true,
  'block-all-mixed-content': true,
};

const DEFAULT_SECURITY_HEADERS: SecurityHeadersConfig = {
  hsts: {
    enabled: true,
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  xFrameOptions: 'DENY',
  xContentTypeOptions: true,
  xXSSProtection: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    camera: false,
    microphone: false,
    geolocation: false,
    payment: false,
    usb: false,
    fullscreen: true,
  },
};

export class CSPBuilder {
  private directives: CSPDirectives;
  private reportOnly: boolean;
  private reportUri?: string;
  private nonces: Set<string>;

  constructor(config?: Partial<CSPConfig>) {
    this.directives = { ...DEFAULT_CSP_DIRECTIVES, ...config?.directives };
    this.reportOnly = config?.reportOnly ?? false;
    this.reportUri = config?.reportUri;
    this.nonces = new Set();
  }

  setDirective(name: keyof CSPDirectives, values: string[] | boolean): this {
    (this.directives as Record<string, unknown>)[name] = values;
    return this;
  }

  addSource(directive: keyof CSPDirectives, source: string): this {
    const current = this.directives[directive];
    if (Array.isArray(current)) {
      if (!current.includes(source)) {
        current.push(source);
      }
    }
    return this;
  }

  removeSource(directive: keyof CSPDirectives, source: string): this {
    const current = this.directives[directive];
    if (Array.isArray(current)) {
      const index = current.indexOf(source);
      if (index !== -1) {
        current.splice(index, 1);
      }
    }
    return this;
  }

  generateNonce(): string {
    const nonce = randomBytes(16).toString('base64');
    this.nonces.add(nonce);
    return nonce;
  }

  addNonceToScripts(): string {
    const nonce = this.generateNonce();
    this.addSource('script-src', `'nonce-${nonce}'`);
    return nonce;
  }

  addNonceToStyles(): string {
    const nonce = this.generateNonce();
    this.addSource('style-src', `'nonce-${nonce}'`);
    return nonce;
  }

  allowInlineScripts(): this {
    this.addSource('script-src', "'unsafe-inline'");
    return this;
  }

  allowInlineStyles(): this {
    this.addSource('style-src', "'unsafe-inline'");
    return this;
  }

  allowEval(): this {
    this.addSource('script-src', "'unsafe-eval'");
    return this;
  }

  allowDomain(domain: string, directives?: (keyof CSPDirectives)[]): this {
    const targets = directives || [
      'default-src',
      'script-src',
      'style-src',
      'img-src',
      'connect-src',
    ];

    for (const directive of targets) {
      this.addSource(directive, domain);
    }
    return this;
  }

  build(): string {
    const parts: string[] = [];

    for (const [key, value] of Object.entries(this.directives)) {
      if (value === true) {
        parts.push(key);
      } else if (value === false) {
        continue;
      } else if (Array.isArray(value) && value.length > 0) {
        parts.push(`${key} ${value.join(' ')}`);
      }
    }

    if (this.reportUri) {
      parts.push(`report-uri ${this.reportUri}`);
    }

    return parts.join('; ');
  }

  getHeaderName(): string {
    return this.reportOnly
      ? 'Content-Security-Policy-Report-Only'
      : 'Content-Security-Policy';
  }

  toHeader(): { name: string; value: string } {
    return {
      name: this.getHeaderName(),
      value: this.build(),
    };
  }

  getNonces(): string[] {
    return Array.from(this.nonces);
  }

  clearNonces(): void {
    this.nonces.clear();
  }
}

export class SecurityHeadersBuilder {
  private config: SecurityHeadersConfig;

  constructor(config?: Partial<SecurityHeadersConfig>) {
    this.config = { ...DEFAULT_SECURITY_HEADERS, ...config };
  }

  build(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.config.hsts.enabled) {
      let hstsValue = `max-age=${this.config.hsts.maxAge}`;
      if (this.config.hsts.includeSubDomains) {
        hstsValue += '; includeSubDomains';
      }
      if (this.config.hsts.preload) {
        hstsValue += '; preload';
      }
      headers['Strict-Transport-Security'] = hstsValue;
    }

    if (this.config.xFrameOptions) {
      headers['X-Frame-Options'] = this.config.xFrameOptions;
    }

    if (this.config.xContentTypeOptions) {
      headers['X-Content-Type-Options'] = 'nosniff';
    }

    if (this.config.xXSSProtection) {
      headers['X-XSS-Protection'] = '1; mode=block';
    }

    headers['Referrer-Policy'] = this.config.referrerPolicy;

    if (this.config.permissionsPolicy) {
      const policies: string[] = [];
      for (const [feature, allowed] of Object.entries(this.config.permissionsPolicy)) {
        policies.push(`${feature}=${allowed ? 'self' : '()'}`);
      }
      if (policies.length > 0) {
        headers['Permissions-Policy'] = policies.join(', ');
      }
    }

    return headers;
  }

  setHSTS(config: Partial<SecurityHeadersConfig['hsts']>): this {
    this.config.hsts = { ...this.config.hsts, ...config };
    return this;
  }

  setXFrameOptions(value: SecurityHeadersConfig['xFrameOptions']): this {
    this.config.xFrameOptions = value;
    return this;
  }

  setReferrerPolicy(policy: SecurityHeadersConfig['referrerPolicy']): this {
    this.config.referrerPolicy = policy;
    return this;
  }

  setPermission(feature: keyof NonNullable<SecurityHeadersConfig['permissionsPolicy']>, allowed: boolean): this {
    if (!this.config.permissionsPolicy) {
      this.config.permissionsPolicy = {};
    }
    this.config.permissionsPolicy[feature] = allowed;
    return this;
  }
}

export function createCSPBuilder(config?: Partial<CSPConfig>): CSPBuilder {
  return new CSPBuilder(config);
}

export function createSecurityHeaders(config?: Partial<SecurityHeadersConfig>): SecurityHeadersBuilder {
  return new SecurityHeadersBuilder(config);
}

export function buildDefaultCSP(): string {
  return new CSPBuilder().build();
}

export function buildDefaultSecurityHeaders(): Record<string, string> {
  return new SecurityHeadersBuilder().build();
}
