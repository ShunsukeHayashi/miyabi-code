#!/usr/bin/env node

/**
 * Lark Integration MCP Server
 *
 * Provides tools for sending messages to Lark group chats using:
 * 1. Webhook-based bots (simple, no auth needed)
 * 2. Open Platform App (requires app_id + app_secret)
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(__dirname, '../../.miyabi/config');
const WEBHOOK_CONFIG = path.join(CONFIG_DIR, 'lark-chat-config.json');
const APP_CONFIG = path.join(CONFIG_DIR, 'lark-hackathon-app-config.json');

class LarkIntegrationServer {
  constructor() {
    this.server = new Server(
      {
        name: 'lark-integration',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();

    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'lark_send_webhook',
          description: 'Send message to Lark group via webhook (Miyabi Dev Coordination)',
          inputSchema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Message text to send',
              },
            },
            required: ['message'],
          },
        },
        {
          name: 'lark_send_app',
          description: 'Send message to Lark group via Open Platform App (Hackathon 2025)',
          inputSchema: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Message text to send',
              },
              chat_id: {
                type: 'string',
                description: 'Chat ID (optional, will use default if not provided)',
              },
            },
            required: ['message'],
          },
        },
        {
          name: 'lark_get_chat_list',
          description: 'Get list of accessible Lark group chats',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'lark_send_webhook':
          return await this.sendWebhookMessage(request.params.arguments);
        case 'lark_send_app':
          return await this.sendAppMessage(request.params.arguments);
        case 'lark_get_chat_list':
          return await this.getChatList();
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  async sendWebhookMessage(args) {
    const { message } = args;

    // Load webhook config
    const config = JSON.parse(fs.readFileSync(WEBHOOK_CONFIG, 'utf8'));

    // Generate signature
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const stringToSign = `${timestamp}\n${config.signing_secret}`;
    const hmac = crypto.createHmac('sha256', '');
    hmac.update(stringToSign);
    const signature = hmac.digest('base64');

    // Detect machine
    const machineIcon = process.platform === 'darwin' ? '🖥️' : '☁️';
    const machineName = process.platform === 'darwin' ? 'miyabi' : 'MUGEN';
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const formattedMessage = `${machineIcon} **[${machineName}]** (${now})\n\n${message}`;

    const payload = {
      timestamp,
      sign: signature,
      msg_type: 'text',
      content: {
        text: formattedMessage,
      },
    };

    return new Promise((resolve, reject) => {
      const url = new URL(config.webhook_url);
      const options = {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          const response = JSON.parse(data);
          if (response.code === 0) {
            resolve({
              content: [
                {
                  type: 'text',
                  text: `✅ Message sent successfully to "${config.chat_name}"\n\nMessage: ${formattedMessage}`,
                },
              ],
            });
          } else {
            reject(new Error(`Lark API error: ${JSON.stringify(response)}`));
          }
        });
      });

      req.on('error', reject);
      req.write(JSON.stringify(payload));
      req.end();
    });
  }

  async sendAppMessage(args) {
    const { message, chat_id } = args;

    // Load app config
    const config = JSON.parse(fs.readFileSync(APP_CONFIG, 'utf8'));

    // Step 1: Get tenant access token
    const token = await this.getTenantAccessToken(config);

    // Step 2: Get chat ID if not provided
    const targetChatId = chat_id || await this.getDefaultChatId(config, token);

    // Step 3: Send message
    const machineIcon = process.platform === 'darwin' ? '🖥️' : '☁️';
    const machineName = process.platform === 'darwin' ? 'miyabi' : 'MUGEN';
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const formattedMessage = `${machineIcon} **[${machineName}]** (${now})\n\n${message}`;

    const payload = {
      receive_id: targetChatId,
      msg_type: 'text',
      content: JSON.stringify({
        text: formattedMessage,
      }),
    };

    return new Promise((resolve, reject) => {
      const url = new URL(config.endpoints.send_message);
      url.searchParams.append('receive_id_type', 'chat_id');

      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          const response = JSON.parse(data);
          if (response.code === 0) {
            resolve({
              content: [
                {
                  type: 'text',
                  text: `✅ Message sent successfully to "${config.chat_name}"\n\nChat ID: ${targetChatId}\nMessage: ${formattedMessage}`,
                },
              ],
            });
          } else {
            reject(new Error(`Lark API error: ${JSON.stringify(response)}`));
          }
        });
      });

      req.on('error', reject);
      req.write(JSON.stringify(payload));
      req.end();
    });
  }

  async getTenantAccessToken(config) {
    return new Promise((resolve, reject) => {
      const payload = {
        app_id: config.app_id,
        app_secret: config.app_secret,
      };

      const url = new URL(config.endpoints.auth);
      const options = {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          const response = JSON.parse(data);
          if (response.code === 0) {
            resolve(response.tenant_access_token);
          } else {
            reject(new Error(`Failed to get access token: ${JSON.stringify(response)}`));
          }
        });
      });

      req.on('error', reject);
      req.write(JSON.stringify(payload));
      req.end();
    });
  }

  async getDefaultChatId(config, token) {
    // For now, return a placeholder
    // In a full implementation, this would list chats and find the hackathon group
    return 'oc_PLACEHOLDER_CHAT_ID';
  }

  async getChatList() {
    const config = JSON.parse(fs.readFileSync(APP_CONFIG, 'utf8'));
    const token = await this.getTenantAccessToken(config);

    return new Promise((resolve, reject) => {
      const url = new URL(config.endpoints.get_chat_id);
      const options = {
        hostname: url.hostname,
        path: url.pathname,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          const response = JSON.parse(data);
          if (response.code === 0) {
            resolve({
              content: [
                {
                  type: 'text',
                  text: `Available chats:\n${JSON.stringify(response.data, null, 2)}`,
                },
              ],
            });
          } else {
            reject(new Error(`Failed to get chat list: ${JSON.stringify(response)}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Lark Integration MCP server running on stdio');
  }
}

const server = new LarkIntegrationServer();
server.run().catch(console.error);
