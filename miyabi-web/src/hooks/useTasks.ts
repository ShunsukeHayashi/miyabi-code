/**
 * useTasks Hook
 *
 * React Query hooks for Task Management API
 * Issue: #970 Phase 3.1 - Frontend API Integration
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { taskApi, Task, TaskFilters, TaskStats } from '@/lib/api';

// Query keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters?: TaskFilters) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  stats: () => [...taskKeys.all, 'stats'] as const,
};

/**
 * Hook to fetch tasks with filtering and pagination
 */
export function useTasks(filters?: TaskFilters) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: async () => {
      const response = await taskApi.list(filters);
      return response.data;
    },
  });
}

/**
 * Hook to fetch a single task by ID
 */
export function useTask(taskId: string) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: async () => {
      const response = await taskApi.get(taskId);
      return response.data.task;
    },
    enabled: !!taskId,
  });
}

/**
 * Hook to fetch task statistics
 */
export function useTaskStats() {
  return useQuery({
    queryKey: taskKeys.stats(),
    queryFn: async () => {
      const response = await taskApi.stats();
      return response.data;
    },
  });
}

/**
 * Hook to create a new task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Parameters<typeof taskApi.create>[0]) => {
      const response = await taskApi.create(data);
      return response.data.task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
    },
  });
}

/**
 * Hook to update a task
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      data,
    }: {
      taskId: string;
      data: Parameters<typeof taskApi.update>[1];
    }) => {
      const response = await taskApi.update(taskId, data);
      return response.data.task;
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(task.id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
    },
  });
}

/**
 * Hook to delete a task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      await taskApi.delete(taskId);
      return taskId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
    },
  });
}

/**
 * Hook to start a task
 */
export function useStartTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await taskApi.start(taskId);
      return response.data.task;
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(task.id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
    },
  });
}

/**
 * Hook to complete a task
 */
export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await taskApi.complete(taskId);
      return response.data.task;
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(task.id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
    },
  });
}

/**
 * Hook to fail a task
 */
export function useFailTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await taskApi.fail(taskId);
      return response.data.task;
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(task.id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
    },
  });
}

/**
 * Hook to cancel a task
 */
export function useCancelTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await taskApi.cancel(taskId);
      return response.data.task;
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(task.id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
    },
  });
}

/**
 * Hook to retry a failed task
 */
export function useRetryTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await taskApi.retry(taskId);
      return response.data.task;
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(task.id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
    },
  });
}
