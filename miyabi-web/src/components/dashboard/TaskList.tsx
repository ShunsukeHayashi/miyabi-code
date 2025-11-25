/**
 * TaskList Component
 *
 * Displays tasks with filtering, pagination and lifecycle actions
 * Issue: #970 Phase 3.2 - Dashboard Components
 */

'use client';

import { useState } from 'react';
import {
  useTasks,
  useTaskStats,
  useStartTask,
  useCompleteTask,
  useCancelTask,
  useRetryTask,
} from '@/hooks/useTasks';
import { Task, TaskFilters } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const priorityColors = {
  P0: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  P1: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  P2: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

const statusColors = {
  pending: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  running: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

interface TaskRowProps {
  task: Task;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onRetry: () => void;
}

function TaskRow({ task, onStart, onComplete, onCancel, onRetry }: TaskRowProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-0.5 rounded font-medium ${
              priorityColors[task.priority as keyof typeof priorityColors] ?? priorityColors.P2
            }`}
          >
            {task.priority}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              statusColors[task.status as keyof typeof statusColors] ?? statusColors.pending
            }`}
          >
            {task.status}
          </span>
          {task.agent_type && (
            <span className="text-xs text-muted-foreground">
              {task.agent_type}
            </span>
          )}
        </div>
        <h4 className="font-medium mt-1 truncate">{task.name}</h4>
        {task.description && (
          <p className="text-sm text-muted-foreground truncate">{task.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 ml-4">
        {task.status === 'pending' && (
          <Button onClick={onStart} className="h-8 px-3 text-xs">
            Start
          </Button>
        )}
        {task.status === 'running' && (
          <>
            <Button onClick={onComplete} className="h-8 px-3 text-xs">
              Complete
            </Button>
            <Button onClick={onCancel} className="h-8 px-3 text-xs">
              Cancel
            </Button>
          </>
        )}
        {task.status === 'failed' && (
          <Button onClick={onRetry} className="h-8 px-3 text-xs">
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}

export function TaskList() {
  const [filters, setFilters] = useState<TaskFilters>({
    page: 1,
    limit: 10,
  });

  const { data, isLoading, error } = useTasks(filters);
  const { data: stats } = useTaskStats();
  const startTask = useStartTask();
  const completeTask = useCompleteTask();
  const cancelTask = useCancelTask();
  const retryTask = useRetryTask();

  const handleFilterStatus = (status: string | undefined) => {
    setFilters((prev) => ({ ...prev, status, page: 1 }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Failed to load tasks</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tasks</CardTitle>
          {stats && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                {stats.pending} pending
              </span>
              <span className="text-blue-600 dark:text-blue-400">
                {stats.running} running
              </span>
              <span className="text-green-600 dark:text-green-400">
                {stats.completed} completed
              </span>
              <span className="text-red-600 dark:text-red-400">
                {stats.failed} failed
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Status Filters */}
        <div className="flex gap-2 mb-4">
          <Button
            onClick={() => handleFilterStatus(undefined)}
            className={`h-8 px-3 text-xs ${!filters.status ? '' : 'bg-muted text-muted-foreground'}`}
          >
            All
          </Button>
          <Button
            onClick={() => handleFilterStatus('pending')}
            className={`h-8 px-3 text-xs ${filters.status === 'pending' ? '' : 'bg-muted text-muted-foreground'}`}
          >
            Pending
          </Button>
          <Button
            onClick={() => handleFilterStatus('running')}
            className={`h-8 px-3 text-xs ${filters.status === 'running' ? '' : 'bg-muted text-muted-foreground'}`}
          >
            Running
          </Button>
          <Button
            onClick={() => handleFilterStatus('failed')}
            className={`h-8 px-3 text-xs ${filters.status === 'failed' ? '' : 'bg-muted text-muted-foreground'}`}
          >
            Failed
          </Button>
        </div>

        {/* Task List */}
        <div className="border rounded-lg">
          {data?.tasks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No tasks found
            </div>
          ) : (
            data?.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onStart={() => startTask.mutate(task.id)}
                onComplete={() => completeTask.mutate(task.id)}
                onCancel={() => cancelTask.mutate(task.id)}
                onRetry={() => retryTask.mutate(task.id)}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {data && data.total > filters.limit! && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {((filters.page ?? 1) - 1) * (filters.limit ?? 10) + 1} to{' '}
              {Math.min((filters.page ?? 1) * (filters.limit ?? 10), data.total)} of {data.total}
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))}
                disabled={(filters.page ?? 1) <= 1}
                className="h-8 px-3 text-xs"
              >
                Previous
              </Button>
              <Button
                onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))}
                disabled={(filters.page ?? 1) * (filters.limit ?? 10) >= data.total}
                className="h-8 px-3 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
