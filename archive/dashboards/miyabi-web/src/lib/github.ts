/**
 * GitHub API integration
 */

import axios from 'axios';
import type { GitHubRepository, Issue, IssueComment } from '@/types/repository';

const GITHUB_API = 'https://api.github.com';

/**
 * Create GitHub API client with user's access token
 */
export const createGitHubClient = (accessToken: string) => {
  return axios.create({
    baseURL: GITHUB_API,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Miyabi-Web-App',
    },
  });
};

/**
 * Fetch user's GitHub repositories
 */
export const fetchUserRepositories = async (
  accessToken: string
): Promise<GitHubRepository[]> => {
  const client = createGitHubClient(accessToken);
  const response = await client.get<GitHubRepository[]>('/user/repos', {
    params: {
      sort: 'updated',
      per_page: 100,
    },
  });
  return response.data;
};

/**
 * Fetch issues for a repository
 */
export const fetchRepositoryIssues = async (
  accessToken: string,
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open'
): Promise<Issue[]> => {
  const client = createGitHubClient(accessToken);
  const response = await client.get<Issue[]>(`/repos/${owner}/${repo}/issues`, {
    params: {
      state,
      per_page: 100,
    },
  });
  return response.data;
};

/**
 * Fetch a single issue
 */
export const fetchIssue = async (
  accessToken: string,
  owner: string,
  repo: string,
  issueNumber: number
): Promise<Issue> => {
  const client = createGitHubClient(accessToken);
  const response = await client.get<Issue>(`/repos/${owner}/${repo}/issues/${issueNumber}`);
  return response.data;
};

/**
 * Fetch comments for an issue
 */
export const fetchIssueComments = async (
  accessToken: string,
  owner: string,
  repo: string,
  issueNumber: number
): Promise<IssueComment[]> => {
  const client = createGitHubClient(accessToken);
  const response = await client.get<IssueComment[]>(
    `/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
    {
      params: {
        per_page: 100,
      },
    }
  );
  return response.data;
};
