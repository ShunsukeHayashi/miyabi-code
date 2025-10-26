//! Auto-indexing hook for agent execution lifecycle
//!
//! This hook automatically indexes log files into the knowledge system
//! after agent execution completes.

use crate::hooks::AgentHook;
use async_trait::async_trait;
use miyabi_knowledge::cache::IndexCache;
use miyabi_knowledge::collector::{KnowledgeCollector, LogCollector};
use miyabi_knowledge::config::KnowledgeConfig;
use miyabi_knowledge::hasher::hash_file;
use miyabi_knowledge::indexer::{KnowledgeIndexer, QdrantIndexer};
use miyabi_types::agent::AgentType;
use miyabi_types::error::{MiyabiError, Result};
use miyabi_types::{AgentResult, Task};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::time::{sleep, Duration};
use tracing::{debug, info, warn};

/// Hook that auto-indexes execution logs to knowledge system
pub struct AutoIndexHook {
    /// Knowledge configuration
    config: Arc<KnowledgeConfig>,

    /// Log directory to monitor
    log_dir: PathBuf,
}

impl AutoIndexHook {
    /// Create new AutoIndexHook
    pub fn new(config: KnowledgeConfig) -> Self {
        let log_dir = config.collection.log_dir.clone();
        Self {
            config: Arc::new(config),
            log_dir,
        }
    }

    /// Get the log file path for a specific task
    fn get_log_file_path(&self, task: &Task) -> PathBuf {
        let date = chrono::Utc::now().format("%Y-%m-%d").to_string();

        // Check if task has worktree_id in metadata
        let worktree_id = task
            .metadata
            .as_ref()
            .and_then(|m| m.get("worktree_id"))
            .and_then(|v| v.as_str());

        let filename = if let Some(wt_id) = worktree_id {
            format!("{}-worktree-{}.md", date, wt_id)
        } else {
            format!("{}.md", date)
        };

        self.log_dir.join(filename)
    }

    /// Perform background indexing (spawned as async task)
    async fn index_log_file(config: Arc<KnowledgeConfig>, log_file: PathBuf) {
        // Check if auto-indexing is enabled
        if !config.auto_index.enabled {
            debug!("Auto-indexing disabled, skipping");
            return;
        }

        // Delay before indexing (to allow log file writes to complete)
        let delay = Duration::from_secs(config.auto_index.delay_seconds);
        sleep(delay).await;

        // Retry loop
        for attempt in 1..=config.auto_index.retry_count {
            match Self::try_index_file(config.clone(), &log_file).await {
                Ok(entry_count) => {
                    info!(
                        "Auto-indexed {} entries from {:?} (attempt {}/{})",
                        entry_count,
                        log_file,
                        attempt,
                        config.auto_index.retry_count
                    );
                    return;
                }
                Err(e) => {
                    if attempt < config.auto_index.retry_count {
                        warn!(
                            "Auto-indexing failed (attempt {}/{}): {} - retrying...",
                            attempt, config.auto_index.retry_count, e
                        );
                        sleep(Duration::from_secs(2)).await;
                    } else {
                        warn!(
                            "Auto-indexing failed after {} attempts: {}",
                            config.auto_index.retry_count, e
                        );
                    }
                }
            }
        }
    }

    /// Try to index a single log file with deduplication
    async fn try_index_file(
        config: Arc<KnowledgeConfig>,
        log_file: &PathBuf,
    ) -> Result<usize> {
        // Calculate file hash for deduplication
        let file_hash = hash_file(log_file)
            .map_err(|e| MiyabiError::Io(std::io::Error::other(e)))?;

        // Load cache
        let mut cache = IndexCache::load_or_default(&config.workspace.name)
            .map_err(|e| MiyabiError::Config(format!("Failed to load cache: {}", e)))?;

        // Check if file is already indexed
        if cache.is_indexed(log_file, &file_hash) {
            debug!(
                "Skipping already indexed file: {:?} (hash: {})",
                log_file, file_hash
            );
            return Ok(0);
        }

        info!(
            "Indexing changed file: {:?} (hash: {})",
            log_file, file_hash
        );

        // Initialize collector
        let collector = LogCollector::new((*config).clone())
            .map_err(|e| MiyabiError::Config(format!("Failed to create collector: {}", e)))?;

        // Collect entries from log file
        let entries = collector
            .collect(log_file)
            .await
            .map_err(|e| MiyabiError::Io(std::io::Error::other(e)))?;

        if entries.is_empty() {
            debug!("No entries to index from {:?}", log_file);
            // Still mark as indexed to avoid re-checking empty files
            cache.mark_indexed(log_file.clone(), file_hash);
            cache
                .save()
                .map_err(|e| MiyabiError::Config(format!("Failed to save cache: {}", e)))?;
            return Ok(0);
        }

        // Initialize indexer
        let indexer = QdrantIndexer::new((*config).clone())
            .await
            .map_err(|e| MiyabiError::Config(format!("Failed to create indexer: {}", e)))?;

        // Index entries
        let stats = indexer
            .index_batch(&entries)
            .await
            .map_err(|e| MiyabiError::Config(format!("Failed to index entries: {}", e)))?;

        // Update cache
        cache.mark_indexed(log_file.clone(), file_hash);
        cache
            .save()
            .map_err(|e| MiyabiError::Config(format!("Failed to save cache: {}", e)))?;

        info!(
            "Successfully indexed {} entries from {:?}",
            stats.success, log_file
        );

        Ok(stats.success)
    }
}

#[async_trait]
impl AgentHook for AutoIndexHook {
    async fn on_post_execute(
        &self,
        agent: AgentType,
        task: &Task,
        _result: &AgentResult,
    ) -> Result<()> {
        let log_file = self.get_log_file_path(task);

        info!(
            "Scheduling auto-indexing for agent {:?} task {} -> {:?}",
            agent, task.id, log_file
        );

        // Spawn background task for indexing (non-blocking)
        let config = self.config.clone();
        tokio::spawn(async move {
            Self::index_log_file(config, log_file).await;
        });

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[test]
    fn test_get_log_file_path_without_worktree() {
        let config = KnowledgeConfig::default();
        let hook = AutoIndexHook::new(config);

        let task = Task {
            id: "test-task".into(),
            title: "Test".into(),
            description: "Test".into(),
            task_type: miyabi_types::task::TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: None,
            dependencies: vec![],
            estimated_duration: None,
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        };

        let path = hook.get_log_file_path(&task);
        let filename = path.file_name().unwrap().to_str().unwrap();

        // Should be in format: YYYY-MM-DD.md
        assert!(filename.ends_with(".md"));
        assert!(!filename.contains("worktree"));
    }

    #[test]
    fn test_get_log_file_path_with_worktree() {
        let config = KnowledgeConfig::default();
        let hook = AutoIndexHook::new(config);

        let mut metadata = HashMap::new();
        metadata.insert("worktree_id".to_string(), serde_json::json!("test-wt-123"));

        let task = Task {
            id: "test-task".into(),
            title: "Test".into(),
            description: "Test".into(),
            task_type: miyabi_types::task::TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: None,
            dependencies: vec![],
            estimated_duration: None,
            status: None,
            start_time: None,
            end_time: None,
            metadata: Some(metadata),
        };

        let path = hook.get_log_file_path(&task);
        let filename = path.file_name().unwrap().to_str().unwrap();

        // Should be in format: YYYY-MM-DD-worktree-test-wt-123.md
        assert!(filename.contains("worktree-test-wt-123"));
        assert!(filename.ends_with(".md"));
    }
}
