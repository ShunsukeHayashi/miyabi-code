/**
 * Summary Cards Component
 * Issue: #979 - Phase 3.2: Dashboard UI Modernization
 *
 * Displays key metrics in card format
 */

'use client';

import type { DashboardSummary } from '../../../lib/services';

interface SummaryCardsProps {
  summary: DashboardSummary | null;
  isLoading: boolean;
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2" />
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  isLoading: boolean;
  colorClass: string;
}

function MetricCard({ title, value, subtitle, icon, trend, isLoading, colorClass }: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
              {subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
              )}
              {trend && (
                <div className={`flex items-center mt-2 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
                  <span className="text-gray-400 ml-1">vs last week</span>
                </div>
              )}
            </>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function SummaryCards({ summary, isLoading }: SummaryCardsProps) {
  const metrics = [
    {
      title: 'Total Executions',
      value: summary?.totalExecutions ?? 0,
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      colorClass: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: 'Running',
      value: summary?.runningExecutions ?? 0,
      subtitle: 'Active executions',
      icon: (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      colorClass: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      title: 'Completed',
      value: summary?.completedExecutions ?? 0,
      subtitle: `${summary?.failedExecutions ?? 0} failed`,
      icon: (
        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      colorClass: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      title: 'Repositories',
      value: summary?.activeRepositories ?? 0,
      icon: (
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
      colorClass: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      title: 'Pull Requests',
      value: summary?.pendingPRs ?? 0,
      subtitle: 'Created by agents',
      icon: (
        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      colorClass: 'bg-amber-100 dark:bg-amber-900/30',
    },
    {
      title: 'Avg Response Time',
      value: `${summary?.avgExecutionTime ?? 0}s`,
      icon: (
        <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      colorClass: 'bg-cyan-100 dark:bg-cyan-900/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {metrics.map((metric) => (
        <MetricCard
          key={metric.title}
          title={metric.title}
          value={metric.value}
          subtitle={metric.subtitle}
          icon={metric.icon}
          isLoading={isLoading}
          colorClass={metric.colorClass}
        />
      ))}
    </div>
  );
}
