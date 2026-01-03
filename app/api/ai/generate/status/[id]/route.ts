/**
 * Generation Status API Endpoint
 * Phase 2.1 AI Generative Content Engine
 *
 * GET /api/ai/generate/status/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { streamingGenerator } from '@/lib/ai/gemini/streaming';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  metadata: {
    requestId: string;
    timestamp: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = params.id;

  try {
    // Get generation status
    const status = streamingGenerator.getGenerationStatus(requestId);

    if (!status) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Generation with ID ${requestId} not found`
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString()
        }
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Return status
    const response: ApiResponse<typeof status> = {
      success: true,
      data: status,
      metadata: {
        requestId,
        timestamp: new Date().toISOString()
      }
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Status check error:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve generation status'
      },
      metadata: {
        requestId,
        timestamp: new Date().toISOString()
      }
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}