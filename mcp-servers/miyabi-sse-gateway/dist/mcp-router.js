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
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [
        new winston.transports.File({ filename: 'logs/mcp-router.log' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});
export class MCPRouter {
    servers = {};
    initialized = false;
    constructor() { }
    /**
     * Initialize all MCP servers
     */
    async initialize() {
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
        // Initialize ChatGPT App server (GitHub Device Flow auth)
        const chatgptAppAdapter = new MCPAdapter({
            name: 'miyabi-chatgpt-app',
            command: 'node',
            args: [path.join(mcpServersRoot, 'miyabi-chatgpt-app/dist/index.js')],
            env: {
                GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
                GITHUB_TOKEN: process.env.GITHUB_TOKEN || ''
            }
        });
        try {
            // Start all servers in parallel
            await Promise.all([
                tmuxAdapter.start(),
                rulesAdapter.start(),
                obsidianAdapter.start(),
                chatgptAppAdapter.start()
            ]);
            this.servers['tmux'] = tmuxAdapter;
            this.servers['rules'] = rulesAdapter;
            this.servers['obsidian'] = obsidianAdapter;
            this.servers['chatgpt'] = chatgptAppAdapter;
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
        }
        catch (error) {
            logger.error('Failed to initialize MCP servers', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    /**
     * Get server by name
     */
    getServer(name) {
        return this.servers[name];
    }
    /**
     * Get status of all servers
     */
    getStatus() {
        const serverCount = Object.keys(this.servers).length;
        return {
            initialized: this.initialized,
            servers: Object.keys(this.servers),
            total: serverCount,
            ready: this.initialized ? serverCount : 0
        };
    }
    /**
     * List all available tools from all servers
     */
    async listAllTools() {
        const toolsByServer = {};
        for (const [name, adapter] of Object.entries(this.servers)) {
            try {
                const tools = await adapter.listTools();
                toolsByServer[name] = tools;
            }
            catch (error) {
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
    async callTool(serverName, toolName, args) {
        const adapter = this.servers[serverName];
        if (!adapter) {
            throw new Error(`Server '${serverName}' not found. Available: ${Object.keys(this.servers).join(', ')}`);
        }
        return adapter.callTool(toolName, args);
    }
    /**
     * Shutdown all servers
     */
    async shutdown() {
        logger.info('Shutting down all MCP servers');
        const shutdownPromises = Object.entries(this.servers).map(async ([name, adapter]) => {
            try {
                await adapter.stop();
                logger.info(`Server ${name} stopped`);
            }
            catch (error) {
                logger.error(`Failed to stop server ${name}`, {
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });
        await Promise.all(shutdownPromises);
        this.servers = {};
        this.initialized = false;
    }
}
// Singleton instance
let routerInstance = null;
export function getMCPRouter() {
    if (!routerInstance) {
        routerInstance = new MCPRouter();
    }
    return routerInstance;
}
