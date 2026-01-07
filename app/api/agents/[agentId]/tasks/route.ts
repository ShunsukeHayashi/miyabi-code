/**
 * Agent Tasks API Endpoint
 * GET /api/agents/[agentId]/tasks - List tasks for an agent
 * POST /api/agents/[agentId]/tasks - Create a new task (manual trigger)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import type { AgentTask } from '../../../../../lib/github-app/agent-types';

const prisma = new PrismaClient();

async function getSessionUser() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('miyabi-session');

  if (!sessionCookie) {
    return null;
  }

  try {
    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value.split('.')[0], 'base64').toString()
    );
    return sessionData;
  } catch {
    return null;
  }
}

interface RouteParams {
  params: {
    agentId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const requestId = crypto.randomUUID();
  const { agentId } = params;

  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    const agents = await prisma.$queryRaw<any[]>`
      SELECT id FROM agents WHERE id = ${agentId} AND user_id = ${user.id} LIMIT 1
    `;

    if (agents.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Agent not found', code: 'NOT_FOUND' },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let whereClause = `WHERE agent_id = '${agentId}'`;
    if (status && status !== 'all') {
      whereClause += ` AND status = '${status}'`;
    }

    const tasks = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM agent_tasks
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    const countResult = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*) as count FROM agent_tasks ${whereClause}
    `);

    const formattedTasks: AgentTask[] = tasks.map((task) => ({
      id: task.id,
      agentId: task.agent_id,
      type: task.type,
      status: task.status,
      triggerEvent: JSON.parse(task.trigger_event || '{}'),
      result: task.result ? JSON.parse(task.result) : undefined,
      error: task.error ? JSON.parse(task.error) : undefined,
      createdAt: new Date(task.created_at),
      startedAt: task.started_at ? new Date(task.started_at) : undefined,
      completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
    }));

    return NextResponse.json(
      {
        success: true,
        data: formattedTasks,
        meta: {
          total: parseInt(countResult[0]?.count || '0', 10),
          limit,
          offset,
          hasMore: offset + limit < parseInt(countResult[0]?.count || '0', 10),
        },
      },
      {
        status: 200,
        headers: {
          'X-Request-ID': requestId,
          'Cache-Control': 'private, max-age=10',
        },
      }
    );
  } catch (error) {
    console.error('[Agent Tasks API] Error fetching tasks:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks', code: 'FETCH_ERROR' },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const requestId = crypto.randomUUID();
  const { agentId } = params;

  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    const agents = await prisma.$queryRaw<any[]>`
      SELECT * FROM agents WHERE id = ${agentId} AND user_id = ${user.id} LIMIT 1
    `;

    if (agents.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Agent not found', code: 'NOT_FOUND' },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    const agent = agents[0];
    const triggers = JSON.parse(agent.triggers || '[]');

    if (!triggers.includes('manual')) {
      return NextResponse.json(
        {
          success: false,
          error: 'This agent does not support manual triggers',
          code: 'TRIGGER_NOT_ALLOWED',
        },
        { status: 403, headers: { 'X-Request-ID': requestId } }
      );
    }

    const body = await request.json();
    const { type, repository, issueNumber, prNumber, ref } = body;

    if (!type || !repository) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          code: 'VALIDATION_ERROR',
          details: { required: ['type', 'repository'] },
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const validTypes = ['issue_analysis', 'code_review', 'pr_comment', 'documentation', 'test_generation'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid task type',
          code: 'VALIDATION_ERROR',
          details: { validTypes },
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const taskId = crypto.randomUUID();
    const now = new Date();

    const triggerEvent = {
      type: 'manual',
      repository,
      issueNumber,
      prNumber,
      ref,
    };

    await prisma.$executeRaw`
      INSERT INTO agent_tasks (
        id, agent_id, type, status, trigger_event, created_at
      ) VALUES (
        ${taskId},
        ${agentId},
        ${type},
        'pending',
        ${JSON.stringify(triggerEvent)},
        ${now}
      )
    `;

    const stats = JSON.parse(agent.stats || '{}');
    stats.tasksInProgress = (stats.tasksInProgress || 0) + 1;

    await prisma.$executeRaw`
      UPDATE agents
      SET
        status = 'active',
        stats = ${JSON.stringify(stats)},
        last_active_at = ${now},
        updated_at = ${now}
      WHERE id = ${agentId}
    `;

    const newTask: AgentTask = {
      id: taskId,
      agentId,
      type,
      status: 'pending',
      triggerEvent,
      createdAt: now,
    };

    console.log('[Agent Tasks API] Created manual task:', {
      taskId,
      agentId,
      type,
      repository,
    });

    return NextResponse.json(
      {
        success: true,
        data: newTask,
        message: 'Task created successfully',
      },
      {
        status: 201,
        headers: {
          'X-Request-ID': requestId,
          'Location': `/api/agents/${agentId}/tasks/${taskId}`,
        },
      }
    );
  } catch (error) {
    console.error('[Agent Tasks API] Error creating task:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to create task', code: 'CREATE_ERROR' },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

export const dynamic = 'force-dynamic';
