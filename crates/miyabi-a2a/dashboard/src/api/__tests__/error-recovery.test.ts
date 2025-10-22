import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { retryTask, cancelTask, useErrorRecovery } from '../error-recovery';
import { renderHook, act } from '@testing-library/react';
import type { TaskRetryResponse, TaskCancelResponse } from '../../types/error-types';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('error-recovery API client', () => {
  const API_URL = 'http://localhost:3001';

  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('retryTask', () => {
    it('should successfully retry a task with reason', async () => {
      const mockResponse: TaskRetryResponse = {
        task_id: 'task-123',
        status: 'retrying',
        message: 'Task task-123 has been queued for retry',
        retry_count: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await retryTask('task-123', 'Timeout error - retrying');

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_URL}/api/tasks/task-123/retry`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Timeout error - retrying' }),
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should successfully retry a task without reason', async () => {
      const mockResponse: TaskRetryResponse = {
        task_id: 'task-456',
        status: 'retrying',
        message: 'Task task-456 has been queued for retry',
        retry_count: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await retryTask('task-456');

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_URL}/api/tasks/task-456/retry`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should throw error when retry fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Task not found',
      });

      await expect(retryTask('task-999')).rejects.toThrow(
        'Failed to retry task task-999: Task not found'
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(retryTask('task-123')).rejects.toThrow('Network error');
    });
  });

  describe('cancelTask', () => {
    it('should successfully cancel a task', async () => {
      const mockResponse: TaskCancelResponse = {
        task_id: 'task-789',
        status: 'cancelled',
        message: 'Task task-789 has been cancelled',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await cancelTask('task-789');

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_URL}/api/tasks/task-789/cancel`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should throw error when cancel fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Task not running',
      });

      await expect(cancelTask('task-999')).rejects.toThrow(
        'Failed to cancel task task-999: Task not running'
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(cancelTask('task-789')).rejects.toThrow('Network error');
    });
  });

  describe('useErrorRecovery hook', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useErrorRecovery());

      expect(result.current.isRetrying).toBe(false);
      expect(result.current.isCancelling).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle successful retry', async () => {
      const mockResponse: TaskRetryResponse = {
        task_id: 'task-123',
        status: 'retrying',
        message: 'Task task-123 has been queued for retry',
        retry_count: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useErrorRecovery());

      await act(async () => {
        const response = await result.current.retryTask('task-123', 'Test retry');
        expect(response).toEqual(mockResponse);
      });

      expect(result.current.isRetrying).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should reset isRetrying flag after retry completes', async () => {
      const mockResponse: TaskRetryResponse = {
        task_id: 'task-123',
        status: 'retrying',
        message: 'Task task-123 has been queued for retry',
        retry_count: 1,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useErrorRecovery());

      // Initially false
      expect(result.current.isRetrying).toBe(false);

      // Call retry
      await act(async () => {
        await result.current.retryTask('task-123');
      });

      // After retry completes, should be false again
      expect(result.current.isRetrying).toBe(false);
    });

    it('should handle retry error', async () => {
      const errorMessage = 'Failed to retry task task-999: Task not found';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Task not found',
      });

      const { result } = renderHook(() => useErrorRecovery());

      let caughtError: Error | null = null;

      await act(async () => {
        try {
          await result.current.retryTask('task-999');
        } catch (err) {
          caughtError = err as Error;
        }
      });

      expect(caughtError).toBeInstanceOf(Error);
      expect(caughtError?.message).toBe(errorMessage);
      expect(result.current.isRetrying).toBe(false);
      expect(result.current.error).toBeInstanceOf(Error);
    });

    it('should handle successful cancel', async () => {
      const mockResponse: TaskCancelResponse = {
        task_id: 'task-789',
        status: 'cancelled',
        message: 'Task task-789 has been cancelled',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useErrorRecovery());

      await act(async () => {
        const response = await result.current.cancelTask('task-789');
        expect(response).toEqual(mockResponse);
      });

      expect(result.current.isCancelling).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should reset isCancelling flag after cancel completes', async () => {
      const mockResponse: TaskCancelResponse = {
        task_id: 'task-789',
        status: 'cancelled',
        message: 'Task task-789 has been cancelled',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useErrorRecovery());

      // Initially false
      expect(result.current.isCancelling).toBe(false);

      // Call cancel
      await act(async () => {
        await result.current.cancelTask('task-789');
      });

      // After cancel completes, should be false again
      expect(result.current.isCancelling).toBe(false);
    });

    it('should handle cancel error', async () => {
      const errorMessage = 'Failed to cancel task task-999: Task not running';

      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'Task not running',
      });

      const { result } = renderHook(() => useErrorRecovery());

      let caughtError: Error | null = null;

      await act(async () => {
        try {
          await result.current.cancelTask('task-999');
        } catch (err) {
          caughtError = err as Error;
        }
      });

      expect(caughtError).toBeInstanceOf(Error);
      expect(caughtError?.message).toBe(errorMessage);
      expect(result.current.isCancelling).toBe(false);
      expect(result.current.error).toBeInstanceOf(Error);
    });

    it('should clear previous error on new retry attempt', async () => {
      // First, trigger an error
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => 'First error',
      });

      const { result } = renderHook(() => useErrorRecovery());

      await act(async () => {
        try {
          await result.current.retryTask('task-1');
        } catch (err) {
          // Expected error
        }
      });

      expect(result.current.error).toBeInstanceOf(Error);

      // Second attempt succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          task_id: 'task-2',
          status: 'retrying',
          message: 'Task task-2 has been queued for retry',
          retry_count: 1,
        }),
      });

      await act(async () => {
        await result.current.retryTask('task-2');
      });

      expect(result.current.error).toBeNull();
    });
  });
});
