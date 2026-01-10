/**
 * Input Sanitizer - Issue #1263
 * XSS prevention and input sanitization
 */

import type { SanitizationConfig, SanitizeResult } from './types';

const DEFAULT_ALLOWED_TAGS = [
  'a', 'b', 'br', 'code', 'em', 'i', 'li', 'ol', 'p', 'pre',
  'strong', 'ul', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'span', 'div',
];

const DEFAULT_ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ['href', 'title', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height'],
  code: ['class'],
  pre: ['class'],
  span: ['class'],
  div: ['class'],
};

const DANGEROUS_PATTERNS = [
  /javascript:/gi,
  /vbscript:/gi,
  /data:/gi,
  /on\w+\s*=/gi,
  /<script[\s\S]*?>/gi,
  /<\/script>/gi,
  /<iframe[\s\S]*?>/gi,
  /<object[\s\S]*?>/gi,
  /<embed[\s\S]*?>/gi,
  /<form[\s\S]*?>/gi,
  /expression\s*\(/gi,
  /url\s*\(/gi,
];

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(previous|all|above)/gi,
  /disregard\s+(previous|all|above)/gi,
  /forget\s+(previous|all|above)/gi,
  /new\s+instructions?:/gi,
  /system\s*:\s*/gi,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
];

export class InputSanitizer {
  private config: SanitizationConfig;

  constructor(config?: Partial<SanitizationConfig>) {
    this.config = {
      allowedTags: config?.allowedTags ?? DEFAULT_ALLOWED_TAGS,
      allowedAttributes: config?.allowedAttributes ?? DEFAULT_ALLOWED_ATTRIBUTES,
      stripIgnoreTag: config?.stripIgnoreTag ?? true,
      stripIgnoreTagBody: config?.stripIgnoreTagBody ?? ['script', 'style'],
      maxInputLength: config?.maxInputLength ?? 50000,
    };
  }

  sanitizeHTML(input: string): SanitizeResult {
    const removed: string[] = [];
    const warnings: string[] = [];

    if (!input || typeof input !== 'string') {
      return { sanitized: '', removed: [], warnings: [] };
    }

    if (input.length > this.config.maxInputLength) {
      warnings.push(`Input truncated from ${input.length} to ${this.config.maxInputLength} characters`);
      input = input.slice(0, this.config.maxInputLength);
    }

    let sanitized = input;

    for (const pattern of DANGEROUS_PATTERNS) {
      const matches = sanitized.match(pattern);
      if (matches) {
        removed.push(...matches);
        sanitized = sanitized.replace(pattern, '');
      }
    }

    sanitized = this.stripDisallowedTags(sanitized, removed);
    sanitized = this.sanitizeAttributes(sanitized, removed);
    sanitized = this.encodeSpecialChars(sanitized);

    return { sanitized, removed, warnings };
  }

  sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    if (input.length > this.config.maxInputLength) {
      input = input.slice(0, this.config.maxInputLength);
    }

    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  sanitizeForSQL(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/'/g, "''")
      .replace(/\\/g, '\\\\')
      .replace(/\x00/g, '')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\x1a/g, '\\Z');
  }

  sanitizeForJSON(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }

  sanitizePrompt(input: string): SanitizeResult {
    const removed: string[] = [];
    const warnings: string[] = [];

    if (!input || typeof input !== 'string') {
      return { sanitized: '', removed: [], warnings: [] };
    }

    let sanitized = input;

    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      const matches = sanitized.match(pattern);
      if (matches) {
        removed.push(...matches);
        warnings.push(`Potential prompt injection detected: ${matches.join(', ')}`);
        sanitized = sanitized.replace(pattern, '[FILTERED]');
      }
    }

    if (input.length > this.config.maxInputLength) {
      warnings.push(`Prompt truncated from ${input.length} to ${this.config.maxInputLength} characters`);
      sanitized = sanitized.slice(0, this.config.maxInputLength);
    }

    return { sanitized, removed, warnings };
  }

  sanitizeFilename(filename: string): string {
    if (!filename || typeof filename !== 'string') {
      return 'unnamed';
    }

    return filename
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
      .replace(/^\.+/, '_')
      .replace(/\.+$/, '')
      .slice(0, 255);
  }

  sanitizePath(path: string): string {
    if (!path || typeof path !== 'string') {
      return '';
    }

    return path
      .replace(/\.\./g, '')
      .replace(/\/+/g, '/')
      .replace(/^\//, '')
      .replace(/[<>:"|?*\x00-\x1f]/g, '_');
  }

  private stripDisallowedTags(input: string, removed: string[]): string {
    const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/gi;

    return input.replace(tagPattern, (match, tagName) => {
      const tag = tagName.toLowerCase();

      if (this.config.stripIgnoreTagBody.includes(tag)) {
        removed.push(match);
        return '';
      }

      if (!this.config.allowedTags.includes(tag)) {
        if (this.config.stripIgnoreTag) {
          removed.push(match);
          return '';
        }
        return this.sanitizeText(match);
      }

      return match;
    });
  }

  private sanitizeAttributes(input: string, removed: string[]): string {
    const tagPattern = /<([a-zA-Z][a-zA-Z0-9]*)\s([^>]*)>/gi;

    return input.replace(tagPattern, (match, tagName, attributes) => {
      const tag = tagName.toLowerCase();
      const allowedAttrs = this.config.allowedAttributes[tag] || [];

      if (allowedAttrs.length === 0) {
        return `<${tagName}>`;
      }

      const attrPattern = /([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+))/gi;
      const sanitizedAttrs: string[] = [];

      let attrMatch: RegExpExecArray | null;
      while ((attrMatch = attrPattern.exec(attributes)) !== null) {
        const attrName = attrMatch[1].toLowerCase();
        const attrValue = attrMatch[2] || attrMatch[3] || attrMatch[4] || '';

        if (!allowedAttrs.includes(attrName)) {
          removed.push(`${attrName}="${attrValue}"`);
          continue;
        }

        if (attrName === 'href' || attrName === 'src') {
          if (this.isDangerousUrl(attrValue)) {
            removed.push(`${attrName}="${attrValue}"`);
            continue;
          }
        }

        sanitizedAttrs.push(`${attrName}="${this.sanitizeText(attrValue)}"`);
      }

      if (sanitizedAttrs.length > 0) {
        return `<${tagName} ${sanitizedAttrs.join(' ')}>`;
      }
      return `<${tagName}>`;
    });
  }

  private isDangerousUrl(url: string): boolean {
    const dangerousProtocols = ['javascript:', 'vbscript:', 'data:', 'file:'];
    const lowerUrl = url.toLowerCase().trim();
    return dangerousProtocols.some((p) => lowerUrl.startsWith(p));
  }

  private encodeSpecialChars(input: string): string {
    return input
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029');
  }
}

export function createSanitizer(config?: Partial<SanitizationConfig>): InputSanitizer {
  return new InputSanitizer(config);
}

export const defaultSanitizer = new InputSanitizer();
