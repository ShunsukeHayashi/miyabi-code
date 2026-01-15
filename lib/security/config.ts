/**
 * Security Configuration - Issue #1263
 * Centralized security configuration management
 */

import type { SecurityConfig } from './types';

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  rateLimit: {
    enabled: true,
    windowMs: 60000,
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },
  csp: {
    enabled: true,
    directives: {
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
    },
    reportOnly: false,
  },
  csrf: {
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
  },
  sanitization: {
    allowedTags: [
      'a', 'b', 'br', 'code', 'em', 'i', 'li', 'ol', 'p', 'pre',
      'strong', 'ul', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'span', 'div',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      code: ['class'],
      pre: ['class'],
      span: ['class'],
      div: ['class'],
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
    maxInputLength: 50000,
  },
  headers: {
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
  },
};

const ENVIRONMENT_CONFIGS: Record<string, Partial<SecurityConfig>> = {
  development: {
    csp: {
      enabled: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:', 'http:'],
        'font-src': ["'self'", 'data:'],
        'connect-src': ["'self'", 'http://localhost:*', 'ws://localhost:*'],
        'frame-src': ["'self'"],
        'frame-ancestors': ["'self'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'upgrade-insecure-requests': false,
        'block-all-mixed-content': false,
      },
      reportOnly: true,
    },
    csrf: {
      enabled: true,
      tokenLength: 32,
      cookieName: '_csrf',
      headerName: 'X-CSRF-Token',
      cookieOptions: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      },
    },
    headers: {
      hsts: {
        enabled: false,
        maxAge: 0,
        includeSubDomains: false,
        preload: false,
      },
      xFrameOptions: 'SAMEORIGIN',
      xContentTypeOptions: true,
      xXSSProtection: true,
      referrerPolicy: 'no-referrer-when-downgrade',
    },
  },
  staging: {
    csp: {
      enabled: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'font-src': ["'self'"],
        'connect-src': ["'self'", 'https:'],
        'frame-src': ["'none'"],
        'frame-ancestors': ["'none'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'upgrade-insecure-requests': true,
        'block-all-mixed-content': true,
      },
      reportOnly: true,
    },
  },
  production: DEFAULT_SECURITY_CONFIG,
};

export class SecurityConfigManager {
  private config: SecurityConfig;

  constructor(environment?: string) {
    const env = environment || process.env.NODE_ENV || 'production';
    const envConfig = ENVIRONMENT_CONFIGS[env] || {};
    this.config = this.mergeConfig(DEFAULT_SECURITY_CONFIG, envConfig);
  }

  get(): SecurityConfig {
    return { ...this.config };
  }

  getRateLimitConfig() {
    return { ...this.config.rateLimit };
  }

  getCSPConfig() {
    return { ...this.config.csp };
  }

  getCSRFConfig() {
    return { ...this.config.csrf };
  }

  getSanitizationConfig() {
    return { ...this.config.sanitization };
  }

  getHeadersConfig() {
    return { ...this.config.headers };
  }

  override(overrides: Partial<SecurityConfig>): void {
    this.config = this.mergeConfig(this.config, overrides);
  }

  reset(environment?: string): void {
    const env = environment || process.env.NODE_ENV || 'production';
    const envConfig = ENVIRONMENT_CONFIGS[env] || {};
    this.config = this.mergeConfig(DEFAULT_SECURITY_CONFIG, envConfig);
  }

  private mergeConfig(
    base: SecurityConfig,
    overrides: Partial<SecurityConfig>,
  ): SecurityConfig {
    return {
      rateLimit: { ...base.rateLimit, ...overrides.rateLimit },
      csp: {
        ...base.csp,
        ...overrides.csp,
        directives: {
          ...base.csp.directives,
          ...overrides.csp?.directives,
        },
      },
      csrf: {
        ...base.csrf,
        ...overrides.csrf,
        cookieOptions: {
          ...base.csrf.cookieOptions,
          ...overrides.csrf?.cookieOptions,
        },
      },
      sanitization: {
        ...base.sanitization,
        ...overrides.sanitization,
        allowedAttributes: {
          ...base.sanitization.allowedAttributes,
          ...overrides.sanitization?.allowedAttributes,
        },
      },
      headers: {
        ...base.headers,
        ...overrides.headers,
        hsts: {
          ...base.headers.hsts,
          ...overrides.headers?.hsts,
        },
        permissionsPolicy: {
          ...base.headers.permissionsPolicy,
          ...overrides.headers?.permissionsPolicy,
        },
      },
    };
  }
}

let globalConfigManager: SecurityConfigManager | null = null;

export function getSecurityConfig(environment?: string): SecurityConfig {
  if (!globalConfigManager) {
    globalConfigManager = new SecurityConfigManager(environment);
  }
  return globalConfigManager.get();
}

export function createSecurityConfigManager(environment?: string): SecurityConfigManager {
  return new SecurityConfigManager(environment);
}

export function resetGlobalConfig(): void {
  globalConfigManager = null;
}

export { DEFAULT_SECURITY_CONFIG, ENVIRONMENT_CONFIGS };
