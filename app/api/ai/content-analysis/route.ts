/**
 * API Route: Analyze content with AI
 * POST /api/ai/content-analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { geminiService } from '@/lib/ai/gemini-service';
import { authenticateRequest } from '@/lib/auth/middleware';

const analysisSchema = z.object({
  content: z.string().min(10, 'Content must be at least 10 characters'),
  targetLevel: z.enum(['beginner', 'intermediate', 'advanced']),
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
    const validatedData = analysisSchema.parse(body);

    // Analyze content using Gemini
    const analysis = await geminiService.analyzeContent(
      validatedData.content,
      validatedData.targetLevel
    );

    return NextResponse.json({
      success: true,
      data: analysis,
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

    console.error('Error analyzing content:', error);
    return NextResponse.json(
      { error: 'Failed to analyze content' },
      { status: 500 }
    );
  }
}