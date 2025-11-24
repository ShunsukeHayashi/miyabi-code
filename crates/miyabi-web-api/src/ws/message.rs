// ws/message.rs
// 型安全な WebSocket メッセージプロトコル定義
#![allow(non_snake_case)]

use serde::{Deserialize, Serialize};
use std::fmt;

/// WebSocket メッセージの統一プロトコル
///
/// 特徴:
/// - serde tag で型安全な deserialization
/// - バイナリとテキストの両対応
/// - エラーハンドリング組み込み
///
/// JSON 例:
/// ```json
/// {
///   "type": "agent.started",
///   "payload": {
///     "executionId": "exec-123",
///     "agentType": "CodeGen",
///     "startedAt": "2025-10-29T12:00:00Z"
///   }
/// }
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload", rename_all = "snake_case")]
pub enum WSMessage {
    // ハンドシェイク & 接続管理

    /// Ping: 接続確認 & キープアライブ
    #[serde(rename = "ping")]
    Ping {
        /// メッセージ ID（Pong で返される）
        id: u64,
    },

    /// Pong: Ping への応答
    #[serde(rename = "pong")]
    Pong {
        /// Ping のメッセージ ID
        id: u64,
    },

    /// 認証リクエスト（初回接続時に必須）
    #[serde(rename = "auth")]
    Auth {
        /// JWT トークン
        token: String,
    },

    /// 認証成功応答
    #[serde(rename = "auth_success")]
    AuthSuccess {
        /// ユーザー ID
        userId: i64,
        /// ユーザー名
        username: String,
    },

    // 購読管理

    /// 実行イベントの購読開始
    #[serde(rename = "subscribe")]
    Subscribe {
        /// 購読する実行 ID
        executionId: String,
    },

    /// 実行イベントの購読終了
    #[serde(rename = "unsubscribe")]
    Unsubscribe {
        /// 購読を終了する実行 ID
        executionId: String,
    },

    // Agent 実行イベント

    /// Agent 実行開始
    #[serde(rename = "agent.started")]
    AgentStarted {
        /// 実行 ID
        executionId: String,
        /// Agent タイプ
        agentType: String,
        /// リポジトリ ID
        repositoryId: String,
        /// Issue 番号
        issueNumber: u32,
        /// 開始時刻 (ISO 8601)
        startedAt: String,
    },

    /// Agent 実行進捗
    #[serde(rename = "agent.progress")]
    AgentProgress {
        /// 実行 ID
        executionId: String,
        /// 進捗 (0-100)
        progress: u8,
        /// 進捗メッセージ
        message: Option<String>,
        /// ステップ名（例：code_generation, review, etc.）
        step: Option<String>,
    },

    /// Agent 実行完了
    #[serde(rename = "agent.completed")]
    AgentCompleted {
        /// 実行 ID
        executionId: String,
        /// 実行結果ステータス
        status: ExecutionStatus,
        /// 結果データ（JSON）
        result: serde_json::Value,
        /// コード品質スコア（100点満点）
        qualityScore: Option<u32>,
        /// 生成された PR 番号
        prNumber: Option<u32>,
        /// 完了時刻 (ISO 8601)
        completedAt: String,
    },

    /// Agent 実行失敗
    #[serde(rename = "agent.failed")]
    AgentFailed {
        /// 実行 ID
        executionId: String,
        /// エラーコード
        errorCode: String,
        /// エラーメッセージ
        errorMessage: String,
        /// スタックトレース（デバッグ用）
        stackTrace: Option<String>,
        /// 失敗時刻 (ISO 8601)
        failedAt: String,
    },

    /// ログメッセージ（ストリーミング）
    #[serde(rename = "agent.log")]
    AgentLog {
        /// 実行 ID
        executionId: String,
        /// ログレベル
        level: LogLevel,
        /// ログメッセージ
        message: String,
        /// タイムスタンプ (ISO 8601)
        timestamp: String,
    },

    // ワークフロー実行

    /// ワークフロー実行開始
    #[serde(rename = "workflow.started")]
    WorkflowStarted {
        /// ワークフロー実行 ID
        executionId: String,
        /// ワークフロー ID
        workflowId: String,
        /// ワークフロー名
        name: String,
    },

    /// ワークフロー完了
    #[serde(rename = "workflow.completed")]
    WorkflowCompleted {
        /// ワークフロー実行 ID
        executionId: String,
        /// 実行結果ステータス
        status: ExecutionStatus,
        /// 実行時間（秒）
        duration: f64,
    },

    // エラーハンドリング

    /// エラーメッセージ
    #[serde(rename = "error")]
    Error {
        /// エラーコード
        code: String,
        /// エラーメッセージ
        message: String,
        /// エラー詳細（オプション）
        details: Option<serde_json::Value>,
    },

    /// 警告メッセージ
    #[serde(rename = "warning")]
    Warning {
        /// 警告コード
        code: String,
        /// 警告メッセージ
        message: String,
    },

    // ハートビート（接続確認）

    /// サーバーからクライアントへのハートビート
    #[serde(rename = "heartbeat")]
    Heartbeat {
        /// タイムスタンプ
        timestamp: String,
        /// サーバー状態（オプション）
        serverStatus: Option<ServerStatus>,
    },
}

/// Agent 実行ステータス
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ExecutionStatus {
    /// 成功
    Success,
    /// 失敗
    Failure,
    /// タイムアウト
    Timeout,
    /// キャンセル
    Cancelled,
    /// スキップ
    Skipped,
}

/// ログレベル
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "UPPERCASE")]
pub enum LogLevel {
    /// デバッグ
    Debug,
    /// 情報
    Info,
    /// 警告
    Warn,
    /// エラー
    Error,
}

/// サーバーステータス情報
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerStatus {
    /// アクティブな実行数
    pub activeExecutions: u32,
    /// キューイング中の実行数
    pub queuedExecutions: u32,
    /// サーバーアップタイム（秒）
    pub uptime: u64,
    /// メモリ使用率（%）
    pub memoryUsage: u8,
}

impl WSMessage {
    /// テキストメッセージに変換
    pub fn to_text(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string(self)
    }

    /// バイナリメッセージに変換
    pub fn to_binary(&self) -> Result<Vec<u8>, serde_json::Error> {
        serde_json::to_vec(self)
    }

    /// テキストから復元
    pub fn from_text(text: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(text)
    }

    /// バイナリから復元
    pub fn from_binary(bytes: &[u8]) -> Result<Self, serde_json::Error> {
        serde_json::from_slice(bytes)
    }

    /// メッセージのタイプを取得
    pub fn message_type(&self) -> &'static str {
        match self {
            WSMessage::Ping { .. } => "ping",
            WSMessage::Pong { .. } => "pong",
            WSMessage::Auth { .. } => "auth",
            WSMessage::AuthSuccess { .. } => "auth_success",
            WSMessage::Subscribe { .. } => "subscribe",
            WSMessage::Unsubscribe { .. } => "unsubscribe",
            WSMessage::AgentStarted { .. } => "agent.started",
            WSMessage::AgentProgress { .. } => "agent.progress",
            WSMessage::AgentCompleted { .. } => "agent.completed",
            WSMessage::AgentFailed { .. } => "agent.failed",
            WSMessage::AgentLog { .. } => "agent.log",
            WSMessage::WorkflowStarted { .. } => "workflow.started",
            WSMessage::WorkflowCompleted { .. } => "workflow.completed",
            WSMessage::Error { .. } => "error",
            WSMessage::Warning { .. } => "warning",
            WSMessage::Heartbeat { .. } => "heartbeat",
        }
    }

    /// 優先度を取得（バックプレッシャー対策用）
    pub fn priority(&self) -> u8 {
        match self {
            // 高優先度: 認証、ハートビート
            WSMessage::Auth { .. } | WSMessage::Ping { .. } => 100,
            // 中優先度: Agent イベント
            WSMessage::AgentStarted { .. }
            | WSMessage::AgentCompleted { .. }
            | WSMessage::AgentFailed { .. } => 75,
            // 低優先度: ログ、進捗（バッファオーバーフロー時は破棄可能）
            WSMessage::AgentProgress { .. } | WSMessage::AgentLog { .. } => 25,
            // その他
            _ => 50,
        }
    }
}

impl fmt::Display for WSMessage {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "WSMessage(type={})", self.message_type())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_started_serialization() {
        let msg = WSMessage::AgentStarted {
            executionId: "exec-123".to_string(),
            agentType: "CodeGen".to_string(),
            repositoryId: "repo-456".to_string(),
            issueNumber: 42,
            startedAt: "2025-10-29T12:00:00Z".to_string(),
        };

        let json = msg.to_text().unwrap();
        let restored = WSMessage::from_text(&json).unwrap();

        assert_eq!(msg.message_type(), restored.message_type());
    }

    #[test]
    fn test_error_message_priority() {
        let auth_msg = WSMessage::Auth {
            token: "token".to_string(),
        };
        let log_msg = WSMessage::AgentLog {
            executionId: "exec".to_string(),
            level: LogLevel::Info,
            message: "log".to_string(),
            timestamp: "2025-10-29T12:00:00Z".to_string(),
        };

        assert!(auth_msg.priority() > log_msg.priority());
    }
}
