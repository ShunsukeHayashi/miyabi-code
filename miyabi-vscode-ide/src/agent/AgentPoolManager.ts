import { AgentHibernationManager, HibernationConfig, Logger } from '../performance/AgentHibernationManager';

export interface AgentConfig {
  maxConcurrentAgents: number;
  agentTimeout: number;
  hibernation: HibernationConfig;
}

export interface Agent {
  id: string;
  status: 'active' | 'hibernated' | 'terminated';
  lastActivity: Date;
}

export class AgentPoolManager {
  private agents: Map<string, Agent> = new Map();
  private hibernationManager: AgentHibernationManager;

  constructor(
    private config: AgentConfig,
    private logger: Logger
  ) {
    // ✅ Fix: Constructor now called with correct 2 parameters (config, logger)
    this.hibernationManager = new AgentHibernationManager(this.config.hibernation, this.logger);

    this.logger.info('AgentPoolManager initialized');
  }

  createAgent(agentId: string): Agent {
    if (this.agents.has(agentId)) {
      throw new Error(`Agent ${agentId} already exists`);
    }

    const agent: Agent = {
      id: agentId,
      status: 'active',
      lastActivity: new Date()
    };

    this.agents.set(agentId, agent);
    this.logger.info(`Agent ${agentId} created`);

    return agent;
  }

  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  hibernateAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    agent.status = 'hibernated';
    this.hibernationManager.hibernateAgent(agentId);

    this.logger.info(`Agent ${agentId} hibernated`);
  }

  wakeupAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (this.hibernationManager.wakeupAgent(agentId)) {
      agent.status = 'active';
      agent.lastActivity = new Date();
      this.logger.info(`Agent ${agentId} awakened`);
    }
  }

  terminateAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    if (agent.status === 'hibernated') {
      this.hibernationManager.wakeupAgent(agentId);
    }

    agent.status = 'terminated';
    this.agents.delete(agentId);

    this.logger.info(`Agent ${agentId} terminated`);
  }

  getActiveAgents(): Agent[] {
    return Array.from(this.agents.values()).filter(agent => agent.status === 'active');
  }

  getHibernatedAgents(): Agent[] {
    return Array.from(this.agents.values()).filter(agent => agent.status === 'hibernated');
  }

  cleanup(): void {
    this.hibernationManager.cleanup();
    this.agents.clear();
    this.logger.info('AgentPoolManager cleaned up');
  }
}