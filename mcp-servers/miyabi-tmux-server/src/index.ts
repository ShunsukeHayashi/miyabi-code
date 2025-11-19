#!/usr/bin/env node

/**
 * Miyabi tmux MCP Server
 *
 * Provides MCP tools for multithread communication aggregation across tmux sessions
 * Enables any MCP client to join, monitor, and communicate with Miyabi Orchestra
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface TmuxSession {
  name: string;
  windows: number;
  created: string;
}

interface TmuxPane {
  sessionName: string;
  windowIndex: number;
  paneIndex: number;
  paneId: string;
  command: string;
  path: string;
}

interface CommHubStatus {
  active: boolean;
  panes: TmuxPane[];
  messageCount: number;
  lastSync: string;
}

/**
 * Execute tmux command with error handling
 */
async function execTmux(command: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(`tmux ${command}`);
    if (stderr && !stderr.includes("no server running")) {
      console.error(`tmux stderr: ${stderr}`);
    }
    return stdout.trim();
  } catch (error: any) {
    throw new Error(`tmux command failed: ${error.message}`);
  }
}

/**
 * List all tmux sessions
 */
async function listSessions(): Promise<TmuxSession[]> {
  const output = await execTmux('list-sessions -F "#{session_name}|#{session_windows}|#{session_created}"');

  return output.split('\n').filter(Boolean).map(line => {
    const [name, windows, created] = line.split('|');
    return {
      name,
      windows: parseInt(windows, 10),
      created: new Date(parseInt(created, 10) * 1000).toISOString(),
    };
  });
}

/**
 * List all panes across all sessions
 */
async function listPanes(sessionFilter?: string): Promise<TmuxPane[]> {
  const filter = sessionFilter ? `-t ${sessionFilter}` : '-a';
  const output = await execTmux(
    `list-panes ${filter} -F "#{session_name}|#{window_index}|#{pane_index}|#{pane_id}|#{pane_current_command}|#{pane_current_path}"`
  );

  return output.split('\n').filter(Boolean).map(line => {
    const [sessionName, windowIndex, paneIndex, paneId, command, path] = line.split('|');
    return {
      sessionName,
      windowIndex: parseInt(windowIndex, 10),
      paneIndex: parseInt(paneIndex, 10),
      paneId,
      command,
      path,
    };
  });
}

/**
 * Send message to specific pane using CLAUDE.md P0.2 protocol
 * Format: tmux send-keys -t <PANE_ID> "<MESSAGE>" && sleep 0.5 && tmux send-keys -t <PANE_ID> Enter
 */
async function sendMessage(paneId: string, message: string): Promise<void> {
  // Escape double quotes in message
  const escapedMessage = message.replace(/"/g, '\\"');

  // P0.2 Protocol: Strict syntax with sleep 0.5 between message and Enter
  await execTmux(`send-keys -t ${paneId} "${escapedMessage}"`);
  await new Promise(resolve => setTimeout(resolve, 500));
  await execTmux(`send-keys -t ${paneId} Enter`);
}

/**
 * Join CommHub session
 */
async function joinCommHub(): Promise<{ success: boolean; message: string; paneId?: string }> {
  try {
    // Check if miyabi-orchestra session exists
    const sessions = await listSessions();
    const orchestraSession = sessions.find(s => s.name === 'miyabi-orchestra');

    if (!orchestraSession) {
      return {
        success: false,
        message: 'miyabi-orchestra session not found. Please create it first.',
      };
    }

    // Check if CommHub window exists
    const windows = await execTmux('list-windows -t miyabi-orchestra -F "#{window_name}"');
    const hasCommHub = windows.split('\n').includes('CommHub');

    if (!hasCommHub) {
      return {
        success: false,
        message: 'CommHub window not found in miyabi-orchestra session.',
      };
    }

    // Get CommHub panes
    const panes = await listPanes('miyabi-orchestra');
    const commHubPanes = panes.filter(p => p.windowIndex === 2); // CommHub is window 2

    if (commHubPanes.length === 0) {
      return {
        success: false,
        message: 'No panes found in CommHub window.',
      };
    }

    // Send join notification to message aggregator (first pane)
    const aggregatorPane = commHubPanes[0];
    const timestamp = new Date().toISOString();
    await sendMessage(aggregatorPane.paneId, `[${timestamp}] 🔗 MCP Client joined CommHub`);

    return {
      success: true,
      message: 'Successfully joined CommHub',
      paneId: aggregatorPane.paneId,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to join CommHub: ${error.message}`,
    };
  }
}

/**
 * Get CommHub status
 */
async function getCommHubStatus(): Promise<CommHubStatus> {
  try {
    const panes = await listPanes('miyabi-orchestra');
    const commHubPanes = panes.filter(p => p.windowIndex === 2);

    return {
      active: commHubPanes.length > 0,
      panes: commHubPanes,
      messageCount: 0, // TODO: Track message count
      lastSync: new Date().toISOString(),
    };
  } catch (error) {
    return {
      active: false,
      panes: [],
      messageCount: 0,
      lastSync: new Date().toISOString(),
    };
  }
}

/**
 * Broadcast message to all Miyabi sessions
 */
async function broadcastMessage(message: string, fromSource: string = 'MCP'): Promise<{ sent: number; failed: number }> {
  const sessions = await listSessions();
  const miyabiSessions = sessions.filter(s => s.name.startsWith('miyabi'));

  let sent = 0;
  let failed = 0;

  for (const session of miyabiSessions) {
    try {
      const panes = await listPanes(session.name);
      const firstPane = panes[0];

      if (firstPane) {
        const formattedMessage = `[${fromSource}→${session.name}] ${message}`;
        await sendMessage(firstPane.paneId, formattedMessage);
        sent++;
      }
    } catch (error) {
      failed++;
      console.error(`Failed to send to ${session.name}:`, error);
    }
  }

  return { sent, failed };
}

/**
 * Capture pane content
 */
async function capturePane(paneId: string, lines?: number): Promise<string> {
  const linesArg = lines ? `-S -${lines}` : '';
  return await execTmux(`capture-pane -p ${linesArg} -t ${paneId}`);
}

/**
 * Search pane content
 */
async function searchPane(paneId: string, pattern: string): Promise<{ lineNumber: number; content: string }[]> {
  const content = await capturePane(paneId);
  const lines = content.split('\n');
  const results: { lineNumber: number; content: string }[] = [];

  lines.forEach((line, index) => {
    if (line.includes(pattern)) {
      results.push({
        lineNumber: index + 1,
        content: line,
      });
    }
  });

  return results;
}

/**
 * Get tail of pane content
 */
async function tailPane(paneId: string, lines: number): Promise<string> {
  return await capturePane(paneId, lines);
}

/**
 * Check if pane is busy (running command other than shell)
 */
async function isPaneBusy(paneId: string): Promise<boolean> {
  const output = await execTmux(`display-message -p -t ${paneId} '#{pane_current_command}'`);
  const command = output.trim();
  // Pane is busy if running something other than shell
  return !['bash', 'zsh', 'sh', 'fish'].includes(command);
}

/**
 * Get current command running in pane
 */
async function getCurrentCommand(paneId: string): Promise<{ command: string; isBusy: boolean }> {
  const command = (await execTmux(`display-message -p -t ${paneId} '#{pane_current_command}'`)).trim();
  const isBusy = !['bash', 'zsh', 'sh', 'fish'].includes(command);
  return { command, isBusy };
}

// Define MCP tools
const tools: Tool[] = [
  {
    name: "tmux_list_sessions",
    description: "List all tmux sessions in the Miyabi environment. Returns session names, window counts, and creation timestamps.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "tmux_list_panes",
    description: "List all panes across tmux sessions. Optionally filter by session name. Returns detailed pane information including IDs, commands, and paths.",
    inputSchema: {
      type: "object",
      properties: {
        session: {
          type: "string",
          description: "Optional session name to filter panes (e.g., 'miyabi-orchestra')",
        },
      },
    },
  },
  {
    name: "tmux_send_message",
    description: "Send a message to a specific tmux pane using CLAUDE.md P0.2 protocol (strict syntax with sleep 0.5). Used for inter-agent communication.",
    inputSchema: {
      type: "object",
      properties: {
        pane_id: {
          type: "string",
          description: "Target pane ID (e.g., '%50', '%51')",
        },
        message: {
          type: "string",
          description: "Message to send to the pane",
        },
      },
      required: ["pane_id", "message"],
    },
  },
  {
    name: "tmux_join_commhub",
    description: "Join the Miyabi CommHub session for multithread communication aggregation. Automatically connects to the message aggregator and announces presence.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "tmux_get_commhub_status",
    description: "Get current status of the CommHub including active panes, message count, and last sync time.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "tmux_broadcast",
    description: "Broadcast a message to all Miyabi tmux sessions. Useful for system-wide notifications or coordination.",
    inputSchema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "Message to broadcast to all Miyabi sessions",
        },
        from_source: {
          type: "string",
          description: "Source identifier for the broadcast (default: 'MCP')",
        },
      },
      required: ["message"],
    },
  },
  {
    name: "tmux_pane_capture",
    description: "Capture and return the content of a tmux pane. Optionally specify number of lines.",
    inputSchema: {
      type: "object",
      properties: {
        pane_id: {
          type: "string",
          description: "Target pane ID (e.g., '%50')",
        },
        lines: {
          type: "number",
          description: "Number of lines to capture from bottom (optional)",
        },
      },
      required: ["pane_id"],
    },
  },
  {
    name: "tmux_pane_search",
    description: "Search for a pattern in pane content and return matching lines with line numbers.",
    inputSchema: {
      type: "object",
      properties: {
        pane_id: {
          type: "string",
          description: "Target pane ID",
        },
        pattern: {
          type: "string",
          description: "Search pattern (substring match)",
        },
      },
      required: ["pane_id", "pattern"],
    },
  },
  {
    name: "tmux_pane_tail",
    description: "Get the last N lines from a pane (like tail command).",
    inputSchema: {
      type: "object",
      properties: {
        pane_id: {
          type: "string",
          description: "Target pane ID",
        },
        lines: {
          type: "number",
          description: "Number of lines to retrieve from bottom",
        },
      },
      required: ["pane_id", "lines"],
    },
  },
  {
    name: "tmux_pane_is_busy",
    description: "Check if a pane is busy (running a command other than shell).",
    inputSchema: {
      type: "object",
      properties: {
        pane_id: {
          type: "string",
          description: "Target pane ID",
        },
      },
      required: ["pane_id"],
    },
  },
  {
    name: "tmux_pane_current_command",
    description: "Get the current command running in a pane and whether it's busy.",
    inputSchema: {
      type: "object",
      properties: {
        pane_id: {
          type: "string",
          description: "Target pane ID",
        },
      },
      required: ["pane_id"],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: "miyabi-tmux-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool list requests
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "tmux_list_sessions": {
        const sessions = await listSessions();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(sessions, null, 2),
            },
          ],
        };
      }

      case "tmux_list_panes": {
        const panes = await listPanes(args?.session as string | undefined);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(panes, null, 2),
            },
          ],
        };
      }

      case "tmux_send_message": {
        const { pane_id, message } = args as { pane_id: string; message: string };
        await sendMessage(pane_id, message);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                pane_id,
                message: "Message sent successfully",
              }, null, 2),
            },
          ],
        };
      }

      case "tmux_join_commhub": {
        const result = await joinCommHub();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "tmux_get_commhub_status": {
        const status = await getCommHubStatus();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      }

      case "tmux_broadcast": {
        const { message, from_source } = args as { message: string; from_source?: string };
        const result = await broadcastMessage(message, from_source);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                sent_count: result.sent,
                failed_count: result.failed,
                message: `Broadcast to ${result.sent} sessions (${result.failed} failed)`,
              }, null, 2),
            },
          ],
        };
      }

      case "tmux_pane_capture": {
        const { pane_id, lines } = args as { pane_id: string; lines?: number };
        const content = await capturePane(pane_id, lines);
        return {
          content: [
            {
              type: "text",
              text: content,
            },
          ],
        };
      }

      case "tmux_pane_search": {
        const { pane_id, pattern } = args as { pane_id: string; pattern: string };
        const results = await searchPane(pane_id, pattern);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      case "tmux_pane_tail": {
        const { pane_id, lines } = args as { pane_id: string; lines: number };
        const content = await tailPane(pane_id, lines);
        return {
          content: [
            {
              type: "text",
              text: content,
            },
          ],
        };
      }

      case "tmux_pane_is_busy": {
        const { pane_id } = args as { pane_id: string };
        const isBusy = await isPaneBusy(pane_id);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ pane_id, is_busy: isBusy }, null, 2),
            },
          ],
        };
      }

      case "tmux_pane_current_command": {
        const { pane_id } = args as { pane_id: string };
        const result = await getCurrentCommand(pane_id);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ pane_id, ...result }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            error: error.message,
          }, null, 2),
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
  console.error("Miyabi tmux MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
