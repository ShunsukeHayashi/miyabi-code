/**
 * GitHub App Configuration
 * Miyabi AI Agent Framework - GitHub Marketplace Integration
 */

import { GitHubAppConfig } from './types';

export function getGitHubAppConfig(): GitHubAppConfig {
  const appId = process.env.GITHUB_APP_ID;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!appId || !clientId || !clientSecret) {
    throw new Error('GitHub App configuration is incomplete. Required: GITHUB_APP_ID, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET');
  }

  const baseUrl = process.env.GITHUB_APP_BASE_URL || 'https://api.miyabi-ai.dev';

  return {
    appId,
    clientId,
    clientSecret,
    privateKey: privateKey?.replace(/\\n/g, '\n') || '',
    webhookSecret: webhookSecret || '',
    callbackUrl: `${baseUrl}/auth/github/callback`,
    webhookUrl: `${baseUrl}/webhooks/github`,
  };
}

export const GITHUB_API_BASE_URL = 'https://api.github.com';
export const GITHUB_OAUTH_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
export const GITHUB_OAUTH_TOKEN_URL = 'https://github.com/login/oauth/access_token';

export const GITHUB_APP_SCOPES = [
  'read:user',
  'user:email',
  'repo',
  'workflow',
] as const;

export const GITHUB_APP_PERMISSIONS = {
  contents: 'read' as const,
  issues: 'write' as const,
  metadata: 'read' as const,
  pull_requests: 'write' as const,
};

export const GITHUB_WEBHOOK_EVENTS = [
  'issues',
  'issue_comment',
  'pull_request',
  'pull_request_review',
  'push',
  'installation',
  'installation_repositories',
] as const;

export const RATE_LIMITS = {
  github_api: {
    hourly: 5000,
    per_minute: 100,
  },
  webhooks: {
    per_second: 10,
    burst: 50,
  },
  oauth: {
    per_minute: 20,
  },
};

export const TIER_LIMITS = {
  free: {
    monthly_issues: 100,
    concurrent_agents: 1,
    repositories: 3,
  },
  pro: {
    monthly_issues: -1,
    concurrent_agents: 3,
    repositories: -1,
  },
  enterprise: {
    monthly_issues: -1,
    concurrent_agents: -1,
    repositories: -1,
  },
};
