/**
 * Agent Status Grid Component
 * Issue: #979 - Phase 3.2: Dashboard UI Modernization
 *
 * Displays agent status in a grid format with metrics
 */

'use client';

import type { Agent, AgentStatus } from '../../../lib/services';

interface AgentStatusGridProps {
  agents: Agent[];
  isLoading: boolean;
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function getStatusIndicator(status: AgentStatus): { color: string; label: string } {
  switch (status) {
    case 'online':
      return { color: 'bg-green-500', label: 'Online' };
    case 'busy':
      return { color: 'bg-yellow-500', label: 'Busy' };
    case 'offline':
      return { color: 'bg-gray-400', label: 'Offline' };
    case 'error':
      return { color: 'bg-red-500', label: 'Error' };
    default:
      return { color: 'bg-gray-400', label: 'Unknown' };
  }
}

function getAgentIcon(type: Agent['type']): string {
  const icons: Record<string, string> = {
    coordinator: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    code_gen: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    review: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    pr: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
    issue: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    deployment: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
    refresher: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    business: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  };
  return icons[type] || icons.coordinator;
}

function AgentCard({ agent }: { agent: Agent }) {
  const status = getStatusIndicator(agent.status);
  const iconPath = getAgentIcon(agent.type);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{agent.name}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{agent.type.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`w-2.5 h-2.5 rounded-full ${status.color}`} />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{status.label}</span>
        </div>
      </div>

      {agent.currentTask && (
        <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-xs text-yellow-700 dark:text-yellow-400 truncate">
            Current: {agent.currentTask}
          </p>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Executions</span>
          <span className="font-medium text-gray-900 dark:text-white">{agent.executionCount}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Success Rate</span>
          <span className="font-medium text-green-600 dark:text-green-400">{agent.successRate.toFixed(1)}%</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Avg Time</span>
          <span className="font-medium text-gray-900 dark:text-white">{agent.avgExecutionTime}s</span>
        </div>
      </div>

      {agent.capabilities && agent.capabilities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex flex-wrap gap-1">
            {agent.capabilities.slice(0, 3).map((cap) => (
              <span
                key={cap}
                className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full"
              >
                {cap}
              </span>
            ))}
            {agent.capabilities.length > 3 && (
              <span className="px-2 py-0.5 text-xs text-gray-400 dark:text-gray-500">
                +{agent.capabilities.length - 3}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgentStatusGrid({ agents, isLoading }: AgentStatusGridProps) {
  const onlineCount = agents.filter((a) => a.status === 'online').length;
  const busyCount = agents.filter((a) => a.status === 'busy').length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Agent Status</h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {onlineCount} Online
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {busyCount} Busy
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6">
        {isLoading ? (
          <LoadingSkeleton />
        ) : agents.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-4 text-gray-500 dark:text-gray-400">No agents available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
