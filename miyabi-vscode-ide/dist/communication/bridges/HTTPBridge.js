"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTPBridge = void 0;
const CommunicationBridge_1 = require("../CommunicationBridge");
class HTTPBridge extends CommunicationBridge_1.BaseCommunicationBridge {
    constructor() {
        super(...arguments);
        this.httpClients = new Map();
    }
    // ✅ Add missing initialize() method
    async initialize() {
        console.log('HTTPBridge: Initializing HTTP communication bridge');
        // Initialize any global HTTP configurations or client pools
    }
    async connect(agentId, config) {
        try {
            this.setStatus(agentId, CommunicationBridge_1.ConnectionStatus.CONNECTING);
            if (config) {
                this.storeConfig(agentId, config);
            }
            const httpConfig = config;
            const baseUrl = httpConfig?.baseUrl || 'http://localhost:3000';
            console.log(`HTTPBridge: Setting up HTTP client for agent ${agentId} to ${baseUrl}`);
            // Mock HTTP client setup
            const mockClient = {
                baseUrl,
                headers: httpConfig?.headers || {},
                timeout: httpConfig?.timeout || 5000,
                connected: true
            };
            this.httpClients.set(agentId, mockClient);
            this.setStatus(agentId, CommunicationBridge_1.ConnectionStatus.CONNECTED);
            return {
                success: true,
                data: undefined
            };
        }
        catch (error) {
            this.setStatus(agentId, CommunicationBridge_1.ConnectionStatus.ERROR);
            return {
                success: false,
                error: error instanceof Error ? error : new Error('HTTP client setup failed')
            };
        }
    }
    async disconnect(agentId) {
        try {
            const client = this.httpClients.get(agentId);
            if (!client) {
                return {
                    success: false,
                    error: new Error(`No HTTP client found for agent ${agentId}`)
                };
            }
            console.log(`HTTPBridge: Cleaning up HTTP client for agent ${agentId}`);
            this.httpClients.delete(agentId);
            this.setStatus(agentId, CommunicationBridge_1.ConnectionStatus.DISCONNECTED);
            return {
                success: true,
                data: undefined
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('HTTP client cleanup failed')
            };
        }
    }
    async sendMessage(agentId, message) {
        try {
            const client = this.httpClients.get(agentId);
            if (!client) {
                return {
                    success: false,
                    error: new Error(`No HTTP client for agent ${agentId}`)
                };
            }
            if (this.getStatus(agentId) !== CommunicationBridge_1.ConnectionStatus.CONNECTED) {
                return {
                    success: false,
                    error: new Error(`Agent ${agentId} HTTP client is not ready`)
                };
            }
            console.log(`HTTPBridge: Sending HTTP request for agent ${agentId}:`, message);
            // Mock HTTP request
            const response = {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
                data: {
                    id: Date.now(),
                    message: 'HTTP request processed',
                    originalRequest: message
                },
                timestamp: new Date().toISOString()
            };
            return {
                success: true,
                data: response
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error : new Error('HTTP request failed')
            };
        }
    }
    async cleanup() {
        console.log('HTTPBridge: Cleaning up all HTTP clients');
        await super.cleanup();
        this.httpClients.clear();
    }
}
exports.HTTPBridge = HTTPBridge;
