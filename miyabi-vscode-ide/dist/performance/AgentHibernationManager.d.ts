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
export declare class AgentHibernationManager {
    private config;
    private logger;
    private hibernatedAgents;
    private hibernationTimers;
    constructor(config: HibernationConfig, logger: Logger);
    hibernateAgent(agentId: string): void;
    wakeupAgent(agentId: string): boolean;
    isHibernated(agentId: string): boolean;
    getHibernatedAgents(): string[];
    cleanup(): void;
}
