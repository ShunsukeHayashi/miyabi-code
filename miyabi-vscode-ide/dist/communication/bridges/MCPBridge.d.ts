import { BaseCommunicationBridge, ConnectionConfig, Result } from '../CommunicationBridge';
export interface MCPConfig extends ConnectionConfig {
    mcpServerPath?: string;
    mcpServerArgs?: string[];
    protocolVersion?: string;
}
export declare class MCPBridge extends BaseCommunicationBridge {
    private mcpProcesses;
    initialize(): Promise<void>;
    connect(agentId: string, config?: ConnectionConfig): Promise<Result<void, Error>>;
    disconnect(agentId: string): Promise<Result<void, Error>>;
    sendMessage(agentId: string, message: any): Promise<Result<any, Error>>;
    cleanup(): Promise<void>;
}
