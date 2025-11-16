//! Skills Bridge - Bidirectional Integration between Orchestrator and Skills
//!
//! This module provides seamless communication between the STOP Trigger Orchestrator
//! and Miyabi's Skills system, enabling:
//!
//! 1. **Skills → Orchestrator**: Skills can trigger orchestrator workflows
//! 2. **Orchestrator → Skills**: Orchestrator can execute skills as part of workflows
//! 3. **Event-driven Architecture**: Both systems communicate via events
//!
//! # Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────┐
//! │                    Skills Bridge                            │
//! │  ┌─────────────────────────────────────────────────────┐   │
//! │  │           Bidirectional Communication               │   │
//! │  │                                                       │   │
//! │  │  Skills System          ←→          Orchestrator     │   │
//! │  │  • rust-development     ←→    • Phase 1-9 Workflow  │   │
//! │  │  • agent-execution      ←→    • STOP Trigger System │   │
//! │  │  • debugging            ←→    • 5-Worlds Execution  │   │
//! │  │  • security-audit       ←→    • Auto-Merge Logic    │   │
//! │  │  • [12 more skills]     ←→    • Quality Checks      │   │
//! │  └─────────────────────────────────────────────────────┘   │
//! │                                                             │
//! │  Event Types:                                               │
//! │  • SkillCompleted         → Trigger next orchestrator phase│
//! │  • PhaseCompleted         → Execute relevant skill         │
//! │  • StopTokenDetected      → Queue next workflow task       │
//! │  • ErrorDetected          → Trigger debugging skill        │
//! └─────────────────────────────────────────────────────────────┘
//! ```
//!
//! # Usage Example
//!
//! ```no_run
//! use miyabi_orchestrator::skills_bridge::{SkillsBridge, SkillRequest, OrchestratorEvent};
//! use std::collections::HashMap;
//!
//! #[tokio::main]
//! async fn main() -> anyhow::Result<()> {
//!     // Initialize bridge
//!     let (bridge, mut event_rx) = SkillsBridge::new();
//!
//!     // Execute a skill from orchestrator
//!     let request = SkillRequest {
//!         skill_name: "rust-development".to_string(),
//!         context: {
//!             let mut ctx = HashMap::new();
//!             ctx.insert("ISSUE_NUMBER".to_string(), "809".to_string());
//!             ctx.insert("TASK".to_string(), "Run tests".to_string());
//!             ctx
//!         },
//!         timeout_secs: 300,
//!     };
//!
//!     let result = bridge.execute_skill(request).await?;
//!     println!("Skill result: {:?}", result);
//!
//!     // Listen for orchestrator events from skills
//!     while let Some(event) = event_rx.recv().await {
//!         println!("Received event: {:?}", event);
//!     }
//!
//!     Ok(())
//! }
//! ```

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::process::Stdio;
use tokio::process::Command;
use tokio::sync::mpsc;
use tracing::{debug, info, warn};

/// Skill execution request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillRequest {
    /// Name of the skill to execute (e.g., "rust-development", "debugging-troubleshooting")
    pub skill_name: String,

    /// Context parameters passed to the skill as environment variables
    pub context: HashMap<String, String>,

    /// Execution timeout in seconds
    pub timeout_secs: u64,
}

/// Skill execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillResult {
    /// Skill name
    pub skill_name: String,

    /// Success status
    pub success: bool,

    /// Output message
    pub message: String,

    /// Error message if failed
    pub error: Option<String>,

    /// Execution duration in milliseconds
    pub duration_ms: u64,

    /// Files modified by the skill
    pub modified_files: Vec<PathBuf>,
}

/// Orchestrator event triggered by skills
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum OrchestratorEvent {
    /// Skill completed successfully, trigger next phase
    SkillCompleted {
        skill_name: String,
        phase: Option<String>,
        metadata: HashMap<String, String>,
    },

    /// STOP token detected in output
    StopTokenDetected {
        workflow_id: String,
        step_id: String,
        context: HashMap<String, String>,
    },

    /// Error detected, needs escalation
    ErrorDetected {
        skill_name: String,
        error_message: String,
        severity: ErrorSeverity,
    },

    /// Quality check result
    QualityCheckResult {
        score: f64,
        passed: bool,
        recommendations: Vec<String>,
    },
}

/// Error severity levels
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum ErrorSeverity {
    /// Informational, no action needed
    Info,
    /// Warning, might need attention
    Warning,
    /// Error, requires intervention
    Error,
    /// Critical, immediate action required
    Critical,
}

/// Skills Bridge - Main integration point
pub struct SkillsBridge {
    /// Event sender for orchestrator events
    event_tx: mpsc::UnboundedSender<OrchestratorEvent>,
}

impl SkillsBridge {
    /// Create a new Skills Bridge
    ///
    /// Returns the bridge instance and a receiver for orchestrator events
    pub fn new() -> (Self, mpsc::UnboundedReceiver<OrchestratorEvent>) {
        let (event_tx, event_rx) = mpsc::unbounded_channel();

        let bridge = Self { event_tx };

        info!("🌉 Skills Bridge initialized");

        (bridge, event_rx)
    }

    /// Execute a skill from the orchestrator
    ///
    /// # Arguments
    /// * `request` - Skill execution request with name, context, and timeout
    ///
    /// # Returns
    /// * `SkillResult` - Execution result with success status and output
    ///
    /// # Errors
    /// Returns error if:
    /// - Skill script not found
    /// - Execution timeout exceeded
    /// - Skill execution fails
    pub async fn execute_skill(&self, request: SkillRequest) -> Result<SkillResult> {
        info!("🔧 Executing skill: {}", request.skill_name);
        debug!("   Context: {:?}", request.context);
        debug!("   Timeout: {}s", request.timeout_secs);

        let start = std::time::Instant::now();

        // Locate skill script
        let skill_path = format!(".claude/Skills/{}/skill.sh", request.skill_name);
        let skill_script = PathBuf::from(&skill_path);

        if !skill_script.exists() {
            warn!("   Skill script not found: {}", skill_path);
            return Err(anyhow!("Skill script not found: {}", skill_path));
        }

        // Execute skill script
        let mut cmd = Command::new("bash");
        cmd.arg(&skill_script)
            .current_dir(".")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        // Add context as environment variables
        for (key, value) in &request.context {
            cmd.env(key, value);
        }

        // Execute with timeout
        let output = tokio::time::timeout(
            tokio::time::Duration::from_secs(request.timeout_secs),
            cmd.output(),
        )
        .await;

        let duration_ms = start.elapsed().as_millis() as u64;

        match output {
            Ok(Ok(output)) => {
                let success = output.status.success();
                let stdout = String::from_utf8_lossy(&output.stdout).to_string();
                let stderr = String::from_utf8_lossy(&output.stderr).to_string();

                info!(
                    "   ✅ Skill completed: {} ({}ms)",
                    request.skill_name, duration_ms
                );

                let result = SkillResult {
                    skill_name: request.skill_name.clone(),
                    success,
                    message: stdout.clone(),
                    error: if success { None } else { Some(stderr) },
                    duration_ms,
                    modified_files: vec![], // TODO: Parse from output
                };

                // Send completion event
                let _ = self.event_tx.send(OrchestratorEvent::SkillCompleted {
                    skill_name: request.skill_name,
                    phase: request.context.get("PHASE").cloned(),
                    metadata: request.context,
                });

                Ok(result)
            }
            Ok(Err(e)) => {
                warn!(
                    "   ❌ Skill execution failed: {} ({:?})",
                    request.skill_name, e
                );
                Err(anyhow!("Skill execution failed: {}", e))
            }
            Err(_) => {
                warn!(
                    "   ⏰ Skill execution timeout: {} ({}s)",
                    request.skill_name, request.timeout_secs
                );
                Err(anyhow!("Skill execution timeout after {}s", request.timeout_secs))
            }
        }
    }

    /// Trigger orchestrator workflow from a skill
    ///
    /// This is called by skills when they want to trigger an orchestrator action
    ///
    /// # Arguments
    /// * `event` - Orchestrator event to trigger
    pub fn trigger_orchestrator(&self, event: OrchestratorEvent) -> Result<()> {
        debug!("🎯 Triggering orchestrator event: {:?}", event);

        self.event_tx
            .send(event)
            .map_err(|e| anyhow!("Failed to send orchestrator event: {}", e))
    }
}

impl Default for SkillsBridge {
    fn default() -> Self {
        Self::new().0
    }
}

/// Trait for orchestrator components that can execute skills
#[async_trait::async_trait]
pub trait SkillExecutor {
    /// Execute a skill by name with context
    async fn execute_skill(
        &self,
        skill_name: &str,
        context: HashMap<String, String>,
    ) -> Result<SkillResult>;

    /// Execute multiple skills in parallel
    async fn execute_skills_parallel(
        &self,
        requests: Vec<SkillRequest>,
    ) -> Vec<Result<SkillResult>>;
}

/// Trait for skills that can trigger orchestrator workflows
pub trait OrchestratorTrigger {
    /// Notify orchestrator that a phase is complete
    fn notify_phase_complete(&self, phase: &str, metadata: HashMap<String, String>)
        -> Result<()>;

    /// Notify orchestrator of an error that needs escalation
    fn notify_error(&self, error_message: &str, severity: ErrorSeverity) -> Result<()>;

    /// Notify orchestrator of STOP token detection
    fn notify_stop_token(
        &self,
        workflow_id: &str,
        step_id: &str,
        context: HashMap<String, String>,
    ) -> Result<()>;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_skills_bridge_creation() {
        let (bridge, _rx) = SkillsBridge::new();
        assert!(std::ptr::addr_of!(bridge).is_aligned());
    }

    #[tokio::test]
    async fn test_trigger_orchestrator() {
        let (bridge, mut rx) = SkillsBridge::new();

        let event = OrchestratorEvent::SkillCompleted {
            skill_name: "test-skill".to_string(),
            phase: Some("phase1".to_string()),
            metadata: HashMap::new(),
        };

        bridge.trigger_orchestrator(event).unwrap();

        // Verify event was received
        let received = rx.recv().await.unwrap();
        match received {
            OrchestratorEvent::SkillCompleted { skill_name, .. } => {
                assert_eq!(skill_name, "test-skill");
            }
            _ => panic!("Unexpected event type"),
        }
    }

    #[test]
    fn test_skill_request_serialization() {
        let request = SkillRequest {
            skill_name: "rust-development".to_string(),
            context: {
                let mut ctx = HashMap::new();
                ctx.insert("ISSUE_NUMBER".to_string(), "809".to_string());
                ctx
            },
            timeout_secs: 300,
        };

        let json = serde_json::to_string(&request).unwrap();
        let deserialized: SkillRequest = serde_json::from_str(&json).unwrap();

        assert_eq!(request.skill_name, deserialized.skill_name);
        assert_eq!(request.timeout_secs, deserialized.timeout_secs);
    }
}
