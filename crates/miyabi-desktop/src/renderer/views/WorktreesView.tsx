import { useEffect, useMemo, useState } from 'react';
import { useWorktrees } from '../hooks/useWorktrees';
import { useWorktreeGraph } from '../hooks/useWorktreeGraph';
import type { WorktreeSummary, WorktreeStatus } from '../types/electron';
import { WorktreeGraph } from '../components/worktrees/WorktreeGraph';

const STATUS_ORDER: Array<'all' | WorktreeStatus> = ['all', 'active', 'idle', 'stuck'];
const STATUS_LABEL: Record<'all' | WorktreeStatus, string> = {
  all: 'All',
  active: 'Active',
  idle: 'Idle',
  stuck: 'Stuck',
};

interface WorktreesViewProps {
  onCleanup?: (result: { success: boolean; message?: string }) => void;
}

type ViewMode = 'list' | 'graph';

export default function WorktreesView({ onCleanup }: WorktreesViewProps) {
  const { worktrees, filtered, loading, error, filter, setFilter, refresh } = useWorktrees();
  const graph = useWorktreeGraph();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewMode>('list');

  const sourceWorktrees = useMemo(() => {
    if (mode === 'graph' && graph.data) {
      return graph.data.worktrees;
    }
    return worktrees;
  }, [mode, graph.data, worktrees]);

  const fallback = mode === 'graph'
    ? graph.data?.worktrees[0] ?? null
    : filtered[0] ?? null;

  const selected = sourceWorktrees.find((wt) => wt.id === selectedId) ?? fallback;

  useEffect(() => {
    if (!selectedId && sourceWorktrees.length > 0) {
      setSelectedId(sourceWorktrees[0].id);
    }
  }, [selectedId, sourceWorktrees]);

  const handleCleanup = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const result = await window.electron.worktree.cleanup(selected.path);
      setNotification(result.success ? 'Cleanup completed' : result.message ?? 'Cleanup failed');
      onCleanup?.(result);
      await refresh();
      await graph.refresh();
      if (!result.success) return;
      setSelectedId(null);
    } catch (err) {
      setNotification((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleOpen = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const result = await window.electron.worktree.open(selected.path);
      setNotification(result.success ? 'Opened in finder' : result.message ?? 'Failed to open');
    } catch (err) {
      setNotification((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-foreground-muted">Scanning worktrees…</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-danger/10 text-danger rounded-md text-sm">
        Failed to load worktrees: {error.message}
      </div>
    );
  }

  if (worktrees.length === 0) {
    return (
      <div className="p-6 bg-background-light rounded-lg border border-background-lighter text-sm text-foreground-muted">
        No worktrees detected in this project yet. Run <code className="font-mono">miyabi worktree status</code> or
        create a new worktree to get started.
      </div>
    );
  }

  if (mode === 'graph') {
    if (graph.loading) {
      return <div className="text-sm text-foreground-muted">Loading graph…</div>;
    }

    if (graph.error) {
      return (
        <div className="p-4 bg-danger/10 text-danger rounded-md text-sm">
          Failed to load worktree graph: {graph.error.message}
        </div>
      );
    }

    if (!graph.data) {
      return <div className="text-sm text-foreground-muted">No graph data available.</div>;
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <ModeButton label="List" active={mode === 'list'} onClick={() => setMode('list')} />
            <ModeButton label="Graph" active={mode === 'graph'} onClick={() => setMode('graph')} />
          </div>
          <button
            type="button"
            onClick={() => {
              refresh();
              graph.refresh();
            }}
            className="text-xs text-foreground-muted hover:text-foreground"
          >
            Refresh
          </button>
        </div>

        {notification && (
          <div className="p-2 text-xs bg-background-lighter border border-background-lighter rounded">
            {notification}
          </div>
        )}

        <WorktreeGraph
          data={graph.data}
          onSelectWorktree={(id) => setSelectedId(id)}
        />

        <Legend />

        {selected ? (
          <WorktreeDetail worktree={selected} busy={busy} onCleanup={handleCleanup} onOpen={handleOpen} />
        ) : (
          <div className="p-6 bg-background-light border border-background-lighter rounded-lg text-sm text-foreground-muted">
            Select a worktree to view details.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <ModeButton label="List" active={mode === 'list'} onClick={() => setMode('list')} />
            <ModeButton label="Graph" active={mode === 'graph'} onClick={() => setMode('graph')} />
          </div>
          <div className="flex gap-2">
            {STATUS_ORDER.map((status) => (
              <FilterButton
                key={status}
                label={STATUS_LABEL[status]}
                active={filter === status}
                onClick={() => setFilter(status)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={refresh}
            className="text-xs text-foreground-muted hover:text-foreground"
          >
            Refresh
          </button>
        </div>

        <div className="space-y-2">
          {filtered.map((wt) => (
            <WorktreeListItem
              key={wt.id}
              worktree={wt}
              active={wt.id === selected?.id}
              onClick={() => setSelectedId(wt.id)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {notification && (
          <div className="p-2 text-xs bg-background-lighter border border-background-lighter rounded">
            {notification}
          </div>
        )}

        {selected ? (
          <WorktreeDetail
            worktree={selected}
            busy={busy}
            onCleanup={handleCleanup}
            onOpen={handleOpen}
          />
        ) : (
          <div className="p-6 bg-background-light border border-background-lighter rounded-lg text-sm text-foreground-muted">
            Select a worktree to view details.
          </div>
        )}
      </div>
    </div>
  );
}

interface FilterButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterButton({ label, active, onClick }: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-md text-xs transition-colors ${
        active ? 'bg-primary text-white' : 'bg-background-light border border-background-lighter text-foreground-muted hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}

function ModeButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-md text-xs transition-colors ${
        active ? 'bg-primary text-white' : 'bg-background-light border border-background-lighter text-foreground-muted hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}

function Legend() {
  const items: Array<{ label: string; color: string }> = [
    { label: 'Active', color: '#1f6feb' },
    { label: 'Idle', color: '#8b949e' },
    { label: 'Stuck', color: '#f85149' },
  ];

  return (
    <div className="flex gap-4 text-xs text-foreground-muted">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

interface WorktreeListItemProps {
  worktree: WorktreeSummary;
  active: boolean;
  onClick: () => void;
}

function WorktreeListItem({ worktree, active, onClick }: WorktreeListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-md border transition-colors ${
        active
          ? 'border-primary bg-background-lighter'
          : 'border-background-lighter bg-background-light hover:bg-background-lighter'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">{worktree.name}</div>
          <div className="text-xs text-foreground-muted">{worktree.branch}</div>
        </div>
        <StatusBadge status={worktree.status} />
      </div>
      <div className="text-xs text-foreground-muted mt-2 flex flex-wrap gap-2 items-center">
        <span>{worktree.issueNumber ? `Issue #${worktree.issueNumber}` : 'No issue linked'}</span>
        <span>•</span>
        <span>Head {worktree.head ? worktree.head.slice(0, 7) : '—'}</span>
        {worktree.dirty && <span className="text-danger">• Dirty</span>}
        <span>• Last accessed {new Date(worktree.lastAccessed).toLocaleString()}</span>
      </div>
    </button>
  );
}

function StatusBadge({ status }: { status: WorktreeStatus }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  const color = {
    active: 'bg-primary/20 text-primary',
    idle: 'bg-foreground/10 text-foreground',
    stuck: 'bg-danger/20 text-danger',
  }[status];

  return <span className={`text-xs px-2 py-1 rounded-full ${color}`}>{label}</span>;
}

interface WorktreeDetailProps {
  worktree: WorktreeSummary;
  busy: boolean;
  onCleanup: () => void;
  onOpen: () => void;
}

function WorktreeDetail({ worktree, busy, onCleanup, onOpen }: WorktreeDetailProps) {
  return (
    <div className="p-6 bg-background-light border border-background-lighter rounded-lg space-y-4">
      <div>
        <h3 className="text-lg font-extralight mb-1">{worktree.name}</h3>
        <div className="text-xs text-foreground-muted">{worktree.path}</div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <Detail label="Status" value={<StatusBadge status={worktree.status} />} />
        <Detail
          label="Last accessed"
          value={new Date(worktree.lastAccessed).toLocaleString()}
        />
        <Detail label="Disk usage" value={`${worktree.diskUsageMb} MB`} />
        <Detail label="HEAD" value={worktree.head ? worktree.head : '—'} />
        <Detail
          label="Issue"
          value={worktree.issueNumber ? `#${worktree.issueNumber}` : '—'}
        />
        <Detail label="Agent" value={worktree.agentName ?? '—'} />
        <Detail label="Dirty" value={worktree.dirty ? 'Yes' : 'No'} />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={onCleanup}
          className="px-4 py-2 bg-danger text-white rounded-md hover:bg-danger/80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cleanup
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onOpen}
          className="px-4 py-2 border border-background-lighter rounded-md hover:bg-background-lighter disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Open in Finder
        </button>
      </div>
    </div>
  );
}

interface DetailProps {
  label: string;
  value: React.ReactNode;
}

function Detail({ label, value }: DetailProps) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-foreground-muted">{label}</div>
      <div className="text-sm mt-1">{value}</div>
    </div>
  );
}
