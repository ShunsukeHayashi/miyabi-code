import { randomUUID } from 'crypto';

export interface HibernationConfig {
  idleTimeout: number;
  maxHibernatedAgents: number;
  checkInterval: number;
}

export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
}

export class AgentHibernationManager {
  private hibernatedAgents: Map<string, Date> = new Map();
  private hibernationTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private config: HibernationConfig,
    private logger: Logger
  ) {
    this.logger.info('AgentHibernationManager initialized with config');
  }

  hibernateAgent(agentId: string): void {
    const hibernationId = randomUUID();
    this.hibernatedAgents.set(agentId, new Date());

    this.logger.info(`Agent ${agentId} hibernated with ID: ${hibernationId}`);

    // Set up wake-up timer
    const timer = setTimeout(() => {
      this.wakeupAgent(agentId);
    }, this.config.idleTimeout);

    this.hibernationTimers.set(agentId, timer);
  }

  wakeupAgent(agentId: string): boolean {
    if (this.hibernatedAgents.has(agentId)) {
      this.hibernatedAgents.delete(agentId);

      const timer = this.hibernationTimers.get(agentId);
      if (timer) {
        clearTimeout(timer);
        this.hibernationTimers.delete(agentId);
      }

      this.logger.info(`Agent ${agentId} awakened from hibernation`);
      return true;
    }

    return false;
  }

  isHibernated(agentId: string): boolean {
    return this.hibernatedAgents.has(agentId);
  }

  getHibernatedAgents(): string[] {
    return Array.from(this.hibernatedAgents.keys());
  }

  cleanup(): void {
    this.hibernationTimers.forEach(timer => clearTimeout(timer));
    this.hibernationTimers.clear();
    this.hibernatedAgents.clear();
    this.logger.info('AgentHibernationManager cleaned up');
  }
}