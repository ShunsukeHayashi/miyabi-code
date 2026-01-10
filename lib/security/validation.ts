/**
 * Input Validation - Issue #1263
 * Comprehensive input validation utilities
 */

import type {
  ValidationRule,
  InputValidationResult,
  InputValidationError,
} from './types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

export class InputValidator {
  private rules: Map<string, ValidationRule>;

  constructor() {
    this.rules = new Map();
  }

  addRule(field: string, rule: ValidationRule): this {
    this.rules.set(field, rule);
    return this;
  }

  addRules(rules: Record<string, ValidationRule>): this {
    for (const [field, rule] of Object.entries(rules)) {
      this.rules.set(field, rule);
    }
    return this;
  }

  validate(data: Record<string, unknown>): InputValidationResult {
    const errors: InputValidationError[] = [];

    for (const [field, rule] of Array.from(this.rules.entries())) {
      const value = data[field];
      const fieldErrors = this.validateField(field, value, rule);
      errors.push(...fieldErrors);
    }

    return {
      valid: errors.length === 0,
      value: errors.length === 0 ? data : undefined,
      errors,
    };
  }

  validateField(
    field: string,
    value: unknown,
    rule: ValidationRule
  ): InputValidationError[] {
    const errors: InputValidationError[] = [];

    if (value === undefined || value === null || value === '') {
      if (rule.required) {
        errors.push({
          field,
          message: rule.message || `${field} is required`,
          code: 'REQUIRED',
          value,
        });
      }
      return errors;
    }

    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push({
            field,
            message: rule.message || `${field} must be a string`,
            code: 'INVALID_TYPE',
            value,
          });
        } else {
          if (rule.minLength !== undefined && value.length < rule.minLength) {
            errors.push({
              field,
              message: rule.message || `${field} must be at least ${rule.minLength} characters`,
              code: 'MIN_LENGTH',
              value,
            });
          }
          if (rule.maxLength !== undefined && value.length > rule.maxLength) {
            errors.push({
              field,
              message: rule.message || `${field} must be at most ${rule.maxLength} characters`,
              code: 'MAX_LENGTH',
              value,
            });
          }
          if (rule.pattern && !rule.pattern.test(value)) {
            errors.push({
              field,
              message: rule.message || `${field} has invalid format`,
              code: 'INVALID_FORMAT',
              value,
            });
          }
        }
        break;

      case 'number':
        const num = typeof value === 'number' ? value : Number(value);
        if (isNaN(num)) {
          errors.push({
            field,
            message: rule.message || `${field} must be a number`,
            code: 'INVALID_TYPE',
            value,
          });
        } else {
          if (rule.min !== undefined && num < rule.min) {
            errors.push({
              field,
              message: rule.message || `${field} must be at least ${rule.min}`,
              code: 'MIN_VALUE',
              value,
            });
          }
          if (rule.max !== undefined && num > rule.max) {
            errors.push({
              field,
              message: rule.message || `${field} must be at most ${rule.max}`,
              code: 'MAX_VALUE',
              value,
            });
          }
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push({
            field,
            message: rule.message || `${field} must be a boolean`,
            code: 'INVALID_TYPE',
            value,
          });
        }
        break;

      case 'email':
        if (typeof value !== 'string' || !EMAIL_REGEX.test(value)) {
          errors.push({
            field,
            message: rule.message || `${field} must be a valid email address`,
            code: 'INVALID_EMAIL',
            value,
          });
        }
        break;

      case 'url':
        if (typeof value !== 'string' || !URL_REGEX.test(value)) {
          errors.push({
            field,
            message: rule.message || `${field} must be a valid URL`,
            code: 'INVALID_URL',
            value,
          });
        }
        break;

      case 'uuid':
        if (typeof value !== 'string' || !UUID_REGEX.test(value)) {
          errors.push({
            field,
            message: rule.message || `${field} must be a valid UUID`,
            code: 'INVALID_UUID',
            value,
          });
        }
        break;

      case 'custom':
        if (rule.validate && !rule.validate(value)) {
          errors.push({
            field,
            message: rule.message || `${field} is invalid`,
            code: 'CUSTOM_VALIDATION_FAILED',
            value,
          });
        }
        break;
    }

    return errors;
  }

  clear(): void {
    this.rules.clear();
  }
}

export function isValidEmail(email: string): boolean {
  return typeof email === 'string' && EMAIL_REGEX.test(email);
}

export function isValidURL(url: string): boolean {
  if (typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidUUID(uuid: string): boolean {
  return typeof uuid === 'string' && UUID_REGEX.test(uuid);
}

export function isValidJSON(json: string): boolean {
  if (typeof json !== 'string') return false;
  try {
    JSON.parse(json);
    return true;
  } catch {
    return false;
  }
}

export function isValidBase64(base64: string): boolean {
  if (typeof base64 !== 'string') return false;
  const regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64.length % 4 === 0 && regex.test(base64);
}

export function isValidHex(hex: string): boolean {
  if (typeof hex !== 'string') return false;
  return /^[0-9a-fA-F]+$/.test(hex);
}

export function isValidIPv4(ip: string): boolean {
  if (typeof ip !== 'string') return false;
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255 && part === String(num);
  });
}

export function isValidIPv6(ip: string): boolean {
  if (typeof ip !== 'string') return false;
  const regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^[0-9a-fA-F]{1,4}::(?:[0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,2}:(?:[0-9a-fA-F]{1,4}:){0,4}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,3}:(?:[0-9a-fA-F]{1,4}:){0,3}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,4}:(?:[0-9a-fA-F]{1,4}:){0,2}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,5}:(?:[0-9a-fA-F]{1,4}:)?[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$/;
  return regex.test(ip);
}

export function sanitizeInteger(
  value: unknown,
  min?: number,
  max?: number,
  defaultValue: number = 0
): number {
  const num = typeof value === 'number' ? value : parseInt(String(value), 10);
  if (isNaN(num)) return defaultValue;
  if (min !== undefined && num < min) return min;
  if (max !== undefined && num > max) return max;
  return Math.floor(num);
}

export function sanitizeString(
  value: unknown,
  maxLength?: number,
  defaultValue: string = ''
): string {
  if (typeof value !== 'string') return defaultValue;
  return maxLength ? value.slice(0, maxLength) : value;
}

export function createValidator(): InputValidator {
  return new InputValidator();
}

export function validateRequest(
  data: Record<string, unknown>,
  rules: Record<string, ValidationRule>
): InputValidationResult {
  const validator = new InputValidator();
  validator.addRules(rules);
  return validator.validate(data);
}
