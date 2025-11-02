import type { TaskMetadataFile } from './dashboard-utils';

export type WorktreeStatus = 'active' | 'idle' | 'stuck';

export function determineStatus(
  task: TaskMetadataFile | null,
  hasLock: boolean,
  lastAccessed: Date
): WorktreeStatus {
  if (hasLock) return 'stuck';

  const taskStatus = task?.status?.toLowerCase?.();
  if (taskStatus === 'running') {
    const startedAt = task?.started_at ? Date.parse(task.started_at) : undefined;
    if (Number.isFinite(startedAt)) {
      const hoursElapsed = (Date.now() - (startedAt as number)) / (1000 * 60 * 60);
      if (hoursElapsed > 6) {
        return 'stuck';
      }
    }
    return 'active';
  }

  const diffMs = Date.now() - lastAccessed.getTime();
  const hourMs = 60 * 60 * 1000;
  if (diffMs <= hourMs) return 'active';

  return 'idle';
}
