export interface TaskMetadataFile {
  id: string;
  issue_number?: number | null;
  title: string;
  agent?: string | null;
  status: string;
  created_at?: string;
  started_at?: string | null;
  completed_at?: string | null;
  duration_secs?: number | null;
  success?: boolean | null;
  error_message?: string | null;
  worktree_path?: string | null;
}

export interface AgentExecutionSummary {
  taskId: string;
  agentName: string;
  status: string;
  completedAt?: string;
  durationSec?: number | null;
}

export interface IssueSummary {
  issueNumber: number;
  title: string;
  status: 'open' | 'in_progress' | 'done';
  lastUpdated: string;
  agentName?: string | null;
}

export interface TaskRunSummary {
  id: string;
  issueNumber?: number | null;
  agentName?: string | null;
  status: string;
  completedAt?: string;
  durationSec?: number | null;
}

export function deriveHistoryStats(tasks: TaskMetadataFile[]) {
  if (!tasks.length) {
    return {
      recentRuns: [] as TaskRunSummary[],
      successRate: 0,
      avgDurationSec: 0,
    };
  }

  const completedTasks = tasks.filter((task) =>
    ['success', 'failed', 'cancelled'].includes(task.status?.toLowerCase?.() ?? '')
  );

  const successCount = tasks.filter((task) => task.success === true).length;
  const successRate = tasks.length > 0 ? successCount / tasks.length : 0;

  const durations = completedTasks
    .map((task) => task.duration_secs ?? 0)
    .filter((duration) => typeof duration === 'number' && duration > 0);
  const avgDurationSec = durations.length
    ? durations.reduce((acc, cur) => acc + cur, 0) / durations.length
    : 0;

  const recentRuns: TaskRunSummary[] = [...tasks]
    .sort((a, b) => {
      const aTime = a.completed_at ?? a.started_at ?? a.created_at ?? '';
      const bTime = b.completed_at ?? b.started_at ?? b.created_at ?? '';
      return bTime.localeCompare(aTime);
    })
    .slice(0, 5)
    .map((task) => ({
      id: task.id,
      issueNumber: task.issue_number ?? null,
      agentName: task.agent ?? null,
      status: task.status,
      completedAt: task.completed_at ?? task.started_at ?? task.created_at,
      durationSec: task.duration_secs ?? null,
    }));

  return {
    recentRuns,
    successRate,
    avgDurationSec,
  };
}

export function deriveIssueStats(tasks: TaskMetadataFile[]) {
  if (!tasks.length) {
    return {
      open: 0,
      inProgress: 0,
      done: 0,
      topPriority: [] as IssueSummary[],
    };
  }

  const issues = new Map<number, IssueSummary>();

  tasks.forEach((task) => {
    if (typeof task.issue_number !== 'number') {
      return;
    }

    const existing = issues.get(task.issue_number);
    const completedAt = task.completed_at ?? task.started_at ?? task.created_at ?? new Date().toISOString();

    const status = (() => {
      const normalized = task.status?.toLowerCase?.() ?? '';
      if (normalized === 'success') return 'done';
      if (normalized === 'running') return 'in_progress';
      if (normalized === 'failed' || normalized === 'cancelled') return 'in_progress';
      return 'open';
    })();

    const candidate: IssueSummary = {
      issueNumber: task.issue_number,
      title: task.title ?? `Issue #${task.issue_number}`,
      status,
      lastUpdated: completedAt,
      agentName: task.agent ?? null,
    };

    if (!existing) {
      issues.set(task.issue_number, candidate);
      return;
    }

    if (existing.lastUpdated < completedAt) {
      issues.set(task.issue_number, candidate);
    }

    const statusRank = {
      open: 0,
      in_progress: 1,
      done: 2,
    } as const;
    if (statusRank[candidate.status] > statusRank[existing.status]) {
      issues.set(task.issue_number, candidate);
    }
  });

  let open = 0;
  let inProgress = 0;
  let done = 0;
  issues.forEach((issue) => {
    if (issue.status === 'done') done += 1;
    else if (issue.status === 'in_progress') inProgress += 1;
    else open += 1;
  });

  const topPriority = [...issues.values()]
    .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
    .slice(0, 5);

  return {
    open,
    inProgress,
    done,
    topPriority,
  };
}

export function deriveAgentStats(tasks: TaskMetadataFile[]) {
  const agentNames = new Set<string>();
  tasks.forEach((task) => {
    if (task.agent) {
      agentNames.add(task.agent);
    }
  });

  const recentlyExecuted: AgentExecutionSummary[] = [...tasks]
    .filter((task) => Boolean(task.agent))
    .sort((a, b) => {
      const aTime = a.completed_at ?? a.started_at ?? a.created_at ?? '';
      const bTime = b.completed_at ?? b.started_at ?? b.created_at ?? '';
      return bTime.localeCompare(aTime);
    })
    .slice(0, 5)
    .map((task) => ({
      taskId: task.id,
      agentName: task.agent ?? 'UnknownAgent',
      status: task.status,
      completedAt: task.completed_at ?? task.started_at ?? task.created_at,
      durationSec: task.duration_secs ?? null,
    }));

  return {
    total: agentNames.size,
    active: 0,
    inactive: agentNames.size,
    uniqueAgents: agentNames.size,
    recentlyExecuted,
  };
}
