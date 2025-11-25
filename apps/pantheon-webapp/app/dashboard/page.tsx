/**
 * Operations Dashboard Page
 * Issue: #979 - Phase 3.2: Dashboard UI Modernization
 *
 * Real-time dashboard for Miyabi Agent operations.
 * Connects to Web API backend for live data with:
 * - Dashboard Summary with auto-refresh
 * - Recent Activity feed with filtering
 * - Agent Status monitoring
 * - Task management
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDashboardSummary, useRecentActivities, useAgents, useTasks } from '../../lib/hooks';
import { SummaryCards, RecentActivityFeed, AgentStatusGrid, TaskList } from './components';

// Refresh interval selector
function RefreshSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const options = [
    { value: 10000, label: '10s' },
    { value: 30000, label: '30s' },
    { value: 60000, label: '1m' },
    { value: 300000, label: '5m' },
  ];

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500 dark:text-gray-400">Refresh:</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="px-2 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Connection status indicator
function ConnectionStatus({ isConnected, lastUpdated }: { isConnected: boolean; lastUpdated: Date | null }) {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <span className="relative flex h-3 w-3">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isConnected ? 'bg-green-400' : 'bg-red-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-3 w-3 ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
        </span>
        <span className={`text-sm ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      {lastUpdated && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

function QuickActionCard({ title, description, icon, href }: QuickActionCardProps) {
  return (
    <a
      href={href}
      className="group p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {description}
          </p>
        </div>
      </div>
    </a>
  );
}

export default function DashboardPage() {
  const [refreshInterval, setRefreshInterval] = useState(30000);

  // Fetch data using custom hooks
  const { summary, isLoading: summaryLoading, error: summaryError } = useDashboardSummary({
    refreshInterval,
    fallbackToMock: true,
  });

  const { activities, isLoading: activitiesLoading } = useRecentActivities({
    refreshInterval,
    fallbackToMock: true,
    limit: 15,
  });

  const { agents, isLoading: agentsLoading } = useAgents({
    refreshInterval,
    fallbackToMock: true,
  });

  const { tasks, total: totalTasks, isLoading: tasksLoading, refetch: refetchTasks } = useTasks({
    refreshInterval,
    fallbackToMock: true,
    limit: 10,
  });

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isConnected = !summaryError;

  useEffect(() => {
    if (!summaryLoading) {
      setLastUpdated(new Date());
    }
  }, [summaryLoading, summary]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-800 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">Operations Dashboard</h1>
              <p className="text-blue-200">
                Monitor agent executions, tasks, and system health
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-col sm:flex-row sm:items-center gap-4">
              <ConnectionStatus isConnected={isConnected} lastUpdated={lastUpdated} />
              <RefreshSelector value={refreshInterval} onChange={setRefreshInterval} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Navigation tabs */}
        <div className="flex items-center space-x-4 mb-6 overflow-x-auto">
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
          >
            Overview
          </Link>
          <Link
            href="/miyabi-integration"
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Miyabi Integration
          </Link>
          <Link
            href="/advisors"
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Advisors
          </Link>
          <Link
            href="/divisions"
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Divisions
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="mb-6">
          <SummaryCards summary={summary} isLoading={summaryLoading} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column - Tasks */}
          <div className="lg:col-span-2">
            <TaskList
              tasks={tasks}
              total={totalTasks}
              isLoading={tasksLoading}
              onRefresh={refetchTasks}
            />
          </div>

          {/* Right Column - Activity Feed */}
          <div>
            <RecentActivityFeed activities={activities} isLoading={activitiesLoading} />
          </div>
        </div>

        {/* Agent Status Grid */}
        <div className="mb-6">
          <AgentStatusGrid agents={agents} isLoading={agentsLoading} />
        </div>

        {/* Quick Actions */}
        <section className="mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <QuickActionCard
                title="Create Issue Task"
                description="Assign an agent to work on a GitHub issue"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                href="/dashboard/tasks/new?type=issue"
              />
              <QuickActionCard
                title="Review PR"
                description="Start an automated code review"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                }
                href="/dashboard/tasks/new?type=review"
              />
              <QuickActionCard
                title="Deploy"
                description="Trigger a deployment workflow"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                }
                href="/dashboard/tasks/new?type=deployment"
              />
              <QuickActionCard
                title="View Agents"
                description="See all agent statuses"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
                href="/agents"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
