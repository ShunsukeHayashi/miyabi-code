//! Checkpoint management for crash recovery
//!
//! This module provides checkpoint/restore functionality for the 5-Worlds execution system.
//! Checkpoints are saved periodically (every 5 minutes) and on significant events.

use chrono::{DateTime, Utc};
use miyabi_types::error::MiyabiError;
use miyabi_types::world::WorldId;
use serde::{Deserialize, Serialize};
use sqlx::{Sqlite, SqlitePool};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;
use tokio::time;
use tracing::{debug, info, warn};

/// Types of checkpoints that can be saved
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type")]
pub enum CheckpointType {
    /// Worktree was created for a world
    WorktreeCreated {
        world_id: WorldId,
        path: PathBuf,
        branch: String,
    },
    /// All 5 worlds were spawned for a task
    WorldsSpawned {
        task_id: i64,
        world_ids: Vec<WorldId>,
    },
    /// A single world completed execution
    WorldCompleted {
        world_id: WorldId,
        score: f64,
        artifacts: Vec<PathBuf>,
    },
    /// Evaluation completed, winner selected
    EvaluationDone {
        winning_world: WorldId,
        all_scores: HashMap<WorldId, f64>,
    },
    /// Ready to merge winner's changes
    MergeReady {
        winning_world: WorldId,
        pr_number: Option<u64>,
    },
}

impl CheckpointType {
    /// Gets the checkpoint type name for database storage
    pub fn type_name(&self) -> &'static str {
        match self {
            CheckpointType::WorktreeCreated { .. } => "WorktreeCreated",
            CheckpointType::WorldsSpawned { .. } => "WorldsSpawned",
            CheckpointType::WorldCompleted { .. } => "WorldCompleted",
            CheckpointType::EvaluationDone { .. } => "EvaluationDone",
            CheckpointType::MergeReady { .. } => "MergeReady",
        }
    }

    /// Extracts WorldId if present
    pub fn world_id(&self) -> Option<WorldId> {
        match self {
            CheckpointType::WorktreeCreated { world_id, .. } => Some(*world_id),
            CheckpointType::WorldCompleted { world_id, .. } => Some(*world_id),
            CheckpointType::EvaluationDone { winning_world, .. } => Some(*winning_world),
            CheckpointType::MergeReady { winning_world, .. } => Some(*winning_world),
            CheckpointType::WorldsSpawned { .. } => None,
        }
    }
}

/// Checkpoint record stored in database
#[derive(Debug, Clone)]
pub struct Checkpoint {
    pub id: i64,
    pub run_id: i64,
    pub checkpoint_type: CheckpointType,
    pub created_at: DateTime<Utc>,
}

/// Manages checkpoint creation and retrieval
pub struct CheckpointManager {
    db: Arc<SqlitePool>,
    /// Interval for automatic checkpointing (default: 5 minutes)
    interval: Duration,
}

impl CheckpointManager {
    /// Creates a new CheckpointManager
    ///
    /// # Arguments
    /// * `db` - SQLite connection pool
    /// * `interval` - Auto-checkpoint interval (default: 5 minutes)
    pub fn new(db: Arc<SqlitePool>, interval: Duration) -> Self {
        Self { db, interval }
    }

    /// Creates a CheckpointManager with default 5-minute interval
    pub fn with_default_interval(db: Arc<SqlitePool>) -> Self {
        Self::new(db, Duration::from_secs(5 * 60))
    }

    /// Saves a checkpoint to the database
    ///
    /// # Arguments
    /// * `run_id` - Execution run ID
    /// * `checkpoint` - Checkpoint data to save
    ///
    /// # Returns
    /// Checkpoint ID on success
    pub async fn save_checkpoint(
        &self,
        run_id: i64,
        checkpoint: CheckpointType,
    ) -> Result<i64, MiyabiError> {
        let type_name = checkpoint.type_name();
        let world_id_str = checkpoint.world_id().map(|w| format!("{:?}", w));
        let data_json = serde_json::to_string(&checkpoint)
            .map_err(|e| MiyabiError::Unknown(format!("Failed to serialize checkpoint: {}", e)))?;

        let result = sqlx::query(
            r#"
            INSERT INTO checkpoints (run_id, checkpoint_type, world_id, data, created_at)
            VALUES (?, ?, ?, ?, ?)
            "#,
        )
        .bind(run_id)
        .bind(type_name)
        .bind(world_id_str)
        .bind(data_json)
        .bind(Utc::now())
        .execute(&*self.db)
        .await
        .map_err(|e| MiyabiError::Unknown(format!("Failed to insert checkpoint: {}", e)))?;

        let checkpoint_id = result.last_insert_rowid();

        debug!(
            run_id = run_id,
            checkpoint_id = checkpoint_id,
            checkpoint_type = type_name,
            "Saved checkpoint"
        );

        Ok(checkpoint_id)
    }

    /// Gets the latest checkpoint for a run
    ///
    /// # Arguments
    /// * `run_id` - Execution run ID
    ///
    /// # Returns
    /// Most recent checkpoint, or None if no checkpoints exist
    pub async fn get_latest_checkpoint(
        &self,
        run_id: i64,
    ) -> Result<Option<Checkpoint>, MiyabiError> {
        let row = sqlx::query_as::<Sqlite, (i64, i64, String, DateTime<Utc>)>(
            r#"
            SELECT id, run_id, data, created_at
            FROM checkpoints
            WHERE run_id = ?
            ORDER BY created_at DESC
            LIMIT 1
            "#,
        )
        .bind(run_id)
        .fetch_optional(&*self.db)
        .await
        .map_err(|e| MiyabiError::Unknown(format!("Failed to fetch checkpoint: {}", e)))?;

        if let Some((id, run_id, data_json, created_at)) = row {
            let checkpoint_type: CheckpointType = serde_json::from_str(&data_json)
                .map_err(|e| {
                    MiyabiError::Unknown(format!("Failed to deserialize checkpoint: {}", e))
                })?;

            Ok(Some(Checkpoint {
                id,
                run_id,
                checkpoint_type,
                created_at,
            }))
        } else {
            Ok(None)
        }
    }

    /// Gets all checkpoints for a run
    pub async fn get_all_checkpoints(&self, run_id: i64) -> Result<Vec<Checkpoint>, MiyabiError> {
        let rows = sqlx::query_as::<Sqlite, (i64, i64, String, DateTime<Utc>)>(
            r#"
            SELECT id, run_id, data, created_at
            FROM checkpoints
            WHERE run_id = ?
            ORDER BY created_at ASC
            "#,
        )
        .bind(run_id)
        .fetch_all(&*self.db)
        .await
        .map_err(|e| MiyabiError::Unknown(format!("Failed to fetch checkpoints: {}", e)))?;

        let mut checkpoints = Vec::new();
        for (id, run_id, data_json, created_at) in rows {
            let checkpoint_type: CheckpointType = serde_json::from_str(&data_json)
                .map_err(|e| {
                    MiyabiError::Unknown(format!("Failed to deserialize checkpoint: {}", e))
                })?;

            checkpoints.push(Checkpoint {
                id,
                run_id,
                checkpoint_type,
                created_at,
            });
        }

        Ok(checkpoints)
    }

    /// Gets checkpoints of a specific type
    pub async fn get_checkpoints_by_type(
        &self,
        run_id: i64,
        type_name: &str,
    ) -> Result<Vec<Checkpoint>, MiyabiError> {
        let rows = sqlx::query_as::<Sqlite, (i64, i64, String, DateTime<Utc>)>(
            r#"
            SELECT id, run_id, data, created_at
            FROM checkpoints
            WHERE run_id = ? AND checkpoint_type = ?
            ORDER BY created_at ASC
            "#,
        )
        .bind(run_id)
        .bind(type_name)
        .fetch_all(&*self.db)
        .await
        .map_err(|e| MiyabiError::Unknown(format!("Failed to fetch checkpoints: {}", e)))?;

        let mut checkpoints = Vec::new();
        for (id, run_id, data_json, created_at) in rows {
            let checkpoint_type: CheckpointType = serde_json::from_str(&data_json)
                .map_err(|e| {
                    MiyabiError::Unknown(format!("Failed to deserialize checkpoint: {}", e))
                })?;

            checkpoints.push(Checkpoint {
                id,
                run_id,
                checkpoint_type,
                created_at,
            });
        }

        Ok(checkpoints)
    }

    /// Starts automatic checkpoint loop (runs indefinitely)
    ///
    /// This should be spawned in a background task. It will save a periodic
    /// checkpoint every `interval` duration.
    ///
    /// # Arguments
    /// * `run_id` - Execution run ID
    /// * `get_checkpoint` - Callback to generate checkpoint data
    pub async fn auto_checkpoint_loop<F>(
        &self,
        run_id: i64,
        mut get_checkpoint: F,
    ) where
        F: FnMut() -> Option<CheckpointType> + Send,
    {
        let mut interval_timer = time::interval(self.interval);

        loop {
            interval_timer.tick().await;

            if let Some(checkpoint) = get_checkpoint() {
                match self.save_checkpoint(run_id, checkpoint).await {
                    Ok(checkpoint_id) => {
                        info!(
                            run_id = run_id,
                            checkpoint_id = checkpoint_id,
                            "Auto-checkpoint saved"
                        );
                    }
                    Err(e) => {
                        warn!(
                            run_id = run_id,
                            error = %e,
                            "Failed to save auto-checkpoint"
                        );
                    }
                }
            } else {
                debug!(run_id = run_id, "No checkpoint data available, skipping");
            }
        }
    }

    /// Deletes old checkpoints (cleanup)
    ///
    /// # Arguments
    /// * `run_id` - Execution run ID
    /// * `keep_latest` - Number of latest checkpoints to keep
    pub async fn cleanup_old_checkpoints(
        &self,
        run_id: i64,
        keep_latest: usize,
    ) -> Result<u64, MiyabiError> {
        let result = sqlx::query(
            r#"
            DELETE FROM checkpoints
            WHERE run_id = ? AND id NOT IN (
                SELECT id FROM checkpoints
                WHERE run_id = ?
                ORDER BY created_at DESC
                LIMIT ?
            )
            "#,
        )
        .bind(run_id)
        .bind(run_id)
        .bind(keep_latest as i64)
        .execute(&*self.db)
        .await
        .map_err(|e| MiyabiError::Unknown(format!("Failed to cleanup checkpoints: {}", e)))?;

        Ok(result.rows_affected())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_checkpoint_type_names() {
        let cp1 = CheckpointType::WorktreeCreated {
            world_id: WorldId::Alpha,
            path: PathBuf::from("/tmp/test"),
            branch: "test".to_string(),
        };
        assert_eq!(cp1.type_name(), "WorktreeCreated");

        let cp2 = CheckpointType::WorldsSpawned {
            task_id: 1,
            world_ids: vec![WorldId::Alpha, WorldId::Beta],
        };
        assert_eq!(cp2.type_name(), "WorldsSpawned");
    }

    #[test]
    fn test_checkpoint_world_id() {
        let cp1 = CheckpointType::WorktreeCreated {
            world_id: WorldId::Alpha,
            path: PathBuf::from("/tmp/test"),
            branch: "test".to_string(),
        };
        assert_eq!(cp1.world_id(), Some(WorldId::Alpha));

        let cp2 = CheckpointType::WorldsSpawned {
            task_id: 1,
            world_ids: vec![WorldId::Alpha],
        };
        assert_eq!(cp2.world_id(), None);
    }

    #[test]
    fn test_checkpoint_serialization() {
        let cp = CheckpointType::EvaluationDone {
            winning_world: WorldId::Beta,
            all_scores: HashMap::from([
                (WorldId::Alpha, 85.0),
                (WorldId::Beta, 92.0),
                (WorldId::Gamma, 78.0),
            ]),
        };

        let json = serde_json::to_string(&cp).unwrap();
        assert!(json.contains("Beta"));
        assert!(json.contains("92.0"));

        let deserialized: CheckpointType = serde_json::from_str(&json).unwrap();
        assert_eq!(cp, deserialized);
    }
}
