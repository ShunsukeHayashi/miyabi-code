import type { Agent } from '@/types/agent'

export const mockAgents: Agent[] = [
  // Layer 2: Orchestrator
  {
    id: 'orchestrator-001',
    name: 'Orchestrator (Mac)',
    layer: 2,
    status: 'active',
    uptime: 172800, // 48 hours
    tasks: {
      active: 12,
      completed: 453,
    },
    metrics: {
      cpuUsage: 45.2,
      memoryUsage: 62.8,
      taskCompletionRate: 94.5,
      averageTaskDuration: 124.3,
    },
    config: {
      maxConcurrentTasks: 20,
      timeoutSeconds: 300,
      retryAttempts: 3,
      enableLogging: true,
    },
  },
  // Layer 3: Coordinators
  {
    id: 'coordinator-mugen',
    name: 'MUGEN',
    layer: 3,
    status: 'active',
    uptime: 86400, // 24 hours
    tasks: {
      active: 5,
      completed: 234,
    },
    metrics: {
      cpuUsage: 32.1,
      memoryUsage: 48.5,
      taskCompletionRate: 96.2,
      averageTaskDuration: 89.7,
    },
    config: {
      maxConcurrentTasks: 10,
      timeoutSeconds: 180,
      retryAttempts: 3,
      enableLogging: true,
    },
  },
  {
    id: 'coordinator-majin',
    name: 'MAJIN',
    layer: 3,
    status: 'active',
    uptime: 86400, // 24 hours
    tasks: {
      active: 8,
      completed: 189,
    },
    metrics: {
      cpuUsage: 38.7,
      memoryUsage: 52.3,
      taskCompletionRate: 92.8,
      averageTaskDuration: 102.4,
    },
    config: {
      maxConcurrentTasks: 10,
      timeoutSeconds: 180,
      retryAttempts: 3,
      enableLogging: true,
    },
  },
  // Layer 4: Workers
  {
    id: 'worker-codegen-001',
    name: 'CodeGen Worker #1',
    layer: 4,
    status: 'active',
    uptime: 43200, // 12 hours
    tasks: {
      active: 2,
      completed: 87,
    },
    metrics: {
      cpuUsage: 28.3,
      memoryUsage: 41.2,
      taskCompletionRate: 89.5,
      averageTaskDuration: 156.8,
    },
    config: {
      maxConcurrentTasks: 5,
      timeoutSeconds: 120,
      retryAttempts: 2,
      enableLogging: true,
    },
  },
  {
    id: 'worker-review-001',
    name: 'Review Worker #1',
    layer: 4,
    status: 'idle',
    uptime: 43200, // 12 hours
    tasks: {
      active: 0,
      completed: 65,
    },
    metrics: {
      cpuUsage: 12.1,
      memoryUsage: 28.4,
      taskCompletionRate: 95.3,
      averageTaskDuration: 78.2,
    },
    config: {
      maxConcurrentTasks: 5,
      timeoutSeconds: 120,
      retryAttempts: 2,
      enableLogging: true,
    },
  },
  {
    id: 'worker-deploy-001',
    name: 'Deployment Worker #1',
    layer: 4,
    status: 'error',
    uptime: 21600, // 6 hours
    tasks: {
      active: 1,
      completed: 23,
    },
    metrics: {
      cpuUsage: 8.5,
      memoryUsage: 15.2,
      taskCompletionRate: 76.4,
      averageTaskDuration: 234.5,
    },
    config: {
      maxConcurrentTasks: 3,
      timeoutSeconds: 300,
      retryAttempts: 5,
      enableLogging: true,
    },
  },
  {
    id: 'worker-issue-001',
    name: 'Issue Worker #1',
    layer: 4,
    status: 'offline',
    uptime: 0,
    tasks: {
      active: 0,
      completed: 156,
    },
    metrics: {
      cpuUsage: 0,
      memoryUsage: 0,
      taskCompletionRate: 91.2,
      averageTaskDuration: 45.3,
    },
    config: {
      maxConcurrentTasks: 5,
      timeoutSeconds: 90,
      retryAttempts: 2,
      enableLogging: true,
    },
  },
]
