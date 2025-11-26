//! Business Agent Persistence Demo
//!
//! This example demonstrates how to use the PersistableAgent trait
//! to save and query business agent execution results.
//!
//! Usage:
//! ```
//! export DATABASE_URL="postgres://user:pass@localhost/miyabi"
//! cargo run --example persistence_demo
//! ```

use miyabi_agent_business::{
    AIEntrepreneurAgent, AnalyticsAgent, ExecutionResultBuilder, ExecutionStatus,
    MarketResearchAgent, PersistableAgent,
};
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Get database URL from environment
    let database_url =
        std::env::var("DATABASE_URL").expect("DATABASE_URL must be set (e.g., postgres://...)");

    println!("🔌 Connecting to database...");
    let pool = PgPool::connect(&database_url).await?;
    println!("✅ Connected!");

    // Create a test repository (you should replace this with actual repository ID)
    let repo_id = create_test_repository(&pool).await?;
    println!("📦 Test repository created: {}", repo_id);

    println!("\n=== Demo 1: AIEntrepreneurAgent Execution ===");
    demo_ai_entrepreneur(&pool, repo_id).await?;

    println!("\n=== Demo 2: MarketResearchAgent Execution ===");
    demo_market_research(&pool, repo_id).await?;

    println!("\n=== Demo 3: AnalyticsAgent with Metrics ===");
    demo_analytics(&pool, repo_id).await?;

    println!("\n=== Demo 4: Query Execution History ===");
    demo_query_history(&pool, repo_id).await?;

    // Cleanup
    cleanup_test_data(&pool, repo_id).await?;
    println!("\n🧹 Cleaned up test data");

    Ok(())
}

/// Demo 1: Save AIEntrepreneurAgent execution
async fn demo_ai_entrepreneur(pool: &PgPool, repo_id: Uuid) -> Result<(), Box<dyn std::error::Error>> {
    let agent = AIEntrepreneurAgent::new(Default::default());

    // Create execution result
    let result = ExecutionResultBuilder::new(repo_id, "AIEntrepreneurAgent".to_string())
        .issue_number(100)
        .status(ExecutionStatus::Running)
        .start_now()
        .result(json!({
            "business_plan": {
                "executive_summary": "AI-powered SaaS platform for small businesses",
                "phases": 8,
                "total_budget": 500000,
                "target_market": "SMB",
                "revenue_projection_year_1": 100000
            }
        }))
        .quality_score(95)
        .build();

    println!("💾 Saving AIEntrepreneurAgent execution (running)...");
    let execution_id = agent.save_execution(pool, &result).await?;
    println!("✅ Execution saved: {}", execution_id);

    // Update to completed
    let mut completed_result = result.clone();
    completed_result.execution_id = Some(execution_id);
    completed_result.status = ExecutionStatus::Completed;
    completed_result.completed_at = Some(chrono::Utc::now());

    println!("🔄 Updating to completed...");
    agent.save_execution(pool, &completed_result).await?;
    println!("✅ Updated to completed");

    Ok(())
}

/// Demo 2: MarketResearchAgent with detailed analysis
async fn demo_market_research(
    pool: &PgPool,
    repo_id: Uuid,
) -> Result<(), Box<dyn std::error::Error>> {
    let agent = MarketResearchAgent::new(Default::default());

    let result = ExecutionResultBuilder::new(repo_id, "MarketResearchAgent".to_string())
        .issue_number(101)
        .status(ExecutionStatus::Completed)
        .start_now()
        .complete_now()
        .result(json!({
            "competitors_analyzed": 25,
            "market_size_usd": 5000000000,
            "growth_rate_percent": 12.5,
            "top_competitors": [
                {"name": "Competitor A", "market_share": 35},
                {"name": "Competitor B", "market_share": 28},
                {"name": "Competitor C", "market_share": 15}
            ],
            "market_trends": ["AI Integration", "Cloud Migration", "Mobile-First"]
        }))
        .quality_score(92)
        .build();

    println!("💾 Saving MarketResearchAgent execution...");
    let execution_id = agent.save_execution(pool, &result).await?;
    println!("✅ Execution saved: {}", execution_id);

    Ok(())
}

/// Demo 3: AnalyticsAgent with additional metrics
async fn demo_analytics(pool: &PgPool, repo_id: Uuid) -> Result<(), Box<dyn std::error::Error>> {
    let agent = AnalyticsAgent::new(Default::default());

    let result = ExecutionResultBuilder::new(repo_id, "AnalyticsAgent".to_string())
        .issue_number(102)
        .status(ExecutionStatus::Completed)
        .start_now()
        .complete_now()
        .result(json!({
            "period": "2024-Q4",
            "kpis": {
                "page_views": 50000,
                "unique_visitors": 15000,
                "conversion_rate": 3.2,
                "avg_session_duration": 245
            }
        }))
        .quality_score(88)
        .build();

    println!("💾 Saving AnalyticsAgent execution...");
    let execution_id = agent.save_execution(pool, &result).await?;
    println!("✅ Execution saved: {}", execution_id);

    // Save additional analysis metrics
    let metrics = json!({
        "engagement_score": 85,
        "bounce_rate": 42.5,
        "roi_percent": 156.7,
        "top_pages": ["/home", "/products", "/pricing"]
    });

    println!("📊 Saving additional analysis metrics...");
    agent
        .save_analysis_metrics(pool, execution_id, metrics)
        .await?;
    println!("✅ Metrics saved");

    Ok(())
}

/// Demo 4: Query execution history
async fn demo_query_history(pool: &PgPool, repo_id: Uuid) -> Result<(), Box<dyn std::error::Error>> {
    println!("📜 Querying execution history...\n");

    // Query AIEntrepreneurAgent history
    let entrepreneur = AIEntrepreneurAgent::new(Default::default());
    let history = entrepreneur.load_history(pool, repo_id, 10).await?;

    println!("📊 AIEntrepreneurAgent History ({} executions):", history.len());
    for exec in &history {
        println!(
            "  - Execution {}: {:?} (Quality: {:?})",
            exec.execution_id.unwrap(),
            exec.status,
            exec.quality_score
        );
    }

    // Get latest execution
    if let Some(latest) = entrepreneur.get_latest_execution(pool, repo_id).await? {
        println!("\n🎯 Latest AIEntrepreneurAgent execution:");
        println!("  ID: {}", latest.execution_id.unwrap());
        println!("  Status: {:?}", latest.status);
        println!("  Issue: #{:?}", latest.issue_number);
        println!(
            "  Duration: {:?}",
            latest
                .completed_at
                .and_then(|end| latest.started_at.map(|start| end - start))
        );
        println!("  Quality Score: {:?}", latest.quality_score);
    }

    // Query all agent types
    println!("\n📋 Execution summary by agent type:");

    let summary = sqlx::query!(
        r#"
        SELECT
            agent_type,
            COUNT(*) as execution_count,
            AVG(quality_score)::int as avg_quality,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
            COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
        FROM agent_executions
        WHERE repository_id = $1
        GROUP BY agent_type
        ORDER BY execution_count DESC
        "#,
        repo_id
    )
    .fetch_all(pool)
    .await?;

    for row in summary {
        println!(
            "  {} {} executions (avg quality: {:?}, completed: {}, failed: {})",
            row.agent_type,
            row.execution_count.unwrap_or(0),
            row.avg_quality,
            row.completed_count.unwrap_or(0),
            row.failed_count.unwrap_or(0)
        );
    }

    Ok(())
}

/// Helper: Create test repository
async fn create_test_repository(pool: &PgPool) -> Result<Uuid, Box<dyn std::error::Error>> {
    let repo_id = Uuid::new_v4();
    let user_id = Uuid::new_v4();

    // Create test user
    sqlx::query!(
        r#"
        INSERT INTO users (id, github_id, email, access_token)
        VALUES ($1, 99999, 'demo@example.com', 'demo_token')
        ON CONFLICT (github_id) DO NOTHING
        "#,
        user_id
    )
    .execute(pool)
    .await
    .ok();

    // Create test repository
    sqlx::query!(
        r#"
        INSERT INTO repositories (id, user_id, github_repo_id, owner, name, full_name)
        VALUES ($1, $2, 88888, 'demo-owner', 'demo-repo', 'demo-owner/demo-repo')
        ON CONFLICT (github_repo_id) DO UPDATE SET id = $1
        RETURNING id
        "#,
        repo_id,
        user_id
    )
    .fetch_one(pool)
    .await?;

    Ok(repo_id)
}

/// Helper: Cleanup test data
async fn cleanup_test_data(pool: &PgPool, repo_id: Uuid) -> Result<(), Box<dyn std::error::Error>> {
    sqlx::query!(
        "DELETE FROM agent_executions WHERE repository_id = $1",
        repo_id
    )
    .execute(pool)
    .await?;

    sqlx::query!("DELETE FROM repositories WHERE id = $1", repo_id)
        .execute(pool)
        .await?;

    Ok(())
}
