/**
 * Single Agent API Endpoint
 * GET /api/agents/[agentId] - Get agent details
 * PATCH /api/agents/[agentId] - Update agent
 * DELETE /api/agents/[agentId] - Delete agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import type { Agent, AgentConfig, AgentStats, AgentRole, AgentStatus, AgentTrigger } from '../../../../lib/github-app/agent-types';

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
      SELECT * FROM agents WHERE id = ${agentId} AND user_id = ${user.id} LIMIT 1
    `;

    if (agents.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Agent not found', code: 'NOT_FOUND' },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    const agent = agents[0];
    const formattedAgent: Agent = {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      role: agent.role as AgentRole,
      status: agent.status as AgentStatus,
      installationId: agent.installation_id,
      repositories: JSON.parse(agent.repositories || '[]'),
      triggers: JSON.parse(agent.triggers || '[]') as AgentTrigger[],
      customPrompt: agent.custom_prompt,
      config: JSON.parse(agent.config || '{}') as AgentConfig,
      stats: JSON.parse(agent.stats || '{}') as AgentStats,
      createdAt: new Date(agent.created_at),
      updatedAt: new Date(agent.updated_at),
      lastActiveAt: agent.last_active_at ? new Date(agent.last_active_at) : undefined,
    };

    return NextResponse.json(
      { success: true, data: formattedAgent },
      {
        status: 200,
        headers: {
          'X-Request-ID': requestId,
          'Cache-Control': 'private, max-age=30',
        },
      }
    );
  } catch (error) {
    console.error('[Agent API] Error fetching agent:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch agent', code: 'FETCH_ERROR' },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const existingAgents = await prisma.$queryRaw<any[]>`
      SELECT * FROM agents WHERE id = ${agentId} AND user_id = ${user.id} LIMIT 1
    `;

    if (existingAgents.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Agent not found', code: 'NOT_FOUND' },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    const body = await request.json();
    const allowedFields = [
      'name',
      'description',
      'status',
      'repositories',
      'triggers',
      'customPrompt',
      'config',
    ];

    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update', code: 'VALIDATION_ERROR' },
        { status: 400, headers: { 'X-Request-ID': requestId } }
      );
    }

    if (updates.status) {
      const validStatuses: AgentStatus[] = ['idle', 'active', 'paused', 'error'];
      if (!validStatuses.includes(updates.status)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid status',
            code: 'VALIDATION_ERROR',
            details: { validStatuses },
          },
          { status: 400, headers: { 'X-Request-ID': requestId } }
        );
      }
    }

    const now = new Date();
    const setClause: string[] = ['updated_at = $1'];
    const values: any[] = [now];
    let paramIndex = 2;

    if (updates.name !== undefined) {
      setClause.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      setClause.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.status !== undefined) {
      setClause.push(`status = $${paramIndex++}`);
      values.push(updates.status);
      if (updates.status === 'active') {
        setClause.push(`last_active_at = $${paramIndex++}`);
        values.push(now);
      }
    }
    if (updates.repositories !== undefined) {
      setClause.push(`repositories = $${paramIndex++}`);
      values.push(JSON.stringify(updates.repositories));
    }
    if (updates.triggers !== undefined) {
      setClause.push(`triggers = $${paramIndex++}`);
      values.push(JSON.stringify(updates.triggers));
    }
    if (updates.customPrompt !== undefined) {
      setClause.push(`custom_prompt = $${paramIndex++}`);
      values.push(updates.customPrompt);
    }
    if (updates.config !== undefined) {
      const existingConfig = JSON.parse(existingAgents[0].config || '{}');
      const mergedConfig = { ...existingConfig, ...updates.config };
      setClause.push(`config = $${paramIndex++}`);
      values.push(JSON.stringify(mergedConfig));
    }

    values.push(agentId);
    values.push(user.id);

    await prisma.$executeRawUnsafe(`
      UPDATE agents
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
    `, ...values);

    const updatedAgents = await prisma.$queryRaw<any[]>`
      SELECT * FROM agents WHERE id = ${agentId} LIMIT 1
    `;

    const agent = updatedAgents[0];
    const formattedAgent: Agent = {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      role: agent.role as AgentRole,
      status: agent.status as AgentStatus,
      installationId: agent.installation_id,
      repositories: JSON.parse(agent.repositories || '[]'),
      triggers: JSON.parse(agent.triggers || '[]') as AgentTrigger[],
      customPrompt: agent.custom_prompt,
      config: JSON.parse(agent.config || '{}') as AgentConfig,
      stats: JSON.parse(agent.stats || '{}') as AgentStats,
      createdAt: new Date(agent.created_at),
      updatedAt: new Date(agent.updated_at),
      lastActiveAt: agent.last_active_at ? new Date(agent.last_active_at) : undefined,
    };

    console.log('[Agent API] Updated agent:', {
      agentId,
      userId: user.id,
      updates: Object.keys(updates),
    });

    return NextResponse.json(
      {
        success: true,
        data: formattedAgent,
        message: 'Agent updated successfully',
      },
      { status: 200, headers: { 'X-Request-ID': requestId } }
    );
  } catch (error) {
    console.error('[Agent API] Error updating agent:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to update agent', code: 'UPDATE_ERROR' },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const existingAgents = await prisma.$queryRaw<any[]>`
      SELECT * FROM agents WHERE id = ${agentId} AND user_id = ${user.id} LIMIT 1
    `;

    if (existingAgents.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Agent not found', code: 'NOT_FOUND' },
        { status: 404, headers: { 'X-Request-ID': requestId } }
      );
    }

    await prisma.$executeRaw`
      DELETE FROM agents WHERE id = ${agentId} AND user_id = ${user.id}
    `;

    console.log('[Agent API] Deleted agent:', {
      agentId,
      userId: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Agent deleted successfully',
      },
      { status: 200, headers: { 'X-Request-ID': requestId } }
    );
  } catch (error) {
    console.error('[Agent API] Error deleting agent:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to delete agent', code: 'DELETE_ERROR' },
      { status: 500, headers: { 'X-Request-ID': requestId } }
    );
  }
}

export const dynamic = 'force-dynamic';
