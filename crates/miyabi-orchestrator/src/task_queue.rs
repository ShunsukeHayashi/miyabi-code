//! Task Queue Service - Priority-based task queue with dependency management
//!
//! This module provides a priority queue for managing tasks (GitHub Issues)
//! with support for:
//! - Priority-based ordering (P0-Critical to P3-Low)
//! - Dependency tracking and blocked task handling
//! - Task state management (Ready, Blocked, InProgress)
//! - Queue statistics and monitoring

use crate::error::{Result, SchedulerError};
use crate::priority::{Issue, PriorityCalculator, PriorityScore};
use serde::{Deserialize, Serialize};
use std::collections::{BinaryHeap, HashMap};

/// Task state in the queue
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TaskState {
    /// Ready to be executed
    Ready,
    /// Blocked by dependencies
    Blocked,
    /// Currently being executed
    InProgress,
}

/// Task wrapper with priority and state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueuedTask {
    pub issue: Issue,
    pub priority: PriorityScore,
    pub state: TaskState,
    pub enqueued_at: chrono::DateTime<chrono::Utc>,
}

impl PartialEq for QueuedTask {
    fn eq(&self, other: &Self) -> bool {
        self.issue.number == other.issue.number
    }
}

impl Eq for QueuedTask {}

impl PartialOrd for QueuedTask {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for QueuedTask {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        // Higher priority first, then older tasks first
        self.priority
            .cmp(&other.priority)
            .then_with(|| other.enqueued_at.cmp(&self.enqueued_at))
    }
}

/// Task Queue Service configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskQueueConfig {
    /// Maximum concurrent tasks
    pub max_concurrent: usize,
    /// Maximum queue size
    pub max_queue_size: usize,
}

impl Default for TaskQueueConfig {
    fn default() -> Self {
        Self {
            max_concurrent: 5,
            max_queue_size: 100,
        }
    }
}

/// Task Queue Service
pub struct TaskQueue {
    /// Configuration
    config: TaskQueueConfig,
    /// Priority queue (ready tasks)
    ready_queue: BinaryHeap<QueuedTask>,
    /// Blocked tasks (waiting for dependencies)
    blocked_tasks: HashMap<u64, QueuedTask>,
    /// In-progress tasks
    in_progress: HashMap<u64, QueuedTask>,
    /// Priority calculator
    calculator: PriorityCalculator,
}

impl TaskQueue {
    /// Create new task queue
    pub fn new(config: TaskQueueConfig) -> Self {
        Self {
            config,
            ready_queue: BinaryHeap::new(),
            blocked_tasks: HashMap::new(),
            in_progress: HashMap::new(),
            calculator: PriorityCalculator::new(),
        }
    }

    /// Enqueue a new task
    pub fn enqueue(&mut self, issue: Issue) -> Result<()> {
        // Check queue size limit
        let total_tasks = self.ready_queue.len() + self.blocked_tasks.len() + self.in_progress.len();
        if total_tasks >= self.config.max_queue_size {
            return Err(SchedulerError::InvalidConfig(
                format!("Queue full (max: {})", self.config.max_queue_size)
            ).into());
        }

        // Calculate priority
        let priority = self.calculator.calculate(&issue)?;

        // Create queued task
        let queued_task = QueuedTask {
            issue: issue.clone(),
            priority,
            state: TaskState::Ready,
            enqueued_at: chrono::Utc::now(),
        };

        // Check if task has unresolved dependencies
        if self.has_unresolved_dependencies(&issue) {
            // Add to blocked queue
            self.blocked_tasks.insert(issue.number, queued_task);
        } else {
            // Add to ready queue
            self.ready_queue.push(queued_task);
        }

        Ok(())
    }

    /// Dequeue next task (highest priority, ready to execute)
    pub fn dequeue(&mut self) -> Option<QueuedTask> {
        // Check concurrent limit
        if self.in_progress.len() >= self.config.max_concurrent {
            return None;
        }

        // Get highest priority task
        if let Some(mut task) = self.ready_queue.pop() {
            task.state = TaskState::InProgress;
            self.in_progress.insert(task.issue.number, task.clone());
            Some(task)
        } else {
            None
        }
    }

    /// Mark task as completed
    pub fn complete(&mut self, issue_number: u64) -> Result<()> {
        // Remove from in-progress
        let _task = self.in_progress.remove(&issue_number)
            .ok_or_else(|| SchedulerError::SessionNotFound(
                format!("Task #{} not in progress", issue_number)
            ))?;

        // Check if any blocked tasks can now be unblocked
        self.unblock_dependent_tasks(issue_number);

        Ok(())
    }

    /// Check if task has unresolved dependencies
    fn has_unresolved_dependencies(&self, issue: &Issue) -> bool {
        for dep_number in &issue.dependencies {
            // Check if dependency is still in any queue
            if self.ready_queue.iter().any(|t| t.issue.number == *dep_number)
                || self.blocked_tasks.contains_key(dep_number)
                || self.in_progress.contains_key(dep_number)
            {
                return true;
            }
        }
        false
    }

    /// Unblock tasks that depended on the completed task
    fn unblock_dependent_tasks(&mut self, completed_issue: u64) {
        let mut to_unblock = Vec::new();

        for (number, task) in &self.blocked_tasks {
            if task.issue.dependencies.contains(&completed_issue) {
                // Check if all dependencies are now resolved
                if !self.has_unresolved_dependencies(&task.issue) {
                    to_unblock.push(*number);
                }
            }
        }

        // Move unblocked tasks to ready queue
        for number in to_unblock {
            if let Some(mut task) = self.blocked_tasks.remove(&number) {
                task.state = TaskState::Ready;
                self.ready_queue.push(task);
            }
        }
    }

    /// Get queue statistics
    pub fn stats(&self) -> TaskQueueStats {
        TaskQueueStats {
            ready: self.ready_queue.len(),
            blocked: self.blocked_tasks.len(),
            in_progress: self.in_progress.len(),
            total: self.ready_queue.len() + self.blocked_tasks.len() + self.in_progress.len(),
            capacity: self.config.max_queue_size,
            max_concurrent: self.config.max_concurrent,
        }
    }

    /// Peek at next task without dequeuing
    pub fn peek(&self) -> Option<&QueuedTask> {
        self.ready_queue.peek()
    }

    /// Get all in-progress tasks
    pub fn in_progress_tasks(&self) -> Vec<&QueuedTask> {
        self.in_progress.values().collect()
    }

    /// Get all blocked tasks
    pub fn blocked_tasks(&self) -> Vec<&QueuedTask> {
        self.blocked_tasks.values().collect()
    }
}

/// Task Queue statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskQueueStats {
    pub ready: usize,
    pub blocked: usize,
    pub in_progress: usize,
    pub total: usize,
    pub capacity: usize,
    pub max_concurrent: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_issue(number: u64, priority_label: &str, deps: Vec<u64>) -> Issue {
        Issue {
            number,
            title: format!("Test Issue #{}", number),
            labels: vec![priority_label.to_string()],
            dependencies: deps,
            body: None,
        }
    }

    #[test]
    fn test_enqueue_dequeue() {
        let mut queue = TaskQueue::new(TaskQueueConfig::default());

        // Enqueue P0 task
        let issue = create_test_issue(1, "P0-Critical", vec![]);
        queue.enqueue(issue).unwrap();

        // Dequeue
        let task = queue.dequeue().unwrap();
        assert_eq!(task.issue.number, 1);
        assert_eq!(task.state, TaskState::InProgress);

        // Stats
        let stats = queue.stats();
        assert_eq!(stats.in_progress, 1);
        assert_eq!(stats.ready, 0);
    }

    #[test]
    fn test_priority_ordering() {
        let mut queue = TaskQueue::new(TaskQueueConfig::default());

        // Enqueue tasks in reverse priority order
        queue.enqueue(create_test_issue(1, "P3-Low", vec![])).unwrap();
        queue.enqueue(create_test_issue(2, "P0-Critical", vec![])).unwrap();
        queue.enqueue(create_test_issue(3, "P1-High", vec![])).unwrap();

        // Dequeue should return highest priority first
        assert_eq!(queue.dequeue().unwrap().issue.number, 2); // P0
        assert_eq!(queue.dequeue().unwrap().issue.number, 3); // P1
        assert_eq!(queue.dequeue().unwrap().issue.number, 1); // P3
    }

    #[test]
    fn test_dependency_blocking() {
        let mut queue = TaskQueue::new(TaskQueueConfig::default());

        // Enqueue task with dependency
        queue.enqueue(create_test_issue(1, "P0-Critical", vec![])).unwrap();
        queue.enqueue(create_test_issue(2, "P0-Critical", vec![1])).unwrap();

        // Task 2 should be blocked
        let stats = queue.stats();
        assert_eq!(stats.ready, 1);
        assert_eq!(stats.blocked, 1);

        // Complete task 1
        let task1 = queue.dequeue().unwrap();
        assert_eq!(task1.issue.number, 1);
        queue.complete(1).unwrap();

        // Task 2 should now be unblocked
        let stats = queue.stats();
        assert_eq!(stats.ready, 1);
        assert_eq!(stats.blocked, 0);

        let task2 = queue.dequeue().unwrap();
        assert_eq!(task2.issue.number, 2);
    }

    #[test]
    fn test_concurrent_limit() {
        let mut queue = TaskQueue::new(TaskQueueConfig {
            max_concurrent: 2,
            max_queue_size: 100,
        });

        // Enqueue 3 tasks
        for i in 1..=3 {
            queue.enqueue(create_test_issue(i, "P0-Critical", vec![])).unwrap();
        }

        // Dequeue 2 tasks (limit)
        assert!(queue.dequeue().is_some());
        assert!(queue.dequeue().is_some());

        // Third dequeue should return None (limit reached)
        assert!(queue.dequeue().is_none());

        let stats = queue.stats();
        assert_eq!(stats.in_progress, 2);
        assert_eq!(stats.ready, 1);
    }

    #[test]
    fn test_queue_size_limit() {
        let mut queue = TaskQueue::new(TaskQueueConfig {
            max_concurrent: 5,
            max_queue_size: 2,
        });

        // Enqueue 2 tasks (limit)
        queue.enqueue(create_test_issue(1, "P0-Critical", vec![])).unwrap();
        queue.enqueue(create_test_issue(2, "P0-Critical", vec![])).unwrap();

        // Third enqueue should fail
        let result = queue.enqueue(create_test_issue(3, "P0-Critical", vec![]));
        assert!(result.is_err());
    }

    #[test]
    fn test_multi_dependency_unblocking() {
        let mut queue = TaskQueue::new(TaskQueueConfig::default());

        // Task 3 depends on both 1 and 2
        queue.enqueue(create_test_issue(1, "P0-Critical", vec![])).unwrap();
        queue.enqueue(create_test_issue(2, "P0-Critical", vec![])).unwrap();
        queue.enqueue(create_test_issue(3, "P0-Critical", vec![1, 2])).unwrap();

        assert_eq!(queue.stats().blocked, 1);

        // Complete task 1
        let task1 = queue.dequeue().unwrap();
        queue.complete(task1.issue.number).unwrap();

        // Task 3 still blocked (waiting for task 2)
        assert_eq!(queue.stats().blocked, 1);

        // Complete task 2
        let task2 = queue.dequeue().unwrap();
        queue.complete(task2.issue.number).unwrap();

        // Task 3 now unblocked
        assert_eq!(queue.stats().blocked, 0);
        assert_eq!(queue.stats().ready, 1);
    }
}
