#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { glob } from 'glob';
import { z } from 'zod';

const execAsync = promisify(exec);

// Paths
const CLAUDE_CONFIG_DIR = join(homedir(), 'Library/Application Support/Claude');
const CLAUDE_CONFIG_FILE = join(CLAUDE_CONFIG_DIR, 'claude_desktop_config.json');
const CLAUDE_LOGS_DIR = join(homedir(), 'Library/Logs/Claude');

// Zod schemas
const EmptySchema = z.object({});
const LogTailSchema = z.object({
  lines: z.number().optional(),
});
const LogSearchSchema = z.object({
  query: z.string(),
  log_type: z.string().optional(),
});

/**
 * Get Claude Desktop configuration
 */
async function getClaudeConfig(): Promise<any> {
  try {
    const configContent = await readFile(CLAUDE_CONFIG_FILE, 'utf-8');
    const config = JSON.parse(configContent);

    const mcpServers = config.mcpServers || {};
    const serverNames = Object.keys(mcpServers);

    return {
      config_path: CLAUDE_CONFIG_FILE,
      total_mcp_servers: serverNames.length,
      mcp_servers: serverNames.map((name) => ({
        name,
        command: mcpServers[name].command,
        has_env: !!mcpServers[name].env,
        env_vars: mcpServers[name].env ? Object.keys(mcpServers[name].env) : [],
      })),
      preferences: config.preferences || {},
    };
  } catch (error) {
    throw new Error(`Failed to read Claude config: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get MCP server connection status (check if process is running)
 */
async function getMcpServerStatus(): Promise<any> {
  try {
    const configContent = await readFile(CLAUDE_CONFIG_FILE, 'utf-8');
    const config = JSON.parse(configContent);
    const mcpServers = config.mcpServers || {};

    const statuses: any[] = [];

    for (const [name, serverConfig] of Object.entries(mcpServers)) {
      const server = serverConfig as any;
      const scriptPath = server.args?.[0] || '';

      // Check if the server process exists
      let isRunning = false;
      let processCount = 0;

      if (scriptPath) {
        try {
          const { stdout } = await execAsync(`ps aux | grep -v grep | grep "${scriptPath}" | wc -l`);
          processCount = parseInt(stdout.trim());
          isRunning = processCount > 0;
        } catch (error) {
          // Process check failed
        }
      }

      statuses.push({
        name,
        command: server.command,
        script_path: scriptPath,
        is_running: isRunning,
        process_count: processCount,
        has_env: !!server.env,
      });
    }

    return {
      timestamp: new Date().toISOString(),
      total_servers: statuses.length,
      running_servers: statuses.filter((s) => s.is_running).length,
      servers: statuses,
    };
  } catch (error) {
    throw new Error(`Failed to check MCP server status: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get Claude Code session information
 */
async function getSessionInfo(): Promise<any> {
  try {
    // Get Claude Code processes
    const { stdout: psOutput } = await execAsync('ps aux | grep -i "claude" | grep -v grep || true');
    const processes = psOutput
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(/\s+/);
        return {
          user: parts[0],
          pid: parseInt(parts[1]),
          cpu: parseFloat(parts[2]),
          memory: parseFloat(parts[3]),
          command: parts.slice(10).join(' '),
        };
      });

    return {
      timestamp: new Date().toISOString(),
      claude_processes: processes.length,
      processes: processes,
      total_cpu: Math.round(processes.reduce((sum, p) => sum + p.cpu, 0) * 100) / 100,
      total_memory: Math.round(processes.reduce((sum, p) => sum + p.memory, 0) * 100) / 100,
    };
  } catch (error) {
    throw new Error(`Failed to get session info: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get Claude Code logs
 */
async function getClaudeLogs(lines?: number): Promise<any> {
  try {
    // Find all log files
    const logFiles = await glob('*.log', {
      cwd: CLAUDE_LOGS_DIR,
      absolute: true,
    });

    if (logFiles.length === 0) {
      return {
        logs_directory: CLAUDE_LOGS_DIR,
        log_files: [],
        message: 'No log files found',
      };
    }

    // Sort by modification time (newest first)
    const fileStats = await Promise.all(
      logFiles.map(async (file) => ({
        file,
        stats: await stat(file),
      }))
    );

    fileStats.sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

    // Get most recent log file
    const mostRecentLog = fileStats[0].file;
    const content = await readFile(mostRecentLog, 'utf-8');
    const allLines = content.split('\n');

    const lineCount = lines || 50;
    const recentLines = allLines.slice(-lineCount);

    return {
      logs_directory: CLAUDE_LOGS_DIR,
      total_log_files: logFiles.length,
      most_recent_log: mostRecentLog.split('/').pop(),
      log_modified: fileStats[0].stats.mtime.toISOString(),
      total_lines: allLines.length,
      returned_lines: recentLines.length,
      content: recentLines.join('\n'),
    };
  } catch (error) {
    throw new Error(`Failed to get Claude logs: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Search Claude Code logs
 */
async function searchClaudeLogs(query: string, logType?: string): Promise<any> {
  try {
    const pattern = logType ? `${logType}.log` : '*.log';
    const logFiles = await glob(pattern, {
      cwd: CLAUDE_LOGS_DIR,
      absolute: true,
    });

    const results: any[] = [];

    for (const logFile of logFiles) {
      try {
        const content = await readFile(logFile, 'utf-8');
        const lines = content.split('\n');

        const matches = lines
          .map((line, index) => ({ line, lineNumber: index + 1 }))
          .filter(({ line }) => line.toLowerCase().includes(query.toLowerCase()));

        if (matches.length > 0) {
          results.push({
            log_file: logFile.split('/').pop(),
            matches_found: matches.length,
            matches: matches.slice(0, 20).map(({ line, lineNumber }) => ({
              line_number: lineNumber,
              content: line,
            })),
          });
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return {
      query,
      logs_directory: CLAUDE_LOGS_DIR,
      total_files_searched: logFiles.length,
      files_with_matches: results.length,
      results,
    };
  } catch (error) {
    throw new Error(`Failed to search Claude logs: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get list of available log files
 */
async function getLogFileList(): Promise<any> {
  try {
    const logFiles = await glob('*.log', {
      cwd: CLAUDE_LOGS_DIR,
      absolute: true,
    });

    const fileInfos = await Promise.all(
      logFiles.map(async (file) => {
        const stats = await stat(file);
        return {
          name: file.split('/').pop(),
          full_path: file,
          size_bytes: stats.size,
          size_mb: Math.round((stats.size / 1024 / 1024) * 100) / 100,
          modified: stats.mtime.toISOString(),
          created: stats.birthtime.toISOString(),
        };
      })
    );

    // Sort by modification time (newest first)
    fileInfos.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

    return {
      logs_directory: CLAUDE_LOGS_DIR,
      total_log_files: fileInfos.length,
      total_size_mb: Math.round(fileInfos.reduce((sum, f) => sum + f.size_mb, 0) * 100) / 100,
      log_files: fileInfos,
    };
  } catch (error) {
    throw new Error(`Failed to list log files: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get Claude Code background shells status
 */
async function getBackgroundShells(): Promise<any> {
  try {
    // Find all bash/zsh shells that might be Claude Code background shells
    const { stdout } = await execAsync('ps aux | grep -E "(bash|zsh)" | grep -v grep || true');

    const shells = stdout
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(/\s+/);
        return {
          user: parts[0],
          pid: parseInt(parts[1]),
          cpu: parseFloat(parts[2]),
          memory: parseFloat(parts[3]),
          started: parts[8],
          command: parts.slice(10).join(' '),
        };
      })
      // Filter to only shells that look like they might be Claude Code related
      .filter((shell) => shell.command.includes('bash') || shell.command.includes('zsh'));

    return {
      timestamp: new Date().toISOString(),
      total_shells: shells.length,
      shells: shells.slice(0, 20), // Limit to 20 most recent
    };
  } catch (error) {
    throw new Error(`Failed to get background shells: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get comprehensive Claude Code status
 */
async function getClaudeCodeStatus(): Promise<any> {
  const [config, mcpStatus, sessionInfo, logFiles] = await Promise.all([
    getClaudeConfig(),
    getMcpServerStatus(),
    getSessionInfo(),
    getLogFileList(),
  ]);

  return {
    timestamp: new Date().toISOString(),
    configuration: {
      total_mcp_servers: config.total_mcp_servers,
      mcp_servers_running: mcpStatus.running_servers,
    },
    session: {
      claude_processes: sessionInfo.claude_processes,
      total_cpu_percent: sessionInfo.total_cpu,
      total_memory_percent: sessionInfo.total_memory,
    },
    logs: {
      total_log_files: logFiles.total_log_files,
      total_size_mb: logFiles.total_size_mb,
      most_recent: logFiles.log_files[0]?.name || 'none',
    },
  };
}

// Create MCP Server
const server = new Server(
  {
    name: 'miyabi-claude-code',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'claude_config',
      description: 'Get Claude Desktop configuration (MCP servers, preferences)',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'claude_mcp_status',
      description: 'Get MCP server connection status (check if servers are running)',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'claude_session_info',
      description: 'Get Claude Code session information (processes, CPU, memory)',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'claude_logs',
      description: 'Get recent Claude Code logs',
      inputSchema: {
        type: 'object',
        properties: {
          lines: {
            type: 'number',
            description: 'Number of lines to return (default: 50)',
          },
        },
      },
    },
    {
      name: 'claude_log_search',
      description: 'Search Claude Code logs for specific content',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query',
          },
          log_type: {
            type: 'string',
            description: 'Specific log file type to search (optional)',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'claude_log_files',
      description: 'Get list of all Claude Code log files',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'claude_background_shells',
      description: 'Get information about background shell processes',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'claude_status',
      description: 'Get comprehensive Claude Code status (config, MCP, session, logs)',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'claude_config': {
        const data = await getClaudeConfig();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'claude_mcp_status': {
        const data = await getMcpServerStatus();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'claude_session_info': {
        const data = await getSessionInfo();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'claude_logs': {
        const validated = LogTailSchema.parse(args || {});
        const data = await getClaudeLogs(validated.lines);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'claude_log_search': {
        const validated = LogSearchSchema.parse(args);
        const data = await searchClaudeLogs(validated.query, validated.log_type);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'claude_log_files': {
        const data = await getLogFileList();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'claude_background_shells': {
        const data = await getBackgroundShells();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'claude_status': {
        const data = await getClaudeCodeStatus();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Miyabi Claude Code MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
