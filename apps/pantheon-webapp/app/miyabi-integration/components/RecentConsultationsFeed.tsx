/**
 * Recent Consultations Feed Component
 * Issue: #1017 - Pantheon Webapp Miyabi Integration Dashboard
 */

'use client';

import Link from 'next/link';
import type { MiyabiConsultation } from '../../../types/miyabi';
import { formatRelativeTime } from '../../../data/miyabi-mock';

interface Props {
  consultations: MiyabiConsultation[];
  isLoading: boolean;
}

export default function RecentConsultationsFeed({ consultations, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Consultations
        </h2>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statusConfig = {
    success: {
      icon: '',
      label: 'Completed',
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-400',
    },
    in_progress: {
      icon: '=',
      label: 'In Progress',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-400',
    },
    failed: {
      icon: 'L',
      label: 'Failed',
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-400',
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Consultations
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {consultations.length} consultations
        </span>
      </div>

      <div className="space-y-4">
        {consultations.map((consultation) => {
          const config = statusConfig[consultation.status];
          return (
            <div
              key={consultation.id}
              className={`p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors ${config.bg}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.icon}</span>
                  <span className={`text-sm font-medium ${config.text}`}>
                    {config.label}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatRelativeTime(consultation.createdAt)}
                </span>
              </div>

              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                {consultation.taskTitle}
              </h3>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{consultation.advisorIcon}</span>
                <Link
                  href={`/advisors/${consultation.advisorId}`}
                  className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
                >
                  {consultation.advisorName}
                </Link>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  " {consultation.advisorDivision}
                </span>
              </div>

              <blockquote className="text-sm text-gray-600 dark:text-gray-300 italic border-l-2 border-amber-500 pl-3">
                &ldquo;{consultation.wisdom}&rdquo;
              </blockquote>

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Confidence:
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${consultation.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {consultation.confidence}%
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Task: {consultation.taskId}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
