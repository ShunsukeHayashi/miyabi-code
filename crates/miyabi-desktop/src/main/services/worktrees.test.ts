/* @vitest-environment node */
import { describe, expect, it } from 'vitest';
import type { TaskMetadataFile } from './dashboard-utils';
import { determineStatus } from './worktrees-utils';

describe('worktrees determineStatus', () => {
  const baseTask: TaskMetadataFile = {
    id: 'task-1',
    title: 'Example',
    status: 'success',
  };

  it('returns stuck when lock exists', () => {
    const status = determineStatus(baseTask, true, new Date());
    expect(status).toBe('stuck');
  });

  it('returns active when task running recently', () => {
    const task: TaskMetadataFile = {
      ...baseTask,
      status: 'running',
      started_at: new Date().toISOString(),
    };
    const status = determineStatus(task, false, new Date(Date.now() - 30 * 60 * 1000));
    expect(status).toBe('active');
  });

  it('returns stuck if running task is stale', () => {
    const task: TaskMetadataFile = {
      ...baseTask,
      status: 'running',
      started_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    };
    const status = determineStatus(task, false, new Date());
    expect(status).toBe('stuck');
  });

  it('returns active when recently modified', () => {
    const status = determineStatus(null, false, new Date(Date.now() - 15 * 60 * 1000));
    expect(status).toBe('active');
  });

  it('returns idle otherwise', () => {
    const status = determineStatus(null, false, new Date(Date.now() - 3 * 60 * 60 * 1000));
    expect(status).toBe('idle');
  });
});
