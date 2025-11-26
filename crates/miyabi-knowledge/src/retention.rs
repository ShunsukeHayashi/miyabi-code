//! Log retention policy management
//!
//! Automatic cleanup of old log entries based on retention rules.

use crate::config::KnowledgeConfig;
use crate::error::Result;
use crate::qdrant::QdrantClient;
use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{info, warn};

/// Retention policy configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetentionPolicy {
    /// Maximum age in days before entries are deleted
    #[serde(default = "default_max_days")]
    pub max_days: i64,

    /// Maximum number of entries to retain
    #[serde(default = "default_max_entries")]
    pub max_entries: usize,

    /// Cleanup interval in hours
    #[serde(default = "default_cleanup_interval_hours")]
    pub cleanup_interval_hours: u64,
}

impl Default for RetentionPolicy {
    fn default() -> Self {
        Self {
            max_days: default_max_days(),
            max_entries: default_max_entries(),
            cleanup_interval_hours: default_cleanup_interval_hours(),
        }
    }
}

fn default_max_days() -> i64 {
    90
}

fn default_max_entries() -> usize {
    10_000
}

fn default_cleanup_interval_hours() -> u64 {
    24
}

/// Statistics from cleanup operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanupStats {
    /// Total entries checked
    pub total_checked: usize,

    /// Entries deleted
    pub deleted: usize,

    /// Entries retained
    pub retained: usize,

    /// Duration in seconds
    pub duration_secs: f64,

    /// Oldest entry timestamp (if any)
    pub oldest_entry: Option<DateTime<Utc>>,

    /// Newest entry timestamp (if any)
    pub newest_entry: Option<DateTime<Utc>>,
}

impl Default for CleanupStats {
    fn default() -> Self {
        Self {
            total_checked: 0,
            deleted: 0,
            retained: 0,
            duration_secs: 0.0,
            oldest_entry: None,
            newest_entry: None,
        }
    }
}

/// Retention policy manager
pub struct RetentionManager {
    #[allow(dead_code)]
    config: KnowledgeConfig,
    policy: RetentionPolicy,
    qdrant_client: Arc<QdrantClient>,
}

impl RetentionManager {
    /// Create a new retention manager
    pub async fn new(config: KnowledgeConfig, policy: RetentionPolicy) -> Result<Self> {
        let qdrant_client = Arc::new(QdrantClient::new(config.clone()).await?);

        Ok(Self {
            config,
            policy,
            qdrant_client,
        })
    }

    /// Perform cleanup based on retention policy
    ///
    /// # Arguments
    ///
    /// * `dry_run` - If true, only report what would be deleted without actually deleting
    pub async fn cleanup(&self, dry_run: bool) -> Result<CleanupStats> {
        info!(
            "Starting cleanup (dry_run: {}, max_days: {}, max_entries: {})",
            dry_run, self.policy.max_days, self.policy.max_entries
        );

        let start = std::time::Instant::now();
        let mut stats = CleanupStats::default();

        // Calculate cutoff date
        let cutoff_date = Utc::now() - Duration::days(self.policy.max_days);
        info!("Cutoff date: {}", cutoff_date);

        // Query all entries to check age
        let all_entries = self.qdrant_client.list_all_entries().await?;
        stats.total_checked = all_entries.len();

        if all_entries.is_empty() {
            info!("No entries found in knowledge base");
            return Ok(stats);
        }

        // Find oldest and newest entries
        let mut oldest: Option<DateTime<Utc>> = None;
        let mut newest: Option<DateTime<Utc>> = None;
        let mut to_delete = Vec::new();

        for entry in &all_entries {
            let entry_time = entry.timestamp;

            if oldest.is_none() || entry_time < oldest.unwrap() {
                oldest = Some(entry_time);
            }
            if newest.is_none() || entry_time > newest.unwrap() {
                newest = Some(entry_time);
            }

            // Check if entry is older than cutoff
            if entry_time < cutoff_date {
                to_delete.push(entry.id.clone());
            }
        }

        stats.oldest_entry = oldest;
        stats.newest_entry = newest;

        // Check if we exceed max_entries
        if all_entries.len() > self.policy.max_entries {
            let excess = all_entries.len() - self.policy.max_entries;
            warn!(
                "Total entries ({}) exceeds max_entries ({}). Marking {} oldest for deletion.",
                all_entries.len(),
                self.policy.max_entries,
                excess
            );

            // Sort by timestamp (oldest first)
            let mut sorted_entries = all_entries.clone();
            sorted_entries.sort_by_key(|e| e.timestamp);

            // Add oldest entries to deletion list
            for entry in sorted_entries.iter().take(excess) {
                if !to_delete.contains(&entry.id) {
                    to_delete.push(entry.id.clone());
                }
            }
        }

        stats.deleted = to_delete.len();
        stats.retained = stats.total_checked - stats.deleted;

        if to_delete.is_empty() {
            info!("No entries need to be deleted");
        } else {
            info!(
                "Found {} entries to delete ({} will be retained)",
                stats.deleted, stats.retained
            );

            if !dry_run {
                // Perform actual deletion
                for entry_id in &to_delete {
                    match self.qdrant_client.delete_by_id(entry_id).await {
                        Ok(_) => {
                            info!("Deleted entry: {}", entry_id);
                        }
                        Err(e) => {
                            warn!("Failed to delete entry {}: {}", entry_id, e);
                        }
                    }
                }
                info!("Cleanup completed: {} entries deleted", stats.deleted);
            } else {
                info!("Dry run: Would delete {} entries", stats.deleted);
            }
        }

        stats.duration_secs = start.elapsed().as_secs_f64();
        Ok(stats)
    }

    /// Perform cleanup for entries before a specific date
    ///
    /// # Arguments
    ///
    /// * `before_date` - Delete all entries before this date
    /// * `dry_run` - If true, only report what would be deleted
    pub async fn cleanup_before(
        &self,
        before_date: DateTime<Utc>,
        dry_run: bool,
    ) -> Result<CleanupStats> {
        info!(
            "Starting cleanup before {} (dry_run: {})",
            before_date, dry_run
        );

        let start = std::time::Instant::now();
        let mut stats = CleanupStats::default();

        let all_entries = self.qdrant_client.list_all_entries().await?;
        stats.total_checked = all_entries.len();

        let mut to_delete = Vec::new();
        let mut oldest: Option<DateTime<Utc>> = None;
        let mut newest: Option<DateTime<Utc>> = None;

        for entry in &all_entries {
            let entry_time = entry.timestamp;

            if oldest.is_none() || entry_time < oldest.unwrap() {
                oldest = Some(entry_time);
            }
            if newest.is_none() || entry_time > newest.unwrap() {
                newest = Some(entry_time);
            }

            if entry_time < before_date {
                to_delete.push(entry.id.clone());
            }
        }

        stats.oldest_entry = oldest;
        stats.newest_entry = newest;
        stats.deleted = to_delete.len();
        stats.retained = stats.total_checked - stats.deleted;

        if !dry_run && !to_delete.is_empty() {
            for entry_id in &to_delete {
                match self.qdrant_client.delete_by_id(entry_id).await {
                    Ok(_) => {
                        info!("Deleted entry: {}", entry_id);
                    }
                    Err(e) => {
                        warn!("Failed to delete entry {}: {}", entry_id, e);
                    }
                }
            }
        }

        stats.duration_secs = start.elapsed().as_secs_f64();
        info!(
            "Cleanup complete: {} deleted, {} retained in {:.2}s",
            stats.deleted, stats.retained, stats.duration_secs
        );

        Ok(stats)
    }

    /// Start automatic cleanup task
    ///
    /// Returns a handle to the background task
    pub fn start_automatic_cleanup(self: Arc<Self>) -> tokio::task::JoinHandle<()> {
        let interval = std::time::Duration::from_secs(self.policy.cleanup_interval_hours * 3600);

        tokio::spawn(async move {
            let mut interval_timer = tokio::time::interval(interval);

            loop {
                interval_timer.tick().await;

                info!("Running automatic cleanup");
                match self.cleanup(false).await {
                    Ok(stats) => {
                        info!(
                            "Automatic cleanup completed: {} deleted, {} retained",
                            stats.deleted, stats.retained
                        );
                    }
                    Err(e) => {
                        warn!("Automatic cleanup failed: {}", e);
                    }
                }
            }
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_retention_policy() {
        let policy = RetentionPolicy::default();
        assert_eq!(policy.max_days, 90);
        assert_eq!(policy.max_entries, 10_000);
        assert_eq!(policy.cleanup_interval_hours, 24);
    }

    #[test]
    fn test_retention_policy_serialization() {
        let policy = RetentionPolicy {
            max_days: 30,
            max_entries: 5000,
            cleanup_interval_hours: 12,
        };

        let json = serde_json::to_string(&policy).unwrap();
        let deserialized: RetentionPolicy = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.max_days, 30);
        assert_eq!(deserialized.max_entries, 5000);
        assert_eq!(deserialized.cleanup_interval_hours, 12);
    }

    #[test]
    fn test_cleanup_stats_default() {
        let stats = CleanupStats::default();
        assert_eq!(stats.total_checked, 0);
        assert_eq!(stats.deleted, 0);
        assert_eq!(stats.retained, 0);
        assert!(stats.oldest_entry.is_none());
        assert!(stats.newest_entry.is_none());
    }
}
