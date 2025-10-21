//! Generate Miyabi Business Plan using AIEntrepreneurAgent
//!
//! Usage:
//! ```bash
//! ANTHROPIC_API_KEY=sk-xxx cargo run --example generate_business_plan
//! ```

use miyabi_business_agents::strategy::AIEntrepreneurAgent;
use miyabi_business_agents::types::BusinessInput;
use miyabi_business_agents::BusinessAgent;
use std::fs;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt().with_env_filter("info").init();

    println!("🚀 Miyabi Business Plan Generator");
    println!("================================\n");

    // Check API key
    if std::env::var("ANTHROPIC_API_KEY").is_err() {
        eprintln!("❌ Error: ANTHROPIC_API_KEY environment variable not set");
        eprintln!("Please set it before running this example:");
        eprintln!("  export ANTHROPIC_API_KEY=sk-ant-...");
        std::process::exit(1);
    }

    // Create AIEntrepreneurAgent
    println!("📊 Initializing AIEntrepreneurAgent...");
    let agent =
        AIEntrepreneurAgent::new().map_err(|e| anyhow::anyhow!("Failed to create agent: {}", e))?;

    println!("✓ Agent initialized: {}", agent.description());
    println!();

    // Prepare business input for Miyabi
    let input = BusinessInput {
        industry: "SaaS / AI Automation Platform".to_string(),
        target_market: "Enterprise DevOps teams, Software development agencies, Tech startups"
            .to_string(),
        budget: 500_000, // $500K seed funding
        geography: Some("Global (Japan, North America, Europe)".to_string()),
        timeframe_months: Some(24), // 2-year plan
        context: Some(
            "Miyabi is a complete autonomous AI development operations platform. \
            Built with Rust for high performance, it provides 21 specialized agents \
            (7 Coding + 14 Business) for automating software development workflows. \
            Currently at v1.0.0 with 375+ tests passing. \
            Targeting Series A funding for scaling the platform globally."
                .to_string(),
        ),
    };

    println!("📋 Business Input:");
    println!("  Industry: {}", input.industry);
    println!("  Target Market: {}", input.target_market);
    println!("  Budget: ${}", input.budget);
    println!("  Geography: {}", input.geography.as_ref().unwrap());
    println!("  Timeframe: {} months", input.timeframe_months.unwrap());
    println!();

    // Validate input
    use validator::Validate;
    input
        .validate()
        .map_err(|e| anyhow::anyhow!("Invalid business input: {}", e))?;

    // Generate business plan
    println!("🤖 Generating 8-phase business plan with Claude...");
    println!(
        "⏱️  Estimated duration: {} seconds",
        agent.estimated_duration()
    );
    println!();

    let plan = agent
        .generate_plan(&input)
        .await
        .map_err(|e| anyhow::anyhow!("Failed to generate plan: {}", e))?;

    println!("✓ Business plan generated successfully!");
    println!();

    // Validate output
    println!("🔍 Validating business plan quality...");
    let validation = agent
        .validate_output(&plan)
        .await
        .map_err(|e| anyhow::anyhow!("Failed to validate plan: {}", e))?;

    println!("  Quality Score: {}/100", validation.quality_score);
    println!("  Valid: {}", validation.is_valid);
    println!("  Warnings: {}", validation.warnings.len());
    println!("  Errors: {}", validation.errors.len());
    println!("  Suggestions: {}", validation.suggestions.len());
    println!();

    if !validation.errors.is_empty() {
        eprintln!("❌ Validation Errors:");
        for error in &validation.errors {
            eprintln!("  - {}", error);
        }
        std::process::exit(1);
    }

    if !validation.warnings.is_empty() {
        println!("⚠️  Warnings:");
        for warning in &validation.warnings {
            println!("  - {}", warning);
        }
        println!();
    }

    // Display summary
    println!("📊 Business Plan Summary:");
    println!("  Title: {}", plan.title);
    println!("  Recommendations: {}", plan.recommendations.len());
    println!("  KPIs: {}", plan.kpis.len());
    println!("  Risks: {}", plan.risks.len());
    println!("  Milestones: {}", plan.timeline.milestones.len());
    println!("  Next Steps: {}", plan.next_steps.len());
    println!();

    // Save to JSON
    let json_output = serde_json::to_string_pretty(&plan)?;
    let json_path = "docs/miyabi_business_plan_2025.json";
    fs::write(json_path, &json_output)?;
    println!("✓ Saved JSON to: {}", json_path);

    // Generate Markdown report
    let markdown = generate_markdown_report(&plan);
    let md_path = "docs/MIYABI_BUSINESS_PLAN_2025.md";
    fs::write(md_path, &markdown)?;
    println!("✓ Saved Markdown to: {}", md_path);
    println!();

    println!("🎉 Business plan generation complete!");
    println!();
    println!("Next steps:");
    println!("  1. Review the generated plan: cat {}", md_path);
    println!("  2. Update Issue #178 with results");
    println!("  3. Share with stakeholders for feedback");

    Ok(())
}

fn generate_markdown_report(plan: &miyabi_business_agents::types::BusinessPlan) -> String {
    let mut md = String::new();

    md.push_str(&format!("# {}\n\n", plan.title));
    md.push_str(&format!(
        "**Generated**: {}\n\n",
        plan.generated_at.format("%Y-%m-%d %H:%M:%S UTC")
    ));

    md.push_str("---\n\n");

    // Executive Summary
    md.push_str("## Executive Summary\n\n");
    md.push_str(&plan.summary);
    md.push_str("\n\n");

    // Recommendations
    md.push_str("## Strategic Recommendations\n\n");
    for (i, rec) in plan.recommendations.iter().enumerate() {
        md.push_str(&format!(
            "### {}. {} (Priority: {})\n\n",
            i + 1,
            rec.title,
            rec.priority
        ));
        md.push_str(&format!("{}\n\n", rec.description));
        if let Some(cost) = rec.estimated_cost {
            md.push_str(&format!("- **Estimated Cost**: ${}\n", cost));
        }
        if let Some(roi) = rec.expected_roi {
            md.push_str(&format!("- **Expected ROI**: {}x\n", roi));
        }
        if !rec.dependencies.is_empty() {
            md.push_str(&format!(
                "- **Dependencies**: {}\n",
                rec.dependencies.join(", ")
            ));
        }
        md.push_str("\n");
    }

    // KPIs
    md.push_str("## Key Performance Indicators (KPIs)\n\n");
    md.push_str("| KPI | Baseline | Target | Unit | Frequency |\n");
    md.push_str("|-----|----------|--------|------|-----------|\n");
    for kpi in &plan.kpis {
        md.push_str(&format!(
            "| {} | {} | {} | {} | {:?} |\n",
            kpi.name, kpi.baseline, kpi.target, kpi.unit, kpi.frequency
        ));
    }
    md.push_str("\n");

    // Timeline
    md.push_str("## Implementation Timeline\n\n");
    for (i, milestone) in plan.timeline.milestones.iter().enumerate() {
        md.push_str(&format!("### Milestone {}: {}\n\n", i + 1, milestone.name));
        md.push_str(&format!(
            "**Target Date**: {}\n\n",
            milestone.target_date.format("%Y-%m-%d")
        ));

        md.push_str("**Deliverables**:\n");
        for deliverable in &milestone.deliverables {
            md.push_str(&format!("- {}\n", deliverable));
        }
        md.push_str("\n");

        md.push_str("**Success Criteria**:\n");
        for criteria in &milestone.success_criteria {
            md.push_str(&format!("- {}\n", criteria));
        }
        md.push_str("\n");
    }

    // Risks
    md.push_str("## Risk Assessment\n\n");
    md.push_str("| Risk | Severity | Probability | Mitigation |\n");
    md.push_str("|------|----------|-------------|------------|\n");
    for risk in &plan.risks {
        md.push_str(&format!(
            "| {} | {}/5 | {}% | {} |\n",
            risk.description,
            risk.severity,
            (risk.probability * 100.0) as u32,
            risk.mitigation.join("; ")
        ));
    }
    md.push_str("\n");

    // Next Steps
    md.push_str("## Immediate Next Steps\n\n");
    for (i, step) in plan.next_steps.iter().enumerate() {
        md.push_str(&format!("{}. {}\n", i + 1, step));
    }
    md.push_str("\n");

    md.push_str("---\n\n");
    md.push_str("*Generated by Miyabi AIEntrepreneurAgent*\n");

    md
}
