export interface ConnectionConfig {
    endpoint?: string;
    timeout?: number;
    retryAttempts?: number;
    headers?: Record<string, string>;
    authentication?: {
        type: 'bearer' | 'api-key' | 'basic';
        credentials: string;
    };
}
export declare enum ConnectionStatus {
    DISCONNECTED = "disconnected",
    CONNECTING = "connecting",
    CONNECTED = "connected",
    ERROR = "error"
}
export interface Result<T, E> {
    success: boolean;
    data?: T;
    error?: E;
}
export interface CommunicationBridgeInterface {
    initialize(): Promise<void>;
    connect(agentId: string, config?: ConnectionConfig): Promise<Result<void, Error>>;
    disconnect(agentId: string): Promise<Result<void, Error>>;
    sendMessage(agentId: string, message: any): Promise<Result<any, Error>>;
    getStatus(agentId: string): ConnectionStatus;
    cleanup(): Promise<void>;
}
export declare abstract class BaseCommunicationBridge implements CommunicationBridgeInterface {
    protected connections: Map<string, ConnectionStatus>;
    protected configs: Map<string, ConnectionConfig>;
    abstract initialize(): Promise<void>;
    abstract connect(agentId: string, config?: ConnectionConfig): Promise<Result<void, Error>>;
    abstract disconnect(agentId: string): Promise<Result<void, Error>>;
    abstract sendMessage(agentId: string, message: any): Promise<Result<any, Error>>;
    getStatus(agentId: string): ConnectionStatus;
    cleanup(): Promise<void>;
    protected setStatus(agentId: string, status: ConnectionStatus): void;
    protected getConfig(agentId: string): ConnectionConfig | undefined;
    protected storeConfig(agentId: string, config: ConnectionConfig): void;
}
