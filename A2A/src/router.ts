/**
 * A2A Smart Routing Module
 * =========================
 * タスク特性に応じた動的ルーティング
 */

import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

// =============================================================================
// Types
// =============================================================================

export type TaskType = 'feature' | 'bugfix' | 'refactor' | 'docs' | 'hotfix' | 'test';
export type TaskComplexity = 'trivial' | 'simple' | 'medium' | 'complex';
export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3';
export type AgentRole = 'conductor' | 'codegen' | 'review' | 'pr' | 'deploy' | 'test';

export interface TaskClassification {
  type: TaskType;
  complexity: TaskComplexity;
  priority: TaskPriority;
  estimatedTime: number; // minutes
  requiresReview: boolean;
  requiresDeploy: boolean;
  tags: string[];
}

export interface RouteDecision {
  flow: AgentRole[];
  skipReview: boolean;
  skipDeploy: boolean;
  parallelizable: boolean;
  estimatedDuration: number;
  reason: string;
}

export interface Agent {
  name: string;
  role: AgentRole;
  paneId: string;
  status: 'ready' | 'busy' | 'offline';
  currentLoad: number; // 0-100
  specialties: string[];
  averageTaskTime: number;
}

export interface RoutingConfig {
  enableFastTrack: boolean; // Skip review for trivial tasks
  enableParallelReview: boolean;
  maxReviewers: number;
  hotfixDirectDeploy: boolean;
  loadBalancing: 'round-robin' | 'least-loaded' | 'specialty';
}

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_CONFIG: RoutingConfig = {
  enableFastTrack: true,
  enableParallelReview: true,
  maxReviewers: 2,
  hotfixDirectDeploy: false, // Safety first
  loadBalancing: 'least-loaded',
};

// =============================================================================
// Task Classification
// =============================================================================

export function classifyTask(
  title: string,
  description: string = '',
  labels: string[] = []
): TaskClassification {
  const text = `${title} ${description}`.toLowerCase();

  // Determine type
  let type: TaskType = 'feature';
  if (labels.includes('bug') || text.includes('fix') || text.includes('bug')) {
    type = 'bugfix';
  } else if (labels.includes('hotfix') || text.includes('hotfix') || text.includes('urgent')) {
    type = 'hotfix';
  } else if (text.includes('refactor') || text.includes('cleanup')) {
    type = 'refactor';
  } else if (text.includes('doc') || text.includes('readme') || text.includes('comment')) {
    type = 'docs';
  } else if (text.includes('test') || text.includes('spec')) {
    type = 'test';
  }

  // Determine complexity
  let complexity: TaskComplexity = 'medium';
  const wordCount = text.split(/\s+/).length;

  if (labels.includes('trivial') || wordCount < 10) {
    complexity = 'trivial';
  } else if (labels.includes('simple') || wordCount < 30) {
    complexity = 'simple';
  } else if (labels.includes('complex') || wordCount > 100) {
    complexity = 'complex';
  }

  // Determine priority
  let priority: TaskPriority = 'P2';
  if (labels.includes('P0') || labels.includes('critical') || type === 'hotfix') {
    priority = 'P0';
  } else if (labels.includes('P1') || labels.includes('high')) {
    priority = 'P1';
  } else if (labels.includes('P3') || labels.includes('low')) {
    priority = 'P3';
  }

  // Estimate time based on complexity
  const timeEstimates: Record<TaskComplexity, number> = {
    trivial: 5,
    simple: 15,
    medium: 45,
    complex: 120,
  };

  // Determine if review/deploy needed
  const requiresReview = complexity !== 'trivial' && type !== 'docs';
  const requiresDeploy = type !== 'docs' && type !== 'test' && type !== 'refactor';

  // Extract tags
  const tags = labels.filter(l => !['P0', 'P1', 'P2', 'P3', 'bug', 'feature'].includes(l));

  return {
    type,
    complexity,
    priority,
    estimatedTime: timeEstimates[complexity],
    requiresReview,
    requiresDeploy,
    tags,
  };
}

// =============================================================================
// Routing Logic
// =============================================================================

export function routeTask(
  classification: TaskClassification,
  config: RoutingConfig = DEFAULT_CONFIG
): RouteDecision {
  const flow: AgentRole[] = [];
  let reason = '';

  // Always start with conductor assigning to codegen
  flow.push('codegen');

  // Handle different scenarios
  if (classification.type === 'hotfix' && classification.priority === 'P0') {
    // Emergency hotfix path
    if (config.hotfixDirectDeploy) {
      flow.push('deploy');
      reason = 'P0 hotfix: direct deployment path';
    } else {
      flow.push('review', 'pr', 'deploy');
      reason = 'P0 hotfix: expedited review required';
    }
  } else if (classification.type === 'docs') {
    // Documentation changes
    flow.push('pr');
    reason = 'Documentation: review optional';
  } else if (classification.complexity === 'trivial' && config.enableFastTrack) {
    // Fast track for trivial changes
    flow.push('pr');
    if (classification.requiresDeploy) {
      flow.push('deploy');
    }
    reason = 'Trivial change: fast-track enabled';
  } else if (classification.complexity === 'complex') {
    // Complex changes need thorough review
    flow.push('review');
    if (config.enableParallelReview && config.maxReviewers > 1) {
      // Add second reviewer for complex tasks
      flow.push('review');
    }
    flow.push('pr');
    if (classification.requiresDeploy) {
      flow.push('deploy');
    }
    reason = 'Complex change: multi-stage review';
  } else {
    // Standard flow
    if (classification.requiresReview) {
      flow.push('review');
    }
    flow.push('pr');
    if (classification.requiresDeploy) {
      flow.push('deploy');
    }
    reason = 'Standard flow';
  }

  // Calculate estimated duration
  const stepDurations: Record<AgentRole, number> = {
    conductor: 1,
    codegen: classification.estimatedTime,
    review: Math.ceil(classification.estimatedTime * 0.3),
    pr: 5,
    deploy: 10,
    test: Math.ceil(classification.estimatedTime * 0.5),
  };

  const estimatedDuration = flow.reduce((sum, role) => sum + (stepDurations[role] || 5), 0);

  return {
    flow,
    skipReview: !flow.includes('review'),
    skipDeploy: !flow.includes('deploy'),
    parallelizable: classification.complexity !== 'complex',
    estimatedDuration,
    reason,
  };
}

// =============================================================================
// Load Balancing
// =============================================================================

export function selectAgent(
  role: AgentRole,
  availableAgents: Agent[],
  config: RoutingConfig
): Agent | null {
  const candidates = availableAgents.filter(a => a.role === role && a.status === 'ready');

  if (candidates.length === 0) {
    // Fallback to busy agents
    const busyCandidates = availableAgents.filter(a => a.role === role && a.status === 'busy');
    if (busyCandidates.length === 0) return null;
    return busyCandidates[0];
  }

  switch (config.loadBalancing) {
    case 'round-robin':
      // Simple round-robin (would need state for proper implementation)
      return candidates[0];

    case 'least-loaded':
      // Select agent with lowest load
      return candidates.reduce((min, a) =>
        a.currentLoad < min.currentLoad ? a : min
      );

    case 'specialty':
      // Would need task tags to match specialties
      return candidates[0];

    default:
      return candidates[0];
  }
}

// =============================================================================
// Task Queue
// =============================================================================

interface QueuedTask {
  id: string;
  classification: TaskClassification;
  route: RouteDecision;
  currentStep: number;
  startedAt?: string;
}

class TaskQueue {
  private queue: QueuedTask[] = [];
  private inProgress: Map<string, QueuedTask> = new Map();

  enqueue(task: QueuedTask): void {
    // Insert based on priority
    const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
    const insertIndex = this.queue.findIndex(
      t => priorityOrder[t.classification.priority] > priorityOrder[task.classification.priority]
    );

    if (insertIndex === -1) {
      this.queue.push(task);
    } else {
      this.queue.splice(insertIndex, 0, task);
    }
  }

  dequeue(): QueuedTask | undefined {
    return this.queue.shift();
  }

  peek(): QueuedTask | undefined {
    return this.queue[0];
  }

  startTask(taskId: string): void {
    const task = this.queue.find(t => t.id === taskId);
    if (task) {
      this.queue = this.queue.filter(t => t.id !== taskId);
      task.startedAt = new Date().toISOString();
      this.inProgress.set(taskId, task);
    }
  }

  completeStep(taskId: string): AgentRole | null {
    const task = this.inProgress.get(taskId);
    if (!task) return null;

    task.currentStep++;
    if (task.currentStep >= task.route.flow.length) {
      this.inProgress.delete(taskId);
      return null;
    }

    return task.route.flow[task.currentStep];
  }

  getStats(): { pending: number; inProgress: number } {
    return {
      pending: this.queue.length,
      inProgress: this.inProgress.size,
    };
  }
}

// =============================================================================
// A2A Message Routing
// =============================================================================

export function generateRoutingCommand(
  fromAgent: string,
  toAgent: string,
  taskId: string,
  action: string
): string {
  const agentPanes: Record<string, string> = {
    shikiroon: process.env.MIYABI_CONDUCTOR_PANE || '%101',
    kaede: process.env.MIYABI_CODEGEN_PANE || '%102',
    sakura: process.env.MIYABI_REVIEW_PANE || '%103',
    tsubaki: process.env.MIYABI_PR_PANE || '%104',
    botan: process.env.MIYABI_DEPLOY_PANE || '%105',
  };

  const targetPane = agentPanes[toAgent] || '%101';
  const message = `[${fromAgent}→${toAgent}] ${action}: Task ${taskId}`;

  return `tmux send-keys -t ${targetPane} '${message}' && sleep 0.5 && tmux send-keys -t ${targetPane} Enter`;
}

export function routeToNextAgent(
  currentAgent: string,
  route: RouteDecision,
  currentStep: number,
  taskId: string
): string | null {
  if (currentStep >= route.flow.length - 1) {
    return null; // Task complete
  }

  const nextRole = route.flow[currentStep + 1];
  const roleToAgent: Record<AgentRole, string> = {
    conductor: 'shikiroon',
    codegen: 'kaede',
    review: 'sakura',
    pr: 'tsubaki',
    deploy: 'botan',
    test: 'sakura', // Use sakura for testing too
  };

  const nextAgent = roleToAgent[nextRole];
  const action = nextRole === 'review' ? 'レビュー依頼' :
                 nextRole === 'pr' ? 'PR作成依頼' :
                 nextRole === 'deploy' ? 'デプロイ依頼' : 'タスク';

  return generateRoutingCommand(currentAgent, nextAgent, taskId, action);
}

// =============================================================================
// CLI Interface
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'classify': {
      const title = args[1] || 'Fix bug in authentication';
      const labels = args.slice(2);
      const classification = classifyTask(title, '', labels);
      console.log('Classification:', JSON.stringify(classification, null, 2));
      break;
    }

    case 'route': {
      const title = args[1] || 'Add new feature';
      const labels = args.slice(2);
      const classification = classifyTask(title, '', labels);
      const route = routeTask(classification);
      console.log('Classification:', JSON.stringify(classification, null, 2));
      console.log('Route:', JSON.stringify(route, null, 2));
      break;
    }

    case 'command': {
      const from = args[1] || 'kaede';
      const to = args[2] || 'sakura';
      const taskId = args[3] || 'task_001';
      const action = args[4] || 'レビュー依頼';
      const cmd = generateRoutingCommand(from, to, taskId, action);
      console.log('Command:', cmd);
      break;
    }

    default:
      console.log('A2A Smart Router');
      console.log('');
      console.log('Usage: npx tsx src/router.ts <command> [args]');
      console.log('');
      console.log('Commands:');
      console.log('  classify <title> [labels...]  Classify a task');
      console.log('  route <title> [labels...]     Get routing decision');
      console.log('  command <from> <to> <taskId> <action>  Generate routing command');
      console.log('');
      console.log('Examples:');
      console.log('  npx tsx src/router.ts classify "Fix login bug" bug P1');
      console.log('  npx tsx src/router.ts route "Add dark mode" feature P2');
  }
}

if (require.main === module) {
  main().catch(console.error);
}
