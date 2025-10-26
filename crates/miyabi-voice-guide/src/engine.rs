//! VOICEVOX Engine integration

use crate::error::{VoiceError, VoiceResult};
use crate::messages::VoiceMessage;
use crate::speaker::SpeakerVoice;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::process::Command;
use std::time::Duration;
use tokio::time::sleep;

/// VOICEVOX Engine configuration
#[derive(Debug, Clone)]
pub struct VoiceEngineConfig {
    /// VOICEVOX Engine URL
    pub engine_url: String,
    /// Default speaker voice
    pub voice: SpeakerVoice,
    /// Auto-start engine if not running
    pub auto_start: bool,
    /// Path to voicevox_enqueue.sh script
    pub enqueue_script: String,
    /// Timeout for engine startup (seconds)
    pub startup_timeout: u64,
}

impl Default for VoiceEngineConfig {
    fn default() -> Self {
        Self {
            engine_url: "http://127.0.0.1:50021".to_string(),
            voice: SpeakerVoice::default(),
            auto_start: true,
            enqueue_script: detect_enqueue_script(),
            startup_timeout: 30,
        }
    }
}

/// Detect voicevox_enqueue.sh script location
fn detect_enqueue_script() -> String {
    if std::path::Path::new("tools/voicevox_enqueue.sh").exists() {
        "tools/voicevox_enqueue.sh".to_string()
    } else if std::path::Path::new("/tmp/voicevox_enqueue.sh").exists() {
        "/tmp/voicevox_enqueue.sh".to_string()
    } else {
        // Default to tools/ (will be created if needed)
        "tools/voicevox_enqueue.sh".to_string()
    }
}

/// VOICEVOX Engine client
pub struct VoiceEngine {
    config: VoiceEngineConfig,
    client: Client,
}

// Future use: Direct VOICEVOX API integration
#[allow(dead_code)]
#[derive(Debug, Serialize)]
struct AudioQueryParams {
    text: String,
    speaker: u32,
}

// Future use: Direct VOICEVOX API integration
#[allow(dead_code)]
#[derive(Debug, Deserialize)]
struct AudioQuery {
    // VOICEVOX audio query response (simplified)
    accent_phrases: serde_json::Value,
}

impl VoiceEngine {
    /// Create a new VOICEVOX Engine client
    pub fn new(config: VoiceEngineConfig) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(10))
            .build()
            .unwrap_or_else(|_| Client::new());

        Self { config, client }
    }

    /// Check if VOICEVOX Engine is running
    pub async fn is_running(&self) -> bool {
        let url = format!("{}/version", self.config.engine_url);
        self.client.get(&url).send().await.is_ok()
    }

    /// Ensure VOICEVOX Engine is running
    ///
    /// If not running and auto_start is enabled, attempts to start via Docker.
    pub async fn ensure_running(&mut self) -> VoiceResult<()> {
        if self.is_running().await {
            return Ok(());
        }

        if !self.config.auto_start {
            return Err(VoiceError::EngineNotRunning {
                url: self.config.engine_url.clone(),
            });
        }

        tracing::info!("VOICEVOX Engine not running, attempting auto-start...");
        self.auto_start_engine().await?;

        Ok(())
    }

    /// Auto-start VOICEVOX Engine via Docker
    async fn auto_start_engine(&self) -> VoiceResult<()> {
        // Check if Docker is available
        let docker_check = Command::new("docker").arg("--version").output();

        if docker_check.is_err() {
            return Err(VoiceError::DockerError {
                reason: "Docker not found. Please install Docker or disable voice guide."
                    .to_string(),
            });
        }

        tracing::info!("Starting VOICEVOX Engine via Docker...");

        // Start VOICEVOX Engine container
        let output = Command::new("docker")
            .args(&[
                "run",
                "-d",
                "--rm",
                "-p",
                "127.0.0.1:50021:50021",
                "voicevox/voicevox_engine:cpu-latest",
            ])
            .output()
            .map_err(|e| VoiceError::DockerError {
                reason: format!("Failed to start Docker container: {}", e),
            })?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(VoiceError::EngineStartFailed {
                reason: format!("Docker command failed: {}", stderr),
            });
        }

        // Wait for engine to be ready
        for i in 0..self.config.startup_timeout {
            sleep(Duration::from_secs(1)).await;
            if self.is_running().await {
                tracing::info!("VOICEVOX Engine started successfully");
                return Ok(());
            }
            if i % 5 == 0 {
                tracing::debug!("Waiting for VOICEVOX Engine to start... ({}s)", i);
            }
        }

        Err(VoiceError::EngineStartFailed {
            reason: format!(
                "Engine did not start within {} seconds",
                self.config.startup_timeout
            ),
        })
    }

    /// Speak a voice message
    pub async fn speak(&mut self, message: VoiceMessage) -> VoiceResult<()> {
        // Ensure engine is running
        self.ensure_running().await?;

        let text = message.script();
        let speaker_id = self.config.voice.speaker.id();

        tracing::debug!(
            "Speaking: {} (speaker: {}, speed: {})",
            message.summary(),
            self.config.voice.speaker.name(),
            self.config.voice.speed
        );

        // Use voicevox_enqueue.sh script if available
        if std::path::Path::new(&self.config.enqueue_script).exists() {
            self.enqueue_voice(&text, speaker_id).await?;
        } else {
            tracing::warn!(
                "voicevox_enqueue.sh not found at {}. Voice guide disabled.",
                self.config.enqueue_script
            );
        }

        Ok(())
    }

    /// Enqueue voice message via voicevox_enqueue.sh
    async fn enqueue_voice(&self, text: &str, speaker_id: u32) -> VoiceResult<()> {
        let output = Command::new(&self.config.enqueue_script)
            .arg(text)
            .arg(speaker_id.to_string())
            .arg(self.config.voice.speed.to_string())
            .output()
            .map_err(|e| VoiceError::PlaybackFailed {
                reason: format!("Failed to execute enqueue script: {}", e),
            })?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(VoiceError::PlaybackFailed {
                reason: format!("Enqueue script failed: {}", stderr),
            });
        }

        Ok(())
    }

    /// Get VOICEVOX Engine version
    pub async fn version(&self) -> VoiceResult<String> {
        let url = format!("{}/version", self.config.engine_url);
        let response = self.client.get(&url).send().await?;
        let version = response.text().await?;
        Ok(version)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_enqueue_script() {
        let script = detect_enqueue_script();
        assert!(
            script.ends_with("voicevox_enqueue.sh"),
            "Should detect enqueue script"
        );
    }

    #[tokio::test]
    async fn test_voice_engine_creation() {
        let config = VoiceEngineConfig::default();
        let engine = VoiceEngine::new(config);
        assert_eq!(engine.config.engine_url, "http://127.0.0.1:50021");
    }
}
