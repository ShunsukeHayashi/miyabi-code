// ✅ Add missing ConnectionConfig export
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

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
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

export abstract class BaseCommunicationBridge implements CommunicationBridgeInterface {
  protected connections: Map<string, ConnectionStatus> = new Map();
  protected configs: Map<string, ConnectionConfig> = new Map();

  abstract initialize(): Promise<void>;
  abstract connect(agentId: string, config?: ConnectionConfig): Promise<Result<void, Error>>;
  abstract disconnect(agentId: string): Promise<Result<void, Error>>;
  abstract sendMessage(agentId: string, message: any): Promise<Result<any, Error>>;

  getStatus(agentId: string): ConnectionStatus {
    return this.connections.get(agentId) || ConnectionStatus.DISCONNECTED;
  }

  async cleanup(): Promise<void> {
    const disconnectPromises = Array.from(this.connections.keys()).map(agentId =>
      this.disconnect(agentId)
    );

    await Promise.all(disconnectPromises);
    this.connections.clear();
    this.configs.clear();
  }

  protected setStatus(agentId: string, status: ConnectionStatus): void {
    this.connections.set(agentId, status);
  }

  protected getConfig(agentId: string): ConnectionConfig | undefined {
    return this.configs.get(agentId);
  }

  protected storeConfig(agentId: string, config: ConnectionConfig): void {
    this.configs.set(agentId, config);
  }
}