/**
 * CSRF Protection Tests - Issue #1263
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CSRFProtection,
  OriginValidator,
  DoubleSubmitCookie,
  createCSRFProtection,
  createOriginValidator,
} from '../../lib/security/csrf';

describe('CSRFProtection', () => {
  let csrf: CSRFProtection;

  beforeEach(() => {
    csrf = new CSRFProtection();
  });

  describe('generateToken', () => {
    it('should generate unique tokens', () => {
      const token1 = csrf.generateToken();
      const token2 = csrf.generateToken();
      expect(token1).not.toBe(token2);
    });

    it('should generate tokens with salt:signature format', () => {
      const token = csrf.generateToken();
      expect(token).toMatch(/^[a-f0-9]+:[a-f0-9]+$/);
    });

    it('should generate session-bound tokens', () => {
      const token1 = csrf.generateToken('session1');
      const token2 = csrf.generateToken('session2');
      expect(token1).not.toBe(token2);
    });
  });

  describe('validateToken', () => {
    it('should validate generated tokens', () => {
      const token = csrf.generateToken();
      expect(csrf.validateToken(token)).toBe(true);
    });

    it('should validate session-bound tokens', () => {
      const token = csrf.generateToken('session1');
      expect(csrf.validateToken(token, 'session1')).toBe(true);
    });

    it('should reject tokens with wrong session', () => {
      const token = csrf.generateToken('session1');
      expect(csrf.validateToken(token, 'session2')).toBe(false);
    });

    it('should reject invalid tokens', () => {
      expect(csrf.validateToken('invalid')).toBe(false);
      expect(csrf.validateToken('')).toBe(false);
      expect(csrf.validateToken(null as unknown as string)).toBe(false);
    });

    it('should reject tampered tokens', () => {
      const token = csrf.generateToken();
      const tampered = token.replace(/.$/, 'X');
      expect(csrf.validateToken(tampered)).toBe(false);
    });
  });

  describe('formatCookie', () => {
    it('should format cookie with all options', () => {
      const token = csrf.generateToken();
      const cookie = csrf.formatCookie(token);
      expect(cookie).toContain('_csrf=');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('Secure');
      expect(cookie).toContain('SameSite=Strict');
    });
  });

  describe('configuration', () => {
    it('should use custom cookie name', () => {
      const customCsrf = new CSRFProtection({
        cookieName: 'custom_csrf',
      });
      expect(customCsrf.getCookieName()).toBe('custom_csrf');
    });

    it('should use custom header name', () => {
      const customCsrf = new CSRFProtection({
        headerName: 'X-Custom-Token',
      });
      expect(customCsrf.getHeaderName()).toBe('X-Custom-Token');
    });
  });
});

describe('OriginValidator', () => {
  let validator: OriginValidator;

  beforeEach(() => {
    validator = new OriginValidator(
      ['https://example.com', 'https://app.example.com'],
      ['localhost', 'example.com']
    );
  });

  describe('validateOrigin', () => {
    it('should accept allowed origins', () => {
      expect(validator.validateOrigin('https://example.com')).toBe(true);
      expect(validator.validateOrigin('https://app.example.com')).toBe(true);
    });

    it('should accept allowed hosts', () => {
      expect(validator.validateOrigin('https://localhost')).toBe(true);
    });

    it('should reject unknown origins', () => {
      expect(validator.validateOrigin('https://evil.com')).toBe(false);
    });

    it('should reject null/empty origins', () => {
      expect(validator.validateOrigin(null)).toBe(false);
      expect(validator.validateOrigin('')).toBe(false);
    });
  });

  describe('validateReferer', () => {
    it('should accept valid referers', () => {
      expect(validator.validateReferer('https://example.com/page', 'example.com')).toBe(true);
    });

    it('should accept allowed hosts in referer', () => {
      expect(validator.validateReferer('https://localhost/page', 'example.com')).toBe(true);
    });

    it('should accept missing referer', () => {
      expect(validator.validateReferer(null, 'example.com')).toBe(true);
    });
  });

  describe('validateRequest', () => {
    it('should validate complete request', () => {
      const result = validator.validateRequest({
        origin: 'https://example.com',
        referer: 'https://example.com/page',
        host: 'example.com',
      });
      expect(result.valid).toBe(true);
    });

    it('should reject missing host', () => {
      const result = validator.validateRequest({
        origin: 'https://example.com',
        host: null,
      });
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Host');
    });

    it('should reject invalid origin', () => {
      const result = validator.validateRequest({
        origin: 'https://evil.com',
        host: 'example.com',
      });
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Origin');
    });
  });

  describe('addOrigin/addHost', () => {
    it('should add new origins', () => {
      validator.addOrigin('https://new.example.com');
      expect(validator.validateOrigin('https://new.example.com')).toBe(true);
    });

    it('should add new hosts', () => {
      validator.addHost('api.example.com');
      expect(validator.validateOrigin('https://api.example.com')).toBe(true);
    });
  });
});

describe('DoubleSubmitCookie', () => {
  let doubleSubmit: DoubleSubmitCookie;

  beforeEach(() => {
    doubleSubmit = new DoubleSubmitCookie();
  });

  describe('generateToken', () => {
    it('should generate hex tokens', () => {
      const token = doubleSubmit.generateToken();
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('validate', () => {
    it('should validate matching tokens', () => {
      const token = doubleSubmit.generateToken();
      expect(doubleSubmit.validate(token, token)).toBe(true);
    });

    it('should reject mismatched tokens', () => {
      const token1 = doubleSubmit.generateToken();
      const token2 = doubleSubmit.generateToken();
      expect(doubleSubmit.validate(token1, token2)).toBe(false);
    });

    it('should reject missing values', () => {
      expect(doubleSubmit.validate(null, 'token')).toBe(false);
      expect(doubleSubmit.validate('token', null)).toBe(false);
    });
  });
});

describe('factory functions', () => {
  it('createCSRFProtection should create instance', () => {
    const csrf = createCSRFProtection();
    expect(csrf).toBeInstanceOf(CSRFProtection);
  });

  it('createOriginValidator should create instance', () => {
    const validator = createOriginValidator(['https://example.com']);
    expect(validator).toBeInstanceOf(OriginValidator);
  });
});
