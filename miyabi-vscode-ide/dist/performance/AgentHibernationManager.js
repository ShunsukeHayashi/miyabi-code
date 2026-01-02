"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentHibernationManager = void 0;
const crypto_1 = require("crypto");
class AgentHibernationManager {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.hibernatedAgents = new Map();
        this.hibernationTimers = new Map();
        this.logger.info('AgentHibernationManager initialized with config');
    }
    hibernateAgent(agentId) {
        const hibernationId = (0, crypto_1.randomUUID)();
        this.hibernatedAgents.set(agentId, new Date());
        this.logger.info(`Agent ${agentId} hibernated with ID: ${hibernationId}`);
        // Set up wake-up timer
        const timer = setTimeout(() => {
            this.wakeupAgent(agentId);
        }, this.config.idleTimeout);
        this.hibernationTimers.set(agentId, timer);
    }
    wakeupAgent(agentId) {
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
    isHibernated(agentId) {
        return this.hibernatedAgents.has(agentId);
    }
    getHibernatedAgents() {
        return Array.from(this.hibernatedAgents.keys());
    }
    cleanup() {
        this.hibernationTimers.forEach(timer => clearTimeout(timer));
        this.hibernationTimers.clear();
        this.hibernatedAgents.clear();
        this.logger.info('AgentHibernationManager cleaned up');
    }
}
exports.AgentHibernationManager = AgentHibernationManager;
