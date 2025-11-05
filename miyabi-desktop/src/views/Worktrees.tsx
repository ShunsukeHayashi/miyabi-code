import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, GitBranch, Map, List } from 'lucide-react';
import { fetchWorktreeGraph } from '../lib/worktree-api';
import type {
  WorktreeGraph,
  GraphNode as GraphNodeUnion,
  WorktreeGraphNode as WorktreeNode,
} from '../types/worktrees';
import { WorktreeGraphCanvas } from '../components/WorktreeGraph';

interface FilterState {
  activeOnly: boolean;
  issue: string;
}

type WorktreesTab = 'list' | 'graph';

function isWorktreeNode(node: GraphNodeUnion): node is WorktreeNode {
  return node.kind === 'worktree';
}

function useFilteredWorktrees(
  graph: WorktreeGraph | null,
  filters: FilterState
) {
  return useMemo(() => {
    if (!graph) return [] as WorktreeNode[];
    return graph.nodes.filter((node): node is WorktreeNode => {
      if (!isWorktreeNode(node)) return false;
      if (filters.activeOnly && node.worktree.status !== 'active') return false;
      if (filters.issue.trim()) {
        const issueNumber = node.worktree.issue_number?.toString() ?? '';
        if (!issueNumber.includes(filters.issue.trim())) return false;
      }
      return true;
    });
  }, [graph, filters.activeOnly, filters.issue]);
}

export function WorktreesView() {
  const [graph, setGraph] = useState<WorktreeGraph | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<WorktreesTab>('graph');
  const [filters, setFilters] = useState<FilterState>({ activeOnly: true, issue: '' });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const filteredWorktrees = useFilteredWorktrees(graph, filters);
  const selectedWorktree = useMemo(() => {
    if (!graph || !selectedNodeId) return null;
    const node = graph.nodes.find((candidate) => candidate.id === selectedNodeId);
    return node && isWorktreeNode(node) ? node : null;
  }, [graph, selectedNodeId]);

  const loadGraph = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWorktreeGraph();
      if (!result) {
        setError('Failed to load worktree graph');
        setGraph(null);
      } else {
        setGraph(result);
      }
    } catch (err) {
      console.error('Failed to fetch worktree graph', err);
      setError('Failed to fetch worktree graph');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  useEffect(() => {
    if (!selectedNodeId) return;
    if (!filteredWorktrees.some((node) => node.id === selectedNodeId)) {
      setSelectedNodeId(null);
    }
  }, [filteredWorktrees, selectedNodeId]);

  const handleSelectNode = (node: GraphNodeUnion) => {
    setSelectedNodeId(node.id);
  };

  const handleIssueFilterChange = (value: string) => {
    setFilters((prev) => ({ ...prev, issue: value }));
  };

  const visibleWorktreeCount = filteredWorktrees.length;

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <GitBranch size={18} /> Worktrees Overview
          </h1>
          {graph && (
            <p className="text-sm text-gray-500">
              {graph.metadata.branch_count} branches · {graph.metadata.worktree_count} worktrees ·
              Last updated {new Date(graph.metadata.generated_at).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, activeOnly: !prev.activeOnly }))}
            className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition ${
              filters.activeOnly
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            <span className="font-medium">Active only</span>
          </button>
          <div className="relative">
            <input
              type="text"
              placeholder="Filter by issue #"
              className="w-40 rounded-md border border-gray-200 py-1.5 pl-3 pr-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-0"
              value={filters.issue}
              onChange={(event) => handleIssueFilterChange(event.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={loadGraph}
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition hover:border-gray-300"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </header>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTab('list')}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition ${
            tab === 'list' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <List size={16} /> List
        </button>
        <button
          type="button"
          onClick={() => setTab('graph')}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition ${
            tab === 'graph' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Map size={16} /> Graph
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="flex-1 overflow-hidden">
        {tab === 'list' ? (
          <div className="h-full overflow-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Worktree</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Issue</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Last Commit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredWorktrees.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                      No worktrees match the current filters.
                    </td>
                  </tr>
                )}
                {filteredWorktrees.map((node) => (
                  <tr
                    key={node.id}
                    onClick={() => handleSelectNode(node)}
                    className={`cursor-pointer transition hover:bg-gray-50 ${
                      selectedNodeId === node.id ? 'bg-gray-100' : ''
                    }`}
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                      {node.label}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{node.worktree.branch}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          node.worktree.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : node.worktree.status === 'locked'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {node.worktree.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {node.worktree.issue_number ? `#${node.worktree.issue_number}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {node.worktree.agent?.agent_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {node.worktree.last_commit_time
                        ? new Date(node.worktree.last_commit_time).toLocaleString()
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-full min-h-[480px] overflow-hidden rounded-lg border border-gray-200 bg-white">
            {graph && (
              <WorktreeGraphCanvas
                graph={graph}
                activeOnly={filters.activeOnly}
                issueFilter={filters.issue}
                selectedNodeId={selectedNodeId}
                onSelectNode={handleSelectNode}
              />
            )}
          </div>
        )}
      </section>

      <footer className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-900">Selection</span>
          <span className="text-gray-500">{visibleWorktreeCount} visible worktrees</span>
        </div>
        {selectedWorktree ? (
          <div className="space-y-2 text-gray-700">
            <div className="text-base font-semibold text-gray-900">{selectedWorktree.label}</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-600">Branch:</span> {selectedWorktree.worktree.branch}
              </div>
              <div>
                <span className="font-medium text-gray-600">Status:</span> {selectedWorktree.worktree.status}
              </div>
              <div>
                <span className="font-medium text-gray-600">Issue:</span>{' '}
                {selectedWorktree.worktree.issue_number ? `#${selectedWorktree.worktree.issue_number}` : '—'}
              </div>
              <div>
                <span className="font-medium text-gray-600">Agent:</span>{' '}
                {selectedWorktree.worktree.agent?.agent_name ?? '—'}
              </div>
              <div>
                <span className="font-medium text-gray-600">Worktree Path:</span>
                <span className="ml-1 font-mono text-xs text-gray-600">{selectedWorktree.worktree.path}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Last commit:</span>{' '}
                {selectedWorktree.worktree.last_commit_time
                  ? new Date(selectedWorktree.worktree.last_commit_time).toLocaleString()
                  : '—'}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">Select a worktree node to view its details.</div>
        )}
      </footer>

      {loading && (
        <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center bg-white/50">
          <div className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow">
            <RefreshCw size={16} className="animate-spin" /> Loading worktrees…
          </div>
        </div>
      )}
    </div>
  );
}
