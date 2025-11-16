//! Ollama CodeGenAgent Example
//!
//! This example demonstrates how to use CodeGenAgent with Ollama integration
//! for local LLM-powered code generation.

use miyabi_agent_codegen::CodeGenAgent;
use miyabi_agent_core::BaseAgent;
use miyabi_types::task::TaskType;
use miyabi_types::{AgentConfig, Task};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize logging
    tracing_subscriber::fmt::init();

    println!("🚀 Ollama CodeGenAgent Example");
    println!("==============================");

    // Create agent configuration
    let config = AgentConfig {
        device_identifier: "ollama-example".to_string(),
        github_token: "test-token".to_string(),
        repo_owner: Some("test-owner".to_string()),
        repo_name: Some("test-repo".to_string()),
        use_task_tool: false,
        use_worktree: false,
        worktree_base_path: None,
        log_directory: "./logs".to_string(),
        report_directory: "./reports".to_string(),
        tech_lead_github_username: None,
        ciso_github_username: None,
        po_github_username: None,
        firebase_production_project: None,
        firebase_staging_project: None,
        production_url: None,
        staging_url: None,
    };

    // Create CodeGenAgent with Ollama integration
    let agent = CodeGenAgent::new_with_ollama(config)?;

    println!("✅ CodeGenAgent created with Ollama integration");
    println!("🤖 Agent type: {:?}", agent.agent_type());

    // Create test task
    let task = Task {
        id: "task-ollama-test".to_string(),
        title: "Implement a simple calculator".to_string(),
        description: "Create a Rust module with basic arithmetic operations (add, subtract, multiply, divide) with proper error handling for division by zero.".to_string(),
        task_type: TaskType::Feature,
        priority: 1,
        severity: None,
        impact: None,
        assigned_agent: Some(agent.agent_type()),
        dependencies: vec![],
        estimated_duration: Some(30),
        status: None,
        start_time: None,
        end_time: None,
        metadata: None,
    };

    println!("\n📝 Task: {}", task.title);
    println!("📋 Description: {}", task.description);

    // Test LLM code generation
    println!("\n🧠 Testing LLM code generation...");

    let start_time = std::time::Instant::now();
    let result = agent.execute(&task).await?;
    let duration = start_time.elapsed();

    println!("⏱️  Generation completed in {:.2}s", duration.as_secs_f64());

    // Display results
    println!("\n📊 Results:");
    println!("✅ Status: {:?}", result.status);

    if let Some(ref metrics) = result.metrics {
        println!("📈 Metrics:");
        println!("  - Duration: {}ms", metrics.duration_ms);
        println!("  - Lines changed: {:?}", metrics.lines_changed);
        println!("  - Tests added: {:?}", metrics.tests_added);
    }

    if let Some(ref data) = result.data {
        println!("📄 Generated data:");
        println!("{}", serde_json::to_string_pretty(data)?);
    }

    // Test different task types
    println!("\n🔧 Testing different task types...");

    let bug_task = Task {
        id: "task-bug-fix".to_string(),
        title: "Fix memory leak in parser".to_string(),
        description: "The parser is leaking memory when processing large files. Implement proper cleanup and resource management.".to_string(),
        task_type: TaskType::Bug,
        priority: 0,
        severity: None,
        impact: None,
        assigned_agent: Some(agent.agent_type()),
        dependencies: vec![],
        estimated_duration: Some(45),
        status: None,
        start_time: None,
        end_time: None,
        metadata: None,
    };

    let refactor_task = Task {
        id: "task-refactor".to_string(),
        title: "Refactor error handling".to_string(),
        description:
            "Replace panic! with proper Result<T, E> error handling throughout the codebase."
                .to_string(),
        task_type: TaskType::Refactor,
        priority: 2,
        severity: None,
        impact: None,
        assigned_agent: Some(agent.agent_type()),
        dependencies: vec![],
        estimated_duration: Some(60),
        status: None,
        start_time: None,
        end_time: None,
        metadata: None,
    };

    let tasks = vec![
        ("Feature", task),
        ("Bug", bug_task),
        ("Refactor", refactor_task),
    ];

    for (task_type, task) in tasks {
        println!("\n🔍 Testing {} task...", task_type);

        let start_time = std::time::Instant::now();
        let result = agent.execute(&task).await?;
        let duration = start_time.elapsed();

        println!("⏱️  {} task completed in {:.2}s", task_type, duration.as_secs_f64());

        if let Some(ref metrics) = result.metrics {
            println!("📈 {} metrics:", task_type);
            println!("  - Duration: {}ms", metrics.duration_ms);
            println!("  - Lines changed: {:?}", metrics.lines_changed);
            println!("  - Tests added: {:?}", metrics.tests_added);
        }
    }

    // Test error handling
    println!("\n❌ Testing error handling...");

    let invalid_task = Task {
        id: "task-invalid".to_string(),
        title: "Invalid task".to_string(),
        description: "This task has an invalid type for CodeGenAgent".to_string(),
        task_type: TaskType::Docs, // Invalid for CodeGenAgent
        priority: 1,
        severity: None,
        impact: None,
        assigned_agent: Some(agent.agent_type()),
        dependencies: vec![],
        estimated_duration: Some(30),
        status: None,
        start_time: None,
        end_time: None,
        metadata: None,
    };

    match agent.execute(&invalid_task).await {
        Ok(_) => println!("❌ Unexpected success for invalid task"),
        Err(e) => println!("✅ Expected error: {}", e),
    }

    println!("\n🎉 Ollama CodeGenAgent example completed successfully!");
    Ok(())
}
