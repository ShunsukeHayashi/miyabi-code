//! Task queue management

use std::collections::{BinaryHeap, HashMap};
use std::cmp::Ordering;
use uuid::Uuid;
use chrono::Utc;

use crate::models::{Task, TaskStatus};

/// Priority queue wrapper for tasks
struct PriorityTask {
    task: Task,
}

impl PartialEq for PriorityTask {
    fn eq(&self, other: &Self) -> bool {
        self.task.id == other.task.id
    }
}

impl Eq for PriorityTask {}

impl PartialOrd for PriorityTask {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for PriorityTask {
    fn cmp(&self, other: &Self) -> Ordering {
        // Lower priority number = higher priority
        // If same priority, earlier created = higher priority
        match self.task.priority.cmp(&other.task.priority) {
            Ordering::Equal => other.task.created_at.cmp(&self.task.created_at),
            other => other.reverse(),
        }
    }
}

/// Task queue with priority support
pub struct TaskQueue {
    pending: BinaryHeap<PriorityTask>,
    active: HashMap<Uuid, Task>,
    completed: HashMap<Uuid, Task>,
    max_concurrent: usize,
}

impl TaskQueue {
    pub fn new(max_concurrent: usize) -> Self {
        Self {
            pending: BinaryHeap::new(),
            active: HashMap::new(),
            completed: HashMap::new(),
            max_concurrent,
        }
    }
    
    /// Add a new task to the queue
    pub fn enqueue(&mut self, task: Task) -> Uuid {
        let id = task.id;
        self.pending.push(PriorityTask { task });
        id
    }
    
    /// Get the next task to process (if capacity available)
    pub fn dequeue(&mut self) -> Option<Task> {
        if self.active.len() >= self.max_concurrent {
            return None;
        }
        
        if let Some(priority_task) = self.pending.pop() {
            let mut task = priority_task.task;
            task.status = TaskStatus::Running;
            task.started_at = Some(Utc::now());
            self.active.insert(task.id, task.clone());
            Some(task)
        } else {
            None
        }
    }
    
    /// Mark a task as completed
    pub fn complete(&mut self, task_id: Uuid, success: bool, result: Option<crate::models::TaskResult>) {
        if let Some(mut task) = self.active.remove(&task_id) {
            task.status = if success { TaskStatus::Completed } else { TaskStatus::Failed };
            task.completed_at = Some(Utc::now());
            task.result = result;
            self.completed.insert(task_id, task);
        }
    }
    
    /// Cancel a task
    pub fn cancel(&mut self, task_id: Uuid) -> bool {
        // Check pending queue
        let pending_tasks: Vec<_> = self.pending.drain().collect();
        let mut found = false;
        
        for priority_task in pending_tasks {
            if priority_task.task.id == task_id {
                let mut task = priority_task.task;
                task.status = TaskStatus::Cancelled;
                task.completed_at = Some(Utc::now());
                self.completed.insert(task_id, task);
                found = true;
            } else {
                self.pending.push(priority_task);
            }
        }
        
        if found {
            return true;
        }
        
        // Check active tasks
        if let Some(mut task) = self.active.remove(&task_id) {
            task.status = TaskStatus::Cancelled;
            task.completed_at = Some(Utc::now());
            self.completed.insert(task_id, task);
            return true;
        }
        
        false
    }
    
    /// Get task by ID
    pub fn get(&self, task_id: Uuid) -> Option<&Task> {
        self.active.get(&task_id)
            .or_else(|| self.completed.get(&task_id))
            .or_else(|| {
                self.pending.iter()
                    .find(|pt| pt.task.id == task_id)
                    .map(|pt| &pt.task)
            })
    }
    
    /// Get queue statistics
    pub fn stats(&self) -> (usize, usize, usize) {
        (self.pending.len(), self.active.len(), self.completed.len())
    }
}
