import {
  BaseCommunicationBridge,
  ConnectionConfig,
  ConnectionStatus,
  Result
} from '../CommunicationBridge';

export interface HTTPConfig extends ConnectionConfig {
  baseUrl?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  maxRetries?: number;
}

export class HTTPBridge extends BaseCommunicationBridge {
  private httpClients: Map<string, any> = new Map();

  // ✅ Add missing initialize() method
  async initialize(): Promise<void> {
    console.log('HTTPBridge: Initializing HTTP communication bridge');
    // Initialize any global HTTP configurations or client pools
  }

  async connect(agentId: string, config?: ConnectionConfig): Promise<Result<void, Error>> {
    try {
      this.setStatus(agentId, ConnectionStatus.CONNECTING);

      if (config) {
        this.storeConfig(agentId, config);
      }

      const httpConfig = config as HTTPConfig;
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
      this.setStatus(agentId, ConnectionStatus.CONNECTED);

      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      this.setStatus(agentId, ConnectionStatus.ERROR);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('HTTP client setup failed')
      };
    }
  }

  async disconnect(agentId: string): Promise<Result<void, Error>> {
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
      this.setStatus(agentId, ConnectionStatus.DISCONNECTED);

      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('HTTP client cleanup failed')
      };
    }
  }

  async sendMessage(agentId: string, message: any): Promise<Result<any, Error>> {
    try {
      const client = this.httpClients.get(agentId);
      if (!client) {
        return {
          success: false,
          error: new Error(`No HTTP client for agent ${agentId}`)
        };
      }

      if (this.getStatus(agentId) !== ConnectionStatus.CONNECTED) {
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('HTTP request failed')
      };
    }
  }

  async cleanup(): Promise<void> {
    console.log('HTTPBridge: Cleaning up all HTTP clients');
    await super.cleanup();
    this.httpClients.clear();
  }
}