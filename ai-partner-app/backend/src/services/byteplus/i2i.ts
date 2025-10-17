/**
 * BytePlus Image-to-Image Service
 */

import { createLogger } from '../../utils/logger.js';
import { BytePlusClient } from './client.js';

const logger = createLogger('byteplus-i2i');

/**
 * Image-to-Image Request
 */
export interface I2IRequest {
  prompt: string;
  imageUrl?: string | string[]; // seedream-4-0: 複数画像入力をサポート
  imageData?: string; // Base64 encoded image data
  mimeType?: string; // MIME type for imageData
  strength?: number; // 画像変換の強度 (0-1, デフォルト: 0.5)
  size?: 'adaptive' | '512x512' | '768x768' | '1024x1024' | '1k' | '2k' | '4k';
  guidanceScale?: number; // 1-20, default 5.5
  seed?: number;
  watermark?: boolean;
  sequentialImageGeneration?: 'disabled' | 'auto'; // seedream-4-0: 複数画像生成
  maxImages?: number; // sequentialImageGeneration時の最大画像数（デフォルト: 5）
}

/**
 * Image-to-Image Response
 */
export interface I2IResponse {
  imageUrl: string;
  imageUrls?: string[]; // 複数画像生成時
  prompt: string;
  sourceImageUrl: string | string[]; // 複数入力画像に対応
  createdAt: string;
}

export class BytePlusI2I {
  private client: BytePlusClient;
  private endpoint: string;
  private model: string;

  constructor(client?: BytePlusClient) {
    this.client = client || new BytePlusClient();
    this.endpoint =
      process.env.BYTEPLUS_API_ENDPOINT ||
      'https://ark.ap-southeast.bytepluses.com/api/v3';
    this.model = process.env.BYTEPLUS_I2I_MODEL || 'seedream-4-0-250828';
  }

  /**
   * 画像を変換
   */
  async generate(request: I2IRequest): Promise<I2IResponse> {
    // Use imageData if provided, otherwise use imageUrl
    const usingBase64 = !!request.imageData;
    const imageCount = Array.isArray(request.imageUrl) ? request.imageUrl.length : 1;

    logger.info('Transforming image', {
      prompt: request.prompt.substring(0, 50),
      source: usingBase64 ? 'base64 data' : (Array.isArray(request.imageUrl) ? `${imageCount} images` : request.imageUrl),
    });

    // Mock response for development/testing
    if (!process.env.BYTEPLUS_API_KEY || process.env.BYTEPLUS_API_KEY === 'your_api_key_here' || process.env.NODE_ENV === 'development') {
      logger.info('Using mock response for I2I generation');
      
      // Generate different mock images based on expression
      let mockImageUrl = 'https://via.placeholder.com/1024x1024/FF69B4/FFFFFF?text=Expression+Image';
      
      if (request.prompt.toLowerCase().includes('smile')) {
        mockImageUrl = 'https://via.placeholder.com/1024x1024/FFB6C1/FFFFFF?text=Smile+Expression';
      } else if (request.prompt.toLowerCase().includes('happy')) {
        mockImageUrl = 'https://via.placeholder.com/1024x1024/FFD700/FFFFFF?text=Happy+Expression';
      } else if (request.prompt.toLowerCase().includes('sad')) {
        mockImageUrl = 'https://via.placeholder.com/1024x1024/87CEEB/FFFFFF?text=Sad+Expression';
      } else if (request.prompt.toLowerCase().includes('angry')) {
        mockImageUrl = 'https://via.placeholder.com/1024x1024/FF6347/FFFFFF?text=Angry+Expression';
      }
      
      return {
        imageUrl: mockImageUrl,
        prompt: request.prompt,
        sourceImageUrl: request.imageUrl,
        size: request.size || 'adaptive',
        createdAt: new Date().toISOString(),
      };
    }

    try {
      // seedream-4-0-250828は guidance_scale をサポートしていないため除外
      // seedream-4-0は size: '1k', '2k', '4k', 'WIDTHxHEIGHT' のみサポート
      let size = request.size || 'adaptive';

      // seedream-4-0の場合、adaptiveを1kに変換
      if (this.model.includes('seedream-4') && size === 'adaptive') {
        size = '1k';
      }

      // Prepare image input - either URL or Base64 data
      let imageInput: any;
      if (request.imageData) {
        // Use Base64 data in data URI format
        const mimeType = request.mimeType || 'image/jpeg';
        imageInput = `data:${mimeType};base64,${request.imageData}`;
      } else {
        // Use URL
        imageInput = request.imageUrl;
      }

      const requestBody: any = {
        model: this.model,
        prompt: request.prompt,
        image: imageInput,
        response_format: 'url',
        size,
        watermark: request.watermark ?? true,
      };

      // Add strength parameter if provided (controls how much to preserve original)
      if (request.strength !== undefined) {
        requestBody.strength = request.strength;
      }

      // seedream-3系のみseedとguidance_scaleをサポート
      if (this.model.includes('seededit-3')) {
        if (request.seed) requestBody.seed = request.seed;
        if (request.guidanceScale) requestBody.guidance_scale = request.guidanceScale;
      }

      // seedream-4-0: 連続画像生成（複数バリエーション）
      if (this.model.includes('seedream-4') && request.sequentialImageGeneration) {
        requestBody.sequential_image_generation = request.sequentialImageGeneration;
        if (request.maxImages) {
          requestBody.sequential_image_generation_options = {
            max_images: request.maxImages,
          };
        }
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
        logger.error('I2I transformation failed', {
          status: response.status,
          error: errorText,
        });
        throw new Error(`I2I transformation failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const imageUrl = data.data?.[0]?.url;

      if (!imageUrl) {
        throw new Error('No image URL in response');
      }

      // 複数画像の場合、すべてのURLを取得
      const imageUrls = data.data?.map((item: any) => item.url) || [];

      logger.info('Image transformed successfully', {
        imageUrl,
        imageCount: imageUrls.length
      });

      return {
        imageUrl,
        imageUrls: imageUrls.length > 1 ? imageUrls : undefined,
        prompt: request.prompt,
        sourceImageUrl: request.imageUrl,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to transform image', { error });
      throw error;
    }
  }

  /**
   * キャラクターの表情を変更（プロンプト最適化版）
   * customPrompt指定時は基本プロンプトに追加される
   */
  async changeExpression(params: {
    sourceImageUrl: string;
    expression: string;
    customPrompt?: string; // ユーザー追加プロンプト
  }): Promise<I2IResponse> {
    const { sourceImageUrl, expression, customPrompt } = params;

    // 最適化されたプロンプトテンプレート（seedream-4-0対応）
    const expressionPrompts: Record<string, string> = {
      smile: 'Transform the character to have a warm, genuine smile with slightly raised cheeks, bright eyes showing happiness, and a relaxed, friendly demeanor. Natural facial expression with subtle joy.',
      happy: 'Make the character express pure happiness and joy with wide, sparkling eyes, a bright smile, raised eyebrows, and an overall radiant, positive aura. The face should glow with genuine delight.',
      shy: 'Transform the character to look bashful and shy with downcast or side-glancing eyes, a slight blush on cheeks, a small nervous smile, and a modest, gentle expression showing timidity.',
      surprised: 'Make the character look genuinely surprised with widely opened eyes, raised eyebrows, slightly open mouth, and an expression of sudden astonishment or unexpected discovery.',
      in_love: 'Transform the character to have a loving, tender expression with soft, dreamy eyes, a gentle smile, warm facial features, and an affectionate, romantic aura showing deep fondness.',
      tears_of_joy: 'Make the character cry tears of joy with glistening eyes filled with happy tears, a bright smile despite crying, flushed cheeks, and an overwhelmed expression of happiness.',
      sad: 'Transform the character to look sad with downturned eyes, a slight frown, drooping facial features, and a melancholic, sorrowful expression showing emotional pain.',
      angry: 'Make the character look angry with furrowed brows, intense narrowed eyes, tight lips, and a stern, fierce expression showing frustration or rage.',
      neutral: 'Keep the character with a calm, composed, neutral expression with relaxed facial features, steady gaze, and a peaceful, balanced demeanor showing emotional equilibrium.',
      excited: 'Transform the character to look excited and energetic with wide bright eyes, enthusiastic smile, raised eyebrows, and an animated, vibrant expression showing anticipation.',
      worried: 'Make the character look concerned and worried with slightly furrowed brows, anxious eyes, a tense expression, and visible signs of stress or apprehension.',
      sleepy: 'Transform the character to look tired and sleepy with half-closed drowsy eyes, a relaxed mouth, and a gentle, peaceful expression showing fatigue.',
    };

    // 基本プロンプト
    let basePrompt = expressionPrompts[expression] ||
      `Transform the character to display a ${expression} expression with appropriate facial features, emotional nuance, and natural appearance. Keep the overall character design, hairstyle, and appearance consistent.`;

    // カスタムプロンプトを追加
    const finalPrompt = customPrompt
      ? `${basePrompt} ${customPrompt}`
      : basePrompt;

    return this.generate({
      prompt: finalPrompt,
      imageUrl: sourceImageUrl,
      size: '1k', // seedream-4-0は1k, 2k, 4kのみサポート
      watermark: false,
    });
  }

  /**
   * キャラクターのポーズを変更
   */
  async changePose(params: {
    sourceImageUrl: string;
    pose: string;
  }): Promise<I2IResponse> {
    const { sourceImageUrl, pose } = params;

    return this.generate({
      prompt: `Change the character's pose to: ${pose}. Keep the face and appearance the same.`,
      imageUrl: sourceImageUrl,
      size: 'adaptive',
      guidanceScale: 6,
      watermark: false,
    });
  }
}

// Singleton instance
export const bytePlusI2I = new BytePlusI2I();
