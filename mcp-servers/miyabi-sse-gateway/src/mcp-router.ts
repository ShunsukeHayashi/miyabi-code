/**
 * MCP Router - Routes requests to appropriate MCP servers
 *
 * Manages multiple MCP adapters and provides unified routing
 */

import { MCPAdapter } from './mcp-adapter.js';
import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/mcp-router.log' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

interface ServerRegistry {
  [key: string]: MCPAdapter;
}

export class MCPRouter {
  private servers: ServerRegistry = {};
  private initialized = false;

  constructor() {}

  /**
   * Initialize all MCP servers
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('MCP Router already initialized');
      return;
    }

    logger.info('Initializing MCP Router with all servers');

    const mcpServersRoot = path.resolve(__dirname, '../..');

    // Initialize tmux server
    const tmuxAdapter = new MCPAdapter({
      name: 'miyabi-tmux',
      command: 'node',
      args: [path.join(mcpServersRoot, 'miyabi-tmux-server/dist/index.js')]
    });

    // Initialize rules server
    const rulesAdapter = new MCPAdapter({
      name: 'miyabi-rules',
      command: 'node',
      args: [path.join(mcpServersRoot, 'miyabi-rules-server/dist/index.js')],
      env: {
        MIYABI_RULES_API_URL: process.env.MIYABI_RULES_API_URL || 'https://miyabi-rules-api.example.com',
        MIYABI_API_KEY: process.env.MIYABI_API_KEY || ''
      }
    });

    // Initialize obsidian server
    const obsidianAdapter = new MCPAdapter({
      name: 'miyabi-obsidian',
      command: 'node',
      args: [path.join(mcpServersRoot, 'miyabi-obsidian-server/dist/index.js')]
    });

    try {
      // Start all servers in parallel
      await Promise.all([
        tmuxAdapter.start(),
        rulesAdapter.start(),
        obsidianAdapter.start()
      ]);

      this.servers['tmux'] = tmuxAdapter;
      this.servers['rules'] = rulesAdapter;
      this.servers['obsidian'] = obsidianAdapter;

      logger.info('All MCP servers started successfully', {
        servers: Object.keys(this.servers)
      });

      this.initialized = true;

      // Handle server exits
      for (const [name, adapter] of Object.entries(this.servers)) {
        adapter.on('exit', ({ code, signal }) => {
          logger.error('MCP server exited unexpectedly', {
            server: name,
            code,
            signal
          });
          // TODO: Implement auto-restart logic
        });
      }
    } catch (error) {
      logger.error('Failed to initialize MCP servers', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get server by name
   */
  getServer(name: string): MCPAdapter | undefined {
    return this.servers[name];
  }

  /**
   * List all available tools from all servers
   */
  async listAllTools(): Promise<any> {
    const toolsByServer: Record<string, any> = {};

    for (const [name, adapter] of Object.entries(this.servers)) {
      try {
        const tools = await adapter.listTools();
        toolsByServer[name] = tools;
      } catch (error) {
        logger.error('Failed to list tools', {
          server: name,
          error: error instanceof Error ? error.message : String(error)
        });
        toolsByServer[name] = { error: 'Failed to fetch tools' };
      }
    }

    return {
      servers: Object.keys(this.servers),
      tools: toolsByServer
    };
  }

  /**
   * Call tool on specific server
   */
  async callTool(serverName: string, toolName: string, args?: any): Promise<any> {
    const adapter = this.servers[serverName];

    if (!adapter) {
      throw new Error(`Server ${serverName} not found. Available: ${Object.keys(this.servers).join(', ')}`);
    }

    if (!adapter.ready()) {
      throw new Error(`Server ${serverName} is not ready`);
    }

    logger.info('Calling tool', {
      server: serverName,
      tool: toolName,
      args
    });

    try {
      const result = await adapter.callTool(toolName, args);
      logger.info('Tool call successful', {
        server: serverName,
        tool: toolName
      });
      return result;
    } catch (error) {
      logger.error('Tool call failed', {
        server: serverName,
        tool: toolName,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get status of all servers
   */
  getStatus(): any {
    const status: Record<string, any> = {};

    for (const [name, adapter] of Object.entries(this.servers)) {
      status[name] = {
        ready: adapter.ready(),
        name: adapter['config'].name
      };
    }

    return {
      initialized: this.initialized,
      servers: status,
      total: Object.keys(this.servers).length,
      ready: Object.values(this.servers).filter(a => a.ready()).length
    };
  }

  /**
   * Shutdown all servers
   */
  shutdown(): void {
    logger.info('Shutting down all MCP servers');

    for (const [name, adapter] of Object.entries(this.servers)) {
      try {
        adapter.stop();
        logger.info('Stopped MCP server', { server: name });
      } catch (error) {
        logger.error('Error stopping server', {
          server: name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    this.servers = {};
    this.initialized = false;
  }
}

// Singleton instance
let routerInstance: MCPRouter | null = null;

export function getMCPRouter(): MCPRouter {
  if (!routerInstance) {
    routerInstance = new MCPRouter();
  }
  return routerInstance;
}
