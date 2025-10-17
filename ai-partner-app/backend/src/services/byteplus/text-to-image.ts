/**
 * BytePlus Text-to-Image API Client
 */

import { BytePlusClient } from './client';
import {
  TextToImageRequest,
  TextToImageResponse,
  BytePlusConfig,
} from './types';

export class TextToImageClient extends BytePlusClient {
  constructor(config: BytePlusConfig) {
    super(config);
  }

  /**
   * Generate image from text prompt
   */
  async generate(request: TextToImageRequest): Promise<TextToImageResponse> {
    const payload = {
      prompt: request.prompt,
      model: request.model || 'flux-schnell',
      width: request.width || 1024,
      height: request.height || 1024,
      seed: request.seed || Math.floor(Math.random() * 1000000),
      num_images: request.num_images || 1,
      guidance_scale: request.guidance_scale || 7.5,
      steps: request.steps || 20,
    };

    return this.post<TextToImageResponse>('/text-to-image', payload);
  }

  /**
   * Generate multiple images with different variations
   */
  async generateBatch(
    prompt: string,
    count: number = 4
  ): Promise<TextToImageResponse> {
    return this.generate({
      prompt,
      num_images: count,
    });
  }

  /**
   * Generate image with specific dimensions
   */
  async generateWithSize(
    prompt: string,
    width: number,
    height: number
  ): Promise<TextToImageResponse> {
    return this.generate({
      prompt,
      width,
      height,
    });
  }
}
