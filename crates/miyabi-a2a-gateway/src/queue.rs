//! Task Queue - manages task queuing and execution

use crate::{error::Error, types::*, Result};
use chrono::Utc;
use std::cmp::Ordering;
use std::collections::{BinaryHeap, HashMap};
use tokio::sync::RwLock;

/// Queued task with metadata
#[derive(Debug, Clone)]
pub struct QueuedTask {
    pub id: TaskId,
    pub task: Task,
    pub status: TaskStatus,
    pub created_at: chrono::DateTime<Utc>,
    pub processed_at: Option<chrono::DateTime<Utc>>,
    pub completed_at: Option<chrono::DateTime<Utc>>,
    pub result: Option<TaskResult>,
}

/// Prioritized task for heap ordering
#[derive(Debug, Clone, Eq, PartialEq)]
struct PrioritizedTask {
    id: TaskId,
    priority: Priority,
    created_at: chrono::DateTime<Utc>,
}

impl Ord for PrioritizedTask {
    fn cmp(&self, other: &Self) -> Ordering {
        // Higher priority first, then older tasks first
        match (self.priority as u8).cmp(&(other.priority as u8)) {
            Ordering::Equal => other.created_at.cmp(&self.created_at),
            other => other,
        }
    }
}

impl PartialOrd for PrioritizedTask {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

/// Task Queue
pub struct TaskQueue {
    /// All tasks
    tasks: RwLock<HashMap<TaskId, QueuedTask>>,
    /// Priority queue for pending tasks
    priority_queue: RwLock<BinaryHeap<PrioritizedTask>>,
}

impl TaskQueue {
    /// Create a new task queue
    pub fn new() -> Self {
        Self {
            tasks: RwLock::new(HashMap::new()),
            priority_queue: RwLock::new(BinaryHeap::new()),
        }
    }

    /// Enqueue a task
    pub async fn enqueue(&self, task: Task) -> Result<TaskId> {
        let id = task.id.clone();
        let now = Utc::now();

        let queued = QueuedTask {
            id: id.clone(),
            task: task.clone(),
            status: TaskStatus::Pending,
            created_at: now,
            processed_at: None,
            completed_at: None,
            result: None,
        };

        self.tasks.write().await.insert(id.clone(), queued);
        self.priority_queue.write().await.push(PrioritizedTask {
            id: id.clone(),
            priority: task.priority,
            created_at: now,
        });

        Ok(id)
    }

    /// Dequeue next task for agent
    pub async fn dequeue(&self, agent_id: &AgentId) -> Option<QueuedTask> {
        let mut queue = self.priority_queue.write().await;
        let mut tasks = self.tasks.write().await;

        // Find the next task for this agent
        let mut found_index = None;
        let mut temp_heap = BinaryHeap::new();

        while let Some(prioritized) = queue.pop() {
            if let Some(task) = tasks.get(&prioritized.id) {
                if task.task.to == *agent_id && task.status == TaskStatus::Pending {
                    found_index = Some(prioritized.id.clone());
                    break;
                }
            }
            temp_heap.push(prioritized);
        }

        // Restore tasks that weren't for this agent
        queue.extend(temp_heap);

        // Update and return the found task
        if let Some(id) = found_index {
            if let Some(task) = tasks.get_mut(&id) {
                task.status = TaskStatus::InProgress;
                task.processed_at = Some(Utc::now());
                return Some(task.clone());
            }
        }

        None
    }

    /// Complete a task
    pub async fn complete(&self, id: TaskId, result: TaskResult) -> Result<()> {
        if let Some(task) = self.tasks.write().await.get_mut(&id) {
            task.status = match &result {
                TaskResult::Success(_) => TaskStatus::Completed,
                TaskResult::Failure(_) => TaskStatus::Failed,
            };
            task.completed_at = Some(Utc::now());
            task.result = Some(result);
            Ok(())
        } else {
            Err(Error::TaskNotFound(id))
        }
    }

    /// Get task status
    pub async fn get_status(&self, id: &TaskId) -> Result<TaskStatus> {
        self.tasks
            .read()
            .await
            .get(id)
            .map(|t| t.status.clone())
            .ok_or_else(|| Error::TaskNotFound(id.clone()))
    }

    /// Get task result
    pub async fn get_result(&self, id: &TaskId) -> Option<TaskResult> {
        self.tasks.read().await.get(id).and_then(|t| t.result.clone())
    }

    /// Get task
    pub async fn get_task(&self, id: &TaskId) -> Option<QueuedTask> {
        self.tasks.read().await.get(id).cloned()
    }

    /// Get pending task count
    pub async fn pending_count(&self) -> usize {
        self.tasks
            .read()
            .await
            .values()
            .filter(|t| t.status == TaskStatus::Pending)
            .count()
    }

    /// Get all tasks
    pub async fn get_all(&self) -> Vec<QueuedTask> {
        self.tasks.read().await.values().cloned().collect()
    }
}

impl Default for TaskQueue {
    fn default() -> Self {
        Self::new()
    }
}
