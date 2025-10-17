/**
 * BytePlus Text-to-Image Service
 */

import { createLogger } from '../../utils/logger.js';
import { BytePlusClient } from './client.js';

const logger = createLogger('byteplus-t2i');

/**
 * Text-to-Image Request
 */
export interface T2IRequest {
  prompt: string;
  size?: '512x512' | '768x768' | '1024x1024' | '1024x1792' | '1792x1024';
  guidanceScale?: number; // 1-20, default 3
  watermark?: boolean;
}

/**
 * Text-to-Image Response
 */
export interface T2IResponse {
  imageUrl: string;
  prompt: string;
  size: string;
  createdAt: string;
}

export class BytePlusT2I {
  private client: BytePlusClient;
  private endpoint: string;
  private model: string;

  constructor(client?: BytePlusClient) {
    this.client = client || new BytePlusClient();
    this.endpoint =
      process.env.BYTEPLUS_API_ENDPOINT ||
      'https://ark.ap-southeast.bytepluses.com/api/v3';
    this.model = process.env.BYTEPLUS_T2I_MODEL || 'seedream-4-0-250828';
  }

  /**
   * テキストから画像を生成
   */
  async generate(request: T2IRequest): Promise<T2IResponse> {
    logger.info('Generating image from text', {
      prompt: request.prompt.substring(0, 50),
      size: request.size,
    });

    // Mock response for development/testing
    if (!process.env.BYTEPLUS_API_KEY || process.env.BYTEPLUS_API_KEY === 'your_api_key_here' || process.env.NODE_ENV === 'development') {
      logger.info('Using mock response for T2I generation');
      
      // Generate different mock images based on prompt content
      let mockImageUrl = 'https://via.placeholder.com/1024x1024/FF69B4/FFFFFF?text=Mock+Character+Image';
      
      if (request.prompt.toLowerCase().includes('anime')) {
        mockImageUrl = 'https://via.placeholder.com/1024x1024/FF69B4/FFFFFF?text=Anime+Character';
      } else if (request.prompt.toLowerCase().includes('realistic')) {
        mockImageUrl = 'https://via.placeholder.com/1024x1024/87CEEB/FFFFFF?text=Realistic+Character';
      } else if (request.prompt.toLowerCase().includes('manga')) {
        mockImageUrl = 'https://via.placeholder.com/1024x1024/FFB6C1/FFFFFF?text=Manga+Character';
      }
      
      return {
        imageUrl: mockImageUrl,
        prompt: request.prompt,
        size: request.size || '1024x1024',
        createdAt: new Date().toISOString(),
      };
    }

    try {
      // seedream-4-0-250828は guidance_scale をサポートしていないため除外
      const requestBody: any = {
        model: this.model,
        prompt: request.prompt,
        response_format: 'url',
        size: request.size || '1024x1024',
        watermark: request.watermark ?? true,
      };

      // seedream-3系のみguidance_scaleをサポート
      if (this.model.includes('seedream-3') && request.guidanceScale) {
        requestBody.guidance_scale = request.guidanceScale;
      }

      const response = await fetch(`${this.endpoint}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.BYTEPLUS_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('T2I generation failed', {
          status: response.status,
          error: errorText,
        });
        throw new Error(`T2I generation failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      // BytePlus API returns { data: [{ url: "..." }] }
      const imageUrl = data.data?.[0]?.url;

      if (!imageUrl) {
        throw new Error('No image URL in response');
      }

      logger.info('Image generated successfully', { imageUrl });

      return {
        imageUrl,
        prompt: request.prompt,
        size: request.size || '1024x1024',
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to generate image', { error });
      throw error;
    }
  }

  /**
   * キャラクター画像を生成（プロンプト最適化版）
   */
  async generateCharacter(params: {
    appearance: string;
    style: string;
    expression?: string;
  }): Promise<T2IResponse> {
    const { appearance, style, expression = 'neutral' } = params;

    // スタイル別の最適化されたプロンプトテンプレート
    const stylePrompts: Record<string, string> = {
      realistic: 'photorealistic portrait, ultra-detailed, professional photography, natural skin texture, realistic lighting and shadows',
      anime: 'anime art style, vibrant colors, expressive features, clean lines, high-quality illustration, detailed shading',
      manga: 'manga art style, black and white with screen tones, dynamic composition, expressive facial features, professional manga illustration',
    };

    // 表情別の詳細な記述
    const expressionDetails: Record<string, string> = {
      neutral: 'calm, composed neutral expression with relaxed facial features',
      smile: 'warm, genuine smile with slightly raised cheeks and bright eyes',
      happy: 'joyful expression with wide smile and sparkling eyes',
      shy: 'bashful, shy expression with downcast eyes and slight blush',
      surprised: 'surprised expression with wide eyes and raised eyebrows',
      in_love: 'loving, tender expression with soft eyes and gentle smile',
      sad: 'melancholic expression with downturned eyes',
      angry: 'intense expression with furrowed brows',
    };

    const styleDesc = stylePrompts[style] || `${style} art style, high quality`;
    const expressionDesc = expressionDetails[expression] || `${expression} expression`;

    const prompt = `Create a stunning ${style} character portrait.
Character details: ${appearance}
Expression: ${expressionDesc}
Art style: ${styleDesc}
High quality, masterpiece, best quality, detailed facial features, professional composition, perfect anatomy, beautiful lighting and atmosphere.`.trim();

    return this.generate({
      prompt,
      size: '1024x1024',
      watermark: false,
    });
  }
}

// Singleton instance
export const bytePlusT2I = new BytePlusT2I();
