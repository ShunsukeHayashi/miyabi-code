//! Error types for Voice Guide

use thiserror::Error;

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
