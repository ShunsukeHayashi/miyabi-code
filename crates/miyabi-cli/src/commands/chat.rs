//! Interactive chat REPL for Miyabi
//!
//! Provides an interactive command-line interface for conversing with Miyabi.
//! Supports slash commands for configuration and control.

use crate::error::{CliError, Result};
use colored::Colorize;
use miyabi_core::{ExecutionMode, Session, TaskExecutor};
use rustyline::error::ReadlineError;
use rustyline::{DefaultEditor, Result as RustylineResult};
use std::path::PathBuf;

/// Chat command for interactive REPL
#[derive(Debug, Clone)]
pub struct ChatCommand {
    /// Execution mode (can be changed with /mode command)
    mode: ExecutionMode,
    /// LLM model name
    model: String,
    /// Working directory
    working_dir: PathBuf,
    /// Show verbose output
    verbose: bool,
}

impl ChatCommand {
    /// Create a new chat command
    pub fn new() -> Self {
        Self {
            mode: ExecutionMode::ReadOnly,
            model: "claude-3-5-sonnet-20241022".to_string(),
            working_dir: std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")),
            verbose: false,
        }
    }

    /// Set execution mode
    pub fn with_mode(mut self, mode: ExecutionMode) -> Self {
        self.mode = mode;
        self
    }

    /// Set model
    pub fn with_model(mut self, model: String) -> Self {
        self.model = model;
        self
    }

    /// Set verbose output
    pub fn with_verbose(mut self, verbose: bool) -> Self {
        self.verbose = verbose;
        self
    }

    /// Run the interactive REPL
    pub async fn run(&self) -> Result<()> {
        self.print_welcome();

        let mut rl = DefaultEditor::new()
            .map_err(|e| CliError::Other(format!("Failed to create editor: {}", e)))?;

        // Load history
        let history_path = self.get_history_path()?;
        let _ = rl.load_history(&history_path); // Ignore if file doesn't exist

        let mut mode = self.mode.clone();
        let mut session: Option<Session> = None;

        loop {
            let prompt = self.build_prompt(&mode, &session);
            let readline = rl.readline(&prompt);

            match readline {
                Ok(line) => {
                    let line = line.trim();

                    // Skip empty lines
                    if line.is_empty() {
                        continue;
                    }

                    // Add to history
                    let _ = rl.add_history_entry(line);

                    // Handle slash commands
                    if line.starts_with('/') {
                        match self.handle_slash_command(line, &mut mode, &mut session).await {
                            Ok(should_exit) => {
                                if should_exit {
                                    break;
                                }
                            }
                            Err(e) => {
                                eprintln!("{} {}", "Error:".red().bold(), e);
                            }
                        }
                        continue;
                    }

                    // Regular chat message - execute as task
                    match self.execute_task(line, &mode, &mut session).await {
                        Ok(()) => {}
                        Err(e) => {
                            eprintln!("{} {}", "Error:".red().bold(), e);
                        }
                    }
                }
                Err(ReadlineError::Interrupted) => {
                    println!("{}", "^C - Use /exit to quit".yellow());
                    continue;
                }
                Err(ReadlineError::Eof) => {
                    println!("{}", "EOF - Exiting...".yellow());
                    break;
                }
                Err(err) => {
                    eprintln!("{} {}", "Error:".red().bold(), err);
                    break;
                }
            }
        }

        // Save history
        let _ = rl.save_history(&history_path);

        self.print_goodbye();
        Ok(())
    }

    /// Print welcome message
    fn print_welcome(&self) {
        println!("\n{}", "🌸 Miyabi Interactive Chat".cyan().bold());
        println!("{}", "─".repeat(50).cyan());
        println!("Type {} for help, {} to exit", "/help".green(), "/exit".green());
        println!("{}\n", "─".repeat(50).cyan());
    }

    /// Print goodbye message
    fn print_goodbye(&self) {
        println!("\n{}", "Goodbye! 👋".cyan());
    }

    /// Build prompt string
    fn build_prompt(&self, mode: &ExecutionMode, session: &Option<Session>) -> String {
        let mode_str = match mode {
            ExecutionMode::ReadOnly => "RO".blue(),
            ExecutionMode::FileEdits => "FE".yellow(),
            ExecutionMode::FullAccess => "FA".red(),
            ExecutionMode::Interactive => "IA".magenta(),
        };

        let session_indicator = if session.is_some() {
            " 📝".to_string()
        } else {
            String::new()
        };

        format!("miyabi [{}]{} > ", mode_str, session_indicator)
    }

    /// Handle slash commands
    async fn handle_slash_command(
        &self,
        command: &str,
        mode: &mut ExecutionMode,
        session: &mut Option<Session>,
    ) -> Result<bool> {
        let parts: Vec<&str> = command[1..].split_whitespace().collect();

        if parts.is_empty() {
            return Ok(false);
        }

        match parts[0] {
            "help" | "h" => {
                self.print_help();
                Ok(false)
            }
            "exit" | "quit" | "q" => Ok(true),
            "mode" => {
                if parts.len() < 2 {
                    println!("{} Usage: /mode <readonly|fileedits|fullaccess>", "Error:".red());
                    return Ok(false);
                }

                *mode = match parts[1].to_lowercase().as_str() {
                    "readonly" | "ro" => ExecutionMode::ReadOnly,
                    "fileedits" | "fe" => ExecutionMode::FileEdits,
                    "fullaccess" | "fa" => ExecutionMode::FullAccess,
                    "interactive" | "ia" => ExecutionMode::Interactive,
                    _ => {
                        println!("{} Invalid mode: {}", "Error:".red(), parts[1]);
                        return Ok(false);
                    }
                };

                println!("{} Mode changed to {:?}", "✓".green(), mode);
                Ok(false)
            }
            "session" => {
                if let Some(ref sess) = session {
                    println!("{}", "Current Session:".cyan().bold());
                    println!("  ID: {}", sess.id);
                    println!("  Task: {}", sess.task);
                    println!("  Status: {:?}", sess.status);
                    println!("  Turns: {}", sess.turns.len());
                } else {
                    println!("{}", "No active session".yellow());
                }
                Ok(false)
            }
            "clear" | "cls" => {
                print!("\x1B[2J\x1B[1;1H"); // ANSI clear screen
                self.print_welcome();
                Ok(false)
            }
            "new" => {
                *session = None;
                println!("{} Session cleared", "✓".green());
                Ok(false)
            }
            _ => {
                println!("{} Unknown command: {}", "Error:".red(), parts[0]);
                println!("Type {} for help", "/help".green());
                Ok(false)
            }
        }
    }

    /// Print help message
    fn print_help(&self) {
        println!("\n{}", "Available Commands:".cyan().bold());
        println!("{}", "─".repeat(50).cyan());
        println!("  {}  - Show this help message", "/help".green());
        println!("  {}  - Exit the chat", "/exit, /quit".green());
        println!("  {}  - Change execution mode", "/mode <mode>".green());
        println!("           readonly (ro)    - Read files only");
        println!("           fileedits (fe)   - Allow file edits");
        println!("           fullaccess (fa)  - Allow commands");
        println!("  {}  - Show current session info", "/session".green());
        println!("  {}  - Clear screen", "/clear".green());
        println!("  {}  - Start new conversation", "/new".green());
        println!("\n{}", "Execution Modes:".cyan().bold());
        println!("  {} - Can read files, search code", "ReadOnly".blue());
        println!("  {} - Can also write/edit files", "FileEdits".yellow());
        println!("  {} - Can also run commands", "FullAccess".red());
        println!("{}\n", "─".repeat(50).cyan());
    }

    /// Execute a task
    async fn execute_task(
        &self,
        task: &str,
        mode: &ExecutionMode,
        session: &mut Option<Session>,
    ) -> Result<()> {
        println!("\n{} Executing task...", "🤖".cyan());

        // Create or reuse session
        let sess = if let Some(ref mut existing) = session {
            // Add new turn to existing session
            existing.add_turn(task.to_string());
            existing.clone()
        } else {
            // Create new session
            let new_session = Session::new(task.to_string(), mode.clone());
            *session = Some(new_session.clone());
            new_session
        };

        // Execute with TaskExecutor
        let mut executor = TaskExecutor::new(sess)
            .map_err(|e| CliError::Other(format!("Failed to create executor: {}", e)))?;

        match executor.run().await {
            Ok(()) => {
                // Update session with completed state
                *session = Some(executor.session().clone());

                println!("\n{} Task completed!", "✅".green());

                // Show session info
                if let Some(ref sess) = session {
                    println!("  Session: {}", sess.id.cyan());
                    println!("  Turns: {}", sess.turns.len());
                }
            }
            Err(e) => {
                // Update session with failed state
                *session = Some(executor.session().clone());

                return Err(CliError::Other(format!("Task execution failed: {}", e)));
            }
        }

        Ok(())
    }

    /// Get history file path
    fn get_history_path(&self) -> Result<PathBuf> {
        let home = dirs::home_dir()
            .ok_or_else(|| CliError::Other("Could not find home directory".to_string()))?;

        let miyabi_dir = home.join(".miyabi");
        std::fs::create_dir_all(&miyabi_dir)
            .map_err(|e| CliError::Other(format!("Failed to create .miyabi dir: {}", e)))?;

        Ok(miyabi_dir.join("chat_history.txt"))
    }
}

impl Default for ChatCommand {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_chat_command_creation() {
        let cmd = ChatCommand::new();
        assert!(matches!(cmd.mode, ExecutionMode::ReadOnly));
    }

    #[test]
    fn test_with_mode() {
        let cmd = ChatCommand::new().with_mode(ExecutionMode::FullAccess);
        assert!(matches!(cmd.mode, ExecutionMode::FullAccess));
    }
}
