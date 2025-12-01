#!/usr/bin/env node
/**
 * Miyabi Task API Bridge for ChatGPT
 * Bridges ChatGPT requests to Miyabi Task API
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

class TaskApiBridge {
  constructor() {
    this.server = new Server(
      {
        name: 'miyabi-task-api-bridge',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.apiUrl = process.env.MIYABI_API_URL || 'http://localhost:3000/api/v1';
    this.apiKey = process.env.MIYABI_API_KEY || 'miyabi-demo-key-12345';

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'create_task',
          description: 'Create a new automation task in Miyabi. Supports code generation, testing, PR creation.',
          inputSchema: {
            type: 'object',
            properties: {
              instruction: {
                type: 'string',
                description: 'Natural language instruction for the task (e.g., "Implement user authentication")',
              },
              repository: {
                type: 'string',
                description: 'Target repository in owner/repo format',
                default: 'customer-cloud/miyabi-private',
              },
              priority: {
                type: 'string',
                enum: ['low', 'normal', 'high', 'critical'],
                description: 'Task priority',
                default: 'normal',
              },
              auto_merge: {
                type: 'boolean',
                description: 'Automatically merge PR after approval (default: false)',
                default: false,
              },
            },
            required: ['instruction'],
          },
        },
        {
          name: 'get_task_status',
          description: 'Get the status of a running or completed task',
          inputSchema: {
            type: 'object',
            properties: {
              task_id: {
                type: 'string',
                description: 'Task ID (UUID)',
              },
            },
            required: ['task_id'],
          },
        },
        {
          name: 'list_tasks',
          description: 'List recent tasks',
          inputSchema: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Maximum number of tasks to return',
                default: 10,
              },
            },
          },
        },
        {
          name: 'cancel_task',
          description: 'Cancel a running task',
          inputSchema: {
            type: 'object',
            properties: {
              task_id: {
                type: 'string',
                description: 'Task ID to cancel',
              },
            },
            required: ['task_id'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'create_task':
            return await this.createTask(args);
          case 'get_task_status':
            return await this.getTaskStatus(args.task_id);
          case 'list_tasks':
            return await this.listTasks(args.limit || 10);
          case 'cancel_task':
            return await this.cancelTask(args.task_id);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async createTask(args) {
    const response = await fetch(`${this.apiUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        instruction: args.instruction,
        repository: args.repository || 'customer-cloud/miyabi-private',
        options: {
          priority: args.priority || 'normal',
          auto_merge: args.auto_merge || false,
          notify: true,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to create task');
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            task_id: data.task_id,
            status: data.status,
            message: `Task created successfully. ID: ${data.task_id}`,
            estimated_time: data.estimated_time,
          }, null, 2),
        },
      ],
    };
  }

  async getTaskStatus(taskId) {
    const response = await fetch(`${this.apiUrl}/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to get task status');
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  async listTasks(limit) {
    const response = await fetch(`${this.apiUrl}/tasks?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to list tasks');
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  async cancelTask(taskId) {
    const response = await fetch(`${this.apiUrl}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to cancel task');
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Task ${taskId} cancelled successfully`,
            ...data,
          }, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Miyabi Task API Bridge started');
  }
}

const bridge = new TaskApiBridge();
bridge.run().catch(console.error);
