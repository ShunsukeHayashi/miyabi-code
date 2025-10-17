/**
 * BytePlus API Client
 */

import { createLogger } from '../../utils/logger.js';
import {
  BytePlusConfig,
  BytePlusTaskRequest,
  BytePlusTaskResponse,
} from './types.js';

const logger = createLogger('byteplus-client');

export class BytePlusClient {
  private config: BytePlusConfig;

  constructor(config?: Partial<BytePlusConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.BYTEPLUS_API_KEY || '',
      endpoint:
        config?.endpoint ||
        process.env.BYTEPLUS_API_ENDPOINT ||
        'https://ark.ap-southeast-1.bytepluses.com',
    };

    if (!this.config.apiKey) {
      logger.warn('BytePlus API key is not set');
    }
  }

  /**
   * タスクを作成
   */
  async createTask(request: BytePlusTaskRequest): Promise<BytePlusTaskResponse> {
    const url = `${this.config.endpoint}/api/v3/contents/generations/tasks`;

    try {
      logger.info('Creating BytePlus task', { model: request.model });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('BytePlus API error', {
          status: response.status,
          error: errorText,
        });
        throw new Error(`BytePlus API error: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as BytePlusTaskResponse;
      logger.info('BytePlus task created', { taskId: data.id, status: data.status });

      return data;
    } catch (error) {
      logger.error('Failed to create BytePlus task', { error });
      throw error;
    }
  }

  /**
   * タスクの状態を取得
   */
  async getTask(taskId: string): Promise<BytePlusTaskResponse> {
    const url = `${this.config.endpoint}/api/v3/contents/generations/tasks/${taskId}`;

    try {
      logger.info('Querying BytePlus task', { taskId });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('BytePlus API error', {
          status: response.status,
          error: errorText,
        });
        throw new Error(`BytePlus API error: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as BytePlusTaskResponse;
      logger.info('BytePlus task queried', { taskId, status: data.status });

      return data;
    } catch (error) {
      logger.error('Failed to query BytePlus task', { error });
      throw error;
    }
  }

  /**
   * タスクが完了するまでポーリング
   */
  async waitForCompletion(
    taskId: string,
    options: {
      maxAttempts?: number;
      intervalMs?: number;
    } = {}
  ): Promise<BytePlusTaskResponse> {
    const maxAttempts = options.maxAttempts || 60; // 5分（5秒 * 60）
    const intervalMs = options.intervalMs || 5000; // 5秒

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const task = await this.getTask(taskId);

      if (task.status === 'completed') {
        logger.info('BytePlus task completed', { taskId, attempts: attempt + 1 });
        return task;
      }

      if (task.status === 'failed') {
        logger.error('BytePlus task failed', {
          taskId,
          error: task.error,
        });
        throw new Error(`Task failed: ${task.error?.message || 'Unknown error'}`);
      }

      // Still processing, wait and retry
      logger.debug('BytePlus task still processing', {
        taskId,
        status: task.status,
        attempt: attempt + 1,
      });

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error(`Task timeout: exceeded ${maxAttempts} attempts`);
  }
}

// Singleton instance
export const bytePlusClient = new BytePlusClient();
