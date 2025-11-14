'use client';

import React from 'react';
import { Agent } from '@/lib/mockData';

interface AgentBoardProps {
  agents: Agent[];
  isConnected?: boolean;
  lastUpdate?: Date | null;
}

const AgentBoard: React.FC<AgentBoardProps> = ({ agents, isConnected, lastUpdate }) => {
  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'idle':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusPulse = (status: Agent['status']) => {
    return status === 'active' ? 'animate-pulse' : '';
  };

  const getTypeColor = (type: Agent['type']) => {
    return type === 'coding' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };

  const formatLastUpdate = (date: Date | null | undefined) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Agent Board</h2>
        <div className="flex items-center space-x-4">
          {isConnected !== undefined && (
            <div className="flex items-center text-xs">
              <div
                className={`w-2 h-2 rounded-full mr-2 ${
                  isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}
              />
              <span className={isConnected ? 'text-green-700' : 'text-red-700'}>
                {isConnected ? 'Live' : 'Disconnected'}
              </span>
            </div>
          )}
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Updated {formatLastUpdate(lastUpdate)}
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800">{agent.name}</h3>
              <div
                className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)} ${getStatusPulse(
                  agent.status
                )}`}
              />
            </div>
            <div className="mb-2">
              <span className={`text-xs px-2 py-1 rounded ${getTypeColor(agent.type)}`}>
                {agent.type}
              </span>
            </div>
            {agent.currentTask && (
              <div className="mb-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Current:</span> {agent.currentTask}
                </p>
                {agent.status === 'active' && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-blue-600 h-1.5 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-gray-500">
              Tasks completed: <span className="font-medium">{agent.tasksCompleted}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentBoard;
