import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ipcMain, shell } from 'electron';
import type { TaskMetadataFile } from './dashboard-utils';
import { determineStatus, type WorktreeStatus } from './worktrees-utils';

const execFileAsync = promisify(execFile);
const PROJECT_ROOT = process.cwd();
const WORKTREE_BASE = path.join(PROJECT_ROOT, '.worktrees');
const TASKS_DIR = path.join(PROJECT_ROOT, '.miyabi', 'tasks');

export interface WorktreeSummary {
  id: string;
  name: string;
  path: string;
  branch: string;
  head?: string;
  status: WorktreeStatus;
  lastAccessed: string;
  diskUsageMb: number;
  issueNumber?: number | null;
  agentName?: string | null;
  dirty: boolean;
}

interface RawCommit {
  sha: string;
  parents: string[];
  refs: string[];
  message: string;
  date: number;
}

interface LocalBranchHead {
  name: string;
  commit: string;
}

export interface WorktreeGraphCommit {
  sha: string;
  parents: string[];
  message: string;
  date: number;
  branches: string[];
  isWorktreeHead: boolean;
  worktree?: WorktreeSummary;
}

export interface WorktreeGraphData {
  commits: WorktreeGraphCommit[];
  branches: string[];
  worktrees: WorktreeSummary[];
}

interface GitWorktreeInfo {
  path: string;
  branch?: string;
  head?: string;
}

async function isDirectory(target: string) {
  try {
    const stats = await fs.stat(target);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
}

async function fileExists(target: string) {
  try {
    await fs.access(target);
    return true;
  } catch (error) {
    return false;
  }
}

async function getGitWorktrees(): Promise<GitWorktreeInfo[]> {
  try {
    const { stdout } = await execFileAsync('git', ['worktree', 'list', '--porcelain'], {
      cwd: PROJECT_ROOT,
    });

    const lines = stdout.split(/\r?\n/);
    const results: GitWorktreeInfo[] = [];
    let current: GitWorktreeInfo | null = null;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        if (current) {
          results.push(current);
          current = null;
        }
        continue;
      }

      if (line.startsWith('worktree ')) {
        if (current) results.push(current);
        current = { path: line.slice('worktree '.length) };
      } else if (line.startsWith('branch ') && current) {
        const branch = line.slice('branch '.length);
        current.branch = branch.replace('refs/heads/', '');
      } else if (line.startsWith('HEAD ') && current) {
        current.head = line.slice('HEAD '.length);
      }
    }

    if (current) results.push(current);
    return results;
  } catch (error) {
    console.warn('[worktrees] Failed to run git worktree list', error);
    return [];
  }
}

async function readTaskMetadata(): Promise<TaskMetadataFile[]> {
  try {
    const files = await fs.readdir(TASKS_DIR);
    const tasks = await Promise.all(
      files
        .filter((f) => f.endsWith('.json'))
        .map(async (file) => {
          try {
            const contents = await fs.readFile(path.join(TASKS_DIR, file), 'utf-8');
            return JSON.parse(contents) as TaskMetadataFile;
          } catch (error) {
            console.warn('[worktrees] Failed to parse task metadata', file, error);
            return null;
          }
        })
    );
    return tasks.filter((task): task is TaskMetadataFile => Boolean(task));
  } catch {
    return [];
  }
}

function extractIssueNumber(name: string): number | null {
  const match = name.match(/issue[-_]?([0-9]+)/i) ?? name.match(/([0-9]+)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

async function getDirectorySizeMb(target: string): Promise<number> {
  async function walk(dir: string): Promise<number> {
    let total = 0;
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const resolved = path.join(dir, entry.name);
      try {
        const stats = await fs.stat(resolved);
        if (stats.isDirectory()) {
          total += await walk(resolved);
        } else {
          total += stats.size;
        }
      } catch (error) {
        // Ignore errors for individual files
      }
    }
    return total;
  }

  try {
    const bytes = await walk(target);
    return Math.round((bytes / 1024 / 1024) * 10) / 10;
  } catch (error) {
    return 0;
  }
}

export async function listWorktrees(): Promise<WorktreeSummary[]> {
  const gitWorktrees = await getGitWorktrees();
  if (!gitWorktrees.length) {
    const exists = await isDirectory(WORKTREE_BASE);
    if (!exists) return [];
  }

  const entries = gitWorktrees.length
    ? gitWorktrees
    : (await fs.readdir(WORKTREE_BASE, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory())
        .map<GitWorktreeInfo>((entry) => ({ path: path.join(WORKTREE_BASE, entry.name), branch: entry.name }));
  const tasks = await readTaskMetadata();

  const summaries: WorktreeSummary[] = [];
  for (const entry of entries) {
    const worktreePath = path.isAbsolute(entry.path) ? entry.path : path.join(WORKTREE_BASE, entry.path);
    const name = path.basename(worktreePath);

    try {
      const stats = await fs.stat(worktreePath);
      const lastAccessed = stats.mtime;
      const diskUsageMb = await getDirectorySizeMb(worktreePath);
      const issueNumber = extractIssueNumber(name);
      const indexLockExists = await fileExists(path.join(worktreePath, '.git', 'index.lock'));
      const dirty = await gitIsDirty(worktreePath);

      const relatedTask = tasks.find((task) => {
        if (task.worktree_path && path.normalize(task.worktree_path) === path.normalize(worktreePath)) {
          return true;
        }
        if (task.issue_number && issueNumber && task.issue_number === issueNumber) {
          return true;
        }
        return false;
      });

      summaries.push({
        id: worktreePath,
        name,
        path: worktreePath,
        branch: entry.branch ?? name,
        head: entry.head,
        status: determineStatus(relatedTask ?? null, indexLockExists, lastAccessed),
        lastAccessed: lastAccessed.toISOString(),
        diskUsageMb,
        issueNumber: relatedTask?.issue_number ?? issueNumber,
        agentName: relatedTask?.agent ?? null,
        dirty,
      });
    } catch (error) {
      console.warn('[worktrees] Failed to read worktree', worktreePath, error);
    }
  }

  return summaries.sort((a, b) => b.lastAccessed.localeCompare(a.lastAccessed));
}

export async function cleanupWorktree(worktreePath: string) {
  try {
    await execFileAsync('git', ['worktree', 'remove', '--force', worktreePath], {
      cwd: PROJECT_ROOT,
    });
    return { success: true };
  } catch (error) {
    console.error('[worktrees] Failed to remove worktree', worktreePath, error);
    return { success: false, message: String(error) };
  }
}

export async function openWorktree(worktreePath: string) {
  try {
    const result = await shell.openPath(worktreePath);
    if (result && result.length > 0) {
      console.error('[worktrees] Failed to open worktree', worktreePath, result);
      return { success: false, message: result };
    }
    return { success: true };
  } catch (error) {
    console.error('[worktrees] Failed to open worktree', worktreePath, error);
    return { success: false, message: String(error) };
  }
}

async function gitIsDirty(worktreePath: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync('git', ['status', '--porcelain'], {
      cwd: worktreePath,
    });
    return stdout.trim().length > 0;
  } catch (error) {
    console.warn('[worktrees] git status failed', worktreePath, error);
    return false;
  }
}

async function getLocalBranches(): Promise<LocalBranchHead[]> {
  try {
    const { stdout } = await execFileAsync('git', [
      'for-each-ref',
      '--format=%(refname:short)|%(objectname)',
      'refs/heads',
    ], {
      cwd: PROJECT_ROOT,
    });

    return stdout
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const [name, commit] = line.split('|');
        return { name: name.trim(), commit: (commit ?? '').trim() };
      })
      .filter((entry) => entry.name && entry.commit);
  } catch (error) {
    console.warn('[worktrees] Failed to list branches', error);
    return [];
  }
}

async function getCommitHistory(limit = 150): Promise<RawCommit[]> {
  const format = '%H%x09%P%x09%D%x09%s%x09%ct';
  try {
    const { stdout } = await execFileAsync(
      'git',
      ['log', `--max-count=${limit}`, '--date-order', `--pretty=format:${format}`],
      { cwd: PROJECT_ROOT }
    );

    return stdout
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const [sha, parentsStr, refsStr, message, timestamp] = line.split('\t');
        return {
          sha,
          parents: parentsStr ? parentsStr.split(' ').filter(Boolean) : [],
          refs: refsStr ? refsStr.split(',').map((ref) => ref.trim()).filter(Boolean) : [],
          message,
          date: Number(timestamp ?? 0) * 1000,
        } as RawCommit;
      });
  } catch (error) {
    console.warn('[worktrees] Failed to read git log', error);
    return [];
  }
}

export async function getWorktreeGraph(): Promise<WorktreeGraphData> {
  const [worktrees, branches, commits] = await Promise.all([
    listWorktrees(),
    getLocalBranches(),
    getCommitHistory(),
  ]);

  const branchNames = branches.map((b) => b.name);
  const branchByCommit = new Map<string, string[]>();
  branches.forEach((entry) => {
    const list = branchByCommit.get(entry.commit) ?? [];
    list.push(entry.name);
    branchByCommit.set(entry.commit, list);
  });

  const worktreeByHead = new Map<string, WorktreeSummary>();
  worktrees.forEach((wt) => {
    if (wt.head) {
      worktreeByHead.set(wt.head, wt);
    }
  });

  const commitsWithWorktrees: WorktreeGraphCommit[] = commits.map((commit) => {
    const worktree = worktreeByHead.get(commit.sha);
    return {
      sha: commit.sha,
      parents: commit.parents,
      message: commit.message,
      date: commit.date,
      branches: branchByCommit.get(commit.sha) ?? commit.refs.filter((ref) => ref && !ref.startsWith('origin/')),
      isWorktreeHead: Boolean(worktree),
      worktree,
    };
  });

  return {
    commits: commitsWithWorktrees,
    branches: branchNames,
    worktrees,
  };
}

export function registerWorktreeHandlers() {
  ipcMain.handle('worktrees:list', async () => {
    return listWorktrees();
  });

  ipcMain.handle('worktrees:cleanup', async (_event, worktreePath: string) => {
    return cleanupWorktree(worktreePath);
  });

  ipcMain.handle('worktrees:open', async (_event, worktreePath: string) => {
    return openWorktree(worktreePath);
  });

  ipcMain.handle('worktrees:copyPath', async (_event, worktreePath: string) => {
    try {
      const { clipboard } = await import('electron');
      clipboard.writeText(worktreePath);
      return { success: true, message: 'Path copied to clipboard' };
    } catch (error) {
      console.error('[worktrees] Failed to copy path:', error);
      return { success: false, message: 'Failed to copy path' };
    }
  });

  ipcMain.handle('worktrees:graph', async () => {
    return getWorktreeGraph();
  });
}
