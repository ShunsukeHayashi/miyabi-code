/**
 * GitHub Webhook Tests
 * Miyabi AI Agent Framework - Webhook Handler Testing
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import crypto from 'crypto';
import {
  verifyWebhookSignature,
  parseWebhookContext,
  WebhookProcessor,
} from '../../lib/github-app/webhook';
import { IssueWebhookPayload } from '../../lib/github-app/types';

describe('GitHub Webhook Handler', () => {
  const originalEnv = process.env;
  const webhookSecret = 'test-webhook-secret';

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      GITHUB_WEBHOOK_SECRET: webhookSecret,
      GITHUB_APP_ID: 'test-app-id',
      GITHUB_CLIENT_ID: 'test-client-id',
      GITHUB_CLIENT_SECRET: 'test-client-secret',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid webhook signature', () => {
      const payload = JSON.stringify({ action: 'opened', issue: { number: 1 } });
      const signature = generateSignature(payload, webhookSecret);

      const result = verifyWebhookSignature(payload, signature);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid signature', () => {
      const payload = JSON.stringify({ action: 'opened' });
      const invalidSignature = 'sha256=invalid_signature_here';

      const result = verifyWebhookSignature(payload, invalidSignature);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Signature verification failed');
    });

    it('should reject missing signature', () => {
      const payload = JSON.stringify({ action: 'opened' });

      const result = verifyWebhookSignature(payload, null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Missing');
    });

    it('should reject signature with wrong prefix', () => {
      const payload = JSON.stringify({ action: 'opened' });
      const signature = 'sha1=wrongprefix';

      const result = verifyWebhookSignature(payload, signature);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid signature format');
    });

    it('should handle Buffer payload', () => {
      const payloadString = JSON.stringify({ test: true });
      const payloadBuffer = Buffer.from(payloadString);
      const signature = generateSignature(payloadString, webhookSecret);

      const result = verifyWebhookSignature(payloadBuffer, signature);
      expect(result.valid).toBe(true);
    });
  });

  describe('parseWebhookContext', () => {
    it('should parse valid webhook headers', () => {
      const headers = new Headers({
        'x-github-event': 'issues',
        'x-github-delivery': 'delivery-id-123',
        'x-hub-signature-256': 'sha256=abc123',
      });

      const context = parseWebhookContext(headers);
      expect(context).toBeDefined();
      expect(context?.event).toBe('issues');
      expect(context?.delivery).toBe('delivery-id-123');
      expect(context?.signature).toBe('sha256=abc123');
    });

    it('should return null for missing event header', () => {
      const headers = new Headers({
        'x-github-delivery': 'delivery-id-123',
      });

      const context = parseWebhookContext(headers);
      expect(context).toBeNull();
    });

    it('should return null for missing delivery header', () => {
      const headers = new Headers({
        'x-github-event': 'issues',
      });

      const context = parseWebhookContext(headers);
      expect(context).toBeNull();
    });
  });

  describe('WebhookProcessor', () => {
    let processor: WebhookProcessor;

    beforeEach(() => {
      processor = new WebhookProcessor();
    });

    it('should register and invoke handlers', async () => {
      const handlerMock = jest.fn().mockResolvedValue({
        success: true,
        message: 'Test handler executed',
      });

      processor.registerHandler('issues', 'opened', handlerMock);

      const payload: IssueWebhookPayload = {
        action: 'opened',
        issue: {
          id: 1,
          number: 42,
          title: 'Test Issue',
          body: 'Test body',
          state: 'open',
          labels: [],
          user: { login: 'testuser', id: 1 },
          assignees: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          closed_at: null,
        },
        sender: {
          login: 'testuser',
          id: 1,
          avatar_url: 'https://avatars.githubusercontent.com/u/1',
          type: 'User',
        },
      };

      const context = {
        id: 'test-id',
        event: 'issues' as const,
        delivery: 'test-delivery',
        signature: 'sha256=test',
        timestamp: Date.now(),
      };

      const results = await processor.process('issues', payload, context);

      expect(handlerMock).toHaveBeenCalledWith(payload, context);
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
    });

    it('should invoke wildcard handlers', async () => {
      const wildcardHandler = jest.fn().mockResolvedValue({
        success: true,
        message: 'Wildcard handler',
      });

      processor.registerHandler('push', '*', wildcardHandler);

      const payload = {
        ref: 'refs/heads/main',
        before: 'abc123',
        after: 'def456',
        created: false,
        deleted: false,
        forced: false,
        compare: 'https://github.com/...',
        commits: [],
        head_commit: null,
        pusher: { name: 'test', email: 'test@test.com' },
        sender: {
          login: 'testuser',
          id: 1,
          avatar_url: 'https://avatars.githubusercontent.com/u/1',
          type: 'User' as const,
        },
      };

      const context = {
        id: 'test-id',
        event: 'push' as const,
        delivery: 'test-delivery',
        signature: 'sha256=test',
        timestamp: Date.now(),
      };

      const results = await processor.process('push', payload, context);

      expect(wildcardHandler).toHaveBeenCalled();
      expect(results).toHaveLength(1);
    });

    it('should invoke middleware before handlers', async () => {
      const executionOrder: string[] = [];

      processor.registerMiddleware(async () => {
        executionOrder.push('middleware');
        return true;
      });

      processor.registerHandler('issues', '*', async () => {
        executionOrder.push('handler');
        return { success: true };
      });

      const payload = {
        action: 'opened',
        sender: {
          login: 'test',
          id: 1,
          avatar_url: '',
          type: 'User' as const,
        },
      };

      const context = {
        id: 'test-id',
        event: 'issues' as const,
        delivery: 'test-delivery',
        signature: 'sha256=test',
        timestamp: Date.now(),
      };

      await processor.process('issues', payload as any, context);

      expect(executionOrder).toEqual(['middleware', 'handler']);
    });

    it('should stop processing if middleware returns false', async () => {
      const handlerMock = jest.fn().mockResolvedValue({ success: true });

      processor.registerMiddleware(async () => false);
      processor.registerHandler('issues', '*', handlerMock);

      const payload = {
        action: 'opened',
        sender: {
          login: 'test',
          id: 1,
          avatar_url: '',
          type: 'User' as const,
        },
      };

      const context = {
        id: 'test-id',
        event: 'issues' as const,
        delivery: 'test-delivery',
        signature: 'sha256=test',
        timestamp: Date.now(),
      };

      const results = await processor.process('issues', payload as any, context);

      expect(handlerMock).not.toHaveBeenCalled();
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
    });

    it('should handle handler errors gracefully', async () => {
      processor.registerHandler('issues', '*', async () => {
        throw new Error('Handler error');
      });

      const payload = {
        action: 'opened',
        sender: {
          login: 'test',
          id: 1,
          avatar_url: '',
          type: 'User' as const,
        },
      };

      const context = {
        id: 'test-id',
        event: 'issues' as const,
        delivery: 'test-delivery',
        signature: 'sha256=test',
        timestamp: Date.now(),
      };

      const results = await processor.process('issues', payload as any, context);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('Handler error');
    });
  });
});

function generateSignature(payload: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return `sha256=${hmac.digest('hex')}`;
}
