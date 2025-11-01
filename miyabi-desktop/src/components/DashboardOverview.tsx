/**
 * Dashboard Overview Panel
 *
 * Displays a comprehensive overview of the Miyabi system state:
 * - Worktree statistics
 * - Agent execution status
 * - Issue/Task metrics
 * - Recent activity timeline
 * - System resource usage
 */

import React from 'react';
import {
  GitBranch,
  Cpu,
  ListTodo,
  Activity,
  HardDrive,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import type {
  WorktreeInfo,
  AgentStats,
  IssueStats,
  HistoryInfo,
  SystemInfo,
} from '../types/dashboard';

/**
 * Dashboard Card Component
 */
interface DashboardCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}

function DashboardCard({ title, icon, children, onClick }: DashboardCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-6 transition-all duration-default ${
        onClick ? 'cursor-pointer hover:shadow-lg hover:border-gray-300' : ''
      }`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="text-gray-600">{icon}</div>
        <h3 className="text-lg font-light text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

/**
 * Worktree Card
 */
function WorktreeCard({ data }: { data: WorktreeInfo }) {
  return (
    <DashboardCard title="Worktrees" icon={<GitBranch size={20} strokeWidth={1.5} />}>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-light text-gray-600">Total</span>
          <span className="text-2xl font-light text-gray-900">{data.total}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-light text-gray-600">Active</span>
          <span className="text-lg font-light text-green-600">{data.active}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-light text-gray-600">Stale</span>
          <span className="text-lg font-light text-orange-600">{data.stale}</span>
        </div>
        {data.names.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-light text-gray-500 mb-2">Recent Worktrees</p>
            <div className="space-y-1">
              {data.names.slice(0, 3).map((name, idx) => (
                <div
                  key={idx}
                  className="text-xs font-mono text-gray-700 bg-gray-50 rounded px-2 py-1 truncate"
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}

/**
 * Agent Stats Card
 */
function AgentStatsCard({ data }: { data: AgentStats }) {
  return (
    <DashboardCard title="Agents" icon={<Cpu size={20} strokeWidth={1.5} />}>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-light text-gray-600">Total</span>
          <span className="text-2xl font-light text-gray-900">{data.total}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-light text-gray-600">Running</span>
          <span className="text-lg font-light text-blue-600">{data.running}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-light text-gray-600">Completed</span>
          <span className="text-lg font-light text-green-600">{data.completed}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-light text-gray-600">Failed</span>
          <span className="text-lg font-light text-red-600">{data.failed}</span>
        </div>
        {data.recent.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-light text-gray-500 mb-2">Recent Executions</p>
            <div className="space-y-2">
              {data.recent.slice(0, 2).map((exec, idx) => (
                <div key={idx} className="text-xs space-y-1">
                  <div className="font-mono text-gray-700">{exec.name}</div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        exec.status === 'running'
                          ? 'bg-blue-500 animate-pulse'
                          : exec.status === 'completed'
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }`}
                    />
                    <span className="text-gray-500">{exec.status}</span>
                    {exec.issueNumber && (
                      <span className="text-gray-400">#{exec.issueNumber}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}

/**
 * Issue Stats Card
 */
function IssueStatsCard({ data }: { data: IssueStats }) {
  return (
    <DashboardCard title="Issues" icon={<ListTodo size={20} strokeWidth={1.5} />}>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-light text-gray-600">Open</span>
          <span className="text-2xl font-light text-gray-900">{data.open}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-light text-gray-600">In Progress</span>
          <span className="text-lg font-light text-blue-600">{data.inProgress}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-light text-gray-600">Completed Today</span>
          <span className="text-lg font-light text-green-600">{data.completedToday}</span>
        </div>
      </div>
    </DashboardCard>
  );
}

/**
 * History Card
 */
function HistoryCard({ data }: { data: HistoryInfo }) {
  return (
    <DashboardCard title="History" icon={<Activity size={20} strokeWidth={1.5} />}>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-light text-gray-600">Commits Today</span>
          <span className="text-2xl font-light text-gray-900">{data.commitsToday}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-light text-gray-600">PRs Today</span>
          <span className="text-lg font-light text-blue-600">{data.prsToday}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-light text-gray-600">Issues Closed</span>
          <span className="text-lg font-light text-green-600">{data.issuesClosedToday}</span>
        </div>
        {data.recentActivities.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-light text-gray-500 mb-2">Recent Activity</p>
            <div className="space-y-2">
              {data.recentActivities.slice(0, 3).map((activity, idx) => (
                <div key={idx} className="text-xs">
                  <div className="font-light text-gray-700 truncate">
                    {activity.description}
                  </div>
                  <div className="text-gray-400">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}

/**
 * System Info Card
 */
function SystemCard({ data }: { data: SystemInfo }) {
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <DashboardCard title="System" icon={<HardDrive size={20} strokeWidth={1.5} />}>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-light text-gray-600">CPU Usage</span>
          <span className="text-lg font-light text-gray-900">{data.cpuUsage.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-light text-gray-600">Memory</span>
          <span className="text-lg font-light text-gray-900">
            {(data.memoryUsageMB / 1024).toFixed(1)} GB / {(data.totalMemoryMB / 1024).toFixed(0)}{' '}
            GB
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-light text-gray-600">Disk Usage</span>
          <span className="text-lg font-light text-gray-900">{data.diskUsage.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-light text-gray-600">Uptime</span>
          <span className="text-lg font-light text-gray-900">
            {formatUptime(data.uptimeSeconds)}
          </span>
        </div>
      </div>
    </DashboardCard>
  );
}

/**
 * Main Dashboard Overview Component
 */
export function DashboardOverview() {
  const { snapshot, loading, error, refresh } = useDashboard();

  if (loading && !snapshot) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <RefreshCw size={32} className="animate-spin text-gray-400 mx-auto" strokeWidth={1.5} />
          <p className="text-sm font-light text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !snapshot) {
    return (
      <div className="h-full flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <AlertCircle size={32} className="text-red-500 mx-auto" strokeWidth={1.5} />
          <p className="text-sm font-light text-gray-900">Failed to load dashboard</p>
          <p className="text-xs font-light text-gray-500">{error.message}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 text-sm font-light text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors duration-default"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return null;
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-gray-900 mb-2">Dashboard</h1>
          <p className="text-sm font-light text-gray-500 flex items-center gap-2">
            <Clock size={14} strokeWidth={1.5} />
            Last updated: {new Date(snapshot.timestamp).toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={refresh}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-default"
          aria-label="Refresh dashboard"
          disabled={loading}
        >
          <RefreshCw
            size={20}
            className={`${loading ? 'animate-spin' : ''} text-gray-600`}
            strokeWidth={1.5}
          />
        </button>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <WorktreeCard data={snapshot.worktrees} />
        <AgentStatsCard data={snapshot.agents} />
        <IssueStatsCard data={snapshot.issues} />
        <HistoryCard data={snapshot.history} />
        <SystemCard data={snapshot.system} />
      </div>
    </div>
  );
}
