//! AIEntrepreneurAgent Demo - 8-Phase Business Plan Generation
//!
//! This example demonstrates how to use AIEntrepreneurAgent to generate
//! a comprehensive business plan for a SaaS startup.
//!
//! # Prerequisites
//!
//! Set the ANTHROPIC_API_KEY environment variable:
//! ```bash
//! export ANTHROPIC_API_KEY=sk-ant-xxxxx
//! ```
//!
//! # Run Example
//!
//! ```bash
//! cargo run --example ai_entrepreneur_demo
//! ```

use miyabi_business_agents::strategy::AIEntrepreneurAgent;
use miyabi_business_agents::types::BusinessInput;
use miyabi_business_agents::traits::BusinessAgent;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing subscriber for logging
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();

    println!("🌸 Miyabi AIEntrepreneurAgent Demo\n");
    println!("{}", "=".repeat(60));

    // Create AIEntrepreneurAgent instance
    println!("\n📦 Creating AIEntrepreneurAgent...");
    let agent = AIEntrepreneurAgent::new()?;

    println!("   Agent Type: {}", agent.agent_type());
    println!("   Description: {}", agent.description());
    println!("   Estimated Duration: {} seconds", agent.estimated_duration());

    // Prepare business input
    println!("\n📋 Preparing Business Input...");
    let input = BusinessInput {
        industry: "SaaS".to_string(),
        target_market: "AI開発者向け自動化ツール".to_string(),
        budget: 100_000, // $100,000
        geography: Some("日本・北米".to_string()),
        timeframe_months: Some(12),
        context: Some(
            "GitHub統合型の完全自律開発プラットフォーム。\
             Issue作成からPR作成、デプロイまでを自動化。\
             競合: GitHub Copilot, Cursor, Replit".to_string()
        ),
    };

    println!("   Industry: {}", input.industry);
    println!("   Target Market: {}", input.target_market);
    println!("   Budget: ${}", input.budget);
    println!("   Geography: {}", input.geography.as_deref().unwrap_or("Global"));
    println!("   Timeframe: {} months", input.timeframe_months.unwrap_or(12));
    println!("   Context: {}", input.context.as_deref().unwrap_or("None"));

    // Generate business plan
    println!("\n🚀 Generating 8-Phase Business Plan...");
    println!("   (This may take 30-45 seconds)");

    let plan = agent.generate_plan(&input).await?;

    println!("\n✅ Business Plan Generated!\n");
    println!("{}", "=".repeat(60));

    // Display results
    println!("\n📊 **{}**", plan.title);
    println!("\n{}", "=".repeat(60));

    println!("\n## Executive Summary\n");
    println!("{}", plan.summary);

    println!("\n{}", "=".repeat(60));
    println!("\n## Recommendations ({})\n", plan.recommendations.len());
    for (i, rec) in plan.recommendations.iter().enumerate() {
        println!("{}. **{}** (Priority: {})", i + 1, rec.title, rec.priority);
        println!("   Description: {}", rec.description);
        if let Some(cost) = rec.estimated_cost {
            println!("   Estimated Cost: ${}", cost);
        }
        if let Some(roi) = rec.expected_roi {
            println!("   Expected ROI: {}x", roi);
        }
        if !rec.dependencies.is_empty() {
            println!("   Dependencies: {:?}", rec.dependencies);
        }
        println!();
    }

    println!("{}", "=".repeat(60));
    println!("\n## Key Performance Indicators ({})\n", plan.kpis.len());
    for (i, kpi) in plan.kpis.iter().enumerate() {
        println!("{}. **{}**", i + 1, kpi.name);
        println!("   Baseline: {} {}", kpi.baseline, kpi.unit);
        println!("   Target: {} {}", kpi.target, kpi.unit);
        println!("   Frequency: {}", kpi.frequency);
        println!();
    }

    println!("{}", "=".repeat(60));
    println!("\n## Timeline Milestones ({})\n", plan.timeline.milestones.len());
    for (i, milestone) in plan.timeline.milestones.iter().enumerate() {
        println!("{}. **{}**", i + 1, milestone.name);
        println!("   Target Date: {}", milestone.target_date.format("%Y-%m-%d"));
        println!("   Deliverables:");
        for deliverable in &milestone.deliverables {
            println!("     - {}", deliverable);
        }
        println!("   Success Criteria:");
        for criteria in &milestone.success_criteria {
            println!("     - {}", criteria);
        }
        println!();
    }

    println!("{}", "=".repeat(60));
    println!("\n## Risk Assessment ({})\n", plan.risks.len());
    for (i, risk) in plan.risks.iter().enumerate() {
        println!("{}. **{}**", i + 1, risk.description);
        println!("   Severity: {}/5", risk.severity);
        println!("   Probability: {:.0}%", risk.probability * 100.0);
        println!("   Mitigation:");
        for mitigation in &risk.mitigation {
            println!("     - {}", mitigation);
        }
        println!();
    }

    println!("{}", "=".repeat(60));
    println!("\n## Next Steps ({})\n", plan.next_steps.len());
    for (i, step) in plan.next_steps.iter().enumerate() {
        println!("{}. {}", i + 1, step);
    }

    // Validate the plan
    println!("\n{}", "=".repeat(60));
    println!("\n🔍 Validating Business Plan...\n");

    let validation = agent.validate_output(&plan).await?;

    println!("Quality Score: {}/100", validation.quality_score);
    println!("Valid: {}", if validation.is_valid { "✅ Yes" } else { "❌ No" });

    if !validation.errors.is_empty() {
        println!("\n❌ Errors:");
        for error in &validation.errors {
            println!("   - {}", error);
        }
    }

    if !validation.warnings.is_empty() {
        println!("\n⚠️  Warnings:");
        for warning in &validation.warnings {
            println!("   - {}", warning);
        }
    }

    if !validation.suggestions.is_empty() {
        println!("\n💡 Suggestions:");
        for suggestion in &validation.suggestions {
            println!("   - {}", suggestion);
        }
    }

    println!("\n{}", "=".repeat(60));
    println!("\n🎉 Demo Complete!");
    println!("\nGenerated at: {}", plan.generated_at.format("%Y-%m-%d %H:%M:%S UTC"));
    println!("Validated at: {}", validation.validated_at.format("%Y-%m-%d %H:%M:%S UTC"));

    Ok(())
}
