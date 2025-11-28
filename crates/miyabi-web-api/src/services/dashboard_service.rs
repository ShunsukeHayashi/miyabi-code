//! Dashboard Service
//!
//! Aggregates data for the dashboard view including:
//! - Task statistics
//! - Worker status
//! - System metrics
//!
//! Issue: #983 Phase 2.1 - Service Layer Refactoring

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

/// Dashboard summary data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardSummary {
    pub task_stats: TaskStats,
    pub worker_stats: WorkerStats,
    pub recent_activity: Vec<ActivityEntry>,
    pub system_health: SystemHealth,
}

/// Task statistics for dashboard
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TaskStats {
    pub total: i64,
    pub pending: i64,
    pub running: i64,
    pub completed: i64,
    pub failed: i64,
    pub cancelled: i64,
    pub completion_rate: f64,
}

/// Worker statistics for dashboard
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct WorkerStats {
    pub total_workers: i64,
    pub active_workers: i64,
    pub idle_workers: i64,
    pub offline_workers: i64,
}

/// Recent activity entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityEntry {
    pub id: String,
    pub activity_type: String,
    pub description: String,
    pub timestamp: DateTime<Utc>,
    pub actor: Option<String>,
}

/// System health status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemHealth {
    pub status: HealthStatus,
    pub database_status: String,
    pub api_latency_ms: f64,
    pub uptime_seconds: i64,
}

/// Health status enum
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum HealthStatus {
    Healthy,
    Degraded,
    Unhealthy,
}

impl Default for HealthStatus {
    fn default() -> Self {
        Self::Healthy
    }
}

/// Dashboard Service for aggregating dashboard data
#[derive(Clone)]
pub struct DashboardService {
    db: PgPool,
}

impl DashboardService {
    /// Create a new DashboardService
    pub fn new(db: PgPool) -> Self {
        Self { db }
    }

    /// Get complete dashboard summary
    pub async fn get_summary(&self, user_id: uuid::Uuid) -> Result<DashboardSummary, sqlx::Error> {
        let task_stats = self.get_task_stats(user_id).await?;
        let worker_stats = self.get_worker_stats().await?;
        let recent_activity = self.get_recent_activity(user_id, 10).await?;
        let system_health = self.get_system_health().await?;

        Ok(DashboardSummary {
            task_stats,
            worker_stats,
            recent_activity,
            system_health,
        })
    }

    /// Get task statistics for a user
    pub async fn get_task_stats(&self, user_id: uuid::Uuid) -> Result<TaskStats, sqlx::Error> {
        let result = sqlx::query_as::<_, (i64, i64, i64, i64, i64, i64)>(
            r#"
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'pending') as pending,
                COUNT(*) FILTER (WHERE status = 'running') as running,
                COUNT(*) FILTER (WHERE status = 'completed') as completed,
                COUNT(*) FILTER (WHERE status = 'failed') as failed,
                COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
            FROM tasks
            WHERE user_id = $1
            "#,
        )
        .bind(user_id)
        .fetch_one(&self.db)
        .await?;

        let total = result.0;
        let completed = result.3;
        let completion_rate = if total > 0 {
            (completed as f64 / total as f64) * 100.0
        } else {
            0.0
        };

        Ok(TaskStats {
            total: result.0,
            pending: result.1,
            running: result.2,
            completed: result.3,
            failed: result.4,
            cancelled: result.5,
            completion_rate,
        })
    }

    /// Get worker statistics
    pub async fn get_worker_stats(&self) -> Result<WorkerStats, sqlx::Error> {
        // Query from workers table if it exists, otherwise return defaults
        let result = sqlx::query_as::<_, (i64, i64, i64, i64)>(
            r#"
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'active') as active,
                COUNT(*) FILTER (WHERE status = 'idle') as idle,
                COUNT(*) FILTER (WHERE status = 'offline') as offline
            FROM workers
            "#,
        )
        .fetch_optional(&self.db)
        .await?;

        match result {
            Some(stats) => Ok(WorkerStats {
                total_workers: stats.0,
                active_workers: stats.1,
                idle_workers: stats.2,
                offline_workers: stats.3,
            }),
            None => Ok(WorkerStats::default()),
        }
    }

    /// Get recent activity for a user
    pub async fn get_recent_activity(
        &self,
        user_id: uuid::Uuid,
        limit: i32,
    ) -> Result<Vec<ActivityEntry>, sqlx::Error> {
        // Query from activity_log table if it exists
        let activities =
            sqlx::query_as::<_, (String, String, String, DateTime<Utc>, Option<String>)>(
                r#"
            SELECT
                id::text,
                activity_type,
                description,
                created_at,
                actor
            FROM activity_log
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2
            "#,
            )
            .bind(user_id)
            .bind(limit)
            .fetch_all(&self.db)
            .await;

        match activities {
            Ok(rows) => Ok(rows
                .into_iter()
                .map(|row| ActivityEntry {
                    id: row.0,
                    activity_type: row.1,
                    description: row.2,
                    timestamp: row.3,
                    actor: row.4,
                })
                .collect()),
            Err(_) => Ok(Vec::new()), // Return empty if table doesn't exist
        }
    }

    /// Get system health status
    pub async fn get_system_health(&self) -> Result<SystemHealth, sqlx::Error> {
        let start = std::time::Instant::now();

        // Check database connectivity
        let db_result = sqlx::query("SELECT 1").fetch_one(&self.db).await;

        let latency = start.elapsed().as_secs_f64() * 1000.0;

        let (status, db_status) = match db_result {
            Ok(_) => {
                if latency < 100.0 {
                    (HealthStatus::Healthy, "connected".to_string())
                } else if latency < 500.0 {
                    (HealthStatus::Degraded, "slow".to_string())
                } else {
                    (HealthStatus::Unhealthy, "very slow".to_string())
                }
            }
            Err(e) => (HealthStatus::Unhealthy, format!("error: {}", e)),
        };

        Ok(SystemHealth {
            status,
            database_status: db_status,
            api_latency_ms: latency,
            uptime_seconds: 0, // TODO: Track actual uptime
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_health_status_default() {
        assert_eq!(HealthStatus::default(), HealthStatus::Healthy);
    }

    #[test]
    fn test_task_stats_default() {
        let stats = TaskStats::default();
        assert_eq!(stats.total, 0);
        assert_eq!(stats.completion_rate, 0.0);
    }
}
