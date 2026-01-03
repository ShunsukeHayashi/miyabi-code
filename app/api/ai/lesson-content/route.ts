/**
 * API Route: Generate AI-powered lesson content
 * POST /api/ai/lesson-content
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { geminiService } from '@/lib/ai/gemini-service';
import { authenticateRequest } from '@/lib/auth/middleware';

const lessonSchema = z.object({
  courseTitle: z.string().min(1, 'Course title is required'),
  lessonTopic: z.string().min(1, 'Lesson topic is required'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  duration: z.number().min(5).max(120, 'Duration must be between 5 and 120 minutes'),
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = lessonSchema.parse(body);

    // Generate lesson content using Gemini
    const lessonContent = await geminiService.generateLessonContent(
      validatedData.courseTitle,
      validatedData.lessonTopic,
      validatedData.difficulty,
      validatedData.duration
    );

    return NextResponse.json({
      success: true,
      data: lessonContent,
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

    console.error('Error generating lesson content:', error);
    return NextResponse.json(
      { error: 'Failed to generate lesson content' },
      { status: 500 }
    );
  }
}