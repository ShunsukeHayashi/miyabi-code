//! Worker Service
//!
//! Manages worker status, metrics, and health tracking.

use crate::error::ApiError;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkerStatus {
    pub worker_id: String,
    pub status: String,
    pub coordinator: String,
    pub active_tasks: i64,
    pub completed_tasks: i64,
    pub failed_tasks: i64,
    pub last_heartbeat: Option<chrono::DateTime<chrono::Utc>>,
    pub health: WorkerHealth,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WorkerHealth {
    Healthy,
    Degraded,
    Unhealthy,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkerMetrics {
    pub cpu_usage: f32,
    pub memory_usage: f32,
    pub disk_usage: f32,
    pub uptime_seconds: i64,
}

/// Worker service for managing worker status and metrics
pub struct WorkerService {
    pool: PgPool,
}

impl WorkerService {
    /// Create a new worker service
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Get all workers status
    pub async fn get_all_workers(&self) -> Result<Vec<WorkerStatus>, ApiError> {
        let workers = sqlx::query_as::<_, WorkerStatusRow>(
            r#"
            SELECT
                w.id as worker_id,
                w.name,
                w.coordinator_id,
                w.status,
                c.name as coordinator_name,
                COUNT(CASE WHEN t.status = 'running' THEN 1 END) as active_tasks,
                COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
                COUNT(CASE WHEN t.status = 'failed' THEN 1 END) as failed_tasks,
                wh.last_heartbeat
            FROM workers w
            LEFT JOIN coordinators c ON w.coordinator_id = c.id
            LEFT JOIN tasks t ON t.assigned_to = w.name
            LEFT JOIN worker_heartbeats wh ON wh.worker_id = w.id
            GROUP BY w.id, w.name, w.coordinator_id, w.status, c.name, wh.last_heartbeat
            ORDER BY w.name
            "#,
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(workers
            .into_iter()
            .map(|row| {
                let health = Self::calculate_health(&row);
                WorkerStatus {
                    worker_id: row.name,
                    status: row.status,
                    coordinator: row
                        .coordinator_name
                        .unwrap_or_else(|| "unknown".to_string()),
                    active_tasks: row.active_tasks,
                    completed_tasks: row.completed_tasks,
                    failed_tasks: row.failed_tasks,
                    last_heartbeat: row.last_heartbeat,
                    health,
                }
            })
            .collect())
    }

    /// Get worker by ID
    pub async fn get_worker(&self, worker_id: &str) -> Result<WorkerStatus, ApiError> {
        let worker = sqlx::query_as::<_, WorkerStatusRow>(
            r#"
            SELECT
                w.id as worker_id,
                w.name,
                w.coordinator_id,
                w.status,
                c.name as coordinator_name,
                COUNT(CASE WHEN t.status = 'running' THEN 1 END) as active_tasks,
                COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
                COUNT(CASE WHEN t.status = 'failed' THEN 1 END) as failed_tasks,
                wh.last_heartbeat
            FROM workers w
            LEFT JOIN coordinators c ON w.coordinator_id = c.id
            LEFT JOIN tasks t ON t.assigned_to = w.name
            LEFT JOIN worker_heartbeats wh ON wh.worker_id = w.id
            WHERE w.name = $1
            GROUP BY w.id, w.name, w.coordinator_id, w.status, c.name, wh.last_heartbeat
            "#,
        )
        .bind(worker_id)
        .fetch_optional(&self.pool)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Worker {} not found", worker_id)))?;

        let health = Self::calculate_health(&worker);
        Ok(WorkerStatus {
            worker_id: worker.name,
            status: worker.status,
            coordinator: worker
                .coordinator_name
                .unwrap_or_else(|| "unknown".to_string()),
            active_tasks: worker.active_tasks,
            completed_tasks: worker.completed_tasks,
            failed_tasks: worker.failed_tasks,
            last_heartbeat: worker.last_heartbeat,
            health,
        })
    }

    /// Update worker heartbeat
    pub async fn update_heartbeat(&self, worker_id: Uuid) -> Result<(), ApiError> {
        sqlx::query(
            r#"
            INSERT INTO worker_heartbeats (worker_id, last_heartbeat)
            VALUES ($1, NOW())
            ON CONFLICT (worker_id)
            DO UPDATE SET last_heartbeat = NOW()
            "#,
        )
        .bind(worker_id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Calculate worker health based on status and heartbeat
    fn calculate_health(row: &WorkerStatusRow) -> WorkerHealth {
        if row.status != "active" {
            return WorkerHealth::Unhealthy;
        }

        match row.last_heartbeat {
            Some(heartbeat) => {
                let now = chrono::Utc::now();
                let elapsed = now.signed_duration_since(heartbeat).num_seconds();

                if elapsed < 60 {
                    WorkerHealth::Healthy
                } else if elapsed < 300 {
                    WorkerHealth::Degraded
                } else {
                    WorkerHealth::Unhealthy
                }
            }
            None => WorkerHealth::Unknown,
        }
    }
}

#[derive(Debug, sqlx::FromRow)]
struct WorkerStatusRow {
    worker_id: Uuid,
    name: String,
    coordinator_id: Option<Uuid>,
    status: String,
    coordinator_name: Option<String>,
    active_tasks: i64,
    completed_tasks: i64,
    failed_tasks: i64,
    last_heartbeat: Option<chrono::DateTime<chrono::Utc>>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_health_calculation() {
        let now = chrono::Utc::now();

        // Healthy: heartbeat within 60 seconds
        let row = WorkerStatusRow {
            worker_id: Uuid::new_v4(),
            name: "test-worker".to_string(),
            coordinator_id: None,
            status: "active".to_string(),
            coordinator_name: None,
            active_tasks: 0,
            completed_tasks: 0,
            failed_tasks: 0,
            last_heartbeat: Some(now - chrono::Duration::seconds(30)),
        };
        assert!(matches!(
            WorkerService::calculate_health(&row),
            WorkerHealth::Healthy
        ));

        // Degraded: heartbeat within 300 seconds
        let row = WorkerStatusRow {
            last_heartbeat: Some(now - chrono::Duration::seconds(120)),
            ..row
        };
        assert!(matches!(
            WorkerService::calculate_health(&row),
            WorkerHealth::Degraded
        ));

        // Unhealthy: heartbeat over 300 seconds
        let row = WorkerStatusRow {
            last_heartbeat: Some(now - chrono::Duration::seconds(400)),
            ..row
        };
        assert!(matches!(
            WorkerService::calculate_health(&row),
            WorkerHealth::Unhealthy
        ));
    }
}
