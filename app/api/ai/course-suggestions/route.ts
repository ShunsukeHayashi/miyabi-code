/**
 * API Route: Generate AI-powered course suggestions
 * POST /api/ai/course-suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { geminiService } from '@/lib/ai/gemini-service';
import { authenticateRequest } from '@/lib/auth/middleware';

const suggestionSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  targetAudience: z.string().optional(),
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
    const validatedData = suggestionSchema.parse(body);

    // Generate course suggestions using Gemini
    const suggestions = await geminiService.generateCourseSuggestions(
      validatedData.topic,
      validatedData.targetAudience
    );

    return NextResponse.json({
      success: true,
      data: suggestions,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.issues
        },
        { status: 400 }
      );
    }

    console.error('Error generating course suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate course suggestions' },
      { status: 500 }
    );
  }
}