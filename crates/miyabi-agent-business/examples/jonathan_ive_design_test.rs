//! Integration test for JonathanIveDesignAgent
//!
//! This example demonstrates the full workflow of using JonathanIveDesignAgent
//! to review a UI/UX design with real LLM integration.

use miyabi_agent_business::JonathanIveDesignAgent;
use miyabi_agent_core::BaseAgent;
use miyabi_types::task::TaskType;
use miyabi_types::{AgentConfig, Task};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🎨 Jonathan Ive Design Agent - Integration Test");
    println!("================================================\n");

    // Create agent configuration
    let config = AgentConfig {
        device_identifier: "integration-test".to_string(),
        github_token: std::env::var("GITHUB_TOKEN")
            .unwrap_or_else(|_| "test-token".to_string()),
        repo_owner: Some("test-owner".to_string()),
        repo_name: Some("test-repo".to_string()),
        use_task_tool: true,
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

    // Create agent
    let agent = JonathanIveDesignAgent::new(config);
    println!("✅ Agent initialized: {:?}", agent.agent_type());

    // Test Case 1: Dashboard Design Review
    println!("\n📋 Test Case 1: Dashboard Design Review");
    println!("---------------------------------------");

    let dashboard_task = Task {
        id: "test-dashboard-1".to_string(),
        title: "Analytics Dashboard UI Design".to_string(),
        description: r#"A modern analytics dashboard featuring:
- Real-time data visualization with charts and graphs
- Multiple color scheme with gradients (purple, blue, pink)
- Animated transitions on data updates
- Dense information layout with minimal whitespace
- Multiple font families for visual interest"#
            .to_string(),
        task_type: TaskType::Feature,
        priority: 1,
        severity: None,
        impact: None,
        assigned_agent: None,
        dependencies: vec![],
        estimated_duration: Some(120),
        status: None,
        start_time: None,
        end_time: None,
        metadata: None,
    };

    println!("Task: {}", dashboard_task.title);
    println!("Executing design review...\n");

    match agent.execute(&dashboard_task).await {
        Ok(result) => {
            println!("✅ Design Review Completed");
            println!("Status: {:?}", result.status);

            if let Some(data) = &result.data {
                println!("\n📊 Review Results:");
                if let Some(summary) = data.get("summary") {
                    println!("  Summary: {}", summary);
                }
                if let Some(score) = data.get("overall_score") {
                    println!("  Overall Score: {}/100", score);
                }
                if let Some(strengths) = data.get("strengths_count") {
                    println!("  Strengths: {}", strengths);
                }
                if let Some(improvements) = data.get("improvements_count") {
                    println!("  Improvements: {}", improvements);
                }
                if let Some(recommendations) = data.get("recommendations_count") {
                    println!("  Recommendations: {}", recommendations);
                }

                // Print full review details
                if let Some(review) = data.get("design_review") {
                    println!("\n📝 Detailed Review:");
                    println!("{}", serde_json::to_string_pretty(review)?);
                }
            }

            if let Some(metrics) = &result.metrics {
                println!("\n⏱️  Execution Metrics:");
                println!("  Duration: {}ms", metrics.duration_ms);
                if let Some(quality) = metrics.quality_score {
                    println!("  Quality Score: {}", quality);
                }
                if let Some(errors) = metrics.errors_found {
                    println!("  Design Issues Found: {}", errors);
                }
            }
        }
        Err(e) => {
            eprintln!("❌ Design Review Failed: {}", e);
            return Err(e.into());
        }
    }

    // Test Case 2: Minimalist Landing Page Review
    println!("\n\n📋 Test Case 2: Minimalist Landing Page Review");
    println!("----------------------------------------------");

    let landing_task = Task {
        id: "test-landing-1".to_string(),
        title: "Product Landing Page Design".to_string(),
        description: r#"A minimalist product landing page featuring:
- Clean white background with single accent color
- Large, bold typography with clear hierarchy
- Generous whitespace and breathing room
- Subtle fade-in animations on scroll
- Single sans-serif font family
- Simple, elegant layout"#
            .to_string(),
        task_type: TaskType::Feature,
        priority: 1,
        severity: None,
        impact: None,
        assigned_agent: None,
        dependencies: vec![],
        estimated_duration: Some(90),
        status: None,
        start_time: None,
        end_time: None,
        metadata: None,
    };

    println!("Task: {}", landing_task.title);
    println!("Executing design review...\n");

    match agent.execute(&landing_task).await {
        Ok(result) => {
            println!("✅ Design Review Completed");

            if let Some(data) = &result.data {
                if let Some(summary) = data.get("summary") {
                    println!("  Summary: {}", summary);
                }
                if let Some(score) = data.get("overall_score") {
                    println!("  Overall Score: {}/100", score);
                }
            }
        }
        Err(e) => {
            eprintln!("❌ Design Review Failed: {}", e);
            return Err(e.into());
        }
    }

    println!("\n\n🎉 Integration Test Completed Successfully!");
    println!("==========================================");

    Ok(())
}
