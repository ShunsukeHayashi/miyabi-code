/**
 * Agents API Endpoint
 * GET /api/agents - List all agents for the authenticated user
 * POST /api/agents - Create a new agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import type { Agent, AgentConfig, AgentStats, AgentRole, AgentTrigger } from '../../../lib/github-app/agent-types';

const prisma = new PrismaClient();

async function getSessionUser(request: NextRequest) {
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

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const user = await getSessionUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const role = searchParams.get('role');
    const repositoryId = searchParams.get('repositoryId');

    let whereClause = `WHERE user_id = '${user.id}'`;

    if (status && status !== 'all') {
      whereClause += ` AND status = '${status}'`;
    }
    if (role && role !== 'all') {
      whereClause += ` AND role = '${role}'`;
    }

    const agents = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM agents ${whereClause} ORDER BY created_at DESC
    `);

    const formattedAgents: Agent[] = agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      role: agent.role as AgentRole,
      status: agent.status,
      installationId: agent.installation_id,
      repositories: JSON.parse(agent.repositories || '[]'),
      triggers: JSON.parse(agent.triggers || '[]') as AgentTrigger[],
      customPrompt: agent.custom_prompt,
      config: JSON.parse(agent.config || '{}') as AgentConfig,
      stats: JSON.parse(agent.stats || '{}') as AgentStats,
      createdAt: new Date(agent.created_at),
      updatedAt: new Date(agent.updated_at),
      lastActiveAt: agent.last_active_at ? new Date(agent.last_active_at) : undefined,
    }));

    return NextResponse.json(
      {
        success: true,
        data: formattedAgents,
        meta: {
          total: formattedAgents.length,
          active: formattedAgents.filter((a) => a.status === 'active').length,
        },
      },
      {
        status: 200,
        headers: {
          'X-Request-ID': requestId,
          'Cache-Control': 'private, max-age=60',
        },
      }
    );
  } catch (error) {
    console.error('[Agents API] Error fetching agents:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch agents', code: 'FETCH_ERROR' },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const user = await getSessionUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401, headers: { 'X-Request-ID': requestId } }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      role,
      installationId,
      repositories,
      triggers,
      customPrompt,
      config,
    } = body;

    if (!name || !role || !installationId || !repositories?.length || !triggers?.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          code: 'VALIDATION_ERROR',
          details: {
            required: ['name', 'role', 'installationId', 'repositories', 'triggers'],
          },
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const validRoles: AgentRole[] = [
      'code-reviewer',
      'issue-analyzer',
      'pr-assistant',
      'documentation',
      'testing',
      'security-auditor',
      'performance-optimizer',
      'dependency-updater',
      'custom',
    ];

    if (!validRoles.includes(role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid agent role',
          code: 'VALIDATION_ERROR',
          details: { validRoles },
        },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    const agentId = crypto.randomUUID();
    const now = new Date();

    const defaultConfig: AgentConfig = {
      autoApprove: false,
      maxConcurrentTasks: 5,
      responseTimeout: 60000,
      retryAttempts: 3,
      ...config,
    };

    const defaultStats: AgentStats = {
      tasksCompleted: 0,
      tasksInProgress: 0,
      tasksFailed: 0,
      avgResponseTime: 0,
      successRate: 100,
    };

    await prisma.$executeRaw`
      INSERT INTO agents (
        id, user_id, name, description, role, status,
        installation_id, repositories, triggers, custom_prompt,
        config, stats, created_at, updated_at
      ) VALUES (
        ${agentId},
        ${user.id},
        ${name},
        ${description || ''},
        ${role},
        'idle',
        ${installationId},
        ${JSON.stringify(repositories)},
        ${JSON.stringify(triggers)},
        ${customPrompt || null},
        ${JSON.stringify(defaultConfig)},
        ${JSON.stringify(defaultStats)},
        ${now},
        ${now}
      )
    `;

    const newAgent: Agent = {
      id: agentId,
      name,
      description: description || '',
      role,
      status: 'idle',
      installationId,
      repositories,
      triggers,
      customPrompt,
      config: defaultConfig,
      stats: defaultStats,
      createdAt: now,
      updatedAt: now,
    };

    console.log('[Agents API] Created agent:', {
      agentId,
      userId: user.id,
      name,
      role,
    });

    return NextResponse.json(
      {
        success: true,
        data: newAgent,
        message: 'Agent created successfully',
      },
      {
        status: 201,
        headers: {
          'X-Request-ID': requestId,
          'Location': `/api/agents/${agentId}`,
        },
      }
    );
  } catch (error) {
    console.error('[Agents API] Error creating agent:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to create agent', code: 'CREATE_ERROR' },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

export const dynamic = 'force-dynamic';
