#!/usr/bin/env node
/**
 * Task Graph Generator - DAG形式のタスクグラフを生成
 *
 * Input: Intent Analysis + API Selection
 * Output: DAG Task Graph with dependencies
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * タスクグラフを生成
 * @param {Object} intentAnalysis - Intent analysis result
 * @param {Object} apiSelection - API selection result
 * @returns {Promise<Object>} Task graph (DAG)
 */
export async function generateTaskGraph(intentAnalysis, apiSelection) {
  console.log('\n📊 Generating Task Graph (DAG)...\n');

  // Phase分解
  const phases = definePhases(intentAnalysis, apiSelection);

  // タスク生成
  const tasks = generateTasks(phases, apiSelection);

  // 依存関係解決
  const dependencies = resolveDependencies(tasks);

  // 実行順序決定（トポロジカルソート）
  const executionOrder = topologicalSort(tasks, dependencies);

  // Critical Path分析
  const criticalPath = analyzeCriticalPath(tasks, dependencies);

  const taskGraph = {
    project_name: generateProjectName(intentAnalysis),
    intent_type: intentAnalysis.intent_type,
    total_tasks: tasks.length,
    total_phases: phases.length,
    phases: phases,
    tasks: tasks,
    dependencies: dependencies,
    execution_order: executionOrder,
    critical_path: criticalPath,
    estimated_duration: estimateDuration(tasks),
    generated_at: new Date().toISOString(),
  };

  console.log('✅ Task Graph Generated:\n');
  console.log(`📊 Total Tasks: ${tasks.length}`);
  console.log(`📅 Total Phases: ${phases.length}`);
  console.log(`⏱️  Estimated Duration: ${taskGraph.estimated_duration} hours\n`);

  return taskGraph;
}

/**
 * 開発フェーズを定義
 */
function definePhases(intentAnalysis, apiSelection) {
  return [
    {
      id: 'P1',
      name: 'Setup & Configuration',
      description: 'Project initialization and environment setup',
      order: 1,
    },
    {
      id: 'P2',
      name: 'Core Implementation',
      description: 'Implement main business logic and API integrations',
      order: 2,
    },
    {
      id: 'P3',
      name: 'UI & Interaction',
      description: 'Build user interface and interactive components',
      order: 3,
    },
    {
      id: 'P4',
      name: 'Testing & Validation',
      description: 'Test all functionalities and validate integration',
      order: 4,
    },
    {
      id: 'P5',
      name: 'Deployment',
      description: 'Deploy to production environment',
      order: 5,
    },
  ];
}

/**
 * タスクを生成
 */
function generateTasks(phases, apiSelection) {
  const tasks = [];
  let taskId = 1;

  // Phase 1: Setup & Configuration
  tasks.push({
    id: `T${taskId++}`,
    phase: 'P1',
    name: 'Initialize Project Structure',
    description: 'Create directory structure and package.json',
    type: 'setup',
    agent: 'CodeGenAgent',
    estimated_hours: 0.5,
  });

  tasks.push({
    id: `T${taskId++}`,
    phase: 'P1',
    name: 'Setup Environment Variables',
    description: 'Create .env file with Lark credentials',
    type: 'config',
    agent: 'CodeGenAgent',
    estimated_hours: 0.25,
  });

  tasks.push({
    id: `T${taskId++}`,
    phase: 'P1',
    name: 'Install Dependencies',
    description: 'npm install required packages',
    type: 'setup',
    agent: 'DeploymentAgent',
    estimated_hours: 0.25,
  });

  // Phase 2: Core Implementation - API Wrappers
  for (const api of apiSelection.selected_apis) {
    tasks.push({
      id: `T${taskId++}`,
      phase: 'P2',
      name: `Implement ${api}`,
      description: `Generate wrapper for ${api}`,
      type: 'code_gen',
      agent: 'CodeGenAgent',
      api_name: api,
      estimated_hours: 1.0,
    });
  }

  // Phase 2: Event Subscription Handler
  tasks.push({
    id: `T${taskId++}`,
    phase: 'P2',
    name: 'Create Event Subscription Handler',
    description: 'Handle incoming events from Lark',
    type: 'code_gen',
    agent: 'CodeGenAgent',
    estimated_hours: 2.0,
  });

  // Phase 3: UI & Interactive Cards
  tasks.push({
    id: `T${taskId++}`,
    phase: 'P3',
    name: 'Design Interactive Cards',
    description: 'Create card JSON definitions for UI',
    type: 'design',
    agent: 'DesignAgent',
    estimated_hours: 1.5,
  });

  tasks.push({
    id: `T${taskId++}`,
    phase: 'P3',
    name: 'Implement Message Handlers',
    description: 'Handle user interactions from cards',
    type: 'code_gen',
    agent: 'CodeGenAgent',
    estimated_hours: 1.5,
  });

  // Phase 4: Testing
  tasks.push({
    id: `T${taskId++}`,
    phase: 'P4',
    name: 'Generate Unit Tests',
    description: 'Auto-generate test suites',
    type: 'testing',
    agent: 'TestingAgent',
    estimated_hours: 1.0,
  });

  tasks.push({
    id: `T${taskId++}`,
    phase: 'P4',
    name: 'Run Integration Tests',
    description: 'Test API integrations',
    type: 'testing',
    agent: 'TestingAgent',
    estimated_hours: 1.0,
  });

  tasks.push({
    id: `T${taskId++}`,
    phase: 'P4',
    name: 'Event Simulation Testing',
    description: 'Simulate Lark events and validate responses',
    type: 'testing',
    agent: 'TestingAgent',
    estimated_hours: 0.5,
  });

  // Phase 5: Deployment
  tasks.push({
    id: `T${taskId++}`,
    phase: 'P5',
    name: 'Setup Lark Application',
    description: 'Configure app in Lark Open Platform',
    type: 'deployment',
    agent: 'DeploymentAgent',
    estimated_hours: 0.5,
  });

  tasks.push({
    id: `T${taskId++}`,
    phase: 'P5',
    name: 'Start Tunnel Service',
    description: 'Launch ngrok tunnel',
    type: 'deployment',
    agent: 'DeploymentAgent',
    estimated_hours: 0.25,
  });

  tasks.push({
    id: `T${taskId++}`,
    phase: 'P5',
    name: 'Register Event Subscription',
    description: 'Configure webhook URL in Lark',
    type: 'deployment',
    agent: 'DeploymentAgent',
    estimated_hours: 0.5,
  });

  tasks.push({
    id: `T${taskId++}`,
    phase: 'P5',
    name: 'Configure Permissions',
    description: 'Set required permissions for APIs',
    type: 'deployment',
    agent: 'DeploymentAgent',
    estimated_hours: 0.5,
  });

  tasks.push({
    id: `T${taskId++}`,
    phase: 'P5',
    name: 'Health Check & Validation',
    description: 'Verify all systems operational',
    type: 'deployment',
    agent: 'DeploymentAgent',
    estimated_hours: 0.25,
  });

  return tasks;
}

/**
 * タスク間の依存関係を解決
 */
function resolveDependencies(tasks) {
  const dependencies = {};

  for (const task of tasks) {
    dependencies[task.id] = [];

    // Phase依存
    if (task.phase === 'P2') {
      // Phase 2 tasks depend on Phase 1 completion
      const p1Tasks = tasks.filter(t => t.phase === 'P1').map(t => t.id);
      dependencies[task.id].push(...p1Tasks);
    } else if (task.phase === 'P3') {
      // Phase 3 depends on Phase 2
      const p2Tasks = tasks.filter(t => t.phase === 'P2').map(t => t.id);
      dependencies[task.id].push(...p2Tasks);
    } else if (task.phase === 'P4') {
      // Testing depends on implementation
      const p3Tasks = tasks.filter(t => t.phase === 'P3').map(t => t.id);
      dependencies[task.id].push(...p3Tasks);
    } else if (task.phase === 'P5') {
      // Deployment depends on testing
      const p4Tasks = tasks.filter(t => t.phase === 'P4').map(t => t.id);
      dependencies[task.id].push(...p4Tasks);
    }

    // タスク固有の依存関係
    if (task.name === 'Implement Message Handlers') {
      const cardTask = tasks.find(t => t.name === 'Design Interactive Cards');
      if (cardTask) dependencies[task.id].push(cardTask.id);
    }

    if (task.name === 'Register Event Subscription') {
      const tunnelTask = tasks.find(t => t.name === 'Start Tunnel Service');
      if (tunnelTask) dependencies[task.id].push(tunnelTask.id);
    }
  }

  return dependencies;
}

/**
 * トポロジカルソート（実行順序決定）
 */
function topologicalSort(tasks, dependencies) {
  const visited = new Set();
  const result = [];

  function visit(taskId) {
    if (visited.has(taskId)) return;

    visited.add(taskId);

    const deps = dependencies[taskId] || [];
    for (const depId of deps) {
      visit(depId);
    }

    result.push(taskId);
  }

  for (const task of tasks) {
    visit(task.id);
  }

  return result;
}

/**
 * Critical Path分析
 */
function analyzeCriticalPath(tasks, dependencies) {
  // Simplified critical path = longest path through dependencies
  const taskMap = Object.fromEntries(tasks.map(t => [t.id, t]));

  function calculatePath(taskId, visited = new Set()) {
    if (visited.has(taskId)) return 0;
    visited.add(taskId);

    const task = taskMap[taskId];
    const deps = dependencies[taskId] || [];

    if (deps.length === 0) {
      return task.estimated_hours;
    }

    const maxDepPath = Math.max(...deps.map(depId => calculatePath(depId, new Set(visited))));
    return task.estimated_hours + maxDepPath;
  }

  let criticalPath = [];
  let maxDuration = 0;

  for (const task of tasks) {
    const duration = calculatePath(task.id);
    if (duration > maxDuration) {
      maxDuration = duration;
      criticalPath = [task.id];
    }
  }

  return {
    path: criticalPath,
    duration: maxDuration,
  };
}

/**
 * プロジェクト名生成
 */
function generateProjectName(intentAnalysis) {
  const intentType = intentAnalysis.intent_type;
  const timestamp = new Date().toISOString().slice(0, 10);

  const nameMap = {
    calendar_management: 'calendar-manager-bot',
    message_automation: 'message-automation-bot',
    document_management: 'doc-manager-bot',
    approval_workflow: 'approval-workflow-bot',
    data_visualization: 'data-viz-bot',
  };

  const baseName = nameMap[intentType] || 'lark-bot';
  return `${baseName}-${timestamp}`;
}

/**
 * 総所要時間を推定
 */
function estimateDuration(tasks) {
  return tasks.reduce((sum, task) => sum + task.estimated_hours, 0);
}

// CLI実行時
if (import.meta.url === `file://${process.argv[1]}`) {
  const sampleIntent = {
    intent_type: 'calendar_management',
  };

  const sampleAPISelection = {
    selected_apis: [
      'im.v1.message.create',
      'calendar.v4.calendar_event.list',
      'calendar.v4.calendar_event.create',
    ],
  };

  generateTaskGraph(sampleIntent, sampleAPISelection).then(graph => {
    console.log('\n✅ Task graph generation complete!');
    console.log(JSON.stringify(graph, null, 2));
  });
}
