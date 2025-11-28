/**
 * Agent Execution Functions
 * @module execution
 */

import type {
  AgentExecutionRequest,
  AgentExecutionResult,
  AgentType,
  DAG,
  DAGNode,
  OrchestrationResult,
} from './types.js';
import { getAgentDefinition } from './agents/index.js';

// ============================================================================
// Single Agent Execution
// ============================================================================

/**
 * Execute a single Miyabi agent
 *
 * @param request - Agent execution request
 * @returns Execution result
 *
 * @example
 * ```typescript
 * const result = await runMiyabiAgent({
 *   agentType: 'CodeGenAgent',
 *   input: {
 *     issueNumber: 123,
 *     language: 'rust',
 *     description: 'Fix authentication bug',
 *   },
 * });
 * ```
 */
export async function runMiyabiAgent<T = unknown>(
  request: AgentExecutionRequest
): Promise<AgentExecutionResult<T>> {
  const startTime = Date.now();
  const agent = getAgentDefinition(request.agentType);

  try {
    // Validate input against schema
    const validatedInput = agent.inputSchema.parse(request.input);

    // TODO: Integrate with actual agent execution
    // For now, return a placeholder result
    const output = await executeAgentInternal(
      request.agentType,
      validatedInput as Record<string, unknown>,
      request.context
    );

    // Validate output against schema
    const validatedOutput = agent.outputSchema.parse(output);

    return {
      success: true,
      agentType: request.agentType,
      output: validatedOutput as T,
      durationMs: Date.now() - startTime,
      metadata: {
        validatedInput: true,
        validatedOutput: true,
      },
    };
  } catch (error) {
    return {
      success: false,
      agentType: request.agentType,
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startTime,
    };
  }
}

// ============================================================================
// Parallel Execution
// ============================================================================

/**
 * Execute multiple agents in parallel
 *
 * @param requests - Array of agent execution requests
 * @returns Array of execution results
 *
 * @example
 * ```typescript
 * const results = await runAgentsParallel([
 *   { agentType: 'CodeGenAgent', input: { ... } },
 *   { agentType: 'ReviewAgent', input: { ... } },
 * ]);
 * ```
 */
export async function runAgentsParallel(
  requests: AgentExecutionRequest[]
): Promise<AgentExecutionResult[]> {
  return Promise.all(requests.map(runMiyabiAgent));
}

// ============================================================================
// Sequential Execution
// ============================================================================

/**
 * Execute agents sequentially, passing results to next agent
 *
 * @param requests - Array of agent execution requests
 * @returns Array of execution results
 */
export async function runAgentsSequential(
  requests: AgentExecutionRequest[]
): Promise<AgentExecutionResult[]> {
  const results: AgentExecutionResult[] = [];

  for (const request of requests) {
    const result = await runMiyabiAgent(request);
    results.push(result);

    // Stop on failure
    if (!result.success) {
      break;
    }
  }

  return results;
}

// ============================================================================
// DAG-based Orchestration
// ============================================================================

/**
 * Build a DAG from task definitions
 *
 * @param nodes - DAG nodes with dependencies
 * @returns Validated DAG
 */
export function buildDAG(nodes: DAGNode[]): DAG {
  // Validate no cycles
  if (hasCycles(nodes)) {
    throw new Error('DAG contains cycles');
  }

  return { nodes };
}

/**
 * Check if DAG has cycles
 */
export function hasCycles(nodes: DAGNode[]): boolean {
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recStack.add(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return false;

    for (const depId of node.dependencies) {
      if (!visited.has(depId)) {
        if (dfs(depId)) return true;
      } else if (recStack.has(depId)) {
        return true;
      }
    }

    recStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) return true;
    }
  }

  return false;
}

/**
 * Find critical path in DAG
 */
export function criticalPath(dag: DAG): string[] {
  // Topological sort
  const sorted: string[] = [];
  const visited = new Set<string>();

  function visit(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = dag.nodes.find(n => n.id === nodeId);
    if (!node) return;

    for (const depId of node.dependencies) {
      visit(depId);
    }

    sorted.push(nodeId);
  }

  for (const node of dag.nodes) {
    visit(node.id);
  }

  return sorted;
}

/**
 * Execute DAG-based orchestration
 *
 * @param dag - Directed Acyclic Graph of agents
 * @returns Orchestration result with all agent results
 *
 * @example
 * ```typescript
 * const result = await orchestrate(buildDAG([
 *   { id: 'analyze', agentType: 'IssueAgent', input: { issueNumber: 123 }, dependencies: [] },
 *   { id: 'generate', agentType: 'CodeGenAgent', input: { ... }, dependencies: ['analyze'] },
 *   { id: 'review', agentType: 'ReviewAgent', input: { ... }, dependencies: ['generate'] },
 * ]));
 * ```
 */
export async function orchestrate(dag: DAG): Promise<OrchestrationResult> {
  const startTime = Date.now();
  const results = new Map<string, AgentExecutionResult>();
  const completed = new Set<string>();
  const path = criticalPath(dag);

  // Execute in topological order
  for (const nodeId of path) {
    const node = dag.nodes.find(n => n.id === nodeId);
    if (!node) continue;

    // Check all dependencies are completed
    const depsCompleted = node.dependencies.every(d => completed.has(d));
    if (!depsCompleted) {
      results.set(nodeId, {
        success: false,
        agentType: node.agentType,
        error: 'Dependencies not satisfied',
        durationMs: 0,
      });
      continue;
    }

    // Execute agent
    const result = await runMiyabiAgent({
      agentType: node.agentType,
      input: node.input,
    });

    results.set(nodeId, result);

    if (result.success) {
      completed.add(nodeId);
    }
  }

  const allSuccess = Array.from(results.values()).every(r => r.success);

  return {
    success: allSuccess,
    results,
    totalDurationMs: Date.now() - startTime,
    criticalPath: path,
  };
}

// ============================================================================
// Internal Execution (Placeholder)
// ============================================================================

async function executeAgentInternal(
  agentType: AgentType,
  input: Record<string, unknown>,
  _context?: AgentExecutionRequest['context']
): Promise<Record<string, unknown>> {
  // TODO: Integrate with actual agent execution via:
  // 1. Local Claude Code execution
  // 2. MCP Server call to Rust A2A Bridge
  // 3. HTTP API call to miyabi-web-api

  console.log(`[SDK] Executing ${agentType} with input:`, input);

  // Placeholder implementation
  return {
    placeholder: true,
    agentType,
    input,
    message: 'Agent execution not yet implemented - connect to backend',
  };
}
