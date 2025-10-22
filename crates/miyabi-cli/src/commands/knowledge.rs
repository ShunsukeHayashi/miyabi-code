//! Knowledge management commands

use crate::error::Result;
use clap::Subcommand;
use colored::Colorize;
use miyabi_knowledge::{
    searcher::{KnowledgeSearcher, QdrantSearcher, SearchFilter},
    KnowledgeConfig,
};

#[derive(Subcommand)]
pub enum KnowledgeCommand {
    /// Search knowledge base
    Search {
        /// Search query
        query: String,

        /// Workspace filter
        #[arg(long)]
        workspace: Option<String>,

        /// Agent filter
        #[arg(long)]
        agent: Option<String>,

        /// Issue number filter
        #[arg(long)]
        issue: Option<u32>,

        /// Task type filter
        #[arg(long)]
        task_type: Option<String>,

        /// Outcome filter (success/failed)
        #[arg(long)]
        outcome: Option<String>,

        /// Maximum results
        #[arg(long, default_value = "10")]
        limit: usize,
    },

    /// Show knowledge statistics
    Stats {
        /// Workspace filter
        #[arg(long)]
        workspace: Option<String>,
    },

    /// Index logs and artifacts
    Index {
        /// Workspace to index
        workspace: String,

        /// Re-index existing entries
        #[arg(long)]
        reindex: bool,
    },

    /// Manage knowledge configuration
    Config {
        /// Enable/disable auto-indexing
        #[arg(long)]
        auto_index: Option<bool>,

        /// Set delay seconds before auto-indexing
        #[arg(long)]
        delay_seconds: Option<u64>,

        /// Set retry count for failed indexing
        #[arg(long)]
        retry_count: Option<u32>,

        /// Show current configuration
        #[arg(long)]
        show: bool,

        /// Configuration file path
        #[arg(long, default_value = "~/.config/miyabi/knowledge.json")]
        config_path: String,
    },
}

impl KnowledgeCommand {
    pub async fn execute(&self, json_output: bool) -> Result<()> {
        match self {
            Self::Search {
                query,
                workspace,
                agent,
                issue,
                task_type,
                outcome,
                limit,
            } => {
                search_knowledge(
                    query,
                    workspace.clone(),
                    agent.clone(),
                    *issue,
                    task_type.clone(),
                    outcome.clone(),
                    *limit,
                    json_output,
                )
                .await
            }
            Self::Stats { workspace } => show_stats(workspace.clone(), json_output).await,
            Self::Index { workspace, reindex } => {
                index_workspace(workspace, *reindex, json_output).await
            }
            Self::Config {
                auto_index,
                delay_seconds,
                retry_count,
                show,
                config_path,
            } => {
                manage_config(
                    *auto_index,
                    *delay_seconds,
                    *retry_count,
                    *show,
                    config_path,
                    json_output,
                )
                .await
            }
        }
    }
}

async fn search_knowledge(
    query: &str,
    workspace: Option<String>,
    agent: Option<String>,
    issue: Option<u32>,
    task_type: Option<String>,
    outcome: Option<String>,
    limit: usize,
    json_output: bool,
) -> Result<()> {
    // Load config
    let config = KnowledgeConfig::default();

    // Initialize searcher
    let searcher = QdrantSearcher::new(config).await?;

    // Build filter
    let mut filter = SearchFilter::new();
    if let Some(w) = workspace {
        filter = filter.with_workspace(w);
    }
    if let Some(a) = agent {
        filter = filter.with_agent(a);
    }
    if let Some(i) = issue {
        filter = filter.with_issue_number(i);
    }
    if let Some(t) = task_type {
        filter = filter.with_task_type(t);
    }
    if let Some(o) = outcome {
        filter = filter.with_outcome(o);
    }

    // Search
    println!("{}", "🔍 Searching knowledge base...".cyan());
    let results = searcher.search_filtered(query, filter).await?;

    if json_output {
        // JSON output for AI agents
        let json = serde_json::json!({
            "query": query,
            "results_count": results.len(),
            "results": results.iter().take(limit).map(|r| {
                serde_json::json!({
                    "id": r.id.to_string(),
                    "score": r.score,
                    "content": r.content,
                    "metadata": r.metadata,
                    "timestamp": r.timestamp,
                })
            }).collect::<Vec<_>>()
        });
        println!("{}", serde_json::to_string_pretty(&json)?);
    } else {
        // Human-readable output
        if results.is_empty() {
            println!("{}", "No results found.".yellow());
            return Ok(());
        }

        println!("\n{} {} results found:", "✅".green(), results.len());
        println!("{}", "─".repeat(80).dimmed());

        for (i, result) in results.iter().take(limit).enumerate() {
            println!(
                "\n{} {} (score: {:.2})",
                "📄".cyan(),
                format!("Result {}", i + 1).bold(),
                result.score
            );
            println!("  ID: {}", result.id.to_string().dimmed());
            println!("  Workspace: {}", result.metadata.workspace.cyan());

            if let Some(ref agent) = result.metadata.agent {
                println!("  Agent: {}", agent.yellow());
            }

            if let Some(issue) = result.metadata.issue_number {
                println!("  Issue: #{}", issue);
            }

            if let Some(ref task_type) = result.metadata.task_type {
                println!("  Task Type: {}", task_type.green());
            }

            if let Some(ref outcome) = result.metadata.outcome {
                let outcome_colored = if outcome == "success" {
                    outcome.green()
                } else {
                    outcome.red()
                };
                println!("  Outcome: {}", outcome_colored);
            }

            println!(
                "  Timestamp: {}",
                result
                    .timestamp
                    .format("%Y-%m-%d %H:%M:%S")
                    .to_string()
                    .dimmed()
            );

            // Content preview
            let preview = if result.content.len() > 200 {
                format!("{}...", &result.content[..200])
            } else {
                result.content.clone()
            };
            println!("\n  {}\n  {}\n", "Content:".bold(), preview.dimmed());
            println!("{}", "─".repeat(80).dimmed());
        }

        if results.len() > limit {
            println!(
                "\n{} Showing {} of {} results. Use --limit to see more.",
                "ℹ️".blue(),
                limit,
                results.len()
            );
        }
    }

    Ok(())
}

async fn show_stats(workspace: Option<String>, json_output: bool) -> Result<()> {
    // Load config
    let config = KnowledgeConfig::default();

    // Initialize Qdrant client
    let client = miyabi_knowledge::qdrant::QdrantClient::new(config.clone()).await?;

    // Get collection info
    let info = client.collection_info().await?;

    if json_output {
        let json = serde_json::json!({
            "collection_name": config.vector_db.collection,
            "points_count": info.points_count,
            "vectors_count": info.vectors_count,
        });
        println!("{}", serde_json::to_string_pretty(&json)?);
    } else {
        println!("\n{} Knowledge Base Statistics", "📊".cyan());
        println!("{}", "─".repeat(80).dimmed());

        println!("Collection: {}", config.vector_db.collection.bold());

        if let Some(count) = info.points_count {
            println!("Total Entries: {}", count.to_string().cyan());
        }

        if let Some(count) = info.vectors_count {
            println!("Total Vectors: {}", count.to_string().cyan());
        }

        if let Some(ref workspace_filter) = workspace {
            println!("Workspace Filter: {}", workspace_filter.yellow());
        }

        println!("{}", "─".repeat(80).dimmed());
    }

    Ok(())
}

async fn index_workspace(workspace: &str, reindex: bool, json_output: bool) -> Result<()> {
    // Load config
    let mut config = KnowledgeConfig::default();
    config.workspace.name = workspace.to_string();

    // Initialize knowledge manager
    let manager = miyabi_knowledge::KnowledgeManager::new(config).await?;

    println!("{} Indexing workspace: {}", "⚙️".cyan(), workspace.bold());

    if reindex {
        println!("{}", "Re-indexing existing entries...".yellow());
    }

    // Index workspace
    let stats = manager.index_workspace(workspace).await?;

    if json_output {
        let json = serde_json::json!({
            "workspace": workspace,
            "stats": {
                "total": stats.total,
                "success": stats.success,
                "failed": stats.failed,
                "duration_secs": stats.duration_secs,
            }
        });
        println!("{}", serde_json::to_string_pretty(&json)?);
    } else {
        println!("\n{} Indexing complete!", "✅".green());
        println!("  Total: {}", stats.total);
        println!("  Success: {}", stats.success.to_string().green());
        println!("  Failed: {}", stats.failed.to_string().red());
        println!("  Duration: {:.2}s", stats.duration_secs);
    }

    Ok(())
}

async fn manage_config(
    auto_index: Option<bool>,
    delay_seconds: Option<u64>,
    retry_count: Option<u32>,
    show: bool,
    config_path: &str,
    json_output: bool,
) -> Result<()> {
    use std::path::Path;

    // Expand ~ to home directory
    let expanded_path = if config_path.starts_with("~/") {
        if let Some(home) = std::env::var_os("HOME") {
            Path::new(&home)
                .join(config_path.strip_prefix("~/").unwrap())
                .to_string_lossy()
                .to_string()
        } else {
            config_path.to_string()
        }
    } else {
        config_path.to_string()
    };

    // Load or create default config
    let mut config = if Path::new(&expanded_path).exists() {
        KnowledgeConfig::from_file(&expanded_path)?
    } else {
        KnowledgeConfig::default()
    };

    // Show configuration if requested
    if show {
        if json_output {
            println!("{}", serde_json::to_string_pretty(&config)?);
        } else {
            println!("\n{} Knowledge Configuration", "⚙️".cyan());
            println!("{}", "─".repeat(80).dimmed());
            println!("Config Path: {}", expanded_path.bold());
            println!("\n{}", "Auto-Indexing:".bold());
            println!(
                "  Enabled: {}",
                if config.auto_index.enabled {
                    "✅ Yes".green()
                } else {
                    "❌ No".red()
                }
            );
            println!(
                "  Delay: {} seconds",
                config.auto_index.delay_seconds.to_string().cyan()
            );
            println!(
                "  Retry Count: {}",
                config.auto_index.retry_count.to_string().cyan()
            );
            println!("\n{}", "Vector DB:".bold());
            println!("  Type: {}", config.vector_db.db_type);
            println!("  Host: {}", config.vector_db.host);
            println!("  Port: {}", config.vector_db.port);
            println!("  Collection: {}", config.vector_db.collection);
            println!("\n{}", "Embeddings:".bold());
            println!("  Provider: {}", config.embeddings.provider);
            println!("  Model: {}", config.embeddings.model);
            println!("  Dimension: {}", config.embeddings.dimension);
            println!("{}", "─".repeat(80).dimmed());
        }
        return Ok(());
    }

    // Update configuration
    let mut updated = false;

    if let Some(enabled) = auto_index {
        config.auto_index.enabled = enabled;
        updated = true;
        if !json_output {
            println!(
                "{} Auto-indexing {}",
                "✅".green(),
                if enabled { "enabled" } else { "disabled" }
            );
        }
    }

    if let Some(delay) = delay_seconds {
        config.auto_index.delay_seconds = delay;
        updated = true;
        if !json_output {
            println!("{} Delay set to {} seconds", "✅".green(), delay);
        }
    }

    if let Some(retry) = retry_count {
        config.auto_index.retry_count = retry;
        updated = true;
        if !json_output {
            println!("{} Retry count set to {}", "✅".green(), retry);
        }
    }

    // Save configuration if updated
    if updated {
        // Create directory if it doesn't exist
        if let Some(parent) = Path::new(&expanded_path).parent() {
            std::fs::create_dir_all(parent)?;
        }

        config.save(&expanded_path)?;

        if json_output {
            let json = serde_json::json!({
                "status": "success",
                "message": "Configuration updated",
                "config_path": expanded_path,
                "config": config,
            });
            println!("{}", serde_json::to_string_pretty(&json)?);
        } else {
            println!(
                "\n{} Configuration saved to: {}",
                "💾".green(),
                expanded_path.bold()
            );
        }
    } else if !json_output {
        println!(
            "{}",
            "ℹ️  No changes made. Use --show to view current configuration.".yellow()
        );
    }

    Ok(())
}
