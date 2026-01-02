import { HibernationConfig, Logger } from '../performance/AgentHibernationManager';
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
export declare class AgentPoolManager {
    private config;
    private logger;
    private agents;
    private hibernationManager;
    constructor(config: AgentConfig, logger: Logger);
    createAgent(agentId: string): Agent;
    getAgent(agentId: string): Agent | undefined;
    hibernateAgent(agentId: string): void;
    wakeupAgent(agentId: string): void;
    terminateAgent(agentId: string): void;
    getActiveAgents(): Agent[];
    getHibernatedAgents(): Agent[];
    cleanup(): void;
}
