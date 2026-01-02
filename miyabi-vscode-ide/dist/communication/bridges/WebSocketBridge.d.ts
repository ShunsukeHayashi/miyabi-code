import { BaseCommunicationBridge, ConnectionConfig, Result } from '../CommunicationBridge';
export interface WebSocketConfig extends ConnectionConfig {
    wsEndpoint?: string;
    protocols?: string[];
    pingInterval?: number;
}
export declare class WebSocketBridge extends BaseCommunicationBridge {
    private webSockets;
    initialize(): Promise<void>;
    connect(agentId: string, config?: ConnectionConfig): Promise<Result<void, Error>>;
    disconnect(agentId: string): Promise<Result<void, Error>>;
    sendMessage(agentId: string, message: any): Promise<Result<any, Error>>;
    cleanup(): Promise<void>;
}
