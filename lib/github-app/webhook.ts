/**
 * GitHub Webhook Handler
 * Miyabi AI Agent Framework - Secure Webhook Processing
 */

import * as crypto from 'crypto';
import { getGitHubAppConfig } from './config';
import type {
  WebhookPayload,
  IssueWebhookPayload,
  IssueCommentWebhookPayload,
  PullRequestWebhookPayload,
  PullRequestReviewWebhookPayload,
  PushWebhookPayload,
  InstallationWebhookPayload,
  InstallationRepositoriesWebhookPayload,
  GitHubWebhookEvent,
} from './types';

export interface WebhookVerificationResult {
  valid: boolean;
  error?: string;
}

export interface WebhookContext {
  id: string;
  event: GitHubWebhookEvent;
  delivery: string;
  signature: string;
  timestamp: number;
  installationId?: number;
  repositoryFullName?: string;
}

export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string | null,
): WebhookVerificationResult {
  const config = getGitHubAppConfig();

  if (!config.webhookSecret) {
    console.warn('GITHUB_WEBHOOK_SECRET is not configured - webhook verification disabled');
    return { valid: true };
  }

  if (!signature) {
    return { valid: false, error: 'Missing X-Hub-Signature-256 header' };
  }

  const signaturePrefix = 'sha256=';
  if (!signature.startsWith(signaturePrefix)) {
    return { valid: false, error: 'Invalid signature format' };
  }

  const receivedSignature = signature.slice(signaturePrefix.length);
  const payloadBuffer = typeof payload === 'string' ? Buffer.from(payload) : payload;

  const expectedSignature = crypto
    .createHmac('sha256', config.webhookSecret)
    .update(payloadBuffer)
    .digest('hex');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(receivedSignature, 'hex'),
    Buffer.from(expectedSignature, 'hex'),
  );

  if (!isValid) {
    return { valid: false, error: 'Signature verification failed' };
  }

  return { valid: true };
}

export function parseWebhookContext(headers: Headers): WebhookContext | null {
  const event = headers.get('x-github-event') as GitHubWebhookEvent | null;
  const delivery = headers.get('x-github-delivery');
  const signature = headers.get('x-hub-signature-256');

  if (!event || !delivery) {
    return null;
  }

  return {
    id: crypto.randomUUID(),
    event,
    delivery,
    signature: signature || '',
    timestamp: Date.now(),
  };
}

export type WebhookHandler<T extends WebhookPayload = WebhookPayload> = (
  payload: T,
  context: WebhookContext
) => Promise<WebhookHandlerResult>;

export interface WebhookHandlerResult {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
  error?: string;
}

export class WebhookProcessor {
  private handlers: Map<string, WebhookHandler[]> = new Map();
  private middleware: Array<(payload: WebhookPayload, context: WebhookContext) => Promise<boolean>> = [];

  registerHandler<T extends WebhookPayload>(
    event: GitHubWebhookEvent,
    action: string | '*',
    handler: WebhookHandler<T>,
  ): void {
    const key = `${event}:${action}`;
    const existing = this.handlers.get(key) || [];
    existing.push(handler as WebhookHandler);
    this.handlers.set(key, existing);
  }

  registerMiddleware(
    middleware: (payload: WebhookPayload, context: WebhookContext) => Promise<boolean>,
  ): void {
    this.middleware.push(middleware);
  }

  async process(
    event: GitHubWebhookEvent,
    payload: WebhookPayload,
    context: WebhookContext,
  ): Promise<WebhookHandlerResult[]> {
    for (const middleware of this.middleware) {
      const shouldContinue = await middleware(payload, context);
      if (!shouldContinue) {
        return [{ success: false, message: 'Blocked by middleware' }];
      }
    }

    const results: WebhookHandlerResult[] = [];

    const wildcardKey = `${event}:*`;
    const wildcardHandlers = this.handlers.get(wildcardKey) || [];

    for (const handler of wildcardHandlers) {
      try {
        const result = await handler(payload, context);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const action = 'action' in payload ? payload.action : '*';
    const specificKey = `${event}:${action}`;
    const specificHandlers = this.handlers.get(specificKey) || [];

    for (const handler of specificHandlers) {
      try {
        const result = await handler(payload, context);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }
}

export const webhookProcessor = new WebhookProcessor();

webhookProcessor.registerHandler<IssueWebhookPayload>(
  'issues',
  'opened',
  async (payload, context) => {
    console.log(`[Webhook] Issue opened: #${payload.issue.number} - ${payload.issue.title}`);

    const hasAILabel = payload.issue.labels.some(
      (label) => label.name.toLowerCase().includes('ai') || label.name.toLowerCase().includes('miyabi'),
    );

    if (hasAILabel) {
      return {
        success: true,
        message: 'Issue queued for AI agent processing',
        data: {
          issueNumber: payload.issue.number,
          repository: payload.repository?.full_name,
        },
      };
    }

    return {
      success: true,
      message: 'Issue received but not tagged for AI processing',
    };
  },
);

webhookProcessor.registerHandler<IssueWebhookPayload>(
  'issues',
  'labeled',
  async (payload, context) => {
    console.log(`[Webhook] Issue labeled: #${payload.issue.number}`);

    return {
      success: true,
      message: 'Issue label change processed',
      data: {
        issueNumber: payload.issue.number,
        labels: payload.issue.labels.map((l) => l.name),
      },
    };
  },
);

webhookProcessor.registerHandler<IssueCommentWebhookPayload>(
  'issue_comment',
  'created',
  async (payload, context) => {
    console.log(`[Webhook] Comment on issue #${payload.issue.number}`);

    const isMentioned = payload.comment.body.includes('@miyabi');
    if (isMentioned) {
      return {
        success: true,
        message: 'Miyabi mentioned - processing command',
        data: {
          issueNumber: payload.issue.number,
          commentBody: payload.comment.body,
        },
      };
    }

    return {
      success: true,
      message: 'Comment received',
    };
  },
);

webhookProcessor.registerHandler<PullRequestWebhookPayload>(
  'pull_request',
  'opened',
  async (payload, context) => {
    console.log(`[Webhook] PR opened: #${payload.pull_request.number} - ${payload.pull_request.title}`);

    return {
      success: true,
      message: 'Pull request received for review',
      data: {
        prNumber: payload.pull_request.number,
        title: payload.pull_request.title,
        head: payload.pull_request.head.ref,
        base: payload.pull_request.base.ref,
      },
    };
  },
);

webhookProcessor.registerHandler<PullRequestWebhookPayload>(
  'pull_request',
  'synchronize',
  async (payload, context) => {
    console.log(`[Webhook] PR updated: #${payload.pull_request.number}`);

    return {
      success: true,
      message: 'Pull request updated',
      data: {
        prNumber: payload.pull_request.number,
        headSha: payload.pull_request.head.sha,
      },
    };
  },
);

webhookProcessor.registerHandler<PullRequestReviewWebhookPayload>(
  'pull_request_review',
  'submitted',
  async (payload, context) => {
    console.log(`[Webhook] PR review: #${payload.pull_request.number} - ${payload.review.state}`);

    return {
      success: true,
      message: 'Pull request review processed',
      data: {
        prNumber: payload.pull_request.number,
        reviewState: payload.review.state,
        reviewer: payload.review.user.login,
      },
    };
  },
);

webhookProcessor.registerHandler<PushWebhookPayload>(
  'push',
  '*',
  async (payload, context) => {
    const branch = payload.ref.replace('refs/heads/', '');
    console.log(`[Webhook] Push to ${branch}: ${payload.commits.length} commits`);

    return {
      success: true,
      message: 'Push event processed',
      data: {
        branch,
        commitCount: payload.commits.length,
        headCommit: payload.head_commit?.id,
      },
    };
  },
);

webhookProcessor.registerHandler<InstallationWebhookPayload>(
  'installation',
  'created',
  async (payload, context) => {
    console.log(`[Webhook] App installed by ${payload.installation.account.login}`);

    return {
      success: true,
      message: 'Installation created successfully',
      data: {
        installationId: payload.installation.id,
        account: payload.installation.account.login,
        accountType: payload.installation.account.type,
        repositories: payload.repositories?.map((r) => r.full_name) || [],
      },
    };
  },
);

webhookProcessor.registerHandler<InstallationWebhookPayload>(
  'installation',
  'deleted',
  async (payload, context) => {
    console.log(`[Webhook] App uninstalled by ${payload.installation.account.login}`);

    return {
      success: true,
      message: 'Installation deleted',
      data: {
        installationId: payload.installation.id,
        account: payload.installation.account.login,
      },
    };
  },
);

webhookProcessor.registerHandler<InstallationRepositoriesWebhookPayload>(
  'installation_repositories',
  'added',
  async (payload, context) => {
    console.log(
      `[Webhook] Repositories added to installation: ${payload.repositories_added.map((r) => r.full_name).join(', ')}`,
    );

    return {
      success: true,
      message: 'Repositories added to installation',
      data: {
        installationId: payload.installation.id,
        added: payload.repositories_added.map((r) => r.full_name),
      },
    };
  },
);

webhookProcessor.registerHandler<InstallationRepositoriesWebhookPayload>(
  'installation_repositories',
  'removed',
  async (payload, context) => {
    console.log(
      `[Webhook] Repositories removed from installation: ${payload.repositories_removed.map((r) => r.full_name).join(', ')}`,
    );

    return {
      success: true,
      message: 'Repositories removed from installation',
      data: {
        installationId: payload.installation.id,
        removed: payload.repositories_removed.map((r) => r.full_name),
      },
    };
  },
);

webhookProcessor.registerMiddleware(async (payload, context) => {
  console.log(`[Webhook Middleware] Processing ${context.event} event (delivery: ${context.delivery})`);
  return true;
});
