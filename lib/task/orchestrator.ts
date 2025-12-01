/**
 * Task Orchestrator for Miyabi
 * Issue #1214: タスクの解析、Agent選択、ワークフロー実行を担当
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  Task,
  TaskRequest,
  TaskResponse,
  TaskStatus,
  TaskProgress,
  TaskResult,
  TaskError,
  WorkflowStep,
  AgentType,
  TaskPriority,
} from './types';

// In-memory task store (後でDB/Redisに置き換え)
const taskStore = new Map<string, Task>();

/**
 * タスク指示からワークフローステップを生成
 */
function analyzeInstruction(instruction: string): AgentType[] {
  const lowerInstruction = instruction.toLowerCase();
  const agents: AgentType[] = [];

  // キーワードに基づいてAgentを選択
  if (
    lowerInstruction.includes('実装') ||
    lowerInstruction.includes('作成') ||
    lowerInstruction.includes('追加') ||
    lowerInstruction.includes('implement') ||
    lowerInstruction.includes('create') ||
    lowerInstruction.includes('add')
  ) {
    agents.push('codegen');
  }

  if (
    lowerInstruction.includes('テスト') ||
    lowerInstruction.includes('test')
  ) {
    agents.push('test');
  }

  if (
    lowerInstruction.includes('レビュー') ||
    lowerInstruction.includes('review') ||
    lowerInstruction.includes('確認')
  ) {
    agents.push('review');
  }

  if (
    lowerInstruction.includes('pr') ||
    lowerInstruction.includes('プルリクエスト') ||
    lowerInstruction.includes('マージ')
  ) {
    agents.push('pr');
  }

  if (
    lowerInstruction.includes('デプロイ') ||
    lowerInstruction.includes('deploy') ||
    lowerInstruction.includes('リリース')
  ) {
    agents.push('deploy');
  }

  // デフォルトワークフロー: codegen -> test -> review -> pr
  if (agents.length === 0) {
    return ['codegen', 'test', 'review', 'pr'];
  }

  // coordinatorは常に最初に追加
  return ['coordinator', ...agents];
}

/**
 * ワークフローステップを生成
 */
function createWorkflowSteps(agents: AgentType[]): WorkflowStep[] {
  return agents.map((agent, index) => ({
    id: uuidv4(),
    name: getStepName(agent),
    agent,
    status: 'queued' as TaskStatus,
  }));
}

/**
 * Agent名からステップ名を取得
 */
function getStepName(agent: AgentType): string {
  const names: Record<AgentType, string> = {
    coordinator: 'タスク解析・計画',
    codegen: 'コード生成',
    test: 'テスト実行',
    review: 'コードレビュー',
    pr: 'PR作成',
    deploy: 'デプロイ',
  };
  return names[agent] || agent;
}

/**
 * タスクを作成してキューに追加
 */
export async function createTask(request: TaskRequest, apiKeyId: string): Promise<TaskResponse> {
  const taskId = uuidv4();
  const now = new Date();

  // 指示を解析してワークフローを決定
  const agents = analyzeInstruction(request.instruction);
  const workflowSteps = createWorkflowSteps(agents);

  // タスクオブジェクトを作成
  const task: Task = {
    id: taskId,
    instruction: request.instruction,
    repository: request.repository,
    status: 'queued',
    priority: request.options?.priority || 'normal',
    options: request.options || {},
    api_key_id: apiKeyId,
    created_at: now,
    updated_at: now,
    workflow_steps: workflowSteps,
    progress: {
      current_step: 'キュー待機中',
      total_steps: workflowSteps.length,
      completed_steps: 0,
      percentage: 0,
    },
  };

  // ストアに保存
  taskStore.set(taskId, task);

  // レスポンスをまず返却 (statusは'queued'のまま)
  const response = formatTaskResponse(task);

  // 非同期でタスク実行を開始 (バックグラウンド)
  // setTimeoutで遅延させてレスポンスが返った後に実行開始
  setTimeout(() => {
    executeTaskAsync(taskId).catch(console.error);
  }, 100);

  return response;
}

/**
 * タスクを取得
 */
export async function getTask(taskId: string): Promise<TaskResponse | null> {
  const task = taskStore.get(taskId);
  if (!task) return null;
  return formatTaskResponse(task);
}

/**
 * タスクをキャンセル
 */
export async function cancelTask(taskId: string): Promise<TaskResponse | null> {
  const task = taskStore.get(taskId);
  if (!task) return null;

  if (task.status === 'completed' || task.status === 'failed') {
    return null; // 完了済みはキャンセル不可
  }

  task.status = 'cancelled';
  task.updated_at = new Date();
  taskStore.set(taskId, task);

  return formatTaskResponse(task);
}

/**
 * タスク一覧を取得
 */
export async function listTasks(apiKeyId: string, limit = 20): Promise<TaskResponse[]> {
  const tasks = Array.from(taskStore.values())
    .filter((t) => t.api_key_id === apiKeyId)
    .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
    .slice(0, limit);

  return tasks.map(formatTaskResponse);
}

/**
 * タスクをレスポンス形式に変換
 */
function formatTaskResponse(task: Task): TaskResponse {
  return {
    task_id: task.id,
    status: task.status,
    estimated_time: estimateTime(task),
    created_at: task.created_at.toISOString(),
    updated_at: task.updated_at.toISOString(),
    result: task.result,
    error: task.error,
    progress: task.progress,
  };
}

/**
 * 推定完了時間を計算
 * 複雑な指示には長い推定時間を返す
 */
function estimateTime(task: Task): number {
  const baseTime = 30; // 30秒ベース
  const stepTime = 15; // 各ステップ15秒

  // 指示文の複雑さに基づいて追加時間を計算
  // 長い指示 = より複雑なタスク = より多くの時間
  const instructionLength = task.instruction.length;
  const complexityBonus = instructionLength * 2; // 1文字あたり2秒

  if (!task.progress) return baseTime + complexityBonus;

  const remainingSteps = task.progress.total_steps - task.progress.completed_steps;
  return baseTime + remainingSteps * stepTime + complexityBonus;
}

/**
 * タスクを非同期で実行
 */
async function executeTaskAsync(taskId: string): Promise<void> {
  const task = taskStore.get(taskId);
  if (!task) return;

  try {
    // ステータスを実行中に更新
    task.status = 'running';
    task.started_at = new Date();
    task.updated_at = new Date();

    // 各ワークフローステップを実行
    for (let i = 0; i < task.workflow_steps.length; i++) {
      const step = task.workflow_steps[i];

      // タスクがキャンセルされていないか確認
      if (task.status === 'cancelled') {
        break;
      }

      // ステップを実行中に更新
      step.status = 'running';
      step.started_at = new Date();
      task.progress = {
        current_step: step.name,
        total_steps: task.workflow_steps.length,
        completed_steps: i,
        percentage: Math.round((i / task.workflow_steps.length) * 100),
        current_agent: step.agent,
      };
      task.updated_at = new Date();

      // Agent実行 (TODO: 実際のAgent呼び出し)
      await executeAgent(step.agent, task);

      // ステップを完了
      step.status = 'completed';
      step.completed_at = new Date();
    }

    // タスク完了
    if (task.status !== 'cancelled') {
      task.status = 'completed';
      task.completed_at = new Date();
      task.progress = {
        current_step: '完了',
        total_steps: task.workflow_steps.length,
        completed_steps: task.workflow_steps.length,
        percentage: 100,
      };
      task.result = {
        pr_url: `https://github.com/${task.repository}/pull/999`,
        changes: [
          { path: 'src/example.ts', type: 'added', additions: 50, deletions: 0 },
        ],
        review_status: 'pending',
        merge_status: 'pending',
      };
    }

    task.updated_at = new Date();
    taskStore.set(taskId, task);

    // コールバック通知
    if (task.options.callback_url) {
      await sendCallback(task);
    }
  } catch (error) {
    // エラー処理
    task.status = 'failed';
    task.error = {
      code: 'EXECUTION_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    task.updated_at = new Date();
    taskStore.set(taskId, task);
  }
}

/**
 * Agentを実行 (TODO: 実際のAgent統合)
 */
async function executeAgent(agent: AgentType, task: Task): Promise<void> {
  // シミュレーション: 各Agentは2-5秒かかる
  const delay = 2000 + Math.random() * 3000;
  await new Promise((resolve) => setTimeout(resolve, delay));

  console.log(`[TaskOrchestrator] Agent ${agent} completed for task ${task.id}`);
}

/**
 * コールバック通知を送信
 */
async function sendCallback(task: Task): Promise<void> {
  if (!task.options.callback_url) return;

  try {
    await fetch(task.options.callback_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formatTaskResponse(task)),
    });
  } catch (error) {
    console.error('[TaskOrchestrator] Callback failed:', error);
  }
}

/**
 * タスク統計を取得
 */
export function getTaskStats(): {
  total: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
} {
  const tasks = Array.from(taskStore.values());
  return {
    total: tasks.length,
    queued: tasks.filter((t) => t.status === 'queued').length,
    running: tasks.filter((t) => t.status === 'running').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    failed: tasks.filter((t) => t.status === 'failed').length,
  };
}
