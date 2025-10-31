// Agent Configuration Management CLI Commands
// miyabi agent list/config/edit

use anyhow::{Context, Result};
use clap::{Args, Subcommand};
use colored::Colorize;
use miyabi_core::{AgentConfig, AgentConfigManager};
use std::process::Command as ProcessCommand;

/// Agent configuration management
#[derive(Debug, Args)]
pub struct AgentConfigArgs {
    #[command(subcommand)]
    pub command: AgentConfigSubcommand,
}

#[derive(Debug, Subcommand)]
pub enum AgentConfigSubcommand {
    /// List all available agents
    List {
        /// Output as JSON
        #[arg(long)]
        json: bool,

        /// Show only enabled agents
        #[arg(long)]
        enabled: bool,

        /// Filter by agent type
        #[arg(long)]
        agent_type: Option<String>,
    },

    /// Show agent configuration
    Config {
        /// Agent name (e.g., "CoordinatorAgent")
        agent_name: String,

        /// Output as JSON
        #[arg(long)]
        json: bool,
    },

    /// Edit agent configuration
    Edit {
        /// Agent name (e.g., "CoordinatorAgent")
        agent_name: String,

        /// Editor to use (default: $EDITOR or vi)
        #[arg(long)]
        editor: Option<String>,
    },

    /// Create custom agent configuration
    Create {
        /// Agent name
        agent_name: String,

        /// Agent type
        #[arg(long)]
        agent_type: String,

        /// Description
        #[arg(long)]
        description: String,
    },

    /// Validate agent configuration
    Validate {
        /// Agent name
        agent_name: String,
    },

    /// Delete agent configuration
    Delete {
        /// Agent name
        agent_name: String,

        /// Skip confirmation prompt
        #[arg(long)]
        yes: bool,
    },
}

pub async fn execute(args: AgentConfigArgs) -> Result<()> {
    let manager = AgentConfigManager::new()
        .context("Failed to initialize agent config manager")?;

    match args.command {
        AgentConfigSubcommand::List {
            json,
            enabled,
            agent_type,
        } => list_agents(&manager, json, enabled, agent_type).await,
        AgentConfigSubcommand::Config { agent_name, json } => {
            show_config(&manager, &agent_name, json).await
        }
        AgentConfigSubcommand::Edit {
            agent_name,
            editor,
        } => edit_config(&manager, &agent_name, editor).await,
        AgentConfigSubcommand::Create {
            agent_name,
            agent_type,
            description,
        } => create_agent(&manager, &agent_name, &agent_type, &description).await,
        AgentConfigSubcommand::Validate { agent_name } => {
            validate_config(&manager, &agent_name).await
        }
        AgentConfigSubcommand::Delete { agent_name, yes } => {
            delete_config(&manager, &agent_name, yes).await
        }
    }
}

async fn list_agents(
    manager: &AgentConfigManager,
    json: bool,
    enabled_only: bool,
    type_filter: Option<String>,
) -> Result<()> {
    let mut agents = manager.list_agents()?;

    // Apply filters
    if enabled_only {
        agents.retain(|a| a.enabled);
    }

    if let Some(agent_type) = type_filter {
        agents.retain(|a| a.agent_type == agent_type);
    }

    if json {
        println!("{}", serde_json::to_string_pretty(&agents)?);
        return Ok(());
    }

    // Display agents grouped by category
    println!();
    println!("{}", format!("Miyabi Agent List ({} agents)", agents.len()).bold().underline());
    println!();

    // Group agents
    let (coding_agents, business_agents, custom_agents): (Vec<_>, Vec<_>, Vec<_>) = agents
        .into_iter()
        .fold((vec![], vec![], vec![]), |(mut coding, mut business, mut custom), agent| {
            let is_coding = ["coordinator", "codegen", "review", "issue", "pr", "deployment", "refresher"]
                .contains(&agent.agent_type.as_str());
            let is_builtin = ["coordinator", "codegen", "review", "issue", "pr", "deployment", "refresher",
                              "ai-entrepreneur", "product-concept", "product-design", "funnel-design",
                              "persona", "self-analysis", "market-research", "marketing", "content-creation",
                              "sns-strategy", "youtube", "sales", "crm", "analytics"]
                .contains(&agent.agent_type.as_str());

            if is_coding {
                coding.push(agent);
            } else if is_builtin {
                business.push(agent);
            } else {
                custom.push(agent);
            }
            (coding, business, custom)
        });

    // Display Coding Agents
    if !coding_agents.is_empty() {
        println!("{}", format!("Coding Agents ({}):", coding_agents.len()).cyan().bold());
        for agent in coding_agents {
            let status_icon = if agent.enabled {
                "✅".green()
            } else if agent.config_file.is_some() {
                "⚠️ ".yellow()
            } else {
                "❌".red()
            };
            let name_padded = format!("{:<25}", agent.name);
            println!("  {} {} - {}", status_icon, name_padded.bold(), agent.description);
        }
        println!();
    }

    // Display Business Agents
    if !business_agents.is_empty() {
        println!("{}", format!("Business Agents ({}):", business_agents.len()).cyan().bold());
        for agent in business_agents {
            let status_icon = if agent.enabled {
                "✅".green()
            } else if agent.config_file.is_some() {
                "⚠️ ".yellow()
            } else {
                "❌".red()
            };
            let name_padded = format!("{:<25}", agent.name);
            println!("  {} {} - {}", status_icon, name_padded.bold(), agent.description);
        }
        println!();
    }

    // Display Custom Agents
    if !custom_agents.is_empty() {
        println!("{}", format!("Custom Agents ({}):", custom_agents.len()).cyan().bold());
        for agent in custom_agents {
            let status_icon = if agent.enabled { "✅".green() } else { "❌".red() };
            let name_padded = format!("{:<25}", agent.name);
            println!("  {} {} - {}", status_icon, name_padded.bold(), agent.description);
        }
        println!();
    } else {
        println!("{}", "Custom Agents (0):".cyan().bold());
        println!("  (カスタムAgentなし)");
        println!();
    }

    // Legend
    println!("{}", "Legend:".dimmed());
    println!("  {} Active | {} Not Configured | {} Disabled", "✅".green(), "⚠️ ".yellow(), "❌".red());
    println!();

    // Show config directories
    println!("{}", "Config Directories:".dimmed());
    for dir in manager.config_dirs() {
        println!("  {}", dir.display().to_string().dimmed());
    }
    println!();

    Ok(())
}

async fn show_config(manager: &AgentConfigManager, agent_name: &str, json: bool) -> Result<()> {
    let config = manager
        .load_config(agent_name)
        .with_context(|| format!("Failed to load config for agent '{}'", agent_name))?;

    if json {
        println!("{}", serde_json::to_string_pretty(&config)?);
        return Ok(());
    }

    let config_file = manager
        .find_config_file(agent_name)?
        .map(|p| p.display().to_string())
        .unwrap_or_else(|| "(built-in)".to_string());

    println!();
    println!("{}", format!("Agent Configuration: {}", agent_name).bold().underline());
    println!();

    println!("{}: {}", "Name".bold(), config.agent.name);
    println!("{}: {}", "Type".bold(), config.agent.agent_type);
    println!(
        "{}: {}",
        "Status".bold(),
        if config.agent.enabled {
            "✅ Active".green()
        } else {
            "❌ Disabled".red()
        }
    );
    println!("{}: {}", "Model".bold(), config.agent.model);
    println!("{}: {}", "Config File".bold(), config_file);
    println!();

    if !config.parameters.is_empty() {
        println!("{}", "Parameters:".bold());
        for (key, value) in &config.parameters {
            println!("  {}: {}", key, value);
        }
        println!();
    }

    if !config.skills.is_empty() {
        println!("{}", "Skills:".bold());
        for (skill, cfg) in &config.skills {
            let status = if cfg.enabled { "✅" } else { "❌" };
            println!("  {} {}", status, skill);
        }
        println!();
    }

    println!("{}", "Dependencies:".bold());
    if !config.dependencies.requires.is_empty() {
        println!("  Requires:     {}", config.dependencies.requires.join(", "));
    } else {
        println!("  Requires:     (none)");
    }
    if !config.dependencies.provides.is_empty() {
        println!("  Provides:     {}", config.dependencies.provides.join(", "));
    } else {
        println!("  Provides:     (none)");
    }
    println!();

    println!("{}", format!("Edit: miyabi agent config edit {}", agent_name).dimmed());
    println!();

    Ok(())
}

async fn edit_config(
    manager: &AgentConfigManager,
    agent_name: &str,
    editor: Option<String>,
) -> Result<()> {
    // Load or create config
    let config = match manager.load_config(agent_name) {
        Ok(cfg) => cfg,
        Err(_) => {
            println!("{}", format!("Creating new configuration for '{}'...", agent_name).yellow());
            AgentConfig::default_for_agent(agent_name, "custom", "Custom agent")
        }
    };

    // Save to get file path
    let config_path = manager.save_config(agent_name, &config)?;

    // Determine editor
    let editor_cmd = editor
        .or_else(|| std::env::var("EDITOR").ok())
        .unwrap_or_else(|| "vi".to_string());

    println!("{}", format!("Opening {} with {}...", config_path.display(), editor_cmd).cyan());

    // Launch editor
    let status = ProcessCommand::new(&editor_cmd)
        .arg(&config_path)
        .status()
        .with_context(|| format!("Failed to launch editor '{}'", editor_cmd))?;

    if !status.success() {
        anyhow::bail!("Editor exited with non-zero status");
    }

    // Reload and validate
    let updated_config = manager.load_config_from_file(&config_path)?;
    updated_config.validate()?;

    println!("{}", format!("✓ Configuration updated for '{}'", agent_name).green());

    Ok(())
}

async fn create_agent(
    manager: &AgentConfigManager,
    agent_name: &str,
    agent_type: &str,
    description: &str,
) -> Result<()> {
    // Check if already exists
    if manager.find_config_file(agent_name)?.is_some() {
        anyhow::bail!("Agent '{}' already has a configuration file", agent_name);
    }

    // Create config
    let config = AgentConfig::default_for_agent(agent_name, agent_type, description);
    let path = manager.save_config(agent_name, &config)?;

    println!("{}", format!("✓ Created agent configuration: {}", path.display()).green());
    println!();
    println!("Next steps:");
    println!("  1. Edit configuration: miyabi agent config edit {}", agent_name);
    println!("  2. View configuration: miyabi agent config config {}", agent_name);
    println!();

    Ok(())
}

async fn validate_config(manager: &AgentConfigManager, agent_name: &str) -> Result<()> {
    let config = manager
        .load_config(agent_name)
        .with_context(|| format!("Failed to load config for agent '{}'", agent_name))?;

    config.validate()?;

    println!("{}", format!("✓ Configuration for '{}' is valid", agent_name).green());

    Ok(())
}

async fn delete_config(manager: &AgentConfigManager, agent_name: &str, yes: bool) -> Result<()> {
    // Check if config exists
    let config_file = manager
        .find_config_file(agent_name)?
        .context(format!("No configuration file found for agent '{}'", agent_name))?;

    if !yes {
        println!("{}", format!("Delete configuration for '{}'?", agent_name).yellow());
        println!("  File: {}", config_file.display());
        println!();
        print!("Confirm (y/N): ");
        use std::io::{self, Write};
        io::stdout().flush()?;

        let mut input = String::new();
        io::stdin().read_line(&mut input)?;

        if !input.trim().eq_ignore_ascii_case("y") {
            println!("Cancelled.");
            return Ok(());
        }
    }

    manager.delete_config(agent_name)?;

    println!("{}", format!("✓ Deleted configuration for '{}'", agent_name).green());

    Ok(())
}
