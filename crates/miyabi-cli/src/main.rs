//! Miyabi CLI - 一つのコマンドで全てが完結

mod commands;
mod config;
mod display;
mod error;
mod service;
mod startup;
mod worktree;

use clap::{Parser, Subcommand};
use colored::Colorize;
use miyabi_voice_guide::{VoiceGuide, VoiceMessage};
use commands::{
    AgentCommand, InitCommand, InstallCommand, KnowledgeCommand, LoopCommand, ModeCommand,
    ParallelCommand, SetupCommand, StatusCommand, WorktreeCommand, WorktreeSubcommand,
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
    /// Interactive chat REPL
    Chat {
        /// Initial prompt message
        prompt: Option<String>,
        /// Use TUI mode (Terminal UI)
        #[arg(long)]
        tui: bool,
    },
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
    /// Worktree management (list, prune, remove)
    Worktree {
        #[command(subcommand)]
        command: WorktreeSubcommand,
    },
    /// Infinite feedback loop orchestration
    Loop {
        #[command(subcommand)]
        command: LoopCommand,
    },
    /// Adaptive mode system (inspired by Roo-Code)
    Mode {
        #[command(flatten)]
        command: ModeCommand,
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

    // Initialize Voice Guide (Voice-First Onboarding)
    let voice_guide = VoiceGuide::new();

    // Perform startup checks (non-fatal warnings)
    startup::perform_startup_checks();

    // Safety check: Ensure we're in a valid directory
    // This prevents bash session crashes when worktrees are deleted
    ensure_valid_working_directory();

    let result = match cli.command {
        Some(Commands::Init {
            name,
            private,
            interactive,
        }) => {
            // Voice Guide: Processing started
            voice_guide.speak(VoiceMessage::ProcessingStarted {
                task_name: format!("Project '{}'", name),
            }).await;

            let cmd = InitCommand::with_interactive(name.clone(), private, interactive);
            let result = cmd.execute().await;

            // Voice Guide: Success or Error feedback
            match &result {
                Ok(_) => {
                    voice_guide.speak(VoiceMessage::SuccessProjectCreated {
                        project_name: name,
                    }).await;
                }
                Err(_) => {
                    voice_guide.speak(VoiceMessage::ErrorProjectExists {
                        project_name: name,
                    }).await;
                }
            }

            result
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

                // Voice Guide: Processing started
                voice_guide.speak(VoiceMessage::ProcessingStarted {
                    task_name: format!("Issue #{}", issue_num),
                }).await;

                let cmd = AgentCommand::new("coordinator".to_string(), Some(issue_num));
                let result = cmd.execute().await;

                // Voice Guide: Success or Error feedback
                match &result {
                    Ok(_) => {
                        voice_guide.speak(VoiceMessage::SuccessIssueProcessed {
                            issue_number: issue_num,
                        }).await;
                    }
                    Err(_) => {
                        voice_guide.speak(VoiceMessage::ErrorIssueNotFound {
                            issue_number: issue_num,
                        }).await;
                    }
                }

                result
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

                // Voice Guide: Next step guidance
                voice_guide.speak(VoiceMessage::NextStepGitHubAuth).await;

                Ok(())
            }
        }
        Some(Commands::Knowledge { command }) => command.execute(cli.json).await,
        Some(Commands::Worktree { command }) => {
            let cmd = WorktreeCommand::new(command);
            cmd.execute().await
        }
        Some(Commands::Loop { command }) => command.execute().await,
        Some(Commands::Mode { command }) => command.execute().await,
        Some(Commands::Chat { prompt, tui }) => {
            #[cfg(feature = "tui")]
            {
                if tui {
                    // Launch TUI mode
                    miyabi_tui::run_tui()
                        .await
                        .map_err(|e| error::CliError::Other(format!("TUI error: {}", e)))
                } else {
                    // Regular REPL mode (not yet implemented)
                    println!("{}", "💬 Chat mode (REPL)".cyan().bold());
                    println!();
                    println!("{}", "TUI mode available with --tui flag".dimmed());
                    println!("  Example: miyabi chat --tui");
                    Ok(())
                }
            }
            #[cfg(not(feature = "tui"))]
            {
                println!("{}", "❌ TUI feature not enabled".red().bold());
                println!();
                println!("Rebuild with: cargo build --features tui");
                Ok(())
            }
        }
        None => {
            println!("{}", "✨ Miyabi".cyan().bold());
            println!("{}", "一つのコマンドで全てが完結".dimmed());
            println!();
            println!("Use --help to see available commands");
            println!();

            // Voice-First Onboarding: Welcome message
            voice_guide.speak(VoiceMessage::Welcome).await;

            Ok(())
        }
    };

    // Handle errors with recovery
    if let Err(ref e) = result {
        eprintln!("{} {}", "Error:".red().bold(), e);

        // Attempt directory recovery if error is related to working directory
        if is_directory_related_error(e) {
            eprintln!(
                "{}",
                "⚠️  Attempting to recover from directory error...".yellow()
            );
            if recover_from_directory_error() {
                eprintln!(
                    "{}",
                    "✅ Directory recovered. Please retry the command.".green()
                );
                std::process::exit(2); // Exit with recoverable error code
            } else {
                eprintln!(
                    "{}",
                    "❌ Failed to recover directory. Please manually cd to project root.".red()
                );
            }
        }

        std::process::exit(1);
    }

    result
}

/// Ensure we're in a valid working directory
/// This prevents bash session crashes when worktrees are deleted
fn ensure_valid_working_directory() {
    match std::env::current_dir() {
        Ok(current) => {
            // Check if current directory exists
            if !current.exists() {
                eprintln!(
                    "{}",
                    "⚠️  Current directory no longer exists (possibly deleted worktree)".yellow()
                );
                recover_from_directory_error();
            }
        }
        Err(e) => {
            eprintln!(
                "{}",
                format!("⚠️  Cannot read current directory: {}", e).yellow()
            );
            recover_from_directory_error();
        }
    }
}

/// Check if error is related to directory issues
fn is_directory_related_error(error: &error::CliError) -> bool {
    let error_msg = error.to_string().to_lowercase();
    error_msg.contains("directory")
        || error_msg.contains("no such file")
        || error_msg.contains("worktree")
        || error_msg.contains("current_dir")
}

/// Attempt to recover from directory errors by moving to repository root
fn recover_from_directory_error() -> bool {
    // Try to find git repository root
    if let Ok(output) = std::process::Command::new("git")
        .args(["rev-parse", "--show-toplevel"])
        .output()
    {
        if output.status.success() {
            if let Ok(repo_root) = String::from_utf8(output.stdout) {
                let repo_root = repo_root.trim();
                if std::env::set_current_dir(repo_root).is_ok() {
                    eprintln!(
                        "{}",
                        format!("  ✓ Changed directory to: {}", repo_root).green()
                    );
                    return true;
                }
            }
        }
    }

    // Fallback: Try to go to home directory (cross-platform)
    if let Some(home) = dirs::home_dir() {
        if std::env::set_current_dir(&home).is_ok() {
            eprintln!(
                "{}",
                format!("  ✓ Changed directory to home: {}", home.display()).green()
            );
            return true;
        }
    }

    false
}
