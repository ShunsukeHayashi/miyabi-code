/**
 * Task List Component
 * Issue: #979 - Phase 3.2: Dashboard UI Modernization
 *
 * Displays tasks in a list format with filtering
 */

'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { Task, TaskStatus } from '../../../lib/services';

interface TaskListProps {
  tasks: Task[];
  total: number;
  isLoading: boolean;
  onRefresh?: () => void;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="w-3 h-3 bg-gray-200 dark:bg-gray-600 rounded-full" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-48" />
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-32" />
            </div>
          </div>
          <div className="h-6 w-16 bg-gray-200 dark:bg-gray-600 rounded" />
        </div>
      ))}
    </div>
  );
}

function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'running':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'pending':
    case 'queued':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
  }
}

function getPriorityIndicator(priority: number): { color: string; label: string } {
  if (priority <= 1) {
    return { color: 'bg-red-500', label: 'Critical' };
  } else if (priority <= 2) {
    return { color: 'bg-orange-500', label: 'High' };
  } else if (priority <= 3) {
    return { color: 'bg-yellow-500', label: 'Medium' };
  }
  return { color: 'bg-green-500', label: 'Low' };
}

type FilterStatus = 'all' | 'pending' | 'running' | 'completed' | 'failed';

function TaskItem({ task }: { task: Task }) {
  const priority = getPriorityIndicator(task.priority);
  const timeAgo = formatDistanceToNow(new Date(task.createdAt), { addSuffix: true });

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
      <div className="flex items-center space-x-4">
        <div className={`w-3 h-3 rounded-full ${priority.color}`} title={priority.label} />
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</h4>
          <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400 space-x-2">
            <span className="capitalize">{task.type}</span>
            {task.repository && (
              <>
                <span className="hidden sm:inline">|</span>
                <span className="hidden sm:inline">{task.repository}</span>
              </>
            )}
            <span>|</span>
            <span>{timeAgo}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        {task.progress !== undefined && task.status === 'running' && (
          <div className="hidden sm:flex items-center space-x-2">
            <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-blue-400 rounded-full"
                style={{ width: `${task.progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">{task.progress}%</span>
          </div>
        )}
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
          {task.status}
        </span>
        <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function TaskList({ tasks, total, isLoading, onRefresh }: TaskListProps) {
  const [filter, setFilter] = useState<FilterStatus>('all');

  const filteredTasks = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  const filters: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'running', label: 'Running' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tasks</h3>
            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
              {total} total
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {filters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    filter === f.value
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="p-4">
        {isLoading ? (
          <LoadingSkeleton />
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <svg
              className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {filter === 'all' ? 'No tasks found' : `No ${filter} tasks`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
