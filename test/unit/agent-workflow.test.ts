/**
 * Agent & Workflow Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgentManager } from '../../src/agent/manager.js';
import { WorkflowManager } from '../../src/workflow/manager.js';
import type { TmuxConfig } from '../../src/types.js';

// Mock TmuxClient class
class MockTmuxClient {
  sendCommand = vi.fn().mockResolvedValue(undefined);
  sendKeys = vi.fn().mockResolvedValue(undefined);
  getPanes = vi.fn().mockResolvedValue([]);
  getAgentStatus = vi.fn().mockResolvedValue(null);
  getAllAgentStatus = vi.fn().mockResolvedValue([]);
}

describe('AgentManager', () => {
  let manager: AgentManager;
  let mockTmux: MockTmuxClient;

  beforeEach(() => {
    mockTmux = new MockTmuxClient();
    manager = new AgentManager({ tmux: { session: 'test', target: 'agents.0' } } as any);
    (manager as any).tmux = mockTmux;
  });

  describe('listAgents', () => {
    it('should return all agents', () => {
      const agents = manager.listAgents();
      expect(agents).toHaveLength(6);
      expect(agents.find(a => a.id === 'conductor')).toBeDefined();
      expect(agents.find(a => a.id === 'codegen')).toBeDefined();
    });
  });

  describe('getAgent', () => {
    it('should return agent by id', () => {
      const agent = manager.getAgent('conductor');
      expect(agent).toBeTruthy();
      expect(agent?.id).toBe('conductor');
      expect(agent?.name).toBe('しきるん');
    });

    it('should return null for unknown agent', () => {
      const agent = manager.getAgent('unknown');
      expect(agent).toBeNull();
    });
  });

  describe('getAgentStatus', () => {
    it('should return agent status', async () => {
      (manager as any).tmux.getAgentStatus.mockResolvedValue({
        agentId: 'conductor',
        name: 'しきるん',
        emoji: '🎭',
        paneId: '%0',
        status: 'running'
      });

      const status = await manager.getAgentStatus('conductor');
      expect(status).toBeTruthy();
      expect(status?.agentId).toBe('conductor');
      expect(status?.status).toBe('running');
    });

    it('should return null for unknown agent', async () => {
      (manager as any).tmux.getAgentStatus.mockResolvedValue(null);

      const status = await manager.getAgentStatus('unknown');
      expect(status).toBeNull();
    });
  });

  describe('getAllAgentStatus', () => {
    it('should return all agent statuses', async () => {
      (manager as any).tmux.getAllAgentStatus.mockResolvedValue([
        {
          agentId: 'conductor',
          name: 'しきるん',
          emoji: '🎭',
          paneId: '%0',
          status: 'running'
        },
        {
          agentId: 'codegen',
          name: 'カエデ',
          emoji: '🍁',
          paneId: '%1',
          status: 'stopped'
        }
      ]);

      const statuses = await manager.getAllAgentStatus();
      expect(statuses).toHaveLength(2);
      expect(statuses[0].agentId).toBe('conductor');
      expect(statuses[1].agentId).toBe('codegen');
    });
  });

  describe('sendToAgent', () => {
    it('should send message to agent', async () => {
      await manager.sendToAgent('conductor', 'test message');
      expect(mockTmux.sendCommand).toHaveBeenCalledWith(
        expect.stringContaining('%0'),
        expect.stringContaining('test message')
      );
    });

    it('should throw for unknown agent', async () => {
      mockTmux.sendCommand.mockImplementation(() => {
        throw new Error('Agent not found');
      });

      await expect(manager.sendToAgent('unknown', 'test')).rejects.toThrow();
    });
  });

  describe('assignTask', () => {
    it('should assign task to agent', async () => {
      const taskId = await manager.assignTask('conductor', {
        type: 'test',
        description: 'test task',
        status: 'pending'
      });

      expect(taskId).toBeTruthy();
      expect(taskId).toMatch(/^task-/);
      expect(mockTmux.sendCommand).toHaveBeenCalledWith(
        expect.stringContaining('%0'),
        expect.stringContaining('test task')
      );
    });
  });

  describe('getAgentStats', () => {
    it('should return agent statistics', async () => {
      (manager as any).tmux.getAllAgentStatus.mockResolvedValue([
        { agentId: 'conductor', name: 'しきるん', emoji: '🎭', paneId: '%0', status: 'running' },
        { agentId: 'codegen', name: 'カエデ', emoji: '🍁', paneId: '%1', status: 'running' },
        { agentId: 'review', name: 'サクラ', emoji: '🌸', paneId: '%2', status: 'stopped' },
        { agentId: 'pr', name: 'ツバキ', emoji: '🌺', paneId: '%3', status: 'stopped' },
        { agentId: 'deploy', name: 'ボタン', emoji: '🌼', paneId: '%4', status: 'unresponsive' },
        { agentId: 'workflow', name: 'ながれるん', emoji: '🌊', paneId: '%5', status: 'stopped' }
      ]);

      const stats = await manager.getAgentStats();

      expect(stats.total).toBe(6);
      expect(stats.running).toBe(2);
      expect(stats.stopped).toBe(3);
      expect(stats.unresponsive).toBe(1);
    });
  });
});

describe('WorkflowManager', () => {
  let manager: WorkflowManager;
  let mockAgentManager: {
    sendToAgent: ReturnType<typeof vi.fn>;
  };
  let mockGitHubClient: {
    createIssue: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockAgentManager = {
      sendToAgent: vi.fn().mockResolvedValue(undefined)
    };

    mockGitHubClient = {
      createIssue: vi.fn()
    };

    manager = new WorkflowManager({
      tmux: { session: 'test', target: 'agents.0' }
    } as any);

    (manager as any).agentManager = mockAgentManager;
    (manager as any).githubClient = mockGitHubClient;
  });

  describe('listWorkflows', () => {
    it('should return all workflows', () => {
      const workflows = manager.listWorkflows();
      expect(workflows.length).toBeGreaterThan(0);

      const iddFlow = workflows.find(w => w.id === 'idd-flow');
      expect(iddFlow).toBeDefined();
      expect(iddFlow?.name).toBe('Issue-Driven Development Flow');
    });
  });

  describe('listEnabledWorkflows', () => {
    it('should return only enabled workflows', () => {
      const workflows = manager.listEnabledWorkflows();
      expect(workflows.length).toBeGreaterThan(0);

      workflows.forEach(w => {
        expect(w.enabled).toBe(true);
      });
    });
  });

  describe('getWorkflow', () => {
    it('should return workflow by id', () => {
      const workflow = manager.getWorkflow('idd-flow');
      expect(workflow).toBeTruthy();
      expect(workflow?.id).toBe('idd-flow');
    });

    it('should return null for unknown workflow', () => {
      const workflow = manager.getWorkflow('unknown');
      expect(workflow).toBeNull();
    });
  });

  describe('executeWorkflow', () => {
    it('should execute workflow successfully', async () => {
      mockAgentManager.sendToAgent.mockResolvedValue(undefined);

      const execution = await manager.executeWorkflow('idd-flow');

      expect(execution.status).toBe('completed');
      expect(execution.workflowId).toBe('idd-flow');
      expect(execution.steps.length).toBe(5);
    });

    it('should fail for unknown workflow', async () => {
      await expect(manager.executeWorkflow('unknown')).rejects.toThrow();
    });

    it('should fail for disabled workflow', async () => {
      manager.disableWorkflow('idd-flow');

      await expect(manager.executeWorkflow('idd-flow')).rejects.toThrow();
    });

    it('should mark execution as failed on step error', async () => {
      mockAgentManager.sendToAgent.mockRejectedValue(new Error('Step failed'));

      // executeWorkflow should throw on step error when continueOnError is false
      await expect(manager.executeWorkflow('idd-flow')).rejects.toThrow('Step failed');
    });

    it('should create execution record', async () => {
      mockAgentManager.sendToAgent.mockResolvedValue(undefined);

      const execution = await manager.executeWorkflow('idd-flow');

      expect(execution.id).toBeTruthy();
      expect(execution.startedAt).toBeInstanceOf(Date);
      expect(execution.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('enableWorkflow', () => {
    it('should enable workflow', () => {
      manager.disableWorkflow('idd-flow');
      expect(manager.getWorkflow('idd-flow')?.enabled).toBe(false);

      const success = manager.enableWorkflow('idd-flow');
      expect(success).toBe(true);
      expect(manager.getWorkflow('idd-flow')?.enabled).toBe(true);
    });

    it('should return false for unknown workflow', () => {
      const success = manager.enableWorkflow('unknown');
      expect(success).toBe(false);
    });
  });

  describe('disableWorkflow', () => {
    it('should disable workflow', () => {
      const success = manager.disableWorkflow('idd-flow');
      expect(success).toBe(true);
      expect(manager.getWorkflow('idd-flow')?.enabled).toBe(false);
    });

    it('should return false for unknown workflow', () => {
      const success = manager.disableWorkflow('unknown');
      expect(success).toBe(false);
    });
  });

  describe('listExecutions', () => {
    it('should return all executions', () => {
      const executions = manager.listExecutions();
      expect(Array.isArray(executions)).toBe(true);
    });

    it('should filter executions by workflow id', async () => {
      mockAgentManager.sendToAgent.mockResolvedValue(undefined);

      await manager.executeWorkflow('idd-flow');

      const executions = manager.listExecutions('idd-flow');
      expect(executions.length).toBeGreaterThan(0);
      executions.forEach(e => {
        expect(e.workflowId).toBe('idd-flow');
      });
    });
  });

  describe('getExecution', () => {
    it('should return execution by id', async () => {
      mockAgentManager.sendToAgent.mockResolvedValue(undefined);

      const execution = await manager.executeWorkflow('idd-flow');

      const retrieved = manager.getExecution(execution.id);
      expect(retrieved).toBe(execution);
    });

    it('should return null for unknown execution', () => {
      const execution = manager.getExecution('unknown-exec');
      expect(execution).toBeNull();
    });
  });
});
