import { useState, useCallback } from 'react';
import type { DashboardSnapshot } from '../types/dashboard';

interface UseDashboardReturn {
  snapshot: DashboardSnapshot | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

/**
 * Hook for fetching and managing dashboard data
 * 
 * TODO: Implement actual Tauri API integration
 */
export function useDashboard(): UseDashboardReturn {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);

    // TODO: Replace with actual Tauri API call
    // For now, provide mock data
    setTimeout(() => {
      const mockSnapshot: DashboardSnapshot = {
        timestamp: new Date().toISOString(),
        worktrees: {
          total: 0,
          active: 0,
          stale: 0,
          names: [],
        },
        agents: {
          total: 0,
          running: 0,
          completed: 0,
          failed: 0,
          recent: [],
        },
        issues: {
          open: 0,
          inProgress: 0,
          completedToday: 0,
        },
        history: {
          commitsToday: 0,
          prsToday: 0,
          issuesClosedToday: 0,
          recentActivities: [],
        },
        system: {
          cpuUsage: 0,
          memoryUsageMB: 0,
          totalMemoryMB: 0,
          diskUsage: 0,
          uptimeSeconds: 0,
        },
      };

      setSnapshot(mockSnapshot);
      setLoading(false);
    }, 100);
  }, []);

  return {
    snapshot,
    loading,
    error,
    refresh,
  };
}
