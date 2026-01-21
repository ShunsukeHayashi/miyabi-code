/**
 * GitHubOps Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { IssueManager, IssueTemplatePresets } from '../../src/githubops/issue-manager.js';
import { BranchNamer } from '../../src/githubops/branch.js';
import { CommitFormatter, COMMIT_TYPES } from '../../src/githubops/commit.js';
import { PRTemplateGenerator, PRTemplatePresets } from '../../src/githubops/pr-template.js';
import type { GitHubIssue } from '../../src/types.js';

describe('IssueManager', () => {
  let manager: IssueManager;
  let mockGitHub: {
    listIssues: ReturnType<typeof vi.fn>;
    getIssue: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockGitHub = {
      listIssues: vi.fn(),
      getIssue: vi.fn()
    };
    manager = new IssueManager(mockGitHub as any);
  });

  describe('classifyIssue', () => {
    it('should classify bug issue', async () => {
      const issue: GitHubIssue = {
        number: 1,
        title: 'Bug: crash on startup',
        body: 'The application crashes when starting',
        state: 'open',
        labels: []
      };

      const result = await manager.classifyIssue(issue);
      expect(result.type).toBe('bug');
      expect(result.priority).toBe('P0');
    });

    it('should classify feature request', async () => {
      const issue: GitHubIssue = {
        number: 2,
        title: 'Feature: add dark mode',
        body: 'Add dark mode support',
        state: 'open',
        labels: []
      };

      const result = await manager.classifyIssue(issue);
      expect(result.type).toBe('feature');
    });

    it('should classify documentation issue', async () => {
      const issue: GitHubIssue = {
        number: 3,
        title: 'Update README',
        body: 'Need to update installation docs',
        state: 'open',
        labels: []
      };

      const result = await manager.classifyIssue(issue);
      expect(result.type).toBe('documentation');
    });
  });

  describe('generateTemplate', () => {
    it('should generate bug report template', () => {
      const template = manager.generateTemplate('bug', IssueTemplatePresets.bugReport());
      expect(template).toContain('バグ報告');
      expect(template).toContain('再現手順');
      expect(template).toContain('環境情報');
    });

    it('should generate feature request template', () => {
      const template = manager.generateTemplate('feature', IssueTemplatePresets.featureRequest());
      expect(template).toContain('機能要望');
      expect(template).toContain('受入条件');
    });
  });
});

describe('BranchNamer', () => {
  const namer = new BranchNamer();

  describe('generateFromIssue', () => {
    it('should generate feature branch name', () => {
      const issue: GitHubIssue = {
        number: 123,
        title: 'Add user authentication',
        body: '',
        state: 'open',
        labels: []
      };

      const branchName = namer.generateFromIssue(issue, 'feature');
      expect(branchName).toBe('feature/issue-123-add-user-authentication');
    });

    it('should generate fix branch name', () => {
      const issue: GitHubIssue = {
        number: 456,
        title: 'Fix login timeout bug',
        body: '',
        state: 'open',
        labels: []
      };

      const branchName = namer.generateFromIssue(issue, 'fix');
      expect(branchName).toBe('fix/issue-456-fix-login-timeout-bug');
    });

    it('should truncate long descriptions', () => {
      const issue: GitHubIssue = {
        number: 789,
        title: 'This is a very long issue title that should be truncated to fit within the branch name length limit',
        body: '',
        state: 'open',
        labels: []
      };

      const branchName = namer.generateFromIssue(issue, 'feature');
      expect(branchName.length).toBeLessThan(100);
      expect(branchName).toContain('feature/issue-789-');
    });
  });

  describe('validate', () => {
    it('should accept valid branch name', () => {
      const result = namer.validate('feature/test-branch');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject branch starting with dot', () => {
      const result = namer.validate('.hidden');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('先頭にドットまたはハイフンは使用できません');
    });

    it('should reject branch with forbidden characters', () => {
      const result = namer.validate('feature/test:branch');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('禁止文字'))).toBe(true);
    });

    it('should reject branch starting with hyphen', () => {
      const result = namer.validate('-test-branch');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('先頭にドットまたはハイフンは使用できません');
    });
  });
});

describe('CommitFormatter', () => {
  const formatter = new CommitFormatter();

  describe('parse', () => {
    it('should parse conventional commit', () => {
      const commit = formatter.parse('feat(auth): add login support');
      expect(commit).toBeTruthy();
      expect(commit?.type).toBe('feat');
      expect(commit?.scope).toBe('auth');
      expect(commit?.subject).toBe('add login support');
    });

    it('should parse commit without scope', () => {
      const commit = formatter.parse('fix: resolve memory leak');
      expect(commit?.type).toBe('fix');
      expect(commit?.scope).toBeUndefined();
      expect(commit?.subject).toBe('resolve memory leak');
    });

    it('should return null for invalid format', () => {
      const commit = formatter.parse('not a conventional commit');
      expect(commit).toBeNull();
    });

    it('should parse commit with body', () => {
      const commit = formatter.parse('feat: add feature\n\nThis adds a new feature');
      expect(commit?.body).toBe('This adds a new feature');
    });
  });

  describe('format', () => {
    it('should format conventional commit', () => {
      const commit = {
        type: 'feat' as const,
        scope: 'auth',
        subject: 'add login',
        body: 'Implementation'
      };
      const formatted = formatter.format(commit);
      expect(formatted).toBe('feat(auth): add login\n\nImplementation');
    });

    it('should format without scope', () => {
      const commit = {
        type: 'fix' as const,
        subject: 'bug fix'
      };
      const formatted = formatter.format(commit);
      expect(formatted).toBe('fix: bug fix');
    });
  });

  describe('validate', () => {
    it('should accept valid conventional commit', () => {
      const result = formatter.validate('feat: add feature');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid type', () => {
      const result = formatter.validate('invalid: no type');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject missing subject', () => {
      const result = formatter.validate('feat:');
      expect(result.valid).toBe(false);
    });
  });
});

describe('PRTemplateGenerator', () => {
  const generator = new PRTemplateGenerator();

  describe('generateBody', () => {
    it('should generate standard PR template', () => {
      const changes = {
        summary: 'Add new feature',
        changes: ['Add component', 'Add tests'],
        files: ['src/component.ts', 'src/component.test.ts']
      };

      const body = generator.generateBody(123, changes, PRTemplatePresets.standard());

      expect(body).toContain('## Summary');
      expect(body).toContain('Add new feature');
      expect(body).toContain('## Changes');
      expect(body).toContain('## Related Issues');
      expect(body).toContain('#123');
      expect(body).toContain('## Testing');
      expect(body).toContain('## Checklist');
    });

    it('should include breaking changes section', () => {
      const changes = {
        summary: 'Breaking change',
        changes: ['Update API'],
        files: ['src/api.ts'],
        breaking: true,
        notes: 'Old API is removed'
      };

      const body = generator.generateBody(456, changes, PRTemplatePresets.breaking());

      expect(body).toContain('## ⚠️ Breaking Changes');
    });

    it('should include screenshots for UI/UX', () => {
      const changes = {
        summary: 'UI update',
        changes: ['Update styles'],
        files: ['src/styles.css']
      };

      const body = generator.generateBody(789, changes, PRTemplatePresets.uiUx());

      expect(body).toContain('## Screenshots');
    });
  });
});
