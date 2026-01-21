// GitHub Client Tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { execSync } from 'node:child_process';

// Mock child_process before importing GitHubClient
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
  default: { execSync: vi.fn() }
}));

import { GitHubClient } from '@/github/client.js';

describe('GitHubClient', () => {
  let client: GitHubClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new GitHubClient({
      owner: 'test-owner',
      repo: 'test-repo'
    });
  });

  describe('constructor', () => {
    it('should initialize with config', () => {
      expect(client).toBeDefined();
    });
  });

  describe('listIssues', () => {
    it('should list issues successfully', async () => {
      vi.mocked(execSync).mockReturnValue(JSON.stringify([
        {
          number: 1,
          title: 'Test Issue',
          state: 'open',
          author: { login: 'testuser' },
          assignees: [],
          labels: [],
          createdAt: '2025-01-01T00:00:00Z',
          body: 'Test body'
        }
      ]));

      const issues = await client.listIssues({ state: 'open', limit: 10 });

      expect(issues).toHaveLength(1);
      expect(issues[0].number).toBe(1);
      expect(issues[0].title).toBe('Test Issue');
      expect(execSync).toHaveBeenCalled();
    });

    it('should use default options', async () => {
      vi.mocked(execSync).mockReturnValue('[]');

      await client.listIssues();

      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('--state open'),
        expect.any(Object)
      );
    });

    it('should handle errors', async () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('gh command failed');
      });

      await expect(client.listIssues()).rejects.toThrow('Failed to list issues');
    });
  });

  describe('getIssue', () => {
    it('should get issue by number', async () => {
      vi.mocked(execSync).mockReturnValue(JSON.stringify({
        number: 1,
        title: 'Test Issue',
        state: 'open',
        author: { login: 'testuser' },
        assignees: [],
        labels: [],
        createdAt: '2025-01-01T00:00:00Z',
        body: 'Test body'
      }));

      const issue = await client.getIssue(1);

      expect(issue.number).toBe(1);
      expect(issue.title).toBe('Test Issue');
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('issue view'),
        expect.any(Object)
      );
    });

    it('should handle not found error', async () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Issue not found');
      });

      await expect(client.getIssue(999)).rejects.toThrow('Failed to get issue #999');
    });
  });

  describe('createIssue', () => {
    it('should create issue successfully', async () => {
      vi.mocked(execSync).mockReturnValue('https://github.com/test-owner/test-repo/issues/1');

      const issueNumber = await client.createIssue('Test Issue', 'Test body');

      expect(issueNumber).toBe(1);
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('issue create'),
        expect.any(Object)
      );
    });

    it('should handle creation error', async () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Failed to create');
      });

      await expect(client.createIssue('Title', 'Body')).rejects.toThrow('Failed to create issue');
    });
  });

  describe('listPRs', () => {
    it('should list pull requests', async () => {
      vi.mocked(execSync).mockReturnValue(JSON.stringify([
        {
          number: 1,
          title: 'Test PR',
          state: 'open',
          headRefName: 'feature-branch',
          baseRefName: 'main',
          author: { login: 'testuser' },
          reviewers: [],
          mergeable: true
        }
      ]));

      const prs = await client.listPRs('open', 10);

      expect(prs).toHaveLength(1);
      expect(prs[0].number).toBe(1);
      expect(prs[0].title).toBe('Test PR');
    });
  });

  describe('createPR', () => {
    it('should create pull request', async () => {
      vi.mocked(execSync).mockReturnValue('https://github.com/test-owner/test-repo/pull/1');

      const prNumber = await client.createPR({
        title: 'Test PR',
        body: 'PR body',
        sourceBranch: 'feature',
        targetBranch: 'main',
        draft: true
      });

      expect(prNumber).toBe(1);
      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('--draft'),
        expect.any(Object)
      );
    });

    it('should create PR without draft', async () => {
      vi.mocked(execSync).mockReturnValue('https://github.com/test-owner/test-repo/pull/2');

      const prNumber = await client.createPR({
        title: 'Test PR',
        body: 'PR body',
        sourceBranch: 'feature',
        targetBranch: 'main',
        draft: false
      });

      expect(prNumber).toBe(2);
      expect(execSync).not.toHaveBeenCalledWith(
        expect.stringContaining('--draft'),
        expect.any(Object)
      );
    });
  });

  describe('mergePR', () => {
    it('should merge pull request', async () => {
      vi.mocked(execSync).mockReturnValue('');

      await client.mergePR(1, 'squash');

      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('--squash'),
        expect.any(Object)
      );
    });

    it('should handle merge error', async () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Merge failed');
      });

      await expect(client.mergePR(1, 'squash')).rejects.toThrow('Failed to merge PR #1');
    });
  });

  describe('getDefaultBranch', () => {
    it('should get default branch', async () => {
      vi.mocked(execSync).mockReturnValue(JSON.stringify({
        defaultBranchRef: { name: 'main' }
      }));

      const branch = await client.getDefaultBranch();

      expect(branch).toBe('main');
    });

    it('should fallback to main on error', async () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Failed to get');
      });

      const branch = await client.getDefaultBranch();

      expect(branch).toBe('main');
    });
  });

  describe('addComment', () => {
    it('should add comment to issue', async () => {
      vi.mocked(execSync).mockReturnValue('');

      await client.addComment(1, 'Test comment');

      expect(execSync).toHaveBeenCalledWith(
        expect.stringContaining('issue comment'),
        expect.any(Object)
      );
    });

    it('should handle comment error', async () => {
      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('Failed to comment');
      });

      await expect(client.addComment(1, 'Comment')).rejects.toThrow('Failed to add comment to issue #1');
    });
  });

  describe('getMetrics', () => {
    it('should return current metrics', () => {
      const metrics = client.getMetrics();

      expect(metrics).toHaveProperty('apiCalls');
      expect(metrics).toHaveProperty('cacheHits');
      expect(metrics).toHaveProperty('errors');
    });
  });

  describe('getRepo', () => {
    it('should return repo info', async () => {
      vi.mocked(execSync).mockReturnValue(JSON.stringify({
        defaultBranchRef: { name: 'main' }
      }));

      const repoInfo = await client.getRepo();

      expect(repoInfo.owner).toBe('test-owner');
      expect(repoInfo.repo).toBe('test-repo');
      expect(repoInfo.defaultBranch).toBe('main');
    });
  });
});
