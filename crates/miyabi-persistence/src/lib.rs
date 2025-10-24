//! Miyabi Persistence - SQLite persistence layer for 5-Worlds execution tracking
//!
//! This crate provides:
//! - SQLite database schema for tracking execution runs, tasks, worlds, and checkpoints
//! - Checkpoint management for crash recovery
//! - Database connection pooling and initialization
//! - Worktree tracking and cleanup
//!
//! # Example
//!
//! ```no_run
//! use miyabi_persistence::{Database, CheckpointManager, CheckpointType};
//! use miyabi_types::world::WorldId;
//! use std::sync::Arc;
//! use std::path::PathBuf;
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     // Open database
//!     let db = Database::open("sqlite:miyabi.db").await?;
//!     let pool = Arc::new(db.pool().clone());
//!
//!     // Create checkpoint manager
//!     let checkpoint_mgr = CheckpointManager::with_default_interval(pool);
//!
//!     // Save checkpoint
//!     let checkpoint = CheckpointType::WorktreeCreated {
//!         world_id: WorldId::Alpha,
//!         path: PathBuf::from("/worktrees/world-alpha"),
//!         branch: "world-alpha-issue-270".to_string(),
//!     };
//!
//!     let checkpoint_id = checkpoint_mgr.save_checkpoint(1, checkpoint).await?;
//!     println!("Saved checkpoint: {}", checkpoint_id);
//!
//!     Ok(())
//! }
//! ```

pub mod checkpoint;
pub mod database;
pub mod schema;

pub use checkpoint::{Checkpoint, CheckpointManager, CheckpointType};
pub use database::Database;
pub use schema::SCHEMA_SQL;
