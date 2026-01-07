/**
 * GitHub OAuth Tests
 * Miyabi AI Agent Framework - GitHub App OAuth Flow Testing
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  generateOAuthState,
  validateOAuthState,
  buildOAuthAuthorizeUrl,
  verifyMiyabiSessionToken,
  generateMiyabiSessionToken,
} from '../../lib/github-app/oauth';
import { MiyabiGitHubUser } from '../../lib/github-app/types';

describe('GitHub OAuth', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      JWT_SECRET: 'test-jwt-secret-key-for-testing',
      GITHUB_APP_ID: 'test-app-id',
      GITHUB_CLIENT_ID: 'test-client-id',
      GITHUB_CLIENT_SECRET: 'test-client-secret',
      GITHUB_APP_BASE_URL: 'https://api.miyabi-ai.dev',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('generateOAuthState', () => {
    it('should generate a valid state token', () => {
      const state = generateOAuthState();
      expect(state).toBeDefined();
      expect(typeof state).toBe('string');
      expect(state.length).toBeGreaterThan(0);
    });

    it('should include redirect URL in state when provided', () => {
      const redirectUrl = 'https://app.miyabi-ai.dev/dashboard';
      const state = generateOAuthState(redirectUrl);
      expect(state).toBeDefined();
    });

    it('should include installation ID in state when provided', () => {
      const installationId = 12345;
      const state = generateOAuthState(undefined, installationId);
      expect(state).toBeDefined();
    });
  });

  describe('validateOAuthState', () => {
    it('should validate a recently generated state token', () => {
      const redirectUrl = 'https://app.miyabi-ai.dev/callback';
      const installationId = 67890;
      const state = generateOAuthState(redirectUrl, installationId);

      const validated = validateOAuthState(state);
      expect(validated).toBeDefined();
      expect(validated?.redirectUrl).toBe(redirectUrl);
      expect(validated?.installationId).toBe(installationId);
    });

    it('should return null for invalid state token', () => {
      const validated = validateOAuthState('invalid-state-token');
      expect(validated).toBeNull();
    });

    it('should return null for already consumed state token', () => {
      const state = generateOAuthState();

      const firstValidation = validateOAuthState(state);
      expect(firstValidation).toBeDefined();

      const secondValidation = validateOAuthState(state);
      expect(secondValidation).toBeNull();
    });
  });

  describe('buildOAuthAuthorizeUrl', () => {
    it('should build a valid GitHub OAuth URL', () => {
      const state = 'test-state-token';
      const url = buildOAuthAuthorizeUrl(state);

      expect(url).toContain('https://github.com/login/oauth/authorize');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain(`state=${state}`);
      expect(url).toContain('scope=');
    });

    it('should include custom redirect URI when provided', () => {
      const state = 'test-state-token';
      const customRedirect = 'https://custom.domain.com/callback';
      const url = buildOAuthAuthorizeUrl(state, customRedirect);

      expect(url).toContain(encodeURIComponent(customRedirect));
    });
  });

  describe('Session Token Management', () => {
    const mockUser: MiyabiGitHubUser = {
      id: 'user-123',
      githubId: 12345,
      githubLogin: 'testuser',
      email: 'test@example.com',
      name: 'Test User',
      avatarUrl: 'https://avatars.githubusercontent.com/u/12345',
      accessToken: 'gho_xxx',
      installations: [111, 222],
      tier: 'free',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should generate a valid session token', () => {
      const token = generateMiyabiSessionToken(mockUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should verify a valid session token', () => {
      const token = generateMiyabiSessionToken(mockUser);
      const payload = verifyMiyabiSessionToken(token);

      expect(payload).toBeDefined();
      expect(payload?.userId).toBe(mockUser.id);
      expect(payload?.githubId).toBe(mockUser.githubId);
      expect(payload?.githubLogin).toBe(mockUser.githubLogin);
      expect(payload?.tier).toBe(mockUser.tier);
    });

    it('should return null for invalid token', () => {
      const payload = verifyMiyabiSessionToken('invalid.token.here');
      expect(payload).toBeNull();
    });

    it('should return null for tampered token', () => {
      const token = generateMiyabiSessionToken(mockUser);
      const [header, _payload, signature] = token.split('.');
      const tamperedToken = `${header}.eyJ0ZXN0IjoidGFtcGVyZWQifQ.${signature}`;

      const payload = verifyMiyabiSessionToken(tamperedToken);
      expect(payload).toBeNull();
    });
  });
});
