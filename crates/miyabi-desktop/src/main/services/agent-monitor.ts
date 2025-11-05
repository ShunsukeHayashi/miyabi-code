import { ipcMain, BrowserWindow } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { watch, FSWatcher } from 'chokidar';
import cliExecutorService from './cli-executor';
import notificationService from './notifications';

/**
 * Agent execution status
 */
export type AgentStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

/**
 * Agent metadata
 */
export interface AgentMetadata {
  id: string;
  type: string;
  issueNumber: number | null;
  status: AgentStatus;
  progress: number;
  startedAt: number;
  completedAt?: number;
  error?: string;
  logFile?: string;
  commandId?: string;
}

/**
 * Log entry for real-time streaming
 */
export interface LogEntry {
  agentId: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

/**
 * Agent Monitor Service
 * Monitors running agents and streams logs in real-time
 */
class AgentMonitorService {
  private agents: Map<string, AgentMetadata> = new Map();
  private logWatchers: Map<string, FSWatcher> = new Map();
  private readonly tasksDir: string;

  constructor() {
    // TODO: Get from project configuration
    this.tasksDir = path.join(process.cwd(), '.miyabi', 'tasks');
  }

  /**
   * Start monitoring agents
   */
  async startMonitoring(): Promise<void> {
    console.log('[AgentMonitor] Starting agent monitoring...');

    try {
      // Ensure tasks directory exists
      await fs.mkdir(this.tasksDir, { recursive: true });

      // Load existing agents
      await this.loadAgents();

      // Watch for new agents
      this.watchTasksDirectory();

      console.log('[AgentMonitor] Monitoring started successfully');
    } catch (error) {
      console.error('[AgentMonitor] Error starting monitoring:', error);
    }
  }

  /**
   * Stop monitoring agents
   */
  async stopMonitoring(): Promise<void> {
    console.log('[AgentMonitor] Stopping agent monitoring...');

    // Stop all log watchers
    for (const [agentId, watcher] of this.logWatchers) {
      await watcher.close();
      this.logWatchers.delete(agentId);
    }

    console.log('[AgentMonitor] Monitoring stopped');
  }

  /**
   * Get all running agents
   */
  getRunningAgents(): AgentMetadata[] {
    return Array.from(this.agents.values())
      .filter(agent => agent.status === 'running' || agent.status === 'pending')
      .sort((a, b) => b.startedAt - a.startedAt);
  }

  /**
   * Get all agents (including completed)
   */
  getAllAgents(): AgentMetadata[] {
    return Array.from(this.agents.values())
      .sort((a, b) => b.startedAt - a.startedAt);
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): AgentMetadata | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Pause agent execution
   */
  async pauseAgent(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      console.warn('[AgentMonitor] Agent not found:', agentId);
      return false;
    }

    if (agent.status !== 'running') {
      console.warn('[AgentMonitor] Agent is not running:', agentId);
      return false;
    }

    // TODO: Implement actual pause mechanism
    // For now, we'll just update the status
    agent.status = 'paused';
    this.agents.set(agentId, agent);
    this.emitAgentUpdate(agent);

    console.log('[AgentMonitor] Agent paused:', agentId);
    return true;
  }

  /**
   * Cancel agent execution
   */
  async cancelAgent(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      console.warn('[AgentMonitor] Agent not found:', agentId);
      return false;
    }

    if (agent.status === 'completed' || agent.status === 'cancelled') {
      console.warn('[AgentMonitor] Agent already terminated:', agentId);
      return false;
    }

    // Try to kill the CLI command if running
    if (agent.commandId) {
      const killed = cliExecutorService.killCommand(agent.commandId);
      if (!killed) {
        console.warn('[AgentMonitor] Failed to kill command:', agent.commandId);
      }
    }

    // Update agent status
    agent.status = 'cancelled';
    agent.completedAt = Date.now();
    this.agents.set(agentId, agent);
    this.emitAgentUpdate(agent);

    // Stop watching logs
    const watcher = this.logWatchers.get(agentId);
    if (watcher) {
      await watcher.close();
      this.logWatchers.delete(agentId);
    }

    console.log('[AgentMonitor] Agent cancelled:', agentId);
    return true;
  }

  /**
   * Load existing agents from tasks directory
   */
  private async loadAgents(): Promise<void> {
    try {
      const files = await fs.readdir(this.tasksDir);

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        try {
          const filePath = path.join(this.tasksDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const metadata = JSON.parse(content);

          const agent: AgentMetadata = {
            id: metadata.id || file.replace('.json', ''),
            type: metadata.agent_type || 'unknown',
            issueNumber: metadata.issue_number || null,
            status: this.mapStatus(metadata.status),
            progress: metadata.progress || 0,
            startedAt: metadata.started_at || Date.now(),
            completedAt: metadata.completed_at,
            error: metadata.error,
            logFile: metadata.log_file,
          };

          this.agents.set(agent.id, agent);

          // Start watching log file if agent is running
          if (agent.status === 'running' && agent.logFile) {
            this.watchLogFile(agent.id, agent.logFile);
          }
        } catch (error) {
          console.error('[AgentMonitor] Error loading agent file:', file, error);
        }
      }

      console.log(`[AgentMonitor] Loaded ${this.agents.size} agents`);
    } catch (error) {
      console.error('[AgentMonitor] Error loading agents:', error);
    }
  }

  /**
   * Watch tasks directory for new agents
   */
  private watchTasksDirectory(): void {
    const watcher = watch(this.tasksDir, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true,
    });

    watcher.on('add', async (filePath) => {
      if (!filePath.endsWith('.json')) return;

      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const metadata = JSON.parse(content);

        const agent: AgentMetadata = {
          id: metadata.id || path.basename(filePath, '.json'),
          type: metadata.agent_type || 'unknown',
          issueNumber: metadata.issue_number || null,
          status: this.mapStatus(metadata.status),
          progress: metadata.progress || 0,
          startedAt: metadata.started_at || Date.now(),
          completedAt: metadata.completed_at,
          error: metadata.error,
          logFile: metadata.log_file,
        };

        this.agents.set(agent.id, agent);
        this.emitAgentUpdate(agent);

        if (agent.status === 'running' && agent.logFile) {
          this.watchLogFile(agent.id, agent.logFile);
        }

        console.log('[AgentMonitor] New agent detected:', agent.id);
      } catch (error) {
        console.error('[AgentMonitor] Error processing new agent:', error);
      }
    });

    watcher.on('change', async (filePath) => {
      if (!filePath.endsWith('.json')) return;

      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const metadata = JSON.parse(content);
        const agentId = metadata.id || path.basename(filePath, '.json');

        const agent = this.agents.get(agentId);
        if (agent) {
          agent.status = this.mapStatus(metadata.status);
          agent.progress = metadata.progress || agent.progress;
          agent.completedAt = metadata.completed_at;
          agent.error = metadata.error;

          this.agents.set(agentId, agent);
          this.emitAgentUpdate(agent);
        }
      } catch (error) {
        console.error('[AgentMonitor] Error updating agent:', error);
      }
    });
  }

  /**
   * Watch log file for real-time streaming
   */
  private watchLogFile(agentId: string, logFilePath: string): void {
    if (this.logWatchers.has(agentId)) {
      return; // Already watching
    }

    const fullPath = path.isAbsolute(logFilePath)
      ? logFilePath
      : path.join(this.tasksDir, '..', 'logs', logFilePath);

    const watcher = watch(fullPath, {
      persistent: true,
      ignoreInitial: false,
    });

    let lastSize = 0;

    watcher.on('change', async () => {
      try {
        const stats = await fs.stat(fullPath);
        if (stats.size > lastSize) {
          const stream = (await import('fs')).createReadStream(fullPath, {
            start: lastSize,
            end: stats.size,
          });

          let chunk = '';
          stream.on('data', (data) => {
            chunk += data.toString();
            const lines = chunk.split('\n');
            chunk = lines.pop() || '';

            for (const line of lines) {
              if (line.trim()) {
                this.emitLogEntry(agentId, line);
              }
            }
          });

          lastSize = stats.size;
        }
      } catch (error) {
        console.error('[AgentMonitor] Error reading log file:', error);
      }
    });

    this.logWatchers.set(agentId, watcher);
  }

  /**
   * Map status string to AgentStatus
   */
  private mapStatus(status: string | undefined): AgentStatus {
    switch (status?.toLowerCase()) {
      case 'pending': return 'pending';
      case 'running': return 'running';
      case 'paused': return 'paused';
      case 'completed': return 'completed';
      case 'failed': return 'failed';
      case 'cancelled': return 'cancelled';
      default: return 'pending';
    }
  }

  /**
   * Emit agent update to renderer
   */
  private emitAgentUpdate(agent: AgentMetadata): void {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((window) => {
      window.webContents.send('agent:updated', agent);
    });

    // Send notification for important agent status changes
    this.sendAgentNotification(agent);
  }

  /**
   * Send notification for agent status changes
   */
  private async sendAgentNotification(agent: AgentMetadata): Promise<void> {
    const issueText = agent.issueNumber ? ` (Issue #${agent.issueNumber})` : '';
    const agentTitle = `${agent.type}${issueText}`;

    switch (agent.status) {
      case 'completed':
        await notificationService.success(
          'Agent Completed',
          `${agentTitle} completed successfully`,
          { timeout: 8000, priority: 'normal' }
        );
        break;

      case 'failed':
        await notificationService.error(
          'Agent Failed',
          agent.error || `${agentTitle} failed to complete`,
          { timeout: 0, priority: 'high' } // No auto-dismiss for errors
        );
        break;

      case 'cancelled':
        await notificationService.warning(
          'Agent Cancelled',
          `${agentTitle} was cancelled`,
          { timeout: 6000, priority: 'low' }
        );
        break;

      case 'running':
        // Only notify for new agent starts (when no previous status)
        await notificationService.info(
          'Agent Started',
          `${agentTitle} is now running`,
          { timeout: 5000, priority: 'low', silent: true }
        );
        break;
    }
  }

  /**
   * Emit log entry to renderer
   */
  private emitLogEntry(agentId: string, message: string): void {
    const entry: LogEntry = {
      agentId,
      timestamp: Date.now(),
      level: this.detectLogLevel(message),
      message,
    };

    const windows = BrowserWindow.getAllWindows();
    windows.forEach((window) => {
      window.webContents.send('agent:log', entry);
    });
  }

  /**
   * Detect log level from message
   */
  private detectLogLevel(message: string): LogEntry['level'] {
    const lower = message.toLowerCase();
    if (lower.includes('error') || lower.includes('failed')) return 'error';
    if (lower.includes('warn')) return 'warn';
    if (lower.includes('debug')) return 'debug';
    return 'info';
  }
}

// Singleton instance
const agentMonitorService = new AgentMonitorService();

/**
 * Register IPC handlers for agent monitor
 */
export function registerAgentMonitorHandlers(): void {
  // Start monitoring
  ipcMain.handle('agent:startMonitoring', async () => {
    try {
      await agentMonitorService.startMonitoring();
      return { success: true };
    } catch (error) {
      console.error('[AgentMonitor IPC] Error starting monitoring:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Stop monitoring
  ipcMain.handle('agent:stopMonitoring', async () => {
    try {
      await agentMonitorService.stopMonitoring();
      return { success: true };
    } catch (error) {
      console.error('[AgentMonitor IPC] Error stopping monitoring:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Get running agents
  ipcMain.handle('agent:getRunning', async () => {
    try {
      const agents = agentMonitorService.getRunningAgents();
      return { success: true, agents };
    } catch (error) {
      console.error('[AgentMonitor IPC] Error getting running agents:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Get all agents
  ipcMain.handle('agent:getAll', async () => {
    try {
      const agents = agentMonitorService.getAllAgents();
      return { success: true, agents };
    } catch (error) {
      console.error('[AgentMonitor IPC] Error getting all agents:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Get agent by ID
  ipcMain.handle('agent:get', async (_, agentId: string) => {
    try {
      const agent = agentMonitorService.getAgent(agentId);
      return { success: true, agent };
    } catch (error) {
      console.error('[AgentMonitor IPC] Error getting agent:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Pause agent
  ipcMain.handle('agent:pause', async (_, agentId: string) => {
    try {
      const paused = await agentMonitorService.pauseAgent(agentId);
      return { success: paused };
    } catch (error) {
      console.error('[AgentMonitor IPC] Error pausing agent:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  // Cancel agent
  ipcMain.handle('agent:cancel', async (_, agentId: string) => {
    try {
      const cancelled = await agentMonitorService.cancelAgent(agentId);
      return { success: cancelled };
    } catch (error) {
      console.error('[AgentMonitor IPC] Error cancelling agent:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  console.log('[AgentMonitor] IPC handlers registered');
}

export default agentMonitorService;
