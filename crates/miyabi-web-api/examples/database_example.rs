//! Database Usage Example
//!
//! Demonstrates how to use both PostgreSQL and DynamoDB in Miyabi.
//!
//! # Prerequisites
//!
//! 1. PostgreSQL running (local or RDS)
//! 2. DynamoDB (AWS or local)
//! 3. .env configured with credentials
//!
//! # Run
//!
//! ```bash
//! cargo run --example database_example
//! ```

use miyabi_web_api::database::{
    DatabaseContext, DatabaseConfig, DynamoDBConfig,
    create_pool, create_dynamodb_client, get_pool_stats,
    tables, helpers,
};
use aws_sdk_dynamodb::types::AttributeValue;
use std::collections::HashMap;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    tracing_subscriber::fmt::init();

    // Load environment variables
    dotenvy::dotenv().ok();

    println!("=== Miyabi Database Example ===\n");

    // =========================================================================
    // Example 1: PostgreSQL Connection Pool
    // =========================================================================

    println!("1. PostgreSQL Connection Pool");
    println!("   Creating pool from environment...");

    let pg_config = DatabaseConfig::from_env()?;
    println!("   Configuration:");
    println!("     - Max connections: {}", pg_config.max_connections);
    println!("     - Min connections: {}", pg_config.min_connections);
    println!("     - Connect timeout: {:?}", pg_config.connect_timeout);

    let pool = create_pool(pg_config).await?;
    println!("   ✅ Pool created successfully");

    // Query database
    println!("\n   Running sample query...");
    let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
        .fetch_one(&pool)
        .await?;
    println!("   User count: {}", row.0);

    // Check pool stats
    let stats = get_pool_stats(&pool);
    println!("   Pool stats:");
    println!("     - Total connections: {}", stats.size);
    println!("     - Idle connections: {}", stats.idle);
    println!("     - Active connections: {}", stats.active());
    println!("     - Health: {}", if stats.is_healthy(20) { "✅ Healthy" } else { "❌ Unhealthy" });

    // =========================================================================
    // Example 2: DynamoDB Client
    // =========================================================================

    println!("\n2. DynamoDB Client");
    println!("   Creating client from environment...");

    let dynamodb_config = DynamoDBConfig::from_env()?;
    println!("   Configuration:");
    println!("     - Region: {}", dynamodb_config.region);
    println!("     - Timeout: {:?}", dynamodb_config.timeout);
    println!("     - Max attempts: {}", dynamodb_config.max_attempts);

    let dynamodb_client = create_dynamodb_client(dynamodb_config).await?;
    println!("   ✅ Client created successfully");

    // List tables
    println!("\n   Listing DynamoDB tables...");
    let tables_result = dynamodb_client.list_tables().send().await?;
    let table_names = tables_result.table_names();
    println!("   Found {} tables:", table_names.len());
    for table in table_names {
        println!("     - {}", table);
    }

    // =========================================================================
    // Example 3: Write to DynamoDB (if tables exist)
    // =========================================================================

    if table_names.iter().any(|t| t == tables::EVENTS) {
        println!("\n3. Writing Event to DynamoDB");

        let mut item = HashMap::new();
        item.insert("PK".to_string(), helpers::to_s(format!("EVENT#agent_execution#{}", chrono::Utc::now().to_rfc3339())));
        item.insert("SK".to_string(), helpers::to_s("user#test-user#repo#test-repo"));
        item.insert("event_type".to_string(), helpers::to_s("agent_execution"));
        item.insert("user_id".to_string(), helpers::to_s("test-user"));
        item.insert("repository_id".to_string(), helpers::to_s("test-repo"));
        item.insert("timestamp".to_string(), helpers::to_n(chrono::Utc::now().timestamp_millis()));

        let mut data = HashMap::new();
        data.insert("agent_type".to_string(), helpers::to_s("Coordinator"));
        data.insert("status".to_string(), helpers::to_s("completed"));
        item.insert("data".to_string(), helpers::to_m(data));

        // TTL: 90 days from now
        let ttl = chrono::Utc::now().timestamp() + (90 * 24 * 60 * 60);
        item.insert("ttl".to_string(), helpers::to_n(ttl));

        dynamodb_client
            .put_item()
            .table_name(tables::EVENTS)
            .set_item(Some(item))
            .send()
            .await?;

        println!("   ✅ Event written successfully");
    } else {
        println!("\n3. Skipping DynamoDB write (table not found)");
        println!("   Run setup script to create tables:");
        println!("   aws dynamodb create-table --table-name {} ...", tables::EVENTS);
    }

    // =========================================================================
    // Example 4: Combined Database Context
    // =========================================================================

    println!("\n4. Combined Database Context");
    println!("   Creating unified context...");

    let ctx = DatabaseContext::from_env().await?;
    println!("   ✅ Context created successfully");

    // Health check
    println!("\n   Running health check...");
    let health = ctx.health_check().await?;
    println!("   Status: {}", health.message());
    println!("   PostgreSQL: {}", if health.postgresql { "✅ Healthy" } else { "❌ Unhealthy" });
    println!("   DynamoDB: {}", if health.dynamodb { "✅ Healthy" } else { "❌ Unhealthy" });

    if health.is_healthy() {
        println!("\n   ✅ All databases are operational!");
    } else {
        println!("\n   ⚠️  Some databases are not healthy");
    }

    // =========================================================================
    // Example 5: Advanced PostgreSQL Query
    // =========================================================================

    println!("\n5. Advanced PostgreSQL Query (JOIN)");

    let rows: Vec<(String, i64)> = sqlx::query_as(
        r#"
        SELECT
            u.email,
            COUNT(s.id) as subscription_count
        FROM users u
        LEFT JOIN subscriptions s ON s.user_id = u.id
        GROUP BY u.email
        ORDER BY subscription_count DESC
        LIMIT 5
        "#
    )
    .fetch_all(ctx.pg())
    .await?;

    println!("   Top users by subscriptions:");
    for (email, count) in rows {
        println!("     - {}: {} subscriptions", email, count);
    }

    // =========================================================================
    // Summary
    // =========================================================================

    println!("\n=== Example Complete ===");
    println!("\nKey Takeaways:");
    println!("  1. Use DatabaseConfig::from_env() for PostgreSQL");
    println!("  2. Use DynamoDBConfig::from_env() for DynamoDB");
    println!("  3. Use DatabaseContext for unified access");
    println!("  4. Always check health with health_check()");
    println!("  5. Use pool stats to monitor connection usage");
    println!("\nFor more details, see:");
    println!("  - docs/DATABASE_DESIGN.md");
    println!("  - docs/DATABASE_SETUP_GUIDE.md");

    Ok(())
}
