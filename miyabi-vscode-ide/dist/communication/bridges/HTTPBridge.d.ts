import { BaseCommunicationBridge, ConnectionConfig, Result } from '../CommunicationBridge';
export interface HTTPConfig extends ConnectionConfig {
    baseUrl?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    maxRetries?: number;
}
export declare class HTTPBridge extends BaseCommunicationBridge {
    private httpClients;
    initialize(): Promise<void>;
    connect(agentId: string, config?: ConnectionConfig): Promise<Result<void, Error>>;
    disconnect(agentId: string): Promise<Result<void, Error>>;
    sendMessage(agentId: string, message: any): Promise<Result<any, Error>>;
    cleanup(): Promise<void>;
}
