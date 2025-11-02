import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { ipcMain } from 'electron';
import {
  deriveAgentStats,
  deriveHistoryStats,
  deriveIssueStats,
  type AgentExecutionSummary,
  type IssueSummary,
  type TaskMetadataFile,
  type TaskRunSummary,
} from './dashboard-utils';

export interface DashboardSnapshot {
  worktrees: {
    total: number;
    active: number;
    idle: number;
    stuck: number;
    orphaned: number;
    lastUpdated: string;
  };
  agents: {
    total: number;
    active: number;
    inactive: number;
    uniqueAgents: number;
    recentlyExecuted: AgentExecutionSummary[];
  };
  issues: {
    open: number;
    inProgress: number;
    done: number;
    topPriority: IssueSummary[];
  };
  history: {
    recentRuns: TaskRunSummary[];
    successRate: number;
    avgDurationSec: number;
  };
  system: {
    platform: string;
    arch: string;
    cpuCores: number;
    totalMemoryGb: number;
    freeMemoryGb: number;
    uptimeHours: number;
  };
}

const PROJECT_ROOT = process.cwd();

async function getWorktreeStats(): Promise<DashboardSnapshot['worktrees']> {
  const worktreeBase = path.join(PROJECT_ROOT, '.worktrees');
  let total = 0;
  try {
    const entries = await fs.readdir(worktreeBase, { withFileTypes: true });
    total = entries.filter((entry) => entry.isDirectory()).length;
  } catch (error) {
    // Directory might not exist yet; treat as zero worktrees.
  }

  return {
    total,
    active: 0,
    idle: total,
    stuck: 0,
    orphaned: 0,
    lastUpdated: new Date().toISOString(),
  };
}

async function readTaskMetadata(): Promise<TaskMetadataFile[]> {
  const tasksDir = path.join(PROJECT_ROOT, '.miyabi', 'tasks');
  try {
    const files = await fs.readdir(tasksDir);
    const jsonFiles = files.filter((file) => file.endsWith('.json'));

    const tasks = await Promise.all(
      jsonFiles.map(async (file) => {
        try {
          const contents = await fs.readFile(path.join(tasksDir, file), 'utf-8');
          return JSON.parse(contents) as TaskMetadataFile;
        } catch (error) {
          console.warn(`[dashboard] Failed to read task metadata ${file}:`, error);
          return null;
        }
      })
    );

    return tasks.filter((task): task is TaskMetadataFile => Boolean(task));
  } catch (error) {
    // If directory does not exist yet, return empty array
    return [];
  }
}

function getSystemStats(): DashboardSnapshot['system'] {
  const totalMemoryGb = os.totalmem() / 1024 / 1024 / 1024;
  const freeMemoryGb = os.freemem() / 1024 / 1024 / 1024;

  return {
    platform: process.platform,
    arch: process.arch,
    cpuCores: os.cpus().length,
    totalMemoryGb,
    freeMemoryGb,
    uptimeHours: process.uptime() / 3600,
  };
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const [worktrees, tasks] = await Promise.all([getWorktreeStats(), readTaskMetadata()]);

  const history = deriveHistoryStats(tasks);
  const issues = deriveIssueStats(tasks);
  const agents = deriveAgentStats(tasks);
  const system = getSystemStats();

  return {
    worktrees,
    agents,
    issues,
    history,
    system,
  };
}

export function registerDashboardHandlers() {
  ipcMain.handle('dashboard:getSnapshot', async () => {
    try {
      return await getDashboardSnapshot();
    } catch (error) {
      console.error('[dashboard] Failed to compute snapshot:', error);
      throw error;
    }
  });
}
