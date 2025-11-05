import { useEffect, useState } from 'react';
import type { AgentMetadata, LogEntry } from '../types/electron';

export default function AgentsView() {
  const [agents, setAgents] = useState<AgentMetadata[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Start monitoring when component mounts
    const startMonitoring = async () => {
      try {
        const result = await window.electron.agent.startMonitoring();
        if (result.success) {
          setIsMonitoring(true);
          setError(null);
          // Load initial agents
          loadAgents();
        } else {
          setError(result.error || 'Failed to start monitoring');
        }
      } catch (err) {
        setError('Failed to start monitoring: ' + (err as Error).message);
      }
    };

    startMonitoring();

    // Setup event listeners
    const handleAgentUpdate = (agent: AgentMetadata) => {
      setAgents((prev) => {
        const index = prev.findIndex((a) => a.id === agent.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = agent;
          return updated;
        } else {
          return [...prev, agent];
        }
      });
    };

    const handleLogEntry = (entry: LogEntry) => {
      if (!selectedAgent || entry.agentId === selectedAgent) {
        setLogs((prev) => [...prev, entry]);
      }
    };

    window.electron.on('agent:updated', handleAgentUpdate);
    window.electron.on('agent:log', handleLogEntry);

    // Cleanup
    return () => {
      window.electron.removeListener('agent:updated', handleAgentUpdate);
      window.electron.removeListener('agent:log', handleLogEntry);
      window.electron.agent.stopMonitoring();
    };
  }, [selectedAgent]);

  const loadAgents = async () => {
    try {
      const result = await window.electron.agent.getAll();
      if (result.success && result.agents) {
        setAgents(result.agents);
        setError(null);
      } else {
        setError(result.error || 'Failed to load agents');
      }
    } catch (err) {
      setError('Failed to load agents: ' + (err as Error).message);
    }
  };

  const handlePause = async (agentId: string) => {
    try {
      const result = await window.electron.agent.pause(agentId);
      if (!result.success) {
        setError(result.error || 'Failed to pause agent');
      }
    } catch (err) {
      setError('Failed to pause agent: ' + (err as Error).message);
    }
  };

  const handleCancel = async (agentId: string) => {
    try {
      const result = await window.electron.agent.cancel(agentId);
      if (!result.success) {
        setError(result.error || 'Failed to cancel agent');
      }
    } catch (err) {
      setError('Failed to cancel agent: ' + (err as Error).message);
    }
  };

  const handleSelectAgent = (agentId: string) => {
    setSelectedAgent(agentId);
    setLogs([]); // Clear logs when switching agents
  };

  const getStatusColor = (status: AgentMetadata['status']) => {
    switch (status) {
      case 'running':
        return 'text-green-500';
      case 'pending':
        return 'text-yellow-500';
      case 'paused':
        return 'text-orange-500';
      case 'completed':
        return 'text-blue-500';
      case 'failed':
        return 'text-red-500';
      case 'cancelled':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };

  const getLogLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'text-red-500';
      case 'warn':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      case 'debug':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDuration = (startedAt: number, completedAt?: number) => {
    const end = completedAt || Date.now();
    const duration = end - startedAt;
    const seconds = Math.floor(duration / 1000);
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

  const selectedAgentData = agents.find((a) => a.id === selectedAgent);

  return (
    <div className="h-full flex flex-col">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-md p-3 mb-4">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Monitoring Status */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-500'}`} />
          <span className="text-sm text-foreground-muted">
            {isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
          </span>
        </div>
        <button
          type="button"
          onClick={loadAgents}
          className="px-3 py-1 text-sm bg-background-lighter rounded-md hover:bg-background-light transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Agent List */}
      <div className="flex-1 flex gap-4">
        {/* Sidebar - Agent List */}
        <div className="w-80 bg-background-light rounded-lg border border-background-lighter overflow-hidden flex flex-col">
          <div className="p-4 border-b border-background-lighter">
            <h2 className="text-lg font-extralight">Agents ({agents.length})</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {agents.length === 0 ? (
              <div className="p-4 text-center text-foreground-muted">
                <p>No agents found</p>
                <p className="text-xs mt-2">Agents will appear here when they start executing</p>
              </div>
            ) : (
              <div className="divide-y divide-background-lighter">
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => handleSelectAgent(agent.id)}
                    className={`w-full p-4 text-left hover:bg-background transition-colors ${
                      selectedAgent === agent.id ? 'bg-background' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{agent.type}</span>
                          <span className={`text-xs ${getStatusColor(agent.status)}`}>
                            {agent.status}
                          </span>
                        </div>
                        {agent.issueNumber && (
                          <p className="text-xs text-foreground-muted mt-1">
                            Issue #{agent.issueNumber}
                          </p>
                        )}
                        <p className="text-xs text-foreground-muted mt-1">
                          {formatTimestamp(agent.startedAt)}
                        </p>
                      </div>
                      {agent.progress > 0 && (
                        <div className="ml-2 text-xs text-foreground-muted">
                          {agent.progress}%
                        </div>
                      )}
                    </div>
                    {agent.status === 'running' && (
                      <div className="mt-2 bg-background-lighter rounded-full h-1 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full transition-all"
                          style={{ width: `${agent.progress}%` }}
                        />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Agent Details & Logs */}
        <div className="flex-1 bg-background-light rounded-lg border border-background-lighter overflow-hidden flex flex-col">
          {selectedAgentData ? (
            <>
              {/* Agent Details Header */}
              <div className="p-4 border-b border-background-lighter">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-extralight">{selectedAgentData.type}</h2>
                    <div className="flex items-center gap-3 mt-2 text-sm text-foreground-muted">
                      <span className={getStatusColor(selectedAgentData.status)}>
                        Status: {selectedAgentData.status}
                      </span>
                      {selectedAgentData.issueNumber && (
                        <span>Issue #{selectedAgentData.issueNumber}</span>
                      )}
                      <span>
                        Duration: {formatDuration(selectedAgentData.startedAt, selectedAgentData.completedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {selectedAgentData.status === 'running' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handlePause(selectedAgentData.id)}
                          className="px-3 py-1 text-sm bg-yellow-500/20 text-yellow-500 rounded-md hover:bg-yellow-500/30 transition-colors"
                        >
                          Pause
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancel(selectedAgentData.id)}
                          className="px-3 py-1 text-sm bg-red-500/20 text-red-500 rounded-md hover:bg-red-500/30 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {selectedAgentData.error && (
                  <div className="mt-3 p-2 bg-red-500/10 border border-red-500 rounded text-sm text-red-500">
                    {selectedAgentData.error}
                  </div>
                )}
              </div>

              {/* Logs */}
              <div className="flex-1 overflow-y-auto p-4 font-mono text-xs bg-background">
                {logs.length === 0 ? (
                  <div className="text-center text-foreground-muted py-8">
                    <p>No logs yet</p>
                    <p className="mt-2 text-xs">Logs will stream here in real-time</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {logs.map((log, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="text-foreground-muted">{formatTimestamp(log.timestamp)}</span>
                        <span className={getLogLevelColor(log.level)}>[{log.level.toUpperCase()}]</span>
                        <span className="text-foreground">{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-foreground-muted">
              <div className="text-center">
                <p>Select an agent to view details</p>
                <p className="text-xs mt-2">Click on an agent in the sidebar to see logs and controls</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
