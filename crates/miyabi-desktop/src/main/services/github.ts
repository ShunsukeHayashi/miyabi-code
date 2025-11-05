import { ipcMain } from 'electron';
import { Octokit } from '@octokit/rest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

/**
 * GitHub Issue data structure
 */
export interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  labels: string[];
  assignees: string[];
  milestone: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
  comments: number;
  pull_request?: {
    url: string;
  };
}

/**
 * Issue filter options
 */
export interface IssueFilter {
  state?: 'open' | 'closed' | 'all';
  labels?: string[];
  assignee?: string;
  milestone?: string;
  search?: string;
}

/**
 * GitHub Service
 * Manages GitHub API integration and local issue caching
 */
class GitHubService {
  private octokit: Octokit | null = null;
  private db: Database.Database | null = null;
  private owner: string | null = null;
  private repo: string | null = null;
  private readonly dbPath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'miyabi-issues.db');
  }

  /**
   * Initialize GitHub service with token and repository
   */
  async initialize(token: string, repository: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Parse repository (format: owner/repo)
      const [owner, repo] = repository.split('/');
      if (!owner || !repo) {
        return { success: false, error: 'Invalid repository format. Expected: owner/repo' };
      }

      this.owner = owner;
      this.repo = repo;

      // Initialize Octokit
      this.octokit = new Octokit({ auth: token });

      // Verify credentials
      const { data: user } = await this.octokit.users.getAuthenticated();
      console.log(`[GitHub] Authenticated as ${user.login}`);

      // Initialize database
      this.initializeDatabase();

      // Perform initial sync
      await this.syncIssues();

      return { success: true };
    } catch (error) {
      console.error('[GitHub] Initialization failed:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Initialize SQLite database for issue caching
   */
  private initializeDatabase(): void {
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(this.dbPath);

    // Create issues table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS issues (
        number INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT,
        state TEXT NOT NULL,
        labels TEXT NOT NULL,
        assignees TEXT NOT NULL,
        milestone TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        closed_at TEXT,
        html_url TEXT NOT NULL,
        user_login TEXT NOT NULL,
        user_avatar_url TEXT NOT NULL,
        comments INTEGER NOT NULL,
        is_pull_request INTEGER NOT NULL,
        synced_at TEXT NOT NULL
      )
    `);

    // Create indexes for faster queries
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_issues_state ON issues(state);
      CREATE INDEX IF NOT EXISTS idx_issues_updated_at ON issues(updated_at);
      CREATE INDEX IF NOT EXISTS idx_issues_labels ON issues(labels);
    `);

    console.log('[GitHub] Database initialized at:', this.dbPath);
  }

  /**
   * Sync issues from GitHub to local cache
   */
  async syncIssues(): Promise<{ success: boolean; synced: number; error?: string }> {
    if (!this.octokit || !this.owner || !this.repo || !this.db) {
      return { success: false, synced: 0, error: 'GitHub service not initialized' };
    }

    try {
      console.log(`[GitHub] Syncing issues from ${this.owner}/${this.repo}...`);

      let syncedCount = 0;
      let page = 1;
      const perPage = 100;

      while (true) {
        const { data: issues } = await this.octokit.issues.listForRepo({
          owner: this.owner,
          repo: this.repo,
          state: 'all',
          per_page: perPage,
          page,
          sort: 'updated',
          direction: 'desc',
        });

        if (issues.length === 0) break;

        // Insert or update issues in database
        const insertStmt = this.db.prepare(`
          INSERT OR REPLACE INTO issues (
            number, title, body, state, labels, assignees, milestone,
            created_at, updated_at, closed_at, html_url,
            user_login, user_avatar_url, comments, is_pull_request, synced_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const insertMany = this.db.transaction((issues: any[]) => {
          for (const issue of issues) {
            insertStmt.run(
              issue.number,
              issue.title,
              issue.body || '',
              issue.state,
              JSON.stringify(issue.labels.map((l: any) => l.name)),
              JSON.stringify(issue.assignees.map((a: any) => a.login)),
              issue.milestone?.title || null,
              issue.created_at,
              issue.updated_at,
              issue.closed_at,
              issue.html_url,
              issue.user?.login || 'unknown',
              issue.user?.avatar_url || '',
              issue.comments,
              issue.pull_request ? 1 : 0,
              new Date().toISOString()
            );
          }
        });

        insertMany(issues);
        syncedCount += issues.length;

        console.log(`[GitHub] Synced page ${page}, total: ${syncedCount} issues`);

        if (issues.length < perPage) break;
        page++;
      }

      console.log(`[GitHub] Sync completed. Total issues synced: ${syncedCount}`);
      return { success: true, synced: syncedCount };
    } catch (error) {
      console.error('[GitHub] Sync failed:', error);
      return { success: false, synced: 0, error: (error as Error).message };
    }
  }

  /**
   * Get issues from local cache with filters
   */
  getIssues(filter: IssueFilter = {}): GitHubIssue[] {
    if (!this.db) {
      return [];
    }

    try {
      let query = 'SELECT * FROM issues WHERE 1=1';
      const params: any[] = [];

      // State filter
      if (filter.state && filter.state !== 'all') {
        query += ' AND state = ?';
        params.push(filter.state);
      }

      // Labels filter
      if (filter.labels && filter.labels.length > 0) {
        const labelConditions = filter.labels.map(() => 'labels LIKE ?').join(' OR ');
        query += ` AND (${labelConditions})`;
        filter.labels.forEach((label) => params.push(`%"${label}"%`));
      }

      // Assignee filter
      if (filter.assignee) {
        query += ' AND assignees LIKE ?';
        params.push(`%"${filter.assignee}"%`);
      }

      // Milestone filter
      if (filter.milestone) {
        query += ' AND milestone = ?';
        params.push(filter.milestone);
      }

      // Search filter (title or body)
      if (filter.search) {
        query += ' AND (title LIKE ? OR body LIKE ?)';
        params.push(`%${filter.search}%`, `%${filter.search}%`);
      }

      // Order by updated_at descending
      query += ' ORDER BY updated_at DESC';

      const stmt = this.db.prepare(query);
      const rows = stmt.all(...params) as any[];

      return rows.map((row) => ({
        number: row.number,
        title: row.title,
        body: row.body || null,
        state: row.state,
        labels: JSON.parse(row.labels),
        assignees: JSON.parse(row.assignees),
        milestone: row.milestone,
        created_at: row.created_at,
        updated_at: row.updated_at,
        closed_at: row.closed_at,
        html_url: row.html_url,
        user: {
          login: row.user_login,
          avatar_url: row.user_avatar_url,
        },
        comments: row.comments,
        pull_request: row.is_pull_request ? { url: '' } : undefined,
      }));
    } catch (error) {
      console.error('[GitHub] Error fetching issues:', error);
      return [];
    }
  }

  /**
   * Get a single issue by number
   */
  async getIssue(issueNumber: number): Promise<{ success: boolean; issue?: GitHubIssue; error?: string }> {
    if (!this.octokit || !this.owner || !this.repo) {
      return { success: false, error: 'GitHub service not initialized' };
    }

    try {
      const { data: issue } = await this.octokit.issues.get({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
      });

      // Update local cache
      if (this.db) {
        const stmt = this.db.prepare(`
          INSERT OR REPLACE INTO issues (
            number, title, body, state, labels, assignees, milestone,
            created_at, updated_at, closed_at, html_url,
            user_login, user_avatar_url, comments, is_pull_request, synced_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
          issue.number,
          issue.title,
          issue.body || '',
          issue.state,
          JSON.stringify(issue.labels.map((l: any) => l.name)),
          JSON.stringify(issue.assignees.map((a: any) => a.login)),
          issue.milestone?.title || null,
          issue.created_at,
          issue.updated_at,
          issue.closed_at,
          issue.html_url,
          issue.user?.login || 'unknown',
          issue.user?.avatar_url || '',
          issue.comments,
          issue.pull_request ? 1 : 0,
          new Date().toISOString()
        );
      }

      return {
        success: true,
        issue: {
          number: issue.number,
          title: issue.title,
          body: issue.body || null,
          state: issue.state as 'open' | 'closed',
          labels: issue.labels.map((l: any) => l.name || ''),
          assignees: issue.assignees.map((a: any) => a.login),
          milestone: issue.milestone?.title || null,
          created_at: issue.created_at,
          updated_at: issue.updated_at,
          closed_at: issue.closed_at,
          html_url: issue.html_url,
          user: {
            login: issue.user?.login || 'unknown',
            avatar_url: issue.user?.avatar_url || '',
          },
          comments: issue.comments,
          pull_request: issue.pull_request ? { url: issue.pull_request.url } : undefined,
        },
      };
    } catch (error) {
      console.error('[GitHub] Error fetching issue:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get available labels
   */
  async getLabels(): Promise<{ success: boolean; labels?: string[]; error?: string }> {
    if (!this.octokit || !this.owner || !this.repo) {
      return { success: false, error: 'GitHub service not initialized' };
    }

    try {
      const { data: labels } = await this.octokit.issues.listLabelsForRepo({
        owner: this.owner,
        repo: this.repo,
      });

      return {
        success: true,
        labels: labels.map((l) => l.name),
      };
    } catch (error) {
      console.error('[GitHub] Error fetching labels:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get available milestones
   */
  async getMilestones(): Promise<{ success: boolean; milestones?: string[]; error?: string }> {
    if (!this.octokit || !this.owner || !this.repo) {
      return { success: false, error: 'GitHub service not initialized' };
    }

    try {
      const { data: milestones } = await this.octokit.issues.listMilestones({
        owner: this.owner,
        repo: this.repo,
        state: 'all',
      });

      return {
        success: true,
        milestones: milestones.map((m) => m.title),
      };
    } catch (error) {
      console.error('[GitHub] Error fetching milestones:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance
const githubService = new GitHubService();

/**
 * Register IPC handlers for GitHub service
 */
export function registerGitHubHandlers(): void {
  // Initialize GitHub service
  ipcMain.handle('github:initialize', async (_, token: string, repository: string) => {
    return await githubService.initialize(token, repository);
  });

  // Sync issues
  ipcMain.handle('github:syncIssues', async () => {
    return await githubService.syncIssues();
  });

  // Get issues with filters
  ipcMain.handle('github:getIssues', async (_, filter: IssueFilter) => {
    try {
      const issues = githubService.getIssues(filter);
      return { success: true, issues };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Get single issue
  ipcMain.handle('github:getIssue', async (_, issueNumber: number) => {
    return await githubService.getIssue(issueNumber);
  });

  // Get labels
  ipcMain.handle('github:getLabels', async () => {
    return await githubService.getLabels();
  });

  // Get milestones
  ipcMain.handle('github:getMilestones', async () => {
    return await githubService.getMilestones();
  });

  console.log('[GitHub] IPC handlers registered');
}

export default githubService;
