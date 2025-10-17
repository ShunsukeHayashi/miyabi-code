/**
 * Character Management Routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/db.js';
import { AppError } from '../middleware/error-handler.js';
import { requireAuth } from '../middleware/auth.js';
import { bytePlusT2I } from '../services/byteplus/t2i.js';
import { bytePlusI2I } from '../services/byteplus/i2i.js';
import { characterGeneratorService } from '../services/ai/character-generator.js';
import { imageAnalyzerService } from '../services/ai/image-analyzer.js';
import { saveImage } from '../utils/image-storage.js';

const router = Router();

// Validation schemas
const createCharacterSchema = z.object({
  name: z.string().min(1).max(50),
  age: z.number().min(18).max(100),
  occupation: z.string(),
  hobbies: z.string(),
  favoriteFood: z.string(),
  birthday: z.string().datetime(),
  bio: z.string(),
  // Appearance
  appearanceStyle: z.enum(['realistic', 'anime', 'manga']),
  hairColor: z.string(),
  hairStyle: z.string(),
  eyeColor: z.string(),
  skinTone: z.string(),
  height: z.string(),
  bodyType: z.string(),
  outfit: z.string(),
  accessories: z.string(),
  customPrompt: z.string().optional(),
  // Personality
  personalityArchetype: z.string(),
  traits: z.string(),
  speechStyle: z.string(),
  emotionalTendency: z.string(),
  interests: z.string(),
  values: z.string(),
  // Voice
  voiceId: z.string().optional(),
  voicePitch: z.number().optional(),
  voiceSpeed: z.number().optional(),
  voiceStyle: z.string().optional(),
});

const generateCharacterDetailsSchema = z.object({
  name: z.string().min(1).max(50),
  age: z.number().min(18).max(100),
  description: z.string().min(10).max(500),
});

const generateFromImageSchema = z.object({
  imageData: z.string().min(1), // Base64 encoded image
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']).optional().default('image/jpeg'),
  name: z.string().min(1).max(50).optional(),
  age: z.number().min(18).max(100).optional(),
  description: z.string().max(500).optional(),
});

/**
 * POST /api/characters/generate-details
 * AI自動生成でキャラクター詳細を生成
 */
router.post(
  '/generate-details',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = generateCharacterDetailsSchema.parse(req.body);

      // Generate character details with Claude
      const generatedDetails = await characterGeneratorService.generateCharacterDetails({
        name: body.name,
        age: body.age,
        description: body.description,
      });

      // Generate a random birthday for the current age
      const today = new Date();
      const birthYear = today.getFullYear() - body.age;
      const birthMonth = Math.floor(Math.random() * 12);
      const birthDay = Math.floor(Math.random() * 28) + 1;
      const birthday = new Date(birthYear, birthMonth, birthDay);

      // Create character with generated details
      const character = await prisma.character.create({
        data: {
          userId: req.user!.userId,
          name: body.name,
          age: body.age,
          birthday,
          // Generated fields
          occupation: generatedDetails.occupation,
          hobbies: generatedDetails.hobbies,
          favoriteFood: generatedDetails.favoriteFood,
          bio: generatedDetails.bio,
          // Appearance
          appearanceStyle: generatedDetails.appearanceStyle,
          hairColor: generatedDetails.hairColor,
          hairStyle: generatedDetails.hairStyle,
          eyeColor: generatedDetails.eyeColor,
          skinTone: generatedDetails.skinTone,
          height: generatedDetails.height,
          bodyType: generatedDetails.bodyType,
          outfit: generatedDetails.outfit,
          accessories: generatedDetails.accessories,
          customPrompt: generatedDetails.customPrompt,
          // Personality
          personalityArchetype: generatedDetails.personalityArchetype,
          traits: generatedDetails.traits,
          speechStyle: generatedDetails.speechStyle,
          emotionalTendency: generatedDetails.emotionalTendency,
          interests: generatedDetails.interests,
          values: generatedDetails.values,
          // Voice
          voiceId: generatedDetails.voiceId,
          voicePitch: generatedDetails.voicePitch,
          voiceSpeed: generatedDetails.voiceSpeed,
          voiceStyle: generatedDetails.voiceStyle,
        },
      });

      // Create initial stage progress
      await prisma.stageProgress.create({
        data: {
          characterId: character.id,
          userId: req.user!.userId,
          currentStage: 'first_meet',
          affection: 0,
          unlockedStages: 'first_meet',
          completedEvents: '',
        },
      });

      res.status(201).json({
        character,
        generatedDetails: true,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError('Invalid input', 400));
      }
      next(error);
    }
  }
);

/**
 * POST /api/characters/generate-from-image
 * 画像からキャラクター生成
 * TODO: 本番環境では requireAuth を有効化すること
 */
router.post(
  '/generate-from-image',
  // requireAuth, // 開発中は一時的にコメントアウト
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = generateFromImageSchema.parse(req.body);

      // TODO: 開発中は固定ユーザーID、本番環境では req.user!.userId を使用
      const userId = req.user?.userId || 'dev-user-001';

      // Save image to local filesystem FIRST
      const savedImage = await saveImage({
        userId,
        imageType: 'source',
        base64Data: body.imageData,
        mimeType: body.mimeType,
      });

      // Analyze image with Claude Vision
      const { appearance, profile } = await imageAnalyzerService.generateCharacterFromImage(
        body.imageData,
        body.mimeType,
        {
          name: body.name,
          age: body.age,
          description: body.description,
        }
      );

      // Use provided values or defaults from analysis
      const finalName = body.name || appearance.suggestedName;
      const finalAge = body.age || appearance.estimatedAge;

      // Generate a random birthday for the age
      const today = new Date();
      const birthYear = today.getFullYear() - finalAge;
      const birthMonth = Math.floor(Math.random() * 12);
      const birthDay = Math.floor(Math.random() * 28) + 1;
      const birthday = new Date(birthYear, birthMonth, birthDay);

      // Create character with analyzed appearance and generated profile
      const character = await prisma.character.create({
        data: {
          userId,
          name: finalName,
          age: finalAge,
          birthday,
          // Profile from AI generation
          occupation: profile.occupation,
          hobbies: profile.hobbies,
          favoriteFood: profile.favoriteFood,
          bio: profile.bio,
          // Appearance from image analysis
          appearanceStyle: appearance.appearanceStyle,
          hairColor: appearance.hairColor,
          hairStyle: appearance.hairStyle,
          eyeColor: appearance.eyeColor,
          skinTone: appearance.skinTone,
          height: appearance.estimatedHeight,
          bodyType: appearance.bodyType,
          outfit: appearance.outfit,
          accessories: appearance.accessories,
          customPrompt: appearance.customPrompt,
          // Personality from profile generation
          personalityArchetype: profile.personalityArchetype,
          traits: profile.traits,
          speechStyle: profile.speechStyle,
          emotionalTendency: profile.emotionalTendency,
          interests: profile.interests,
          values: profile.values,
          // Voice settings from profile
          voiceId: profile.voiceId,
          voicePitch: profile.voicePitch,
          voiceSpeed: profile.voiceSpeed,
          voiceStyle: profile.voiceStyle,
          // Saved image path
          sourceImagePath: savedImage.relativePath,
        },
      });

      // Create initial stage progress
      await prisma.stageProgress.create({
        data: {
          characterId: character.id,
          userId,
          currentStage: 'first_meet',
          affection: 0,
          unlockedStages: 'first_meet',
          completedEvents: '',
        },
      });

      res.status(201).json({
        character,
        generatedFromImage: true,
        savedImagePath: savedImage.relativePath,
        analysis: {
          appearance,
          personality: appearance.estimatedPersonality,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError('Invalid input', 400));
      }
      next(error);
    }
  }
);

/**
 * POST /api/characters
 * キャラクター作成
 */
router.post(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = createCharacterSchema.parse(req.body);

      const character = await prisma.character.create({
        data: {
          userId: req.user!.userId,
          name: body.name,
          age: body.age,
          occupation: body.occupation,
          hobbies: body.hobbies,
          favoriteFood: body.favoriteFood,
          birthday: new Date(body.birthday),
          bio: body.bio,
          // Appearance
          appearanceStyle: body.appearanceStyle,
          hairColor: body.hairColor,
          hairStyle: body.hairStyle,
          eyeColor: body.eyeColor,
          skinTone: body.skinTone,
          height: body.height,
          bodyType: body.bodyType,
          outfit: body.outfit,
          accessories: body.accessories,
          customPrompt: body.customPrompt,
          // Personality
          personalityArchetype: body.personalityArchetype,
          traits: body.traits,
          speechStyle: body.speechStyle,
          emotionalTendency: body.emotionalTendency,
          interests: body.interests,
          values: body.values,
          // Voice
          voiceId: body.voiceId || 'Puck',
          voicePitch: body.voicePitch || 0,
          voiceSpeed: body.voiceSpeed || 1.0,
          voiceStyle: body.voiceStyle || 'normal',
        },
      });

      // Create initial stage progress
      await prisma.stageProgress.create({
        data: {
          characterId: character.id,
          userId: req.user!.userId,
          currentStage: 'first_meet',
          affection: 0,
          unlockedStages: 'first_meet',
          completedEvents: '',
        },
      });

      res.status(201).json({ character });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError('Invalid input', 400));
      }
      next(error);
    }
  }
);

/**
 * GET /api/characters
 * キャラクター一覧取得
 * TODO: 本番環境では requireAuth を有効化すること
 */
router.get(
  '/',
  // requireAuth, // 開発中は一時的にコメントアウト
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // TODO: 開発中は固定ユーザーID、本番環境では req.user!.userId を使用
      const userId = req.user?.userId || 'dev-user-001';

      const characters = await prisma.character.findMany({
        where: { userId: userId },
        include: {
          stageProgress: true,
        },
        orderBy: { lastInteraction: 'desc' },
      });

      res.json({ characters });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/characters/:id
 * キャラクター詳細取得
 * TODO: 本番環境では requireAuth を有効化すること
 */
router.get(
  '/:id',
  // requireAuth, // 開発中は一時的にコメントアウト
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // TODO: 開発中は固定ユーザーID、本番環境では req.user!.userId を使用
      const userId = req.user?.userId || 'dev-user-001';

      const character = await prisma.character.findFirst({
        where: {
          id: req.params.id,
          userId: userId,
        },
        include: {
          stageProgress: true,
        },
      });

      if (!character) {
        throw new AppError('Character not found', 404);
      }

      res.json({ character });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/characters/:id/generate-image
 * キャラクター画像生成（リファレンス画像ベース I2I）
 * TODO: 本番環境では requireAuth を有効化すること
 */
router.post(
  '/:id/generate-image',
  // requireAuth, // 開発中は一時的にコメントアウト
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // TODO: 開発中は固定ユーザーID、本番環境では req.user!.userId を使用
      const userId = req.user?.userId || 'dev-user-001';

      const character = await prisma.character.findFirst({
        where: {
          id: req.params.id,
          userId: userId,
        },
      });

      if (!character) {
        throw new AppError('Character not found', 404);
      }

      // Check if source image exists
      if (!character.sourceImagePath) {
        throw new AppError(
          'Source image not found. Please upload a reference image first.',
          400
        );
      }

      // Convert local file path to full URL for BytePlus API
      // Read the local image file as base64
      const fs = await import('fs/promises');
      const path = await import('path');
      const fullPath = path.resolve(character.sourceImagePath);
      const imageBuffer = await fs.readFile(fullPath);
      const base64Image = imageBuffer.toString('base64');

      // Determine MIME type from file extension
      const ext = path.extname(fullPath).toLowerCase();
      const mimeTypeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
      };
      const mimeType = mimeTypeMap[ext] || 'image/jpeg';

      // Build prompt for image generation
      const prompt = `High quality ${character.appearanceStyle} style portrait.
${character.hairColor} ${character.hairStyle} hair, ${character.eyeColor} eyes, ${character.skinTone} skin tone.
${character.height}, ${character.bodyType} body type, wearing ${character.outfit}.
${character.accessories ? `Accessories: ${character.accessories}.` : ''}
Neutral expression, professional quality, detailed.`;

      // Generate image using I2I (Image-to-Image) from reference
      const result = await bytePlusI2I.generate({
        prompt,
        imageData: base64Image,
        mimeType,
        strength: 0.7, // Preserve 30% of original image
        size: '1024x1024',
        watermark: false,
      });

      // Update character with image URL
      await prisma.character.update({
        where: { id: character.id },
        data: {
          primaryImageUrl: result.imageUrl,
          imagesGenerated: true,
          lastGeneratedAt: new Date(),
        },
      });

      res.json({
        imageUrl: result.imageUrl,
        message: 'Character image generated from reference successfully',
        usedReferenceImage: true,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/characters/:id/generate-expression
 * 表情画像生成（カスタムプロンプト対応）
 * TODO: 本番環境では requireAuth を有効化すること
 */
router.post(
  '/:id/generate-expression',
  // requireAuth, // 開発中は一時的にコメントアウト
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { expression, customPrompt } = req.body;

      if (!expression) {
        throw new AppError('Expression is required', 400);
      }

      // TODO: 開発中は固定ユーザーID、本番環境では req.user!.userId を使用
      const userId = req.user?.userId || 'dev-user-001';

      const character = await prisma.character.findFirst({
        where: {
          id: req.params.id,
          userId: userId,
        },
      });

      if (!character) {
        throw new AppError('Character not found', 404);
      }

      if (!character.primaryImageUrl) {
        throw new AppError(
          'Primary image must be generated first',
          400
        );
      }

      // Generate expression variation with optional custom prompt
      const result = await bytePlusI2I.changeExpression({
        sourceImageUrl: character.primaryImageUrl,
        expression,
        customPrompt,
      });

      // Update expression URLs
      const expressionUrls =
        (character.expressionUrls as Record<string, string>) || {};
      expressionUrls[expression] = result.imageUrl;

      await prisma.character.update({
        where: { id: character.id },
        data: {
          expressionUrls,
        },
      });

      res.json({
        expression,
        imageUrl: result.imageUrl,
        message: 'Expression generated successfully',
        usedCustomPrompt: !!customPrompt,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/characters/:id/combine-images
 * 複数画像の組み合わせ（例：表情と服装の合成）
 */
router.post(
  '/:id/combine-images',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sourceImageUrl, prompt, customPrompt } = req.body;

      if (!sourceImageUrl) {
        throw new AppError('Source image URL is required', 400);
      }

      const character = await prisma.character.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.userId,
        },
      });

      if (!character) {
        throw new AppError('Character not found', 404);
      }

      if (!character.primaryImageUrl) {
        throw new AppError(
          'Primary image must be generated first',
          400
        );
      }

      // Build final prompt
      const basePrompt = prompt || 'Combine elements from both images while maintaining character identity.';
      const finalPrompt = customPrompt ? `${basePrompt} ${customPrompt}` : basePrompt;

      // Use I2I service with multiple images
      const result = await bytePlusI2I.generate({
        prompt: finalPrompt,
        imageUrl: [character.primaryImageUrl, sourceImageUrl],
        size: '2k',
        watermark: false,
      });

      res.json({
        imageUrl: result.imageUrl,
        imageUrls: result.imageUrls,
        message: 'Images combined successfully',
        usedMultipleImages: true,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/characters/:id
 * キャラクター削除
 */
router.delete(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const character = await prisma.character.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.userId,
        },
      });

      if (!character) {
        throw new AppError('Character not found', 404);
      }

      await prisma.character.delete({
        where: { id: character.id },
      });

      res.json({ message: 'Character deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
