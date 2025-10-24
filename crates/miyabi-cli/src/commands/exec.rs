//! `miyabi exec` - Autonomous Code Agent Execution
//!
//! Inspired by OpenAI Codex CLI's `codex exec` command.
//! Allows autonomous task execution with LLM-driven code generation and execution.

use crate::error::{CliError, Result};
use colored::Colorize;
use miyabi_core::{ExecutionMode, Session, SessionStatus, TaskExecutor};
use std::io::Write;

pub struct ExecCommand {
    /// Task description (e.g., "count lines of code")
    task: String,

    /// Execution mode
    mode: ExecutionMode,

    /// Output as JSON Lines
    json: bool,

    /// Resume from session ID
    resume: Option<String>,

    /// Resume from last session
    resume_last: bool,

    /// Output schema for structured output (optional)
    output_schema: Option<String>,
}

impl ExecCommand {
    pub fn new(task: String) -> Self {
        Self {
            task,
            mode: ExecutionMode::ReadOnly,
            json: false,
            resume: None,
            resume_last: false,
            output_schema: None,
        }
    }

    pub fn with_full_auto(mut self) -> Self {
        self.mode = ExecutionMode::FileEdits;
        self
    }

    pub fn with_full_access(mut self) -> Self {
        self.mode = ExecutionMode::FullAccess;
        self
    }

    pub fn with_json_output(mut self) -> Self {
        self.json = true;
        self
    }

    pub fn with_resume(mut self, session_id: String) -> Self {
        self.resume = Some(session_id);
        self
    }

    pub fn with_resume_last(mut self) -> Self {
        self.resume_last = true;
        self
    }

    pub async fn execute(&self) -> Result<()> {
        // Resume existing session or create new one
        let mut session = if let Some(ref session_id) = self.resume {
            Session::load(session_id).map_err(|e| CliError::SessionError(e.to_string()))?
        } else if self.resume_last {
            Session::load_last().map_err(|e| CliError::SessionError(e.to_string()))?
        } else {
            Session::new(self.task.clone(), self.mode.clone())
        };

        if self.json {
            // JSONL output mode
            self.execute_with_jsonl(&mut session).await?;
        } else {
            // Human-readable output mode
            self.execute_with_human_output(&mut session).await?;
        }

        Ok(())
    }

    async fn execute_with_human_output(&self, session: &mut Session) -> Result<()> {
        // Print header
        println!();
        println!("{}", "🌸 Miyabi Autonomous Agent".cyan().bold());
        println!("{}", "─".repeat(60).dimmed());
        println!();
        println!("  {} {}", "Task:".bold(), session.task);
        println!("  {} {:?}", "Mode:".bold(), session.mode);
        println!("  {} {}", "Session:".dimmed(), session.id.dimmed());
        println!();

        // Create executor and run
        let mut executor = TaskExecutor::new(session.clone())
            .map_err(|e| CliError::Unknown(e.to_string()))?;

        executor.run().await
            .map_err(|e| CliError::Unknown(e.to_string()))?;

        // Get updated session from executor
        *session = executor.session().clone();

        // Print summary
        println!();
        println!("{}", "─".repeat(60).dimmed());
        match &session.status {
            SessionStatus::Completed => {
                println!("{} Task completed successfully!", "✅".green());
            }
            SessionStatus::Failed { error, .. } => {
                println!("{} Task failed: {}", "❌".red(), error);
                println!();
                println!("{}", "Resume with:".yellow());
                println!("  miyabi exec-resume {}", session.id);
            }
            _ => {}
        }
        println!();
        println!("  {} {}", "Session ID:".dimmed(), session.id);
        println!();

        Ok(())
    }

    async fn execute_with_jsonl(&self, session: &mut Session) -> Result<()> {
        // Create executor with JSONL output enabled
        let mut executor = TaskExecutor::new(session.clone())
            .map_err(|e| CliError::Unknown(e.to_string()))?
            .with_jsonl_output(true);

        // Run the executor (will emit JSONL events automatically)
        executor.run().await
            .map_err(|e| CliError::Unknown(e.to_string()))?;

        // Get updated session from executor
        *session = executor.session().clone();

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_exec_command_creation() {
        let cmd = ExecCommand::new("test task".to_string());
        assert_eq!(cmd.task, "test task");
        assert_eq!(cmd.mode, ExecutionMode::ReadOnly);
    }

    #[test]
    fn test_exec_command_with_full_auto() {
        let cmd = ExecCommand::new("test".to_string()).with_full_auto();
        assert_eq!(cmd.mode, ExecutionMode::FileEdits);
    }

    #[test]
    fn test_exec_command_with_full_access() {
        let cmd = ExecCommand::new("test".to_string()).with_full_access();
        assert_eq!(cmd.mode, ExecutionMode::FullAccess);
    }
}
