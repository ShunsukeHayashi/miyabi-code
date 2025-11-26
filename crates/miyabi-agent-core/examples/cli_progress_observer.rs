//! Example: CLI Progress Observer
//!
//! Demonstrates how to use ObservableAgent with a CLI progress bar.
//!
//! Run with: cargo run --example cli_progress_observer

use async_trait::async_trait;
use indicatif::{ProgressBar, ProgressStyle};
use miyabi_agent_core::{
    BaseAgent, LogEntry, LogLevel, ObservableAgent, ProgressObserver, ProgressUpdate,
};
use miyabi_types::{agent::ResultStatus, task::TaskType, AgentResult, AgentType, Task};
use std::sync::Arc;

/// CLI Progress Observer using indicatif
struct CLIProgressObserver {
    progress_bar: ProgressBar,
}

impl CLIProgressObserver {
    fn new() -> Self {
        let pb = ProgressBar::new(100);
        pb.set_style(
            ProgressStyle::default_bar()
                .template("[{elapsed_precise}] {bar:40.cyan/blue} {pos:>3}% {msg}")
                .expect("Invalid template")
                .progress_chars("█▓▒░"),
        );
        Self { progress_bar: pb }
    }
}

#[async_trait]
impl ProgressObserver for CLIProgressObserver {
    async fn on_progress(&self, update: ProgressUpdate) {
        self.progress_bar.set_position(update.percentage as u64);
        self.progress_bar.set_message(update.message);
    }

    async fn on_log(&self, entry: LogEntry) {
        let level_icon = match entry.level {
            LogLevel::Debug => "🔍",
            LogLevel::Info => "ℹ️",
            LogLevel::Warn => "⚠️",
            LogLevel::Error => "❌",
        };
        self.progress_bar
            .println(format!("{} {}", level_icon, entry.message));
    }

    async fn on_start(&self, task: &Task) {
        self.progress_bar
            .println(format!("🚀 Starting: {}", task.title));
        self.progress_bar.reset();
    }

    async fn on_complete(&self, result: &AgentResult) {
        self.progress_bar
            .finish_with_message(format!("✅ Status: {:?}", result.status));
    }
}

/// Example agent that simulates work with progress updates
struct ExampleAgent;

#[async_trait]
impl BaseAgent for ExampleAgent {
    fn agent_type(&self) -> AgentType {
        AgentType::CodeGenAgent
    }

    async fn execute(&self, task: &Task) -> Result<AgentResult, miyabi_types::error::MiyabiError> {
        // Simulate work with progress updates would go here
        // In a real implementation, the agent would call:
        // observable.notify_progress(ProgressUpdate::new(50, "Half done"));

        println!("  → Executing task: {}", task.title);

        // Simulate some work
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

        Ok(AgentResult {
            status: ResultStatus::Success,
            data: Some(serde_json::json!({"result": "completed"})),
            error: None,
            metrics: None,
            escalation: None,
        })
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🎨 CLI Progress Observer Example\n");

    // Create the base agent
    let agent = ExampleAgent;

    // Wrap it with ObservableAgent
    let observable = ObservableAgent::new(agent);

    // Add CLI progress observer
    let observer = Arc::new(CLIProgressObserver::new());
    observable.add_observer(observer).await;

    // Create a sample task
    let task = Task {
        id: "example-task".to_string(),
        title: "Generate Rust code for user authentication".to_string(),
        description: "Implement login, logout, and JWT token handling".to_string(),
        task_type: TaskType::Feature,
        priority: 1,
        severity: None,
        impact: None,
        assigned_agent: Some(AgentType::CodeGenAgent),
        dependencies: vec![],
        estimated_duration: Some(30),
        status: None,
        start_time: None,
        end_time: None,
        metadata: None,
    };

    // Execute with progress tracking
    println!("Executing task with progress tracking...\n");
    let result = observable.execute(&task).await?;

    println!("\n✅ Task completed with status: {:?}", result.status);
    println!("\n💡 In a real implementation, the agent would call:");
    println!("   observable.notify_progress(ProgressUpdate::new(25, \"Analyzing requirements\"));");
    println!("   observable.notify_progress(ProgressUpdate::new(50, \"Generating code\"));");
    println!("   observable.notify_progress(ProgressUpdate::new(75, \"Running tests\"));");
    println!("   observable.notify_log(LogEntry::info(\"Generated 3 files\"));");

    Ok(())
}
