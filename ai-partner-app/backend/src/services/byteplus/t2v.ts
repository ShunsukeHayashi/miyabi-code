/**
 * BytePlus Text-to-Video Service
 */

import { createLogger } from '../../utils/logger.js';
import { BytePlusClient } from './client.js';
import {
  BytePlusContent,
  BytePlusTaskRequest,
  TaskOptions,
  BYTEPLUS_MODELS,
} from './types.js';

const logger = createLogger('byteplus-t2v');

/**
 * Text-to-Video Request
 */
export interface T2VRequest {
  prompt: string;
  options?: TaskOptions;
}

/**
 * Text-to-Video Response
 */
export interface T2VResponse {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  duration?: number;
  resolution?: string;
}

export class BytePlusT2V {
  private client: BytePlusClient;

  constructor(client?: BytePlusClient) {
    this.client = client || new BytePlusClient();
  }

  /**
   * テキストから動画を生成
   */
  async generate(request: T2VRequest): Promise<T2VResponse> {
    logger.info('Generating video from text', {
      prompt: request.prompt.substring(0, 50),
    });

    const options = request.options || {};
    const resolution = options.resolution || '1080p';
    const duration = options.duration || 5;
    const cameraFixed = options.cameraFixed ?? false;

    // Build prompt with options
    const fullPrompt = `${request.prompt} --resolution ${resolution} --duration ${duration} --camerafixed ${cameraFixed}`;

    const content: BytePlusContent[] = [
      {
        type: 'text',
        text: fullPrompt,
      },
    ];

    const taskRequest: BytePlusTaskRequest = {
      model: BYTEPLUS_MODELS.T2V,
      content,
    };

    try {
      const task = await this.client.createTask(taskRequest);

      logger.info('T2V task created', { taskId: task.id });

      return {
        taskId: task.id,
        status: task.status,
        videoUrl: task.output?.video_url,
        duration: task.output?.duration,
        resolution: task.output?.resolution,
      };
    } catch (error) {
      logger.error('Failed to generate video from text', { error });
      throw error;
    }
  }

  /**
   * タスクの状態を取得
   */
  async getTaskStatus(taskId: string): Promise<T2VResponse> {
    try {
      const task = await this.client.getTask(taskId);

      return {
        taskId: task.id,
        status: task.status,
        videoUrl: task.output?.video_url,
        duration: task.output?.duration,
        resolution: task.output?.resolution,
      };
    } catch (error) {
      logger.error('Failed to get task status', { error });
      throw error;
    }
  }

  /**
   * タスク完了まで待機
   */
  async waitForCompletion(taskId: string): Promise<T2VResponse> {
    try {
      const task = await this.client.waitForCompletion(taskId);

      return {
        taskId: task.id,
        status: task.status,
        videoUrl: task.output?.video_url,
        duration: task.output?.duration,
        resolution: task.output?.resolution,
      };
    } catch (error) {
      logger.error('Failed to wait for task completion', { error });
      throw error;
    }
  }

  /**
   * シーン動画を生成
   */
  async generateScene(params: {
    description: string;
    duration?: number;
    style?: 'anime' | 'realistic' | 'manga';
  }): Promise<T2VResponse> {
    const { description, duration = 5, style = 'anime' } = params;

    const prompt = `${style} style: ${description}. High quality, cinematic, smooth motion.`;

    return this.generate({
      prompt,
      options: {
        duration,
        resolution: '1080p',
        cameraFixed: false,
      },
    });
  }

  /**
   * デートシーンを生成
   */
  async generateDateScene(params: {
    location: string;
    characters: string;
    action: string;
    duration?: number;
  }): Promise<T2VResponse> {
    const { location, characters, action, duration = 10 } = params;

    const prompt = `Romantic date scene: ${characters} at ${location}, ${action}. Cinematic, beautiful lighting, anime style.`;

    return this.generate({
      prompt,
      options: {
        duration,
        resolution: '1080p',
        cameraFixed: false,
      },
    });
  }
}

// Singleton instance
export const bytePlusT2V = new BytePlusT2V();
