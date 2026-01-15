/**
 * CSRF Protection - Issue #1263
 * Token generation and validation for CSRF protection
 */

import { randomBytes, createHmac, timingSafeEqual } from 'crypto';
import type { CSRFConfig, CookieOptions } from './types';

const DEFAULT_CSRF_CONFIG: CSRFConfig = {
  enabled: true,
  tokenLength: 32,
  cookieName: '_csrf',
  headerName: 'X-CSRF-Token',
  cookieOptions: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
  },
};

export class CSRFProtection {
  private config: CSRFConfig;
  private secret: string;

  constructor(config?: Partial<CSRFConfig>, secret?: string) {
    this.config = { ...DEFAULT_CSRF_CONFIG, ...config };
    this.secret = secret || randomBytes(32).toString('hex');
  }

  generateToken(sessionId?: string): string {
    const salt = randomBytes(this.config.tokenLength).toString('hex');
    const data = sessionId ? `${salt}:${sessionId}` : salt;
    const signature = this.sign(data);
    return `${salt}:${signature}`;
  }

  validateToken(token: string, sessionId?: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }

    const parts = token.split(':');
    if (parts.length !== 2) {
      return false;
    }

    const [salt, signature] = parts;
    const data = sessionId ? `${salt}:${sessionId}` : salt;
    const expectedSignature = this.sign(data);

    try {
      const sigBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');

      if (sigBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return timingSafeEqual(sigBuffer, expectedBuffer);
    } catch {
      return false;
    }
  }

  private sign(data: string): string {
    return createHmac('sha256', this.secret)
      .update(data)
      .digest('hex');
  }

  getCookieOptions(): CookieOptions {
    return { ...this.config.cookieOptions };
  }

  getCookieName(): string {
    return this.config.cookieName;
  }

  getHeaderName(): string {
    return this.config.headerName;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  formatCookie(token: string): string {
    const opts = this.config.cookieOptions;
    let cookie = `${this.config.cookieName}=${token}`;

    if (opts.path) {
      cookie += `; Path=${opts.path}`;
    }
    if (opts.domain) {
      cookie += `; Domain=${opts.domain}`;
    }
    if (opts.maxAge !== undefined) {
      cookie += `; Max-Age=${opts.maxAge}`;
    }
    if (opts.httpOnly) {
      cookie += '; HttpOnly';
    }
    if (opts.secure) {
      cookie += '; Secure';
    }
    if (opts.sameSite) {
      cookie += `; SameSite=${opts.sameSite.charAt(0).toUpperCase()}${opts.sameSite.slice(1)}`;
    }

    return cookie;
  }
}

export class OriginValidator {
  private allowedOrigins: Set<string>;
  private allowedHosts: Set<string>;

  constructor(origins?: string[], hosts?: string[]) {
    this.allowedOrigins = new Set(origins || []);
    this.allowedHosts = new Set(hosts || []);
  }

  addOrigin(origin: string): this {
    this.allowedOrigins.add(origin);
    return this;
  }

  addHost(host: string): this {
    this.allowedHosts.add(host);
    return this;
  }

  validateOrigin(origin: string | null | undefined): boolean {
    if (!origin) {
      return false;
    }

    if (this.allowedOrigins.has(origin)) {
      return true;
    }

    try {
      const url = new URL(origin);
      return this.allowedHosts.has(url.host);
    } catch {
      return false;
    }
  }

  validateReferer(referer: string | null | undefined, expectedHost: string): boolean {
    if (!referer) {
      return true;
    }

    try {
      const url = new URL(referer);
      return url.host === expectedHost || this.allowedHosts.has(url.host);
    } catch {
      return false;
    }
  }

  validateRequest(headers: {
    origin?: string | null;
    referer?: string | null;
    host?: string | null;
  }): { valid: boolean; reason?: string } {
    const { origin, referer, host } = headers;

    if (!host) {
      return { valid: false, reason: 'Missing Host header' };
    }

    if (origin) {
      if (!this.validateOrigin(origin)) {
        return { valid: false, reason: `Invalid Origin: ${origin}` };
      }
    }

    if (referer) {
      if (!this.validateReferer(referer, host)) {
        return { valid: false, reason: `Invalid Referer: ${referer}` };
      }
    }

    return { valid: true };
  }
}

export class DoubleSubmitCookie {
  private cookieName: string;
  private headerName: string;

  constructor(cookieName: string = '_csrf_token', headerName: string = 'X-CSRF-Token') {
    this.cookieName = cookieName;
    this.headerName = headerName;
  }

  generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  validate(cookieValue: string | null | undefined, headerValue: string | null | undefined): boolean {
    if (!cookieValue || !headerValue) {
      return false;
    }

    try {
      const cookieBuffer = Buffer.from(cookieValue);
      const headerBuffer = Buffer.from(headerValue);

      if (cookieBuffer.length !== headerBuffer.length) {
        return false;
      }

      return timingSafeEqual(cookieBuffer, headerBuffer);
    } catch {
      return false;
    }
  }

  getCookieName(): string {
    return this.cookieName;
  }

  getHeaderName(): string {
    return this.headerName;
  }
}

export function createCSRFProtection(config?: Partial<CSRFConfig>, secret?: string): CSRFProtection {
  return new CSRFProtection(config, secret);
}

export function createOriginValidator(origins?: string[], hosts?: string[]): OriginValidator {
  return new OriginValidator(origins, hosts);
}

export function createDoubleSubmitCookie(
  cookieName?: string,
  headerName?: string,
): DoubleSubmitCookie {
  return new DoubleSubmitCookie(cookieName, headerName);
}
