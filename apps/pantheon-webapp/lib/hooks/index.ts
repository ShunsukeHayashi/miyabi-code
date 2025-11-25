/**
 * Hooks Index
 * Issue: #979 - Phase 3.2: Dashboard UI Modernization
 * Issue: #980 - Phase 3.3: WebSocket Integration
 *
 * Re-exports all custom hooks for convenient importing.
 */

export {
  useDashboard,
  useDashboardSummary,
  useRecentActivities,
  useAgents,
  useTasks,
  type UseDashboardOptions,
  type DashboardState,
} from './useDashboard';

export {
  useRealTimeSummary,
  useRealTimeActivities,
  useRealTimeAgents,
  useRealTimeTasks,
  type UseRealTimeOptions,
} from './useRealTimeData';
