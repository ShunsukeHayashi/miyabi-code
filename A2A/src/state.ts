/**
 * A2A State Management Module
 * ============================
 * 分散状態管理 + イベントソーシング
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { execSync } from 'child_process';

// =============================================================================
// Types
// =============================================================================

export type AgentRole = 'conductor' | 'codegen' | 'review' | 'pr' | 'deploy';
export type AgentStatus = 'initializing' | 'ready' | 'busy' | 'error' | 'dead' | 'stale';
export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'completed' | 'failed';
export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3';
export type TaskType = 'feature' | 'bugfix' | 'refactor' | 'docs' | 'hotfix';

export interface Agent {
  name: string;
  paneId: string;
  role: AgentRole;
  status: AgentStatus;
  lastSeen: string;
  currentTask?: string;
  metrics: AgentMetrics;
}

export interface AgentMetrics {
  tasksCompleted: number;
  tasksFailed: number;
  averageTaskTime: number; // seconds
  restartCount: number;
}

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  estimatedTime?: number; // minutes
  actualTime?: number; // minutes
  metadata: Record<string, unknown>;
}

export interface Event {
  id: string;
  type: EventType;
  agent: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export type EventType =
  | 'AGENT_STARTED'
  | 'AGENT_READY'
  | 'AGENT_ERROR'
  | 'AGENT_RESTARTED'
  | 'TASK_CREATED'
  | 'TASK_ASSIGNED'
  | 'TASK_STARTED'
  | 'TASK_COMPLETED'
  | 'TASK_FAILED'
  | 'MESSAGE_SENT'
  | 'MESSAGE_RECEIVED'
  | 'STATE_SNAPSHOT';

export interface A2AState {
  version: string;
  session: string;
  startedAt: string;
  currentCycle: number;
  agents: Record<string, Agent>;
  tasks: Record<string, Task>;
  eventLog: Event[];
  metrics: SystemMetrics;
}

export interface SystemMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageTaskTime: number;
  throughputPerHour: number;
  uptime: number; // seconds
}

// =============================================================================
// Configuration
// =============================================================================

const STATE_FILE = process.env.A2A_STATE_FILE ||
  path.join(process.env.HOME || '~', '.miyabi', 'a2a_state.json');

const EVENT_LOG_MAX = 1000; // Max events to keep in memory

// =============================================================================
// State Management
// =============================================================================

export async function loadState(): Promise<A2AState> {
  try {
    const content = await fs.readFile(STATE_FILE, 'utf-8');
    return JSON.parse(content) as A2AState;
  } catch {
    return createInitialState();
  }
}

export async function saveState(state: A2AState): Promise<void> {
  // Trim event log if too large
  if (state.eventLog.length > EVENT_LOG_MAX) {
    state.eventLog = state.eventLog.slice(-EVENT_LOG_MAX);
  }

  await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

export function createInitialState(): A2AState {
  const now = new Date().toISOString();
  return {
    version: '1.0.0',
    session: process.env.A2A_SESSION_NAME || 'a2a',
    startedAt: now,
    currentCycle: 0,
    agents: {
      shikiroon: createAgent('shikiroon', 'conductor'),
      kaede: createAgent('kaede', 'codegen'),
      sakura: createAgent('sakura', 'review'),
      tsubaki: createAgent('tsubaki', 'pr'),
      botan: createAgent('botan', 'deploy'),
    },
    tasks: {},
    eventLog: [],
    metrics: {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageTaskTime: 0,
      throughputPerHour: 0,
      uptime: 0,
    },
  };
}

function createAgent(name: string, role: AgentRole): Agent {
  const paneEnvMap: Record<string, string> = {
    shikiroon: 'MIYABI_CONDUCTOR_PANE',
    kaede: 'MIYABI_CODEGEN_PANE',
    sakura: 'MIYABI_REVIEW_PANE',
    tsubaki: 'MIYABI_PR_PANE',
    botan: 'MIYABI_DEPLOY_PANE',
  };

  return {
    name,
    paneId: process.env[paneEnvMap[name]] || '',
    role,
    status: 'initializing',
    lastSeen: new Date().toISOString(),
    metrics: {
      tasksCompleted: 0,
      tasksFailed: 0,
      averageTaskTime: 0,
      restartCount: 0,
    },
  };
}

// =============================================================================
// Agent Operations
// =============================================================================

export async function updateAgentStatus(
  agentName: string,
  status: AgentStatus,
  currentTask?: string
): Promise<void> {
  const state = await loadState();
  const agent = state.agents[agentName];

  if (!agent) {
    throw new Error(`Agent not found: ${agentName}`);
  }

  agent.status = status;
  agent.lastSeen = new Date().toISOString();
  if (currentTask !== undefined) {
    agent.currentTask = currentTask;
  }

  // Add event
  state.eventLog.push(createEvent(
    status === 'ready' ? 'AGENT_READY' :
    status === 'error' ? 'AGENT_ERROR' : 'AGENT_STARTED',
    agentName,
    { status, currentTask }
  ));

  await saveState(state);
}

export async function getAgentStatus(agentName: string): Promise<Agent | undefined> {
  const state = await loadState();
  return state.agents[agentName];
}

export async function getAllAgentStatuses(): Promise<Record<string, Agent>> {
  const state = await loadState();
  return state.agents;
}

// =============================================================================
// Task Operations
// =============================================================================

export async function createTask(
  title: string,
  type: TaskType,
  priority: TaskPriority,
  metadata: Record<string, unknown> = {}
): Promise<Task> {
  const state = await loadState();
  const now = new Date().toISOString();
  const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const task: Task = {
    id,
    title,
    type,
    priority,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    metadata,
  };

  state.tasks[id] = task;
  state.metrics.totalTasks++;

  state.eventLog.push(createEvent('TASK_CREATED', 'system', { taskId: id, title, type, priority }));

  await saveState(state);
  return task;
}

export async function assignTask(taskId: string, agentName: string): Promise<Task> {
  const state = await loadState();
  const task = state.tasks[taskId];

  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  task.assignee = agentName;
  task.status = 'pending';
  task.updatedAt = new Date().toISOString();

  state.agents[agentName].currentTask = taskId;

  state.eventLog.push(createEvent('TASK_ASSIGNED', agentName, { taskId, assignee: agentName }));

  await saveState(state);
  return task;
}

export async function startTask(taskId: string): Promise<Task> {
  const state = await loadState();
  const task = state.tasks[taskId];

  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  task.status = 'in_progress';
  task.updatedAt = new Date().toISOString();

  if (task.assignee) {
    state.agents[task.assignee].status = 'busy';
  }

  state.eventLog.push(createEvent('TASK_STARTED', task.assignee || 'system', { taskId }));

  await saveState(state);
  return task;
}

export async function completeTask(taskId: string, success: boolean = true): Promise<Task> {
  const state = await loadState();
  const task = state.tasks[taskId];

  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  const now = new Date().toISOString();
  task.status = success ? 'completed' : 'failed';
  task.completedAt = now;
  task.updatedAt = now;

  // Calculate actual time
  const startTime = new Date(task.updatedAt).getTime();
  const endTime = new Date(now).getTime();
  task.actualTime = Math.round((endTime - startTime) / 60000); // minutes

  // Update metrics
  if (success) {
    state.metrics.completedTasks++;
  } else {
    state.metrics.failedTasks++;
  }

  // Update agent metrics
  if (task.assignee) {
    const agent = state.agents[task.assignee];
    agent.status = 'ready';
    agent.currentTask = undefined;
    if (success) {
      agent.metrics.tasksCompleted++;
    } else {
      agent.metrics.tasksFailed++;
    }
    // Update average task time
    const totalTasks = agent.metrics.tasksCompleted + agent.metrics.tasksFailed;
    agent.metrics.averageTaskTime =
      (agent.metrics.averageTaskTime * (totalTasks - 1) + (task.actualTime || 0) * 60) / totalTasks;
  }

  state.eventLog.push(createEvent(
    success ? 'TASK_COMPLETED' : 'TASK_FAILED',
    task.assignee || 'system',
    { taskId, actualTime: task.actualTime }
  ));

  await saveState(state);
  return task;
}

export async function getTask(taskId: string): Promise<Task | undefined> {
  const state = await loadState();
  return state.tasks[taskId];
}

export async function getPendingTasks(): Promise<Task[]> {
  const state = await loadState();
  return Object.values(state.tasks)
    .filter(t => t.status === 'pending')
    .sort((a, b) => {
      // Sort by priority then by creation time
      const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
}

// =============================================================================
// Event Operations
// =============================================================================

function createEvent(type: EventType, agent: string, data: Record<string, unknown>): Event {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    agent,
    data,
    timestamp: new Date().toISOString(),
  };
}

export async function logEvent(type: EventType, agent: string, data: Record<string, unknown>): Promise<void> {
  const state = await loadState();
  state.eventLog.push(createEvent(type, agent, data));
  await saveState(state);
}

export async function getRecentEvents(limit: number = 50): Promise<Event[]> {
  const state = await loadState();
  return state.eventLog.slice(-limit);
}

// =============================================================================
// Metrics
// =============================================================================

export async function updateMetrics(): Promise<SystemMetrics> {
  const state = await loadState();

  // Calculate throughput (tasks per hour)
  const uptime = (Date.now() - new Date(state.startedAt).getTime()) / 1000;
  const hours = uptime / 3600;
  state.metrics.throughputPerHour = hours > 0 ? state.metrics.completedTasks / hours : 0;
  state.metrics.uptime = uptime;

  // Calculate average task time
  const completedTasks = Object.values(state.tasks).filter(t => t.completedAt);
  if (completedTasks.length > 0) {
    const totalTime = completedTasks.reduce((sum, t) => sum + (t.actualTime || 0), 0);
    state.metrics.averageTaskTime = totalTime / completedTasks.length;
  }

  await saveState(state);
  return state.metrics;
}

export async function getMetrics(): Promise<SystemMetrics> {
  return updateMetrics();
}

// =============================================================================
// Snapshot & Recovery
// =============================================================================

export async function createSnapshot(): Promise<string> {
  const state = await loadState();
  const snapshotId = `snapshot_${Date.now()}`;
  const snapshotPath = path.join(path.dirname(STATE_FILE), 'snapshots', `${snapshotId}.json`);

  await fs.mkdir(path.dirname(snapshotPath), { recursive: true });
  await fs.writeFile(snapshotPath, JSON.stringify(state, null, 2));

  state.eventLog.push(createEvent('STATE_SNAPSHOT', 'system', { snapshotId, path: snapshotPath }));
  await saveState(state);

  return snapshotId;
}

export async function restoreFromSnapshot(snapshotId: string): Promise<void> {
  const snapshotPath = path.join(path.dirname(STATE_FILE), 'snapshots', `${snapshotId}.json`);
  const content = await fs.readFile(snapshotPath, 'utf-8');
  const state = JSON.parse(content) as A2AState;

  // Add restoration event
  state.eventLog.push(createEvent('STATE_SNAPSHOT', 'system', { restored: true, snapshotId }));

  await saveState(state);
}

// =============================================================================
// CLI Interface
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'status':
      const agents = await getAllAgentStatuses();
      console.log(JSON.stringify(agents, null, 2));
      break;

    case 'metrics':
      const metrics = await getMetrics();
      console.log(JSON.stringify(metrics, null, 2));
      break;

    case 'events':
      const limit = parseInt(args[1]) || 20;
      const events = await getRecentEvents(limit);
      console.log(JSON.stringify(events, null, 2));
      break;

    case 'snapshot':
      const snapshotId = await createSnapshot();
      console.log(`Snapshot created: ${snapshotId}`);
      break;

    case 'create-task':
      const task = await createTask(
        args[1] || 'New Task',
        (args[2] as TaskType) || 'feature',
        (args[3] as TaskPriority) || 'P2'
      );
      console.log(`Task created: ${task.id}`);
      break;

    default:
      console.log('A2A State Management');
      console.log('Usage: npx tsx src/state.ts <command>');
      console.log('');
      console.log('Commands:');
      console.log('  status              Show all agent statuses');
      console.log('  metrics             Show system metrics');
      console.log('  events [limit]      Show recent events');
      console.log('  snapshot            Create state snapshot');
      console.log('  create-task <title> <type> <priority>');
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
