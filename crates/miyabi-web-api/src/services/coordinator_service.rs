//! Coordinator Service
//!
//! Manages coordinator status, metrics, and worker assignments.

use crate::error::ApiError;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoordinatorStatus {
    pub id: String,
    pub name: String,
    pub host: String,
    pub status: String,
    pub active_workers: i64,
    pub active_tasks: i64,
    pub completed_tasks: i64,
    pub failed_tasks: i64,
    pub health: CoordinatorHealth,
    pub metrics: Option<CoordinatorMetrics>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CoordinatorHealth {
    Healthy,
    Degraded,
    Unhealthy,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoordinatorMetrics {
    pub cpu_usage: f32,
    pub memory_usage: f32,
    pub disk_usage: f32,
    pub network_rx_bytes: i64,
    pub network_tx_bytes: i64,
    pub uptime_seconds: i64,
}

/// Coordinator service for managing coordinator status and metrics
pub struct CoordinatorService {
    pool: PgPool,
}

impl CoordinatorService {
    /// Create a new coordinator service
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Get all coordinators status
    pub async fn get_all_coordinators(&self) -> Result<Vec<CoordinatorStatus>, ApiError> {
        let coordinators = sqlx::query_as::<_, CoordinatorStatusRow>(
            r#"
            SELECT
                c.id,
                c.name,
                c.host,
                c.status,
                COUNT(DISTINCT w.id) as active_workers,
                COUNT(CASE WHEN t.status = 'running' THEN 1 END) as active_tasks,
                COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
                COUNT(CASE WHEN t.status = 'failed' THEN 1 END) as failed_tasks
            FROM coordinators c
            LEFT JOIN workers w ON w.coordinator_id = c.id AND w.status = 'active'
            LEFT JOIN tasks t ON t.assigned_to = w.name
            GROUP BY c.id, c.name, c.host, c.status
            ORDER BY c.name
            "#,
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(coordinators
            .into_iter()
            .map(|row| CoordinatorStatus {
                id: row.id.to_string(),
                name: row.name,
                host: row.host,
                status: row.status.clone(),
                active_workers: row.active_workers,
                active_tasks: row.active_tasks,
                completed_tasks: row.completed_tasks,
                failed_tasks: row.failed_tasks,
                health: Self::calculate_health(&row.status),
                metrics: None, // Metrics would be fetched via SSH
            })
            .collect())
    }

    /// Get coordinator by ID
    pub async fn get_coordinator(&self, coordinator_id: Uuid) -> Result<CoordinatorStatus, ApiError> {
        let coordinator = sqlx::query_as::<_, CoordinatorStatusRow>(
            r#"
            SELECT
                c.id,
                c.name,
                c.host,
                c.status,
                COUNT(DISTINCT w.id) as active_workers,
                COUNT(CASE WHEN t.status = 'running' THEN 1 END) as active_tasks,
                COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
                COUNT(CASE WHEN t.status = 'failed' THEN 1 END) as failed_tasks
            FROM coordinators c
            LEFT JOIN workers w ON w.coordinator_id = c.id AND w.status = 'active'
            LEFT JOIN tasks t ON t.assigned_to = w.name
            WHERE c.id = $1
            GROUP BY c.id, c.name, c.host, c.status
            "#,
        )
        .bind(coordinator_id)
        .fetch_optional(&self.pool)
        .await?
        .ok_or_else(|| ApiError::NotFound(format!("Coordinator {} not found", coordinator_id)))?;

        Ok(CoordinatorStatus {
            id: coordinator.id.to_string(),
            name: coordinator.name,
            host: coordinator.host,
            status: coordinator.status.clone(),
            active_workers: coordinator.active_workers,
            active_tasks: coordinator.active_tasks,
            completed_tasks: coordinator.completed_tasks,
            failed_tasks: coordinator.failed_tasks,
            health: Self::calculate_health(&coordinator.status),
            metrics: None,
        })
    }

    /// Get workers for a specific coordinator
    pub async fn get_coordinator_workers(
        &self,
        coordinator_id: Uuid,
    ) -> Result<Vec<String>, ApiError> {
        let workers = sqlx::query_scalar::<_, String>(
            r#"
            SELECT name
            FROM workers
            WHERE coordinator_id = $1 AND status = 'active'
            ORDER BY name
            "#,
        )
        .bind(coordinator_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(workers)
    }

    /// Update coordinator status
    pub async fn update_status(
        &self,
        coordinator_id: Uuid,
        status: &str,
    ) -> Result<(), ApiError> {
        sqlx::query(
            r#"
            UPDATE coordinators
            SET status = $1, updated_at = NOW()
            WHERE id = $2
            "#,
        )
        .bind(status)
        .bind(coordinator_id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Calculate coordinator health based on status
    fn calculate_health(status: &str) -> CoordinatorHealth {
        match status {
            "active" => CoordinatorHealth::Healthy,
            "degraded" => CoordinatorHealth::Degraded,
            "inactive" | "stopped" => CoordinatorHealth::Unhealthy,
            _ => CoordinatorHealth::Unknown,
        }
    }

    /// Fetch metrics via SSH (stub - would use actual SSH in production)
    pub async fn fetch_metrics(
        &self,
        coordinator_id: Uuid,
    ) -> Result<CoordinatorMetrics, ApiError> {
        // In production, this would SSH to the coordinator and run:
        // - `top -bn1 | grep "Cpu(s)"` for CPU
        // - `free -m` for memory
        // - `df -h` for disk
        // - `uptime` for uptime

        // For now, return mock data
        Ok(CoordinatorMetrics {
            cpu_usage: 25.5,
            memory_usage: 45.2,
            disk_usage: 60.0,
            network_rx_bytes: 1024000,
            network_tx_bytes: 512000,
            uptime_seconds: 86400,
        })
    }
}

#[derive(Debug, sqlx::FromRow)]
struct CoordinatorStatusRow {
    id: Uuid,
    name: String,
    host: String,
    status: String,
    active_workers: i64,
    active_tasks: i64,
    completed_tasks: i64,
    failed_tasks: i64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_health_calculation() {
        assert!(matches!(
            CoordinatorService::calculate_health("active"),
            CoordinatorHealth::Healthy
        ));
        assert!(matches!(
            CoordinatorService::calculate_health("degraded"),
            CoordinatorHealth::Degraded
        ));
        assert!(matches!(
            CoordinatorService::calculate_health("inactive"),
            CoordinatorHealth::Unhealthy
        ));
        assert!(matches!(
            CoordinatorService::calculate_health("unknown"),
            CoordinatorHealth::Unknown
        ));
    }
}
