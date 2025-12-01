#!/usr/bin/env node
/**
 * Project Info MCP Server for ChatGPT
 * Provides project structure and documentation information
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs').promises;
const path = require('path');

class ProjectInfoServer {
  constructor() {
    this.server = new Server(
      {
        name: 'project-info-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.projectRoot = process.env.PROJECT_ROOT || '/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private';
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_project_structure',
          description: 'Get the high-level project directory structure',
          inputSchema: {
            type: 'object',
            properties: {
              depth: {
                type: 'number',
                description: 'Directory depth to scan',
                default: 2,
              },
            },
          },
        },
        {
          name: 'get_readme',
          description: 'Get the project README content',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_agents_info',
          description: 'Get information about available Miyabi agents',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_package_info',
          description: 'Get package.json information',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'list_mcp_servers',
          description: 'List available MCP servers in the project',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_project_structure':
            return await this.getProjectStructure(args.depth || 2);
          case 'get_readme':
            return await this.getReadme();
          case 'get_agents_info':
            return await this.getAgentsInfo();
          case 'get_package_info':
            return await this.getPackageInfo();
          case 'list_mcp_servers':
            return await this.listMcpServers();
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

  async getProjectStructure(depth) {
    const structure = await this.scanDirectory(this.projectRoot, depth);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          project_root: this.projectRoot,
          structure,
        }, null, 2),
      }],
    };
  }

  async scanDirectory(dir, depth, currentDepth = 0) {
    if (currentDepth >= depth) return null;

    const entries = await fs.readdir(dir, { withFileTypes: true });
    const result = {};

    const ignoreDirs = ['node_modules', '.git', 'target', 'dist', '.next', '__pycache__'];

    for (const entry of entries) {
      if (entry.name.startsWith('.') && currentDepth === 0) continue;
      if (ignoreDirs.includes(entry.name)) continue;

      if (entry.isDirectory()) {
        const subDir = await this.scanDirectory(path.join(dir, entry.name), depth, currentDepth + 1);
        result[entry.name + '/'] = subDir || '...';
      } else {
        result[entry.name] = 'file';
      }
    }

    return result;
  }

  async getReadme() {
    try {
      const content = await fs.readFile(path.join(this.projectRoot, 'README.md'), 'utf-8');
      return {
        content: [{ type: 'text', text: content.slice(0, 5000) }],
      };
    } catch {
      return {
        content: [{ type: 'text', text: 'README.md not found' }],
      };
    }
  }

  async getAgentsInfo() {
    const agents = [
      { name: 'しきるん (Coordinator)', role: 'Task coordination and workflow management' },
      { name: 'カエデ (CodeGen)', role: 'Code generation and implementation' },
      { name: 'サクラ (Review)', role: 'Code review and quality assurance' },
      { name: 'ツバキ (PR)', role: 'Pull request management' },
      { name: 'ボタン (Deploy)', role: 'Deployment and infrastructure' },
      { name: 'みつけるん (Search)', role: 'Information retrieval and search' },
      { name: 'まとめるん (Summary)', role: 'Documentation and summarization' },
      { name: 'つなぐん (Connect)', role: 'Integration and connectivity' },
    ];

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ agents, count: agents.length }, null, 2),
      }],
    };
  }

  async getPackageInfo() {
    try {
      const content = await fs.readFile(path.join(this.projectRoot, 'package.json'), 'utf-8');
      const pkg = JSON.parse(content);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            name: pkg.name,
            version: pkg.version,
            description: pkg.description,
            scripts: Object.keys(pkg.scripts || {}),
            dependencies_count: Object.keys(pkg.dependencies || {}).length,
          }, null, 2),
        }],
      };
    } catch {
      return {
        content: [{ type: 'text', text: 'package.json not found' }],
      };
    }
  }

  async listMcpServers() {
    const mcpDir = path.join(this.projectRoot, 'mcp-servers');
    try {
      const entries = await fs.readdir(mcpDir, { withFileTypes: true });
      const servers = entries
        .filter(e => e.isDirectory())
        .map(e => e.name);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ mcp_servers: servers, count: servers.length }, null, 2),
        }],
      };
    } catch {
      return {
        content: [{ type: 'text', text: 'MCP servers directory not found' }],
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Project Info Server started');
  }
}

const server = new ProjectInfoServer();
server.run().catch(console.error);
