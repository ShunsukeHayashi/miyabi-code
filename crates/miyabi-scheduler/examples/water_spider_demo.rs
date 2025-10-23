//! Water Spider Orchestrator - Real Issue Processing Demo
//!
//! Demonstrates actual task processing for Issue #472 (10 tutorials)

use miyabi_scheduler::{DAGOperations, Scheduler, SessionConfig};
use miyabi_types::workflow::DAG;
use std::path::PathBuf;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {

    println!("\n🕷️  Water Spider Orchestrator - Issue #472 Processing\n");
    println!("{}\n", "=".repeat(70));

    // Load DAG from JSON
    let dag_path = PathBuf::from("crates/miyabi-scheduler/examples/issue-472-tasks.json");
    println!("📋 Loading DAG from: {:?}", dag_path);

    let dag = load_dag_from_json(&dag_path)?;
    println!("✅ DAG loaded: {} tasks, {} levels\n", dag.nodes.len(), dag.levels.len());

    // Print DAG structure
    println!("📊 Task Dependency Graph:");
    println!("{}", "-".repeat(70));
    for (level_idx, level) in dag.levels.iter().enumerate() {
        println!("  Level {}: {:?}", level_idx, level);
    }
    println!();

    // Create DAG operations
    let dag_ops = DAGOperations::new(dag)?;

    // Create scheduler with max 3 parallel sessions
    let session_config = SessionConfig::default();
    let mut scheduler = Scheduler::new(dag_ops, 3, session_config);

    println!("🚀 Starting Water Spider Scheduler");
    println!("{}", "-".repeat(70));
    println!("  Max parallel: 3 sessions");
    println!("  Total tasks: {}", scheduler.get_stats().total_tasks);
    println!();

    // Execute all tasks
    println!("▶️  Executing tasks...\n");

    // NOTE: This will fail in dry run mode since we don't have actual Claude CLI sessions
    // In real usage, this would spawn headless Claude Code sessions for each task
    match scheduler.execute_all().await {
        Ok(_) => {
            println!("\n✅ All tasks completed successfully!");
        }
        Err(e) => {
            eprintln!("\n❌ Scheduler error: {}", e);
            eprintln!("   (Expected in dry run mode - would work with real Claude CLI)");
        }
    }

    // Get final statistics
    let stats = scheduler.get_stats();
    println!("\n📊 Final Statistics:");
    println!("{}", "-".repeat(70));
    println!("  Total tasks: {}", stats.total_tasks);
    println!("  Completed: {}", stats.completed_tasks);
    println!("  Running: {}", stats.running_tasks);
    println!("  Pending: {}", stats.pending_tasks);

    // Calculate time savings
    let total_serial_time = 10 * 120; // 10 tasks × 120 minutes each
    let estimated_parallel_time = total_serial_time / 3; // 3x speedup with 3 parallel
    println!("\n⏱️  Time Estimation:");
    println!("{}", "-".repeat(70));
    println!("  Serial execution: {} minutes ({} hours)", total_serial_time, total_serial_time / 60);
    println!("  Parallel execution (3x): {} minutes ({:.1} hours)", estimated_parallel_time, estimated_parallel_time as f64 / 60.0);
    println!("  Time saved: {} minutes ({:.1} hours)", total_serial_time - estimated_parallel_time, (total_serial_time - estimated_parallel_time) as f64 / 60.0);

    println!("\n{}\n", "=".repeat(70));

    Ok(())
}

/// Load DAG from JSON file
fn load_dag_from_json(path: &PathBuf) -> Result<DAG, Box<dyn std::error::Error>> {
    let content = std::fs::read_to_string(path)?;
    let dag: DAG = serde_json::from_str(&content)?;
    Ok(dag)
}
