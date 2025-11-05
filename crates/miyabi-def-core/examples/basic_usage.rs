//! Basic usage example for miyabi-def-core
//!
//! Run with: cargo run --example basic_usage

use miyabi_def_core::MiyabiDef;

fn main() -> anyhow::Result<()> {
    println!("🌸 Miyabi Definition System - Basic Usage Example\n");

    // Load definitions
    println!("📚 Loading definitions...");
    let def = MiyabiDef::load_default()?;

    // Display metadata
    let metadata = def.metadata();
    println!("\n📋 Metadata:");
    println!("  Project: {}", metadata.project_name);
    println!("  Version: {}", metadata.version);
    println!("  Generated: {}", metadata.generated_at);

    // Display entities
    println!("\n🏗️  Entities ({} total):", def.entities().len());
    for (id, entity) in def.entities().iter().take(5) {
        println!("  {} - {}: {}", id, entity.name, entity.description);
    }
    if def.entities().len() > 5 {
        println!("  ... and {} more", def.entities().len() - 5);
    }

    // Display relations
    println!("\n🔗 Relations ({} total):", def.relations().len());
    for (id, relation) in def.relations().iter().take(5) {
        let cardinality = relation.cardinality.as_deref().unwrap_or("N/A");
        println!(
            "  {} - {} --{}→ {} ({})",
            id, relation.from, relation.name, relation.to, cardinality
        );
    }
    if def.relations().len() > 5 {
        println!("  ... and {} more", def.relations().len() - 5);
    }

    // Display labels by category
    println!("\n🏷️  Labels ({} total):", def.labels().len());
    let state_labels: Vec<_> = def
        .labels()
        .values()
        .filter(|l| l.is_state_label())
        .collect();
    println!("  STATE labels: {}", state_labels.len());
    for label in state_labels.iter().take(3) {
        let emoji = label.emoji.as_deref().unwrap_or("");
        println!("    {} {} - {}", emoji, label.name, label.description);
    }

    let priority_labels: Vec<_> = def
        .labels()
        .values()
        .filter(|l| l.is_priority_label())
        .collect();
    println!("  PRIORITY labels: {}", priority_labels.len());

    let agent_labels: Vec<_> = def
        .labels()
        .values()
        .filter(|l| l.is_agent_label())
        .collect();
    println!("  AGENT labels: {}", agent_labels.len());

    // Display workflows
    println!("\n📋 Workflows ({} total):", def.workflows().len());
    for (id, workflow) in def.workflows() {
        let duration = workflow.duration.as_deref().unwrap_or("N/A");
        println!("  {} - {} ({})", id, workflow.name, duration);
    }

    // Display agents
    println!("\n🤖 Agents ({} total):", def.agents().len());
    let coding_agents: Vec<_> = def
        .agents()
        .values()
        .filter(|a| a.is_coding_agent())
        .collect();
    println!("  Coding agents: {}", coding_agents.len());
    for agent in coding_agents.iter().take(3) {
        let character = agent.character.as_deref().unwrap_or("N/A");
        println!("    {} ({})", agent.name, character);
    }

    let business_agents: Vec<_> = def
        .agents()
        .values()
        .filter(|a| a.is_business_agent())
        .collect();
    println!("  Business agents: {}", business_agents.len());

    println!("\n✅ Done!");

    Ok(())
}
