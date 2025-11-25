/**
 * Miyabi Integration Types
 * Issue: #1017 - Pantheon Webapp Miyabi Integration Dashboard
 */

export interface SystemStatus {
  agents_online: number;
  api_status: 'healthy' | 'degraded' | 'down';
  consultations_today: number;
  avg_response_time: number;
}

export interface MiyabiConsultation {
  id: string;
  task_id: string;
  task_title: string;
  advisor_id: string;
  advisor_name: string;
  wisdom: string;
  result: 'success' | 'in_progress' | 'failed';
  created_at: string;
  completed_at?: string;
}

export interface AdvisorMetrics {
  advisor_id: string;
  advisor_name: string;
  consultation_count: number;
  success_rate: number;
  avg_confidence: number;
  top_wisdom: string;
}

export interface DivisionMetrics {
  division_id: string;
  division_name: string;
  consultation_count: number;
  success_rate: number;
  active_advisors: number;
}

export interface Activity {
  id: string;
  type: 'consultation_started' | 'consultation_completed' | 'advisor_assigned' | 'task_created';
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface IntegrationDashboardState {
  systemStatus: SystemStatus | null;
  consultations: MiyabiConsultation[];
  advisorMetrics: AdvisorMetrics[];
  divisionMetrics: DivisionMetrics[];
  activityStream: Activity[];
  filters: {
    division?: string;
    timeRange: '1h' | '24h' | '7d' | '30d';
  };
  isLoading: boolean;
  error: string | null;
}
