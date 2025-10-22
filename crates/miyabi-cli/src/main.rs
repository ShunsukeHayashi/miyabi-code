//! Miyabi CLI - 一つのコマンドで全てが完結

mod commands;
mod error;
mod service;
mod startup;
mod worktree;

use clap::{Parser, Subcommand};
use colored::Colorize;
use commands::{
    AgentCommand, InitCommand, InstallCommand, KnowledgeCommand, ParallelCommand, SetupCommand,
    StatusCommand,
};
use error::Result;

#[derive(Parser)]
#[command(name = "miyabi")]
#[command(about = "✨ Miyabi - 一つのコマンドで全てが完結する自律型開発フレームワーク", long_about = None)]
#[command(version)]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,

    /// Output in JSON format (for AI agents)
    #[arg(long)]
    json: bool,

    /// Verbose output
    #[arg(short, long)]
    verbose: bool,
}

#[derive(Subcommand)]
enum Commands {
    /// Initialize new project
    Init {
        /// Project name
        name: String,
        /// Make repository private
        #[arg(short, long)]
        private: bool,
        /// Interactive mode (asks questions)
        #[arg(short, long)]
        interactive: bool,
    },
    /// Install Miyabi to existing project
    Install {
        /// Dry run (don't make changes)
        #[arg(long)]
        dry_run: bool,
    },
    /// Interactive setup wizard
    Setup {
        /// Skip interactive prompts (use defaults)
        #[arg(long)]
        yes: bool,
    },
    /// Check project status
    Status {
        /// Watch mode (auto-refresh)
        #[arg(short, long)]
        watch: bool,
    },
    /// Run agent
    Agent {
        /// Agent type (coordinator, codegen, review, etc.)
        agent_type: String,
        /// Issue number
        #[arg(long)]
        issue: Option<u64>,
    },
    /// Execute agents in parallel worktrees
    Parallel {
        /// Issue numbers to process (comma-separated)
        #[arg(long, value_delimiter = ',')]
        issues: Vec<u64>,
        /// Maximum concurrency (default: 3)
        #[arg(long, default_value = "3")]
        concurrency: usize,
    },
    /// Work on an issue (simplified alias for 'agent run coordinator')
    #[command(name = "work-on")]
    WorkOn {
        /// Issue description or number
        task: String,
    },
    /// Knowledge management (search, index, stats)
    Knowledge {
        #[command(subcommand)]
        command: KnowledgeCommand,
    },
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();

    // Initialize logger
    let log_level = if cli.verbose {
        miyabi_core::LogLevel::Debug
    } else {
        miyabi_core::LogLevel::Info
    };
    miyabi_core::init_logger(log_level);

    // Perform startup checks (non-fatal warnings)
    startup::perform_startup_checks();

    let result = match cli.command {
        Some(Commands::Init {
            name,
            private,
            interactive,
        }) => {
            let cmd = InitCommand::with_interactive(name, private, interactive);
            cmd.execute().await
        }
        Some(Commands::Install { dry_run }) => {
            let cmd = InstallCommand::new(dry_run);
            cmd.execute().await
        }
        Some(Commands::Setup { yes }) => {
            let cmd = SetupCommand::new(yes);
            cmd.execute().await
        }
        Some(Commands::Status { watch }) => {
            let cmd = StatusCommand::new(watch);
            cmd.execute().await
        }
        Some(Commands::Agent { agent_type, issue }) => {
            let cmd = AgentCommand::new(agent_type, issue);
            cmd.execute().await
        }
        Some(Commands::Parallel {
            issues,
            concurrency,
        }) => {
            let cmd = ParallelCommand::new(issues, concurrency);
            cmd.execute().await
        }
        Some(Commands::WorkOn { task }) => {
            println!();
            println!("{}", "🚀 Let's work on it!".cyan().bold());
            println!();

            // Try to parse as issue number
            if let Ok(issue_num) = task.parse::<u64>() {
                println!("  {} Issue #{}", "📋".green(), issue_num);
                let cmd = AgentCommand::new("coordinator".to_string(), Some(issue_num));
                cmd.execute().await
            } else {
                // Task description - suggest creating an issue
                println!("  {} Task: {}", "✨".yellow(), task.bold());
                println!();
                println!("{}", "💡 Next steps:".cyan());
                println!("  1. Create an issue on GitHub with this description");
                println!("  2. Run: miyabi work-on <issue-number>");
                println!();
                println!("{}", "Or use GitHub CLI:".dimmed());
                println!(
                    "  {}",
                    format!("gh issue create --title \"{}\" --label type:feature", task).yellow()
                );
                Ok(())
            }
        }
        Some(Commands::Knowledge { command }) => command.execute(cli.json).await,
        None => {
            println!("{}", "✨ Miyabi".cyan().bold());
            println!("{}", "一つのコマンドで全てが完結".dimmed());
            println!();
            println!("Use --help to see available commands");
            Ok(())
        }
    };

    // Handle errors
    if let Err(ref e) = result {
        eprintln!("{} {}", "Error:".red().bold(), e);
        std::process::exit(1);
    }

    result
}
