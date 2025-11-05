import { isTauriAvailable } from "./tauri-utils";

export type ErrorSeverity = "error" | "warning" | "info";

export interface ErrorInfo {
  code: string;
  title: string;
  message: string;
  actions: string[];
  severity: ErrorSeverity;
  helpUrl?: string;
}

type ErrorCatalog = Record<string, Omit<ErrorInfo, "code">>;

export const ERROR_MESSAGES: ErrorCatalog = {
  github_token_invalid: {
    title: "GitHub Token が無効です",
    message:
      "入力されたGitHub Personal Access Tokenが無効、または期限切れの可能性があります。",
    actions: [
      "Settings → GitHub Tokenを確認してください",
      "新しいTokenを生成してください: https://github.com/settings/tokens",
      "Token権限に「repo」と「workflow」が含まれているか確認してください",
    ],
    severity: "error",
  },
  github_api_rate_limit: {
    title: "GitHub API レート制限",
    message: "GitHub APIの利用上限に達しました。1時間後に再試行してください。",
    actions: [
      "1時間待機してください",
      "Personal Access Tokenを使用すると制限が緩和されます",
    ],
    severity: "warning",
  },
  repository_not_found: {
    title: "リポジトリが見つかりません",
    message:
      "指定されたGitHubリポジトリが存在しないか、アクセス権限がありません。",
    actions: [
      "Settings → Repositoryを確認してください",
      "リポジトリ名が「owner/repository」形式であることを確認してください",
      "GitHubでリポジトリが存在するか確認してください",
    ],
    severity: "error",
  },
  issue_not_found: {
    title: "Issueが見つかりません",
    message:
      "指定されたIssue番号が存在しないか、このリポジトリに属していません。",
    actions: [
      "Issue番号が正しいか確認してください",
      "GitHub上でIssueが存在するか確認してください",
      "オープンなIssueのみが一覧に表示されます",
    ],
    severity: "info",
  },
  agent_execution_failed: {
    title: "エージェント実行が失敗しました",
    message:
      "エージェントの実行中にエラーが発生しました。詳細はログを確認してください。",
    actions: [
      "ターミナルパネルで詳細ログを確認してください",
      "Issue番号が正しいか確認してください",
      "もう一度実行してみてください",
    ],
    severity: "error",
  },
  agent_timeout: {
    title: "エージェントが応答しません",
    message: "実行がタイムアウトしました。環境が正しく稼働しているか確認してください。",
    actions: [
      "tmuxセッションが動作しているか確認してください",
      "再度エージェントを実行してください",
      "問題が継続する場合はログを添付してIssueを作成してください",
    ],
    severity: "warning",
  },
  tauri_runtime_missing: {
    title: "Tauri ランタイムが必要です",
    message:
      "デスクトップ機能を利用するにはTauriランタイムでアプリを実行する必要があります。",
    actions: [
      "`npm run tauri dev` でアプリを起動してください",
      "ブラウザモードではエージェント実行機能は利用できません",
    ],
    severity: "warning",
  },
  worktree_creation_failed: {
    title: "Git Worktree を作成できませんでした",
    message:
      "Worktreeの生成に失敗しました。既存のWorktreeが残っているか、Git状態に問題があります。",
    actions: [
      "`git worktree list` で残っているWorktreeを確認してください",
      "`git worktree prune` を実行して不要なWorktreeを削除してください",
      "必要に応じて `.worktrees/` ディレクトリを手動で整理してください",
    ],
    severity: "error",
  },
  network_timeout: {
    title: "ネットワークタイムアウト",
    message: "リクエストがタイムアウトしました。通信環境を確認してから再試行してください。",
    actions: [
      "インターネット接続を確認してください",
      "VPN/Proxy設定が通信を妨げていないか確認してください",
      "数分後に再度実行してください",
    ],
    severity: "warning",
  },
  permission_denied: {
    title: "アクセス権限が不足しています",
    message:
      "必要なファイルまたはディレクトリへのアクセス権限が不足しています。権限設定を確認してください。",
    actions: [
      "対象ファイル/ディレクトリのアクセス権限を確認してください",
      "必要に応じて `chmod` などで権限を付与してください",
      "別のユーザーで実行している場合はアクセス権を統一してください",
    ],
    severity: "error",
  },
  session_conflict: {
    title: "セッションが既に存在します",
    message:
      "既存のtmuxセッションまたはエージェント実行が残っているため、新しいセッションを開始できません。",
    actions: [
      "`tmux list-sessions` で既存セッションを確認してください",
      "不要なセッションを `tmux kill-session -t <name>` で終了してください",
      "Miyabi CLIの `miyabi status --watch` で状態を確認してください",
    ],
    severity: "info",
  },
  unknown_error: {
    title: "不明なエラーが発生しました",
    message:
      "予期しないエラーが発生しました。ログを確認の上、必要に応じてIssueを作成してください。",
    actions: [
      "コンソールログを確認してください",
      "もう一度実行してみてください",
      "状況を記録してIssueを作成してください",
    ],
    severity: "error",
  },
};

export function getErrorInfo(code: string): ErrorInfo {
  const entry = ERROR_MESSAGES[code] ?? ERROR_MESSAGES.unknown_error;
  return { code, ...entry };
}

export interface ErrorResolution {
  code: string;
  info: ErrorInfo;
  details?: string;
}

const TRANSIENT_ERROR_CODES = new Set<string>([
  "github_api_rate_limit",
  "network_timeout",
  "agent_timeout",
]);

export function isTransientError(code: string): boolean {
  return TRANSIENT_ERROR_CODES.has(code);
}

function extractCodeFromError(error: unknown): string | undefined {
  if (!error) {
    return undefined;
  }

  if (typeof error === "string") {
    return matchErrorCodeFromMessage(error);
  }

  if (error instanceof Error) {
    const anyError = error as Error & { code?: string };
    if (anyError.code && typeof anyError.code === "string") {
      return anyError.code;
    }
    return matchErrorCodeFromMessage(anyError.message);
  }

  if (typeof error === "object") {
    const maybeError = error as { code?: unknown; message?: unknown };
    if (typeof maybeError.code === "string") {
      return maybeError.code;
    }
    if (typeof maybeError.message === "string") {
      return matchErrorCodeFromMessage(maybeError.message);
    }
  }

  return undefined;
}

function matchErrorCodeFromMessage(message: string): string | undefined {
  const normalized = message.toLowerCase();

  if (normalized.includes("tauri") && normalized.includes("not available")) {
    return "tauri_runtime_missing";
  }
  if (normalized.includes("worktree") && normalized.includes("failed")) {
    return "worktree_creation_failed";
  }
  if (normalized.includes("permission denied")) {
    return "permission_denied";
  }
  if (normalized.includes("rate limit") || normalized.includes("status: 429")) {
    return "github_api_rate_limit";
  }
  if (normalized.includes("token") && normalized.includes("invalid")) {
    return "github_token_invalid";
  }
  if (normalized.includes("repository") && normalized.includes("not found")) {
    return "repository_not_found";
  }
  if (normalized.includes("issue") && normalized.includes("not found")) {
    return "issue_not_found";
  }
  if (normalized.includes("timeout")) {
    return "network_timeout";
  }
  if (normalized.includes("session") && normalized.includes("exists")) {
    return "session_conflict";
  }
  if (normalized.includes("agent") && normalized.includes("failed")) {
    return "agent_execution_failed";
  }
  return undefined;
}

export function resolveError(error: unknown, fallbackCode?: string): ErrorResolution {
  const detectedCode = extractCodeFromError(error) ?? fallbackCode ?? "unknown_error";
  const info = getErrorInfo(detectedCode);

  const details =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : undefined;

  return {
    code: info.code,
    info,
    details,
  };
}

export class AgentExecutionError extends Error {
  public readonly code: string;
  public readonly causeError?: unknown;
  public readonly metadata?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    options?: { cause?: unknown; metadata?: Record<string, unknown> }
  ) {
    super(message);
    this.name = "AgentExecutionError";
    this.code = code;
    this.causeError = options?.cause;
    this.metadata = options?.metadata;
  }
}

export function toAgentExecutionError(
  error: unknown,
  fallbackCode?: string,
  metadata?: Record<string, unknown>
): AgentExecutionError {
  if (error instanceof AgentExecutionError) {
    return error;
  }

  const resolution = resolveError(error, fallbackCode);
  return new AgentExecutionError(resolution.code, resolution.info.message, {
    cause: error,
    metadata,
  });
}

export function logErrorEvent(
  scope: string,
  error: AgentExecutionError,
  extra?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  const context = {
    timestamp,
    scope,
    code: error.code,
    message: error.message,
    metadata: error.metadata,
    cause: error.causeError,
    extra,
    tauriAvailable: isTauriAvailable(),
  };

  // Use a collapsed group so logs stay tidy but can be expanded when needed
  // eslint-disable-next-line no-console
  console.groupCollapsed?.(`[AgentError][${scope}] ${error.code} @ ${timestamp}`);
  // eslint-disable-next-line no-console
  console.error(error);
  // eslint-disable-next-line no-console
  console.table?.(context);
  // eslint-disable-next-line no-console
  console.groupEnd?.();
}
