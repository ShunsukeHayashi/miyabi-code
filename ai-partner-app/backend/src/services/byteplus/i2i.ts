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

  /**
   * キャラクターの髪型を変更（最適化されたプロンプト）
   */
  async changeHairstyle(params: {
    sourceImageUrl: string;
    hairstyle: string;
    hairColor?: string; // オプション：髪の色も変更
    customPrompt?: string;
  }): Promise<I2IResponse> {
    const { sourceImageUrl, hairstyle, hairColor, customPrompt } = params;

    // 最適化された髪型変更プロンプト
    const hairstylePrompts: Record<string, string> = {
      'long-straight': 'Transform the hairstyle to long, straight hair flowing down to the shoulders or back. Smooth, sleek texture with natural shine. Keep face and other features identical.',
      'short-bob': 'Change the hairstyle to a short bob cut, chin-length with clean lines. Modern and stylish appearance. Maintain facial features and expression.',
      'curly': 'Transform the hair to have beautiful curls and waves. Natural, bouncy curls with volume and texture. Keep the same facial features.',
      'ponytail': 'Style the hair into a high or mid ponytail. Gathered hair with some strands framing the face naturally. Preserve facial identity.',
      'twin-tails': 'Transform into twin-tails hairstyle with two side ponytails. Cute and youthful appearance. Keep face identical.',
      'pixie-cut': 'Change to a pixie cut hairstyle, very short and chic. Modern and edgy appearance. Maintain facial features.',
      'wavy-medium': 'Transform to medium-length wavy hair. Soft, natural waves with movement and texture. Keep face the same.',
      'bun': 'Style the hair into an elegant bun. Hair gathered up, neat and sophisticated. Preserve facial features.',
      'braided': 'Create a braided hairstyle, single braid or multiple braids. Intricate and detailed braiding. Keep face identical.',
      'messy-short': 'Transform to short, messy, tousled hairstyle. Casual and trendy appearance with natural texture. Maintain facial identity.',
    };

    // 基本プロンプトを構築
    let basePrompt = hairstylePrompts[hairstyle] ||
      `Transform the hairstyle to: ${hairstyle}. Keep the face, facial features, and overall appearance identical. Only change the hair.`;

    // 髪の色の指定があれば追加
    if (hairColor) {
      basePrompt += ` Change hair color to ${hairColor}.`;
    }

    // カスタムプロンプトを追加
    const finalPrompt = customPrompt
      ? `${basePrompt} ${customPrompt}`
      : basePrompt;

    return this.generate({
      prompt: finalPrompt,
      imageUrl: sourceImageUrl,
      size: '1k', // seedream-4-0は1k, 2k, 4kのみサポート
      strength: 0.6, // 顔を保持しつつ髪型を変更
      watermark: false,
    });
  }

  /**
   * 背景/場所を変更（最適化されたプロンプト）
   */
  async changeBackground(params: {
    sourceImageUrl: string;
    location: string;
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'; // 時間帯
    weather?: 'sunny' | 'cloudy' | 'rainy' | 'snowy'; // 天気
    customPrompt?: string;
  }): Promise<I2IResponse> {
    const { sourceImageUrl, location, timeOfDay, weather, customPrompt } = params;

    // 最適化された場所変更プロンプト
    const locationPrompts: Record<string, string> = {
      'beach': 'Place the character on a beautiful beach with sand, ocean waves, and blue sky. Natural lighting and coastal atmosphere.',
      'forest': 'Place the character in a lush green forest with tall trees, natural foliage, and dappled sunlight filtering through leaves.',
      'city-street': 'Place the character on a modern city street with buildings, urban environment, and bustling atmosphere.',
      'cafe': 'Place the character in a cozy cafe interior with tables, chairs, warm lighting, and comfortable atmosphere.',
      'park': 'Place the character in a peaceful park with grass, trees, flowers, and natural outdoor setting.',
      'mountain': 'Place the character on a scenic mountain with peaks, valleys, and dramatic landscape in the background.',
      'school': 'Place the character in a school setting with classroom elements, desks, windows, and educational atmosphere.',
      'bedroom': 'Place the character in a comfortable bedroom interior with bed, furniture, and cozy domestic atmosphere.',
      'library': 'Place the character in a quiet library with bookshelves, reading spaces, and scholarly atmosphere.',
      'rooftop': 'Place the character on a rooftop with city skyline or scenic view in the background, open air setting.',
      'japanese-garden': 'Place the character in a traditional Japanese garden with carefully arranged plants, stones, water features, and zen atmosphere.',
      'station': 'Place the character at a train or subway station with platform, tracks, and transportation atmosphere.',
    };

    // 基本プロンプトを構築
    let basePrompt = locationPrompts[location] ||
      `Place the character in this location: ${location}. Keep the character's appearance, face, and features identical. Only change the background.`;

    // 時間帯の指定があれば追加
    if (timeOfDay) {
      const timeDescriptions: Record<string, string> = {
        morning: 'soft morning light, warm golden glow',
        afternoon: 'bright afternoon sunlight, clear visibility',
        evening: 'beautiful sunset colors, warm orange and pink tones',
        night: 'nighttime atmosphere, soft artificial lighting or moonlight',
      };
      basePrompt += ` ${timeDescriptions[timeOfDay]}.`;
    }

    // 天気の指定があれば追加
    if (weather) {
      const weatherDescriptions: Record<string, string> = {
        sunny: 'sunny weather, clear sky, bright atmosphere',
        cloudy: 'cloudy sky, diffused lighting, overcast atmosphere',
        rainy: 'rainy weather, wet surfaces, rain effects',
        snowy: 'snowy weather, snow covering, winter atmosphere',
      };
      basePrompt += ` ${weatherDescriptions[weather]}.`;
    }

    // カスタムプロンプトを追加
    const finalPrompt = customPrompt
      ? `${basePrompt} ${customPrompt}`
      : basePrompt;

    return this.generate({
      prompt: finalPrompt,
      imageUrl: sourceImageUrl,
      size: '1k', // seedream-4-0は1k, 2k, 4kのみサポート
      strength: 0.5, // キャラクターを保持しつつ背景を変更
      watermark: false,
    });
  }

  /**
   * キャラクターの服装を変更（最適化されたプロンプト）
   */
  async changeOutfit(params: {
    sourceImageUrl: string;
    outfit: string;
    style?: 'casual' | 'formal' | 'sporty' | 'elegant' | 'cute' | 'cool'; // スタイル
    color?: string; // 主要な色
    accessories?: string; // アクセサリー追加
    customPrompt?: string;
  }): Promise<I2IResponse> {
    const { sourceImageUrl, outfit, style, color, accessories, customPrompt } = params;

    // 最適化された服装変更プロンプト
    const outfitPrompts: Record<string, string> = {
      'school-uniform': 'Change the outfit to a school uniform with blazer, shirt, and skirt or pants. Clean and neat appearance. Keep face and body identical.',
      'business-suit': 'Transform the outfit to a professional business suit with jacket and formal attire. Sharp and sophisticated look. Preserve facial features.',
      'casual-wear': 'Change to casual everyday wear with comfortable clothing like t-shirt and jeans or casual dress. Relaxed and natural style. Keep face the same.',
      'dress': 'Transform into an elegant dress, flowing and graceful. Beautiful and refined appearance. Maintain facial identity.',
      'sportswear': 'Change to athletic sportswear with appropriate sports clothing and shoes. Active and dynamic look. Keep face identical.',
      'kimono': 'Transform into traditional Japanese kimono with beautiful patterns and obi belt. Elegant traditional appearance. Preserve facial features.',
      'swimsuit': 'Change to a swimsuit appropriate for beach or pool. Summer beach wear. Keep face and body proportions the same.',
      'pajamas': 'Transform into comfortable pajamas or sleepwear. Cozy and relaxed nighttime attire. Maintain facial features.',
      'winter-coat': 'Change to warm winter clothing with coat, scarf, and winter accessories. Cold weather outfit. Keep face identical.',
      'party-dress': 'Transform into glamorous party or evening dress. Fancy and festive appearance. Preserve facial identity.',
      'hoodie': 'Change to comfortable hoodie and casual pants. Modern street style. Keep face the same.',
      'maid-outfit': 'Transform into maid outfit with apron and accessories. Classic maid costume style. Maintain facial features.',
      'nurse-uniform': 'Change to medical nurse uniform with white or colored scrubs. Professional healthcare attire. Keep face identical.',
      'chef-uniform': 'Transform into chef uniform with white coat and hat. Professional culinary appearance. Preserve facial features.',
      'wedding-dress': 'Change to beautiful wedding dress, white and elegant. Bridal gown appearance. Keep face the same.',
    };

    // 基本プロンプトを構築
    let basePrompt = outfitPrompts[outfit] ||
      `Change the character's outfit to: ${outfit}. Keep the face, facial features, hairstyle, and body proportions identical. Only change the clothing.`;

    // スタイルの指定があれば追加
    if (style) {
      const styleDescriptions: Record<string, string> = {
        casual: 'casual and relaxed style',
        formal: 'formal and sophisticated style',
        sporty: 'sporty and athletic style',
        elegant: 'elegant and graceful style',
        cute: 'cute and adorable style',
        cool: 'cool and stylish style',
      };
      basePrompt += ` ${styleDescriptions[style]}.`;
    }

    // 色の指定があれば追加
    if (color) {
      basePrompt += ` Primary color: ${color}.`;
    }

    // アクセサリーの指定があれば追加
    if (accessories) {
      basePrompt += ` Add accessories: ${accessories}.`;
    }

    // カスタムプロンプトを追加
    const finalPrompt = customPrompt
      ? `${basePrompt} ${customPrompt}`
      : basePrompt;

    return this.generate({
      prompt: finalPrompt,
      imageUrl: sourceImageUrl,
      size: '1k', // seedream-4-0は1k, 2k, 4kのみサポート
      strength: 0.65, // 顔と体型を保持しつつ服装を変更
      watermark: false,
    });
  }
}

// Singleton instance
export const bytePlusI2I = new BytePlusI2I();
