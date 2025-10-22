/**
 * Error Recovery API Client
 *
 * API endpoints for task retry and cancellation operations
 */

import React from 'react';
import type {
  TaskRetryRequest,
  TaskRetryResponse,
  TaskCancelResponse,
} from '../types/error-types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Retry a failed task
 *
 * @param taskId - The ID of the task to retry
 * @param reason - Optional reason for retry
 * @returns Promise<TaskRetryResponse>
 * @throws Error if retry fails
 *
 * @example
 * ```typescript
 * const response = await retryTask('task-123', 'Timeout error - retrying');
 * console.log(response.message); // "Task task-123 has been queued for retry"
 * ```
 */
export async function retryTask(
  taskId: string,
  reason?: string
): Promise<TaskRetryResponse> {
  const payload: TaskRetryRequest = reason ? { reason } : {};

  const response = await fetch(`${API_URL}/api/tasks/${taskId}/retry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to retry task ${taskId}: ${errorText}`);
  }

  return response.json();
}

/**
 * Cancel a running task
 *
 * @param taskId - The ID of the task to cancel
 * @returns Promise<TaskCancelResponse>
 * @throws Error if cancellation fails
 *
 * @example
 * ```typescript
 * const response = await cancelTask('task-456');
 * console.log(response.message); // "Task task-456 has been cancelled"
 * ```
 */
export async function cancelTask(taskId: string): Promise<TaskCancelResponse> {
  const response = await fetch(`${API_URL}/api/tasks/${taskId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to cancel task ${taskId}: ${errorText}`);
  }

  return response.json();
}

/**
 * Custom hook for error recovery operations
 *
 * @example
 * ```typescript
 * const { retryTask, cancelTask, isRetrying, isCancelling, error } = useErrorRecovery();
 *
 * // Retry a task
 * await retryTask('task-123', 'Timeout - retrying');
 *
 * // Cancel a task
 * await cancelTask('task-456');
 * ```
 */
export function useErrorRecovery() {
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const handleRetry = React.useCallback(
    async (taskId: string, reason?: string) => {
      setIsRetrying(true);
      setError(null);

      try {
        const response = await retryTask(taskId, reason);
        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsRetrying(false);
      }
    },
    []
  );

  const handleCancel = React.useCallback(async (taskId: string) => {
    setIsCancelling(true);
    setError(null);

    try {
      const response = await cancelTask(taskId);
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsCancelling(false);
    }
  }, []);

  return {
    retryTask: handleRetry,
    cancelTask: handleCancel,
    isRetrying,
    isCancelling,
    error,
  };
}
