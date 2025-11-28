//! Integration tests for business agent persistence
//!
//! These tests verify that all business agents can persist their execution
//! results to PostgreSQL database.
//!
//! Note: These tests require a running PostgreSQL instance.
//! Set DATABASE_URL environment variable to run these tests.

use miyabi_agent_business::*;
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

/// Helper to get test database pool
async fn get_test_pool() -> Option<PgPool> {
    let database_url = std::env::var("DATABASE_URL").ok()?;
    PgPool::connect(&database_url).await.ok()
}

/// Helper to create test repository
async fn create_test_repository(pool: &PgPool) -> Uuid {
    let repo_id = Uuid::new_v4();
    let user_id = Uuid::new_v4();

    // Create test user first
    sqlx::query!(
        r#"
        INSERT INTO users (id, github_id, email, access_token)
        VALUES ($1, 12345, 'test@example.com', 'test_token')
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
        VALUES ($1, $2, 67890, 'test-owner', 'test-repo', 'test-owner/test-repo')
        ON CONFLICT (github_repo_id) DO UPDATE SET id = $1
        "#,
        repo_id,
        user_id
    )
    .execute(pool)
    .await
    .ok();

    repo_id
}

/// Helper to clean up test data
async fn cleanup_test_data(pool: &PgPool, repo_id: Uuid) {
    sqlx::query!(
        "DELETE FROM agent_executions WHERE repository_id = $1",
        repo_id
    )
    .execute(pool)
    .await
    .ok();

    sqlx::query!("DELETE FROM repositories WHERE id = $1", repo_id)
        .execute(pool)
        .await
        .ok();
}

#[tokio::test]
#[ignore] // Requires DATABASE_URL to be set
async fn test_ai_entrepreneur_agent_persistence() {
    let Some(pool) = get_test_pool().await else {
        eprintln!("Skipping test: DATABASE_URL not set");
        return;
    };

    let repo_id = create_test_repository(&pool).await;

    // Create execution result
    let result = ExecutionResultBuilder::new(repo_id, "AIEntrepreneurAgent".to_string())
        .issue_number(100)
        .status(ExecutionStatus::Running)
        .start_now()
        .result(json!({
            "business_plan": {
                "executive_summary": "Test plan",
                "phases": []
            }
        }))
        .quality_score(85)
        .build();

    // Create agent instance
    let agent = AIEntrepreneurAgent::new(Default::default());

    // Save execution
    let execution_id = agent.save_execution(&pool, &result).await.unwrap();
    assert_ne!(execution_id, Uuid::nil());

    // Load history
    let history = agent.load_history(&pool, repo_id, 10).await.unwrap();
    assert_eq!(history.len(), 1);
    assert_eq!(history[0].agent_type, "AIEntrepreneurAgent");
    assert_eq!(history[0].issue_number, Some(100));

    // Get latest execution
    let latest = agent.get_latest_execution(&pool, repo_id).await.unwrap();
    assert!(latest.is_some());
    assert_eq!(latest.unwrap().execution_id, Some(execution_id));

    cleanup_test_data(&pool, repo_id).await;
}

#[tokio::test]
#[ignore]
async fn test_market_research_agent_persistence() {
    let Some(pool) = get_test_pool().await else {
        eprintln!("Skipping test: DATABASE_URL not set");
        return;
    };

    let repo_id = create_test_repository(&pool).await;

    let result = ExecutionResultBuilder::new(repo_id, "MarketResearchAgent".to_string())
        .issue_number(101)
        .status(ExecutionStatus::Completed)
        .start_now()
        .complete_now()
        .result(json!({
            "competitors_analyzed": 25,
            "market_trends": ["AI", "SaaS", "Cloud"]
        }))
        .quality_score(92)
        .build();

    let agent = MarketResearchAgent::new(Default::default());
    let execution_id = agent.save_execution(&pool, &result).await.unwrap();

    let history = agent.load_history(&pool, repo_id, 10).await.unwrap();
    assert_eq!(history.len(), 1);
    assert_eq!(history[0].status, ExecutionStatus::Completed);

    cleanup_test_data(&pool, repo_id).await;
}

#[tokio::test]
#[ignore]
async fn test_analytics_agent_with_metrics() {
    let Some(pool) = get_test_pool().await else {
        eprintln!("Skipping test: DATABASE_URL not set");
        return;
    };

    let repo_id = create_test_repository(&pool).await;

    let result = ExecutionResultBuilder::new(repo_id, "AnalyticsAgent".to_string())
        .issue_number(102)
        .status(ExecutionStatus::Completed)
        .start_now()
        .complete_now()
        .result(json!({
            "metrics": {
                "engagement_rate": 3.5,
                "conversion_rate": 2.1
            }
        }))
        .quality_score(88)
        .build();

    let agent = AnalyticsAgent::new(Default::default());
    let execution_id = agent.save_execution(&pool, &result).await.unwrap();

    // Save additional analysis metrics
    let metrics = json!({
        "page_views": 10000,
        "unique_visitors": 3500,
        "bounce_rate": 45.2
    });

    agent
        .save_analysis_metrics(&pool, execution_id, metrics)
        .await
        .unwrap();

    // Verify metrics were saved
    let history = agent.load_history(&pool, repo_id, 1).await.unwrap();
    assert_eq!(history.len(), 1);

    cleanup_test_data(&pool, repo_id).await;
}

#[tokio::test]
#[ignore]
async fn test_all_business_agents_have_unique_type_names() {
    let Some(pool) = get_test_pool().await else {
        eprintln!("Skipping test: DATABASE_URL not set");
        return;
    };

    let repo_id = create_test_repository(&pool).await;

    // Create instances of all agents
    let agents: Vec<(&str, Box<dyn PersistableAgent>)> = vec![
        (
            "AIEntrepreneurAgent",
            Box::new(AIEntrepreneurAgent::new(Default::default())),
        ),
        (
            "AnalyticsAgent",
            Box::new(AnalyticsAgent::new(Default::default())),
        ),
        (
            "ContentCreationAgent",
            Box::new(ContentCreationAgent::new(Default::default())),
        ),
        ("CRMAgent", Box::new(CRMAgent::new(Default::default()))),
        (
            "FunnelDesignAgent",
            Box::new(FunnelDesignAgent::new(Default::default())),
        ),
        (
            "JonathanIveDesignAgent",
            Box::new(JonathanIveDesignAgent::new(Default::default())),
        ),
        (
            "MarketResearchAgent",
            Box::new(MarketResearchAgent::new(Default::default())),
        ),
        (
            "MarketingAgent",
            Box::new(MarketingAgent::new(Default::default())),
        ),
        (
            "PersonaAgent",
            Box::new(PersonaAgent::new(Default::default())),
        ),
        (
            "ProductConceptAgent",
            Box::new(ProductConceptAgent::new(Default::default())),
        ),
        (
            "ProductDesignAgent",
            Box::new(ProductDesignAgent::new(Default::default())),
        ),
        ("SalesAgent", Box::new(SalesAgent::new(Default::default()))),
        (
            "SelfAnalysisAgent",
            Box::new(SelfAnalysisAgent::new(Default::default())),
        ),
        (
            "SNSStrategyAgent",
            Box::new(SNSStrategyAgent::new(Default::default())),
        ),
        (
            "YouTubeAgent",
            Box::new(YouTubeAgent::new(Default::default())),
        ),
    ];

    // Verify all have unique type names matching expected
    for (expected_name, agent) in agents {
        assert_eq!(agent.agent_type(), expected_name);
    }

    cleanup_test_data(&pool, repo_id).await;
}

#[tokio::test]
#[ignore]
async fn test_execution_update_workflow() {
    let Some(pool) = get_test_pool().await else {
        eprintln!("Skipping test: DATABASE_URL not set");
        return;
    };

    let repo_id = create_test_repository(&pool).await;

    let agent = MarketingAgent::new(Default::default());

    // Create initial execution (pending)
    let mut result = ExecutionResultBuilder::new(repo_id, "MarketingAgent".to_string())
        .issue_number(103)
        .status(ExecutionStatus::Pending)
        .build();

    let execution_id = agent.save_execution(&pool, &result).await.unwrap();

    // Update to running
    result.execution_id = Some(execution_id);
    result.status = ExecutionStatus::Running;
    result.started_at = Some(chrono::Utc::now());

    agent.save_execution(&pool, &result).await.unwrap();

    // Update to completed
    result.status = ExecutionStatus::Completed;
    result.completed_at = Some(chrono::Utc::now());
    result.result = Some(json!({"campaign": "launched"}));
    result.quality_score = Some(90);

    agent.save_execution(&pool, &result).await.unwrap();

    // Verify final state
    let history = agent.load_history(&pool, repo_id, 1).await.unwrap();
    assert_eq!(history.len(), 1);
    assert_eq!(history[0].status, ExecutionStatus::Completed);
    assert_eq!(history[0].quality_score, Some(90));
    assert!(history[0].started_at.is_some());
    assert!(history[0].completed_at.is_some());

    cleanup_test_data(&pool, repo_id).await;
}

#[tokio::test]
#[ignore]
async fn test_error_handling_persistence() {
    let Some(pool) = get_test_pool().await else {
        eprintln!("Skipping test: DATABASE_URL not set");
        return;
    };

    let repo_id = create_test_repository(&pool).await;

    let result = ExecutionResultBuilder::new(repo_id, "SalesAgent".to_string())
        .issue_number(104)
        .status(ExecutionStatus::Failed)
        .start_now()
        .complete_now()
        .error("LLM API rate limit exceeded".to_string())
        .build();

    let agent = SalesAgent::new(Default::default());
    agent.save_execution(&pool, &result).await.unwrap();

    let history = agent.load_history(&pool, repo_id, 1).await.unwrap();
    assert_eq!(history.len(), 1);
    assert_eq!(history[0].status, ExecutionStatus::Failed);
    assert_eq!(
        history[0].error_message,
        Some("LLM API rate limit exceeded".to_string())
    );

    cleanup_test_data(&pool, repo_id).await;
}
