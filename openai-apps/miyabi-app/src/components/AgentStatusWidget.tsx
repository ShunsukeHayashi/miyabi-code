import React from 'react';
import { createRoot } from 'react-dom/client';
import { Play, Pause, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';

interface AgentInfo {
  name: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  task?: string;
  started_at?: string;
  duration_ms?: number;
  progress?: number;
}

interface AgentStatusData {
  agents: AgentInfo[];
  total_agents: number;
}

const AgentStatusWidget: React.FC<{ data: AgentStatusData }> = ({ data }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'idle':
        return <Pause className="w-5 h-5 text-gray-400" />;
      case 'running':
        return <Play className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Pause className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle':
        return 'bg-gray-100';
      case 'running':
        return 'bg-blue-50 border-blue-200';
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-100';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const activeAgents = data.agents.filter(a => a.status === 'running');
  const completedAgents = data.agents.filter(a => a.status === 'completed');
  const failedAgents = data.agents.filter(a => a.status === 'failed');

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Zap className="w-8 h-8 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-800">Agent Status</h2>
        </div>
        <div className="text-sm text-gray-500">
          {data.total_agents} total agents
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{activeAgents.length}</p>
          <p className="text-xs text-gray-600">Running</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{completedAgents.length}</p>
          <p className="text-xs text-gray-600">Completed</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{failedAgents.length}</p>
          <p className="text-xs text-gray-600">Failed</p>
        </div>
      </div>

      <div className="space-y-3">
        {data.agents.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No active agents</p>
        ) : (
          data.agents.map((agent, idx) => (
            <div
              key={idx}
              className={`border rounded-lg p-4 ${getStatusColor(agent.status)}`}
            >
              <div className="flex items-start gap-3">
                {getStatusIcon(agent.status)}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{agent.name}</h3>
                  {agent.task && (
                    <p className="text-sm text-gray-600 mt-1">{agent.task}</p>
                  )}

                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    {agent.started_at && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(agent.started_at).toLocaleTimeString()}</span>
                      </div>
                    )}
                    {agent.duration_ms !== undefined && (
                      <span>Duration: {formatDuration(agent.duration_ms)}</span>
                    )}
                  </div>

                  {agent.progress !== undefined && agent.status === 'running' && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{agent.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${agent.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Auto-mount when loaded by MCP
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('root');
    if (container) {
      const dataElement = document.getElementById('widget-data');
      const data = dataElement ? JSON.parse(dataElement.textContent || '{}') : { agents: [], total_agents: 0 };
      const root = createRoot(container);
      root.render(<AgentStatusWidget data={data} />);
    }
  });
}

export default AgentStatusWidget;
