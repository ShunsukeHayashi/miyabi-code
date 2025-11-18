/**
 * MCP Adapter - Converts STDIO MCP servers to HTTP/SSE endpoints
 *
 * This adapter spawns STDIO MCP servers as child processes and translates
 * HTTP requests to JSON-RPC messages for the STDIO transport.
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/mcp-adapter.log' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

interface MCPRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export class MCPAdapter extends EventEmitter {
  private process: ChildProcess | null = null;
  private config: MCPServerConfig;
  private messageBuffer: string = '';
  private pendingRequests: Map<number | string, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = new Map();
  private requestId = 0;
  private isReady = false;

  constructor(config: MCPServerConfig) {
    super();
    this.config = config;
  }

  /**
   * Start the STDIO MCP server process
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      logger.info('Starting MCP server', { name: this.config.name });

      this.process = spawn(this.config.command, this.config.args, {
        env: {
          ...process.env,
          ...this.config.env
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Handle stdout (JSON-RPC messages)
      this.process.stdout?.on('data', (data) => {
        this.handleStdout(data);
      });

      // Handle stderr (logging)
      this.process.stderr?.on('data', (data) => {
        const message = data.toString().trim();
        if (message) {
          logger.info('MCP server stderr', {
            server: this.config.name,
            message
          });

          // Check for ready message
          if (message.includes('running on stdio')) {
            if (!this.isReady) {
              this.isReady = true;
              // Send initialize message
              this.initialize().then(() => resolve()).catch(reject);
            }
          }
        }
      });

      // Handle process errors
      this.process.on('error', (error) => {
        logger.error('MCP server process error', {
          server: this.config.name,
          error: error.message
        });
        reject(error);
      });

      // Handle process exit
      this.process.on('exit', (code, signal) => {
        logger.warn('MCP server exited', {
          server: this.config.name,
          code,
          signal
        });
        this.isReady = false;
        this.emit('exit', { code, signal });
      });

      // Set a timeout for server startup
      setTimeout(() => {
        if (!this.isReady) {
          logger.warn('MCP server startup timeout, attempting to initialize anyway', {
            server: this.config.name
          });
          this.isReady = true;
          // Try to initialize even if we didn't see the ready message
          this.initialize().then(() => resolve()).catch((error) => {
            logger.error('Failed to initialize MCP server', {
              server: this.config.name,
              error: error.message
            });
            // Resolve anyway to allow the gateway to start
            resolve();
          });
        }
      }, 2000);
    });
  }

  /**
   * Send MCP initialize request
   */
  private async initialize(): Promise<void> {
    try {
      const result = await this.sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {
          roots: {
            listChanged: false
          }
        },
        clientInfo: {
          name: 'miyabi-sse-gateway',
          version: '1.0.0'
        }
      });

      logger.info('MCP server initialized', {
        server: this.config.name,
        serverInfo: result.serverInfo
      });

      // Send initialized notification
      if (this.process && this.process.stdin) {
        const notification = JSON.stringify({
          jsonrpc: '2.0',
          method: 'notifications/initialized'
        }) + '\n';
        this.process.stdin.write(notification);
      }
    } catch (error) {
      logger.error('Failed to initialize MCP server', {
        server: this.config.name,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Handle stdout data from MCP server
   */
  private handleStdout(data: Buffer): void {
    this.messageBuffer += data.toString();

    // Try to parse complete JSON-RPC messages
    const lines = this.messageBuffer.split('\n');
    this.messageBuffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        try {
          const response: MCPResponse = JSON.parse(line);
          this.handleResponse(response);
        } catch (error) {
          logger.error('Failed to parse MCP response', {
            server: this.config.name,
            line,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }
  }

  /**
   * Handle JSON-RPC response from MCP server
   */
  private handleResponse(response: MCPResponse): void {
    const pending = this.pendingRequests.get(response.id);

    if (pending) {
      this.pendingRequests.delete(response.id);

      if (response.error) {
        pending.reject(new Error(response.error.message));
      } else {
        pending.resolve(response.result);
      }
    } else {
      logger.warn('Received response for unknown request ID', {
        server: this.config.name,
        id: response.id
      });
    }
  }

  /**
   * Send JSON-RPC request to MCP server
   */
  async sendRequest(method: string, params?: any): Promise<any> {
    if (!this.process || !this.isReady) {
      throw new Error(`MCP server ${this.config.name} is not ready`);
    }

    const id = ++this.requestId;
    const request: MCPRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      // Send request to stdin
      const message = JSON.stringify(request) + '\n';
      this.process!.stdin?.write(message);

      logger.debug('Sent MCP request', {
        server: this.config.name,
        method,
        id
      });

      // Set timeout for request
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout for ${method}`));
        }
      }, 30000); // 30 second timeout
    });
  }

  /**
   * List available tools from MCP server
   */
  async listTools(): Promise<any> {
    return this.sendRequest('tools/list');
  }

  /**
   * Call a tool on the MCP server
   */
  async callTool(name: string, args?: any): Promise<any> {
    return this.sendRequest('tools/call', {
      name,
      arguments: args
    });
  }

  /**
   * Stop the MCP server process
   */
  stop(): void {
    if (this.process) {
      logger.info('Stopping MCP server', { name: this.config.name });
      this.process.kill();
      this.process = null;
      this.isReady = false;
    }
  }

  /**
   * Check if server is ready
   */
  ready(): boolean {
    return this.isReady;
  }
}
