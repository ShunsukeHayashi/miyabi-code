/**
 * API Route: Get adaptive content based on learner profile
 * POST /api/learning/adapt-content
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adaptiveLearningEngine } from '@/lib/learning/adaptive-engine';
import { authenticateRequest } from '@/lib/auth/middleware';

const adaptContentSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  topicId: z.string().min(1, 'Topic ID is required'),
  lessonId: z.string().optional(),
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
    const validatedData = adaptContentSchema.parse(body);

    // Adapt content based on learner profile
    const adaptedContent = await adaptiveLearningEngine.adaptContent(
      validatedData.content,
      userId,
      validatedData.topicId
    );

    return NextResponse.json({
      success: true,
      data: adaptedContent,
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

    console.error('Error adapting content:', error);
    return NextResponse.json(
      { error: 'Failed to adapt content' },
      { status: 500 }
    );
  }
}