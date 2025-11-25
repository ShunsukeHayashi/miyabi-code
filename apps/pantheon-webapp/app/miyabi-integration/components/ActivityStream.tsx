/**
 * Activity Stream Component
 * Issue: #1017 - Pantheon Webapp Miyabi Integration Dashboard
 */

'use client';

import type { Activity } from '../../../types/miyabi';
import { formatRelativeTime } from '../../../data/miyabi-mock';

interface Props {
  activities: Activity[];
  isLoading: boolean;
}

export default function ActivityStream({ activities, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Live Activity Stream
        </h2>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activityConfig = {
    consultation_started: {
      icon: '=',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      border: 'border-blue-200 dark:border-blue-800',
    },
    consultation_completed: {
      icon: '',
      bg: 'bg-green-100 dark:bg-green-900/30',
      border: 'border-green-200 dark:border-green-800',
    },
    wisdom_applied: {
      icon: '=¡',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      border: 'border-amber-200 dark:border-amber-800',
    },
    agent_online: {
      icon: '=â',
      bg: 'bg-green-100 dark:bg-green-900/30',
      border: 'border-green-200 dark:border-green-800',
    },
    agent_offline: {
      icon: '=4',
      bg: 'bg-red-100 dark:bg-red-900/30',
      border: 'border-red-200 dark:border-red-800',
    },
    task_created: {
      icon: '=Ý',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      border: 'border-purple-200 dark:border-purple-800',
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Live Activity Stream
        </h2>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
            Live
          </span>
        </div>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {activities.map((activity) => {
          const config = activityConfig[activity.type];
          return (
            <div
              key={activity.id}
              className={`p-3 rounded-lg border ${config.bg} ${config.border} transition-all hover:scale-[1.01]`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">{config.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {activity.message}
                  </p>
                  {activity.metadata?.advisorName && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs">{activity.metadata.divisionIcon}</span>
                      <span className="text-xs text-amber-600 dark:text-amber-400">
                        {activity.metadata.advisorName}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                  {formatRelativeTime(activity.timestamp)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
        <button className="text-sm text-amber-600 dark:text-amber-400 hover:underline">
          View Full Activity Log
        </button>
      </div>
    </div>
  );
}
