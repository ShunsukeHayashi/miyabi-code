"use strict";
/**
 * Agent Communication Protocol Implementation
 * Based on AIstudio structured communication patterns
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalCommBus = exports.AgentCommunicationBus = void 0;
exports.parseStructuredResponse = parseStructuredResponse;
exports.parseTaskAssignment = parseTaskAssignment;
const events_1 = require("events");
const types_1 = require("./types");
class AgentCommunicationBus extends events_1.EventEmitter {
    constructor() {
        super();
        this.agents = new Map();
        this.messageQueue = new Map();
        // Start heartbeat monitoring
        this.heartbeatInterval = setInterval(() => this.checkHeartbeats(), 30000);
    }
    /**
     * Register agent in the communication bus
     */
    registerAgent(metadata) {
        this.agents.set(metadata.id, {
            ...metadata,
            status: 'idle',
            currentTasks: 0,
            lastHeartbeat: new Date(),
        });
        this.messageQueue.set(metadata.id, []);
        this.emit('agent_registered', {
            type: 'agent_registered',
            agentId: metadata.id,
            data: metadata,
            timestamp: new Date(),
        });
    }
    /**
     * Unregister agent from communication bus
     */
    unregisterAgent(agentId) {
        this.agents.delete(agentId);
        this.messageQueue.delete(agentId);
        this.emit('agent_offline', {
            type: 'agent_offline',
            agentId,
            data: null,
            timestamp: new Date(),
        });
    }
    /**
     * Send message between agents
     */
    async sendMessage(message) {
        const targetAgent = this.agents.get(message.to);
        if (!targetAgent) {
            console.warn(`Agent ${message.to} not found`);
            return false;
        }
        // Add message to target agent's queue
        const queue = this.messageQueue.get(message.to) || [];
        queue.push(message);
        this.messageQueue.set(message.to, queue);
        this.emit('message_sent', {
            type: 'message_sent',
            agentId: message.from,
            data: message,
            timestamp: new Date(),
        });
        return true;
    }
    /**
     * Broadcast message to all agents with specific capability
     */
    async broadcastByCapability(fromAgentId, capability, payload) {
        const targetAgents = Array.from(this.agents.values()).filter((agent) => agent.id !== fromAgentId && agent.capabilities.some((cap) => cap.name === capability));
        const messages = targetAgents.map((agent) => ({
            id: this.generateMessageId(),
            from: fromAgentId,
            to: agent.id,
            type: 'broadcast',
            payload,
            timestamp: new Date(),
        }));
        const results = await Promise.all(messages.map((message) => this.sendMessage(message)));
        return targetAgents.filter((_, index) => results[index]).map((agent) => agent.id);
    }
    /**
     * Get pending messages for an agent
     */
    getMessages(agentId) {
        const messages = this.messageQueue.get(agentId) || [];
        this.messageQueue.set(agentId, []); // Clear after retrieval
        messages.forEach((message) => {
            this.emit('message_received', {
                type: 'message_received',
                agentId,
                data: message,
                timestamp: new Date(),
            });
        });
        return messages;
    }
    /**
     * Find agents by capability
     */
    findAgentsByCapability(capability) {
        return Array.from(this.agents.values()).filter((agent) => agent.status !== 'offline' && agent.capabilities.some((cap) => cap.name === capability));
    }
    /**
     * Find best agent for task (load balancing)
     */
    findBestAgentForTask(capability, priority = 'medium') {
        const candidates = this.findAgentsByCapability(capability).filter((agent) => agent.currentTasks < agent.maxConcurrentTasks);
        if (candidates.length === 0)
            return null;
        // Sort by current load and priority handling
        candidates.sort((a, b) => {
            const loadA = a.currentTasks / a.maxConcurrentTasks;
            const loadB = b.currentTasks / b.maxConcurrentTasks;
            return loadA - loadB;
        });
        return candidates[0];
    }
    /**
     * Update agent heartbeat
     */
    updateHeartbeat(agentId) {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.lastHeartbeat = new Date();
            this.agents.set(agentId, agent);
        }
    }
    /**
     * Update agent task count
     */
    updateAgentTaskCount(agentId, taskCount) {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.currentTasks = Math.max(0, taskCount);
            agent.status = taskCount > 0 ? 'busy' : 'idle';
            this.agents.set(agentId, agent);
        }
    }
    /**
     * Get all registered agents
     */
    getAllAgents() {
        return Array.from(this.agents.values());
    }
    /**
     * Get agent by ID
     */
    getAgent(agentId) {
        return this.agents.get(agentId);
    }
    /**
     * Check agent heartbeats and mark offline if needed
     */
    checkHeartbeats() {
        const now = new Date();
        const timeout = 60000; // 1 minute timeout
        for (const [agentId, agent] of this.agents.entries()) {
            if (now.getTime() - agent.lastHeartbeat.getTime() > timeout) {
                agent.status = 'offline';
                this.agents.set(agentId, agent);
                this.emit('agent_offline', {
                    type: 'agent_offline',
                    agentId,
                    data: { reason: 'heartbeat_timeout' },
                    timestamp: new Date(),
                });
            }
        }
    }
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Cleanup resources
     */
    destroy() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        this.removeAllListeners();
        this.agents.clear();
        this.messageQueue.clear();
    }
}
exports.AgentCommunicationBus = AgentCommunicationBus;
/**
 * Parse structured response with delimiter-based extraction
 * Based on AIstudio's parseStructuredDataSafely pattern
 */
function parseStructuredResponse(responseText, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            // Look for structured response delimiters
            const startIdx = responseText.indexOf(types_1.RESPONSE_DELIMITERS.STRUCTURED_START);
            const endIdx = responseText.indexOf(types_1.RESPONSE_DELIMITERS.STRUCTURED_END);
            if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
                if (attempt === maxRetries - 1) {
                    // Fallback: try to extract JSON from anywhere in the response
                    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        return JSON.parse(jsonMatch[0]);
                    }
                }
                continue;
            }
            const structuredPart = responseText
                .substring(startIdx + types_1.RESPONSE_DELIMITERS.STRUCTURED_START.length, endIdx)
                .trim();
            return JSON.parse(structuredPart);
        }
        catch (error) {
            if (attempt === maxRetries - 1) {
                console.error('[Agent Communication] Failed to parse structured response:', error);
                return null;
            }
            // Clean up response for retry
            responseText = responseText.replace(/```json\s*|\s*```/g, '').replace(/^[^{]*({.*})[^}]*$/s, '$1');
        }
    }
    return null;
}
/**
 * Parse task assignment from structured response
 */
function parseTaskAssignment(responseText) {
    const startIdx = responseText.indexOf(types_1.RESPONSE_DELIMITERS.TASK_ASSIGNMENT_START);
    const endIdx = responseText.indexOf(types_1.RESPONSE_DELIMITERS.TASK_ASSIGNMENT_END);
    if (startIdx === -1 || endIdx === -1)
        return null;
    try {
        const assignmentPart = responseText
            .substring(startIdx + types_1.RESPONSE_DELIMITERS.TASK_ASSIGNMENT_START.length, endIdx)
            .trim();
        return JSON.parse(assignmentPart);
    }
    catch (error) {
        console.error('[Agent Communication] Failed to parse task assignment:', error);
        return null;
    }
}
// Global communication bus instance
exports.globalCommBus = new AgentCommunicationBus();
