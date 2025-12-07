/**
 * A2A - Agent-to-Agent Communication Protocol
 * ============================================
 * Main module exports
 */

// State Management
export {
  loadState,
  saveState,
  createInitialState,
  updateAgentStatus,
  getAgentStatus,
  getAllAgentStatuses,
  createTask,
  assignTask,
  startTask,
  completeTask,
  getTask,
  getPendingTasks,
  logEvent,
  getRecentEvents,
  updateMetrics,
  getMetrics,
  createSnapshot,
  restoreFromSnapshot,
} from './state.js';

export type {
  A2AState,
  Agent,
  AgentRole,
  AgentStatus,
  Task,
  TaskStatus,
  TaskPriority,
  TaskType,
  Event,
  EventType,
  AgentMetrics,
  SystemMetrics,
} from './state.js';

// Routing
export {
  classifyTask,
  routeTask,
  selectAgent,
  generateRoutingCommand,
  routeToNextAgent,
} from './router.js';

export type {
  TaskClassification,
  RouteDecision,
  RoutingConfig,
  TaskComplexity,
} from './router.js';

// Version
export const VERSION = '1.0.0';

// Default configuration
export const DEFAULT_CONFIG = {
  session: 'a2a',
  stateFile: '~/.miyabi/a2a_state.json',
  logDir: '~/.miyabi/logs',
  healthInterval: 30,
  minWorkers: 2,
  maxWorkers: 8,
};
