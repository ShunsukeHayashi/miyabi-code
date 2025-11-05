import { useState, useEffect } from 'react';
import type {
  TaskExecution,
  TaskStatistics,
  SystemHealth,
  HistoryFilter,
  TaskType,
  TaskStatus,
} from '../types/electron';

export default function HistoryView() {
  const [history, setHistory] = useState<TaskExecution[]>([]);
  const [statistics, setStatistics] = useState<TaskStatistics | null>(null);
  const [currentHealth, setCurrentHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskExecution | null>(null);

  // Filter state
  const [filter, setFilter] = useState<HistoryFilter>({
    limit: 50,
    offset: 0,
  });
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all');
  const [daysFilter, setDaysFilter] = useState<number>(30);

  // Load data
  useEffect(() => {
    loadData();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadData();
    }, 30000);

    return () => clearInterval(interval);
  }, [filter, daysFilter]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build filter
      const historyFilter: HistoryFilter = {
        ...filter,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { taskType: typeFilter }),
      };

      // Fetch history
      const historyResult = await window.electron.history.getHistory(historyFilter);
      if (historyResult.success && historyResult.history) {
        setHistory(historyResult.history);
      } else {
        throw new Error(historyResult.error || 'Failed to fetch history');
      }

      // Fetch statistics
      const statsResult = await window.electron.history.getStatistics(daysFilter);
      if (statsResult.success && statsResult.stats) {
        setStatistics(statsResult.stats);
      }

      // Fetch current health
      const healthResult = await window.electron.history.getCurrentHealth();
      if (healthResult.success && healthResult.health) {
        setCurrentHealth(healthResult.health);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms?: number): string => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatBytes = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusBadgeClass = (status: TaskStatus): string => {
    const baseClass = 'px-2 py-1 rounded text-xs font-medium';
    switch (status) {
      case 'completed':
        return `${baseClass} bg-green-500/20 text-green-400`;
      case 'running':
        return `${baseClass} bg-blue-500/20 text-blue-400`;
      case 'failed':
        return `${baseClass} bg-red-500/20 text-red-400`;
      case 'cancelled':
        return `${baseClass} bg-yellow-500/20 text-yellow-400`;
      case 'pending':
        return `${baseClass} bg-gray-500/20 text-gray-400`;
      default:
        return `${baseClass} bg-gray-500/20 text-gray-400`;
    }
  };

  const getTypeIcon = (type: TaskType): string => {
    switch (type) {
      case 'agent':
        return '🤖';
      case 'cli':
        return '⚙️';
      case 'worktree':
        return '🌲';
      case 'sync':
        return '🔄';
      default:
        return '📝';
    }
  };

  if (loading && history.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-foreground-muted">Loading history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 rounded-lg border border-red-500/50">
        <div className="text-red-400 font-medium mb-2">Error</div>
        <div className="text-red-300 text-sm">{error}</div>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Task Statistics */}
          <div className="p-4 bg-background-light rounded-lg border border-background-lighter">
            <div className="text-sm text-foreground-muted mb-2">Task Statistics (Last {daysFilter} days)</div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-foreground-muted">Total:</span>
                <span className="text-foreground font-medium">{statistics.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-400">Completed:</span>
                <span className="text-green-400 font-medium">{statistics.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-400">Failed:</span>
                <span className="text-red-400 font-medium">{statistics.failed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-muted">Success Rate:</span>
                <span className="text-foreground font-medium">{statistics.successRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-muted">Avg Duration:</span>
                <span className="text-foreground font-medium">{formatDuration(statistics.avgDuration)}</span>
              </div>
            </div>
          </div>

          {/* CPU & Memory */}
          {currentHealth && (
            <>
              <div className="p-4 bg-background-light rounded-lg border border-background-lighter">
                <div className="text-sm text-foreground-muted mb-2">CPU & Memory</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">CPU Usage:</span>
                    <span className="text-foreground font-medium">{currentHealth.cpu.usage.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Load Avg (1m):</span>
                    <span className="text-foreground font-medium">{currentHealth.cpu.loadAverage[0].toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Memory Used:</span>
                    <span className="text-foreground font-medium">{formatBytes(currentHealth.memory.used)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Memory Total:</span>
                    <span className="text-foreground font-medium">{formatBytes(currentHealth.memory.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Memory %:</span>
                    <span className="text-foreground font-medium">{currentHealth.memory.usagePercent.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Disk */}
              <div className="p-4 bg-background-light rounded-lg border border-background-lighter">
                <div className="text-sm text-foreground-muted mb-2">Disk Usage</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Used:</span>
                    <span className="text-foreground font-medium">{formatBytes(currentHealth.disk.used)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Free:</span>
                    <span className="text-foreground font-medium">{formatBytes(currentHealth.disk.free)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Total:</span>
                    <span className="text-foreground font-medium">{formatBytes(currentHealth.disk.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Usage %:</span>
                    <span className="text-foreground font-medium">{currentHealth.disk.usagePercent.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div>
          <label className="text-xs text-foreground-muted mr-2">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
            className="px-3 py-1 bg-background-light border border-background-lighter rounded text-sm"
          >
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="running">Running</option>
            <option value="cancelled">Cancelled</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-foreground-muted mr-2">Type:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TaskType | 'all')}
            className="px-3 py-1 bg-background-light border border-background-lighter rounded text-sm"
          >
            <option value="all">All</option>
            <option value="agent">Agent</option>
            <option value="cli">CLI</option>
            <option value="worktree">Worktree</option>
            <option value="sync">Sync</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-foreground-muted mr-2">Period:</label>
          <select
            value={daysFilter}
            onChange={(e) => setDaysFilter(Number(e.target.value))}
            className="px-3 py-1 bg-background-light border border-background-lighter rounded text-sm"
          >
            <option value={1}>Last 24 hours</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        <button
          onClick={loadData}
          className="ml-auto px-4 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-sm transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Task History Table */}
      <div className="bg-background-light rounded-lg border border-background-lighter overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-lighter">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted">Task Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted">Issue</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted">Started</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-background-lighter">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-foreground-muted">
                    No tasks found with current filters
                  </td>
                </tr>
              ) : (
                history.map((task) => (
                  <tr key={task.id} className="hover:bg-background transition-colors">
                    <td className="px-4 py-3 text-sm">
                      <span className="text-2xl">{getTypeIcon(task.taskType)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      <div className="font-medium">{task.taskName}</div>
                      {task.agentType && (
                        <div className="text-xs text-foreground-muted mt-1">{task.agentType}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground-muted">
                      {task.issueNumber ? `#${task.issueNumber}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={getStatusBadgeClass(task.status)}>{task.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground-muted">{formatDuration(task.duration)}</td>
                    <td className="px-4 py-3 text-sm text-foreground-muted">{formatTimestamp(task.startedAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="px-2 py-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="bg-background-light border border-background-lighter rounded-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-extralight mb-2">{selectedTask.taskName}</h2>
                <span className={getStatusBadgeClass(selectedTask.status)}>{selectedTask.status}</span>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-foreground-muted hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-foreground-muted mb-1">Type</div>
                  <div className="text-foreground">{getTypeIcon(selectedTask.taskType)} {selectedTask.taskType}</div>
                </div>
                <div>
                  <div className="text-xs text-foreground-muted mb-1">Issue Number</div>
                  <div className="text-foreground">{selectedTask.issueNumber || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-foreground-muted mb-1">Agent Type</div>
                  <div className="text-foreground">{selectedTask.agentType || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-foreground-muted mb-1">Duration</div>
                  <div className="text-foreground">{formatDuration(selectedTask.duration)}</div>
                </div>
                <div>
                  <div className="text-xs text-foreground-muted mb-1">Exit Code</div>
                  <div className="text-foreground">{selectedTask.exitCode ?? 'N/A'}</div>
                </div>
                <div>
                  <div className="text-xs text-foreground-muted mb-1">Started At</div>
                  <div className="text-foreground">{formatTimestamp(selectedTask.startedAt)}</div>
                </div>
              </div>

              {selectedTask.error && (
                <div className="p-4 bg-red-500/10 rounded border border-red-500/50">
                  <div className="text-xs text-red-400 font-medium mb-2">Error</div>
                  <div className="text-red-300 text-sm font-mono">{selectedTask.error}</div>
                </div>
              )}

              {selectedTask.stdout && (
                <div className="p-4 bg-background rounded border border-background-lighter">
                  <div className="text-xs text-foreground-muted font-medium mb-2">Stdout</div>
                  <pre className="text-xs text-foreground font-mono overflow-auto max-h-64">{selectedTask.stdout}</pre>
                </div>
              )}

              {selectedTask.stderr && (
                <div className="p-4 bg-background rounded border border-background-lighter">
                  <div className="text-xs text-foreground-muted font-medium mb-2">Stderr</div>
                  <pre className="text-xs text-red-300 font-mono overflow-auto max-h-64">{selectedTask.stderr}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
