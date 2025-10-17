//! Simple Ollama CodeGenAgent Test
//!
//! This example demonstrates CodeGenAgent with Ollama integration
//! without worktree dependencies.

use miyabi_agents::{codegen::CodeGenAgent, BaseAgent};
use miyabi_types::task::TaskType;
use miyabi_types::{AgentConfig, Task};


#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize logging
    tracing_subscriber::fmt::init();

    println!("🚀 Simple Ollama CodeGenAgent Test");
    println!("===================================");

    // Create agent configuration
    let config = AgentConfig {
        device_identifier: "ollama-test".to_string(),
        github_token: "test-token".to_string(),
        repo_owner: Some("test-owner".to_string()),
        repo_name: Some("test-repo".to_string()),
        use_task_tool: false,
        use_worktree: false, // Disable worktree to avoid Send issues
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
        id: "task-simple-test".to_string(),
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

    println!("\n🎉 Simple Ollama CodeGenAgent test completed successfully!");
    Ok(())
}
