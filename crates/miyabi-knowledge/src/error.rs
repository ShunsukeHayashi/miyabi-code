//! エラー型定義

use thiserror::Error;

/// ナレッジ管理システムのエラー型
#[derive(Error, Debug)]
pub enum KnowledgeError {
    /// IO エラー
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    /// JSON パースエラー
    #[error("JSON parse error: {0}")]
    Json(#[from] serde_json::Error),

    /// Qdrant クライアントエラー
    #[error("Qdrant error: {0}")]
    Qdrant(String),

    /// 埋め込み生成エラー
    #[error("Embedding error: {0}")]
    Embedding(String),

    /// 設定エラー
    #[error("Config error: {0}")]
    Config(String),

    /// ログパースエラー
    #[error("Log parse error: {0}")]
    LogParse(String),

    /// エントリが見つからない
    #[error("Entry not found: {0}")]
    NotFound(String),

    /// その他のエラー
    #[error("Other error: {0}")]
    Other(#[from] anyhow::Error),
}

/// Result型エイリアス
pub type Result<T> = std::result::Result<T, KnowledgeError>;
