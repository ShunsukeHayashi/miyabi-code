/**
 * useOrganizations Hook
 *
 * React Query hooks for Organization Management API
 * Issue: #970 Phase 3.1 - Frontend API Integration
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { organizationApi, Organization, OrganizationMember, Team } from '@/lib/api';

// Query keys
export const orgKeys = {
  all: ['organizations'] as const,
  lists: () => [...orgKeys.all, 'list'] as const,
  list: () => [...orgKeys.lists()] as const,
  details: () => [...orgKeys.all, 'detail'] as const,
  detail: (id: string) => [...orgKeys.details(), id] as const,
  members: (orgId: string) => [...orgKeys.all, 'members', orgId] as const,
  teams: (orgId: string) => [...orgKeys.all, 'teams', orgId] as const,
};

/**
 * Hook to fetch all organizations
 */
export function useOrganizations() {
  return useQuery({
    queryKey: orgKeys.list(),
    queryFn: async () => {
      const response = await organizationApi.list();
      return response.data.organizations;
    },
  });
}

/**
 * Hook to fetch a single organization by ID
 */
export function useOrganization(orgId: string) {
  return useQuery({
    queryKey: orgKeys.detail(orgId),
    queryFn: async () => {
      const response = await organizationApi.get(orgId);
      return response.data.organization;
    },
    enabled: !!orgId,
  });
}

/**
 * Hook to create a new organization
 */
export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; slug: string; description?: string }) => {
      const response = await organizationApi.create(data);
      return response.data.organization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.lists() });
    },
  });
}

/**
 * Hook to update an organization
 */
export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orgId,
      data,
    }: {
      orgId: string;
      data: { name?: string; description?: string; settings?: Record<string, unknown> };
    }) => {
      const response = await organizationApi.update(orgId, data);
      return response.data.organization;
    },
    onSuccess: (org) => {
      queryClient.invalidateQueries({ queryKey: orgKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orgKeys.detail(org.id) });
    },
  });
}

/**
 * Hook to delete an organization
 */
export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orgId: string) => {
      await organizationApi.delete(orgId);
      return orgId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.lists() });
    },
  });
}

// ============================================================================
// Organization Members
// ============================================================================

/**
 * Hook to fetch organization members
 */
export function useOrganizationMembers(orgId: string) {
  return useQuery({
    queryKey: orgKeys.members(orgId),
    queryFn: async () => {
      const response = await organizationApi.listMembers(orgId);
      return response.data.members;
    },
    enabled: !!orgId,
  });
}

/**
 * Hook to add a member to an organization
 */
export function useAddOrganizationMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orgId,
      data,
    }: {
      orgId: string;
      data: { user_id: string; role: string };
    }) => {
      const response = await organizationApi.addMember(orgId, data);
      return response.data.member;
    },
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: orgKeys.members(orgId) });
    },
  });
}

/**
 * Hook to update a member's role in an organization
 */
export function useUpdateOrganizationMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orgId,
      userId,
      data,
    }: {
      orgId: string;
      userId: string;
      data: { role: string };
    }) => {
      const response = await organizationApi.updateMember(orgId, userId, data);
      return response.data.member;
    },
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: orgKeys.members(orgId) });
    },
  });
}

/**
 * Hook to remove a member from an organization
 */
export function useRemoveOrganizationMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orgId, userId }: { orgId: string; userId: string }) => {
      await organizationApi.removeMember(orgId, userId);
      return { orgId, userId };
    },
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: orgKeys.members(orgId) });
    },
  });
}

// ============================================================================
// Organization Teams
// ============================================================================

/**
 * Hook to fetch organization teams
 */
export function useOrganizationTeams(orgId: string) {
  return useQuery({
    queryKey: orgKeys.teams(orgId),
    queryFn: async () => {
      const response = await organizationApi.listTeams(orgId);
      return response.data.teams;
    },
    enabled: !!orgId,
  });
}

/**
 * Hook to create a team in an organization
 */
export function useCreateOrganizationTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orgId,
      data,
    }: {
      orgId: string;
      data: { name: string; description?: string };
    }) => {
      const response = await organizationApi.createTeam(orgId, data);
      return response.data.team;
    },
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: orgKeys.teams(orgId) });
    },
  });
}
