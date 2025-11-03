/**
 * Error Handling Library for Miyabi Desktop
 *
 * Provides user-friendly error messages with actionable solutions.
 */

export interface ErrorInfo {
  title: string;
  message: string;
  actions: string[];
  severity: 'error' | 'warning' | 'info';
}

/**
 * Comprehensive error message definitions
 * Maps error codes to user-friendly information
 */
export const ERROR_MESSAGES: Record<string, ErrorInfo> = {
  // GitHub API Errors
  github_token_invalid: {
    title: 'GitHub Token が無効です',
    message: '入力されたGitHub Personal Access Tokenが無効、または期限切れの可能性があります。',
    actions: [
      'Settings → GitHub Tokenを確認してください',
      '新しいTokenを生成してください: https://github.com/settings/tokens',
      '必要な権限 (repo, workflow) が付与されているか確認してください',
    ],
    severity: 'error',
  },

  github_api_rate_limit: {
    title: 'GitHub API レート制限',
    message: 'GitHub APIの利用上限に達しました。1時間後に再試行してください。',
    actions: [
      '1時間待機してください',
      'Personal Access Tokenを使用すると制限が緩和されます',
      'GitHub Statusページで障害情報を確認してください',
    ],
    severity: 'warning',
  },

  github_api_network_error: {
    title: 'ネットワーク接続エラー',
    message: 'GitHub APIへの接続に失敗しました。ネットワーク接続を確認してください。',
    actions: [
      'インターネット接続を確認してください',
      'VPNやプロキシ設定を確認してください',
      'ファイアウォール設定を確認してください',
    ],
    severity: 'error',
  },

  // Agent Execution Errors
  agent_execution_failed: {
    title: 'エージェント実行失敗',
    message: 'エージェントの実行中にエラーが発生しました。',
    actions: [
      'ログを確認してください',
      'Issue番号が正しいか確認してください',
      'リポジトリへのアクセス権限を確認してください',
    ],
    severity: 'error',
  },

  agent_timeout: {
    title: 'エージェント実行タイムアウト',
    message: 'エージェントの実行がタイムアウトしました。処理が長時間続いています。',
    actions: [
      'タスクを分割して再実行してください',
      'システムリソースを確認してください',
      'Miyabiのログを確認してください',
    ],
    severity: 'warning',
  },

  agent_not_found: {
    title: 'エージェントが見つかりません',
    message: '指定されたエージェントタイプが存在しません。',
    actions: [
      'エージェント名が正しいか確認してください',
      '利用可能なエージェント一覧を確認してください',
      'Miyabiのバージョンを最新に更新してください',
    ],
    severity: 'error',
  },

  // Issue Management Errors
  issue_not_found: {
    title: 'Issue が見つかりません',
    message: '指定されたIssue番号が存在しません。',
    actions: [
      'Issue番号が正しいか確認してください',
      'リポジトリが正しいか確認してください',
      'Issueが削除されていないか確認してください',
    ],
    severity: 'error',
  },

  issue_access_denied: {
    title: 'Issue アクセス拒否',
    message: '指定されたIssueへのアクセス権限がありません。',
    actions: [
      'リポジトリへのアクセス権限を確認してください',
      'プライベートリポジトリの場合、Tokenの権限を確認してください',
      'リポジトリオーナーに権限を依頼してください',
    ],
    severity: 'error',
  },

  // Deployment Errors
  deployment_failed: {
    title: 'デプロイメント失敗',
    message: 'デプロイメント処理中にエラーが発生しました。',
    actions: [
      'デプロイメントログを確認してください',
      'CI/CDパイプラインのステータスを確認してください',
      'デプロイメント設定を確認してください',
    ],
    severity: 'error',
  },

  deployment_rollback_failed: {
    title: 'ロールバック失敗',
    message: 'デプロイメントのロールバックに失敗しました。',
    actions: [
      '手動でロールバックを実行してください',
      'バックアップから復元してください',
      'システム管理者に連絡してください',
    ],
    severity: 'error',
  },

  // VOICEVOX Errors
  voicevox_connection_error: {
    title: 'VOICEVOX 接続エラー',
    message: 'VOICEVOXサーバーへの接続に失敗しました。',
    actions: [
      'VOICEVOXエンジンが起動しているか確認してください',
      'ポート番号（デフォルト: 50021）が正しいか確認してください',
      'ファイアウォール設定を確認してください',
    ],
    severity: 'warning',
  },

  voicevox_synthesis_failed: {
    title: 'VOICEVOX 音声合成失敗',
    message: '音声合成処理中にエラーが発生しました。',
    actions: [
      'テキスト内容を確認してください（特殊文字など）',
      'VOICEVOXエンジンを再起動してください',
      '話者IDが正しいか確認してください',
    ],
    severity: 'warning',
  },

  // Configuration Errors
  config_load_failed: {
    title: '設定ファイル読み込みエラー',
    message: '設定ファイルの読み込みに失敗しました。',
    actions: [
      '設定ファイルの形式を確認してください',
      '設定ファイルのパスが正しいか確認してください',
      '設定をリセットして再起動してください',
    ],
    severity: 'error',
  },

  config_save_failed: {
    title: '設定保存エラー',
    message: '設定の保存に失敗しました。',
    actions: [
      'ディスク容量を確認してください',
      'ファイルへの書き込み権限を確認してください',
      'アプリケーションを再起動してください',
    ],
    severity: 'error',
  },

  // Unknown/Generic Errors
  unknown_error: {
    title: '予期しないエラー',
    message: '予期しないエラーが発生しました。',
    actions: [
      'アプリケーションを再起動してください',
      'ログを確認してエラー詳細を調べてください',
      'GitHub Issueで報告してください',
    ],
    severity: 'error',
  },
};

/**
 * Extract error code from error object
 * @param error - Error object or string
 * @returns Error code string
 */
export function extractErrorCode(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    // Check for error code property
    if ('code' in error && typeof error.code === 'string') {
      return error.code;
    }

    // Extract from error message
    const match = error.message.match(/\[([A-Z_]+)\]/);
    if (match) {
      return match[1].toLowerCase();
    }
  }

  return 'unknown_error';
}

/**
 * Get error info from error object
 * @param error - Error object or string
 * @returns ErrorInfo object
 */
export function getErrorInfo(error: unknown): ErrorInfo {
  const errorCode = extractErrorCode(error);
  return ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.unknown_error;
}
