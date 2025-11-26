//! Communication Monitor - auditing and metrics

use crate::types::*;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::sync::RwLock;
use uuid::Uuid;

/// Communication event type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CommunicationEvent {
    TaskSent,
    TaskReceived,
    TaskAcknowledged,
    TaskCompleted,
    TaskFailed,
    DeliveryRetry { attempt: u32 },
}

/// Communication record for audit trail
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommunicationRecord {
    pub id: String,
    pub from: AgentId,
    pub to: AgentId,
    pub task_id: TaskId,
    pub event: CommunicationEvent,
    pub timestamp: DateTime<Utc>,
    pub metadata: HashMap<String, String>,
}

/// Communication metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommunicationMetrics {
    pub total_tasks: usize,
    pub successful: usize,
    pub failed: usize,
    pub pending: usize,
    pub avg_latency_ms: f64,
    pub communication_matrix: HashMap<String, usize>,
}

/// Communication Monitor
pub struct CommunicationMonitor {
    /// All communication records
    records: RwLock<Vec<CommunicationRecord>>,
    /// Task start times for latency calculation
    task_start_times: RwLock<HashMap<TaskId, DateTime<Utc>>>,
    /// Communication matrix
    comm_matrix: RwLock<HashMap<String, usize>>,
}

impl CommunicationMonitor {
    /// Create a new monitor
    pub fn new() -> Self {
        Self {
            records: RwLock::new(Vec::new()),
            task_start_times: RwLock::new(HashMap::new()),
            comm_matrix: RwLock::new(HashMap::new()),
        }
    }

    /// Log task sent
    pub async fn log_send(&self, from: &AgentId, to: &AgentId, task_id: &TaskId) {
        let record = CommunicationRecord {
            id: Uuid::new_v4().to_string(),
            from: from.clone(),
            to: to.clone(),
            task_id: task_id.clone(),
            event: CommunicationEvent::TaskSent,
            timestamp: Utc::now(),
            metadata: HashMap::new(),
        };

        self.records.write().await.push(record);
        self.task_start_times
            .write()
            .await
            .insert(task_id.clone(), Utc::now());

        // Update communication matrix
        let key = format!("{} -> {}", from.0, to.0);
        *self.comm_matrix.write().await.entry(key).or_insert(0) += 1;
    }

    /// Log task completed
    pub async fn log_complete(
        &self,
        from: &AgentId,
        to: &AgentId,
        task_id: &TaskId,
        success: bool,
    ) {
        let event = if success {
            CommunicationEvent::TaskCompleted
        } else {
            CommunicationEvent::TaskFailed
        };

        let record = CommunicationRecord {
            id: Uuid::new_v4().to_string(),
            from: from.clone(),
            to: to.clone(),
            task_id: task_id.clone(),
            event,
            timestamp: Utc::now(),
            metadata: HashMap::new(),
        };

        self.records.write().await.push(record);
    }

    /// Get communication history
    pub async fn get_history(
        &self,
        from: Option<&AgentId>,
        to: Option<&AgentId>,
        since: Option<DateTime<Utc>>,
    ) -> Vec<CommunicationRecord> {
        self.records
            .read()
            .await
            .iter()
            .filter(|r| {
                from.map_or(true, |f| &r.from == f)
                    && to.map_or(true, |t| &r.to == t)
                    && since.map_or(true, |s| r.timestamp >= s)
            })
            .cloned()
            .collect()
    }

    /// Get metrics
    pub async fn get_metrics(&self) -> serde_json::Value {
        let records = self.records.read().await;

        let total = records
            .iter()
            .filter(|r| matches!(r.event, CommunicationEvent::TaskSent))
            .count();

        let successful = records
            .iter()
            .filter(|r| matches!(r.event, CommunicationEvent::TaskCompleted))
            .count();

        let failed = records
            .iter()
            .filter(|r| matches!(r.event, CommunicationEvent::TaskFailed))
            .count();

        let pending = total.saturating_sub(successful + failed);

        // Calculate average latency
        let mut total_latency = 0i64;
        let mut latency_count = 0;

        let start_times = self.task_start_times.read().await;

        for record in records.iter() {
            if matches!(
                record.event,
                CommunicationEvent::TaskCompleted | CommunicationEvent::TaskFailed
            ) {
                if let Some(start) = start_times.get(&record.task_id) {
                    let latency = record.timestamp.signed_duration_since(*start);
                    total_latency += latency.num_milliseconds();
                    latency_count += 1;
                }
            }
        }

        let avg_latency = if latency_count > 0 {
            total_latency as f64 / latency_count as f64
        } else {
            0.0
        };

        serde_json::json!({
            "total_tasks": total,
            "successful": successful,
            "failed": failed,
            "pending": pending,
            "avg_latency_ms": avg_latency,
            "communication_matrix": *self.comm_matrix.read().await
        })
    }
}

impl Default for CommunicationMonitor {
    fn default() -> Self {
        Self::new()
    }
}
