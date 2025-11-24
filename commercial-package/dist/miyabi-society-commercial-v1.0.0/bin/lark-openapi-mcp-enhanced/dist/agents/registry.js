"use strict";
/**
 * Agent Registry and Discovery System
 * Manages agent lifecycle, capabilities, and service discovery
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentFactory = exports.globalRegistry = exports.AgentRegistry = void 0;
const events_1 = require("events");
const communication_1 = require("./communication");
class AgentRegistry extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this.agents = new Map();
        this.agentsByType = new Map();
        this.agentsByCapability = new Map();
        this.config = {
            maxAgentsPerType: config.maxAgentsPerType || 10,
            healthCheckInterval: config.healthCheckInterval || 30000,
            registrationTimeout: config.registrationTimeout || 60000,
            ...config,
        };
        // Initialize agent type maps
        const agentTypes = ['coordinator', 'specialist', 'bridge', 'monitor', 'recovery'];
        agentTypes.forEach((type) => {
            this.agentsByType.set(type, new Set());
        });
        // Start health check monitoring
        this.healthCheckInterval = setInterval(() => {
            this.performHealthChecks();
        }, this.config.healthCheckInterval);
    }
    /**
     * Register a new agent in the system
     */
    async registerAgent(metadata) {
        try {
            // Validate agent metadata
            if (!this.validateAgentMetadata(metadata)) {
                throw new Error('Invalid agent metadata');
            }
            // Check if agent type has reached maximum capacity
            const typeAgents = this.agentsByType.get(metadata.type) || new Set();
            if (typeAgents.size >= this.config.maxAgentsPerType) {
                throw new Error(`Maximum agents reached for type: ${metadata.type}`);
            }
            // Check for duplicate agent ID
            if (this.agents.has(metadata.id)) {
                throw new Error(`Agent with ID ${metadata.id} already registered`);
            }
            // Register agent
            const agentData = {
                ...metadata,
                status: 'idle',
                currentTasks: 0,
                lastHeartbeat: new Date(),
            };
            this.agents.set(metadata.id, agentData);
            typeAgents.add(metadata.id);
            this.agentsByType.set(metadata.type, typeAgents);
            // Index by capabilities
            metadata.capabilities.forEach((capability) => {
                if (!this.agentsByCapability.has(capability.name)) {
                    this.agentsByCapability.set(capability.name, new Set());
                }
                this.agentsByCapability.get(capability.name).add(metadata.id);
            });
            // Register with communication bus
            communication_1.globalCommBus.registerAgent(agentData);
            this.emit('agent_registered', agentData);
            console.log(`✅ Agent registered: ${metadata.name} (${metadata.id})`);
            return true;
        }
        catch (error) {
            console.error(`❌ Failed to register agent ${metadata.id}:`, error);
            return false;
        }
    }
    /**
     * Unregister an agent from the system
     */
    async unregisterAgent(agentId) {
        try {
            const agent = this.agents.get(agentId);
            if (!agent) {
                return false;
            }
            // Remove from type index
            const typeAgents = this.agentsByType.get(agent.type);
            if (typeAgents) {
                typeAgents.delete(agentId);
            }
            // Remove from capability index
            agent.capabilities.forEach((capability) => {
                const capabilityAgents = this.agentsByCapability.get(capability.name);
                if (capabilityAgents) {
                    capabilityAgents.delete(agentId);
                    if (capabilityAgents.size === 0) {
                        this.agentsByCapability.delete(capability.name);
                    }
                }
            });
            // Remove from main registry
            this.agents.delete(agentId);
            // Unregister from communication bus
            communication_1.globalCommBus.unregisterAgent(agentId);
            this.emit('agent_unregistered', agent);
            console.log(`🗑️ Agent unregistered: ${agent.name} (${agentId})`);
            return true;
        }
        catch (error) {
            console.error(`❌ Failed to unregister agent ${agentId}:`, error);
            return false;
        }
    }
    /**
     * Discover agents by capability
     */
    discoverAgents(capability) {
        const agentIds = this.agentsByCapability.get(capability) || new Set();
        return Array.from(agentIds)
            .map((id) => this.agents.get(id))
            .filter((agent) => agent !== undefined && agent.status !== 'offline');
    }
    /**
     * Discover agents by type
     */
    discoverAgentsByType(type) {
        const agentIds = this.agentsByType.get(type) || new Set();
        return Array.from(agentIds)
            .map((id) => this.agents.get(id))
            .filter((agent) => agent !== undefined && agent.status !== 'offline');
    }
    /**
     * Find best available agent for a task
     */
    findBestAgent(capability, options = {}) {
        const candidates = this.discoverAgents(capability).filter((agent) => {
            var _a;
            // Filter by type preference
            if (options.preferredType && agent.type !== options.preferredType) {
                return false;
            }
            // Filter by max load
            const loadRatio = agent.currentTasks / agent.maxConcurrentTasks;
            if (options.maxLoad && loadRatio > options.maxLoad) {
                return false;
            }
            // Exclude specific agents
            if ((_a = options.excludeAgents) === null || _a === void 0 ? void 0 : _a.includes(agent.id)) {
                return false;
            }
            // Must have capacity for new tasks
            return agent.currentTasks < agent.maxConcurrentTasks;
        });
        if (candidates.length === 0) {
            return null;
        }
        // Sort by load (ascending) and prioritize coordinators
        candidates.sort((a, b) => {
            const loadA = a.currentTasks / a.maxConcurrentTasks;
            const loadB = b.currentTasks / b.maxConcurrentTasks;
            // Prefer coordinators for complex tasks
            if (a.type === 'coordinator' && b.type !== 'coordinator')
                return -1;
            if (b.type === 'coordinator' && a.type !== 'coordinator')
                return 1;
            return loadA - loadB;
        });
        return candidates[0];
    }
    /**
     * Get agent by ID
     */
    getAgent(agentId) {
        return this.agents.get(agentId);
    }
    /**
     * Get all registered agents
     */
    getAllAgents() {
        return Array.from(this.agents.values());
    }
    /**
     * Get agents statistics
     */
    getStatistics() {
        const stats = {
            totalAgents: this.agents.size,
            activeAgents: 0,
            busyAgents: 0,
            offlineAgents: 0,
            byType: {},
            byCapability: {},
            totalTasks: 0,
        };
        // Initialize type counters
        const agentTypes = ['coordinator', 'specialist', 'bridge', 'monitor', 'recovery'];
        agentTypes.forEach((type) => {
            stats.byType[type] = 0;
        });
        // Calculate statistics
        for (const agent of this.agents.values()) {
            stats.byType[agent.type]++;
            stats.totalTasks += agent.currentTasks;
            switch (agent.status) {
                case 'idle':
                    stats.activeAgents++;
                    break;
                case 'busy':
                    stats.busyAgents++;
                    break;
                case 'offline':
                    stats.offlineAgents++;
                    break;
            }
        }
        // Capability statistics
        for (const [capability, agentIds] of this.agentsByCapability.entries()) {
            stats.byCapability[capability] = agentIds.size;
        }
        return stats;
    }
    /**
     * Update agent heartbeat
     */
    updateHeartbeat(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent)
            return false;
        agent.lastHeartbeat = new Date();
        if (agent.status === 'offline') {
            agent.status = 'idle';
        }
        communication_1.globalCommBus.updateHeartbeat(agentId);
        return true;
    }
    /**
     * Update agent task count
     */
    updateAgentTasks(agentId, taskCount) {
        const agent = this.agents.get(agentId);
        if (!agent)
            return false;
        agent.currentTasks = Math.max(0, taskCount);
        agent.status = taskCount > 0 ? 'busy' : 'idle';
        communication_1.globalCommBus.updateAgentTaskCount(agentId, taskCount);
        return true;
    }
    /**
     * Validate agent metadata
     */
    validateAgentMetadata(metadata) {
        if (!metadata.id || !metadata.name || !metadata.type) {
            return false;
        }
        if (!metadata.capabilities || metadata.capabilities.length === 0) {
            return false;
        }
        if (metadata.maxConcurrentTasks <= 0) {
            return false;
        }
        return true;
    }
    /**
     * Perform health checks on all agents
     */
    performHealthChecks() {
        const now = new Date();
        const timeout = this.config.registrationTimeout;
        let offlineCount = 0;
        for (const [agentId, agent] of this.agents.entries()) {
            const timeSinceHeartbeat = now.getTime() - agent.lastHeartbeat.getTime();
            if (timeSinceHeartbeat > timeout && agent.status !== 'offline') {
                agent.status = 'offline';
                agent.currentTasks = 0;
                offlineCount++;
                this.emit('agent_offline', agent);
                console.warn(`⚠️ Agent ${agent.name} (${agentId}) marked as offline`);
            }
        }
        if (offlineCount > 0) {
            console.log(`🏥 Health check completed: ${offlineCount} agents marked offline`);
        }
    }
    /**
     * Cleanup resources
     */
    destroy() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        this.removeAllListeners();
        this.agents.clear();
        this.agentsByType.clear();
        this.agentsByCapability.clear();
    }
}
exports.AgentRegistry = AgentRegistry;
// Global registry instance
exports.globalRegistry = new AgentRegistry();
// Export agent creation helpers
exports.AgentFactory = {
    /**
     * Create coordinator agent metadata
     */
    createCoordinator(name, capabilities) {
        return {
            id: `coordinator_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            type: 'coordinator',
            capabilities,
            status: 'idle',
            maxConcurrentTasks: 5,
            currentTasks: 0,
            lastHeartbeat: new Date(),
            version: '1.0.0',
        };
    },
    /**
     * Create specialist agent metadata
     */
    createSpecialist(name, category, capabilities) {
        return {
            id: `specialist_${category}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            type: 'specialist',
            capabilities,
            status: 'idle',
            maxConcurrentTasks: 3,
            currentTasks: 0,
            lastHeartbeat: new Date(),
            version: '1.0.0',
        };
    },
    /**
     * Create bridge agent metadata
     */
    createBridge(name, capabilities) {
        return {
            id: `bridge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            type: 'bridge',
            capabilities,
            status: 'idle',
            maxConcurrentTasks: 2,
            currentTasks: 0,
            lastHeartbeat: new Date(),
            version: '1.0.0',
        };
    },
};
