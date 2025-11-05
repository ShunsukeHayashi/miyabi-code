import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { WorktreesView } from '../Worktrees';
import type { WorktreeGraph } from '../../types/worktrees';

const fetchWorktreeGraphMock = vi.fn<[], Promise<WorktreeGraph | null>>();

vi.mock('../../lib/worktree-api', () => ({
  fetchWorktreeGraph: () => fetchWorktreeGraphMock(),
}));

vi.mock('../../components/WorktreeGraph', () => ({
  WorktreeGraphCanvas: ({ graph }: { graph: WorktreeGraph }) => (
    <div data-testid="graph-placeholder">Graph nodes: {graph.nodes.length}</div>
  ),
}));

const sampleGraph: WorktreeGraph = {
  nodes: [
    {
      kind: 'branch',
      id: 'branch:main',
      label: 'main',
      branch: {
        name: 'main',
        head: 'abcdef1234567890',
        upstream: 'origin/main',
        latest_commit_time: new Date('2025-11-01T12:00:00Z').toISOString(),
      },
    },
    {
      kind: 'worktree',
      id: 'worktree:/tmp/issue-1',
      label: 'issue-1',
      worktree: {
        path: '/tmp/issue-1',
        branch: 'feature/issue-1',
        head: '1234567890abcdef',
        base_commit: 'abcdef1234567890',
        status: 'active',
        locked_reason: null,
        issue_number: 1,
        agent: { agent_name: 'CodeGenAgent', agent_type: 'codegen', execution_mode: 'automated' },
        last_commit_time: new Date('2025-11-01T12:00:00Z').toISOString(),
      },
    },
    {
      kind: 'worktree',
      id: 'worktree:/tmp/issue-42',
      label: 'issue-42',
      worktree: {
        path: '/tmp/issue-42',
        branch: 'feature/issue-42',
        head: 'fedcba0987654321',
        base_commit: 'abcdef1234567890',
        status: 'stale',
        locked_reason: null,
        issue_number: 42,
        agent: null,
        last_commit_time: new Date('2025-10-01T10:00:00Z').toISOString(),
      },
    },
  ],
  edges: [
    {
      id: 'edge:branch:main->worktree:/tmp/issue-1',
      from: 'branch:main',
      to: 'worktree:/tmp/issue-1',
      kind: 'branch_worktree',
    },
    {
      id: 'edge:branch:main->worktree:/tmp/issue-42',
      from: 'branch:main',
      to: 'worktree:/tmp/issue-42',
      kind: 'branch_worktree',
    },
  ],
  metadata: {
    generated_at: new Date('2025-11-01T12:00:00Z').toISOString(),
    repo_root: '/tmp/repo',
    branch_count: 1,
    worktree_count: 2,
  },
};

describe('WorktreesView', () => {
  beforeEach(() => {
    fetchWorktreeGraphMock.mockResolvedValue(sampleGraph);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders list view and applies filters', async () => {
    render(<WorktreesView />);

    await waitFor(() => expect(fetchWorktreeGraphMock).toHaveBeenCalled());

    expect(screen.getByText(/Worktrees Overview/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /List/i }));

    await screen.findByText('issue-1');
    expect(screen.queryByText('issue-42')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(/Active only/i));
    expect(await screen.findByText('issue-42')).toBeInTheDocument();

    const issueFilterInput = screen.getByPlaceholderText('Filter by issue #');
    fireEvent.change(issueFilterInput, { target: { value: '42' } });
    expect(await screen.findByText('issue-42')).toBeInTheDocument();
    expect(screen.queryByText('issue-1')).not.toBeInTheDocument();
  });
});
