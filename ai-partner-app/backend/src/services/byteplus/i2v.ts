/**
 * BytePlus Image-to-Video Service
 */

import { createLogger } from '../../utils/logger.js';
import { BytePlusClient } from './client.js';
import {
  BytePlusContent,
  BytePlusTaskRequest,
  TaskOptions,
  BYTEPLUS_MODELS,
} from './types.js';

const logger = createLogger('byteplus-i2v');

/**
 * Image-to-Video Request
 */
export interface I2VRequest {
  prompt: string;
  imageUrl: string;
  options?: TaskOptions;
}

/**
 * Image-to-Video Response
 */
export interface I2VResponse {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  duration?: number;
  resolution?: string;
}

export class BytePlusI2V {
  private client: BytePlusClient;

  constructor(client?: BytePlusClient) {
    this.client = client || new BytePlusClient();
  }

  /**
   * 画像から動画を生成
   */
  async generate(request: I2VRequest): Promise<I2VResponse> {
    logger.info('Generating video from image', {
      prompt: request.prompt.substring(0, 50),
      imageUrl: request.imageUrl,
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
      {
        type: 'image_url',
        image_url: {
          url: request.imageUrl,
        },
      },
    ];

    const taskRequest: BytePlusTaskRequest = {
      model: BYTEPLUS_MODELS.I2V,
      content,
    };

    try {
      const task = await this.client.createTask(taskRequest);

      logger.info('I2V task created', { taskId: task.id });

      return {
        taskId: task.id,
        status: task.status,
        videoUrl: task.output?.video_url,
        duration: task.output?.duration,
        resolution: task.output?.resolution,
      };
    } catch (error) {
      logger.error('Failed to generate video from image', { error });
      throw error;
    }
  }

  /**
   * タスクの状態を取得
   */
  async getTaskStatus(taskId: string): Promise<I2VResponse> {
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
  async waitForCompletion(taskId: string): Promise<I2VResponse> {
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
   * キャラクターのアニメーションを生成
   */
  async animateCharacter(params: {
    imageUrl: string;
    action: string;
    duration?: number;
  }): Promise<I2VResponse> {
    const { imageUrl, action, duration = 5 } = params;

    const prompt = `Animate the character: ${action}. Smooth natural movement, maintain character appearance.`;

    return this.generate({
      prompt,
      imageUrl,
      options: {
        duration,
        resolution: '1080p',
        cameraFixed: true,
      },
    });
  }
}

// Singleton instance
export const bytePlusI2V = new BytePlusI2V();
