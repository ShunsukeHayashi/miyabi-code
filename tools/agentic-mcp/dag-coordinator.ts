#!/usr/bin/env node
/**
 * DAG Coordinator - 依存関係解析・Agent並列割り当てシステム
 *
 * 機能:
 * 1. Issue/Todo解析
 * 2. DAG (Directed Acyclic Graph) 構築
 * 3. Agent並列割り当て（バッティング回避）
 * 4. 実行順序最適化
 */

import { Octokit } from '@octokit/rest';

interface Task {
  id: string;
  issueNumber?: number;
  todoId?: string;
  title: string;
  description: string;
  agent: AgentType;
  dependencies: string[];
  estimatedTime: number; // minutes
  priority: Priority;
  status: TaskStatus;
  files: string[];
}

type AgentType = 'CodeGenAgent' | 'ReviewAgent' | 'IssueAgent' | 'PRAgent' | 'DeploymentAgent';
type Priority = 'P0-緊急' | 'P1-高' | 'P2-中' | 'P3-低';
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

interface DAGNode {
  task: Task;
  depth: number;
  canRunInParallel: boolean;
}

interface ExecutionPlan {
  batches: Task[][];
  totalTime: number;
  parallelism: number;
}

export class DAGCoordinator {
  private octokit: Octokit;
  private repository: string;
  private owner: string;

  constructor(githubToken: string, repository: string) {
    this.octokit = new Octokit({ auth: githubToken });
    const [owner, repo] = repository.split('/');
    this.owner = owner;
    this.repository = repo;
  }

  /**
   * Issue/Todoから実行計画を生成
   */
  async generateExecutionPlan(issueNumbers: number[]): Promise<ExecutionPlan> {
    // 1. Issueデータ取得
    const tasks = await this.fetchTasks(issueNumbers);

    // 2. DAG構築
    const dag = this.buildDAG(tasks);

    // 3. 並列実行バッチ生成
    const batches = this.generateBatches(dag);

    // 4. 実行時間計算
    const totalTime = this.calculateTotalTime(batches);

    return {
      batches,
      totalTime,
      parallelism: Math.max(...batches.map(b => b.length))
    };
  }

  /**
   * Issueデータ取得
   */
  private async fetchTasks(issueNumbers: number[]): Promise<Task[]> {
    const tasks: Task[] = [];

    for (const issueNumber of issueNumbers) {
      try {
        const { data: issue } = await this.octokit.issues.get({
          owner: this.owner,
          repo: this.repository,
          issue_number: issueNumber
        });

        // Labelから優先度・Agent種別を判定
        const labels = issue.labels.map(l => typeof l === 'string' ? l : l.name || '');
        const priority = this.extractPriority(labels);
        const agent = this.determineAgent(labels, issue.title, issue.body || '');

        // 依存関係をIssue本文から抽出
        const dependencies = this.extractDependencies(issue.body || '');

        // ファイル変更予測（タイトル・本文から推測）
        const files = this.predictFiles(issue.title, issue.body || '');

        tasks.push({
          id: `issue-${issueNumber}`,
          issueNumber,
          title: issue.title,
          description: issue.body || '',
          agent,
          dependencies,
          estimatedTime: this.estimateTime(agent, issue.body || ''),
          priority,
          status: 'pending',
          files
        });
      } catch (error) {
        console.error(`Error fetching issue #${issueNumber}:`, error);
      }
    }

    return tasks;
  }

  /**
   * DAG構築
   */
  private buildDAG(tasks: Task[]): DAGNode[] {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const nodes: DAGNode[] = [];

    // 深さ優先探索でDepth計算
    const calculateDepth = (task: Task, visited: Set<string>): number => {
      if (visited.has(task.id)) {
        throw new Error(`Circular dependency detected: ${task.id}`);
      }
      visited.add(task.id);

      if (task.dependencies.length === 0) {
        return 0;
      }

      let maxDepth = 0;
      for (const depId of task.dependencies) {
        const depTask = taskMap.get(depId);
        if (depTask) {
          maxDepth = Math.max(maxDepth, calculateDepth(depTask, new Set(visited)) + 1);
        }
      }
      return maxDepth;
    };

    for (const task of tasks) {
      const depth = calculateDepth(task, new Set());
      nodes.push({
        task,
        depth,
        canRunInParallel: true
      });
    }

    return nodes.sort((a, b) => a.depth - b.depth);
  }

  /**
   * 並列実行バッチ生成（ファイルバッティング回避）
   */
  private generateBatches(nodes: DAGNode[]): Task[][] {
    const batches: Task[][] = [];
    const maxDepth = Math.max(...nodes.map(n => n.depth), 0);

    for (let depth = 0; depth <= maxDepth; depth++) {
      const nodesAtDepth = nodes.filter(n => n.depth === depth);

      // ファイル競合を回避してバッチ分割
      const batch = this.splitByFileConflict(nodesAtDepth.map(n => n.task));
      batches.push(...batch);
    }

    return batches;
  }

  /**
   * ファイル競合回避バッチ分割
   */
  private splitByFileConflict(tasks: Task[]): Task[][] {
    const batches: Task[][] = [];
    const remaining = [...tasks];

    while (remaining.length > 0) {
      const batch: Task[] = [];
      const usedFiles = new Set<string>();

      for (let i = remaining.length - 1; i >= 0; i--) {
        const task = remaining[i];
        const hasConflict = task.files.some(f => usedFiles.has(f));

        if (!hasConflict) {
          batch.push(task);
          task.files.forEach(f => usedFiles.add(f));
          remaining.splice(i, 1);
        }
      }

      if (batch.length > 0) {
        batches.push(batch);
      } else {
        // 全タスクが競合する場合は1つずつ実行
        batches.push([remaining.shift()!]);
      }
    }

    return batches;
  }

  /**
   * 総実行時間計算
   */
  private calculateTotalTime(batches: Task[][]): number {
    return batches.reduce((total, batch) => {
      const maxTime = Math.max(...batch.map(t => t.estimatedTime));
      return total + maxTime;
    }, 0);
  }

  /**
   * 優先度抽出
   */
  private extractPriority(labels: string[]): Priority {
    if (labels.some(l => l.includes('P0') || l.includes('緊急'))) return 'P0-緊急';
    if (labels.some(l => l.includes('P1') || l.includes('高'))) return 'P1-高';
    if (labels.some(l => l.includes('P3') || l.includes('低'))) return 'P3-低';
    return 'P2-中';
  }

  /**
   * Agent種別判定
   */
  private determineAgent(labels: string[], title: string, body: string): AgentType {
    const text = `${labels.join(' ')} ${title} ${body}`.toLowerCase();

    if (labels.some(l => l.includes('CodeGenAgent')) || text.includes('実装')) return 'CodeGenAgent';
    if (labels.some(l => l.includes('ReviewAgent')) || text.includes('レビュー')) return 'ReviewAgent';
    if (labels.some(l => l.includes('PRAgent')) || text.includes('pr作成')) return 'PRAgent';
    if (labels.some(l => l.includes('DeploymentAgent')) || text.includes('デプロイ')) return 'DeploymentAgent';

    return 'IssueAgent'; // デフォルト
  }

  /**
   * 依存関係抽出
   */
  private extractDependencies(body: string): string[] {
    const deps: string[] = [];

    // "depends on #123" or "blocked by #456" パターン
    const depPattern = /(?:depends on|blocked by|requires)\s+#(\d+)/gi;
    let match;
    while ((match = depPattern.exec(body)) !== null) {
      deps.push(`issue-${match[1]}`);
    }

    return deps;
  }

  /**
   * ファイル予測
   */
  private predictFiles(title: string, body: string): string[] {
    const files: string[] = [];
    const text = `${title} ${body}`;

    // ファイルパス抽出 (src/*, *.tsx, *.ts 等)
    const filePattern = /(?:src\/[\w\/\-\.]+|[\w\-]+\.(?:tsx?|jsx?|json|yml))/g;
    const matches = text.match(filePattern);
    if (matches) {
      files.push(...matches);
    }

    return [...new Set(files)];
  }

  /**
   * 実行時間推定
   */
  private estimateTime(agent: AgentType, description: string): number {
    const baseTime: Record<AgentType, number> = {
      'CodeGenAgent': 30,
      'ReviewAgent': 20,
      'IssueAgent': 5,
      'PRAgent': 15,
      'DeploymentAgent': 120
    };

    // 複雑度から時間調整（ざっくり）
    const complexity = description.length / 500;
    return Math.round(baseTime[agent] * (1 + complexity * 0.5));
  }

  /**
   * 実行計画をMarkdown出力
   */
  formatExecutionPlan(plan: ExecutionPlan): string {
    let output = `# 🎯 Agent並列実行計画\n\n`;
    output += `**総実行時間**: ${plan.totalTime}分\n`;
    output += `**最大並列度**: ${plan.parallelism}\n`;
    output += `**バッチ数**: ${plan.batches.length}\n\n`;

    plan.batches.forEach((batch, index) => {
      output += `## Batch ${index + 1}\n\n`;
      output += `**並列タスク数**: ${batch.length}\n\n`;

      batch.forEach(task => {
        output += `### ${task.title}\n`;
        output += `- **Issue**: #${task.issueNumber}\n`;
        output += `- **Agent**: ${task.agent}\n`;
        output += `- **優先度**: ${task.priority}\n`;
        output += `- **推定時間**: ${task.estimatedTime}分\n`;
        output += `- **依存**: ${task.dependencies.length > 0 ? task.dependencies.join(', ') : 'なし'}\n`;
        output += `- **ファイル**: ${task.files.length > 0 ? task.files.join(', ') : '未特定'}\n\n`;
      });
    });

    return output;
  }
}

// CLI実行
if (require.main === module) {
  const args = process.argv.slice(2);
  const issueNumbers = args.map(n => parseInt(n)).filter(n => !isNaN(n));

  if (issueNumbers.length === 0) {
    console.error('Usage: node dag-coordinator.js <issue1> <issue2> ...');
    process.exit(1);
  }

  const coordinator = new DAGCoordinator(
    process.env.GITHUB_TOKEN || '',
    process.env.GITHUB_REPOSITORY || ''
  );

  coordinator.generateExecutionPlan(issueNumbers)
    .then(plan => {
      console.log(coordinator.formatExecutionPlan(plan));
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}
