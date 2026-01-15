/**
 * API Protection - Issue #1263
 * API key management and request authentication
 */

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import type { APIKeyConfig } from './types';

const DEFAULT_API_KEY_CONFIG: APIKeyConfig = {
  headerName: 'X-API-Key',
  hashAlgorithm: 'sha256',
  rotationDays: 90,
};

export interface APIKey {
  id: string;
  keyHash: string;
  prefix: string;
  createdAt: Date;
  expiresAt?: Date;
  lastUsedAt?: Date;
  scopes: string[];
  metadata?: Record<string, unknown>;
}

export interface APIKeyValidationResult {
  valid: boolean;
  key?: APIKey;
  reason?: string;
}

export class APIKeyManager {
  private config: APIKeyConfig;
  private keys: Map<string, APIKey>;

  constructor(config?: Partial<APIKeyConfig>) {
    this.config = { ...DEFAULT_API_KEY_CONFIG, ...config };
    this.keys = new Map();
  }

  generateKey(options?: {
    scopes?: string[];
    expiresInDays?: number;
    metadata?: Record<string, unknown>;
  }): { key: string; keyData: APIKey } {
    const keyBytes = randomBytes(32);
    const id = randomBytes(8).toString('hex');
    const prefix = keyBytes.slice(0, 4).toString('hex');
    const key = `miyabi_${prefix}_${keyBytes.toString('hex')}`;
    const keyHash = this.hashKey(key);

    const keyData: APIKey = {
      id,
      keyHash,
      prefix,
      createdAt: new Date(),
      expiresAt: options?.expiresInDays
        ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000)
        : undefined,
      scopes: options?.scopes || ['*'],
      metadata: options?.metadata,
    };

    this.keys.set(id, keyData);

    return { key, keyData };
  }

  validateKey(key: string): APIKeyValidationResult {
    if (!key || typeof key !== 'string') {
      return { valid: false, reason: 'Invalid key format' };
    }

    if (!key.startsWith('miyabi_')) {
      return { valid: false, reason: 'Invalid key prefix' };
    }

    const keyHash = this.hashKey(key);

    for (const keyData of Array.from(this.keys.values())) {
      try {
        const hashBuffer = Buffer.from(keyHash, 'hex');
        const storedBuffer = Buffer.from(keyData.keyHash, 'hex');

        if (hashBuffer.length === storedBuffer.length &&
            timingSafeEqual(hashBuffer, storedBuffer)) {
          if (keyData.expiresAt && new Date() > keyData.expiresAt) {
            return { valid: false, reason: 'Key expired', key: keyData };
          }

          keyData.lastUsedAt = new Date();
          return { valid: true, key: keyData };
        }
      } catch {
        continue;
      }
    }

    return { valid: false, reason: 'Key not found' };
  }

  hasScope(keyData: APIKey, requiredScope: string): boolean {
    if (keyData.scopes.includes('*')) {
      return true;
    }
    return keyData.scopes.includes(requiredScope);
  }

  revokeKey(id: string): boolean {
    return this.keys.delete(id);
  }

  rotateKey(id: string): { key: string; keyData: APIKey } | null {
    const existingKey = this.keys.get(id);
    if (!existingKey) {
      return null;
    }

    this.keys.delete(id);

    return this.generateKey({
      scopes: existingKey.scopes,
      expiresInDays: this.config.rotationDays,
      metadata: existingKey.metadata,
    });
  }

  getKeyById(id: string): APIKey | undefined {
    return this.keys.get(id);
  }

  listKeys(): APIKey[] {
    return Array.from(this.keys.values());
  }

  private hashKey(key: string): string {
    return createHash(this.config.hashAlgorithm).update(key).digest('hex');
  }

  getHeaderName(): string {
    return this.config.headerName;
  }
}

export class RequestSigner {
  private secret: string;
  private algorithm: string;

  constructor(secret: string, algorithm: string = 'sha256') {
    this.secret = secret;
    this.algorithm = algorithm;
  }

  sign(payload: string | object, timestamp?: number): string {
    const ts = timestamp || Date.now();
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const message = `${ts}.${data}`;

    const signature = createHmac(this.algorithm, this.secret)
      .update(message)
      .digest('hex');

    return `t=${ts},s=${signature}`;
  }

  verify(
    payload: string | object,
    signature: string,
    toleranceMs: number = 300000,
  ): { valid: boolean; reason?: string } {
    const parts = signature.split(',');
    const timestampPart = parts.find((p) => p.startsWith('t='));
    const signaturePart = parts.find((p) => p.startsWith('s='));

    if (!timestampPart || !signaturePart) {
      return { valid: false, reason: 'Invalid signature format' };
    }

    const timestamp = parseInt(timestampPart.slice(2), 10);
    const receivedSig = signaturePart.slice(2);

    if (isNaN(timestamp)) {
      return { valid: false, reason: 'Invalid timestamp' };
    }

    const now = Date.now();
    if (Math.abs(now - timestamp) > toleranceMs) {
      return { valid: false, reason: 'Signature expired' };
    }

    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const message = `${timestamp}.${data}`;
    const expectedSig = createHmac(this.algorithm, this.secret)
      .update(message)
      .digest('hex');

    try {
      const receivedBuffer = Buffer.from(receivedSig, 'hex');
      const expectedBuffer = Buffer.from(expectedSig, 'hex');

      if (receivedBuffer.length !== expectedBuffer.length) {
        return { valid: false, reason: 'Signature mismatch' };
      }

      if (!timingSafeEqual(receivedBuffer, expectedBuffer)) {
        return { valid: false, reason: 'Signature mismatch' };
      }
    } catch {
      return { valid: false, reason: 'Signature verification failed' };
    }

    return { valid: true };
  }
}

export class BearerTokenValidator {
  private tokenValidator: (token: string) => Promise<boolean> | boolean;

  constructor(validator: (token: string) => Promise<boolean> | boolean) {
    this.tokenValidator = validator;
  }

  extractToken(authHeader: string | null | undefined): string | null {
    if (!authHeader || typeof authHeader !== 'string') {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return null;
    }

    return parts[1];
  }

  async validate(authHeader: string | null | undefined): Promise<boolean> {
    const token = this.extractToken(authHeader);
    if (!token) {
      return false;
    }

    return this.tokenValidator(token);
  }
}

export function createAPIKeyManager(config?: Partial<APIKeyConfig>): APIKeyManager {
  return new APIKeyManager(config);
}

export function createRequestSigner(secret: string, algorithm?: string): RequestSigner {
  return new RequestSigner(secret, algorithm);
}

export function createBearerValidator(
  validator: (token: string) => Promise<boolean> | boolean,
): BearerTokenValidator {
  return new BearerTokenValidator(validator);
}

export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

export function hashToken(token: string, algorithm: string = 'sha256'): string {
  return createHash(algorithm).update(token).digest('hex');
}
