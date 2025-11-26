# Business Agent Persistence Guide

## Overview

This document describes how business agents persist their execution results to PostgreSQL database.

## Features

### 1. Agent Execution Tracking

All 15 business agents implement the `PersistableAgent` trait, which provides:

- **Execution state persistence**: Save agent execution status (pending, running, completed, failed)
- **Execution history**: Query past executions for analysis
- **Result storage**: Store structured execution results as JSONB
- **Quality metrics**: Track quality scores and performance metrics
- **Error logging**: Detailed error messages for failed executions

### 2. Database Schema

#### Core Table: `agent_executions`

```sql
CREATE TABLE agent_executions (
    id UUID PRIMARY KEY,
    repository_id UUID REFERENCES repositories(id),
    user_id UUID REFERENCES users(id),
    agent_type VARCHAR(50) NOT NULL,
    issue_number INTEGER,
    status VARCHAR(20) NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    result JSONB,
    quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
    pr_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Analytics Table: `business_agent_analytics`

```sql
CREATE TABLE business_agent_analytics (
    id UUID PRIMARY KEY,
    execution_id UUID REFERENCES agent_executions(id),
    agent_type VARCHAR(50) NOT NULL,
    metrics JSONB NOT NULL,

    -- Market research specific
    competitors_analyzed INTEGER,
    market_size_usd BIGINT,
    growth_rate_percent DECIMAL(5,2),

    -- Sales/Marketing specific
    conversion_rate DECIMAL(5,2),
    target_audience_size INTEGER,
    estimated_revenue_usd BIGINT,

    -- Content/Analytics specific
    engagement_score INTEGER,
    reach_estimate INTEGER,
    roi_percent DECIMAL(7,2),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Execution Logs: `agent_execution_logs`

```sql
CREATE TABLE agent_execution_logs (
    id UUID PRIMARY KEY,
    execution_id UUID REFERENCES agent_executions(id),
    log_level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Usage

### 1. Basic Execution Persistence

```rust
use miyabi_agent_business::{
    AIEntrepreneurAgent,
    ExecutionResultBuilder,
    ExecutionStatus,
    PersistableAgent,
};
use sqlx::PgPool;
use uuid::Uuid;

async fn save_agent_execution(pool: &PgPool, repo_id: Uuid) -> Result<Uuid, Box<dyn std::error::Error>> {
    // Create agent instance
    let agent = AIEntrepreneurAgent::new(Default::default());

    // Build execution result
    let result = ExecutionResultBuilder::new(repo_id, "AIEntrepreneurAgent".to_string())
        .issue_number(123)
        .status(ExecutionStatus::Running)
        .start_now()
        .result(serde_json::json!({
            "business_plan": {
                "phases": 8,
                "total_budget": 500000
            }
        }))
        .quality_score(95)
        .build();

    // Save to database
    let execution_id = agent.save_execution(pool, &result).await?;

    Ok(execution_id)
}
```

### 2. Update Execution Status

```rust
async fn update_execution(
    pool: &PgPool,
    execution_id: Uuid,
    repo_id: Uuid
) -> Result<(), Box<dyn std::error::Error>> {
    let agent = MarketingAgent::new(Default::default());

    // Load existing execution or create new one with ID
    let mut result = ExecutionResultBuilder::new(repo_id, "MarketingAgent".to_string())
        .status(ExecutionStatus::Completed)
        .complete_now()
        .result(serde_json::json!({"campaigns_launched": 3}))
        .quality_score(88)
        .build();

    result.execution_id = Some(execution_id);

    // Update will be performed automatically
    agent.save_execution(pool, &result).await?;

    Ok(())
}
```

### 3. Query Execution History

```rust
async fn get_agent_history(
    pool: &PgPool,
    repo_id: Uuid
) -> Result<(), Box<dyn std::error::Error>> {
    let agent = MarketResearchAgent::new(Default::default());

    // Get last 10 executions
    let history = agent.load_history(pool, repo_id, 10).await?;

    for execution in history {
        println!("Execution {}: {:?}", execution.execution_id.unwrap(), execution.status);
        println!("  Quality Score: {:?}", execution.quality_score);
        println!("  Duration: {:?}",
            execution.completed_at.unwrap() - execution.started_at.unwrap()
        );
    }

    Ok(())
}
```

### 4. Get Latest Execution

```rust
async fn get_latest(
    pool: &PgPool,
    repo_id: Uuid
) -> Result<(), Box<dyn std::error::Error>> {
    let agent = AnalyticsAgent::new(Default::default());

    if let Some(latest) = agent.get_latest_execution(pool, repo_id).await? {
        println!("Latest execution status: {:?}", latest.status);
        println!("Result: {}", serde_json::to_string_pretty(&latest.result)?);
    } else {
        println!("No executions found");
    }

    Ok(())
}
```

### 5. Save Analysis Metrics

```rust
async fn save_metrics(
    pool: &PgPool,
    execution_id: Uuid
) -> Result<(), Box<dyn std::error::Error>> {
    let agent = MarketResearchAgent::new(Default::default());

    let metrics = serde_json::json!({
        "competitors_analyzed": 25,
        "market_size_usd": 5000000000,
        "growth_rate_percent": 12.5,
        "top_competitors": ["Company A", "Company B", "Company C"]
    });

    agent.save_analysis_metrics(pool, execution_id, metrics).await?;

    Ok(())
}
```

## Supported Agents

All 15 business agents implement `PersistableAgent`:

### Strategy Agents (6)
1. **AIEntrepreneurAgent** - Comprehensive business plan generation
2. **SelfAnalysisAgent** - Career and skill analysis
3. **PersonaAgent** - Target customer persona creation
4. **ProductConceptAgent** - Product concept design
5. **ProductDesignAgent** - Service detail design
6. **FunnelDesignAgent** - Customer funnel optimization

### Marketing Agents (5)
7. **MarketResearchAgent** - Market trend analysis
8. **ContentCreationAgent** - Content production planning
9. **SNSStrategyAgent** - Social media strategy
10. **MarketingAgent** - Marketing strategy formulation
11. **YouTubeAgent** - YouTube channel optimization

### Operations Agents (3)
12. **SalesAgent** - Sales process optimization
13. **CRMAgent** - Customer relationship management
14. **AnalyticsAgent** - Data analysis and PDCA cycle

### Design Agents (1)
15. **JonathanIveDesignAgent** - UI/UX design review

## Error Handling

```rust
async fn handle_failed_execution(
    pool: &PgPool,
    repo_id: Uuid,
    error: String
) -> Result<Uuid, Box<dyn std::error::Error>> {
    let agent = ContentCreationAgent::new(Default::default());

    let result = ExecutionResultBuilder::new(repo_id, "ContentCreationAgent".to_string())
        .issue_number(456)
        .status(ExecutionStatus::Failed)
        .start_now()
        .complete_now()
        .error(error)
        .build();

    let execution_id = agent.save_execution(pool, &result).await?;

    Ok(execution_id)
}
```

## Database Views

### v_business_agent_summary

Convenient view for querying agent execution summaries:

```sql
SELECT
    execution_id,
    repository_id,
    agent_type,
    status,
    quality_score,
    competitors_analyzed,
    market_size_usd,
    conversion_rate,
    engagement_score,
    log_count,
    error_count
FROM v_business_agent_summary
WHERE repository_id = '...'
ORDER BY started_at DESC;
```

## Migration

Run migrations to set up the database schema:

```bash
sqlx migrate run --database-url "postgres://user:pass@localhost/miyabi"
```

Migration file: `crates/miyabi-web-api/migrations/20251126000000_business_agent_persistence.sql`

## Testing

Integration tests are available but require a running PostgreSQL instance:

```bash
# Set database URL
export DATABASE_URL="postgres://user:pass@localhost/miyabi_test"

# Run tests
cargo test -p miyabi-agent-business --test persistence_integration -- --ignored
```

## Performance Considerations

1. **Indexes**: All key columns have indexes for fast queries
2. **JSONB**: Result data is stored as JSONB for flexible querying
3. **Partitioning**: For high-volume deployments, consider partitioning by date
4. **Archiving**: Implement archiving strategy for old executions

## Best Practices

1. Always set `started_at` when execution begins
2. Set `completed_at` when execution finishes (success or failure)
3. Include meaningful `quality_score` for analytics
4. Store structured data in `result` field for easy querying
5. Use `error_message` for debugging failed executions
6. Link executions to GitHub issues via `issue_number`
7. Track PR creation via `pr_number`

## Troubleshooting

### Connection Issues

```rust
// Check pool health
match sqlx::query("SELECT 1").fetch_one(&pool).await {
    Ok(_) => println!("Database connection OK"),
    Err(e) => eprintln!("Database connection failed: {}", e),
}
```

### Query Performance

```sql
-- Check slow queries
EXPLAIN ANALYZE
SELECT * FROM agent_executions
WHERE repository_id = '...'
AND agent_type = 'MarketResearchAgent';

-- Verify indexes are being used
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE tablename = 'agent_executions';
```

## Future Enhancements

- [ ] Real-time execution monitoring via WebSocket
- [ ] Execution replay for debugging
- [ ] Advanced analytics dashboards
- [ ] Automated reporting
- [ ] Performance trend analysis
