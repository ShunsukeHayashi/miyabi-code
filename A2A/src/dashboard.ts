/**
 * A2A Real-Time Dashboard
 * ========================
 * Terminal-based dashboard for monitoring multi-agent system
 */

import { execSync, exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// Types
// =============================================================================

interface AgentStatus {
  name: string;
  paneId: string;
  role: string;
  status: 'healthy' | 'busy' | 'stale' | 'error' | 'dead' | 'unknown';
  lastActivity: string;
  currentTask?: string;
}

interface DashboardState {
  agents: AgentStatus[];
  recentMessages: Message[];
  metrics: Metrics;
  systemStatus: 'ok' | 'warning' | 'critical';
}

interface Message {
  timestamp: string;
  from: string;
  to: string;
  content: string;
}

interface Metrics {
  tasksPerHour: number;
  avgTaskTime: number;
  successRate: number;
  activeCycles: number;
  uptime: string;
}

// =============================================================================
// Configuration
// =============================================================================

const SESSION_NAME = process.env.A2A_SESSION_NAME || 'a2a';
const STATE_FILE = process.env.A2A_STATE_FILE ||
  path.join(process.env.HOME || '~', '.miyabi', 'a2a_state.json');
const REFRESH_INTERVAL = 2000; // 2 seconds

const AGENT_CONFIG = [
  { name: 'shikiroon', role: 'Conductor', icon: '🎭', env: 'MIYABI_CONDUCTOR_PANE' },
  { name: 'kaede', role: 'CodeGen', icon: '👨‍💻', env: 'MIYABI_CODEGEN_PANE' },
  { name: 'sakura', role: 'Review', icon: '🔍', env: 'MIYABI_REVIEW_PANE' },
  { name: 'tsubaki', role: 'PR', icon: '📝', env: 'MIYABI_PR_PANE' },
  { name: 'botan', role: 'Deploy', icon: '🚀', env: 'MIYABI_DEPLOY_PANE' },
];

// =============================================================================
// ANSI Colors
// =============================================================================

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

// =============================================================================
// Utility Functions
// =============================================================================

function clearScreen(): void {
  process.stdout.write('\x1b[2J\x1b[H');
}

function moveCursor(row: number, col: number): void {
  process.stdout.write(`\x1b[${row};${col}H`);
}

function getTerminalSize(): { rows: number; cols: number } {
  return {
    rows: process.stdout.rows || 40,
    cols: process.stdout.columns || 120,
  };
}

function centerText(text: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text;
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}h ${minutes}m ${secs}s`;
}

// =============================================================================
// Data Collection
// =============================================================================

function checkPaneExists(paneId: string): boolean {
  try {
    execSync(`tmux list-panes -a -F "#{pane_id}" 2>/dev/null | grep -q "^${paneId}$"`, {
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}

function getPaneOutput(paneId: string, lines: number = 5): string {
  try {
    return execSync(`tmux capture-pane -t ${paneId} -p 2>/dev/null | tail -${lines}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return '';
  }
}

function getAgentStatus(config: typeof AGENT_CONFIG[0]): AgentStatus {
  const paneId = process.env[config.env] || '';

  if (!paneId) {
    return {
      name: config.name,
      paneId: 'N/A',
      role: config.role,
      status: 'unknown',
      lastActivity: 'N/A',
    };
  }

  if (!checkPaneExists(paneId)) {
    return {
      name: config.name,
      paneId,
      role: config.role,
      status: 'dead',
      lastActivity: 'N/A',
    };
  }

  const output = getPaneOutput(paneId);
  let status: AgentStatus['status'] = 'unknown';

  if (output.includes('>') || output.includes('$')) {
    status = 'healthy';
  } else if (output.includes('⏺') || output.includes('Working') || output.includes('...')) {
    status = 'busy';
  } else if (output.toLowerCase().includes('error')) {
    status = 'error';
  } else if (output.length > 0) {
    status = 'busy';
  } else {
    status = 'stale';
  }

  // Extract current task from output
  let currentTask: string | undefined;
  const taskMatch = output.match(/(?:Task|タスク|Issue)[:\s#]*(\d+|[^\n]+)/i);
  if (taskMatch) {
    currentTask = truncate(taskMatch[1], 20);
  }

  return {
    name: config.name,
    paneId,
    role: config.role,
    status,
    lastActivity: new Date().toLocaleTimeString(),
    currentTask,
  };
}

function collectAgentStatuses(): AgentStatus[] {
  return AGENT_CONFIG.map(getAgentStatus);
}

function extractRecentMessages(agents: AgentStatus[]): Message[] {
  const messages: Message[] = [];

  for (const agent of agents) {
    if (agent.paneId === 'N/A') continue;

    const output = getPaneOutput(agent.paneId, 20);
    const lines = output.split('\n');

    for (const line of lines) {
      // Match message patterns like [Agent] Status: Content or [Agent→Agent] Action
      const msgMatch = line.match(/\[([^\]→]+)(?:→([^\]]+))?\]\s*([^:]+):\s*(.+)/);
      if (msgMatch) {
        messages.push({
          timestamp: new Date().toLocaleTimeString(),
          from: msgMatch[1],
          to: msgMatch[2] || 'Conductor',
          content: truncate(msgMatch[3] + ': ' + msgMatch[4], 50),
        });
      }
    }
  }

  // Return last 10 unique messages
  const unique = messages.filter((m, i, arr) =>
    arr.findIndex(x => x.content === m.content) === i
  );
  return unique.slice(-10);
}

function loadMetrics(): Metrics {
  try {
    const stateContent = fs.readFileSync(STATE_FILE, 'utf-8');
    const state = JSON.parse(stateContent);

    return {
      tasksPerHour: state.metrics?.throughputPerHour?.toFixed(1) || 0,
      avgTaskTime: state.metrics?.averageTaskTime?.toFixed(1) || 0,
      successRate: state.metrics?.totalTasks > 0
        ? Math.round((state.metrics.completedTasks / state.metrics.totalTasks) * 100)
        : 100,
      activeCycles: state.currentCycle || 0,
      uptime: formatUptime(state.metrics?.uptime || 0),
    };
  } catch {
    return {
      tasksPerHour: 0,
      avgTaskTime: 0,
      successRate: 100,
      activeCycles: 0,
      uptime: '0h 0m 0s',
    };
  }
}

function determineSystemStatus(agents: AgentStatus[]): 'ok' | 'warning' | 'critical' {
  const deadCount = agents.filter(a => a.status === 'dead').length;
  const errorCount = agents.filter(a => a.status === 'error').length;
  const staleCount = agents.filter(a => a.status === 'stale').length;

  if (deadCount > 0 || errorCount > 1) return 'critical';
  if (errorCount > 0 || staleCount > 1) return 'warning';
  return 'ok';
}

// =============================================================================
// Rendering
// =============================================================================

function renderHeader(cols: number, systemStatus: 'ok' | 'warning' | 'critical'): string[] {
  const statusIcon = systemStatus === 'ok' ? '🟢' :
                     systemStatus === 'warning' ? '🟡' : '🔴';
  const statusText = systemStatus === 'ok' ? 'All Systems OK' :
                     systemStatus === 'warning' ? 'Warning' : 'Critical';

  const lines: string[] = [];
  lines.push('╔' + '═'.repeat(cols - 2) + '╗');
  lines.push('║' + centerText(`${colors.bold}A2A Multi-Agent Dashboard${colors.reset}`, cols - 2) + '║');
  lines.push('║' + centerText(`${statusIcon} ${statusText}`, cols - 2) + '║');
  lines.push('╠' + '═'.repeat(cols - 2) + '╣');

  return lines;
}

function renderAgentsPanel(agents: AgentStatus[], width: number): string[] {
  const lines: string[] = [];
  lines.push(`${colors.bold}  Agents Status${colors.reset}`);
  lines.push('  ' + '─'.repeat(width - 4));

  for (const agent of agents) {
    const config = AGENT_CONFIG.find(c => c.name === agent.name);
    const icon = config?.icon || '?';

    let statusColor = colors.white;
    let statusBar = '──────';

    switch (agent.status) {
      case 'healthy':
        statusColor = colors.green;
        statusBar = '██████';
        break;
      case 'busy':
        statusColor = colors.blue;
        statusBar = '████──';
        break;
      case 'stale':
        statusColor = colors.yellow;
        statusBar = '██────';
        break;
      case 'error':
        statusColor = colors.red;
        statusBar = '█─────';
        break;
      case 'dead':
        statusColor = colors.red;
        statusBar = '──────';
        break;
    }

    const name = agent.name.padEnd(10);
    const pane = (agent.paneId || 'N/A').padEnd(6);
    lines.push(`  ${icon} ${statusColor}${name}${colors.reset} ${statusBar} ${colors.dim}${pane}${colors.reset}`);
  }

  return lines;
}

function renderMetricsPanel(metrics: Metrics, width: number): string[] {
  const lines: string[] = [];
  lines.push(`${colors.bold}  Metrics${colors.reset}`);
  lines.push('  ' + '─'.repeat(width - 4));
  lines.push(`  Tasks/hour:    ${colors.cyan}${metrics.tasksPerHour}${colors.reset}`);
  lines.push(`  Avg time:      ${colors.cyan}${metrics.avgTaskTime} min${colors.reset}`);
  lines.push(`  Success rate:  ${colors.green}${metrics.successRate}%${colors.reset}`);
  lines.push(`  Active cycles: ${colors.cyan}${metrics.activeCycles}${colors.reset}`);
  lines.push(`  Uptime:        ${colors.dim}${metrics.uptime}${colors.reset}`);

  return lines;
}

function renderMessagesPanel(messages: Message[], width: number, height: number): string[] {
  const lines: string[] = [];
  lines.push(`${colors.bold}  Recent Messages${colors.reset}`);
  lines.push('  ' + '─'.repeat(width - 4));

  const displayMessages = messages.slice(-(height - 3));
  for (const msg of displayMessages) {
    const arrow = msg.to ? '→' : ':';
    const truncatedContent = truncate(msg.content, width - 20);
    lines.push(`  ${colors.dim}${msg.timestamp}${colors.reset} ${colors.cyan}${msg.from}${colors.reset}${arrow} ${truncatedContent}`);
  }

  // Pad with empty lines if needed
  while (lines.length < height) {
    lines.push('');
  }

  return lines;
}

function renderControlsPanel(width: number): string[] {
  const lines: string[] = [];
  lines.push('  ' + '─'.repeat(width - 4));
  lines.push(`  ${colors.dim}[q] Quit  [r] Refresh  [h] Health Check  [s] Scale${colors.reset}`);
  return lines;
}

function renderDashboard(state: DashboardState): void {
  clearScreen();
  const { rows, cols } = getTerminalSize();

  const leftWidth = Math.floor(cols * 0.4);
  const rightWidth = cols - leftWidth - 3;

  // Header
  const headerLines = renderHeader(cols, state.systemStatus);
  for (let i = 0; i < headerLines.length; i++) {
    moveCursor(i + 1, 1);
    process.stdout.write(headerLines[i]);
  }

  const contentStart = headerLines.length + 1;
  const contentHeight = rows - contentStart - 4;

  // Left panel: Agents + Metrics
  const agentsLines = renderAgentsPanel(state.agents, leftWidth);
  const metricsLines = renderMetricsPanel(state.metrics, leftWidth);

  for (let i = 0; i < agentsLines.length; i++) {
    moveCursor(contentStart + i, 1);
    process.stdout.write('║ ' + agentsLines[i].padEnd(leftWidth - 2));
  }

  const metricsStart = contentStart + agentsLines.length + 1;
  for (let i = 0; i < metricsLines.length; i++) {
    moveCursor(metricsStart + i, 1);
    process.stdout.write('║ ' + metricsLines[i].padEnd(leftWidth - 2));
  }

  // Right panel: Messages
  const messagesLines = renderMessagesPanel(state.recentMessages, rightWidth, contentHeight);
  for (let i = 0; i < messagesLines.length && i < contentHeight; i++) {
    moveCursor(contentStart + i, leftWidth + 2);
    process.stdout.write('│ ' + messagesLines[i].padEnd(rightWidth - 2) + '║');
  }

  // Footer
  moveCursor(rows - 2, 1);
  process.stdout.write('╠' + '═'.repeat(cols - 2) + '╣');

  const controlsLines = renderControlsPanel(cols);
  for (let i = 0; i < controlsLines.length; i++) {
    moveCursor(rows - 1 + i, 1);
    process.stdout.write('║' + controlsLines[i].padEnd(cols - 2) + '║');
  }

  moveCursor(rows, 1);
  process.stdout.write('╚' + '═'.repeat(cols - 2) + '╝');
}

// =============================================================================
// Main Loop
// =============================================================================

function collectDashboardState(): DashboardState {
  const agents = collectAgentStatuses();
  const recentMessages = extractRecentMessages(agents);
  const metrics = loadMetrics();
  const systemStatus = determineSystemStatus(agents);

  return {
    agents,
    recentMessages,
    metrics,
    systemStatus,
  };
}

async function runDashboard(): Promise<void> {
  // Check if session exists
  try {
    execSync(`tmux has-session -t ${SESSION_NAME} 2>/dev/null`);
  } catch {
    console.error(`Session '${SESSION_NAME}' not found. Run a2a_bootstrap.sh first.`);
    process.exit(1);
  }

  // Load environment
  const envFile = path.join(process.env.HOME || '~', '.miyabi', 'a2a_env.sh');
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf-8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^export\s+(\w+)="([^"]*)"/);
      if (match) {
        process.env[match[1]] = match[2];
      }
    }
  }

  // Setup input handling
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', (key: Buffer) => {
      const char = key.toString();
      if (char === 'q' || char === '\x03') { // q or Ctrl+C
        clearScreen();
        process.exit(0);
      } else if (char === 'r') {
        // Force refresh
        const state = collectDashboardState();
        renderDashboard(state);
      } else if (char === 'h') {
        // Run health check
        exec('./scripts/a2a_health.sh', (err, stdout) => {
          if (!err) {
            console.log(stdout);
          }
        });
      }
    });
  }

  // Main render loop
  const render = () => {
    const state = collectDashboardState();
    renderDashboard(state);
  };

  render();
  setInterval(render, REFRESH_INTERVAL);
}

// Run
runDashboard().catch(console.error);
