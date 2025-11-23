/**
 * Coordinator Agent - Simplified Implementation
 * Manages task distribution and workflow coordination
 */
import { Agent, AgentConfig } from '../agent';
export declare class CoordinatorAgent extends Agent {
    private activeTasks;
    private workflows;
    constructor(config?: Partial<AgentConfig>);
    private createCoordinatorTools;
    /**
     * Simple task assignment logic
     */
    assignTask(taskDescription: string, priority?: 'low' | 'medium' | 'high'): Promise<string>;
    private determineAgentType;
}
/**
 * Create and register Coordinator Agent
 */
export declare function createCoordinator(): Promise<string>;
