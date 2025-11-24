/**
 * Analytics Types for Miyabi Console
 *
 * Metrics and data structures for system analytics
 */

export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface AgentPerformanceMetric {
  agent_id: string;
  agent_name: string;
  tasks_completed: number;
  tasks_failed: number;
  avg_duration_ms: number;
  success_rate: number;
  last_active?: string;
}

export interface TaskMetrics {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  running: number;
  cancelled: number;
}

export interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_in: number;
  network_out: number;
  uptime_seconds: number;
}

export interface DailyStats {
  date: string;
  tasks_completed: number;
  tasks_failed: number;
  agents_active: number;
  avg_response_time_ms: number;
}

export interface AnalyticsSummary {
  period: 'day' | 'week' | 'month';
  start_date: string;
  end_date: string;
  task_metrics: TaskMetrics;
  system_metrics: SystemMetrics;
  agent_performance: AgentPerformanceMetric[];
  daily_stats: DailyStats[];
}

export interface AnalyticsResponse {
  summary: AnalyticsSummary;
  updated_at: string;
}
