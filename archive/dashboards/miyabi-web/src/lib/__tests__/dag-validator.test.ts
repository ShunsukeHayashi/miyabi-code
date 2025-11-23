/**
 * DAG Validator Unit Tests
 *
 * Issue #176: Phase 2.2
 *
 * Tests:
 * - Cycle detection
 * - Topological sort
 * - Edge validation
 * - Missing node detection
 */

import { describe, it, expect } from '@jest/globals';
import { validateDAG, wouldCreateCycle, getDependencyLevels } from '../dag-validator';
import type { Node, Edge } from '@xyflow/react';

describe('DAG Validator', () => {
  describe('validateDAG', () => {
    it('should validate a simple valid DAG', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {} },
        { id: '2', position: { x: 0, y: 0 }, data: {} },
        { id: '3', position: { x: 0, y: 0 }, data: {} },
      ];

      const edges: Edge[] = [
        { id: 'e1', source: '1', target: '2' },
        { id: 'e2', source: '2', target: '3' },
      ];

      const result = validateDAG(nodes, edges);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sortedNodes).toEqual(['1', '2', '3']);
    });

    it('should detect a simple cycle', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {} },
        { id: '2', position: { x: 0, y: 0 }, data: {} },
      ];

      const edges: Edge[] = [
        { id: 'e1', source: '1', target: '2' },
        { id: 'e2', source: '2', target: '1' },
      ];

      const result = validateDAG(nodes, edges);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('cycle');
      expect(result.errors[0].nodeIds).toContain('1');
      expect(result.errors[0].nodeIds).toContain('2');
    });

    it('should detect a complex cycle', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {} },
        { id: '2', position: { x: 0, y: 0 }, data: {} },
        { id: '3', position: { x: 0, y: 0 }, data: {} },
        { id: '4', position: { x: 0, y: 0 }, data: {} },
      ];

      const edges: Edge[] = [
        { id: 'e1', source: '1', target: '2' },
        { id: 'e2', source: '2', target: '3' },
        { id: 'e3', source: '3', target: '4' },
        { id: 'e4', source: '4', target: '2' }, // Creates cycle: 2 -> 3 -> 4 -> 2
      ];

      const result = validateDAG(nodes, edges);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('cycle');
    });

    it('should detect missing nodes', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {} },
        { id: '2', position: { x: 0, y: 0 }, data: {} },
      ];

      const edges: Edge[] = [
        { id: 'e1', source: '1', target: '3' }, // Node '3' doesn't exist
      ];

      const result = validateDAG(nodes, edges);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('missing_node');
      expect(result.errors[0].nodeIds).toContain('3');
    });

    it('should handle disconnected graph', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {} },
        { id: '2', position: { x: 0, y: 0 }, data: {} },
        { id: '3', position: { x: 0, y: 0 }, data: {} },
        { id: '4', position: { x: 0, y: 0 }, data: {} },
      ];

      const edges: Edge[] = [
        { id: 'e1', source: '1', target: '2' },
        // Node 3 and 4 are disconnected
      ];

      const result = validateDAG(nodes, edges);

      expect(result.valid).toBe(true);
      expect(result.sortedNodes).toHaveLength(4);
    });
  });

  describe('wouldCreateCycle', () => {
    it('should return false for valid new edge', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {} },
        { id: '2', position: { x: 0, y: 0 }, data: {} },
        { id: '3', position: { x: 0, y: 0 }, data: {} },
      ];

      const edges: Edge[] = [
        { id: 'e1', source: '1', target: '2' },
      ];

      const newEdge = { source: '2', target: '3' };

      const result = wouldCreateCycle(nodes, edges, newEdge);

      expect(result).toBe(false);
    });

    it('should return true for edge that creates cycle', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {} },
        { id: '2', position: { x: 0, y: 0 }, data: {} },
        { id: '3', position: { x: 0, y: 0 }, data: {} },
      ];

      const edges: Edge[] = [
        { id: 'e1', source: '1', target: '2' },
        { id: 'e2', source: '2', target: '3' },
      ];

      const newEdge = { source: '3', target: '1' }; // Would create cycle

      const result = wouldCreateCycle(nodes, edges, newEdge);

      expect(result).toBe(true);
    });
  });

  describe('getDependencyLevels', () => {
    it('should return correct levels for simple DAG', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {} },
        { id: '2', position: { x: 0, y: 0 }, data: {} },
        { id: '3', position: { x: 0, y: 0 }, data: {} },
      ];

      const edges: Edge[] = [
        { id: 'e1', source: '1', target: '2' },
        { id: 'e2', source: '2', target: '3' },
      ];

      const levels = getDependencyLevels(nodes, edges);

      expect(levels).toEqual([['1'], ['2'], ['3']]);
    });

    it('should return correct levels for parallel execution', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {} },
        { id: '2', position: { x: 0, y: 0 }, data: {} },
        { id: '3', position: { x: 0, y: 0 }, data: {} },
        { id: '4', position: { x: 0, y: 0 }, data: {} },
      ];

      const edges: Edge[] = [
        { id: 'e1', source: '1', target: '3' },
        { id: 'e2', source: '2', target: '4' },
      ];

      const levels = getDependencyLevels(nodes, edges);

      expect(levels).toHaveLength(2);
      expect(levels[0]).toHaveLength(2);
      expect(levels[0]).toContain('1');
      expect(levels[0]).toContain('2');
      expect(levels[1]).toHaveLength(2);
      expect(levels[1]).toContain('3');
      expect(levels[1]).toContain('4');
    });

    it('should handle diamond dependency', () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {} },
        { id: '2', position: { x: 0, y: 0 }, data: {} },
        { id: '3', position: { x: 0, y: 0 }, data: {} },
        { id: '4', position: { x: 0, y: 0 }, data: {} },
      ];

      const edges: Edge[] = [
        { id: 'e1', source: '1', target: '2' },
        { id: 'e2', source: '1', target: '3' },
        { id: 'e3', source: '2', target: '4' },
        { id: 'e4', source: '3', target: '4' },
      ];

      const levels = getDependencyLevels(nodes, edges);

      expect(levels).toEqual([['1'], ['2', '3'], ['4']]);
    });
  });
});
