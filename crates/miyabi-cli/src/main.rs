//! Miyabi CLI - 一つのコマンドで全てが完結

use clap::{Parser, Subcommand};
use colored::Colorize;

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
    },
    /// Install Miyabi to existing project
    Install {
        /// Dry run (don't make changes)
        #[arg(long)]
        dry_run: bool,
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
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();

    // Initialize logger
    let log_level = if cli.verbose {
        miyabi_core::LogLevel::Debug
    } else {
        miyabi_core::LogLevel::Info
    };
    miyabi_core::init_logger(log_level);

    match cli.command {
        Some(Commands::Init { name, private }) => {
            println!("{}", "🚀 Initializing new project...".cyan().bold());
            println!("  Project: {}", name);
            println!("  Private: {}", private);
            // TODO: Implement init command
            Ok(())
        }
        Some(Commands::Install { dry_run }) => {
            println!("{}", "📦 Installing Miyabi to existing project...".cyan().bold());
            if dry_run {
                println!("{}", "  (Dry run - no changes will be made)".yellow());
            }
            // TODO: Implement install command
            Ok(())
        }
        Some(Commands::Status { watch }) => {
            println!("{}", "📊 Checking project status...".cyan().bold());
            if watch {
                println!("{}", "  (Watch mode enabled)".green());
            }
            // TODO: Implement status command
            Ok(())
        }
        Some(Commands::Agent { agent_type, issue }) => {
            println!("{}", format!("🤖 Running {} agent...", agent_type).cyan().bold());
            if let Some(issue_num) = issue {
                println!("  Issue: #{}", issue_num);
            }
            // TODO: Implement agent command
            Ok(())
        }
        None => {
            println!("{}", "✨ Miyabi".cyan().bold());
            println!("{}", "一つのコマンドで全てが完結".dimmed());
            println!();
            println!("Use --help to see available commands");
            Ok(())
        }
    }
}
