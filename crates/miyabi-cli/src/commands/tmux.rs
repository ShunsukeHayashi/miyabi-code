//! Tmux Layout Optimization Command
//!
//! Issue: #876 - tmuxレイアウト自動最適化
//!
//! Automatically adjusts tmux layout based on task type.

use crate::error::{CliError, Result};
use clap::{Subcommand, ValueEnum};
use colored::Colorize;
use std::path::PathBuf;
use std::process::Command;

/// Tmux optimization command
#[derive(Subcommand)]
pub enum TmuxCommand {
    /// Optimize layout for specific task type
    Optimize {
        /// Task type to optimize for
        #[arg(long, short = 'f', value_enum)]
        r#for: TaskType,
        /// Custom session name (default: miyabi)
        #[arg(long, short)]
        session: Option<String>,
    },
    /// List available layouts
    List,
    /// Show current tmux status
    Status,
    /// Apply a specific layout file
    Apply {
        /// Path to layout configuration
        layout: PathBuf,
        /// Session name
        #[arg(long, short)]
        session: Option<String>,
    },
    /// Save current layout to file
    Save {
        /// Output path for layout
        output: PathBuf,
        /// Session name to save
        #[arg(long, short)]
        session: Option<String>,
    },
    /// Reset to default layout
    Reset {
        /// Session name
        #[arg(long, short)]
        session: Option<String>,
    },
}

/// Task types for layout optimization
#[derive(Debug, Copy, Clone, PartialEq, Eq, ValueEnum)]
pub enum TaskType {
    /// Coding: Editor + Test + Log (vertical split)
    Coding,
    /// Monitoring: Multiple Coordinator status display
    Monitoring,
    /// Debugging: Log-heavy 3-way split
    Debugging,
    /// Coordination: All Coordinators parallel view
    Coordination,
    /// Review: Code diff + PR comments view
    Review,
    /// Agent: Multi-agent dashboard view
    Agent,
}

impl TmuxCommand {
    /// Execute the tmux command
    pub async fn execute(&self) -> Result<()> {
        match self {
            TmuxCommand::Optimize { r#for, session } => optimize_layout(*r#for, session.clone()).await,
            TmuxCommand::List => list_layouts().await,
            TmuxCommand::Status => show_status().await,
            TmuxCommand::Apply { layout, session } => apply_layout(layout.clone(), session.clone()).await,
            TmuxCommand::Save { output, session } => save_layout(output.clone(), session.clone()).await,
            TmuxCommand::Reset { session } => reset_layout(session.clone()).await,
        }
    }
}

/// Check if tmux is available and running
fn check_tmux() -> Result<bool> {
    let output = Command::new("tmux")
        .arg("list-sessions")
        .output()
        .map_err(|e| CliError::ExecutionError(format!("Failed to check tmux: {}", e)))?;

    Ok(output.status.success())
}

/// Get current session name
fn get_current_session() -> Result<String> {
    let output = Command::new("tmux")
        .args(["display-message", "-p", "#S"])
        .output()
        .map_err(|e| CliError::ExecutionError(format!("Failed to get session: {}", e)))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Ok("miyabi".to_string())
    }
}

/// Optimize layout for a specific task type
async fn optimize_layout(task_type: TaskType, session: Option<String>) -> Result<()> {
    println!();
    println!("{}", "🎯 Tmux Layout Optimizer".cyan().bold());
    println!();

    if !check_tmux()? {
        println!("  {} tmux is not running. Start a session first:", "⚠️".yellow());
        println!("    {}", "tmux new-session -s miyabi".dimmed());
        return Ok(());
    }

    let session_name = session.unwrap_or_else(|| get_current_session().unwrap_or("miyabi".to_string()));
    let layout = get_layout_for_task(task_type);

    println!("  {} Optimizing for: {}", "📋".green(), format!("{:?}", task_type).bold());
    println!("  {} Session: {}", "📺".blue(), session_name);
    println!("  {} Layout: {}", "🔧".yellow(), layout.description);
    println!();

    // Apply the layout
    apply_task_layout(&session_name, task_type, &layout)?;

    println!("{}", "✅ Layout optimized successfully!".green().bold());
    println!();
    println!("{}", "💡 Windows created:".cyan());
    for (i, window) in layout.windows.iter().enumerate() {
        println!("  {}. {} - {}", i + 1, window.name.bold(), window.description);
    }

    Ok(())
}

/// Layout definition for a task
struct TaskLayout {
    description: &'static str,
    windows: Vec<WindowConfig>,
}

struct WindowConfig {
    name: &'static str,
    description: &'static str,
    panes: Vec<PaneConfig>,
}

struct PaneConfig {
    command: &'static str,
    size_percent: u32,
    split: SplitDirection,
}

#[derive(Clone, Copy)]
enum SplitDirection {
    None,
    Horizontal,
    Vertical,
}

/// Get layout configuration for a task type
fn get_layout_for_task(task_type: TaskType) -> TaskLayout {
    match task_type {
        TaskType::Coding => TaskLayout {
            description: "Editor + Test + Log (3-pane vertical)",
            windows: vec![
                WindowConfig {
                    name: "editor",
                    description: "Main code editor",
                    panes: vec![PaneConfig {
                        command: "$EDITOR .",
                        size_percent: 100,
                        split: SplitDirection::None,
                    }],
                },
                WindowConfig {
                    name: "test",
                    description: "Test runner",
                    panes: vec![
                        PaneConfig {
                            command: "cargo watch -x test",
                            size_percent: 70,
                            split: SplitDirection::None,
                        },
                        PaneConfig {
                            command: "tail -f /tmp/miyabi.log 2>/dev/null || echo 'No log file'",
                            size_percent: 30,
                            split: SplitDirection::Horizontal,
                        },
                    ],
                },
                WindowConfig {
                    name: "git",
                    description: "Git operations",
                    panes: vec![PaneConfig {
                        command: "git status",
                        size_percent: 100,
                        split: SplitDirection::None,
                    }],
                },
            ],
        },
        TaskType::Monitoring => TaskLayout {
            description: "Multi-coordinator status display",
            windows: vec![
                WindowConfig {
                    name: "status",
                    description: "Coordinator status dashboard",
                    panes: vec![
                        PaneConfig {
                            command: "watch -n 5 'miyabi status'",
                            size_percent: 50,
                            split: SplitDirection::None,
                        },
                        PaneConfig {
                            command: "htop -t",
                            size_percent: 50,
                            split: SplitDirection::Horizontal,
                        },
                    ],
                },
                WindowConfig {
                    name: "logs",
                    description: "Log aggregation",
                    panes: vec![
                        PaneConfig {
                            command: "tail -f /tmp/miyabi-coordinator-*.log 2>/dev/null || echo 'No coordinator logs'",
                            size_percent: 50,
                            split: SplitDirection::None,
                        },
                        PaneConfig {
                            command: "tail -f /tmp/miyabi-agent-*.log 2>/dev/null || echo 'No agent logs'",
                            size_percent: 50,
                            split: SplitDirection::Horizontal,
                        },
                    ],
                },
                WindowConfig {
                    name: "alerts",
                    description: "Alert monitoring",
                    panes: vec![PaneConfig {
                        command: "watch -n 10 'gh api repos/{owner}/{repo}/actions/runs --jq \".workflow_runs[:5][] | .name + \\\" - \\\" + .status\"' 2>/dev/null || echo 'No alerts'",
                        size_percent: 100,
                        split: SplitDirection::None,
                    }],
                },
            ],
        },
        TaskType::Debugging => TaskLayout {
            description: "Log-focused 3-way split",
            windows: vec![
                WindowConfig {
                    name: "debug",
                    description: "Debug console",
                    panes: vec![
                        PaneConfig {
                            command: "# Debug console - run your debug commands here",
                            size_percent: 40,
                            split: SplitDirection::None,
                        },
                        PaneConfig {
                            command: "RUST_BACKTRACE=1 cargo run 2>&1 | tee /tmp/debug.log",
                            size_percent: 60,
                            split: SplitDirection::Horizontal,
                        },
                    ],
                },
                WindowConfig {
                    name: "logs",
                    description: "Log analysis",
                    panes: vec![
                        PaneConfig {
                            command: "tail -f /tmp/miyabi.log 2>/dev/null || echo 'Waiting for logs...'",
                            size_percent: 50,
                            split: SplitDirection::None,
                        },
                        PaneConfig {
                            command: "# Error filter - pipe logs through here",
                            size_percent: 50,
                            split: SplitDirection::Vertical,
                        },
                    ],
                },
                WindowConfig {
                    name: "trace",
                    description: "Stack trace analysis",
                    panes: vec![PaneConfig {
                        command: "# Stack trace viewer",
                        size_percent: 100,
                        split: SplitDirection::None,
                    }],
                },
            ],
        },
        TaskType::Coordination => TaskLayout {
            description: "All coordinators parallel view",
            windows: vec![
                WindowConfig {
                    name: "coordinators",
                    description: "Coordinator grid view",
                    panes: vec![
                        PaneConfig {
                            command: "# Coordinator 1 (MUGEN)",
                            size_percent: 33,
                            split: SplitDirection::None,
                        },
                        PaneConfig {
                            command: "# Coordinator 2 (MAJIN)",
                            size_percent: 33,
                            split: SplitDirection::Horizontal,
                        },
                        PaneConfig {
                            command: "# Coordinator 3 (Local)",
                            size_percent: 34,
                            split: SplitDirection::Horizontal,
                        },
                    ],
                },
                WindowConfig {
                    name: "orchestrator",
                    description: "Orchestrator control",
                    panes: vec![
                        PaneConfig {
                            command: "miyabi loop status",
                            size_percent: 60,
                            split: SplitDirection::None,
                        },
                        PaneConfig {
                            command: "watch -n 5 'gh issue list --limit 10 --state open'",
                            size_percent: 40,
                            split: SplitDirection::Horizontal,
                        },
                    ],
                },
            ],
        },
        TaskType::Review => TaskLayout {
            description: "Code review layout",
            windows: vec![
                WindowConfig {
                    name: "diff",
                    description: "Code diff view",
                    panes: vec![
                        PaneConfig {
                            command: "git diff --stat HEAD~1",
                            size_percent: 70,
                            split: SplitDirection::None,
                        },
                        PaneConfig {
                            command: "gh pr list",
                            size_percent: 30,
                            split: SplitDirection::Horizontal,
                        },
                    ],
                },
                WindowConfig {
                    name: "comments",
                    description: "PR comments",
                    panes: vec![PaneConfig {
                        command: "# PR comments viewer",
                        size_percent: 100,
                        split: SplitDirection::None,
                    }],
                },
                WindowConfig {
                    name: "test",
                    description: "Test verification",
                    panes: vec![PaneConfig {
                        command: "cargo test --no-fail-fast 2>&1 | head -100",
                        size_percent: 100,
                        split: SplitDirection::None,
                    }],
                },
            ],
        },
        TaskType::Agent => TaskLayout {
            description: "Multi-agent dashboard",
            windows: vec![
                WindowConfig {
                    name: "agents",
                    description: "Agent status grid",
                    panes: vec![
                        PaneConfig {
                            command: "watch -n 2 'ls -la .worktrees/ 2>/dev/null || echo \"No worktrees\"'",
                            size_percent: 50,
                            split: SplitDirection::None,
                        },
                        PaneConfig {
                            command: "miyabi status",
                            size_percent: 50,
                            split: SplitDirection::Vertical,
                        },
                    ],
                },
                WindowConfig {
                    name: "issues",
                    description: "Issue tracker",
                    panes: vec![
                        PaneConfig {
                            command: "gh issue list --state open --limit 20",
                            size_percent: 60,
                            split: SplitDirection::None,
                        },
                        PaneConfig {
                            command: "gh pr list --limit 10",
                            size_percent: 40,
                            split: SplitDirection::Horizontal,
                        },
                    ],
                },
                WindowConfig {
                    name: "exec",
                    description: "Agent execution",
                    panes: vec![PaneConfig {
                        command: "# Run agents here: miyabi agent <type> --issue <num>",
                        size_percent: 100,
                        split: SplitDirection::None,
                    }],
                },
            ],
        },
    }
}

/// Apply layout for a task
fn apply_task_layout(session: &str, _task_type: TaskType, layout: &TaskLayout) -> Result<()> {
    // Kill existing windows in the session (except the first one)
    let _ = Command::new("tmux")
        .args(["kill-window", "-t", &format!("{}:1", session)])
        .output();
    let _ = Command::new("tmux")
        .args(["kill-window", "-t", &format!("{}:2", session)])
        .output();
    let _ = Command::new("tmux")
        .args(["kill-window", "-t", &format!("{}:3", session)])
        .output();

    // Create windows according to layout
    for (i, window) in layout.windows.iter().enumerate() {
        if i == 0 {
            // Rename the first window
            Command::new("tmux")
                .args(["rename-window", "-t", &format!("{}:0", session), window.name])
                .output()
                .map_err(|e| CliError::ExecutionError(format!("Failed to rename window: {}", e)))?;

            // Send the first command
            if let Some(first_pane) = window.panes.first() {
                Command::new("tmux")
                    .args([
                        "send-keys",
                        "-t",
                        &format!("{}:0", session),
                        first_pane.command,
                        "Enter",
                    ])
                    .output()
                    .ok();
            }

            // Create additional panes in first window
            for (j, pane) in window.panes.iter().skip(1).enumerate() {
                let split_opt = match pane.split {
                    SplitDirection::Horizontal => "-v",
                    SplitDirection::Vertical => "-h",
                    SplitDirection::None => "-v",
                };

                Command::new("tmux")
                    .args([
                        "split-window",
                        split_opt,
                        "-t",
                        &format!("{}:0.{}", session, j),
                        "-p",
                        &pane.size_percent.to_string(),
                    ])
                    .output()
                    .ok();

                Command::new("tmux")
                    .args([
                        "send-keys",
                        "-t",
                        &format!("{}:0.{}", session, j + 1),
                        pane.command,
                        "Enter",
                    ])
                    .output()
                    .ok();
            }
        } else {
            // Create new window
            Command::new("tmux")
                .args(["new-window", "-t", session, "-n", window.name])
                .output()
                .map_err(|e| CliError::ExecutionError(format!("Failed to create window: {}", e)))?;

            // Send first command
            if let Some(first_pane) = window.panes.first() {
                Command::new("tmux")
                    .args([
                        "send-keys",
                        "-t",
                        &format!("{}:{}", session, window.name),
                        first_pane.command,
                        "Enter",
                    ])
                    .output()
                    .ok();
            }

            // Create additional panes
            for (j, pane) in window.panes.iter().skip(1).enumerate() {
                let split_opt = match pane.split {
                    SplitDirection::Horizontal => "-v",
                    SplitDirection::Vertical => "-h",
                    SplitDirection::None => "-v",
                };

                Command::new("tmux")
                    .args([
                        "split-window",
                        split_opt,
                        "-t",
                        &format!("{}:{}.{}", session, window.name, j),
                        "-p",
                        &pane.size_percent.to_string(),
                    ])
                    .output()
                    .ok();

                Command::new("tmux")
                    .args([
                        "send-keys",
                        "-t",
                        &format!("{}:{}.{}", session, window.name, j + 1),
                        pane.command,
                        "Enter",
                    ])
                    .output()
                    .ok();
            }
        }
    }

    // Select first window
    Command::new("tmux")
        .args(["select-window", "-t", &format!("{}:0", session)])
        .output()
        .ok();

    Ok(())
}

/// List available layouts
async fn list_layouts() -> Result<()> {
    println!();
    println!("{}", "📋 Available Tmux Layouts".cyan().bold());
    println!();

    let layouts = vec![
        ("coding", "Editor + Test + Log (3-pane vertical)", "Development workflow"),
        ("monitoring", "Multi-coordinator status display", "System monitoring"),
        ("debugging", "Log-focused 3-way split", "Bug investigation"),
        ("coordination", "All coordinators parallel view", "Multi-agent orchestration"),
        ("review", "Code diff + PR comments view", "Code review workflow"),
        ("agent", "Multi-agent dashboard", "Agent management"),
    ];

    for (name, description, use_case) in layouts {
        println!("  {} {}", "•".green(), name.bold());
        println!("    {}", description.dimmed());
        println!("    {}: {}", "Use case".cyan(), use_case);
        println!();
    }

    println!("{}", "💡 Usage:".cyan());
    println!("  miyabi tmux optimize --for=<layout>");
    println!();

    Ok(())
}

/// Show tmux status
async fn show_status() -> Result<()> {
    println!();
    println!("{}", "📺 Tmux Status".cyan().bold());
    println!();

    if !check_tmux()? {
        println!("  {} tmux is not running", "⚠️".yellow());
        return Ok(());
    }

    // List sessions
    let output = Command::new("tmux")
        .args([
            "list-sessions",
            "-F",
            "#{session_name}: #{session_windows} windows, #{session_attached} attached",
        ])
        .output()
        .map_err(|e| CliError::ExecutionError(format!("Failed to list sessions: {}", e)))?;

    if output.status.success() {
        println!("{}", "Sessions:".cyan());
        for line in String::from_utf8_lossy(&output.stdout).lines() {
            println!("  {} {}", "•".green(), line);
        }
    }

    println!();

    // List windows in current session
    let output = Command::new("tmux")
        .args([
            "list-windows",
            "-F",
            "#{window_index}: #{window_name} (#{window_panes} panes)",
        ])
        .output()
        .map_err(|e| CliError::ExecutionError(format!("Failed to list windows: {}", e)))?;

    if output.status.success() {
        println!("{}", "Windows:".cyan());
        for line in String::from_utf8_lossy(&output.stdout).lines() {
            println!("  {} {}", "•".blue(), line);
        }
    }

    println!();
    Ok(())
}

/// Apply a layout from file
async fn apply_layout(layout_path: PathBuf, session: Option<String>) -> Result<()> {
    println!();
    println!("{}", "🔧 Applying Layout".cyan().bold());
    println!();

    if !layout_path.exists() {
        return Err(CliError::NotFound(format!("Layout file not found: {}", layout_path.display())));
    }

    let session_name = session.unwrap_or_else(|| get_current_session().unwrap_or("miyabi".to_string()));

    // Source the layout file (tmux conf format)
    let output = Command::new("tmux")
        .args(["source-file", layout_path.to_str().unwrap_or("")])
        .output()
        .map_err(|e| CliError::ExecutionError(format!("Failed to apply layout: {}", e)))?;

    if output.status.success() {
        println!("  {} Layout applied from: {}", "✅".green(), layout_path.display());
        println!("  {} Session: {}", "📺".blue(), session_name);
    } else {
        println!("  {} Failed to apply layout", "❌".red());
        println!("  {}", String::from_utf8_lossy(&output.stderr).dimmed());
    }

    println!();
    Ok(())
}

/// Save current layout to file
async fn save_layout(output_path: PathBuf, session: Option<String>) -> Result<()> {
    println!();
    println!("{}", "💾 Saving Layout".cyan().bold());
    println!();

    let session_name = session.unwrap_or_else(|| get_current_session().unwrap_or("miyabi".to_string()));

    // Get window list
    let windows = Command::new("tmux")
        .args([
            "list-windows",
            "-t",
            &session_name,
            "-F",
            "#{window_index}:#{window_name}:#{window_layout}",
        ])
        .output()
        .map_err(|e| CliError::ExecutionError(format!("Failed to get windows: {}", e)))?;

    let mut layout_content = String::new();
    layout_content.push_str(&format!(
        "# Miyabi Tmux Layout\n# Session: {}\n# Generated: {}\n\n",
        session_name,
        chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC")
    ));

    for line in String::from_utf8_lossy(&windows.stdout).lines() {
        let parts: Vec<&str> = line.split(':').collect();
        if parts.len() >= 3 {
            let idx = parts[0];
            let name = parts[1];
            let window_layout = parts[2..].join(":");
            layout_content.push_str(&format!(
                "# Window {}: {}\nselect-window -t :{}\nselect-layout \"{}\"\n\n",
                idx, name, idx, window_layout
            ));
        }
    }

    std::fs::write(&output_path, layout_content).map_err(|e| CliError::ExecutionError(format!("IO error: {}", e)))?;

    println!("  {} Layout saved to: {}", "✅".green(), output_path.display());
    println!();

    Ok(())
}

/// Reset to default layout
async fn reset_layout(session: Option<String>) -> Result<()> {
    println!();
    println!("{}", "🔄 Resetting Layout".cyan().bold());
    println!();

    let session_name = session.unwrap_or_else(|| get_current_session().unwrap_or("miyabi".to_string()));

    // Apply even-horizontal layout to all windows
    let output = Command::new("tmux")
        .args(["list-windows", "-t", &session_name, "-F", "#{window_index}"])
        .output()
        .map_err(|e| CliError::ExecutionError(format!("Failed to list windows: {}", e)))?;

    for line in String::from_utf8_lossy(&output.stdout).lines() {
        Command::new("tmux")
            .args([
                "select-layout",
                "-t",
                &format!("{}:{}", session_name, line),
                "even-horizontal",
            ])
            .output()
            .ok();
    }

    println!("  {} Layout reset for session: {}", "✅".green(), session_name);
    println!();

    Ok(())
}
