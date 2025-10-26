//! # Miyabi Voice Guide
//!
//! Voice-First Onboarding system for Miyabi.
//!
//! ## Overview
//!
//! This crate provides automatic voice guidance for CLI operations,
//! eliminating the need for users to read documentation.
//!
//! ## Features
//!
//! - 🎤 Automatic voice guidance on first run
//! - 🔊 Error-specific voice feedback
//! - 🎉 Success celebration messages
//! - 🚀 Auto-setup of VOICEVOX Engine (Docker)
//! - 📝 Contextual help messages
//!
//! ## Example
//!
//! ```no_run
//! use miyabi_voice_guide::{VoiceGuide, VoiceMessage};
//!
//! #[tokio::main]
//! async fn main() {
//!     // Initialize voice guide
//!     let guide = VoiceGuide::new();
//!
//!     // Welcome message
//!     guide.speak(VoiceMessage::Welcome).await;
//!
//!     // Error guidance
//!     guide.speak(VoiceMessage::ErrorGitHubToken).await;
//!
//!     // Success celebration
//!     guide.speak(VoiceMessage::SuccessPrCreated { pr_number: 42 }).await;
//! }
//! ```

mod auto_setup;
mod engine;
mod error;
mod messages;
mod speaker;

pub use auto_setup::auto_setup_voicevox;
pub use engine::{VoiceEngine, VoiceEngineConfig};
pub use error::{VoiceError, VoiceResult};
pub use messages::{VoiceMessage, VoiceScript};
pub use speaker::{Speaker, SpeakerVoice};

use std::sync::Arc;
use tokio::sync::Mutex;

/// Main Voice Guide interface
#[derive(Clone)]
pub struct VoiceGuide {
    engine: Arc<Mutex<VoiceEngine>>,
    enabled: bool,
}

impl VoiceGuide {
    /// Create a new Voice Guide instance
    ///
    /// Automatically detects if VOICEVOX is enabled via environment variable:
    /// - `MIYABI_VOICE_GUIDE=false` - Disable voice guide
    /// - Default: Enabled
    pub fn new() -> Self {
        let enabled = std::env::var("MIYABI_VOICE_GUIDE")
            .map(|v| v != "false")
            .unwrap_or(true);

        let config = VoiceEngineConfig::default();
        let engine = VoiceEngine::new(config);

        Self {
            engine: Arc::new(Mutex::new(engine)),
            enabled,
        }
    }

    /// Create a new Voice Guide with custom configuration
    pub fn with_config(config: VoiceEngineConfig) -> Self {
        let enabled = std::env::var("MIYABI_VOICE_GUIDE")
            .map(|v| v != "false")
            .unwrap_or(true);

        let engine = VoiceEngine::new(config);

        Self {
            engine: Arc::new(Mutex::new(engine)),
            enabled,
        }
    }

    /// Speak a voice message
    ///
    /// This function is non-blocking and runs in the background.
    /// If VOICEVOX Engine is not running, it will attempt to auto-start it.
    ///
    /// IMPORTANT: This function spawns a background task and waits for it to complete.
    /// This ensures the voice message is enqueued before the program exits.
    pub async fn speak(&self, message: VoiceMessage) {
        if !self.enabled {
            return;
        }

        let engine = self.engine.clone();
        let handle = tokio::spawn(async move {
            let mut engine = engine.lock().await;
            if let Err(e) = engine.speak(message).await {
                tracing::warn!("Voice guide failed: {}", e);
            }
        });

        // Wait for the task to complete to ensure voice is enqueued
        // This is critical for short-lived CLI commands
        if let Err(e) = handle.await {
            tracing::warn!("Voice guide task failed: {}", e);
        }
    }

    /// Speak a custom text message
    pub async fn speak_text(&self, text: impl Into<String>) {
        if !self.enabled {
            return;
        }

        let message = VoiceMessage::Custom {
            text: text.into(),
        };

        self.speak(message).await;
    }

    /// Check if voice guide is enabled
    pub fn is_enabled(&self) -> bool {
        self.enabled
    }

    /// Enable voice guide
    pub fn enable(&mut self) {
        self.enabled = true;
    }

    /// Disable voice guide
    pub fn disable(&mut self) {
        self.enabled = false;
    }

    /// Check if VOICEVOX Engine is running
    pub async fn is_engine_running(&self) -> bool {
        let engine = self.engine.lock().await;
        engine.is_running().await
    }

    /// Ensure VOICEVOX Engine is running
    ///
    /// If not running, attempts to auto-start via Docker.
    pub async fn ensure_engine_running(&self) -> VoiceResult<()> {
        let mut engine = self.engine.lock().await;
        engine.ensure_running().await
    }
}

impl Default for VoiceGuide {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_voice_guide_creation() {
        // Ensure env var is not set
        std::env::remove_var("MIYABI_VOICE_GUIDE");
        let guide = VoiceGuide::new();
        assert!(guide.is_enabled());
    }

    #[tokio::test]
    async fn test_voice_guide_disable() {
        std::env::set_var("MIYABI_VOICE_GUIDE", "false");
        let guide = VoiceGuide::new();
        assert!(!guide.is_enabled());
        std::env::remove_var("MIYABI_VOICE_GUIDE");
    }
}
