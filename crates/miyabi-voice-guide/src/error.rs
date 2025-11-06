//! Error types for Voice Guide

use thiserror::Error;
use miyabi_types::error::{ErrorCode, UnifiedError};
use std::any::Any;

/// Result type for Voice Guide operations
pub type VoiceResult<T> = Result<T, VoiceError>;

/// Voice Guide error types
#[derive(Error, Debug)]
pub enum VoiceError {
    /// VOICEVOX Engine is not running
    #[error("VOICEVOX Engine is not running at {url}")]
    EngineNotRunning { url: String },

    /// Failed to start VOICEVOX Engine
    #[error("Failed to start VOICEVOX Engine: {reason}")]
    EngineStartFailed { reason: String },

    /// HTTP request failed
    #[error("HTTP request failed: {0}")]
    HttpError(#[from] reqwest::Error),

    /// Audio synthesis failed
    #[error("Audio synthesis failed: {reason}")]
    SynthesisFailed { reason: String },

    /// Audio playback failed
    #[error("Audio playback failed: {reason}")]
    PlaybackFailed { reason: String },

    /// JSON serialization/deserialization error
    #[error("JSON error: {0}")]
    JsonError(#[from] serde_json::Error),

    /// IO error
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    /// Docker command failed
    #[error("Docker command failed: {reason}")]
    DockerError { reason: String },

    /// Unknown error
    #[error("Unknown error: {0}")]
    Unknown(String),
}

// ============================================================================
// UnifiedError Implementation
// ============================================================================

impl UnifiedError for VoiceError {
    fn code(&self) -> ErrorCode {
        match self {
            Self::EngineNotRunning { .. } => ErrorCode::HTTP_ERROR,
            Self::EngineStartFailed { .. } => ErrorCode::PROCESS_ERROR,
            Self::HttpError(_) => ErrorCode::HTTP_ERROR,
            Self::SynthesisFailed { .. } => ErrorCode::PROCESS_ERROR,
            Self::PlaybackFailed { .. } => ErrorCode::PROCESS_ERROR,
            Self::JsonError(_) => ErrorCode::PARSE_ERROR,
            Self::IoError(e) => match e.kind() {
                std::io::ErrorKind::NotFound => ErrorCode::FILE_NOT_FOUND,
                std::io::ErrorKind::PermissionDenied => ErrorCode::PERMISSION_DENIED,
                _ => ErrorCode::IO_ERROR,
            },
            Self::DockerError { .. } => ErrorCode::PROCESS_ERROR,
            Self::Unknown(_) => ErrorCode::UNKNOWN_ERROR,
        }
    }

    fn user_message(&self) -> String {
        match self {
            Self::EngineNotRunning { url } => format!(
                "VOICEVOX Engine is not running at {}. Please start the engine using Docker or direct installation.",
                url
            ),
            Self::EngineStartFailed { reason } => format!(
                "Failed to start VOICEVOX Engine: {}. Please check Docker installation and port availability.",
                reason
            ),
            Self::SynthesisFailed { reason } => format!(
                "Audio synthesis failed: {}. Please check VOICEVOX Engine status and try again.",
                reason
            ),
            Self::PlaybackFailed { reason } => format!(
                "Audio playback failed: {}. Please check your audio device configuration.",
                reason
            ),
            Self::DockerError { reason } => format!(
                "Docker operation failed: {}. Please ensure Docker is installed and running.",
                reason
            ),
            Self::Unknown(msg) => format!(
                "An unknown voice guide error occurred: {}. Please check logs for more details.",
                msg
            ),
            // Reuse existing thiserror messages for other variants
            _ => self.to_string(),
        }
    }

    fn context(&self) -> Option<&dyn Any> {
        match self {
            Self::EngineNotRunning { url } => Some(url as &dyn Any),
            Self::EngineStartFailed { reason } => Some(reason as &dyn Any),
            Self::SynthesisFailed { reason } => Some(reason as &dyn Any),
            Self::PlaybackFailed { reason } => Some(reason as &dyn Any),
            Self::DockerError { reason } => Some(reason as &dyn Any),
            Self::Unknown(msg) => Some(msg as &dyn Any),
            _ => None,
        }
    }
}

#[cfg(test)]
mod unified_error_tests {
    use super::*;

    #[test]
    fn test_voice_error_codes() {
        let error = VoiceError::EngineNotRunning {
            url: "http://localhost:50021".to_string(),
        };
        assert_eq!(error.code(), ErrorCode::HTTP_ERROR);

        let error = VoiceError::EngineStartFailed {
            reason: "docker not found".to_string(),
        };
        assert_eq!(error.code(), ErrorCode::PROCESS_ERROR);

        let error = VoiceError::SynthesisFailed {
            reason: "invalid text".to_string(),
        };
        assert_eq!(error.code(), ErrorCode::PROCESS_ERROR);

        let error = VoiceError::DockerError {
            reason: "container start failed".to_string(),
        };
        assert_eq!(error.code(), ErrorCode::PROCESS_ERROR);

        let error = VoiceError::Unknown("unexpected".to_string());
        assert_eq!(error.code(), ErrorCode::UNKNOWN_ERROR);
    }

    #[test]
    fn test_user_messages() {
        let error = VoiceError::EngineNotRunning {
            url: "http://localhost:50021".to_string(),
        };
        let msg = error.user_message();
        assert!(msg.contains("http://localhost:50021"));
        assert!(msg.contains("not running"));

        let error = VoiceError::SynthesisFailed {
            reason: "timeout".to_string(),
        };
        let msg = error.user_message();
        assert!(msg.contains("synthesis"));
        assert!(msg.contains("timeout"));

        let error = VoiceError::DockerError {
            reason: "permission denied".to_string(),
        };
        let msg = error.user_message();
        assert!(msg.contains("Docker"));
        assert!(msg.contains("permission denied"));
    }

    #[test]
    fn test_context_extraction() {
        let error = VoiceError::EngineNotRunning {
            url: "http://localhost:50021".to_string(),
        };
        assert!(error.context().is_some());

        let error = VoiceError::SynthesisFailed {
            reason: "error".to_string(),
        };
        assert!(error.context().is_some());

        let error = VoiceError::HttpError(reqwest::Error::new(
            reqwest::error::Kind::Request,
            None::<std::io::Error>,
        ));
        assert!(error.context().is_none());

        let error = VoiceError::IoError(std::io::Error::new(std::io::ErrorKind::Other, "test"));
        assert!(error.context().is_none());
    }
}
