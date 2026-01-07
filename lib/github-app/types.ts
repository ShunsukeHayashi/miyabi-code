/**
 * GitHub App Types and Interfaces
 * Miyabi AI Agent Framework - GitHub Marketplace Integration
 */

export interface GitHubAppConfig {
  appId: string;
  clientId: string;
  clientSecret: string;
  privateKey: string;
  webhookSecret: string;
  callbackUrl: string;
  webhookUrl: string;
}

export interface GitHubAppInstallation {
  id: number;
  account: {
    login: string;
    id: number;
    type: 'User' | 'Organization';
    avatar_url: string;
  };
  repository_selection: 'all' | 'selected';
  permissions: GitHubAppPermissions;
  events: GitHubWebhookEvent[];
  created_at: string;
  updated_at: string;
  suspended_at: string | null;
  target_id: number;
  target_type: 'User' | 'Organization';
}

export interface GitHubAppPermissions {
  contents?: 'read' | 'write';
  issues?: 'read' | 'write';
  metadata?: 'read';
  pull_requests?: 'read' | 'write';
  actions?: 'read' | 'write';
  checks?: 'read' | 'write';
  workflows?: 'read' | 'write';
}

export type GitHubWebhookEvent =
  | 'issues'
  | 'issue_comment'
  | 'pull_request'
  | 'pull_request_review'
  | 'pull_request_review_comment'
  | 'push'
  | 'installation'
  | 'installation_repositories'
  | 'check_run'
  | 'check_suite'
  | 'workflow_run'
  | 'workflow_job';

export interface GitHubOAuthTokenResponse {
  access_token: string;
  token_type: 'bearer';
  scope: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
}

export interface GitHubUserResponse {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  html_url: string;
  type: 'User' | 'Organization';
  company?: string | null;
  blog?: string | null;
  location?: string | null;
  bio?: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubInstallationToken {
  token: string;
  expires_at: string;
  permissions: GitHubAppPermissions;
  repository_selection: 'all' | 'selected';
}

export interface WebhookPayloadBase {
  action: string;
  sender: {
    login: string;
    id: number;
    avatar_url: string;
    type: 'User' | 'Bot' | 'Organization';
  };
  repository?: {
    id: number;
    name: string;
    full_name: string;
    owner: {
      login: string;
      id: number;
      type: 'User' | 'Organization';
    };
    private: boolean;
    html_url: string;
    default_branch: string;
  };
  organization?: {
    login: string;
    id: number;
    avatar_url: string;
  };
  installation?: {
    id: number;
    account: {
      login: string;
      id: number;
      type: 'User' | 'Organization';
    };
  };
}

export interface IssueWebhookPayload extends WebhookPayloadBase {
  action: 'opened' | 'closed' | 'reopened' | 'edited' | 'labeled' | 'unlabeled' | 'assigned' | 'unassigned';
  issue: {
    id: number;
    number: number;
    title: string;
    body: string | null;
    state: 'open' | 'closed';
    labels: Array<{ id: number; name: string; color: string }>;
    user: {
      login: string;
      id: number;
    };
    assignees: Array<{ login: string; id: number }>;
    created_at: string;
    updated_at: string;
    closed_at: string | null;
  };
}

export interface IssueCommentWebhookPayload extends WebhookPayloadBase {
  action: 'created' | 'edited' | 'deleted';
  issue: IssueWebhookPayload['issue'];
  comment: {
    id: number;
    body: string;
    user: {
      login: string;
      id: number;
    };
    created_at: string;
    updated_at: string;
  };
}

export interface PullRequestWebhookPayload extends WebhookPayloadBase {
  action: 'opened' | 'closed' | 'synchronize' | 'reopened' | 'edited' | 'labeled' | 'unlabeled' | 'review_requested';
  number: number;
  pull_request: {
    id: number;
    number: number;
    title: string;
    body: string | null;
    state: 'open' | 'closed';
    merged: boolean;
    draft: boolean;
    head: {
      ref: string;
      sha: string;
      repo: {
        full_name: string;
      };
    };
    base: {
      ref: string;
      sha: string;
      repo: {
        full_name: string;
      };
    };
    user: {
      login: string;
      id: number;
    };
    labels: Array<{ id: number; name: string; color: string }>;
    created_at: string;
    updated_at: string;
    merged_at: string | null;
    closed_at: string | null;
  };
}

export interface PullRequestReviewWebhookPayload extends WebhookPayloadBase {
  action: 'submitted' | 'edited' | 'dismissed';
  pull_request: PullRequestWebhookPayload['pull_request'];
  review: {
    id: number;
    body: string | null;
    state: 'approved' | 'changes_requested' | 'commented' | 'dismissed' | 'pending';
    user: {
      login: string;
      id: number;
    };
    submitted_at: string;
  };
}

export interface PushWebhookPayload extends WebhookPayloadBase {
  ref: string;
  before: string;
  after: string;
  created: boolean;
  deleted: boolean;
  forced: boolean;
  compare: string;
  commits: Array<{
    id: string;
    message: string;
    author: {
      name: string;
      email: string;
      username: string;
    };
    timestamp: string;
    added: string[];
    removed: string[];
    modified: string[];
  }>;
  head_commit: {
    id: string;
    message: string;
    author: {
      name: string;
      email: string;
    };
    timestamp: string;
  } | null;
  pusher: {
    name: string;
    email: string;
  };
}

export interface InstallationWebhookPayload extends WebhookPayloadBase {
  action: 'created' | 'deleted' | 'suspend' | 'unsuspend' | 'new_permissions_accepted';
  installation: GitHubAppInstallation;
  repositories?: Array<{
    id: number;
    name: string;
    full_name: string;
    private: boolean;
  }>;
}

export interface InstallationRepositoriesWebhookPayload extends Omit<WebhookPayloadBase, 'installation'> {
  action: 'added' | 'removed';
  installation: {
    id: number;
    account: {
      login: string;
      id: number;
      type?: 'User' | 'Organization';
    };
  };
  repository_selection: 'all' | 'selected';
  repositories_added: Array<{
    id: number;
    name: string;
    full_name: string;
    private: boolean;
  }>;
  repositories_removed: Array<{
    id: number;
    name: string;
    full_name: string;
    private: boolean;
  }>;
}

export type WebhookPayload =
  | IssueWebhookPayload
  | IssueCommentWebhookPayload
  | PullRequestWebhookPayload
  | PullRequestReviewWebhookPayload
  | PushWebhookPayload
  | InstallationWebhookPayload
  | InstallationRepositoriesWebhookPayload;

export interface MiyabiGitHubUser {
  id: string;
  githubId: number;
  githubLogin: string;
  email: string | null;
  name: string | null;
  avatarUrl: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  installations: number[];
  tier: 'free' | 'pro' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
}

export interface MiyabiInstallation {
  id: string;
  installationId: number;
  accountLogin: string;
  accountId: number;
  accountType: 'User' | 'Organization';
  repositorySelection: 'all' | 'selected';
  selectedRepositories: string[];
  permissions: GitHubAppPermissions;
  events: GitHubWebhookEvent[];
  status: 'active' | 'suspended' | 'pending';
  tier: 'free' | 'pro' | 'enterprise';
  monthlyIssueCount: number;
  monthlyIssueLimit: number;
  lastResetAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GitHubApiError {
  message: string;
  documentation_url?: string;
  status?: number;
  errors?: Array<{
    resource: string;
    field: string;
    code: string;
    message?: string;
  }>;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
  resource: 'core' | 'search' | 'graphql' | 'integration_manifest';
}
