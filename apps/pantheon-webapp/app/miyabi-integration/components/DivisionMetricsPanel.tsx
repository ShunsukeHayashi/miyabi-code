/**
 * Division Metrics Panel Component
 * Issue: #1017 - Pantheon Webapp Miyabi Integration Dashboard
 */

'use client';

import Link from 'next/link';
import type { DivisionMetrics } from '../../../types/miyabi';

interface Props {
  metrics: DivisionMetrics[];
  isLoading: boolean;
}

export default function DivisionMetricsPanel({ metrics, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Division Analytics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const totalConsultations = metrics.reduce((sum, d) => sum + d.consultationCount, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Division Analytics
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Total: {totalConsultations.toLocaleString()} consultations
        </span>
      </div>

      {/* Pie chart simulation with progress bars */}
      <div className="mb-6">
        <div className="flex h-4 rounded-full overflow-hidden">
          {metrics.map((division, i) => (
            <div
              key={division.divisionId}
              className="transition-all duration-500"
              style={{
                backgroundColor: division.color,
                width: `${(division.consultationCount / totalConsultations) * 100}%`,
              }}
              title={`${division.divisionName}: ${division.consultationCount}`}
            />
          ))}
        </div>
      </div>

      {/* Division cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {metrics.map((division) => (
          <Link
            key={division.divisionId}
            href={`/divisions/${division.divisionId}`}
            className="group p-4 rounded-xl border-2 transition-all hover:shadow-md"
            style={{ borderColor: division.color + '40' }}
          >
            <div className="text-center">
              <div
                className="text-3xl mb-2 p-2 rounded-lg mx-auto w-fit"
                style={{ backgroundColor: division.color + '20' }}
              >
                {division.divisionIcon}
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1 group-hover:text-amber-600 transition-colors">
                {division.divisionName.split(' & ')[0]}
              </h3>
              <div className="text-2xl font-bold" style={{ color: division.color }}>
                {division.consultationCount}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                consultations
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Success</span>
                  <span
                    className={
                      division.successRate >= 90
                        ? 'text-green-600 font-medium'
                        : 'text-yellow-600 font-medium'
                    }
                  >
                    {division.successRate}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Avg Time</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {division.avgResponseTime}s
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
