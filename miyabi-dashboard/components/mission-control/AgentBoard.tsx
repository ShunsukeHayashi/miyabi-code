'use client';

import React from 'react';
import { Agent } from '@/lib/mockData';

interface AgentBoardProps {
  agents: Agent[];
}

const AgentBoard: React.FC<AgentBoardProps> = ({ agents }) => {
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

  const getTypeColor = (type: Agent['type']) => {
    return type === 'coding' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Agent Board</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800">{agent.name}</h3>
              <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`} />
            </div>
            <div className="mb-2">
              <span className={`text-xs px-2 py-1 rounded ${getTypeColor(agent.type)}`}>
                {agent.type}
              </span>
            </div>
            {agent.currentTask && (
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Current:</span> {agent.currentTask}
              </p>
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
