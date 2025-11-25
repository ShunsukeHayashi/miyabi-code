/**
 * Miyabi Integration Mock Data
 * Issue: #1017 - Pantheon Webapp Miyabi Integration Dashboard
 */

import type {
  SystemStatus,
  MiyabiConsultation,
  AdvisorMetrics,
  DivisionMetrics,
  Activity,
} from '../types/miyabi';

export const mockSystemStatus: SystemStatus = {
  agentsOnline: 17,
  agentsTotal: 21,
  apiStatus: 'healthy',
  consultationsToday: 142,
  avgResponseTime: 1.2,
  lastUpdated: new Date().toISOString(),
};

export const mockConsultations: MiyabiConsultation[] = [
  {
    id: 'c1',
    taskId: 'task-001',
    taskTitle: 'Deploy Miyabi Web API v2.1',
    advisorId: 'da-vinci',
    advisorName: 'Leonardo da Vinci',
    advisorDivision: 'Innovation & Technology',
    advisorIcon: '=¡',
    wisdom: 'Simplicity is the ultimate sophistication',
    status: 'success',
    confidence: 94,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c2',
    taskId: 'task-002',
    taskTitle: 'Resolve merge conflict in feature/auth',
    advisorId: 'sun-tzu',
    advisorName: 'Sun Tzu',
    advisorDivision: 'Divine Council',
    advisorIcon: '¡',
    wisdom: 'The supreme art of war is to subdue the enemy without fighting',
    status: 'in_progress',
    confidence: 87,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'c3',
    taskId: 'task-003',
    taskTitle: 'Optimize database query performance',
    advisorId: 'nikola-tesla',
    advisorName: 'Nikola Tesla',
    advisorDivision: 'Innovation & Technology',
    advisorIcon: '=¡',
    wisdom: 'If you want to find the secrets of the universe, think in terms of energy, frequency and vibration',
    status: 'success',
    confidence: 91,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c4',
    taskId: 'task-004',
    taskTitle: 'Design user onboarding flow',
    advisorId: 'steve-jobs',
    advisorName: 'Steve Jobs',
    advisorDivision: 'Innovation & Technology',
    advisorIcon: '=¡',
    wisdom: 'Design is not just what it looks like and feels like. Design is how it works',
    status: 'success',
    confidence: 96,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c5',
    taskId: 'task-005',
    taskTitle: 'Handle customer escalation',
    advisorId: 'machiavelli',
    advisorName: 'Niccolò Machiavelli',
    advisorDivision: 'Divine Council',
    advisorIcon: '¡',
    wisdom: 'It is better to be feared than loved, if you cannot be both',
    status: 'failed',
    confidence: 72,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c6',
    taskId: 'task-006',
    taskTitle: 'Write marketing copy for launch',
    advisorId: 'shakespeare',
    advisorName: 'William Shakespeare',
    advisorDivision: 'Art & Communication',
    advisorIcon: '<¨',
    wisdom: 'Brevity is the soul of wit',
    status: 'success',
    confidence: 89,
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c7',
    taskId: 'task-007',
    taskTitle: 'Lead team standup meeting',
    advisorId: 'churchill',
    advisorName: 'Winston Churchill',
    advisorDivision: 'Leadership & Management',
    advisorIcon: '=Q',
    wisdom: 'Success is not final, failure is not fatal: it is the courage to continue that counts',
    status: 'success',
    confidence: 93,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c8',
    taskId: 'task-008',
    taskTitle: 'Architect microservices migration',
    advisorId: 'aristotle',
    advisorName: 'Aristotle',
    advisorDivision: 'Strategy & Philosophy',
    advisorIcon: '<¯',
    wisdom: 'The whole is greater than the sum of its parts',
    status: 'in_progress',
    confidence: 85,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
];

export const mockAdvisorMetrics: AdvisorMetrics[] = [
  {
    advisorId: 'sun-tzu',
    advisorName: 'Sun Tzu',
    division: 'Divine Council',
    divisionIcon: '¡',
    consultationCount: 234,
    successRate: 94,
    avgConfidence: 91,
    topWisdom: 'Know yourself and know your enemy',
  },
  {
    advisorId: 'da-vinci',
    advisorName: 'Leonardo da Vinci',
    division: 'Innovation & Technology',
    divisionIcon: '=¡',
    consultationCount: 189,
    successRate: 92,
    avgConfidence: 88,
    topWisdom: 'Simplicity is the ultimate sophistication',
  },
  {
    advisorId: 'machiavelli',
    advisorName: 'Niccolò Machiavelli',
    division: 'Divine Council',
    divisionIcon: '¡',
    consultationCount: 156,
    successRate: 87,
    avgConfidence: 85,
    topWisdom: 'The end justifies the means',
  },
  {
    advisorId: 'steve-jobs',
    advisorName: 'Steve Jobs',
    division: 'Innovation & Technology',
    divisionIcon: '=¡',
    consultationCount: 145,
    successRate: 96,
    avgConfidence: 93,
    topWisdom: 'Stay hungry, stay foolish',
  },
  {
    advisorId: 'churchill',
    advisorName: 'Winston Churchill',
    division: 'Leadership & Management',
    divisionIcon: '=Q',
    consultationCount: 128,
    successRate: 91,
    avgConfidence: 89,
    topWisdom: 'Never give in, never give in, never, never, never',
  },
  {
    advisorId: 'aristotle',
    advisorName: 'Aristotle',
    division: 'Strategy & Philosophy',
    divisionIcon: '<¯',
    consultationCount: 112,
    successRate: 89,
    avgConfidence: 87,
    topWisdom: 'Excellence is not an act, but a habit',
  },
  {
    advisorId: 'shakespeare',
    advisorName: 'William Shakespeare',
    division: 'Art & Communication',
    divisionIcon: '<¨',
    consultationCount: 98,
    successRate: 93,
    avgConfidence: 90,
    topWisdom: 'All the world is a stage',
  },
  {
    advisorId: 'nikola-tesla',
    advisorName: 'Nikola Tesla',
    division: 'Innovation & Technology',
    divisionIcon: '=¡',
    consultationCount: 87,
    successRate: 90,
    avgConfidence: 86,
    topWisdom: 'The present is theirs; the future is mine',
  },
];

export const mockDivisionMetrics: DivisionMetrics[] = [
  {
    divisionId: 'divine-council',
    divisionName: 'Divine Council',
    divisionIcon: '¡',
    color: '#F59E0B',
    consultationCount: 420,
    successRate: 92,
    avgResponseTime: 1.1,
  },
  {
    divisionId: 'innovation-technology',
    divisionName: 'Innovation & Technology',
    divisionIcon: '=¡',
    color: '#3B82F6',
    consultationCount: 380,
    successRate: 94,
    avgResponseTime: 1.3,
  },
  {
    divisionId: 'leadership-management',
    divisionName: 'Leadership & Management',
    divisionIcon: '=Q',
    color: '#8B5CF6',
    consultationCount: 290,
    successRate: 89,
    avgResponseTime: 1.5,
  },
  {
    divisionId: 'strategy-philosophy',
    divisionName: 'Strategy & Philosophy',
    divisionIcon: '<¯',
    color: '#EF4444',
    consultationCount: 250,
    successRate: 87,
    avgResponseTime: 1.8,
  },
  {
    divisionId: 'art-communication',
    divisionName: 'Art & Communication',
    divisionIcon: '<¨',
    color: '#10B981',
    consultationCount: 210,
    successRate: 91,
    avgResponseTime: 1.2,
  },
];

export const mockActivityStream: Activity[] = [
  {
    id: 'a1',
    type: 'consultation_completed',
    message: 'Da Vinci completed consultation for Deploy Miyabi Web API v2.1',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    metadata: {
      advisorName: 'Leonardo da Vinci',
      taskTitle: 'Deploy Miyabi Web API v2.1',
      status: 'success',
      divisionIcon: '=¡',
    },
  },
  {
    id: 'a2',
    type: 'consultation_started',
    message: 'Sun Tzu started consulting on Resolve merge conflict in feature/auth',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    metadata: {
      advisorName: 'Sun Tzu',
      taskTitle: 'Resolve merge conflict in feature/auth',
      divisionIcon: '¡',
    },
  },
  {
    id: 'a3',
    type: 'agent_online',
    message: 'CodeGenAgent came online',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 'a4',
    type: 'wisdom_applied',
    message: 'Applied "Simplicity is the ultimate sophistication" to API redesign',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    metadata: {
      advisorName: 'Leonardo da Vinci',
      divisionIcon: '=¡',
    },
  },
  {
    id: 'a5',
    type: 'consultation_completed',
    message: 'Nikola Tesla optimized database query performance',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    metadata: {
      advisorName: 'Nikola Tesla',
      taskTitle: 'Optimize database query performance',
      status: 'success',
      divisionIcon: '=¡',
    },
  },
  {
    id: 'a6',
    type: 'task_created',
    message: 'New task: Architect microservices migration',
    timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
    metadata: {
      taskTitle: 'Architect microservices migration',
    },
  },
  {
    id: 'a7',
    type: 'consultation_completed',
    message: 'Steve Jobs designed user onboarding flow',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    metadata: {
      advisorName: 'Steve Jobs',
      taskTitle: 'Design user onboarding flow',
      status: 'success',
      divisionIcon: '=¡',
    },
  },
  {
    id: 'a8',
    type: 'agent_offline',
    message: 'AnalyticsAgent went offline for maintenance',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
];

// Helper function to format relative time
export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}
