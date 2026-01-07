/**
 * GitHub Webhook Handler Endpoint
 * POST /api/webhooks/github - Receives and processes GitHub webhook events
 *
 * Headers:
 * - X-GitHub-Event: Event type
 * - X-GitHub-Delivery: Unique delivery ID
 * - X-Hub-Signature-256: HMAC signature for verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {
  verifyWebhookSignature,
  parseWebhookContext,
  webhookProcessor,
} from '../../../../lib/github-app/webhook';
import { checkWebhookRateLimit } from '../../../../lib/github-app/rate-limit';
import {
  WebhookPayload,
  GitHubWebhookEvent,
  InstallationWebhookPayload,
} from '../../../../lib/github-app/types';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    const clientIp = getClientIp(request);
    const rateLimitResult = checkWebhookRateLimit(clientIp);

    if (!rateLimitResult.allowed) {
      console.warn('[Webhook] Rate limit exceeded', { clientIp, requestId });

      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        {
          status: 429,
          headers: {
            'X-Request-ID': requestId,
            'Retry-After': String(rateLimitResult.retryAfter || 1),
          },
        }
      );
    }

    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    const verificationResult = verifyWebhookSignature(rawBody, signature);
    if (!verificationResult.valid) {
      console.error('[Webhook] Signature verification failed', {
        requestId,
        error: verificationResult.error,
        clientIp,
      });

      return NextResponse.json(
        {
          success: false,
          error: verificationResult.error || 'Signature verification failed',
          code: 'INVALID_SIGNATURE',
        },
        {
          status: 401,
          headers: {
            'X-Request-ID': requestId,
          },
        }
      );
    }

    const context = parseWebhookContext(request.headers);
    if (!context) {
      console.error('[Webhook] Missing required headers', { requestId });

      return NextResponse.json(
        {
          success: false,
          error: 'Missing required webhook headers',
          code: 'INVALID_REQUEST',
        },
        {
          status: 400,
          headers: {
            'X-Request-ID': requestId,
          },
        }
      );
    }

    let payload: WebhookPayload;
    try {
      payload = JSON.parse(rawBody) as WebhookPayload;
    } catch {
      console.error('[Webhook] Invalid JSON payload', { requestId });

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON payload',
          code: 'INVALID_PAYLOAD',
        },
        {
          status: 400,
          headers: {
            'X-Request-ID': requestId,
          },
        }
      );
    }

    if (payload.installation) {
      context.installationId = payload.installation.id;
    }

    if (payload.repository) {
      context.repositoryFullName = payload.repository.full_name;
    }

    console.log('[Webhook] Processing event', {
      requestId,
      event: context.event,
      delivery: context.delivery,
      action: 'action' in payload ? payload.action : undefined,
      repository: context.repositoryFullName,
      installationId: context.installationId,
    });

    await logWebhookEvent(context, payload);

    if (context.event === 'installation') {
      await handleInstallationEvent(payload as InstallationWebhookPayload, context);
    }

    const results = await webhookProcessor.process(
      context.event as GitHubWebhookEvent,
      payload,
      context
    );

    const processingTime = Date.now() - startTime;

    const success = results.every((r) => r.success);

    console.log('[Webhook] Processing complete', {
      requestId,
      event: context.event,
      delivery: context.delivery,
      success,
      resultCount: results.length,
      processingTime,
    });

    return NextResponse.json(
      {
        success,
        requestId,
        delivery: context.delivery,
        event: context.event,
        results,
        processingTime,
      },
      {
        status: success ? 200 : 207,
        headers: {
          'X-Request-ID': requestId,
          'X-Processing-Time': String(processingTime),
        },
      }
    );
  } catch (error) {
    const processingTime = Date.now() - startTime;

    console.error('[Webhook] Error processing webhook', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        requestId,
      },
      {
        status: 500,
        headers: {
          'X-Request-ID': requestId,
          'X-Processing-Time': String(processingTime),
        },
      }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      status: 'healthy',
      endpoint: 'GitHub Webhook Handler',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

async function logWebhookEvent(
  context: ReturnType<typeof parseWebhookContext>,
  payload: WebhookPayload
): Promise<void> {
  if (!context) return;

  try {
    await prisma.$executeRaw`
      INSERT INTO webhook_events (
        id, event_type, delivery_id, action, repository_full_name,
        installation_id, sender_login, payload_summary, received_at
      ) VALUES (
        ${context.id},
        ${context.event},
        ${context.delivery},
        ${'action' in payload ? payload.action : null},
        ${payload.repository?.full_name || null},
        ${payload.installation?.id || null},
        ${payload.sender?.login || null},
        ${JSON.stringify({
          action: 'action' in payload ? payload.action : null,
          repository: payload.repository?.full_name,
          sender: payload.sender?.login,
        })},
        ${new Date()}
      )
    `;
  } catch (error) {
    console.warn('[Webhook] Failed to log webhook event:', error);
  }
}

async function handleInstallationEvent(
  payload: InstallationWebhookPayload,
  context: ReturnType<typeof parseWebhookContext>
): Promise<void> {
  if (!context) return;

  const { action, installation, repositories } = payload;

  try {
    if (action === 'created') {
      await prisma.$executeRaw`
        INSERT INTO github_installations (
          id, installation_id, account_login, account_id, account_type,
          repository_selection, selected_repositories, permissions, events,
          status, tier, monthly_issue_count, monthly_issue_limit,
          last_reset_at, created_at, updated_at
        ) VALUES (
          ${crypto.randomUUID()},
          ${installation.id},
          ${installation.account.login},
          ${installation.account.id},
          ${installation.account.type},
          ${installation.repository_selection},
          ${JSON.stringify(repositories?.map((r) => r.full_name) || [])},
          ${JSON.stringify(installation.permissions)},
          ${JSON.stringify(installation.events)},
          'active',
          'free',
          0,
          100,
          ${new Date()},
          ${new Date()},
          ${new Date()}
        )
        ON CONFLICT (installation_id) DO UPDATE SET
          account_login = EXCLUDED.account_login,
          repository_selection = EXCLUDED.repository_selection,
          selected_repositories = EXCLUDED.selected_repositories,
          permissions = EXCLUDED.permissions,
          events = EXCLUDED.events,
          status = 'active',
          updated_at = EXCLUDED.updated_at
      `;

      console.log('[Installation] Created/Updated installation', {
        installationId: installation.id,
        account: installation.account.login,
        repositories: repositories?.length || 0,
      });
    } else if (action === 'deleted') {
      await prisma.$executeRaw`
        UPDATE github_installations
        SET status = 'deleted', updated_at = ${new Date()}
        WHERE installation_id = ${installation.id}
      `;

      console.log('[Installation] Marked installation as deleted', {
        installationId: installation.id,
        account: installation.account.login,
      });
    } else if (action === 'suspend') {
      await prisma.$executeRaw`
        UPDATE github_installations
        SET status = 'suspended', updated_at = ${new Date()}
        WHERE installation_id = ${installation.id}
      `;

      console.log('[Installation] Suspended installation', {
        installationId: installation.id,
      });
    } else if (action === 'unsuspend') {
      await prisma.$executeRaw`
        UPDATE github_installations
        SET status = 'active', updated_at = ${new Date()}
        WHERE installation_id = ${installation.id}
      `;

      console.log('[Installation] Unsuspended installation', {
        installationId: installation.id,
      });
    }
  } catch (error) {
    console.error('[Installation] Failed to handle installation event:', error);
  }
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    request.ip ||
    'unknown'
  );
}

export const dynamic = 'force-dynamic';

export const runtime = 'nodejs';
