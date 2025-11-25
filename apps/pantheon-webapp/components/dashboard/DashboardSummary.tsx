/**
 * Dashboard Summary Component
 * Issue: #979 - Phase 3.2: Dashboard UI Modernization
 *
 * Displays key metrics from the dashboard summary API
 * with gradient cards and auto-refresh functionality.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { dashboardService, DashboardSummary as DashboardSummaryType } from '../../lib/services';
import { LoadingSpinner, SkeletonCard } from '../ui/LoadingState';
import { ErrorState } from '../ui/ErrorState';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  gradient: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatCard({ title, value, icon, gradient, trend }: StatCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-xl p-6 ${gradient} text-white shadow-lg transition-transform hover:scale-[1.02]`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          {trend && (
            <p className={`mt-1 text-sm ${trend.isPositive ? 'text-green-200' : 'text-red-200'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              <span className="ml-1 text-white/60">vs last hour</span>
            </p>
          )}
        </div>
        <div className="rounded-lg bg-white/20 p-3">
          {icon}
        </div>
      </div>
      <div className="absolute -bottom-2 -right-2 h-24 w-24 rounded-full bg-white/10" />
    </div>
  );
}

interface DashboardSummaryProps {
  refreshInterval?: number; // in milliseconds
}

export function DashboardSummary({ refreshInterval = 30000 }: DashboardSummaryProps) {
  const [summary, setSummary] = useState<DashboardSummaryType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setError(null);
      const data = await dashboardService.getSummary();
      setSummary(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard summary');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();

    // Auto-refresh
    const interval = setInterval(fetchSummary, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchSummary, refreshInterval]);

  if (isLoading && !summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error && !summary) {
    return (
      <ErrorState
        title="Failed to load dashboard"
        message={error}
        onRetry={fetchSummary}
      />
    );
  }

  if (!summary) return null;

  const stats = [
    {
      title: 'Total Executions',
      value: summary.totalExecutions.toLocaleString(),
      gradient: 'bg-gradient-to-br from-blue-500 to-blue-600',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      title: 'Running',
      value: summary.runningExecutions,
      gradient: 'bg-gradient-to-br from-green-500 to-emerald-600',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Completed',
      value: summary.completedExecutions.toLocaleString(),
      gradient: 'bg-gradient-to-br from-purple-500 to-purple-600',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Failed',
      value: summary.failedExecutions,
      gradient: 'bg-gradient-to-br from-red-500 to-red-600',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Repositories',
      value: summary.activeRepositories,
      gradient: 'bg-gradient-to-br from-amber-500 to-orange-600',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
    },
    {
      title: 'Active PRs',
      value: summary.pendingPRs,
      gradient: 'bg-gradient-to-br from-cyan-500 to-teal-600',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Dashboard Overview
        </h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          {isLoading && <LoadingSpinner className="h-4 w-4" />}
          {lastUpdated && (
            <span>
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>
      {error && (
        <div className="flex items-center justify-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <span className="text-sm text-red-600 dark:text-red-400">
            Failed to refresh: {error}
          </span>
          <button
            onClick={fetchSummary}
            className="ml-2 text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

export default DashboardSummary;
