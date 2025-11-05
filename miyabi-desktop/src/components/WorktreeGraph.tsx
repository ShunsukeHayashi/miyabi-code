import { useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap, Node, Edge, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import type {
  WorktreeGraph,
  GraphNode as WorktreeGraphNode,
  BranchGraphNode,
  WorktreeGraphNode as WorktreeNodeWrapper,
} from '../types/worktrees';

const HORIZONTAL_GAP = 260;
const VERTICAL_GAP = 120;

export interface WorktreeGraphProps {
  graph: WorktreeGraph;
  activeOnly: boolean;
  issueFilter: string;
  selectedNodeId?: string | null;
  onSelectNode?: (node: WorktreeGraphNode) => void;
}

function extractBranchName(nodeId: string): string | null {
  return nodeId.startsWith('branch:') ? nodeId.slice('branch:'.length) : null;
}

function computeBranchLevels(graph: WorktreeGraph): Map<string, number> {
  const levels = new Map<string, number>();
  const incoming = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const edge of graph.edges) {
    if (edge.kind !== 'branch_hierarchy') continue;
    const parent = extractBranchName(edge.from);
    const child = extractBranchName(edge.to);
    if (!parent || !child) continue;
    incoming.set(child, (incoming.get(child) || 0) + 1);
    const list = adjacency.get(parent) || [];
    list.push(child);
    adjacency.set(parent, list);
  }

  const queue: string[] = [];
  for (const node of graph.nodes) {
    if (node.kind === 'branch') {
      const name = node.branch.name;
      if ((incoming.get(name) || 0) === 0) {
        levels.set(name, 0);
        queue.push(name);
      }
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const baseLevel = levels.get(current) || 0;
    const children = adjacency.get(current) || [];
    for (const child of children) {
      const remaining = (incoming.get(child) || 0) - 1;
      if (remaining <= 0 && !levels.has(child)) {
        levels.set(child, baseLevel + 1);
        queue.push(child);
      }
      incoming.set(child, remaining);
    }
  }

  // Ensure isolated branches have a level assigned.
  for (const node of graph.nodes) {
    if (node.kind === 'branch' && !levels.has(node.branch.name)) {
      levels.set(node.branch.name, 0);
    }
  }

  return levels;
}

function isWorktreeVisible(
  node: WorktreeNodeWrapper,
  activeOnly: boolean,
  issueFilter: string
): boolean {
  if (activeOnly && node.worktree.status !== 'active') {
    return false;
  }
  if (issueFilter) {
    const issueNumber = node.worktree.issue_number?.toString() ?? '';
    if (!issueNumber.includes(issueFilter)) {
      return false;
    }
  }
  return true;
}

function renderStatusBadge(status: string) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    locked: 'bg-amber-100 text-amber-700 border-amber-200',
    stale: 'bg-rose-100 text-rose-700 border-rose-200',
  };
  const labelMap: Record<string, string> = {
    active: 'Active',
    locked: 'Locked',
    stale: 'Stale',
  };
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 border rounded-full ${
        styles[status] || 'bg-gray-100 text-gray-600 border-gray-200'
      }`}
    >
      {labelMap[status] ?? status}
    </span>
  );
}

function renderBranchLabel(node: BranchGraphNode, isSelected: boolean) {
  return (
    <div
      className={`px-3 py-2 rounded-lg border text-sm bg-white shadow-sm ${
        isSelected ? 'border-blue-500 ring-1 ring-blue-400' : 'border-gray-200'
      }`}
    >
      <div className="font-medium text-gray-900">{node.branch.name}</div>
      <div className="text-xs text-gray-500 space-y-0.5">
        {node.branch.head && <div>HEAD: {node.branch.head.slice(0, 10)}</div>}
        {node.branch.upstream && <div>Upstream: {node.branch.upstream}</div>}
        {node.branch.latest_commit_time && (
          <div>Updated: {new Date(node.branch.latest_commit_time).toLocaleString()}</div>
        )}
      </div>
    </div>
  );
}

function renderWorktreeLabel(node: WorktreeNodeWrapper, isSelected: boolean) {
  const { worktree } = node;
  return (
    <div
      className={`px-3 py-2 rounded-lg border text-sm shadow-sm bg-white ${
        isSelected ? 'border-blue-500 ring-1 ring-blue-400' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium text-gray-900 truncate" title={worktree.path}>
          {node.label}
        </div>
        {renderStatusBadge(worktree.status)}
      </div>
      <div className="mt-1 text-xs text-gray-500 space-y-0.5">
        <div>Branch: {worktree.branch}</div>
        {worktree.issue_number !== undefined && (
          <div>Issue: #{worktree.issue_number}</div>
        )}
        {worktree.agent?.agent_name && (
          <div>Agent: {worktree.agent.agent_name}</div>
        )}
        {worktree.last_commit_time && (
          <div>Last commit: {new Date(worktree.last_commit_time).toLocaleString()}</div>
        )}
      </div>
    </div>
  );
}

function createFlowGraph(
  graph: WorktreeGraph,
  activeOnly: boolean,
  issueFilter: string,
  selectedNodeId?: string | null
): { nodes: Node[]; edges: Edge[]; nodeLookup: Map<string, WorktreeGraphNode> } {
  const trimmedFilter = issueFilter.trim();
  const branchLevels = computeBranchLevels(graph);
  const branchParent = new Map<string, string | null>();
  for (const edge of graph.edges) {
    if (edge.kind !== 'branch_hierarchy') continue;
    const parent = extractBranchName(edge.from);
    const child = extractBranchName(edge.to);
    if (parent && child) {
      branchParent.set(child, parent);
    }
  }

  const nodeLookup = new Map(graph.nodes.map((node) => [node.id, node]));
  const worktreeNodes = graph.nodes.filter(
    (node): node is WorktreeNodeWrapper => node.kind === 'worktree'
  );

  const visibleWorktrees = worktreeNodes.filter((node) =>
    isWorktreeVisible(node, activeOnly, trimmedFilter)
  );

  const branchesToShow = new Set<string>();
  for (const worktree of visibleWorktrees) {
    let current: string | undefined | null = worktree.worktree.branch;
    while (current) {
      if (branchesToShow.has(current)) break;
      branchesToShow.add(current);
      current = branchParent.get(current);
    }
  }

  if (branchesToShow.size === 0) {
    const firstBranch = graph.nodes.find((node): node is BranchGraphNode => node.kind === 'branch');
    if (firstBranch) {
      branchesToShow.add(firstBranch.branch.name);
    }
  }

  const includedNodeIds = new Set<string>();
  const levelCounters = new Map<number, number>();
  const branchPositions = new Map<string, { x: number; y: number }>();
  const reactFlowNodes: Node[] = [];

  const sortedBranches = Array.from(branchesToShow).sort();
  for (const branchName of sortedBranches) {
    const nodeId = `branch:${branchName}`;
    const graphNode = nodeLookup.get(nodeId);
    if (!graphNode || graphNode.kind !== 'branch') continue;

    const level = branchLevels.get(branchName) ?? 0;
    const index = levelCounters.get(level) ?? 0;
    levelCounters.set(level, index + 1);
    const position = { x: level * HORIZONTAL_GAP, y: index * VERTICAL_GAP };
    branchPositions.set(branchName, position);
    includedNodeIds.add(nodeId);

    reactFlowNodes.push({
      id: nodeId,
      data: {
        label: renderBranchLabel(graphNode, selectedNodeId === nodeId),
      },
      position,
      selectable: true,
      draggable: false,
      type: 'default',
    });
  }

  const branchWorktreeOffsets = new Map<string, number>();
  const sortedWorktrees = [...visibleWorktrees].sort((a, b) => a.label.localeCompare(b.label));
  for (const worktree of sortedWorktrees) {
    const nodeId = worktree.id;
    const baseBranch = worktree.worktree.branch;
    const branchPos = branchPositions.get(baseBranch) || { x: 0, y: 0 };
    const branchLevel = branchLevels.get(baseBranch) ?? 0;
    const offsetIndex = branchWorktreeOffsets.get(baseBranch) ?? 0;
    branchWorktreeOffsets.set(baseBranch, offsetIndex + 1);

    const position = {
      x: (branchLevel + 1) * HORIZONTAL_GAP,
      y: branchPos.y + (offsetIndex + 1) * (VERTICAL_GAP * 0.8),
    };

    includedNodeIds.add(nodeId);
    reactFlowNodes.push({
      id: nodeId,
      data: {
        label: renderWorktreeLabel(worktree, selectedNodeId === nodeId),
      },
      position,
      selectable: true,
      draggable: false,
      type: 'default',
    });
  }

  const reactFlowEdges: Edge[] = graph.edges
    .filter((edge) => includedNodeIds.has(edge.from) && includedNodeIds.has(edge.to))
    .map((edge) => ({
      id: edge.id,
      source: edge.from,
      target: edge.to,
      type: edge.kind === 'branch_hierarchy' ? 'smoothstep' : 'default',
      animated: edge.kind === 'branch_hierarchy',
    }));

  return { nodes: reactFlowNodes, edges: reactFlowEdges, nodeLookup };
}

function WorktreeGraphInner(props: WorktreeGraphProps) {
  const { graph, activeOnly, issueFilter, selectedNodeId, onSelectNode } = props;
  const { nodes, edges, nodeLookup } = useMemo(
    () => createFlowGraph(graph, activeOnly, issueFilter, selectedNodeId),
    [graph, activeOnly, issueFilter, selectedNodeId]
  );

  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        No worktrees match the current filters.
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      fitView
      fitViewOptions={{ padding: 0.2, minZoom: 0.2, maxZoom: 2 }}
      nodesDraggable={false}
      nodesConnectable={false}
      panOnScroll
      selectionOnDrag
      proOptions={{ hideAttribution: true }}
      onNodeClick={(_, node) => {
        const original = nodeLookup.get(node.id);
        if (original && onSelectNode) {
          onSelectNode(original);
        }
      }}
    >
      <Background gap={32} size={1} color="#f3f4f6" />
      <MiniMap zoomable pannable />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

export function WorktreeGraphCanvas(props: WorktreeGraphProps) {
  return (
    <ReactFlowProvider>
      <div className="h-full w-full">
        <WorktreeGraphInner {...props} />
      </div>
    </ReactFlowProvider>
  );
}
