/* @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { deriveHistoryStats, deriveIssueStats, type TaskMetadataFile } from './dashboard-utils';

describe('dashboard service helpers', () => {
  const sampleTasks: TaskMetadataFile[] = [
    {
      id: 'task-1',
      issue_number: 101,
      title: 'Implement feature',
      agent: 'CodeGenAgent',
      status: 'success',
      created_at: '2025-10-30T10:00:00Z',
      started_at: '2025-10-30T10:05:00Z',
      completed_at: '2025-10-30T10:10:00Z',
      duration_secs: 300,
      success: true,
    },
    {
      id: 'task-2',
      issue_number: 101,
      title: 'Implement feature',
      agent: 'ReviewAgent',
      status: 'failed',
      created_at: '2025-10-30T10:15:00Z',
      started_at: '2025-10-30T10:20:00Z',
      completed_at: '2025-10-30T10:25:00Z',
      duration_secs: 300,
      success: false,
    },
    {
      id: 'task-3',
      issue_number: 202,
      title: 'Fix bug',
      agent: 'FixAgent',
      status: 'running',
      created_at: '2025-10-31T09:00:00Z',
      started_at: '2025-10-31T09:05:00Z',
      duration_secs: null,
      success: null,
    },
  ];

  it('derives history stats', () => {
    const stats = deriveHistoryStats(sampleTasks);
    expect(stats.recentRuns).toHaveLength(3);
    expect(stats.successRate).toBeCloseTo(1 / 3, 5);
    expect(stats.avgDurationSec).toBeCloseTo(300);
  });

  it('derives issue stats', () => {
    const issues = deriveIssueStats(sampleTasks);
    expect(issues.open).toBe(0);
    expect(issues.inProgress).toBe(2);
    expect(issues.done).toBe(0);
    expect(issues.topPriority[0].issueNumber).toBe(202);
  });
});
