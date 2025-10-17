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
 */
router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const characters = await prisma.character.findMany({
        where: { userId: req.user!.userId },
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
 */
router.get(
  '/:id',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const character = await prisma.character.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.userId,
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
 * キャラクター画像生成
 */
router.post(
  '/:id/generate-image',
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

      // Build appearance description
      const appearance = `${character.hairColor} ${character.hairStyle} hair, ${character.eyeColor} eyes, ${character.skinTone} skin, ${character.height}, ${character.bodyType} body type, wearing ${character.outfit}`;

      // Generate primary image
      const result = await bytePlusT2I.generateCharacter({
        appearance,
        style: character.appearanceStyle,
        expression: 'neutral',
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
        message: 'Character image generated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/characters/:id/generate-expression
 * 表情画像生成（カスタムプロンプト対応）
 */
router.post(
  '/:id/generate-expression',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { expression, customPrompt } = req.body;

      if (!expression) {
        throw new AppError('Expression is required', 400);
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
