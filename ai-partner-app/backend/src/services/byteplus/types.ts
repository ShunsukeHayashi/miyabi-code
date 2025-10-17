/**
 * BytePlus API Types
 */

export interface BytePlusConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface TextToImageRequest {
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
  seed?: number;
  num_images?: number;
  guidance_scale?: number;
  steps?: number;
}

export interface TextToImageResponse {
  data: {
    images: Array<{
      url: string;
      seed: number;
    }>;
  };
}

export interface ImageToVideoRequest {
  image_url: string;
  prompt?: string;
  duration?: number;
  seed?: number;
}

export interface ImageToVideoResponse {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface VideoStatusRequest {
  task_id: string;
}

export interface VideoStatusResponse {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  progress?: number;
  error?: string;
}

export class BytePlusError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'BytePlusError';
  }
}
