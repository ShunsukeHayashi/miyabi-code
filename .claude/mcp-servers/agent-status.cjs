#!/usr/bin/env node
/**
 * Agent Status MCP Server for ChatGPT
 * Monitors running agents and task status
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

class AgentStatusServer {
  constructor() {
    this.server = new Server(
      {
        name: 'agent-status-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.apiUrl = process.env.MIYABI_API_URL || 'http://localhost:3000/api/v1';
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_system_health',
          description: 'Get overall system health and status',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_running_tasks',
          description: 'Get list of currently running tasks',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_agent_availability',
          description: 'Check which agents are available',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_task_queue',
          description: 'Get queued tasks waiting for execution',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name } = request.params;

      try {
        switch (name) {
          case 'get_system_health':
            return await this.getSystemHealth();
          case 'get_running_tasks':
            return await this.getRunningTasks();
          case 'get_agent_availability':
            return await this.getAgentAvailability();
          case 'get_task_queue':
            return await this.getTaskQueue();
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    });
  }

  async getSystemHealth() {
    try {
      const response = await fetch(`${this.apiUrl}/health`);
      const data = await response.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'unreachable',
            message: 'Miyabi API is not responding',
            error: error.message,
          }, null, 2),
        }],
      };
    }
  }

  async getRunningTasks() {
    try {
      const response = await fetch(`${this.apiUrl}/tasks?status=running`);
      const data = await response.json();
      
      const runningTasks = (data.tasks || []).filter(t => t.status === 'running');
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            running_tasks: runningTasks,
            count: runningTasks.length,
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }

  async getAgentAvailability() {
    const agents = [
      { name: 'coordinator', displayName: 'しきるん', status: 'available' },
      { name: 'codegen', displayName: 'カエデ', status: 'available' },
      { name: 'review', displayName: 'サクラ', status: 'available' },
      { name: 'pr', displayName: 'ツバキ', status: 'available' },
      { name: 'deploy', displayName: 'ボタン', status: 'available' },
      { name: 'test', displayName: 'テスト', status: 'available' },
    ];

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          agents,
          available_count: agents.filter(a => a.status === 'available').length,
          total_count: agents.length,
        }, null, 2),
      }],
    };
  }

  async getTaskQueue() {
    try {
      const response = await fetch(`${this.apiUrl}/tasks?status=queued`);
      const data = await response.json();
      
      const queuedTasks = (data.tasks || []).filter(t => t.status === 'queued');
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            queued_tasks: queuedTasks,
            count: queuedTasks.length,
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Agent Status Server started');
  }
}

const server = new AgentStatusServer();
server.run().catch(console.error);
