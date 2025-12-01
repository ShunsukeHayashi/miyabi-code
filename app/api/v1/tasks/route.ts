/**
 * POST /api/v1/tasks - Create a new task
 * GET /api/v1/tasks - List tasks
 * 
 * Issue #1214: ChatGPT UI から Miyabi にタスク指示
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createTask,
  listTasks,
  authenticateRequest,
  setRateLimitHeaders,
  validateTaskRequest,
  TaskRequest,
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

/**
 * POST /api/v1/tasks
 * Create a new task
 */
export async function POST(request: NextRequest) {
  try {
    // 認証
    const auth = await authenticateRequest(request, 'task:create');
    if (!auth.success) {
      return withCors(NextResponse.json(
        { error: auth.error },
        { status: auth.error?.code === 'RATE_LIMIT_EXCEEDED' ? 429 : 401 }
      ));
    }

    // リクエストボディをパース
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return withCors(NextResponse.json(
        {
          error: {
            code: 'INVALID_JSON',
            message: 'Request body must be valid JSON',
          },
        },
        { status: 400 }
      ));
    }

    // バリデーション
    const validation = validateTaskRequest(body);
    if (!validation.valid) {
      return withCors(NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: validation.errors,
          },
        },
        { status: 400 }
      ));
    }

    // タスクを作成
    const taskRequest = body as TaskRequest;
    const taskResponse = await createTask(taskRequest, auth.apiKey!.id);

    // レスポンス
    const response = NextResponse.json(taskResponse, { status: 201 });

    // Rate Limitヘッダー
    if (auth.rateLimit) {
      setRateLimitHeaders(response.headers, auth.rateLimit);
    }

    return withCors(response);
  } catch (error) {
    console.error('[POST /api/v1/tasks] Error:', error);
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
 * GET /api/v1/tasks
 * List tasks
 */
export async function GET(request: NextRequest) {
  try {
    // 認証
    const auth = await authenticateRequest(request, 'task:read');
    if (!auth.success) {
      return withCors(NextResponse.json(
        { error: auth.error },
        { status: auth.error?.code === 'RATE_LIMIT_EXCEEDED' ? 429 : 401 }
      ));
    }

    // クエリパラメータ
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    // タスク一覧を取得
    const tasks = await listTasks(auth.apiKey!.id, Math.min(limit, 100));

    // レスポンス
    const response = NextResponse.json({ tasks, count: tasks.length });

    // Rate Limitヘッダー
    if (auth.rateLimit) {
      setRateLimitHeaders(response.headers, auth.rateLimit);
    }

    return withCors(response);
  } catch (error) {
    console.error('[GET /api/v1/tasks] Error:', error);
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
