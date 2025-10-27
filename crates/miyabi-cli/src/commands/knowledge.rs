//! Knowledge management commands

use crate::error::Result;
use clap::Subcommand;
use colored::Colorize;
use miyabi_knowledge::{
    searcher::{KnowledgeSearcher, QdrantSearcher, SearchFilter},
    ExportFilter, ExportFormat, IndexCache, KnowledgeConfig, KnowledgeExporter,
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

    /// Clear index cache (force re-indexing)
    ClearCache {
        /// Workspace to clear (all if not specified)
        workspace: Option<String>,

        /// Skip confirmation prompt
        #[arg(long)]
        yes: bool,
    },

    /// Start Web UI dashboard server
    Serve {
        /// Port to listen on
        #[arg(long, default_value = "8080")]
        port: u16,

        /// Open browser automatically
        #[arg(long)]
        open: bool,
    },

    /// Export knowledge base to file
    Export {
        /// Export format (csv, json, markdown/md)
        #[arg(long, default_value = "json")]
        format: String,

        /// Output file path
        #[arg(long)]
        output: String,

        /// Filter by agent name
        #[arg(long)]
        agent: Option<String>,

        /// Filter by issue number
        #[arg(long)]
        issue: Option<u32>,

        /// Filter by task type
        #[arg(long)]
        task_type: Option<String>,

        /// Filter by outcome (success/failed)
        #[arg(long)]
        outcome: Option<String>,

        /// Filter by workspace
        #[arg(long)]
        workspace: Option<String>,

        /// Date range start (YYYY-MM-DD)
        #[arg(long)]
        date_from: Option<String>,

        /// Date range end (YYYY-MM-DD)
        #[arg(long)]
        date_to: Option<String>,

        /// Maximum number of entries to export (0 = unlimited)
        #[arg(long, default_value = "0")]
        limit: usize,
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
            Self::ClearCache { workspace, yes } => {
                clear_cache(workspace.clone(), *yes, json_output).await
            }
            Self::Serve { port, open } => serve_dashboard(*port, *open, json_output).await,
            Self::Export {
                format,
                output,
                agent,
                issue,
                task_type,
                outcome,
                workspace,
                date_from,
                date_to,
                limit,
            } => {
                export_knowledge(
                    format,
                    output,
                    agent.clone(),
                    *issue,
                    task_type.clone(),
                    outcome.clone(),
                    workspace.clone(),
                    date_from.clone(),
                    date_to.clone(),
                    *limit,
                    json_output,
                )
                .await
            }
        }
    }
}

#[allow(clippy::too_many_arguments)]
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

async fn clear_cache(
    workspace: Option<String>,
    skip_confirmation: bool,
    json_output: bool,
) -> Result<()> {
    // 確認プロンプト
    if !skip_confirmation && !json_output {
        let workspace_desc = workspace
            .as_ref()
            .map(|w| format!("workspace '{}'", w))
            .unwrap_or_else(|| "all workspaces".to_string());

        println!(
            "{} This will delete index cache for {}",
            "⚠️".yellow(),
            workspace_desc.bold()
        );
        print!("Are you sure? (y/N): ");
        use std::io::{self, Write};
        io::stdout().flush()?;

        let mut input = String::new();
        io::stdin().read_line(&mut input)?;

        if !input.trim().eq_ignore_ascii_case("y") {
            println!("{}", "❌ Cancelled".red());
            return Ok(());
        }
    }

    // キャッシュ削除
    let deleted_count = IndexCache::delete_cache(workspace.as_deref())?;

    if json_output {
        let json = serde_json::json!({
            "status": "success",
            "deleted_count": deleted_count,
            "workspace": workspace,
        });
        println!("{}", serde_json::to_string_pretty(&json)?);
    } else if deleted_count > 0 {
        let workspace_desc = workspace
            .as_ref()
            .map(|w| format!("for workspace '{}'", w))
            .unwrap_or_else(|| "for all workspaces".to_string());

        println!(
            "{} Deleted {} cache file{} {}",
            "✅".green(),
            deleted_count,
            if deleted_count == 1 { "" } else { "s" },
            workspace_desc
        );
        println!(
            "{} Next indexing will be a full rebuild (slower)",
            "ℹ️".cyan()
        );
    } else {
        println!("{} No cache files found", "ℹ️".cyan());
    }

    Ok(())
}

#[allow(clippy::too_many_arguments)]
async fn export_knowledge(
    format: &str,
    output: &str,
    agent: Option<String>,
    issue: Option<u32>,
    task_type: Option<String>,
    outcome: Option<String>,
    workspace: Option<String>,
    date_from: Option<String>,
    date_to: Option<String>,
    limit: usize,
    json_output: bool,
) -> Result<()> {
    // Parse export format
    let export_format: ExportFormat = format.parse().map_err(|e: String| {
        crate::error::CliError::InvalidInput(format!("Invalid export format: {}", e))
    })?;

    // Parse date filters
    let date_from_parsed = if let Some(ref date_str) = date_from {
        Some(parse_date(date_str)?)
    } else {
        None
    };

    let date_to_parsed = if let Some(ref date_str) = date_to {
        Some(parse_date(date_str)?)
    } else {
        None
    };

    // Build export filter
    let filter = ExportFilter {
        agent,
        issue_number: issue,
        task_type,
        outcome,
        workspace,
        date_from: date_from_parsed,
        date_to: date_to_parsed,
        limit,
    };

    if !json_output {
        println!("{} Exporting knowledge base...", "📦".cyan());
        println!("  Format: {}", format.cyan().bold());
        println!("  Output: {}", output.yellow());

        if let Some(ref a) = filter.agent {
            println!("  Filter - Agent: {}", a.cyan());
        }
        if let Some(i) = filter.issue_number {
            println!("  Filter - Issue: #{}", i);
        }
        if let Some(ref t) = filter.task_type {
            println!("  Filter - Task Type: {}", t.cyan());
        }
        if let Some(ref o) = filter.outcome {
            println!("  Filter - Outcome: {}", o.cyan());
        }
        if let Some(ref w) = filter.workspace {
            println!("  Filter - Workspace: {}", w.cyan());
        }
        if filter.date_from.is_some() || filter.date_to.is_some() {
            println!(
                "  Filter - Date Range: {} to {}",
                date_from.as_ref().unwrap_or(&"*".to_string()),
                date_to.as_ref().unwrap_or(&"*".to_string())
            );
        }
        if filter.limit > 0 {
            println!("  Limit: {} entries", filter.limit);
        }
        println!();
    }

    // Load config
    let config = KnowledgeConfig::default();

    // Initialize searcher
    let searcher = QdrantSearcher::new(config).await?;

    // Create exporter
    let exporter = KnowledgeExporter::new(searcher);

    // Export to file
    let count = exporter.export(export_format, output, Some(filter)).await?;

    if json_output {
        let json = serde_json::json!({
            "status": "success",
            "format": format,
            "output": output,
            "entries_exported": count,
        });
        println!("{}", serde_json::to_string_pretty(&json)?);
    } else {
        println!("{} Export complete!", "✅".green());
        println!("  {} entries exported to {}", count, output.bold());
        println!();

        // Show format-specific tips
        match export_format {
            ExportFormat::Csv => {
                println!("  {} Open with Excel or run:", "💡".cyan());
                println!("    csvlook {}", output.dimmed());
            }
            ExportFormat::Json => {
                println!("  {} Parse with jq:", "💡".cyan());
                println!("    cat {} | jq '.[] | .content'", output.dimmed());
            }
            ExportFormat::Markdown => {
                println!("  {} View with:", "💡".cyan());
                println!("    cat {}", output.dimmed());
            }
        }
    }

    Ok(())
}

/// Parse date string in YYYY-MM-DD format
fn parse_date(date_str: &str) -> Result<chrono::DateTime<chrono::Utc>> {
    use chrono::NaiveDate;

    let naive_date = NaiveDate::parse_from_str(date_str, "%Y-%m-%d").map_err(|e| {
        crate::error::CliError::InvalidInput(format!(
            "Invalid date format '{}' (expected YYYY-MM-DD): {}",
            date_str, e
        ))
    })?;

    let naive_datetime = naive_date.and_hms_opt(0, 0, 0).ok_or_else(|| {
        crate::error::CliError::InvalidInput(format!("Invalid date: {}", date_str))
    })?;

    Ok(chrono::DateTime::from_naive_utc_and_offset(
        naive_datetime,
        chrono::Utc,
    ))
}

#[cfg(feature = "server")]
async fn serve_dashboard(port: u16, open: bool, json_output: bool) -> Result<()> {
    use miyabi_knowledge::server::KnowledgeServer;

    // Load config
    let config = KnowledgeConfig::default();

    if !json_output {
        println!("{}", "🚀 Starting Knowledge Dashboard...".cyan());
        println!("   Port: {}", port.to_string().bold());
        println!("   URL: {}", format!("http://localhost:{}", port).cyan());
        println!();
        println!("{}", "   Press Ctrl+C to stop".dimmed());
        println!();
    }

    // Open browser if requested
    if open {
        let url = format!("http://localhost:{}", port);
        if !json_output {
            println!("{} Opening browser: {}", "🌐".cyan(), url.bold());
        }
        if let Err(e) = open::that(&url) {
            if !json_output {
                println!("{} Failed to open browser: {}", "⚠️".yellow(), e);
            }
        }
    }

    // Initialize and start server
    let server = KnowledgeServer::new(config).await?;
    server.serve(port).await?;

    Ok(())
}

#[cfg(not(feature = "server"))]
async fn serve_dashboard(_port: u16, _open: bool, json_output: bool) -> Result<()> {
    if json_output {
        let json = serde_json::json!({
            "error": "Server feature not enabled",
            "message": "Please rebuild with --features server to enable the Web UI dashboard"
        });
        println!("{}", serde_json::to_string_pretty(&json)?);
    } else {
        println!("{}", "❌ Server feature not enabled".red());
        println!();
        println!("The Web UI dashboard requires the 'server' feature to be enabled.");
        println!("Please rebuild with:");
        println!();
        println!("  {}", "cargo build --release --features server".cyan());
        println!();
    }
    Ok(())
}
