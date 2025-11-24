/**
 * DAG Validator - Directed Acyclic Graph Validation Utility
 *
 * Issue #176: Phase 2.2
 *
 * Features:
 * - Cycle detection using DFS (Depth-First Search)
 * - Topological sort using Kahn's algorithm
 * - React Flow nodes/edges structure validation
 *
 * @module dag-validator
 */

import { Node, Edge } from '@xyflow/react';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  sortedNodes: string[]; // Topologically sorted node IDs
}

export interface ValidationError {
  type: 'cycle' | 'orphan' | 'invalid_connection' | 'missing_node';
  message: string;
  nodeIds: string[];
}

/**
 * Validate DAG structure with cycle detection and topological sort
 *
 * @param nodes - React Flow nodes
 * @param edges - React Flow edges
 * @returns Validation result with errors and sorted nodes
 */
export function validateDAG(nodes: Node[], edges: Edge[]): ValidationResult {
  const errors: ValidationError[] = [];

  // Build adjacency list
  const adjList = buildAdjacencyList(nodes, edges);

  // Check for missing nodes referenced in edges
  const missingNodeErrors = checkMissingNodes(nodes, edges);
  errors.push(...missingNodeErrors);

  // Detect cycles using DFS
  const cycleErrors = detectCycles(adjList);
  errors.push(...cycleErrors);

  // Topological sort using Kahn's algorithm
  const sortedNodes = topologicalSort(adjList);

  return {
    valid: errors.length === 0,
    errors,
    sortedNodes,
  };
}

/**
 * Build adjacency list from nodes and edges
 */
function buildAdjacencyList(nodes: Node[], edges: Edge[]): Map<string, string[]> {
  const adjList = new Map<string, string[]>();

  // Initialize with all nodes
  nodes.forEach((node) => {
    adjList.set(node.id, []);
  });

  // Add edges
  edges.forEach((edge) => {
    const neighbors = adjList.get(edge.source) || [];
    neighbors.push(edge.target);
    adjList.set(edge.source, neighbors);
  });

  return adjList;
}

/**
 * Check for nodes referenced in edges but not in node list
 */
function checkMissingNodes(nodes: Node[], edges: Edge[]): ValidationError[] {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const missingNodes = new Set<string>();

  edges.forEach((edge) => {
    if (!nodeIds.has(edge.source)) {
      missingNodes.add(edge.source);
    }
    if (!nodeIds.has(edge.target)) {
      missingNodes.add(edge.target);
    }
  });

  if (missingNodes.size > 0) {
    return [
      {
        type: 'missing_node',
        message: `Missing nodes referenced in edges: ${Array.from(missingNodes).join(', ')}`,
        nodeIds: Array.from(missingNodes),
      },
    ];
  }

  return [];
}

/**
 * Detect cycles using DFS with color-based tracking
 *
 * White (0): Unvisited
 * Gray (1): Currently visiting
 * Black (2): Completely visited
 */
function detectCycles(adjList: Map<string, string[]>): ValidationError[] {
  const colors = new Map<string, number>();
  const cycles: string[][] = [];

  // Initialize all nodes as white (unvisited)
  adjList.forEach((_, nodeId) => {
    colors.set(nodeId, 0);
  });

  // DFS from each unvisited node
  adjList.forEach((_, nodeId) => {
    if (colors.get(nodeId) === 0) {
      dfs(nodeId, adjList, colors, [], cycles);
    }
  });

  // Convert cycle paths to errors
  return cycles.map((cycle) => ({
    type: 'cycle' as const,
    message: `Cycle detected: ${cycle.join(' → ')} → ${cycle[0]}`,
    nodeIds: cycle,
  }));
}

/**
 * Depth-First Search for cycle detection
 */
function dfs(
  nodeId: string,
  adjList: Map<string, string[]>,
  colors: Map<string, number>,
  path: string[],
  cycles: string[][]
): void {
  // Mark as gray (currently visiting)
  colors.set(nodeId, 1);
  path.push(nodeId);

  const neighbors = adjList.get(nodeId) || [];

  for (const neighbor of neighbors) {
    const neighborColor = colors.get(neighbor);

    if (neighborColor === 1) {
      // Gray node found - cycle detected
      // Extract the cycle from path
      const cycleStartIndex = path.indexOf(neighbor);
      const cycle = path.slice(cycleStartIndex);
      cycles.push(cycle);
    } else if (neighborColor === 0) {
      // White node - continue DFS
      dfs(neighbor, adjList, colors, path, cycles);
    }
    // Black node (2) - already processed, skip
  }

  // Mark as black (completely visited)
  colors.set(nodeId, 2);
  path.pop();
}

/**
 * Topological sort using Kahn's algorithm
 *
 * @returns Array of node IDs in topological order
 */
function topologicalSort(adjList: Map<string, string[]>): string[] {
  // Calculate in-degree for each node
  const inDegree = new Map<string, number>();
  adjList.forEach((_, nodeId) => {
    inDegree.set(nodeId, 0);
  });

  adjList.forEach((neighbors) => {
    neighbors.forEach((neighbor) => {
      inDegree.set(neighbor, (inDegree.get(neighbor) || 0) + 1);
    });
  });

  // Queue with nodes having in-degree 0
  const queue: string[] = [];
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId);
    }
  });

  // Process queue
  const sorted: string[] = [];
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    sorted.push(nodeId);

    // Reduce in-degree of neighbors
    const neighbors = adjList.get(nodeId) || [];
    neighbors.forEach((neighbor) => {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);

      if (newDegree === 0) {
        queue.push(neighbor);
      }
    });
  }

  // If sorted.length !== adjList.size, there's a cycle
  // But we already detected cycles in detectCycles, so just return sorted
  return sorted;
}

/**
 * Validate if adding a new edge would create a cycle
 *
 * @param nodes - Current nodes
 * @param edges - Current edges
 * @param newEdge - Edge to be added
 * @returns true if adding the edge would create a cycle
 */
export function wouldCreateCycle(
  nodes: Node[],
  edges: Edge[],
  newEdge: { source: string; target: string }
): boolean {
  // Temporarily add the new edge
  const tempEdges = [...edges, { id: 'temp', ...newEdge } as Edge];

  // Validate with the new edge
  const result = validateDAG(nodes, tempEdges);

  // Check if there are any cycle errors
  return result.errors.some((error) => error.type === 'cycle');
}

/**
 * Get dependency levels for parallel execution
 *
 * Returns a 2D array where each sub-array contains node IDs
 * that can be executed in parallel
 *
 * @param nodes - React Flow nodes
 * @param edges - React Flow edges
 * @returns Array of levels, each containing node IDs for parallel execution
 */
export function getDependencyLevels(nodes: Node[], edges: Edge[]): string[][] {
  const adjList = buildAdjacencyList(nodes, edges);
  const inDegree = new Map<string, number>();

  // Calculate in-degree
  adjList.forEach((_, nodeId) => {
    inDegree.set(nodeId, 0);
  });

  adjList.forEach((neighbors) => {
    neighbors.forEach((neighbor) => {
      inDegree.set(neighbor, (inDegree.get(neighbor) || 0) + 1);
    });
  });

  const levels: string[][] = [];
  const processed = new Set<string>();

  while (processed.size < nodes.length) {
    const currentLevel: string[] = [];

    // Find all nodes with in-degree 0 that haven't been processed
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0 && !processed.has(nodeId)) {
        currentLevel.push(nodeId);
      }
    });

    if (currentLevel.length === 0) {
      // No progress - cycle exists or disconnected graph
      break;
    }

    levels.push(currentLevel);

    // Mark as processed and reduce neighbors' in-degree
    currentLevel.forEach((nodeId) => {
      processed.add(nodeId);
      const neighbors = adjList.get(nodeId) || [];
      neighbors.forEach((neighbor) => {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
      });
    });
  }

  return levels;
}
