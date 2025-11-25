/**
 * useAgents Hook
 *
 * React Query hooks for Agent API (including Worker/Coordinator status)
 * Issue: #970 Phase 3.1 - Frontend API Integration
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { agentApi, Agent, SystemOverview } from '@/lib/api';

// Query keys
export const agentKeys = {
  all: ['agents'] as const,
  lists: () => [...agentKeys.all, 'list'] as const,
  list: () => [...agentKeys.lists()] as const,
  details: () => [...agentKeys.all, 'detail'] as const,
  detail: (id: string) => [...agentKeys.details(), id] as const,
  workers: () => [...agentKeys.all, 'workers'] as const,
  coordinators: () => [...agentKeys.all, 'coordinators'] as const,
  overview: () => [...agentKeys.all, 'overview'] as const,
};

/**
 * Hook to fetch all agents
 */
export function useAgents() {
  return useQuery({
    queryKey: agentKeys.list(),
    queryFn: async () => {
      const response = await agentApi.list();
      return response.data.agents;
    },
  });
}

/**
 * Hook to fetch a single agent by ID
 */
export function useAgent(agentId: string) {
  return useQuery({
    queryKey: agentKeys.detail(agentId),
    queryFn: async () => {
      const response = await agentApi.get(agentId);
      return response.data;
    },
    enabled: !!agentId,
  });
}

/**
 * Hook to execute an agent
 */
export function useExecuteAgentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agentType,
      data,
    }: {
      agentType: string;
      data: { issue_number?: number; task_id?: string };
    }) => {
      const response = await agentApi.execute(agentType, data);
      return response.data;
    },
    onSuccess: () => {
      // Refresh agent statuses after execution
      queryClient.invalidateQueries({ queryKey: agentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: agentKeys.workers() });
      queryClient.invalidateQueries({ queryKey: agentKeys.coordinators() });
      queryClient.invalidateQueries({ queryKey: agentKeys.overview() });
    },
  });
}

/**
 * Hook to fetch all workers (Layer 4 agents)
 */
export function useWorkers() {
  return useQuery({
    queryKey: agentKeys.workers(),
    queryFn: async () => {
      const response = await agentApi.listWorkers();
      return response.data;
    },
    // Refresh every 5 seconds for real-time status
    refetchInterval: 5000,
  });
}

/**
 * Hook to fetch all coordinators (Layer 3 agents)
 */
export function useCoordinators() {
  return useQuery({
    queryKey: agentKeys.coordinators(),
    queryFn: async () => {
      const response = await agentApi.listCoordinators();
      return response.data;
    },
    // Refresh every 5 seconds for real-time status
    refetchInterval: 5000,
  });
}

/**
 * Hook to fetch system overview
 */
export function useSystemOverview() {
  return useQuery({
    queryKey: agentKeys.overview(),
    queryFn: async () => {
      const response = await agentApi.getSystemOverview();
      return response.data;
    },
    // Refresh every 10 seconds for dashboard
    refetchInterval: 10000,
  });
}

/**
 * Hook to get coding agents only
 */
export function useCodingAgents() {
  const { data: agents, ...rest } = useAgents();

  const codingAgentNames = [
    'CoordinatorAgent',
    'CodeGenAgent',
    'ReviewAgent',
    'IssueAgent',
    'PRAgent',
    'DeploymentAgent',
    'RefresherAgent',
  ];

  const codingAgents = agents?.filter((agent) =>
    codingAgentNames.includes(agent.name)
  );

  return { data: codingAgents, ...rest };
}

/**
 * Hook to get business agents only
 */
export function useBusinessAgents() {
  const { data: agents, ...rest } = useAgents();

  const codingAgentNames = [
    'CoordinatorAgent',
    'CodeGenAgent',
    'ReviewAgent',
    'IssueAgent',
    'PRAgent',
    'DeploymentAgent',
    'RefresherAgent',
  ];

  const businessAgents = agents?.filter(
    (agent) => !codingAgentNames.includes(agent.name)
  );

  return { data: businessAgents, ...rest };
}

/**
 * Hook to get agent counts by status
 */
export function useAgentStatusCounts() {
  const { data: agents, ...rest } = useAgents();

  const counts = {
    total: agents?.length ?? 0,
    running: agents?.filter((a) => a.status === 'running').length ?? 0,
    idle: agents?.filter((a) => a.status === 'idle').length ?? 0,
    busy: agents?.filter((a) => a.status === 'busy').length ?? 0,
    error: agents?.filter((a) => a.status === 'error').length ?? 0,
  };

  return { data: counts, ...rest };
}
