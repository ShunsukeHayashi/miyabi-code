/**
 * BytePlus API Type Definitions
 */

/**
 * BytePlus API Request Content
 */
export interface BytePlusContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

/**
 * BytePlus Task Request
 */
export interface BytePlusTaskRequest {
  model: string;
  content: BytePlusContent[];
}

/**
 * BytePlus Task Response
 */
export interface BytePlusTaskResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  model: string;
  created_at: string;
  output?: BytePlusTaskOutput;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * BytePlus Task Output
 */
export interface BytePlusTaskOutput {
  video_url?: string;
  image_url?: string;
  duration?: number;
  resolution?: string;
}

/**
 * BytePlus Model IDs
 */
export const BYTEPLUS_MODELS = {
  // Text-to-Image
  T2I: process.env.BYTEPLUS_T2I_MODEL || 'default-t2i-model',

  // Image-to-Image
  I2I: process.env.BYTEPLUS_I2I_MODEL || 'default-i2i-model',

  // Text-to-Video
  T2V: process.env.BYTEPLUS_T2V_MODEL || 'default-t2v-model',

  // Image-to-Video
  I2V: process.env.BYTEPLUS_I2V_MODEL || 'seedance-1-0-pro-250528',
} as const;

/**
 * BytePlus API Configuration
 */
export interface BytePlusConfig {
  apiKey: string;
  endpoint: string;
}

/**
 * Task Creation Options
 */
export interface TaskOptions {
  resolution?: '720p' | '1080p' | '4k';
  duration?: number; // seconds
  cameraFixed?: boolean;
}
