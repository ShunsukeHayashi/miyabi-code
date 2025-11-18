#!/usr/bin/env node

/**
 * Miyabi MCP Server for Google Pixel (Termux)
 * Pure Node.js implementation - zero dependencies
 * Optimized for mobile: low memory, battery efficient
 */

import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const VERSION = '1.0.0';
const SERVER_NAME = 'miyabi-pixel-mcp';

// Configuration
const CONFIG = {
  termuxStoragePath: join(homedir(), 'storage'),
  miyabiProjectPath: null, // Will be detected or set by user
  logLevel: process.env.LOG_LEVEL || 'info'
};

// Detect if running in Termux
const isTermux = () => {
  return existsSync('/data/data/com.termux');
};

// MCP Protocol Handler
class MCPServer {
  constructor() {
    this.tools = this.registerTools();
    this.isRunning = false;
  }

  registerTools() {
    return [
      {
        name: 'pixel_device_info',
        description: 'Get Google Pixel device information',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'termux_exec',
        description: 'Execute command in Termux environment',
        inputSchema: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'Command to execute'
            }
          },
          required: ['command']
        }
      },
      {
        name: 'termux_storage_list',
        description: 'List Termux storage locations',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'pixel_battery_status',
        description: 'Get battery status via Termux-API',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'pixel_location',
        description: 'Get device location via Termux-API',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'pixel_notification',
        description: 'Send notification via Termux-API',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Notification title'
            },
            content: {
              type: 'string',
              description: 'Notification content'
            }
          },
          required: ['title', 'content']
        }
      }
    ];
  }

  async handleRequest(request) {
    const { method, params } = request;

    switch (method) {
      case 'initialize':
        return this.initialize(params);
      case 'tools/list':
        return this.listTools();
      case 'tools/call':
        return this.callTool(params);
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }

  initialize(params) {
    this.isRunning = true;
    return {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: SERVER_NAME,
        version: VERSION
      }
    };
  }

  listTools() {
    return {
      tools: this.tools
    };
  }

  async callTool(params) {
    const { name, arguments: args } = params;

    switch (name) {
      case 'pixel_device_info':
        return await this.getDeviceInfo();
      case 'termux_exec':
        return await this.execCommand(args.command);
      case 'termux_storage_list':
        return await this.listStorage();
      case 'pixel_battery_status':
        return await this.getBatteryStatus();
      case 'pixel_location':
        return await this.getLocation();
      case 'pixel_notification':
        return await this.sendNotification(args.title, args.content);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  // Tool Implementations

  async getDeviceInfo() {
    if (!isTermux()) {
      return {
        content: [
          {
            type: 'text',
            text: 'Not running in Termux environment'
          }
        ]
      };
    }

    try {
      const getprop = (prop) => {
        return new Promise((resolve) => {
          const proc = spawn('getprop', [prop]);
          let output = '';
          proc.stdout.on('data', (data) => output += data);
          proc.on('close', () => resolve(output.trim()));
        });
      };

      const model = await getprop('ro.product.model');
      const manufacturer = await getprop('ro.product.manufacturer');
      const androidVersion = await getprop('ro.build.version.release');
      const sdk = await getprop('ro.build.version.sdk');

      const deviceInfo = {
        model,
        manufacturer,
        androidVersion,
        sdkVersion: sdk,
        isTermux: true,
        serverVersion: VERSION
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(deviceInfo, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ]
      };
    }
  }

  async execCommand(command) {
    return new Promise((resolve) => {
      const proc = spawn('sh', ['-c', command]);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => stdout += data);
      proc.stderr.on('data', (data) => stderr += data);

      proc.on('close', (code) => {
        resolve({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                exitCode: code,
                stdout: stdout.trim(),
                stderr: stderr.trim()
              }, null, 2)
            }
          ]
        });
      });
    });
  }

  async listStorage() {
    const storagePath = CONFIG.termuxStoragePath;

    if (!existsSync(storagePath)) {
      return {
        content: [
          {
            type: 'text',
            text: 'Termux storage not setup. Run: termux-setup-storage'
          }
        ]
      };
    }

    try {
      const { readdirSync } = await import('fs');
      const entries = readdirSync(storagePath);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              storagePath,
              entries
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ]
      };
    }
  }

  async getBatteryStatus() {
    return new Promise((resolve) => {
      const proc = spawn('termux-battery-status');
      let output = '';

      proc.stdout.on('data', (data) => output += data);

      proc.on('close', (code) => {
        if (code === 0) {
          try {
            const battery = JSON.parse(output);
            resolve({
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(battery, null, 2)
                }
              ]
            });
          } catch (e) {
            resolve({
              isError: true,
              content: [
                {
                  type: 'text',
                  text: 'Termux:API not installed. Install from F-Droid.'
                }
              ]
            });
          }
        } else {
          resolve({
            isError: true,
            content: [
              {
                type: 'text',
                text: 'termux-battery-status command failed'
              }
            ]
          });
        }
      });
    });
  }

  async getLocation() {
    return new Promise((resolve) => {
      const proc = spawn('termux-location');
      let output = '';

      proc.stdout.on('data', (data) => output += data);

      proc.on('close', (code) => {
        if (code === 0) {
          try {
            const location = JSON.parse(output);
            resolve({
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(location, null, 2)
                }
              ]
            });
          } catch (e) {
            resolve({
              isError: true,
              content: [
                {
                  type: 'text',
                  text: 'Termux:API not installed or location permission denied'
                }
              ]
            });
          }
        } else {
          resolve({
            isError: true,
            content: [
              {
                type: 'text',
                text: 'termux-location command failed'
              }
            ]
          });
        }
      });
    });
  }

  async sendNotification(title, content) {
    return new Promise((resolve) => {
      const proc = spawn('termux-notification', [
        '--title', title,
        '--content', content
      ]);

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({
            content: [
              {
                type: 'text',
                text: `Notification sent: ${title}`
              }
            ]
          });
        } else {
          resolve({
            isError: true,
            content: [
              {
                type: 'text',
                text: 'termux-notification command failed. Termux:API required.'
              }
            ]
          });
        }
      });
    });
  }
}

// JSON-RPC stdin/stdout communication
const server = new MCPServer();

process.stdin.setEncoding('utf8');
let buffer = '';

process.stdin.on('data', async (chunk) => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop();

  for (const line of lines) {
    if (!line.trim()) continue;

    try {
      const request = JSON.parse(line);
      const response = await server.handleRequest(request);

      const result = {
        jsonrpc: '2.0',
        id: request.id,
        result: response
      };

      process.stdout.write(JSON.stringify(result) + '\n');
    } catch (error) {
      const errorResponse = {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: error.message
        }
      };

      process.stdout.write(JSON.stringify(errorResponse) + '\n');
    }
  }
});

// Startup
if (process.argv.includes('--test')) {
  console.log(`${SERVER_NAME} v${VERSION}`);
  console.log('Running in Termux:', isTermux());
  process.exit(0);
} else {
  console.error(`${SERVER_NAME} v${VERSION} running on stdio`);
  console.error('Termux environment:', isTermux());
}
