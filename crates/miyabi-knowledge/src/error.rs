//! エラー型定義

use thiserror::Error;
use miyabi_types::error::{ErrorCode, UnifiedError};
use std::any::Any;

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

    /// サーバーエラー
    #[error("Server error: {0}")]
    Server(String),

    /// その他のエラー
    #[error("Other error: {0}")]
    Other(#[from] anyhow::Error),
}

/// Result型エイリアス
pub type Result<T> = std::result::Result<T, KnowledgeError>;

// ============================================================================
// UnifiedError Implementation
// ============================================================================

impl UnifiedError for KnowledgeError {
    fn code(&self) -> ErrorCode {
        match self {
            Self::Io(e) => match e.kind() {
                std::io::ErrorKind::NotFound => ErrorCode::FILE_NOT_FOUND,
                std::io::ErrorKind::PermissionDenied => ErrorCode::PERMISSION_DENIED,
                _ => ErrorCode::IO_ERROR,
            },
            Self::Json(_) => ErrorCode::PARSE_ERROR,
            Self::Qdrant(_) => ErrorCode::STORAGE_ERROR,
            Self::Embedding(_) => ErrorCode::PROCESS_ERROR,
            Self::Config(_) => ErrorCode::CONFIG_ERROR,
            Self::LogParse(_) => ErrorCode::PARSE_ERROR,
            Self::NotFound(_) => ErrorCode::FILE_NOT_FOUND,
            Self::Server(_) => ErrorCode::INTERNAL_ERROR,
            Self::Other(_) => ErrorCode::INTERNAL_ERROR,
        }
    }

    fn user_message(&self) -> String {
        match self {
            Self::Qdrant(msg) => format!(
                "Vector database error: {}. Please check your Qdrant connection and configuration.",
                msg
            ),
            Self::Embedding(msg) => format!(
                "Failed to generate embeddings: {}. Please check your embedding service configuration.",
                msg
            ),
            Self::Config(msg) => format!(
                "Knowledge system configuration error: {}. Please verify your knowledge system settings.",
                msg
            ),
            Self::LogParse(msg) => format!(
                "Failed to parse log data: {}. The log format may be invalid or corrupted.",
                msg
            ),
            Self::NotFound(entry) => format!(
                "Knowledge entry '{}' was not found. Please check the entry ID or search query.",
                entry
            ),
            Self::Server(msg) => format!(
                "Knowledge server error: {}. Please try again later or contact support.",
                msg
            ),
            // Reuse existing thiserror messages for other variants
            _ => self.to_string(),
        }
    }

    fn context(&self) -> Option<&dyn Any> {
        match self {
            Self::Qdrant(msg) => Some(msg as &dyn Any),
            Self::Embedding(msg) => Some(msg as &dyn Any),
            Self::Config(msg) => Some(msg as &dyn Any),
            Self::LogParse(msg) => Some(msg as &dyn Any),
            Self::NotFound(entry) => Some(entry as &dyn Any),
            Self::Server(msg) => Some(msg as &dyn Any),
            _ => None,
        }
    }
}

#[cfg(test)]
mod unified_error_tests {
    use super::*;

    #[test]
    fn test_knowledge_error_codes() {
        let error = KnowledgeError::Qdrant("connection failed".to_string());
        assert_eq!(error.code(), ErrorCode::STORAGE_ERROR);

        let error = KnowledgeError::Embedding("api error".to_string());
        assert_eq!(error.code(), ErrorCode::PROCESS_ERROR);

        let error = KnowledgeError::Config("invalid config".to_string());
        assert_eq!(error.code(), ErrorCode::CONFIG_ERROR);

        let error = KnowledgeError::LogParse("invalid format".to_string());
        assert_eq!(error.code(), ErrorCode::PARSE_ERROR);

        let error = KnowledgeError::NotFound("entry-123".to_string());
        assert_eq!(error.code(), ErrorCode::FILE_NOT_FOUND);

        let error = KnowledgeError::Server("internal error".to_string());
        assert_eq!(error.code(), ErrorCode::INTERNAL_ERROR);
    }

    #[test]
    fn test_user_messages() {
        let error = KnowledgeError::Qdrant("connection refused".to_string());
        let msg = error.user_message();
        assert!(msg.contains("connection refused"));
        assert!(msg.contains("Qdrant"));

        let error = KnowledgeError::NotFound("doc-456".to_string());
        let msg = error.user_message();
        assert!(msg.contains("doc-456"));
        assert!(msg.contains("not found"));

        let error = KnowledgeError::Embedding("rate limit".to_string());
        let msg = error.user_message();
        assert!(msg.contains("embeddings"));
        assert!(msg.contains("rate limit"));
    }

    #[test]
    fn test_context_extraction() {
        let error = KnowledgeError::Qdrant("error".to_string());
        assert!(error.context().is_some());

        let error = KnowledgeError::NotFound("entry".to_string());
        assert!(error.context().is_some());

        let error = KnowledgeError::Io(std::io::Error::new(std::io::ErrorKind::Other, "test"));
        assert!(error.context().is_none());

        let error = KnowledgeError::Json(serde_json::from_str::<serde_json::Value>("invalid").unwrap_err());
        assert!(error.context().is_none());
    }
}
