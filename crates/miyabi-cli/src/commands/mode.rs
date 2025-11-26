use clap::{Args, Subcommand};
use colored::Colorize;
use miyabi_modes::{ModeLoader, ModeRegistry, ModeValidator};
use std::env;

use crate::error::Result;

#[derive(Debug, Args)]
pub struct ModeCommand {
    #[command(subcommand)]
    command: ModeSubcommand,
}

#[derive(Debug, Subcommand)]
enum ModeSubcommand {
    /// List all available modes
    List {
        /// Show only system modes
        #[arg(long)]
        system: bool,

        /// Show only custom modes
        #[arg(long)]
        custom: bool,
    },

    /// Show detailed information about a mode
    Info {
        /// Mode slug or character name
        mode: String,
    },

    /// Run agent in specific mode
    Run {
        /// Mode slug (e.g., "codegen", "review")
        mode: String,

        /// Issue number
        #[arg(long)]
        issue: u32,

        /// Additional arguments
        #[arg(long)]
        args: Vec<String>,
    },

    /// Render template variables in a mode
    Render {
        /// Mode slug
        mode: String,

        /// Show only role definition
        #[arg(long)]
        role: bool,

        /// Show only custom instructions
        #[arg(long)]
        instructions: bool,
    },

    /// Create new custom mode from template
    Create {
        /// Mode slug
        slug: String,
    },

    /// Validate all mode definitions
    Validate,
}

impl ModeCommand {
    pub async fn execute(&self) -> Result<()> {
        match &self.command {
            ModeSubcommand::List { system, custom } => self.list_modes(*system, *custom).await,
            ModeSubcommand::Info { mode } => self.show_mode_info(mode).await,
            ModeSubcommand::Run { mode, issue, args } => self.run_mode(mode, *issue, args).await,
            ModeSubcommand::Render {
                mode,
                role,
                instructions,
            } => self.render_mode(mode, *role, *instructions).await,
            ModeSubcommand::Create { slug } => self.create_mode(slug).await,
            ModeSubcommand::Validate => self.validate_modes().await,
        }
    }

    async fn list_modes(&self, system_only: bool, custom_only: bool) -> Result<()> {
        let current_dir = env::current_dir()?;
        let loader = ModeLoader::new(&current_dir);
        let registry = ModeRegistry::new();

        match loader.load_all() {
            Ok(modes) => {
                registry.register_all(modes)?;
            }
            Err(e) => {
                eprintln!("{} {}", "Error loading modes:".red(), e);
                eprintln!(
                    "\n{}",
                    "Make sure .miyabi/modes/system/ directory exists with mode definitions."
                        .yellow()
                );
                return Ok(());
            }
        }

        println!("{}\n", "📋 Available Modes:".bold().cyan());

        let modes = if system_only {
            registry.list_system_modes()
        } else if custom_only {
            registry.list_custom_modes()
        } else {
            registry.list()
        };

        if modes.is_empty() {
            println!("  {}", "No modes found.".yellow());
            return Ok(());
        }

        // Group by source
        let mut system_modes: Vec<_> = modes.iter().filter(|m| m.is_system_mode()).collect();
        let mut custom_modes: Vec<_> = modes.iter().filter(|m| m.is_custom_mode()).collect();

        system_modes.sort_by(|a, b| a.slug.cmp(&b.slug));
        custom_modes.sort_by(|a, b| a.slug.cmp(&b.slug));

        if !system_modes.is_empty() && !custom_only {
            println!("{}", "  System Modes:".bold());
            for mode in system_modes {
                println!(
                    "    {} {} {}",
                    mode.name.green(),
                    format!("({})", mode.slug).dimmed(),
                    format!("- {}", mode.character).cyan()
                );
                println!("      {}\n", mode.short_description().dimmed());
            }
        }

        if !custom_modes.is_empty() && !system_only {
            println!("{}", "  Custom Modes:".bold());
            for mode in custom_modes {
                println!(
                    "    {} {} {}",
                    mode.name.green(),
                    format!("({})", mode.slug).dimmed(),
                    format!("- {}", mode.character).cyan()
                );
                println!("      {}\n", mode.short_description().dimmed());
            }
        }

        println!("\n{} miyabi mode info <slug>", "Use".dimmed());
        println!(
            "{} miyabi mode run <slug> --issue <number>\n",
            "Or".dimmed()
        );

        Ok(())
    }

    async fn show_mode_info(&self, mode_identifier: &str) -> Result<()> {
        let current_dir = env::current_dir()?;
        let loader = ModeLoader::new(&current_dir);
        let registry = ModeRegistry::new();

        let modes = loader.load_all()?;
        registry.register_all(modes)?;

        // Try to find by slug first, then by character name
        let mode = registry
            .get(mode_identifier)
            .or_else(|| registry.get_by_character(mode_identifier))
            .ok_or_else(|| {
                crate::error::CliError::InvalidInput(format!(
                    "Mode '{}' not found",
                    mode_identifier
                ))
            })?;

        println!(
            "\n{}\n",
            format!("{} Mode Information", mode.name).bold().cyan()
        );
        println!("{} {}", "Slug:".bold(), mode.slug);
        println!("{} {}", "Character:".bold(), mode.character);
        println!("{} {}\n", "Source:".bold(), mode.source);

        println!("{}", "Role Definition:".bold());
        println!("{}\n", mode.role_definition.dimmed());

        println!("{}", "When to Use:".bold());
        println!("{}\n", mode.when_to_use.dimmed());

        println!("{}", "Allowed Tools:".bold());
        for group in &mode.groups {
            println!("  - {:?}", group);
        }
        println!();

        if let Some(ref regex) = mode.file_regex {
            println!("{} {}\n", "File Restriction:".bold(), regex);
        }

        println!("{}", "Custom Instructions:".bold());
        println!("{}\n", mode.custom_instructions.dimmed());

        Ok(())
    }

    async fn run_mode(&self, mode_slug: &str, issue: u32, _args: &[String]) -> Result<()> {
        let current_dir = env::current_dir()?;
        let loader = ModeLoader::new(&current_dir);
        let registry = ModeRegistry::new();

        let modes = loader.load_all()?;
        registry.register_all(modes)?;

        let mode = registry.get(mode_slug).ok_or_else(|| {
            crate::error::CliError::InvalidInput(format!("Mode '{}' not found", mode_slug))
        })?;

        println!(
            "{} {} for Issue #{}",
            "🚀 Running".green().bold(),
            mode.name,
            issue
        );
        println!("{} {}\n", "Character:".bold(), mode.character.cyan());

        // TODO: Integrate with actual agent execution
        println!("{}", "⚠️  Agent execution integration pending".yellow());
        println!(
            "{}",
            "This will be implemented in Phase 1 completion.".dimmed()
        );

        Ok(())
    }

    async fn create_mode(&self, slug: &str) -> Result<()> {
        let current_dir = env::current_dir()?;
        let custom_dir = current_dir.join(".miyabi/modes/custom");

        // Create custom directory if it doesn't exist
        std::fs::create_dir_all(&custom_dir)?;

        let file_path = custom_dir.join(format!("{}.yaml", slug));

        if file_path.exists() {
            eprintln!(
                "{} Mode '{}' already exists at {:?}",
                "Error:".red(),
                slug,
                file_path
            );
            return Ok(());
        }

        let template = format!(
            r#"slug: {}
name: "📝 My Custom Mode"
character: "かすたむん"
roleDefinition: |-
  You are a custom Miyabi agent specialized in:
  - [Add your specialization here]
  - [Add another specialization]
  
  Your focus is on [describe focus area].

whenToUse: |-
  Use this mode when:
  - [Scenario 1]
  - [Scenario 2]

groups:
  - read
  - edit
  - command

customInstructions: |-
  ## Workflow
  1. [Step 1]
  2. [Step 2]
  3. [Step 3]
  
  ## Quality Standards
  - [Standard 1]
  - [Standard 2]

source: "user"

# Optional: Restrict to specific file types
# fileRegex: ".*\\.rs$"

# Optional: Short description
# description: "Brief description of this mode"
"#,
            slug
        );

        std::fs::write(&file_path, template)?;

        println!("{} Created custom mode at {:?}", "✅".green(), file_path);
        println!("\n{} Edit the file to customize your mode.", "Next:".bold());
        println!("{} miyabi mode validate\n", "Then run:".bold());

        Ok(())
    }

    async fn validate_modes(&self) -> Result<()> {
        let current_dir = env::current_dir()?;
        let loader = ModeLoader::new(&current_dir);

        println!("{}\n", "🔍 Validating mode definitions...".bold().cyan());

        let modes = match loader.load_all() {
            Ok(modes) => modes,
            Err(e) => {
                eprintln!("{} {}", "Failed to load modes:".red(), e);
                return Ok(());
            }
        };

        let mut errors = 0;
        let mut warnings = 0;

        for mode in &modes {
            match ModeValidator::validate(mode) {
                Ok(_) => {
                    println!("{} {} ({})", "✅".green(), mode.name, mode.slug.dimmed());
                }
                Err(e) => {
                    println!(
                        "{} {} ({}): {}",
                        "❌".red(),
                        mode.name,
                        mode.slug.dimmed(),
                        e
                    );
                    errors += 1;
                }
            }

            // Additional warnings
            if mode.role_definition.len() < 50 {
                println!("  {} Role definition is very short", "⚠️".yellow());
                warnings += 1;
            }

            if mode.groups.len() == 1 {
                println!("  {} Only one tool group defined", "⚠️".yellow());
                warnings += 1;
            }
        }

        println!();
        println!("{} {} modes validated", "Summary:".bold(), modes.len());

        if errors > 0 {
            println!("{} {} errors", "❌".red(), errors);
        }

        if warnings > 0 {
            println!("{} {} warnings", "⚠️".yellow(), warnings);
        }

        if errors == 0 && warnings == 0 {
            println!("{} All modes are valid!", "✅".green().bold());
        }

        println!();
        Ok(())
    }

    async fn render_mode(
        &self,
        mode_slug: &str,
        show_role: bool,
        show_instructions: bool,
    ) -> Result<()> {
        use miyabi_modes::TemplateRenderer;

        let current_dir = env::current_dir()?;
        let loader = ModeLoader::new(&current_dir);
        let registry = ModeRegistry::new();

        let modes = loader.load_all()?;
        registry.register_all(modes)?;

        let mode = registry.get(mode_slug).ok_or_else(|| {
            crate::error::CliError::InvalidInput(format!("Mode '{}' not found", mode_slug))
        })?;

        // Create template renderer
        let renderer = TemplateRenderer::new(current_dir);
        let rendered_mode = mode.render_templates(&renderer).map_err(|e| {
            crate::error::CliError::InvalidInput(format!("Template rendering failed: {}", e))
        })?;

        println!(
            "\n{}\n",
            format!("📝 Rendered Mode: {}", rendered_mode.name)
                .bold()
                .cyan()
        );

        if show_role {
            println!("{}\n", "Role Definition:".bold());
            println!("{}\n", rendered_mode.role_definition.dimmed());
        } else if show_instructions {
            println!("{}\n", "Custom Instructions:".bold());
            println!("{}\n", rendered_mode.custom_instructions.dimmed());
        } else {
            println!("{}\n", "Role Definition:".bold());
            println!("{}\n", rendered_mode.role_definition.dimmed());

            println!("{}\n", "Custom Instructions:".bold());
            println!("{}\n", rendered_mode.custom_instructions.dimmed());
        }

        Ok(())
    }
}
