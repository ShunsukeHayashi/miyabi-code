"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentPoolManager = void 0;
const AgentHibernationManager_1 = require("../performance/AgentHibernationManager");
class AgentPoolManager {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.agents = new Map();
        // ✅ Fix: Constructor now called with correct 2 parameters (config, logger)
        this.hibernationManager = new AgentHibernationManager_1.AgentHibernationManager(this.config.hibernation, this.logger);
        this.logger.info('AgentPoolManager initialized');
    }
    createAgent(agentId) {
        if (this.agents.has(agentId)) {
            throw new Error(`Agent ${agentId} already exists`);
        }
        const agent = {
            id: agentId,
            status: 'active',
            lastActivity: new Date()
        };
        this.agents.set(agentId, agent);
        this.logger.info(`Agent ${agentId} created`);
        return agent;
    }
    getAgent(agentId) {
        return this.agents.get(agentId);
    }
    hibernateAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }
        agent.status = 'hibernated';
        this.hibernationManager.hibernateAgent(agentId);
        this.logger.info(`Agent ${agentId} hibernated`);
    }
    wakeupAgent(agentId) {
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
    terminateAgent(agentId) {
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
    getActiveAgents() {
        return Array.from(this.agents.values()).filter(agent => agent.status === 'active');
    }
    getHibernatedAgents() {
        return Array.from(this.agents.values()).filter(agent => agent.status === 'hibernated');
    }
    cleanup() {
        this.hibernationManager.cleanup();
        this.agents.clear();
        this.logger.info('AgentPoolManager cleaned up');
    }
}
exports.AgentPoolManager = AgentPoolManager;
