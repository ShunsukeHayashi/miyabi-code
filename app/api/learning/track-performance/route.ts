/**
 * API Route: Track performance and update learner profile
 * POST /api/learning/track-performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adaptiveLearningEngine, PerformanceRecord } from '@/lib/learning/adaptive-engine';
import { authenticateRequest } from '@/lib/auth/middleware';

const performanceSchema = z.object({
  lessonId: z.string().min(1, 'Lesson ID is required'),
  topicId: z.string().min(1, 'Topic ID is required'),
  score: z.number().min(0).max(1, 'Score must be between 0 and 1'),
  timeSpent: z.number().min(0, 'Time spent must be non-negative'),
  attemptsCount: z.number().min(1, 'Attempts count must be at least 1'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = authResult.user.id;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = performanceSchema.parse(body);

    // Create performance record
    const performanceRecord: PerformanceRecord = {
      lessonId: validatedData.lessonId,
      topicId: validatedData.topicId,
      score: validatedData.score,
      timeSpent: validatedData.timeSpent,
      attemptsCount: validatedData.attemptsCount,
      completedAt: new Date(),
      difficulty: validatedData.difficulty,
    };

    // Update learner profile with new performance data
    const updatedProfile = await adaptiveLearningEngine.updateLearnerProfile(
      userId,
      performanceRecord
    );

    // Generate updated recommendations
    const recommendations = await adaptiveLearningEngine.generateRecommendations(userId);

    // Identify knowledge gaps
    const knowledgeGaps = await adaptiveLearningEngine.identifyKnowledgeGaps(userId);

    return NextResponse.json({
      success: true,
      data: {
        profile: updatedProfile,
        recommendations: recommendations.slice(0, 3), // Top 3 recommendations
        knowledgeGaps,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    console.error('Error tracking performance:', error);
    return NextResponse.json(
      { error: 'Failed to track performance' },
      { status: 500 }
    );
  }
}