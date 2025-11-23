/**
 * Agents Service
 *
 * Handles all agent-related API calls including agent control,
 * configuration, metrics, and logs.
 */

import { apiClient } from '../api/client';
import type { Agent, AgentConfig, AgentMetrics } from '@/types/agent';

export interface ExecuteAgentRequest {
  repository_id: string;
  issue_number: number;
  agent_type: string;
  options?: {
    use_worktree?: boolean;
    auto_pr?: boolean;
    slack_notify?: boolean;
  };
}

export interface ExecuteAgentResponse {
  execution_id: string;
  status: string;
  message: string;
}

export class AgentsService {
  /**
   * Get all agents
   */
  async getAgents(): Promise<Agent[]> {
    return await apiClient.getAgents();
  }

  /**
   * Get a single agent by ID
   */
  async getAgent(id: string): Promise<Agent> {
    return await apiClient.getAgent(id);
  }

  /**
   * Configure an agent
   */
  async configureAgent(id: string, config: Partial<AgentConfig>): Promise<Agent> {
    return await apiClient.configureAgent(id, config);
  }

  /**
   * Start an agent
   */
  async startAgent(id: string): Promise<void> {
    return await apiClient.startAgent(id);
  }

  /**
   * Stop an agent
   */
  async stopAgent(id: string): Promise<void> {
    return await apiClient.stopAgent(id);
  }

  /**
   * Pause an agent
   */
  async pauseAgent(id: string): Promise<void> {
    return await apiClient.pauseAgent(id);
  }

  /**
   * Resume a paused agent
   */
  async resumeAgent(id: string): Promise<void> {
    return await apiClient.resumeAgent(id);
  }

  /**
   * Restart an agent
   */
  async restartAgent(id: string): Promise<void> {
    return await apiClient.restartAgent(id);
  }

  /**
   * Get agent metrics
   */
  async getAgentMetrics(id: string): Promise<AgentMetrics> {
    return await apiClient.getAgentMetrics(id);
  }

  /**
   * Get agent logs
   */
  async getAgentLogs(id: string, limit = 100): Promise<string[]> {
    return await apiClient.getAgentLogs(id, limit);
  }

  /**
   * Execute an agent on an issue
   * This triggers agent execution via the backend API
   */
  async executeAgent(request: ExecuteAgentRequest): Promise<ExecuteAgentResponse> {
    // TODO: Implement once backend endpoint is ready
    // For now, return mock response
    return {
      execution_id: `exec-${Date.now()}`,
      status: 'pending',
      message: `Agent ${request.agent_type} execution queued for issue #${request.issue_number}`,
    };
  }

  /**
   * Get all agents by category
   */
  async getAgentsByCategory(category: string): Promise<Agent[]> {
    const agents = await this.getAgents();
    return agents.filter(agent => {
      // Implement category filtering logic based on agent type
      // This is a placeholder - adjust based on actual agent categories
      if (category === 'coding') {
        return ['coordinator-agent', 'codegen-agent', 'review-agent', 'pr-agent', 'deployment-agent', 'issue-agent'].includes(agent.id);
      }
      return true;
    });
  }

  /**
   * Get agents by layer
   */
  async getAgentsByLayer(layer: number): Promise<Agent[]> {
    const agents = await this.getAgents();
    return agents.filter(agent => agent.layer === layer);
  }

  /**
   * Get active agents
   */
  async getActiveAgents(): Promise<Agent[]> {
    const agents = await this.getAgents();
    return agents.filter(agent => agent.status === 'active' || agent.status === 'idle');
  }

  /**
   * Bulk start agents
   */
  async startMultipleAgents(ids: string[]): Promise<void> {
    await Promise.all(ids.map(id => this.startAgent(id)));
  }

  /**
   * Bulk stop agents
   */
  async stopMultipleAgents(ids: string[]): Promise<void> {
    await Promise.all(ids.map(id => this.stopAgent(id)));
  }
}

// Singleton instance
export const agentsService = new AgentsService();
