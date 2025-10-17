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
    // Map width/height to size parameter
    let size = '1K'; // default
    if (request.width === 2048 || request.height === 2048) {
      size = '2K';
    } else if (request.width && request.height) {
      size = `${request.width}x${request.height}`;
    }

    const payload = {
      model: request.model || 'seedream-4-0-250828',
      prompt: request.prompt,
      size,
      sequential_image_generation: 'disabled',
      response_format: 'url',
      stream: false,
      watermark: true,
    };

    return this.post<TextToImageResponse>('/images/generations', payload);
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
