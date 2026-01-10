/**
 * Input Validation Tests - Issue #1263
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
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
} from '../../lib/security/validation';

describe('InputValidator', () => {
  let validator: InputValidator;

  beforeEach(() => {
    validator = new InputValidator();
  });

  describe('string validation', () => {
    it('should validate required strings', () => {
      validator.addRule('name', { type: 'string', required: true });
      const result = validator.validate({ name: '' });
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('REQUIRED');
    });

    it('should validate string min length', () => {
      validator.addRule('name', { type: 'string', minLength: 3 });
      const result = validator.validate({ name: 'ab' });
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('MIN_LENGTH');
    });

    it('should validate string max length', () => {
      validator.addRule('name', { type: 'string', maxLength: 5 });
      const result = validator.validate({ name: 'toolong' });
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('MAX_LENGTH');
    });

    it('should validate string pattern', () => {
      validator.addRule('code', { type: 'string', pattern: /^[A-Z]{3}$/ });
      const result = validator.validate({ code: 'abc' });
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_FORMAT');
    });

    it('should accept valid strings', () => {
      validator.addRule('name', {
        type: 'string',
        minLength: 2,
        maxLength: 10,
      });
      const result = validator.validate({ name: 'hello' });
      expect(result.valid).toBe(true);
    });
  });

  describe('number validation', () => {
    it('should validate number type', () => {
      validator.addRule('age', { type: 'number' });
      const result = validator.validate({ age: 'not a number' });
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_TYPE');
    });

    it('should validate min value', () => {
      validator.addRule('age', { type: 'number', min: 0 });
      const result = validator.validate({ age: -5 });
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('MIN_VALUE');
    });

    it('should validate max value', () => {
      validator.addRule('age', { type: 'number', max: 100 });
      const result = validator.validate({ age: 150 });
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('MAX_VALUE');
    });

    it('should accept valid numbers', () => {
      validator.addRule('age', { type: 'number', min: 0, max: 100 });
      const result = validator.validate({ age: 25 });
      expect(result.valid).toBe(true);
    });
  });

  describe('email validation', () => {
    it('should accept valid emails', () => {
      validator.addRule('email', { type: 'email' });
      const result = validator.validate({ email: 'test@example.com' });
      expect(result.valid).toBe(true);
    });

    it('should reject invalid emails', () => {
      validator.addRule('email', { type: 'email' });
      const result = validator.validate({ email: 'invalid-email' });
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_EMAIL');
    });
  });

  describe('url validation', () => {
    it('should accept valid URLs', () => {
      validator.addRule('website', { type: 'url' });
      const result = validator.validate({ website: 'https://example.com' });
      expect(result.valid).toBe(true);
    });

    it('should reject invalid URLs', () => {
      validator.addRule('website', { type: 'url' });
      const result = validator.validate({ website: 'not-a-url' });
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_URL');
    });
  });

  describe('uuid validation', () => {
    it('should accept valid UUIDs', () => {
      validator.addRule('id', { type: 'uuid' });
      const result = validator.validate({ id: '123e4567-e89b-12d3-a456-426614174000' });
      expect(result.valid).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      validator.addRule('id', { type: 'uuid' });
      const result = validator.validate({ id: 'not-a-uuid' });
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_UUID');
    });
  });

  describe('custom validation', () => {
    it('should run custom validators', () => {
      validator.addRule('value', {
        type: 'custom',
        validate: (v) => v === 'specific-value',
        message: 'Must be specific value',
      });
      const result = validator.validate({ value: 'wrong' });
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('CUSTOM_VALIDATION_FAILED');
    });
  });

  describe('addRules', () => {
    it('should add multiple rules at once', () => {
      validator.addRules({
        name: { type: 'string', required: true },
        email: { type: 'email', required: true },
      });
      const result = validator.validate({ name: '', email: '' });
      expect(result.errors.length).toBe(2);
    });
  });
});

describe('validation helpers', () => {
  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });
  });

  describe('isValidURL', () => {
    it('should validate correct URLs', () => {
      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('http://localhost:3000')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidURL('not-a-url')).toBe(false);
      expect(isValidURL('')).toBe(false);
    });
  });

  describe('isValidUUID', () => {
    it('should validate correct UUIDs', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isValidUUID('A987FBC9-4BED-3078-CF07-9141BA07C9F3')).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('123')).toBe(false);
    });
  });

  describe('isValidJSON', () => {
    it('should validate correct JSON', () => {
      expect(isValidJSON('{"key": "value"}')).toBe(true);
      expect(isValidJSON('[]')).toBe(true);
      expect(isValidJSON('null')).toBe(true);
    });

    it('should reject invalid JSON', () => {
      expect(isValidJSON('{invalid}')).toBe(false);
      expect(isValidJSON('')).toBe(false);
    });
  });

  describe('isValidBase64', () => {
    it('should validate correct Base64', () => {
      expect(isValidBase64('SGVsbG8=')).toBe(true);
      expect(isValidBase64('dGVzdA==')).toBe(true);
    });

    it('should reject invalid Base64', () => {
      expect(isValidBase64('not!valid')).toBe(false);
    });
  });

  describe('isValidHex', () => {
    it('should validate correct hex', () => {
      expect(isValidHex('0123456789abcdef')).toBe(true);
      expect(isValidHex('DEADBEEF')).toBe(true);
    });

    it('should reject invalid hex', () => {
      expect(isValidHex('xyz')).toBe(false);
    });
  });

  describe('isValidIPv4', () => {
    it('should validate correct IPv4', () => {
      expect(isValidIPv4('192.168.1.1')).toBe(true);
      expect(isValidIPv4('0.0.0.0')).toBe(true);
      expect(isValidIPv4('255.255.255.255')).toBe(true);
    });

    it('should reject invalid IPv4', () => {
      expect(isValidIPv4('256.0.0.1')).toBe(false);
      expect(isValidIPv4('192.168.1')).toBe(false);
    });
  });

  describe('isValidIPv6', () => {
    it('should validate correct IPv6', () => {
      expect(isValidIPv6('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
      expect(isValidIPv6('::1')).toBe(true);
    });
  });

  describe('sanitizeInteger', () => {
    it('should clamp values to range', () => {
      expect(sanitizeInteger(5, 0, 10)).toBe(5);
      expect(sanitizeInteger(-5, 0, 10)).toBe(0);
      expect(sanitizeInteger(15, 0, 10)).toBe(10);
    });

    it('should handle non-numeric input', () => {
      expect(sanitizeInteger('not a number', 0, 10, 5)).toBe(5);
    });
  });

  describe('sanitizeString', () => {
    it('should truncate long strings', () => {
      expect(sanitizeString('hello world', 5)).toBe('hello');
    });

    it('should return default for non-strings', () => {
      expect(sanitizeString(null, 10, 'default')).toBe('default');
    });
  });
});

describe('validateRequest', () => {
  it('should validate request data against rules', () => {
    const result = validateRequest(
      { name: 'test', email: 'test@example.com' },
      {
        name: { type: 'string', required: true },
        email: { type: 'email', required: true },
      }
    );
    expect(result.valid).toBe(true);
  });
});
