/**
 * API Route: AI Chat Assistant for course creation
 * POST /api/ai/chat-assistant
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { geminiService } from '@/lib/ai/gemini-service';
import { authenticateRequest } from '@/lib/auth/middleware';

const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({
      text: z.string()
    }))
  })),
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
    const validatedData = chatSchema.parse(body);

    // Process chat request using Gemini
    const response = await geminiService.chatAssistant(validatedData.messages);

    return NextResponse.json({
      success: true,
      data: {
        response,
        timestamp: new Date().toISOString()
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

    console.error('Error processing chat request:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}