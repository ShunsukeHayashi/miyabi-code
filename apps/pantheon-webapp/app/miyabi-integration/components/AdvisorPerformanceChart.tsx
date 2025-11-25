/**
 * Advisor Performance Chart Component
 * Issue: #1017 - Pantheon Webapp Miyabi Integration Dashboard
 */

'use client';

import Link from 'next/link';
import type { AdvisorMetrics } from '../../../types/miyabi';

interface Props {
  metrics: AdvisorMetrics[];
  isLoading: boolean;
}

export default function AdvisorPerformanceChart({ metrics, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Advisor Performance
        </h2>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const sortedMetrics = [...metrics].sort((a, b) => b.consultationCount - a.consultationCount);
  const maxConsultations = sortedMetrics[0]?.consultationCount || 1;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Advisor Performance
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Top {sortedMetrics.length} advisors
        </span>
      </div>

      <div className="space-y-4">
        {sortedMetrics.map((advisor, index) => (
          <div key={advisor.advisorId} className="group">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg font-bold text-gray-400 w-6">
                #{index + 1}
              </span>
              <span className="text-lg">{advisor.divisionIcon}</span>
              <Link
                href={`/advisors/${advisor.advisorId}`}
                className="font-medium text-gray-900 dark:text-white group-hover:text-amber-600 transition-colors"
              >
                {advisor.advisorName}
              </Link>
              <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                {advisor.division}
              </span>
            </div>

            <div className="flex items-center gap-3 ml-9">
              {/* Bar chart */}
              <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500"
                  style={{ width: `${(advisor.consultationCount / maxConsultations) * 100}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-12 text-right">
                {advisor.consultationCount}
              </span>
            </div>

            <div className="flex items-center gap-4 ml-9 mt-2 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-gray-500 dark:text-gray-400">Success:</span>
                <span
                  className={
                    advisor.successRate >= 90
                      ? 'text-green-600 font-medium'
                      : advisor.successRate >= 80
                        ? 'text-yellow-600 font-medium'
                        : 'text-red-600 font-medium'
                  }
                >
                  {advisor.successRate}%
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500 dark:text-gray-400">Confidence:</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {advisor.avgConfidence}%
                </span>
              </div>
            </div>

            <div className="ml-9 mt-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 italic truncate">
                &ldquo;{advisor.topWisdom}&rdquo;
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
