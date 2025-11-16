//! Observable agent pattern for real-time progress tracking
//!
//! This module provides traits and types for observing agent execution progress
//! in real-time, enabling better UX for long-running operations.

use async_trait::async_trait;
use chrono::{DateTime, Utc};
use miyabi_types::{AgentResult, Task};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Progress update from an agent
#[derive(Debug, Clone)]
pub struct ProgressUpdate {
    /// Current progress percentage (0-100)
    pub percentage: u8,
    /// Human-readable message describing current operation
    pub message: String,
    /// Timestamp of this update
    pub timestamp: DateTime<Utc>,
    /// Optional metadata
    pub metadata: Option<serde_json::Value>,
}

impl ProgressUpdate {
    /// Create a new progress update
    pub fn new(percentage: u8, message: impl Into<String>) -> Self {
        Self {
            percentage: percentage.min(100),
            message: message.into(),
            timestamp: Utc::now(),
            metadata: None,
        }
    }

    /// Create a progress update with metadata
    pub fn with_metadata(
        percentage: u8,
        message: impl Into<String>,
        metadata: serde_json::Value,
    ) -> Self {
        Self {
            percentage: percentage.min(100),
            message: message.into(),
            timestamp: Utc::now(),
            metadata: Some(metadata),
        }
    }
}

/// Log entry from an agent
#[derive(Debug, Clone)]
pub struct LogEntry {
    /// Log level (info, warn, error, debug)
    pub level: LogLevel,
    /// Log message
    pub message: String,
    /// Timestamp of this log entry
    pub timestamp: DateTime<Utc>,
    /// Optional context data
    pub context: Option<serde_json::Value>,
}

/// Log level enumeration
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LogLevel {
    /// Debug information
    Debug,
    /// Informational message
    Info,
    /// Warning message
    Warn,
    /// Error message
    Error,
}

impl LogEntry {
    /// Create an info log entry
    pub fn info(message: impl Into<String>) -> Self {
        Self {
            level: LogLevel::Info,
            message: message.into(),
            timestamp: Utc::now(),
            context: None,
        }
    }

    /// Create a warning log entry
    pub fn warn(message: impl Into<String>) -> Self {
        Self {
            level: LogLevel::Warn,
            message: message.into(),
            timestamp: Utc::now(),
            context: None,
        }
    }

    /// Create an error log entry
    pub fn error(message: impl Into<String>) -> Self {
        Self {
            level: LogLevel::Error,
            message: message.into(),
            timestamp: Utc::now(),
            context: None,
        }
    }

    /// Create a debug log entry
    pub fn debug(message: impl Into<String>) -> Self {
        Self {
            level: LogLevel::Debug,
            message: message.into(),
            timestamp: Utc::now(),
            context: None,
        }
    }

    /// Add context data to log entry
    pub fn with_context(mut self, context: serde_json::Value) -> Self {
        self.context = Some(context);
        self
    }
}

/// Observer trait for monitoring agent progress
#[async_trait]
pub trait ProgressObserver: Send + Sync {
    /// Called when progress is updated
    async fn on_progress(&self, update: ProgressUpdate);

    /// Called when a log entry is emitted
    async fn on_log(&self, entry: LogEntry);

    /// Called when agent starts
    async fn on_start(&self, task: &Task) {
        let _ = task; // Default implementation does nothing
    }

    /// Called when agent completes
    async fn on_complete(&self, result: &AgentResult) {
        let _ = result; // Default implementation does nothing
    }
}

/// Observable agent wrapper
///
/// Wraps an existing agent with progress observation capabilities.
pub struct ObservableAgent<A> {
    /// The wrapped agent
    agent: A,
    /// List of registered observers
    observers: Arc<RwLock<Vec<Arc<dyn ProgressObserver>>>>,
}

impl<A> ObservableAgent<A> {
    /// Create a new observable agent
    pub fn new(agent: A) -> Self {
        Self {
            agent,
            observers: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Add an observer
    pub async fn add_observer(&self, observer: Arc<dyn ProgressObserver>) {
        let mut observers = self.observers.write().await;
        observers.push(observer);
    }

    /// Remove all observers
    pub async fn clear_observers(&self) {
        let mut observers = self.observers.write().await;
        observers.clear();
    }

    /// Notify all observers of progress update
    pub async fn notify_progress(&self, update: ProgressUpdate) {
        let observers = self.observers.read().await;
        for observer in observers.iter() {
            observer.on_progress(update.clone()).await;
        }
    }

    /// Notify all observers of log entry
    pub async fn notify_log(&self, entry: LogEntry) {
        let observers = self.observers.read().await;
        for observer in observers.iter() {
            observer.on_log(entry.clone()).await;
        }
    }

    /// Notify all observers of start event
    async fn notify_start(&self, task: &Task) {
        let observers = self.observers.read().await;
        for observer in observers.iter() {
            observer.on_start(task).await;
        }
    }

    /// Notify all observers of completion event
    async fn notify_complete(&self, result: &AgentResult) {
        let observers = self.observers.read().await;
        for observer in observers.iter() {
            observer.on_complete(result).await;
        }
    }

    /// Get reference to the wrapped agent
    pub fn agent(&self) -> &A {
        &self.agent
    }

    /// Get mutable reference to the wrapped agent
    pub fn agent_mut(&mut self) -> &mut A {
        &mut self.agent
    }
}

#[async_trait]
impl<A: crate::BaseAgent> crate::BaseAgent for ObservableAgent<A> {
    fn agent_type(&self) -> miyabi_types::AgentType {
        self.agent.agent_type()
    }

    async fn execute(&self, task: &Task) -> Result<AgentResult, miyabi_types::error::MiyabiError> {
        // Notify start
        self.notify_start(task).await;
        self.notify_log(LogEntry::info(format!("Starting execution of task: {}", task.title)))
            .await;
        self.notify_progress(ProgressUpdate::new(0, "Starting...")).await;

        // Execute the wrapped agent
        let result = self.agent.execute(task).await;

        // Notify completion
        match &result {
            Ok(agent_result) => {
                self.notify_progress(ProgressUpdate::new(100, "Completed")).await;
                self.notify_log(LogEntry::info("Task completed successfully")).await;
                self.notify_complete(agent_result).await;
            },
            Err(error) => {
                self.notify_log(LogEntry::error(format!("Task failed: {}", error))).await;
            },
        }

        result
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::BaseAgent;
    use miyabi_types::agent::ResultStatus;
    use miyabi_types::{task::TaskType, AgentType};
    use std::sync::atomic::{AtomicUsize, Ordering};

    /// Mock agent for testing
    struct MockAgent;

    #[async_trait]
    impl crate::BaseAgent for MockAgent {
        fn agent_type(&self) -> AgentType {
            AgentType::CodeGenAgent
        }

        async fn execute(
            &self,
            _task: &Task,
        ) -> Result<AgentResult, miyabi_types::error::MiyabiError> {
            Ok(AgentResult {
                status: ResultStatus::Success,
                data: Some(serde_json::json!({"test": "data"})),
                error: None,
                metrics: None,
                escalation: None,
            })
        }
    }

    /// Mock observer for testing
    struct MockObserver {
        progress_count: Arc<AtomicUsize>,
        log_count: Arc<AtomicUsize>,
        start_count: Arc<AtomicUsize>,
        complete_count: Arc<AtomicUsize>,
    }

    impl MockObserver {
        fn new() -> Self {
            Self {
                progress_count: Arc::new(AtomicUsize::new(0)),
                log_count: Arc::new(AtomicUsize::new(0)),
                start_count: Arc::new(AtomicUsize::new(0)),
                complete_count: Arc::new(AtomicUsize::new(0)),
            }
        }
    }

    #[async_trait]
    impl ProgressObserver for MockObserver {
        async fn on_progress(&self, _update: ProgressUpdate) {
            self.progress_count.fetch_add(1, Ordering::SeqCst);
        }

        async fn on_log(&self, _entry: LogEntry) {
            self.log_count.fetch_add(1, Ordering::SeqCst);
        }

        async fn on_start(&self, _task: &Task) {
            self.start_count.fetch_add(1, Ordering::SeqCst);
        }

        async fn on_complete(&self, _result: &AgentResult) {
            self.complete_count.fetch_add(1, Ordering::SeqCst);
        }
    }

    #[tokio::test]
    async fn test_observable_agent_notifies_observers() {
        let agent = MockAgent;
        let observable = ObservableAgent::new(agent);

        let observer = Arc::new(MockObserver::new());
        observable.add_observer(observer.clone()).await;

        let task = Task {
            id: "test-task".to_string(),
            title: "Test Task".to_string(),
            description: "Test description".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec![],
            estimated_duration: Some(10),
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        };

        let result = observable.execute(&task).await;

        assert!(result.is_ok());
        assert_eq!(observer.start_count.load(Ordering::SeqCst), 1);
        assert_eq!(observer.complete_count.load(Ordering::SeqCst), 1);
        assert!(observer.progress_count.load(Ordering::SeqCst) >= 2); // Start + Complete
        assert!(observer.log_count.load(Ordering::SeqCst) >= 2); // Start + Complete logs
    }

    #[test]
    fn test_progress_update_creation() {
        let update = ProgressUpdate::new(50, "Half done");
        assert_eq!(update.percentage, 50);
        assert_eq!(update.message, "Half done");
        assert!(update.metadata.is_none());

        let update = ProgressUpdate::new(150, "Over 100"); // Should clamp to 100
        assert_eq!(update.percentage, 100);
    }

    #[test]
    fn test_log_entry_creation() {
        let info = LogEntry::info("Info message");
        assert_eq!(info.level, LogLevel::Info);
        assert_eq!(info.message, "Info message");

        let warn = LogEntry::warn("Warning message");
        assert_eq!(warn.level, LogLevel::Warn);

        let error = LogEntry::error("Error message");
        assert_eq!(error.level, LogLevel::Error);

        let debug = LogEntry::debug("Debug message");
        assert_eq!(debug.level, LogLevel::Debug);
    }

    #[tokio::test]
    async fn test_multiple_observers() {
        let agent = MockAgent;
        let observable = ObservableAgent::new(agent);

        let observer1 = Arc::new(MockObserver::new());
        let observer2 = Arc::new(MockObserver::new());

        observable.add_observer(observer1.clone()).await;
        observable.add_observer(observer2.clone()).await;

        let task = Task {
            id: "test-task".to_string(),
            title: "Test Task".to_string(),
            description: "Test description".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec![],
            estimated_duration: Some(10),
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        };

        let result = observable.execute(&task).await;

        assert!(result.is_ok());

        // Both observers should have been notified
        assert_eq!(observer1.start_count.load(Ordering::SeqCst), 1);
        assert_eq!(observer2.start_count.load(Ordering::SeqCst), 1);
        assert_eq!(observer1.complete_count.load(Ordering::SeqCst), 1);
        assert_eq!(observer2.complete_count.load(Ordering::SeqCst), 1);
    }

    #[tokio::test]
    async fn test_clear_observers() {
        let agent = MockAgent;
        let observable = ObservableAgent::new(agent);

        let observer = Arc::new(MockObserver::new());
        observable.add_observer(observer.clone()).await;
        observable.clear_observers().await;

        let task = Task {
            id: "test-task".to_string(),
            title: "Test Task".to_string(),
            description: "Test description".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec![],
            estimated_duration: Some(10),
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        };

        let result = observable.execute(&task).await;

        assert!(result.is_ok());

        // Observer should not have been notified after clear
        assert_eq!(observer.start_count.load(Ordering::SeqCst), 0);
        assert_eq!(observer.complete_count.load(Ordering::SeqCst), 0);
    }
}
