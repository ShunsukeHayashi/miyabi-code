import { ipcMain, app } from 'electron';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * Task execution record
 */
export interface TaskExecution {
  id: string;
  taskType: 'agent' | 'cli' | 'worktree' | 'sync';
  taskName: string;
  issueNumber?: number;
  agentType?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: number;
  completedAt?: number;
  duration?: number;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * System health metrics
 */
export interface SystemHealth {
  timestamp: number;
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  processes: {
    total: number;
    miyabiProcesses: number;
  };
}

/**
 * Task statistics
 */
export interface TaskStatistics {
  total: number;
  completed: number;
  failed: number;
  cancelled: number;
  successRate: number;
  avgDuration: number;
  byType: Record<string, {
    count: number;
    successRate: number;
    avgDuration: number;
  }>;
}

/**
 * History Service
 * Manages task execution history and system health metrics
 */
class HistoryService {
  private db: Database.Database | null = null;
  private readonly dbPath: string;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'miyabi-history.db');
  }

  /**
   * Initialize history database
   */
  initialize(): void {
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(this.dbPath);

    // Create task_executions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS task_executions (
        id TEXT PRIMARY KEY,
        task_type TEXT NOT NULL,
        task_name TEXT NOT NULL,
        issue_number INTEGER,
        agent_type TEXT,
        status TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        completed_at INTEGER,
        duration INTEGER,
        exit_code INTEGER,
        stdout TEXT,
        stderr TEXT,
        error TEXT,
        metadata TEXT
      )
    `);

    // Create system_health table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS system_health (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        cpu_usage REAL NOT NULL,
        cpu_load_1 REAL NOT NULL,
        cpu_load_5 REAL NOT NULL,
        cpu_load_15 REAL NOT NULL,
        memory_total INTEGER NOT NULL,
        memory_used INTEGER NOT NULL,
        memory_free INTEGER NOT NULL,
        memory_usage_percent REAL NOT NULL,
        disk_total INTEGER NOT NULL,
        disk_used INTEGER NOT NULL,
        disk_free INTEGER NOT NULL,
        disk_usage_percent REAL NOT NULL,
        process_count INTEGER NOT NULL,
        miyabi_process_count INTEGER NOT NULL
      )
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_task_started_at ON task_executions(started_at DESC);
      CREATE INDEX IF NOT EXISTS idx_task_status ON task_executions(status);
      CREATE INDEX IF NOT EXISTS idx_task_type ON task_executions(task_type);
      CREATE INDEX IF NOT EXISTS idx_health_timestamp ON system_health(timestamp DESC);
    `);

    console.log('[History] Database initialized at:', this.dbPath);

    // Start health monitoring
    this.startHealthMonitoring();
  }

  /**
   * Record task execution
   */
  recordTask(task: TaskExecution): void {
    if (!this.db) return;

    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO task_executions (
          id, task_type, task_name, issue_number, agent_type, status,
          started_at, completed_at, duration, exit_code, stdout, stderr, error, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        task.id,
        task.taskType,
        task.taskName,
        task.issueNumber || null,
        task.agentType || null,
        task.status,
        task.startedAt,
        task.completedAt || null,
        task.duration || null,
        task.exitCode || null,
        task.stdout || null,
        task.stderr || null,
        task.error || null,
        task.metadata ? JSON.stringify(task.metadata) : null
      );

      console.log('[History] Task recorded:', task.id);
    } catch (error) {
      console.error('[History] Error recording task:', error);
    }
  }

  /**
   * Get task history with filters
   */
  getHistory(options: {
    limit?: number;
    offset?: number;
    taskType?: string;
    status?: string;
    startDate?: number;
    endDate?: number;
  } = {}): TaskExecution[] {
    if (!this.db) return [];

    try {
      let query = 'SELECT * FROM task_executions WHERE 1=1';
      const params: any[] = [];

      if (options.taskType) {
        query += ' AND task_type = ?';
        params.push(options.taskType);
      }

      if (options.status) {
        query += ' AND status = ?';
        params.push(options.status);
      }

      if (options.startDate) {
        query += ' AND started_at >= ?';
        params.push(options.startDate);
      }

      if (options.endDate) {
        query += ' AND started_at <= ?';
        params.push(options.endDate);
      }

      query += ' ORDER BY started_at DESC';

      if (options.limit) {
        query += ' LIMIT ?';
        params.push(options.limit);
      }

      if (options.offset) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }

      const stmt = this.db.prepare(query);
      const rows = stmt.all(...params) as any[];

      return rows.map((row) => ({
        id: row.id,
        taskType: row.task_type,
        taskName: row.task_name,
        issueNumber: row.issue_number || undefined,
        agentType: row.agent_type || undefined,
        status: row.status,
        startedAt: row.started_at,
        completedAt: row.completed_at || undefined,
        duration: row.duration || undefined,
        exitCode: row.exit_code || undefined,
        stdout: row.stdout || undefined,
        stderr: row.stderr || undefined,
        error: row.error || undefined,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      }));
    } catch (error) {
      console.error('[History] Error getting history:', error);
      return [];
    }
  }

  /**
   * Get task statistics
   */
  getStatistics(days: number = 30): TaskStatistics {
    if (!this.db) {
      return {
        total: 0,
        completed: 0,
        failed: 0,
        cancelled: 0,
        successRate: 0,
        avgDuration: 0,
        byType: {},
      };
    }

    try {
      const since = Date.now() - days * 24 * 60 * 60 * 1000;

      // Get overall stats
      const overallStmt = this.db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
          AVG(CASE WHEN duration IS NOT NULL THEN duration ELSE 0 END) as avg_duration
        FROM task_executions
        WHERE started_at >= ?
      `);

      const overall = overallStmt.get(since) as any;

      // Get stats by type
      const byTypeStmt = this.db.prepare(`
        SELECT
          task_type,
          COUNT(*) as count,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
          AVG(CASE WHEN duration IS NOT NULL THEN duration ELSE 0 END) as avg_duration
        FROM task_executions
        WHERE started_at >= ?
        GROUP BY task_type
      `);

      const byTypeRows = byTypeStmt.all(since) as any[];

      const byType: Record<string, any> = {};
      for (const row of byTypeRows) {
        byType[row.task_type] = {
          count: row.count,
          successRate: row.count > 0 ? (row.completed / row.count) * 100 : 0,
          avgDuration: row.avg_duration,
        };
      }

      return {
        total: overall.total,
        completed: overall.completed,
        failed: overall.failed,
        cancelled: overall.cancelled,
        successRate: overall.total > 0 ? (overall.completed / overall.total) * 100 : 0,
        avgDuration: overall.avg_duration,
        byType,
      };
    } catch (error) {
      console.error('[History] Error getting statistics:', error);
      return {
        total: 0,
        completed: 0,
        failed: 0,
        cancelled: 0,
        successRate: 0,
        avgDuration: 0,
        byType: {},
      };
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    // Record health metrics every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.recordHealthMetrics();
    }, 30000);

    // Record initial metrics
    this.recordHealthMetrics();
  }

  /**
   * Stop health monitoring
   */
  private stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Record current system health metrics
   */
  private recordHealthMetrics(): void {
    if (!this.db) return;

    try {
      const cpus = os.cpus();
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const loadAvg = os.loadavg();

      // Calculate CPU usage (approximation)
      const cpuUsage = cpus.reduce((acc, cpu) => {
        const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
        const idle = cpu.times.idle;
        return acc + ((total - idle) / total) * 100;
      }, 0) / cpus.length;

      // Get disk usage (approximation using userData path)
      const userDataPath = app.getPath('userData');
      let diskTotal = 0;
      let diskUsed = 0;
      let diskFree = 0;
      let diskUsagePercent = 0;

      try {
        if (process.platform === 'darwin' || process.platform === 'linux') {
          // This is a placeholder - actual disk usage would need native module
          diskTotal = 500 * 1024 * 1024 * 1024; // 500GB placeholder
          diskUsed = 250 * 1024 * 1024 * 1024; // 250GB placeholder
          diskFree = diskTotal - diskUsed;
          diskUsagePercent = (diskUsed / diskTotal) * 100;
        }
      } catch (error) {
        console.error('[History] Error getting disk usage:', error);
      }

      const stmt = this.db.prepare(`
        INSERT INTO system_health (
          timestamp, cpu_usage, cpu_load_1, cpu_load_5, cpu_load_15,
          memory_total, memory_used, memory_free, memory_usage_percent,
          disk_total, disk_used, disk_free, disk_usage_percent,
          process_count, miyabi_process_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        Date.now(),
        cpuUsage,
        loadAvg[0],
        loadAvg[1],
        loadAvg[2],
        totalMemory,
        usedMemory,
        freeMemory,
        (usedMemory / totalMemory) * 100,
        diskTotal,
        diskUsed,
        diskFree,
        diskUsagePercent,
        0, // process_count placeholder
        0  // miyabi_process_count placeholder
      );

      // Clean up old health records (keep last 24 hours)
      const cleanupTime = Date.now() - 24 * 60 * 60 * 1000;
      this.db.prepare('DELETE FROM system_health WHERE timestamp < ?').run(cleanupTime);
    } catch (error) {
      console.error('[History] Error recording health metrics:', error);
    }
  }

  /**
   * Get system health history
   */
  getHealthHistory(hours: number = 1): SystemHealth[] {
    if (!this.db) return [];

    try {
      const since = Date.now() - hours * 60 * 60 * 1000;
      const stmt = this.db.prepare(`
        SELECT * FROM system_health
        WHERE timestamp >= ?
        ORDER BY timestamp ASC
      `);

      const rows = stmt.all(since) as any[];

      return rows.map((row) => ({
        timestamp: row.timestamp,
        cpu: {
          usage: row.cpu_usage,
          loadAverage: [row.cpu_load_1, row.cpu_load_5, row.cpu_load_15],
        },
        memory: {
          total: row.memory_total,
          used: row.memory_used,
          free: row.memory_free,
          usagePercent: row.memory_usage_percent,
        },
        disk: {
          total: row.disk_total,
          used: row.disk_used,
          free: row.disk_free,
          usagePercent: row.disk_usage_percent,
        },
        processes: {
          total: row.process_count,
          miyabiProcesses: row.miyabi_process_count,
        },
      }));
    } catch (error) {
      console.error('[History] Error getting health history:', error);
      return [];
    }
  }

  /**
   * Get current system health
   */
  getCurrentHealth(): SystemHealth | null {
    const history = this.getHealthHistory(0.1); // Last 6 minutes
    return history.length > 0 ? history[history.length - 1] : null;
  }

  /**
   * Close database and stop monitoring
   */
  close(): void {
    this.stopHealthMonitoring();
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance
const historyService = new HistoryService();

/**
 * Register IPC handlers for history service
 */
export function registerHistoryHandlers(): void {
  // Initialize on startup
  historyService.initialize();

  // Record task
  ipcMain.handle('history:recordTask', async (_, task: TaskExecution) => {
    try {
      historyService.recordTask(task);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Get history
  ipcMain.handle('history:getHistory', async (_, options: any) => {
    try {
      const history = historyService.getHistory(options);
      return { success: true, history };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Get statistics
  ipcMain.handle('history:getStatistics', async (_, days: number) => {
    try {
      const stats = historyService.getStatistics(days);
      return { success: true, stats };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Get health history
  ipcMain.handle('history:getHealthHistory', async (_, hours: number) => {
    try {
      const health = historyService.getHealthHistory(hours);
      return { success: true, health };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Get current health
  ipcMain.handle('history:getCurrentHealth', async () => {
    try {
      const health = historyService.getCurrentHealth();
      return { success: true, health };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  console.log('[History] IPC handlers registered');
}

export default historyService;
