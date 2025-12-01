/**
 * GET /api/v1/tasks/[taskId] - Get task status
 * DELETE /api/v1/tasks/[taskId] - Cancel task
 * 
 * Issue #1214: タスクステータス確認・キャンセル
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getTask,
  cancelTask,
  authenticateRequest,
  setRateLimitHeaders,
  validateTaskId,
} from '@/lib/task';

// CORS headers for ChatGPT Actions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Requested-With, Accept, Origin, openai-conversation-id, openai-ephemeral-user-id',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

/**
 * Helper to add CORS headers to response
 */
function withCors(response: NextResponse): NextResponse {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

interface Params {
  params: {
    taskId: string;
  };
}

/**
 * GET /api/v1/tasks/[taskId]
 * Get task status
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { taskId } = params;

    // 認証
    const auth = await authenticateRequest(request, 'task:read');
    if (!auth.success) {
      return withCors(NextResponse.json(
        { error: auth.error },
        { status: auth.error?.code === 'RATE_LIMIT_EXCEEDED' ? 429 : 401 }
      ));
    }

    // Task IDバリデーション
    const validation = validateTaskId(taskId);
    if (!validation.valid) {
      return withCors(NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid task ID',
            details: validation.errors,
          },
        },
        { status: 400 }
      ));
    }

    // タスクを取得
    const task = await getTask(taskId);
    if (!task) {
      return withCors(NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: `Task ${taskId} not found`,
          },
        },
        { status: 404 }
      ));
    }

    // レスポンス
    const response = NextResponse.json(task);

    // Rate Limitヘッダー
    if (auth.rateLimit) {
      setRateLimitHeaders(response.headers, auth.rateLimit);
    }

    return withCors(response);
  } catch (error) {
    console.error(`[GET /api/v1/tasks/${params.taskId}] Error:`, error);
    return withCors(NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    ));
  }
}

/**
 * DELETE /api/v1/tasks/[taskId]
 * Cancel task
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { taskId } = params;

    // 認証
    const auth = await authenticateRequest(request, 'task:cancel');
    if (!auth.success) {
      return withCors(NextResponse.json(
        { error: auth.error },
        { status: auth.error?.code === 'RATE_LIMIT_EXCEEDED' ? 429 : 401 }
      ));
    }

    // Task IDバリデーション
    const validation = validateTaskId(taskId);
    if (!validation.valid) {
      return withCors(NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid task ID',
            details: validation.errors,
          },
        },
        { status: 400 }
      ));
    }

    // タスクをキャンセル
    const task = await cancelTask(taskId);
    if (!task) {
      return withCors(NextResponse.json(
        {
          error: {
            code: 'CANCEL_FAILED',
            message: `Task ${taskId} not found or cannot be cancelled`,
          },
        },
        { status: 404 }
      ));
    }

    // レスポンス
    const response = NextResponse.json({
      message: 'Task cancelled successfully',
      task,
    });

    // Rate Limitヘッダー
    if (auth.rateLimit) {
      setRateLimitHeaders(response.headers, auth.rateLimit);
    }

    return withCors(response);
  } catch (error) {
    console.error(`[DELETE /api/v1/tasks/${params.taskId}] Error:`, error);
    return withCors(NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    ));
  }
}

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
