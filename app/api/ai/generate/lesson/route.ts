/**
 * Lesson Generation API Endpoint
 * Phase 2.1 AI Generative Content Engine
 *
 * POST /api/ai/generate/lesson
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { geminiClient, GeminiContentRequest } from '@/lib/ai/gemini/client';

// Request validation schema
const LessonGenerationRequestSchema = z.object({
  topic: z.string().min(1).max(500),
  targetAudience: z.object({
    level: z.enum(['beginner', 'intermediate', 'advanced']),
    age: z.number().int().min(5).max(99),
    background: z.string().max(200),
    learningGoals: z.array(z.string()).max(10)
  }),
  generationConfig: z.object({
    language: z.enum(['ja', 'en', 'zh', 'ko', 'es']),
    tone: z.enum(['formal', 'casual', 'academic', 'conversational']),
    length: z.enum(['short', 'medium', 'long']),
    includeExamples: z.boolean(),
    interactivityLevel: z.number().int().min(1).max(5)
  }),
  qualityConstraints: z.object({
    readabilityScore: z.number().min(0).max(100),
    factualAccuracy: z.boolean(),
    plagiarismCheck: z.boolean(),
    biasDetection: z.boolean()
  })
});

// API Response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    requestId: string;
    timestamp: string;
    processingTime: number;
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = LessonGenerationRequestSchema.parse(body);

    // Create Gemini request
    const geminiRequest: GeminiContentRequest = {
      contentType: 'lesson-content',
      topic: validatedData.topic,
      targetAudience: validatedData.targetAudience,
      generationConfig: validatedData.generationConfig,
      qualityConstraints: validatedData.qualityConstraints
    };

    // Generate lesson content
    const result = await geminiClient.instance.generateLesson(geminiRequest);

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    // Return successful response
    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime
      }
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    const processingTime = Date.now() - startTime;

    // Handle validation errors
    if (error instanceof z.ZodError) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request parameters',
          details: error.errors
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime
        }
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Handle Gemini errors
    if (error && typeof error === 'object' && 'code' in error) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          processingTime
        }
      };

      const statusCode = error.code === 'API_LIMIT' ? 429 :
                        error.code === 'INVALID_REQUEST' ? 400 :
                        error.code === 'SAFETY_FILTER' ? 422 : 500;

      return NextResponse.json(response, { status: statusCode });
    }

    // Handle unexpected errors
    console.error('Lesson generation error:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred during lesson generation'
      },
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        processingTime
      }
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// GET method for health check
export async function GET() {
  return NextResponse.json({
    service: 'AI Lesson Generation',
    status: 'healthy',
    version: '2.1.0',
    endpoints: {
      POST: '/api/ai/generate/lesson'
    }
  });
}