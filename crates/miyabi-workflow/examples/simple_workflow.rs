//! Simple workflow example demonstrating WorkflowBuilder API
//!
//! Run with: cargo run --example simple_workflow

use miyabi_types::agent::AgentType;
use miyabi_workflow::{StateStore, StepContext, WorkflowBuilder};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🔄 Miyabi Workflow Example - Simple Sequential Workflow\n");

    // Create a simple sequential workflow
    let workflow = WorkflowBuilder::new("simple-issue-resolution")
        .step("analyze-issue", AgentType::IssueAgent)
        .then("generate-code", AgentType::CodeGenAgent)
        .then("review-code", AgentType::ReviewAgent)
        .then("deploy", AgentType::DeploymentAgent);

    println!("📋 Workflow: {}", workflow.name());
    println!("   Steps defined: 4");
    println!("   Pattern: Sequential (step -> then -> then -> then)\n");

    // Display workflow structure
    println!("🌳 Workflow DAG:");
    println!("   1. analyze-issue (IssueAgent)");
    println!("      ↓");
    println!("   2. generate-code (CodeGenAgent)");
    println!("      ↓");
    println!("   3. review-code (ReviewAgent)");
    println!("      ↓");
    println!("   4. deploy (DeploymentAgent)\n");

    // Build DAG to verify structure
    let dag = workflow.build_dag()?;
    println!("✅ DAG structure validated");
    println!("   Nodes: {}", dag.nodes.len());
    println!("   Edges: {}", dag.edges.len());
    println!();

    // Create state store for persistence
    let temp_dir = std::env::temp_dir().join("miyabi-workflow-example");
    let store = StateStore::with_path(&temp_dir)?;

    println!("💾 State directory: {}", temp_dir.display());

    // Create step context
    let workflow_id = "test-workflow-001";
    let ctx = StepContext::new(workflow_id);

    println!("🆔 Workflow ID: {}", workflow_id);
    println!();

    // Save context
    store.save_context(&ctx)?;
    println!("✅ Context saved successfully");

    // Load context back
    let loaded_ctx = store.load_context(workflow_id)?;
    if let Some(ctx) = loaded_ctx {
        println!("✅ Context loaded successfully");
        println!("   Workflow ID: {}", ctx.workflow_id);
        println!("   Outputs: {}", ctx.outputs.len());
    }
    println!();

    // List all active workflows
    let active_workflows = store.list_active()?;
    println!("📋 Active workflows: {}", active_workflows.len());
    println!();

    println!("🎉 Workflow structure validated successfully!");
    println!("   ✓ WorkflowBuilder API working");
    println!("   ✓ DAG construction working");
    println!("   ✓ State persistence working");
    println!("   ✓ State loading working");
    println!();

    println!("ℹ️  Note: Full workflow execution requires CoordinatorAgent integration (Issue #719)");

    Ok(())
}
