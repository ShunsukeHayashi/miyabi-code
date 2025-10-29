//! Agent management command - List, configure, and edit agents

use crate::error::{CliError, Result};
use clap::Subcommand;
use colored::Colorize;
use comfy_table::{Cell, Color, Table};
use miyabi_agents::{AgentConfigManager, AgentInfo, AgentType};
use std::process::Command as ProcessCommand;

#[derive(Debug, Subcommand)]
pub enum AgentManageCommand {
    /// List all agents
    List {
        /// Output in JSON format
        #[arg(long)]
        json: bool,
    },
    /// Show agent configuration
    Config {
        /// Agent name (e.g., "CoordinatorAgent", "MarketingAgent")
        agent_name: String,
        /// Output in JSON format
        #[arg(long)]
        json: bool,
    },
    /// Edit agent configuration
    Edit {
        /// Agent name (e.g., "CoordinatorAgent", "MarketingAgent")
        agent_name: String,
        /// Editor to use (default: $EDITOR or vi)
        #[arg(long)]
        editor: Option<String>,
    },
    /// Create custom agent
    Create {
        /// Agent name
        agent_name: String,
        /// Template agent to copy from (e.g., "CoordinatorAgent")
        #[arg(long)]
        template: Option<String>,
    },
}

impl AgentManageCommand {
    pub async fn execute(&self) -> Result<()> {
        let manager = AgentConfigManager::new()
            .map_err(|e| CliError::ExecutionError(format!("Failed to initialize agent config manager: {}", e)))?;

        match self {
            AgentManageCommand::List { json } => self.list_agents(&manager, *json).await,
            AgentManageCommand::Config { agent_name, json } => {
                self.show_config(&manager, agent_name, *json).await
            }
            AgentManageCommand::Edit { agent_name, editor } => {
                self.edit_config(&manager, agent_name, editor).await
            }
            AgentManageCommand::Create {
                agent_name,
                template,
            } => self.create_agent(&manager, agent_name, template).await,
        }
    }

    async fn list_agents(&self, manager: &AgentConfigManager, json: bool) -> Result<()> {
        let agents = manager.list_agents()
            .map_err(|e| CliError::ExecutionError(format!("Failed to list agents: {}", e)))?;

        if json {
            let json_output = serde_json::to_string_pretty(&agents)
                .map_err(|e| CliError::Json(e))?;
            println!("{}", json_output);
            return Ok(());
        }

        self.print_agent_list(&agents);
        Ok(())
    }

    fn print_agent_list(&self, agents: &[AgentInfo]) {
        if agents.is_empty() {
            println!("{}", "No agents found.".yellow());
            println!();
            println!("{}", "Hint: Create agent configuration files in:".dimmed());
            println!("  - .miyabi/agents/");
            println!("  - ~/.config/miyabi/agents/");
            return;
        }

        println!();
        println!("{}", "Miyabi Agent List".bold().cyan());
        println!(
            "{}",
            format!("({} agents configured)", agents.len())
                .dimmed()
        );
        println!();

        // Separate into categories
        let coding_agents: Vec<&AgentInfo> = agents
            .iter()
            .filter(|a| a.agent_type.is_coding_agent())
            .collect();
        let business_agents: Vec<&AgentInfo> = agents
            .iter()
            .filter(|a| a.agent_type.is_business_agent())
            .collect();
        let custom_agents: Vec<&AgentInfo> = agents
            .iter()
            .filter(|a| a.agent_type == AgentType::Custom)
            .collect();

        // Coding Agents
        if !coding_agents.is_empty() {
            let mut table = Table::new();
            table.set_header(vec![
                Cell::new("").fg(Color::Cyan),
                Cell::new("Agent").fg(Color::Cyan),
                Cell::new("Description").fg(Color::Cyan),
            ]);

            for agent in coding_agents {
                let status_icon = if agent.enabled { "✅" } else { "⚠️" };
                table.add_row(vec![
                    Cell::new(status_icon),
                    Cell::new(&agent.name).fg(if agent.enabled {
                        Color::Green
                    } else {
                        Color::Yellow
                    }),
                    Cell::new(&agent.description),
                ]);
            }

            println!("{}", "Coding Agents:".bold().green());
            println!("{table}");
            println!();
        }

        // Business Agents
        if !business_agents.is_empty() {
            let mut table = Table::new();
            table.set_header(vec![
                Cell::new("").fg(Color::Cyan),
                Cell::new("Agent").fg(Color::Cyan),
                Cell::new("Description").fg(Color::Cyan),
            ]);

            for agent in business_agents {
                let status_icon = if agent.enabled { "✅" } else { "⚠️" };
                table.add_row(vec![
                    Cell::new(status_icon),
                    Cell::new(&agent.name).fg(if agent.enabled {
                        Color::Green
                    } else {
                        Color::Yellow
                    }),
                    Cell::new(&agent.description),
                ]);
            }

            println!("{}", "Business Agents:".bold().magenta());
            println!("{table}");
            println!();
        }

        // Custom Agents
        if !custom_agents.is_empty() {
            let mut table = Table::new();
            table.set_header(vec![
                Cell::new("").fg(Color::Cyan),
                Cell::new("Agent").fg(Color::Cyan),
                Cell::new("Description").fg(Color::Cyan),
            ]);

            for agent in custom_agents {
                let status_icon = if agent.enabled { "✅" } else { "⚠️" };
                table.add_row(vec![
                    Cell::new(status_icon),
                    Cell::new(&agent.name).fg(if agent.enabled {
                        Color::Green
                    } else {
                        Color::Yellow
                    }),
                    Cell::new(&agent.description),
                ]);
            }

            println!("{}", "Custom Agents:".bold().blue());
            println!("{table}");
            println!();
        }

        println!("{}", "Legend:".dimmed());
        println!("  {} Active  {} Not Configured  {} Disabled", "✅", "⚠️", "❌");
        println!();
    }

    async fn show_config(
        &self,
        manager: &AgentConfigManager,
        agent_name: &str,
        json: bool,
    ) -> Result<()> {
        let config = manager
            .load_config(agent_name)
            .map_err(|e| CliError::ExecutionError(format!("Failed to load agent config: {}", e)))?;

        if json {
            let json_output = serde_json::to_string_pretty(&config)
                .map_err(|e| CliError::Json(e))?;
            println!("{}", json_output);
            return Ok(());
        }

        // Display formatted configuration
        println!();
        println!(
            "{}",
            format!("Agent Configuration: {}", config.agent.name)
                .bold()
                .cyan()
        );
        println!("{}", "━".repeat(60).cyan());
        println!();

        // Basic Info
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

        // Config File Location
        if let Some(config_file) = manager
            .find_config_file(&config.agent.name)
            .map_err(|e| CliError::ExecutionError(format!("Failed to find config file: {}", e)))?
        {
            println!(
                "{}: {}",
                "Config File".bold(),
                config_file.display().to_string().dimmed()
            );
        }

        println!();
        println!("{}", "Description:".bold());
        println!("  {}", config.agent.description);

        // Parameters
        if !config.parameters.is_empty() {
            println!();
            println!("{}", "Parameters:".bold());
            for (key, value) in &config.parameters {
                println!("  {}: {}", key.cyan(), value);
            }
        }

        // Skills
        if !config.skills.is_empty() {
            println!();
            println!("{}", "Skills:".bold());
            for (skill_name, skill_config) in &config.skills {
                let status = if skill_config.enabled {
                    "✅".green()
                } else {
                    "❌".red()
                };
                println!("  {} {}", status, skill_name);
            }
        }

        // Dependencies
        if !config.dependencies.requires.is_empty()
            || !config.dependencies.provides.is_empty()
        {
            println!();
            println!("{}", "Dependencies:".bold());
            if !config.dependencies.requires.is_empty() {
                println!(
                    "  {}: {}",
                    "Requires".cyan(),
                    config.dependencies.requires.join(", ")
                );
            } else {
                println!("  {}: {}", "Requires".cyan(), "(none)".dimmed());
            }

            if !config.dependencies.provides.is_empty() {
                println!(
                    "  {}: {}",
                    "Provides".cyan(),
                    config.dependencies.provides.join(", ")
                );
            } else {
                println!("  {}: {}", "Provides".cyan(), "(none)".dimmed());
            }
        }

        println!();
        println!("{}", "━".repeat(60).cyan());
        println!(
            "{}",
            format!("Edit: miyabi agent edit {}", agent_name)
                .dimmed()
        );

        Ok(())
    }

    async fn edit_config(
        &self,
        manager: &AgentConfigManager,
        agent_name: &str,
        editor: &Option<String>,
    ) -> Result<()> {
        // Find config file
        let config_file = manager
            .find_config_file(agent_name)
            .map_err(|e| CliError::ExecutionError(format!("Failed to find config file: {}", e)))?
            .ok_or_else(|| {
                CliError::ExecutionError(format!("Agent configuration not found: {}", agent_name))
            })?;

        // Determine editor
        let editor_cmd = editor
            .clone()
            .or_else(|| std::env::var("EDITOR").ok())
            .unwrap_or_else(|| "vi".to_string());

        println!(
            "{}",
            format!("Opening {} with {}...", agent_name, editor_cmd)
                .cyan()
        );
        println!("  File: {}", config_file.display().to_string().dimmed());
        println!();

        // Open editor
        let status = ProcessCommand::new(&editor_cmd)
            .arg(&config_file)
            .status()
            .map_err(|e| {
                CliError::ExecutionError(format!("Failed to launch editor {}: {}", editor_cmd, e))
            })?;

        if !status.success() {
            return Err(CliError::ExecutionError(format!(
                "Editor exited with non-zero status: {}",
                status
            )));
        }

        println!();
        println!("{}", "✅ Configuration updated.".green());
        println!(
            "{}",
            format!("Verify: miyabi agent config {}", agent_name)
                .dimmed()
        );

        Ok(())
    }

    async fn create_agent(
        &self,
        manager: &AgentConfigManager,
        agent_name: &str,
        template: &Option<String>,
    ) -> Result<()> {
        println!(
            "{}",
            format!("Creating custom agent: {}", agent_name)
                .cyan()
                .bold()
        );

        // Check if agent already exists
        if manager.find_config_file(agent_name).map_err(|e| CliError::ExecutionError(format!("Failed to check for existing agent: {}", e)))?.is_some() {
            return Err(CliError::ExecutionError(format!(
                "Agent '{}' already exists. Use 'miyabi agent edit {}' to modify it.",
                agent_name, agent_name
            )));
        }

        // Load template if specified
        let new_config = if let Some(template_name) = template {
            println!("  Using template: {}", template_name.cyan());
            let mut template_config = manager
                .load_config(template_name)
                .map_err(|e| {
                    CliError::ExecutionError(format!("Failed to load template agent: {}", e))
                })?;

            // Modify for new agent
            template_config.agent.name = agent_name.to_string();
            template_config.agent.agent_type = AgentType::Custom;
            template_config.agent.description =
                format!("Custom agent based on {}", template_name);

            template_config
        } else {
            // Create default configuration
            use miyabi_agents::{AgentConfig, AgentDependencies, AgentMetadata};
            use std::collections::HashMap;

            AgentConfig {
                agent: AgentMetadata {
                    name: agent_name.to_string(),
                    agent_type: AgentType::Custom,
                    enabled: true,
                    model: "claude-sonnet-4".to_string(),
                    description: format!("Custom agent: {}", agent_name),
                },
                parameters: HashMap::new(),
                skills: HashMap::new(),
                dependencies: AgentDependencies::default(),
            }
        };

        // Save configuration
        manager
            .save_config(agent_name, &new_config)
            .map_err(|e| {
                CliError::ExecutionError(format!("Failed to save agent configuration: {}", e))
            })?;

        println!();
        println!("{}", "✅ Agent created successfully!".green().bold());
        println!(
            "{}",
            format!("  Config: miyabi agent config {}", agent_name).dimmed()
        );
        println!(
            "{}",
            format!("  Edit: miyabi agent edit {}", agent_name).dimmed()
        );

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_manage_command_variants() {
        // Test List variant
        let list_cmd = AgentManageCommand::List { json: false };
        assert!(matches!(list_cmd, AgentManageCommand::List { .. }));

        // Test Config variant
        let config_cmd = AgentManageCommand::Config {
            agent_name: "TestAgent".to_string(),
            json: false,
        };
        assert!(matches!(config_cmd, AgentManageCommand::Config { .. }));

        // Test Edit variant
        let edit_cmd = AgentManageCommand::Edit {
            agent_name: "TestAgent".to_string(),
            editor: Some("vim".to_string()),
        };
        assert!(matches!(edit_cmd, AgentManageCommand::Edit { .. }));

        // Test Create variant
        let create_cmd = AgentManageCommand::Create {
            agent_name: "TestAgent".to_string(),
            template: None,
        };
        assert!(matches!(create_cmd, AgentManageCommand::Create { .. }));
    }
}
