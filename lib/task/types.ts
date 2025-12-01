/**
 * Task API Types for Miyabi
 * Issue #1214: ChatGPT UI から Miyabi にタスク指示して自動実行する機能
 */

// Task Status
export type TaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

// Task Priority
export type TaskPriority = 'low' | 'normal' | 'high' | 'critical';

// Agent Types for Task Execution
export type AgentType = 
  | 'codegen'      // カエデ - コード生成
  | 'review'       // サクラ - レビュー
  | 'pr'           // ツバキ - PR管理
  | 'coordinator'  // しきるん - 全体統括
  | 'deploy'       // ボタン - デプロイ
  | 'test';        // テスト実行

// Task Request (POST /api/v1/tasks)
export interface TaskRequest {
  /** 自然言語によるタスク指示 */
  instruction: string;
  
  /** 対象リポジトリ (owner/repo形式) */
  repository: string;
  
  /** オプション設定 */
  options?: TaskOptions;
}

export interface TaskOptions {
  /** PR作成後に自動マージするか (デフォルト: false) */
  auto_merge?: boolean;
  
  /** 完了時に通知するか (デフォルト: true) */
  notify?: boolean;
  
  /** タスク優先度 */
  priority?: TaskPriority;
  
  /** ターゲットブランチ (デフォルト: main) */
  target_branch?: string;
  
  /** レビュー必須か */
  require_review?: boolean;
  
  /** コールバックURL */
  callback_url?: string;
}

// Task Response
export interface TaskResponse {
  /** タスクID (UUID) */
  task_id: string;
  
  /** ステータス */
  status: TaskStatus;
  
  /** 推定完了時間（秒） */
  estimated_time?: number;
  
  /** 作成日時 */
  created_at: string;
  
  /** 更新日時 */
  updated_at: string;
  
  /** 結果 (完了時のみ) */
  result?: TaskResult;
  
  /** エラー情報 (失敗時のみ) */
  error?: TaskError;
  
  /** 進捗情報 */
  progress?: TaskProgress;
}

export interface TaskResult {
  /** 作成されたPR URL */
  pr_url?: string;
  
  /** 変更されたファイル一覧 */
  changes?: FileChange[];
  
  /** レビューステータス */
  review_status?: 'pending' | 'approved' | 'changes_requested';
  
  /** マージステータス */
  merge_status?: 'pending' | 'merged' | 'blocked';
  
  /** 生成されたコミット一覧 */
  commits?: CommitInfo[];
}

export interface FileChange {
  /** ファイルパス */
  path: string;
  
  /** 変更タイプ */
  type: 'added' | 'modified' | 'deleted';
  
  /** 追加行数 */
  additions: number;
  
  /** 削除行数 */
  deletions: number;
}

export interface CommitInfo {
  /** コミットSHA */
  sha: string;
  
  /** コミットメッセージ */
  message: string;
  
  /** コミット日時 */
  date: string;
}

export interface TaskError {
  /** エラーコード */
  code: string;
  
  /** エラーメッセージ */
  message: string;
  
  /** 詳細情報 */
  details?: Record<string, unknown>;
}

export interface TaskProgress {
  /** 現在のステップ */
  current_step: string;
  
  /** 全ステップ数 */
  total_steps: number;
  
  /** 完了したステップ数 */
  completed_steps: number;
  
  /** 進捗率 (0-100) */
  percentage: number;
  
  /** 現在実行中のAgent */
  current_agent?: AgentType;
}

// Internal Task Model (DB用)
export interface Task {
  id: string;
  instruction: string;
  repository: string;
  status: TaskStatus;
  priority: TaskPriority;
  options: TaskOptions;
  result?: TaskResult;
  error?: TaskError;
  progress?: TaskProgress;
  
  // メタデータ
  api_key_id: string;
  created_at: Date;
  updated_at: Date;
  started_at?: Date;
  completed_at?: Date;
  
  // ワークフロー
  workflow_steps: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  agent: AgentType;
  status: TaskStatus;
  started_at?: Date;
  completed_at?: Date;
  output?: Record<string, unknown>;
  error?: TaskError;
}

// API Key for Authentication
export interface ApiKey {
  id: string;
  key_hash: string;
  name: string;
  owner_id: string;
  permissions: string[];
  rate_limit: number;
  created_at: Date;
  last_used_at?: Date;
  expires_at?: Date;
}

// Validation Types
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}
