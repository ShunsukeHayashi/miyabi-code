"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseCommunicationBridge = exports.ConnectionStatus = void 0;
var ConnectionStatus;
(function (ConnectionStatus) {
    ConnectionStatus["DISCONNECTED"] = "disconnected";
    ConnectionStatus["CONNECTING"] = "connecting";
    ConnectionStatus["CONNECTED"] = "connected";
    ConnectionStatus["ERROR"] = "error";
})(ConnectionStatus || (exports.ConnectionStatus = ConnectionStatus = {}));
class BaseCommunicationBridge {
    constructor() {
        this.connections = new Map();
        this.configs = new Map();
    }
    getStatus(agentId) {
        return this.connections.get(agentId) || ConnectionStatus.DISCONNECTED;
    }
    async cleanup() {
        const disconnectPromises = Array.from(this.connections.keys()).map(agentId => this.disconnect(agentId));
        await Promise.all(disconnectPromises);
        this.connections.clear();
        this.configs.clear();
    }
    setStatus(agentId, status) {
        this.connections.set(agentId, status);
    }
    getConfig(agentId) {
        return this.configs.get(agentId);
    }
    storeConfig(agentId, config) {
        this.configs.set(agentId, config);
    }
}
exports.BaseCommunicationBridge = BaseCommunicationBridge;
