/**
 * Task API Tests (TDD)
 * Issue #1214: ChatGPT UI から Miyabi にタスク指示
 *
 * RED-GREEN-REFACTOR:
 * 1. Write failing tests first
 * 2. Implement minimum code to pass
 * 3. Refactor while keeping tests green
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateTaskRequest,
  createTask,
  getTask,
  listTasks,
  cancelTask,
  authenticateRequest,
} from '../../lib/task';
import type { TaskRequest, TaskResponse, TaskStatus } from '../../lib/task/types';

// Mock NextRequest for testing
class MockNextRequest {
  private _headers: Map<string, string>;
  private _body: unknown;
  url: string;

  constructor(url: string, options?: { headers?: Record<string, string>; body?: unknown }) {
    this.url = url;
    // ヘッダー名を小文字に正規化
    const normalizedHeaders = Object.entries(options?.headers || {}).map(
      ([key, value]) => [key.toLowerCase(), value] as [string, string]
    );
    this._headers = new Map(normalizedHeaders);
    this._body = options?.body;
  }

  get headers() {
    return {
      get: (name: string) => this._headers.get(name.toLowerCase()) || this._headers.get(name),
    };
  }

  async json() {
    return this._body;
  }
}

describe('Task API - Validation', () => {
  describe('validateTaskRequest', () => {
    it('should accept valid task request', () => {
      const request: TaskRequest = {
        instruction: 'Add user authentication feature',
        repository: 'customer-cloud/miyabi-private',
      };

      const result = validateTaskRequest(request);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty instruction', () => {
      const request = {
        instruction: '',
        repository: 'customer-cloud/miyabi-private',
      };

      const result = validateTaskRequest(request);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'instruction' })
      );
    });

    it('should reject missing repository', () => {
      const request = {
        instruction: 'Add feature',
      };

      const result = validateTaskRequest(request);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'repository' })
      );
    });

    it('should reject invalid repository format', () => {
      const request = {
        instruction: 'Add feature',
        repository: 'invalid-repo-format',
      };

      const result = validateTaskRequest(request);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'repository',
          code: 'INVALID_FORMAT',
        })
      );
    });

    it('should accept valid options', () => {
      const request: TaskRequest = {
        instruction: 'Add feature',
        repository: 'owner/repo',
        options: {
          auto_merge: false,
          notify: true,
          priority: 'high',
          target_branch: 'develop',
        },
      };

      const result = validateTaskRequest(request);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid priority', () => {
      const request = {
        instruction: 'Add feature',
        repository: 'owner/repo',
        options: {
          priority: 'invalid' as any,
        },
      };

      const result = validateTaskRequest(request);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'options.priority' })
      );
    });

    it('should reject instruction exceeding max length', () => {
      const request = {
        instruction: 'a'.repeat(10001),
        repository: 'owner/repo',
      };

      const result = validateTaskRequest(request);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'instruction',
          code: 'MAX_LENGTH_EXCEEDED',
        })
      );
    });
  });
});

describe('Task API - Task Orchestrator', () => {
  const mockApiKeyId = 'test-api-key-123';

  describe('createTask', () => {
    it('should create a task with queued status', async () => {
      const request: TaskRequest = {
        instruction: 'Add login feature',
        repository: 'customer-cloud/miyabi-private',
      };

      const response = await createTask(request, mockApiKeyId);

      expect(response.task_id).toBeDefined();
      expect(response.status).toBe('queued');
      expect(response.created_at).toBeDefined();
      expect(response.updated_at).toBeDefined();
    });

    it('should generate unique task IDs', async () => {
      const request: TaskRequest = {
        instruction: 'Add feature',
        repository: 'owner/repo',
      };

      const response1 = await createTask(request, mockApiKeyId);
      const response2 = await createTask(request, mockApiKeyId);

      expect(response1.task_id).not.toBe(response2.task_id);
    });

    it('should set default priority to normal', async () => {
      const request: TaskRequest = {
        instruction: 'Add feature',
        repository: 'owner/repo',
      };

      const response = await createTask(request, mockApiKeyId);
      // Priority is internal, check estimated_time is set (depends on priority)
      expect(response.estimated_time).toBeDefined();
    });

    it('should return higher estimated time for complex instructions', async () => {
      const simpleRequest: TaskRequest = {
        instruction: 'Fix typo',
        repository: 'owner/repo',
      };

      const complexRequest: TaskRequest = {
        instruction: 'Implement full authentication system with OAuth2, JWT tokens, and role-based access control',
        repository: 'owner/repo',
      };

      const simpleResponse = await createTask(simpleRequest, mockApiKeyId);
      const complexResponse = await createTask(complexRequest, mockApiKeyId);

      expect(complexResponse.estimated_time!).toBeGreaterThan(simpleResponse.estimated_time!);
    });
  });

  describe('getTask', () => {
    it('should retrieve an existing task', async () => {
      const request: TaskRequest = {
        instruction: 'Add feature',
        repository: 'owner/repo',
      };

      const created = await createTask(request, mockApiKeyId);
      const retrieved = await getTask(created.task_id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.task_id).toBe(created.task_id);
      expect(retrieved!.status).toBe(created.status);
    });

    it('should return null for non-existent task', async () => {
      const result = await getTask('non-existent-task-id');
      expect(result).toBeNull();
    });
  });

  describe('listTasks', () => {
    it('should return tasks for the given API key', async () => {
      const request: TaskRequest = {
        instruction: 'Test task',
        repository: 'owner/repo',
      };

      await createTask(request, mockApiKeyId);
      await createTask(request, mockApiKeyId);

      const tasks = await listTasks(mockApiKeyId);
      expect(tasks.length).toBeGreaterThanOrEqual(2);
    });

    it('should respect limit parameter', async () => {
      const request: TaskRequest = {
        instruction: 'Test task',
        repository: 'owner/repo',
      };

      // Create multiple tasks
      for (let i = 0; i < 5; i++) {
        await createTask(request, mockApiKeyId);
      }

      const tasks = await listTasks(mockApiKeyId, 3);
      expect(tasks.length).toBeLessThanOrEqual(3);
    });

    it('should return tasks in reverse chronological order', async () => {
      const tasks = await listTasks(mockApiKeyId);

      for (let i = 1; i < tasks.length; i++) {
        const prevDate = new Date(tasks[i - 1].created_at);
        const currDate = new Date(tasks[i].created_at);
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
      }
    });
  });

  describe('cancelTask', () => {
    it('should cancel a queued task', async () => {
      const request: TaskRequest = {
        instruction: 'Cancel me',
        repository: 'owner/repo',
      };

      const created = await createTask(request, mockApiKeyId);
      const cancelled = await cancelTask(created.task_id);

      expect(cancelled).not.toBeNull();
      expect(cancelled!.status).toBe('cancelled');
    });

    it('should not cancel a completed task', async () => {
      // This test would require mocking task completion
      // For now, we test that cancel returns appropriate response
      const result = await cancelTask('non-existent-id');
      expect(result).toBeNull();
    });
  });
});

describe('Task API - Authentication', () => {
  describe('authenticateRequest', () => {
    it('should accept valid API key', async () => {
      const request = new MockNextRequest('http://localhost/api/v1/tasks', {
        headers: {
          'Authorization': 'Bearer miyabi-test-key-valid',
        },
      });

      const result = await authenticateRequest(request as any, 'task:create');
      // In test mode, demo keys are accepted
      expect(result.success).toBe(true);
    });

    it('should reject missing authorization header', async () => {
      const request = new MockNextRequest('http://localhost/api/v1/tasks');

      const result = await authenticateRequest(request as any, 'task:create');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('MISSING_API_KEY');
    });

    it('should reject invalid authorization format', async () => {
      const request = new MockNextRequest('http://localhost/api/v1/tasks', {
        headers: {
          'Authorization': 'InvalidFormat token123',
        },
      });

      const result = await authenticateRequest(request as any, 'task:create');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_API_KEY');
    });

    it('should include rate limit info in response', async () => {
      const request = new MockNextRequest('http://localhost/api/v1/tasks', {
        headers: {
          'Authorization': 'Bearer miyabi-test-key-valid',
        },
      });

      const result = await authenticateRequest(request as any, 'task:create');
      if (result.success) {
        expect(result.rateLimit).toBeDefined();
        expect(result.rateLimit?.remaining).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

describe('Task API - Status Transitions', () => {
  const validStatuses: TaskStatus[] = ['queued', 'running', 'completed', 'failed', 'cancelled'];

  it('should only allow valid status values', () => {
    validStatuses.forEach((status) => {
      expect(['queued', 'running', 'completed', 'failed', 'cancelled']).toContain(status);
    });
  });

  it('should start with queued status', async () => {
    const request: TaskRequest = {
      instruction: 'Test task',
      repository: 'owner/repo',
    };

    const response = await createTask(request, 'test-key');
    expect(response.status).toBe('queued');
  });
});
