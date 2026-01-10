/**
 * API Protection Tests - Issue #1263
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  APIKeyManager,
  RequestSigner,
  BearerTokenValidator,
  createAPIKeyManager,
  createRequestSigner,
  createBearerValidator,
  generateSecureToken,
  hashToken,
} from '../../lib/security/api-protection';

describe('APIKeyManager', () => {
  let manager: APIKeyManager;

  beforeEach(() => {
    manager = new APIKeyManager();
  });

  describe('generateKey', () => {
    it('should generate unique keys', () => {
      const result1 = manager.generateKey();
      const result2 = manager.generateKey();
      expect(result1.key).not.toBe(result2.key);
      expect(result1.keyData.id).not.toBe(result2.keyData.id);
    });

    it('should generate keys with correct prefix', () => {
      const result = manager.generateKey();
      expect(result.key).toMatch(/^miyabi_[a-f0-9]{8}_[a-f0-9]{64}$/);
    });

    it('should store key metadata', () => {
      const result = manager.generateKey({
        scopes: ['read', 'write'],
        metadata: { user: 'test' },
      });
      expect(result.keyData.scopes).toEqual(['read', 'write']);
      expect(result.keyData.metadata).toEqual({ user: 'test' });
    });

    it('should set expiration date', () => {
      const result = manager.generateKey({ expiresInDays: 30 });
      expect(result.keyData.expiresAt).toBeDefined();
      const expiresIn = result.keyData.expiresAt!.getTime() - Date.now();
      expect(expiresIn).toBeGreaterThan(29 * 24 * 60 * 60 * 1000);
    });
  });

  describe('validateKey', () => {
    it('should validate generated keys', () => {
      const { key } = manager.generateKey();
      const result = manager.validateKey(key);
      expect(result.valid).toBe(true);
      expect(result.key).toBeDefined();
    });

    it('should reject invalid keys', () => {
      const result = manager.validateKey('invalid-key');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid key prefix');
    });

    it('should reject unknown keys', () => {
      const result = manager.validateKey('miyabi_abcd1234_' + 'a'.repeat(64));
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Key not found');
    });

    it('should reject expired keys', () => {
      const { key, keyData } = manager.generateKey({ expiresInDays: 0 });
      keyData.expiresAt = new Date(Date.now() - 1000);
      const result = manager.validateKey(key);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Key expired');
    });

    it('should update lastUsedAt on validation', () => {
      const { key, keyData } = manager.generateKey();
      const before = keyData.lastUsedAt;
      manager.validateKey(key);
      expect(keyData.lastUsedAt).toBeDefined();
      expect(keyData.lastUsedAt).not.toBe(before);
    });
  });

  describe('hasScope', () => {
    it('should check specific scopes', () => {
      const { keyData } = manager.generateKey({ scopes: ['read'] });
      expect(manager.hasScope(keyData, 'read')).toBe(true);
      expect(manager.hasScope(keyData, 'write')).toBe(false);
    });

    it('should allow wildcard scope', () => {
      const { keyData } = manager.generateKey({ scopes: ['*'] });
      expect(manager.hasScope(keyData, 'anything')).toBe(true);
    });
  });

  describe('revokeKey', () => {
    it('should revoke existing keys', () => {
      const { key, keyData } = manager.generateKey();
      expect(manager.revokeKey(keyData.id)).toBe(true);
      expect(manager.validateKey(key).valid).toBe(false);
    });

    it('should return false for unknown keys', () => {
      expect(manager.revokeKey('unknown-id')).toBe(false);
    });
  });

  describe('rotateKey', () => {
    it('should rotate existing keys', () => {
      const { key: oldKey, keyData } = manager.generateKey({ scopes: ['read'] });
      const result = manager.rotateKey(keyData.id);
      expect(result).not.toBeNull();
      expect(result!.key).not.toBe(oldKey);
      expect(result!.keyData.scopes).toEqual(['read']);
      expect(manager.validateKey(oldKey).valid).toBe(false);
      expect(manager.validateKey(result!.key).valid).toBe(true);
    });

    it('should return null for unknown keys', () => {
      expect(manager.rotateKey('unknown-id')).toBeNull();
    });
  });

  describe('listKeys', () => {
    it('should list all keys', () => {
      manager.generateKey();
      manager.generateKey();
      const keys = manager.listKeys();
      expect(keys).toHaveLength(2);
    });
  });
});

describe('RequestSigner', () => {
  let signer: RequestSigner;

  beforeEach(() => {
    signer = new RequestSigner('test-secret');
  });

  describe('sign', () => {
    it('should generate signature with timestamp', () => {
      const signature = signer.sign({ data: 'test' });
      expect(signature).toMatch(/^t=\d+,s=[a-f0-9]+$/);
    });

    it('should accept custom timestamp', () => {
      const signature = signer.sign('test', 1234567890);
      expect(signature).toContain('t=1234567890');
    });
  });

  describe('verify', () => {
    it('should verify valid signatures', () => {
      const payload = { data: 'test' };
      const signature = signer.sign(payload);
      const result = signer.verify(payload, signature);
      expect(result.valid).toBe(true);
    });

    it('should reject tampered payloads', () => {
      const signature = signer.sign({ data: 'test' });
      const result = signer.verify({ data: 'modified' }, signature);
      expect(result.valid).toBe(false);
    });

    it('should reject expired signatures', () => {
      const signature = signer.sign('test', Date.now() - 600000);
      const result = signer.verify('test', signature, 300000);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Signature expired');
    });

    it('should reject invalid format', () => {
      const result = signer.verify('test', 'invalid');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid signature format');
    });
  });
});

describe('BearerTokenValidator', () => {
  let validator: BearerTokenValidator;

  beforeEach(() => {
    validator = new BearerTokenValidator((token) => token === 'valid-token');
  });

  describe('extractToken', () => {
    it('should extract bearer token', () => {
      const token = validator.extractToken('Bearer valid-token');
      expect(token).toBe('valid-token');
    });

    it('should return null for invalid format', () => {
      expect(validator.extractToken('Basic token')).toBeNull();
      expect(validator.extractToken('Bearer')).toBeNull();
      expect(validator.extractToken('')).toBeNull();
      expect(validator.extractToken(null)).toBeNull();
    });
  });

  describe('validate', () => {
    it('should validate correct tokens', async () => {
      const result = await validator.validate('Bearer valid-token');
      expect(result).toBe(true);
    });

    it('should reject invalid tokens', async () => {
      const result = await validator.validate('Bearer invalid-token');
      expect(result).toBe(false);
    });

    it('should reject missing auth header', async () => {
      const result = await validator.validate(null);
      expect(result).toBe(false);
    });
  });
});

describe('utility functions', () => {
  describe('generateSecureToken', () => {
    it('should generate hex token of specified length', () => {
      const token = generateSecureToken(16);
      expect(token).toHaveLength(32);
      expect(token).toMatch(/^[a-f0-9]+$/);
    });

    it('should generate unique tokens', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('hashToken', () => {
    it('should hash token with sha256', () => {
      const hash = hashToken('test-token');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });

    it('should produce consistent hashes', () => {
      const hash1 = hashToken('test');
      const hash2 = hashToken('test');
      expect(hash1).toBe(hash2);
    });
  });
});

describe('factory functions', () => {
  it('createAPIKeyManager should create instance', () => {
    const manager = createAPIKeyManager();
    expect(manager).toBeInstanceOf(APIKeyManager);
  });

  it('createRequestSigner should create instance', () => {
    const signer = createRequestSigner('secret');
    expect(signer).toBeInstanceOf(RequestSigner);
  });

  it('createBearerValidator should create instance', () => {
    const validator = createBearerValidator(() => true);
    expect(validator).toBeInstanceOf(BearerTokenValidator);
  });
});
