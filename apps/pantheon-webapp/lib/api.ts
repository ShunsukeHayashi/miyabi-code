/**
 * Miyabi API Client
 * Issue: #1017 - Pantheon Webapp Miyabi Integration Dashboard
 */

import type {
  SystemStatus,
  MiyabiConsultation,
  AdvisorMetrics,
  DivisionMetrics,
  Activity,
} from '@/types/miyabi';

const API_BASE = process.env.NEXT_PUBLIC_MIYABI_API_URL || 'http://localhost:8080/api/v1';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const miyabiApi = {
  // System Status
  getStatus: () => fetchApi<SystemStatus>('/miyabi/status'),

  // Consultations
  getConsultations: (params?: { limit?: number; timeRange?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.timeRange) query.set('time_range', params.timeRange);
    return fetchApi<{ consultations: MiyabiConsultation[] }>(
      `/miyabi/consultations?${query.toString()}`
    );
  },

  // Advisor Metrics
  getAdvisorMetrics: () =>
    fetchApi<{ advisors: AdvisorMetrics[] }>('/miyabi/metrics/advisors'),

  // Division Metrics
  getDivisionMetrics: () =>
    fetchApi<{ divisions: DivisionMetrics[] }>('/miyabi/metrics/divisions'),

  // Activity Stream
  getActivity: (params?: { limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', params.limit.toString());
    return fetchApi<{ activities: Activity[] }>(`/miyabi/activity?${query.toString()}`);
  },
};

// Mock data for development
export const mockData = {
  systemStatus: {
    agents_online: 21,
    api_status: 'healthy' as const,
    consultations_today: 47,
    avg_response_time: 1.2,
  },
  consultations: [
    {
      id: '1',
      task_id: 'task-001',
      task_title: 'Deploy Web API v1.1',
      advisor_id: 'leonardo',
      advisor_name: 'Leonardo da Vinci',
      wisdom: 'Simplicity is the ultimate sophistication.',
      result: 'success' as const,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      task_id: 'task-002',
      task_title: 'Resolve merge conflict in feature branch',
      advisor_id: 'sun-tzu',
      advisor_name: 'Sun Tzu',
      wisdom: 'In the midst of chaos, there is also opportunity.',
      result: 'in_progress' as const,
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      task_id: 'task-003',
      task_title: 'Optimize database queries',
      advisor_id: 'einstein',
      advisor_name: 'Albert Einstein',
      wisdom: 'Everything should be made as simple as possible, but not simpler.',
      result: 'success' as const,
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
  ],
  advisorMetrics: [
    {
      advisor_id: 'leonardo',
      advisor_name: 'Leonardo da Vinci',
      consultation_count: 15,
      success_rate: 93.3,
      avg_confidence: 0.87,
      top_wisdom: 'Simplicity is the ultimate sophistication.',
    },
    {
      advisor_id: 'sun-tzu',
      advisor_name: 'Sun Tzu',
      consultation_count: 12,
      success_rate: 91.7,
      avg_confidence: 0.85,
      top_wisdom: 'In the midst of chaos, there is also opportunity.',
    },
    {
      advisor_id: 'einstein',
      advisor_name: 'Albert Einstein',
      consultation_count: 10,
      success_rate: 90.0,
      avg_confidence: 0.89,
      top_wisdom: 'Everything should be made as simple as possible, but not simpler.',
    },
  ],
  divisionMetrics: [
    {
      division_id: 'innovation',
      division_name: 'Innovation Division',
      consultation_count: 20,
      success_rate: 92.0,
      active_advisors: 5,
    },
    {
      division_id: 'strategy',
      division_name: 'Strategy Division',
      consultation_count: 15,
      success_rate: 88.5,
      active_advisors: 4,
    },
    {
      division_id: 'operations',
      division_name: 'Operations Division',
      consultation_count: 12,
      success_rate: 94.2,
      active_advisors: 3,
    },
  ],
  activities: [
    {
      id: '1',
      type: 'consultation_completed' as const,
      message: 'Leonardo da Vinci completed consultation for "Deploy Web API v1.1"',
      timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      type: 'consultation_started' as const,
      message: 'Sun Tzu started consultation for "Resolve merge conflict"',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      type: 'task_created' as const,
      message: 'New task created: "Implement user authentication"',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
  ],
};
