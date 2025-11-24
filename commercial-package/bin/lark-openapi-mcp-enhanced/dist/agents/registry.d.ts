/**
 * Agent Registry and Discovery System
 * Manages agent lifecycle, capabilities, and service discovery
 */
import { EventEmitter } from 'events';
import { AgentMetadata, AgentCapability, AgentType } from './types';
export interface AgentRegistryConfig {
    maxAgentsPerType?: number;
    healthCheckInterval?: number;
    registrationTimeout?: number;
}
export declare class AgentRegistry extends EventEmitter {
    private agents;
    private agentsByType;
    private agentsByCapability;
    private healthCheckInterval;
    private config;
    constructor(config?: AgentRegistryConfig);
    /**
     * Register a new agent in the system
     */
    registerAgent(metadata: AgentMetadata): Promise<boolean>;
    /**
     * Unregister an agent from the system
     */
    unregisterAgent(agentId: string): Promise<boolean>;
    /**
     * Discover agents by capability
     */
    discoverAgents(capability: string): AgentMetadata[];
    /**
     * Discover agents by type
     */
    discoverAgentsByType(type: AgentType): AgentMetadata[];
    /**
     * Find best available agent for a task
     */
    findBestAgent(capability: string, options?: {
        preferredType?: AgentType;
        maxLoad?: number;
        excludeAgents?: string[];
    }): AgentMetadata | null;
    /**
     * Get agent by ID
     */
    getAgent(agentId: string): AgentMetadata | undefined;
    /**
     * Get all registered agents
     */
    getAllAgents(): AgentMetadata[];
    /**
     * Get agents statistics
     */
    getStatistics(): {
        totalAgents: number;
        activeAgents: number;
        busyAgents: number;
        offlineAgents: number;
        byType: Record<AgentType, number>;
        byCapability: Record<string, number>;
        totalTasks: number;
    };
    /**
     * Update agent heartbeat
     */
    updateHeartbeat(agentId: string): boolean;
    /**
     * Update agent task count
     */
    updateAgentTasks(agentId: string, taskCount: number): boolean;
    /**
     * Validate agent metadata
     */
    private validateAgentMetadata;
    /**
     * Perform health checks on all agents
     */
    private performHealthChecks;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
export declare const globalRegistry: AgentRegistry;
export declare const AgentFactory: {
    /**
     * Create coordinator agent metadata
     */
    createCoordinator(name: string, capabilities: AgentCapability[]): AgentMetadata;
    /**
     * Create specialist agent metadata
     */
    createSpecialist(name: string, category: string, capabilities: AgentCapability[]): AgentMetadata;
    /**
     * Create bridge agent metadata
     */
    createBridge(name: string, capabilities: AgentCapability[]): AgentMetadata;
};
