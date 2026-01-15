/**
 * GitHub API Client
 * Miyabi AI Agent Framework - Type-safe GitHub API Operations
 */

import { GITHUB_API_BASE_URL } from './config';
import { getInstallationAccessToken } from './oauth';
import { withRateLimit, parseGitHubRateLimitHeaders } from './rate-limit';
import type {
  GitHubApiError,
  RateLimitInfo,
  GitHubAppPermissions,
} from './types';

interface GitHubApiResponse<T> {
  data: T;
  rateLimit: RateLimitInfo | null;
  headers: Headers;
}

interface GitHubApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  installationId: number;
}

class GitHubApiClient {
  private tokenCache: Map<number, { token: string; expiresAt: Date }> = new Map();

  private async getToken(installationId: number): Promise<string> {
    const cached = this.tokenCache.get(installationId);
    const now = new Date();

    if (cached && cached.expiresAt > now) {
      return cached.token;
    }

    const tokenResponse = await getInstallationAccessToken(installationId);
    const expiresAt = new Date(tokenResponse.expires_at);

    const bufferMs = 5 * 60 * 1000;
    this.tokenCache.set(installationId, {
      token: tokenResponse.token,
      expiresAt: new Date(expiresAt.getTime() - bufferMs),
    });

    return tokenResponse.token;
  }

  async request<T>(
    endpoint: string,
    options: GitHubApiRequestOptions,
  ): Promise<GitHubApiResponse<T>> {
    return withRateLimit(options.installationId, async () => {
      const token = await this.getToken(options.installationId);

      const url = endpoint.startsWith('http') ? endpoint : `${GITHUB_API_BASE_URL}${endpoint}`;

      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const rateLimit = parseGitHubRateLimitHeaders(response.headers);

      if (!response.ok) {
        const errorData = await response.json() as GitHubApiError;
        const error = new Error(
          `GitHub API Error: ${response.status} - ${errorData.message}`,
        );
        (error as any).status = response.status;
        (error as any).response = errorData;
        throw error;
      }

      if (response.status === 204) {
        return {
          data: null as unknown as T,
          rateLimit,
          headers: response.headers,
        };
      }

      const data = await response.json() as T;

      return {
        data,
        rateLimit,
        headers: response.headers,
      };
    });
  }

  async getRepository(
    installationId: number,
    owner: string,
    repo: string,
  ): Promise<GitHubApiResponse<GitHubRepository>> {
    return this.request(`/repos/${owner}/${repo}`, { installationId });
  }

  async listInstallationRepositories(
    installationId: number,
  ): Promise<GitHubApiResponse<{ repositories: GitHubRepository[] }>> {
    return this.request('/installation/repositories', { installationId });
  }

  async getIssue(
    installationId: number,
    owner: string,
    repo: string,
    issueNumber: number,
  ): Promise<GitHubApiResponse<GitHubIssue>> {
    return this.request(`/repos/${owner}/${repo}/issues/${issueNumber}`, { installationId });
  }

  async createIssueComment(
    installationId: number,
    owner: string,
    repo: string,
    issueNumber: number,
    body: string,
  ): Promise<GitHubApiResponse<GitHubIssueComment>> {
    return this.request(`/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
      installationId,
      method: 'POST',
      body: { body },
    });
  }

  async updateIssue(
    installationId: number,
    owner: string,
    repo: string,
    issueNumber: number,
    update: Partial<{
      title: string;
      body: string;
      state: 'open' | 'closed';
      labels: string[];
      assignees: string[];
    }>,
  ): Promise<GitHubApiResponse<GitHubIssue>> {
    return this.request(`/repos/${owner}/${repo}/issues/${issueNumber}`, {
      installationId,
      method: 'PATCH',
      body: update,
    });
  }

  async addLabelsToIssue(
    installationId: number,
    owner: string,
    repo: string,
    issueNumber: number,
    labels: string[],
  ): Promise<GitHubApiResponse<GitHubLabel[]>> {
    return this.request(`/repos/${owner}/${repo}/issues/${issueNumber}/labels`, {
      installationId,
      method: 'POST',
      body: { labels },
    });
  }

  async getPullRequest(
    installationId: number,
    owner: string,
    repo: string,
    pullNumber: number,
  ): Promise<GitHubApiResponse<GitHubPullRequest>> {
    return this.request(`/repos/${owner}/${repo}/pulls/${pullNumber}`, { installationId });
  }

  async createPullRequest(
    installationId: number,
    owner: string,
    repo: string,
    params: {
      title: string;
      body: string;
      head: string;
      base: string;
      draft?: boolean;
    },
  ): Promise<GitHubApiResponse<GitHubPullRequest>> {
    return this.request(`/repos/${owner}/${repo}/pulls`, {
      installationId,
      method: 'POST',
      body: params,
    });
  }

  async createPullRequestReview(
    installationId: number,
    owner: string,
    repo: string,
    pullNumber: number,
    review: {
      body: string;
      event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
      comments?: Array<{
        path: string;
        position?: number;
        line?: number;
        body: string;
      }>;
    },
  ): Promise<GitHubApiResponse<GitHubPullRequestReview>> {
    return this.request(`/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`, {
      installationId,
      method: 'POST',
      body: review,
    });
  }

  async getFileContent(
    installationId: number,
    owner: string,
    repo: string,
    path: string,
    ref?: string,
  ): Promise<GitHubApiResponse<GitHubContent>> {
    const endpoint = `/repos/${owner}/${repo}/contents/${path}${ref ? `?ref=${ref}` : ''}`;
    return this.request(endpoint, { installationId });
  }

  async createOrUpdateFile(
    installationId: number,
    owner: string,
    repo: string,
    path: string,
    params: {
      message: string;
      content: string;
      sha?: string;
      branch?: string;
    },
  ): Promise<GitHubApiResponse<{ content: GitHubContent; commit: GitHubCommit }>> {
    return this.request(`/repos/${owner}/${repo}/contents/${path}`, {
      installationId,
      method: 'PUT',
      body: {
        ...params,
        content: Buffer.from(params.content).toString('base64'),
      },
    });
  }

  async createBranch(
    installationId: number,
    owner: string,
    repo: string,
    branchName: string,
    fromSha: string,
  ): Promise<GitHubApiResponse<GitHubRef>> {
    return this.request(`/repos/${owner}/${repo}/git/refs`, {
      installationId,
      method: 'POST',
      body: {
        ref: `refs/heads/${branchName}`,
        sha: fromSha,
      },
    });
  }

  async getBranch(
    installationId: number,
    owner: string,
    repo: string,
    branch: string,
  ): Promise<GitHubApiResponse<GitHubBranch>> {
    return this.request(`/repos/${owner}/${repo}/branches/${branch}`, { installationId });
  }

  async createCheckRun(
    installationId: number,
    owner: string,
    repo: string,
    params: {
      name: string;
      head_sha: string;
      status?: 'queued' | 'in_progress' | 'completed';
      conclusion?: 'action_required' | 'cancelled' | 'failure' | 'neutral' | 'success' | 'skipped' | 'stale' | 'timed_out';
      output?: {
        title: string;
        summary: string;
        text?: string;
      };
    },
  ): Promise<GitHubApiResponse<GitHubCheckRun>> {
    return this.request(`/repos/${owner}/${repo}/check-runs`, {
      installationId,
      method: 'POST',
      body: params,
    });
  }

  async updateCheckRun(
    installationId: number,
    owner: string,
    repo: string,
    checkRunId: number,
    params: {
      status?: 'queued' | 'in_progress' | 'completed';
      conclusion?: 'action_required' | 'cancelled' | 'failure' | 'neutral' | 'success' | 'skipped' | 'stale' | 'timed_out';
      output?: {
        title: string;
        summary: string;
        text?: string;
      };
    },
  ): Promise<GitHubApiResponse<GitHubCheckRun>> {
    return this.request(`/repos/${owner}/${repo}/check-runs/${checkRunId}`, {
      installationId,
      method: 'PATCH',
      body: params,
    });
  }
}

export const githubApiClient = new GitHubApiClient();

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: { login: string; id: number };
  html_url: string;
  description: string | null;
  default_branch: string;
  permissions?: GitHubAppPermissions;
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  labels: GitHubLabel[];
  user: { login: string; id: number };
  assignees: Array<{ login: string; id: number }>;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

interface GitHubIssueComment {
  id: number;
  body: string;
  user: { login: string; id: number };
  created_at: string;
  updated_at: string;
}

interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  merged: boolean;
  draft: boolean;
  head: { ref: string; sha: string };
  base: { ref: string; sha: string };
  user: { login: string; id: number };
  labels: GitHubLabel[];
  created_at: string;
  updated_at: string;
  merged_at: string | null;
}

interface GitHubPullRequestReview {
  id: number;
  body: string | null;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING';
  user: { login: string; id: number };
  submitted_at: string;
}

interface GitHubContent {
  type: 'file' | 'dir' | 'submodule' | 'symlink';
  name: string;
  path: string;
  sha: string;
  size?: number;
  content?: string;
  encoding?: 'base64';
}

interface GitHubCommit {
  sha: string;
  message: string;
  author: { name: string; email: string; date: string };
}

interface GitHubRef {
  ref: string;
  object: { sha: string; type: string };
}

interface GitHubBranch {
  name: string;
  commit: { sha: string };
  protected: boolean;
}

interface GitHubCheckRun {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: string | null;
  head_sha: string;
  started_at: string | null;
  completed_at: string | null;
}

export {
  GitHubRepository,
  GitHubIssue,
  GitHubIssueComment,
  GitHubLabel,
  GitHubPullRequest,
  GitHubPullRequestReview,
  GitHubContent,
  GitHubCommit,
  GitHubRef,
  GitHubBranch,
  GitHubCheckRun,
};
