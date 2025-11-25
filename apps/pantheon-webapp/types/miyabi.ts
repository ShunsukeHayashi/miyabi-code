/**
 * Miyabi Integration Types
 * Issue: #1017 - Pantheon Webapp Miyabi Integration Dashboard
 */

export type ConsultationStatus = 'success' | 'in_progress' | 'failed';

export type ApiStatus = 'healthy' | 'degraded' | 'down';

export type TimeRange = '1h' | '24h' | '7d' | '30d';

export type ActivityType =
  | 'consultation_started'
  | 'consultation_completed'
  | 'wisdom_applied'
  | 'agent_online'
  | 'agent_offline'
  | 'task_created';

export interface SystemStatus {
  agentsOnline: number;
  agentsTotal: number;
  apiStatus: ApiStatus;
  consultationsToday: number;
  avgResponseTime: number;
  lastUpdated: string;
}

export interface MiyabiConsultation {
  id: string;
  taskId: string;
  taskTitle: string;
  advisorId: string;
  advisorName: string;
  advisorDivision: string;
  advisorIcon: string;
  wisdom: string;
  status: ConsultationStatus;
  confidence: number;
  createdAt: string;
  completedAt?: string;
}

export interface AdvisorMetrics {
  advisorId: string;
  advisorName: string;
  division: string;
  divisionIcon: string;
  consultationCount: number;
  successRate: number;
  avgConfidence: number;
  topWisdom: string;
}

export interface DivisionMetrics {
  divisionId: string;
  divisionName: string;
  divisionIcon: string;
  color: string;
  consultationCount: number;
  successRate: number;
  avgResponseTime: number;
}

export interface Activity {
  id: string;
  type: ActivityType;
  message: string;
  timestamp: string;
  metadata?: {
    advisorName?: string;
    taskTitle?: string;
    status?: ConsultationStatus;
    divisionIcon?: string;
  };
}

export interface IntegrationDashboardState {
  systemStatus: SystemStatus | null;
  consultations: MiyabiConsultation[];
  advisorMetrics: AdvisorMetrics[];
  divisionMetrics: DivisionMetrics[];
  activityStream: Activity[];
  filters: {
    division?: string;
    timeRange: TimeRange;
  };
  isLoading: boolean;
  error: string | null;
}
