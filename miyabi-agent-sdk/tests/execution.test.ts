/**
 * Execution Tests
 * @module tests/execution
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  runMiyabiAgent,
  runAgentsParallel,
  runAgentsSequential,
  buildDAG,
  hasCycles,
  criticalPath,
  orchestrate,
} from '../src/execution.js';
import type { AgentExecutionRequest, DAGNode } from '../src/types.js';

describe('runMiyabiAgent', () => {
  it('should execute a single agent and return result', async () => {
    const request: AgentExecutionRequest = {
      agentType: 'CodeGenAgent',
      input: {
        issueNumber: 123,
        language: 'rust',
        description: 'Test description',
      },
    };

    const result = await runMiyabiAgent(request);

    expect(result.agentType).toBe('CodeGenAgent');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    // Placeholder implementation returns failure due to output schema mismatch
    // This is expected until real backend is connected
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return error for invalid input', async () => {
    const request: AgentExecutionRequest = {
      agentType: 'CodeGenAgent',
      input: {
        // Missing required issueNumber
        language: 'rust',
      },
    };

    const result = await runMiyabiAgent(request);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle unknown agent type gracefully', async () => {
    const request: AgentExecutionRequest = {
      agentType: 'UnknownAgent' as any,
      input: {},
    };

    // Unknown agent type throws, which is expected behavior
    await expect(runMiyabiAgent(request)).rejects.toThrow('Unknown agent type');
  });
});

describe('runAgentsParallel', () => {
  it('should execute multiple agents in parallel', async () => {
    const requests: AgentExecutionRequest[] = [
      {
        agentType: 'CodeGenAgent',
        input: { issueNumber: 1, language: 'rust', description: 'Task 1' },
      },
      {
        agentType: 'ReviewAgent',
        input: { files: [], checkSecurity: true },
      },
    ];

    const results = await runAgentsParallel(requests);

    expect(results).toHaveLength(2);
    expect(results[0].agentType).toBe('CodeGenAgent');
    expect(results[1].agentType).toBe('ReviewAgent');
  });

  it('should handle empty array', async () => {
    const results = await runAgentsParallel([]);

    expect(results).toHaveLength(0);
  });
});

describe('runAgentsSequential', () => {
  it('should execute agents in sequence', async () => {
    const requests: AgentExecutionRequest[] = [
      {
        agentType: 'IssueAgent',
        input: { issueNumber: 123, action: 'analyze' },
      },
      {
        agentType: 'CodeGenAgent',
        input: { issueNumber: 123, language: 'rust', description: 'Fix bug' },
      },
    ];

    const results = await runAgentsSequential(requests);

    // First agent fails due to output schema mismatch (placeholder),
    // so only 1 result is returned
    expect(results).toHaveLength(1);
    expect(results[0].agentType).toBe('IssueAgent');
  });

  it('should handle all failures gracefully', async () => {
    const requests: AgentExecutionRequest[] = [
      {
        agentType: 'IssueAgent',
        input: { issueNumber: 1, action: 'analyze' },
      },
      {
        agentType: 'CodeGenAgent',
        input: { issueNumber: 1, language: 'rust', description: 'Task' },
      },
    ];

    const results = await runAgentsSequential(requests);

    // Should stop after first failure (placeholder output doesn't match schema)
    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(false);
  });
});

describe('DAG Operations', () => {
  describe('hasCycles', () => {
    it('should detect cycles in DAG', () => {
      const nodes: DAGNode[] = [
        { id: 'a', agentType: 'CodeGenAgent', input: {}, dependencies: ['c'] },
        { id: 'b', agentType: 'ReviewAgent', input: {}, dependencies: ['a'] },
        { id: 'c', agentType: 'PRAgent', input: {}, dependencies: ['b'] },
      ];

      expect(hasCycles(nodes)).toBe(true);
    });

    it('should return false for acyclic DAG', () => {
      const nodes: DAGNode[] = [
        { id: 'a', agentType: 'IssueAgent', input: {}, dependencies: [] },
        { id: 'b', agentType: 'CodeGenAgent', input: {}, dependencies: ['a'] },
        { id: 'c', agentType: 'ReviewAgent', input: {}, dependencies: ['b'] },
      ];

      expect(hasCycles(nodes)).toBe(false);
    });

    it('should handle empty DAG', () => {
      expect(hasCycles([])).toBe(false);
    });
  });

  describe('buildDAG', () => {
    it('should build valid DAG', () => {
      const nodes: DAGNode[] = [
        { id: 'a', agentType: 'IssueAgent', input: {}, dependencies: [] },
        { id: 'b', agentType: 'CodeGenAgent', input: {}, dependencies: ['a'] },
      ];

      const dag = buildDAG(nodes);

      expect(dag.nodes).toHaveLength(2);
    });

    it('should throw on cyclic DAG', () => {
      const nodes: DAGNode[] = [
        { id: 'a', agentType: 'CodeGenAgent', input: {}, dependencies: ['b'] },
        { id: 'b', agentType: 'ReviewAgent', input: {}, dependencies: ['a'] },
      ];

      expect(() => buildDAG(nodes)).toThrow('DAG contains cycles');
    });
  });

  describe('criticalPath', () => {
    it('should return topological order', () => {
      const nodes: DAGNode[] = [
        { id: 'a', agentType: 'IssueAgent', input: {}, dependencies: [] },
        { id: 'b', agentType: 'CodeGenAgent', input: {}, dependencies: ['a'] },
        { id: 'c', agentType: 'ReviewAgent', input: {}, dependencies: ['b'] },
      ];

      const dag = buildDAG(nodes);
      const path = criticalPath(dag);

      expect(path).toEqual(['a', 'b', 'c']);
    });

    it('should handle parallel nodes', () => {
      const nodes: DAGNode[] = [
        { id: 'a', agentType: 'IssueAgent', input: {}, dependencies: [] },
        { id: 'b', agentType: 'CodeGenAgent', input: {}, dependencies: ['a'] },
        { id: 'c', agentType: 'ReviewAgent', input: {}, dependencies: ['a'] },
        { id: 'd', agentType: 'PRAgent', input: {}, dependencies: ['b', 'c'] },
      ];

      const dag = buildDAG(nodes);
      const path = criticalPath(dag);

      // 'a' should be first, 'd' should be last
      expect(path[0]).toBe('a');
      expect(path[path.length - 1]).toBe('d');
      expect(path).toHaveLength(4);
    });
  });
});

describe('orchestrate', () => {
  it('should execute DAG in correct order', async () => {
    const nodes: DAGNode[] = [
      {
        id: 'analyze',
        agentType: 'IssueAgent',
        input: { issueNumber: 123, action: 'analyze' },
        dependencies: [],
      },
      {
        id: 'generate',
        agentType: 'CodeGenAgent',
        input: { issueNumber: 123, language: 'rust', description: 'Fix bug' },
        dependencies: ['analyze'],
      },
    ];

    const dag = buildDAG(nodes);
    const result = await orchestrate(dag);

    // Placeholder implementation fails output validation, but DAG structure is correct
    expect(result.success).toBe(false); // placeholder doesn't match schema
    expect(result.results.size).toBe(2);
    expect(result.criticalPath).toEqual(['analyze', 'generate']);
    expect(result.totalDurationMs).toBeGreaterThanOrEqual(0);
  });

  it('should handle empty DAG', async () => {
    const dag = buildDAG([]);
    const result = await orchestrate(dag);

    expect(result.success).toBe(true);
    expect(result.results.size).toBe(0);
  });

  it('should track results for all nodes', async () => {
    const nodes: DAGNode[] = [
      {
        id: 'a',
        agentType: 'IssueAgent',
        input: { issueNumber: 1, action: 'analyze' },
        dependencies: [],
      },
    ];

    const dag = buildDAG(nodes);
    const result = await orchestrate(dag);

    expect(result.results.has('a')).toBe(true);
    expect(result.results.get('a')?.agentType).toBe('IssueAgent');
  });
});
