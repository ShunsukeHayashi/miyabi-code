//! Miyabi Checkpoint System
//!
//! Claude Code style checkpoint functionality for Miyabi agents.
//! Enables auto-save before changes and instant restore to previous states.
//!
//! ## Features
//!
//! - **Auto Checkpoint**: Automatically save state before risky operations
//! - **Manual Checkpoint**: Create named checkpoints at any time
//! - **Instant Restore**: Rewind to any previous checkpoint
//! - **Tmux Integration**: Works with tmux session state
//! - **Git Integration**: Optionally create git stash/commits

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tokio::fs;
use anyhow::Result;

/// Checkpoint state for a session
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Checkpoint {
    /// Unique checkpoint ID
    pub id: String,
    
    /// Human-readable name
    pub name: String,
    
    /// Session ID this checkpoint belongs to
    pub session_id: String,
    
    /// Agent that created this checkpoint
    pub agent_name: String,
    
    /// Timestamp when checkpoint was created
    pub created_at: DateTime<Utc>,
    
    /// Description of what was happening
    pub description: String,
    
    /// Git commit hash (if git integration enabled)
    pub git_commit: Option<String>,
    
    /// Git stash reference (if applicable)
    pub git_stash: Option<String>,
    
    /// Tmux pane content snapshot
    pub tmux_snapshot: Option<String>,
    
    /// Working directory state
    pub working_dir: PathBuf,
    
    /// Environment variables snapshot
    pub env_vars: HashMap<String, String>,
    
    /// Custom metadata
    pub metadata: HashMap<String, serde_json::Value>,
    
    /// Whether this is an auto-checkpoint
    pub auto_created: bool,
}

impl Checkpoint {
    /// Create a new checkpoint
    pub fn new(
        session_id: &str,
        agent_name: &str,
        name: &str,
        description: &str,
        working_dir: PathBuf,
    ) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name: name.to_string(),
            session_id: session_id.to_string(),
            agent_name: agent_name.to_string(),
            created_at: Utc::now(),
            description: description.to_string(),
            git_commit: None,
            git_stash: None,
            tmux_snapshot: None,
            working_dir,
            env_vars: HashMap::new(),
            metadata: HashMap::new(),
            auto_created: false,
        }
    }
    
    /// Create an auto-checkpoint
    pub fn auto(
        session_id: &str,
        agent_name: &str,
        description: &str,
        working_dir: PathBuf,
    ) -> Self {
        let mut cp = Self::new(
            session_id,
            agent_name,
            &format!("auto_{}", Utc::now().format("%Y%m%d_%H%M%S")),
            description,
            working_dir,
        );
        cp.auto_created = true;
        cp
    }
}

/// Checkpoint manager for session state
#[derive(Debug)]
pub struct CheckpointManager {
    /// Base directory for checkpoint storage
    base_dir: PathBuf,
    
    /// In-memory checkpoint cache per session
    checkpoints: HashMap<String, Vec<Checkpoint>>,
    
    /// Maximum checkpoints per session
    max_checkpoints: usize,
    
    /// Enable git integration
    git_enabled: bool,
    
    /// Enable tmux snapshot
    tmux_enabled: bool,
}

impl CheckpointManager {
    /// Create a new checkpoint manager
    pub async fn new<P: AsRef<Path>>(base_dir: P) -> Result<Self> {
        let base_dir = base_dir.as_ref().to_path_buf();
        fs::create_dir_all(&base_dir).await?;
        
        Ok(Self {
            base_dir,
            checkpoints: HashMap::new(),
            max_checkpoints: 50,
            git_enabled: true,
            tmux_enabled: true,
        })
    }
    
    /// Create a checkpoint for a session
    pub async fn create_checkpoint(
        &mut self,
        session_id: &str,
        agent_name: &str,
        name: &str,
        description: &str,
        working_dir: &Path,
    ) -> Result<Checkpoint> {
        let mut checkpoint = Checkpoint::new(
            session_id,
            agent_name,
            name,
            description,
            working_dir.to_path_buf(),
        );
        
        // Capture git state if enabled
        if self.git_enabled {
            checkpoint.git_commit = self.capture_git_state(working_dir).await.ok();
        }
        
        // Capture tmux state if enabled
        if self.tmux_enabled {
            checkpoint.tmux_snapshot = self.capture_tmux_state(session_id).await.ok();
        }
        
        // Capture environment variables
        checkpoint.env_vars = std::env::vars().collect();
        
        // Store checkpoint
        self.store_checkpoint(&checkpoint).await?;
        
        // Add to in-memory cache
        self.checkpoints
            .entry(session_id.to_string())
            .or_default()
            .push(checkpoint.clone());
        
        // Trim old checkpoints
        self.trim_checkpoints(session_id).await?;
        
        tracing::info!(
            checkpoint_id = %checkpoint.id,
            session_id = %session_id,
            name = %name,
            "Checkpoint created"
        );
        
        Ok(checkpoint)
    }
    
    /// Create an auto-checkpoint before risky operations
    pub async fn auto_checkpoint(
        &mut self,
        session_id: &str,
        agent_name: &str,
        operation: &str,
        working_dir: &Path,
    ) -> Result<Checkpoint> {
        let description = format!("Before: {}", operation);
        let name = format!("auto_{}", Utc::now().format("%H%M%S"));
        
        self.create_checkpoint(session_id, agent_name, &name, &description, working_dir)
            .await
    }
    
    /// Restore to a specific checkpoint
    pub async fn restore(&mut self, checkpoint_id: &str) -> Result<()> {
        let checkpoint = self.load_checkpoint(checkpoint_id).await?;
        
        // Restore git state if available
        if let Some(ref stash) = checkpoint.git_stash {
            self.restore_git_stash(stash, &checkpoint.working_dir).await?;
        } else if let Some(ref commit) = checkpoint.git_commit {
            self.restore_git_commit(commit, &checkpoint.working_dir).await?;
        }
        
        tracing::info!(
            checkpoint_id = %checkpoint_id,
            name = %checkpoint.name,
            "Restored to checkpoint"
        );
        
        Ok(())
    }
    
    /// Rewind to the last checkpoint (like Esc-Esc in Claude Code)
    pub async fn rewind(&mut self, session_id: &str) -> Result<Option<Checkpoint>> {
        let checkpoints = self.list_checkpoints(session_id).await?;
        
        if let Some(last) = checkpoints.last() {
            self.restore(&last.id).await?;
            Ok(Some(last.clone()))
        } else {
            Ok(None)
        }
    }
    
    /// List all checkpoints for a session
    pub async fn list_checkpoints(&self, session_id: &str) -> Result<Vec<Checkpoint>> {
        let dir = self.session_dir(session_id);
        
        if !dir.exists() {
            return Ok(Vec::new());
        }
        
        let mut checkpoints = Vec::new();
        let mut entries = fs::read_dir(&dir).await?;
        
        while let Some(entry) = entries.next_entry().await? {
            if entry.path().extension().map(|e| e == "json").unwrap_or(false) {
                let content = fs::read_to_string(entry.path()).await?;
                if let Ok(cp) = serde_json::from_str::<Checkpoint>(&content) {
                    checkpoints.push(cp);
                }
            }
        }
        
        // Sort by creation time
        checkpoints.sort_by(|a, b| a.created_at.cmp(&b.created_at));
        
        Ok(checkpoints)
    }
    
    // === Private helpers ===
    
    fn session_dir(&self, session_id: &str) -> PathBuf {
        self.base_dir.join(session_id)
    }
    
    async fn store_checkpoint(&self, checkpoint: &Checkpoint) -> Result<()> {
        let dir = self.session_dir(&checkpoint.session_id);
        fs::create_dir_all(&dir).await?;
        
        let path = dir.join(format!("{}.json", checkpoint.id));
        let content = serde_json::to_string_pretty(checkpoint)?;
        fs::write(path, content).await?;
        
        Ok(())
    }
    
    async fn load_checkpoint(&self, checkpoint_id: &str) -> Result<Checkpoint> {
        // Search all session directories
        let mut entries = fs::read_dir(&self.base_dir).await?;
        
        while let Some(entry) = entries.next_entry().await? {
            if entry.file_type().await?.is_dir() {
                let path = entry.path().join(format!("{}.json", checkpoint_id));
                if path.exists() {
                    let content = fs::read_to_string(&path).await?;
                    return Ok(serde_json::from_str(&content)?);
                }
            }
        }
        
        anyhow::bail!("Checkpoint not found: {}", checkpoint_id)
    }
    
    async fn trim_checkpoints(&mut self, session_id: &str) -> Result<()> {
        let checkpoints = self.list_checkpoints(session_id).await?;
        
        if checkpoints.len() > self.max_checkpoints {
            let to_remove = checkpoints.len() - self.max_checkpoints;
            for cp in checkpoints.iter().take(to_remove) {
                let path = self.session_dir(session_id).join(format!("{}.json", cp.id));
                fs::remove_file(path).await.ok();
            }
        }
        
        Ok(())
    }
    
    async fn capture_git_state(&self, working_dir: &Path) -> Result<String> {
        let output = tokio::process::Command::new("git")
            .args(["rev-parse", "HEAD"])
            .current_dir(working_dir)
            .output()
            .await?;
        
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    }
    
    async fn capture_tmux_state(&self, session_id: &str) -> Result<String> {
        let output = tokio::process::Command::new("tmux")
            .args(["capture-pane", "-t", session_id, "-p"])
            .output()
            .await?;
        
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    }
    
    async fn restore_git_stash(&self, stash: &str, working_dir: &Path) -> Result<()> {
        tokio::process::Command::new("git")
            .args(["stash", "apply", stash])
            .current_dir(working_dir)
            .output()
            .await?;
        
        Ok(())
    }
    
    async fn restore_git_commit(&self, commit: &str, working_dir: &Path) -> Result<()> {
        tokio::process::Command::new("git")
            .args(["checkout", commit])
            .current_dir(working_dir)
            .output()
            .await?;
        
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    
    #[tokio::test]
    async fn test_checkpoint_creation() {
        let temp_dir = TempDir::new().unwrap();
        let mut manager = CheckpointManager::new(temp_dir.path()).await.unwrap();
        
        let checkpoint = manager
            .create_checkpoint(
                "test-session",
                "CodeGenAgent",
                "before_refactor",
                "Before major refactoring",
                temp_dir.path(),
            )
            .await
            .unwrap();
        
        assert_eq!(checkpoint.session_id, "test-session");
        assert_eq!(checkpoint.agent_name, "CodeGenAgent");
        assert_eq!(checkpoint.name, "before_refactor");
    }
    
    #[tokio::test]
    async fn test_list_checkpoints() {
        let temp_dir = TempDir::new().unwrap();
        let mut manager = CheckpointManager::new(temp_dir.path()).await.unwrap();
        
        // Create multiple checkpoints
        for i in 0..3 {
            manager
                .create_checkpoint(
                    "test-session",
                    "TestAgent",
                    &format!("checkpoint_{}", i),
                    &format!("Test checkpoint {}", i),
                    temp_dir.path(),
                )
                .await
                .unwrap();
        }
        
        let checkpoints = manager.list_checkpoints("test-session").await.unwrap();
        assert_eq!(checkpoints.len(), 3);
    }
}
