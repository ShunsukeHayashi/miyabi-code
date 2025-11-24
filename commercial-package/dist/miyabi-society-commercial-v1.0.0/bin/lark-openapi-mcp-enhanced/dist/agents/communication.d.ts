/**
 * Agent Communication Protocol Implementation
 * Based on AIstudio structured communication patterns
 */
import { EventEmitter } from 'events';
import { AgentMessage, AgentMetadata, StructuredResponse, TaskAssignment } from './types';
export declare class AgentCommunicationBus extends EventEmitter {
    private agents;
    private messageQueue;
    private heartbeatInterval;
    constructor();
    /**
     * Register agent in the communication bus
     */
    registerAgent(metadata: AgentMetadata): void;
    /**
     * Unregister agent from communication bus
     */
    unregisterAgent(agentId: string): void;
    /**
     * Send message between agents
     */
    sendMessage(message: AgentMessage): Promise<boolean>;
    /**
     * Broadcast message to all agents with specific capability
     */
    broadcastByCapability(fromAgentId: string, capability: string, payload: any): Promise<string[]>;
    /**
     * Get pending messages for an agent
     */
    getMessages(agentId: string): AgentMessage[];
    /**
     * Find agents by capability
     */
    findAgentsByCapability(capability: string): AgentMetadata[];
    /**
     * Find best agent for task (load balancing)
     */
    findBestAgentForTask(capability: string, priority?: 'low' | 'medium' | 'high' | 'urgent'): AgentMetadata | null;
    /**
     * Update agent heartbeat
     */
    updateHeartbeat(agentId: string): void;
    /**
     * Update agent task count
     */
    updateAgentTaskCount(agentId: string, taskCount: number): void;
    /**
     * Get all registered agents
     */
    getAllAgents(): AgentMetadata[];
    /**
     * Get agent by ID
     */
    getAgent(agentId: string): AgentMetadata | undefined;
    /**
     * Check agent heartbeats and mark offline if needed
     */
    private checkHeartbeats;
    private generateMessageId;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
/**
 * Parse structured response with delimiter-based extraction
 * Based on AIstudio's parseStructuredDataSafely pattern
 */
export declare function parseStructuredResponse(responseText: string, maxRetries?: number): StructuredResponse | null;
/**
 * Parse task assignment from structured response
 */
export declare function parseTaskAssignment(responseText: string): TaskAssignment | null;
export declare const globalCommBus: AgentCommunicationBus;
