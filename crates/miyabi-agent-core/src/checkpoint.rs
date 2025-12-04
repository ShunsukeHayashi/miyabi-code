//! Checkpoint system for Claude Code integration
//!
//! Provides automatic state saving and rewind functionality,
//! similar to Claude Code's checkpoint feature.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use tokio::sync::RwLock;
use uuid::Uuid;

/// Checkpoint identifier
pub type CheckpointId = Uuid;

/// Checkpoint state snapshot
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Checkpoint {
    /// Unique checkpoint ID
    pub id: CheckpointId,
    /// Parent checkpoint ID (for history chain)
    pub parent_id: Option<CheckpointId>,
    /// Creation timestamp
    pub created_at: DateTime<Utc>,
    /// Human-readable description
    pub description: String,
    /// Agent ID that created this checkpoint
    pub agent_id: String,
    /// Session ID
    pub session_id: String,
    /// Captured state data
    pub state: CheckpointState,
    /// Tags for categorization
    pub tags: Vec<String>,
    /// Whether this is an auto-save checkpoint
    pub auto_save: bool,
}

/// State data captured in a checkpoint
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckpointState {
    /// File system state (path -> content hash)
    pub files: HashMap<PathBuf, FileSnapshot>,
    /// Environment variables
    pub environment: HashMap<String, String>,
    /// Working directory
    pub working_directory: PathBuf,
    /// Git state (branch, commit hash)
    pub git_state: Option<GitState>,
    /// Custom metadata
    pub metadata: HashMap<String, serde_json::Value>,
}

/// File snapshot in checkpoint
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileSnapshot {
    /// Content hash (SHA-256)
    pub hash: String,
    /// File size in bytes
    pub size: u64,
    /// Last modified time
    pub modified_at: DateTime<Utc>,
    /// Whether content is stored
    pub content_stored: bool,
}

/// Git repository state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitState {
    /// Current branch name
    pub branch: String,
    /// Current commit hash
    pub commit_hash: String,
    /// Whether there are uncommitted changes
    pub dirty: bool,
    /// Stash entries
    pub stash_count: usize,
}

/// Checkpoint manager for creating, storing, and restoring checkpoints
pub struct CheckpointManager {
    /// Storage backend
    storage: Box<dyn CheckpointStorage + Send + Sync>,
    /// In-memory checkpoint cache
    cache: RwLock<HashMap<CheckpointId, Checkpoint>>,
    /// Current session's checkpoint chain
    checkpoint_chain: RwLock<Vec<CheckpointId>>,
    /// Auto-save configuration
    auto_save_config: AutoSaveConfig,
}

/// Auto-save configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutoSaveConfig {
    /// Enable auto-save
    pub enabled: bool,
    /// Interval between auto-saves (seconds)
    pub interval_seconds: u64,
    /// Max number of auto-save checkpoints to keep
    pub max_auto_saves: usize,
    /// Trigger auto-save on file changes
    pub on_file_change: bool,
    /// Trigger auto-save before risky operations
    pub before_risky_ops: bool,
}

impl Default for AutoSaveConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            interval_seconds: 300, // 5 minutes
            max_auto_saves: 10,
            on_file_change: true,
            before_risky_ops: true,
        }
    }
}

/// Checkpoint storage trait
#[async_trait::async_trait]
pub trait CheckpointStorage {
    /// Save checkpoint to storage
    async fn save(&self, checkpoint: &Checkpoint) -> Result<(), CheckpointError>;
    
    /// Load checkpoint from storage
    async fn load(&self, id: CheckpointId) -> Result<Option<Checkpoint>, CheckpointError>;
    
    /// List all checkpoints for a session
    async fn list(&self, session_id: &str) -> Result<Vec<CheckpointId>, CheckpointError>;
    
    /// Delete checkpoint from storage
    async fn delete(&self, id: CheckpointId) -> Result<(), CheckpointError>;
    
    /// Store file content
    async fn store_content(&self, hash: &str, content: &[u8]) -> Result<(), CheckpointError>;
    
    /// Retrieve file content
    async fn get_content(&self, hash: &str) -> Result<Option<Vec<u8>>, CheckpointError>;
}

/// Checkpoint error types
#[derive(Debug, thiserror::Error)]
pub enum CheckpointError {
    #[error("Checkpoint not found: {0}")]
    NotFound(CheckpointId),
    #[error("Storage error: {0}")]
    Storage(String),
    #[error("Serialization error: {0}")]
    Serialization(String),
    #[error("File system error: {0}")]
    FileSystem(String),
    #[error("Git error: {0}")]
    Git(String),
    #[error("Invalid checkpoint chain")]
    InvalidChain,
}

impl CheckpointManager {
    /// Create new checkpoint manager
    pub fn new(storage: Box<dyn CheckpointStorage + Send + Sync>) -> Self {
        Self {
            storage,
            cache: RwLock::new(HashMap::new()),
            checkpoint_chain: RwLock::new(Vec::new()),
            auto_save_config: AutoSaveConfig::default(),
        }
    }

    /// Create new checkpoint manager with custom config
    pub fn with_config(
        storage: Box<dyn CheckpointStorage + Send + Sync>,
        config: AutoSaveConfig,
    ) -> Self {
        Self {
            storage,
            cache: RwLock::new(HashMap::new()),
            checkpoint_chain: RwLock::new(Vec::new()),
            auto_save_config: config,
        }
    }

    /// Create a new checkpoint
    pub async fn create(
        &self,
        agent_id: &str,
        session_id: &str,
        description: &str,
        state: CheckpointState,
        tags: Vec<String>,
        auto_save: bool,
    ) -> Result<Checkpoint, CheckpointError> {
        let chain = self.checkpoint_chain.read().await;
        let parent_id = chain.last().copied();
        drop(chain);

        let checkpoint = Checkpoint {
            id: Uuid::new_v4(),
            parent_id,
            created_at: Utc::now(),
            description: description.to_string(),
            agent_id: agent_id.to_string(),
            session_id: session_id.to_string(),
            state,
            tags,
            auto_save,
        };

        // Save to storage
        self.storage.save(&checkpoint).await?;

        // Update cache
        let mut cache = self.cache.write().await;
        cache.insert(checkpoint.id, checkpoint.clone());

        // Update chain
        let mut chain = self.checkpoint_chain.write().await;
        chain.push(checkpoint.id);

        Ok(checkpoint)
    }

    /// Rewind to a specific checkpoint
    pub async fn rewind(&self, checkpoint_id: CheckpointId) -> Result<Checkpoint, CheckpointError> {
        // Load checkpoint
        let checkpoint = self.storage.load(checkpoint_id).await?
            .ok_or(CheckpointError::NotFound(checkpoint_id))?;

        // Validate checkpoint is in current chain
        let chain = self.checkpoint_chain.read().await;
        let position = chain.iter().position(|&id| id == checkpoint_id)
            .ok_or(CheckpointError::InvalidChain)?;
        drop(chain);

        // Truncate chain to this checkpoint
        let mut chain = self.checkpoint_chain.write().await;
        chain.truncate(position + 1);

        Ok(checkpoint)
    }

    /// Get checkpoint by ID
    pub async fn get(&self, checkpoint_id: CheckpointId) -> Result<Option<Checkpoint>, CheckpointError> {
        // Check cache first
        let cache = self.cache.read().await;
        if let Some(checkpoint) = cache.get(&checkpoint_id) {
            return Ok(Some(checkpoint.clone()));
        }
        drop(cache);

        // Load from storage
        self.storage.load(checkpoint_id).await
    }

    /// List checkpoints in current session
    pub async fn list_session(&self, session_id: &str) -> Result<Vec<Checkpoint>, CheckpointError> {
        let ids = self.storage.list(session_id).await?;
        let mut checkpoints = Vec::new();
        
        for id in ids {
            if let Some(cp) = self.get(id).await? {
                checkpoints.push(cp);
            }
        }
        
        // Sort by creation time
        checkpoints.sort_by(|a, b| a.created_at.cmp(&b.created_at));
        
        Ok(checkpoints)
    }

    /// Get checkpoint chain (history)
    pub async fn get_chain(&self) -> Vec<CheckpointId> {
        self.checkpoint_chain.read().await.clone()
    }

    /// Get current (latest) checkpoint
    pub async fn current(&self) -> Option<CheckpointId> {
        self.checkpoint_chain.read().await.last().copied()
    }

    /// Clean up old auto-save checkpoints
    pub async fn cleanup_auto_saves(&self, session_id: &str) -> Result<usize, CheckpointError> {
        let checkpoints = self.list_session(session_id).await?;
        let auto_saves: Vec<_> = checkpoints.into_iter()
            .filter(|cp| cp.auto_save)
            .collect();

        if auto_saves.len() <= self.auto_save_config.max_auto_saves {
            return Ok(0);
        }

        let to_delete = auto_saves.len() - self.auto_save_config.max_auto_saves;
        let mut deleted = 0;

        for checkpoint in auto_saves.into_iter().take(to_delete) {
            self.storage.delete(checkpoint.id).await?;
            let mut cache = self.cache.write().await;
            cache.remove(&checkpoint.id);
            deleted += 1;
        }

        Ok(deleted)
    }
}

/// In-memory checkpoint storage (for testing)
pub struct MemoryCheckpointStorage {
    checkpoints: RwLock<HashMap<CheckpointId, Checkpoint>>,
    contents: RwLock<HashMap<String, Vec<u8>>>,
}

impl MemoryCheckpointStorage {
    pub fn new() -> Self {
        Self {
            checkpoints: RwLock::new(HashMap::new()),
            contents: RwLock::new(HashMap::new()),
        }
    }
}

impl Default for MemoryCheckpointStorage {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait::async_trait]
impl CheckpointStorage for MemoryCheckpointStorage {
    async fn save(&self, checkpoint: &Checkpoint) -> Result<(), CheckpointError> {
        let mut checkpoints = self.checkpoints.write().await;
        checkpoints.insert(checkpoint.id, checkpoint.clone());
        Ok(())
    }

    async fn load(&self, id: CheckpointId) -> Result<Option<Checkpoint>, CheckpointError> {
        let checkpoints = self.checkpoints.read().await;
        Ok(checkpoints.get(&id).cloned())
    }

    async fn list(&self, session_id: &str) -> Result<Vec<CheckpointId>, CheckpointError> {
        let checkpoints = self.checkpoints.read().await;
        Ok(checkpoints
            .values()
            .filter(|cp| cp.session_id == session_id)
            .map(|cp| cp.id)
            .collect())
    }

    async fn delete(&self, id: CheckpointId) -> Result<(), CheckpointError> {
        let mut checkpoints = self.checkpoints.write().await;
        checkpoints.remove(&id);
        Ok(())
    }

    async fn store_content(&self, hash: &str, content: &[u8]) -> Result<(), CheckpointError> {
        let mut contents = self.contents.write().await;
        contents.insert(hash.to_string(), content.to_vec());
        Ok(())
    }

    async fn get_content(&self, hash: &str) -> Result<Option<Vec<u8>>, CheckpointError> {
        let contents = self.contents.read().await;
        Ok(contents.get(hash).cloned())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_checkpoint_creation() {
        let storage = Box::new(MemoryCheckpointStorage::new());
        let manager = CheckpointManager::new(storage);

        let state = CheckpointState {
            files: HashMap::new(),
            environment: HashMap::new(),
            working_directory: PathBuf::from("/home/user/project"),
            git_state: Some(GitState {
                branch: "main".to_string(),
                commit_hash: "abc123".to_string(),
                dirty: false,
                stash_count: 0,
            }),
            metadata: HashMap::new(),
        };

        let checkpoint = manager
            .create("agent-1", "session-1", "Initial checkpoint", state, vec![], false)
            .await
            .unwrap();

        assert!(!checkpoint.auto_save);
        assert_eq!(checkpoint.description, "Initial checkpoint");
        assert!(checkpoint.parent_id.is_none());
    }

    #[tokio::test]
    async fn test_checkpoint_chain() {
        let storage = Box::new(MemoryCheckpointStorage::new());
        let manager = CheckpointManager::new(storage);

        let state = CheckpointState {
            files: HashMap::new(),
            environment: HashMap::new(),
            working_directory: PathBuf::from("/home/user/project"),
            git_state: None,
            metadata: HashMap::new(),
        };

        let cp1 = manager
            .create("agent-1", "session-1", "First", state.clone(), vec![], false)
            .await
            .unwrap();

        let cp2 = manager
            .create("agent-1", "session-1", "Second", state.clone(), vec![], false)
            .await
            .unwrap();

        assert_eq!(cp2.parent_id, Some(cp1.id));

        let chain = manager.get_chain().await;
        assert_eq!(chain.len(), 2);
        assert_eq!(chain[0], cp1.id);
        assert_eq!(chain[1], cp2.id);
    }

    #[tokio::test]
    async fn test_rewind() {
        let storage = Box::new(MemoryCheckpointStorage::new());
        let manager = CheckpointManager::new(storage);

        let state = CheckpointState {
            files: HashMap::new(),
            environment: HashMap::new(),
            working_directory: PathBuf::from("/home/user/project"),
            git_state: None,
            metadata: HashMap::new(),
        };

        let cp1 = manager
            .create("agent-1", "session-1", "First", state.clone(), vec![], false)
            .await
            .unwrap();

        let _cp2 = manager
            .create("agent-1", "session-1", "Second", state.clone(), vec![], false)
            .await
            .unwrap();

        let _cp3 = manager
            .create("agent-1", "session-1", "Third", state, vec![], false)
            .await
            .unwrap();

        // Rewind to first checkpoint
        let rewound = manager.rewind(cp1.id).await.unwrap();
        assert_eq!(rewound.id, cp1.id);

        // Chain should be truncated
        let chain = manager.get_chain().await;
        assert_eq!(chain.len(), 1);
        assert_eq!(chain[0], cp1.id);
    }
}
