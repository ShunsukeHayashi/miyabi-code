//! Session management commands
//!
//! Provides CLI interface to SessionManager for viewing and managing
//! Agent execution sessions.

use crate::error::Result;
use chrono::Utc;
use clap::Subcommand;
use colored::Colorize;
use miyabi_session_manager::SessionManager;
use std::path::PathBuf;
use uuid::Uuid;

pub struct SessionCommand {
    pub subcommand: SessionSubcommand,
}

#[derive(Subcommand, Clone)]
pub enum SessionSubcommand {
    /// List all sessions
    List {
        /// Filter by status (running, completed, failed, handed_off)
        #[arg(long)]
        status: Option<String>,

        /// Limit number of results
        #[arg(long, default_value = "20")]
        limit: usize,
    },

    /// Get detailed session information
    Get {
        /// Session ID (UUID)
        session_id: String,
    },

    /// Show session statistics
    Stats,

    /// Show session lineage (ancestry tree)
    Lineage {
        /// Session ID (UUID)
        session_id: String,
    },

    /// Monitor session status
    Monitor {
        /// Session ID (UUID)
        session_id: String,
    },

    /// Terminate running session
    Terminate {
        /// Session ID (UUID)
        session_id: String,
    },
}

impl SessionCommand {
    pub fn new(subcommand: SessionSubcommand) -> Self {
        Self { subcommand }
    }

    pub async fn execute(&self) -> Result<()> {
        match &self.subcommand {
            SessionSubcommand::List { status, limit } => {
                self.list_sessions(status.clone(), *limit).await
            }
            SessionSubcommand::Get { session_id } => self.get_session(session_id).await,
            SessionSubcommand::Stats => self.show_stats().await,
            SessionSubcommand::Lineage { session_id } => self.show_lineage(session_id).await,
            SessionSubcommand::Monitor { session_id } => self.monitor_session(session_id).await,
            SessionSubcommand::Terminate { session_id } => self.terminate_session(session_id).await,
        }
    }

    async fn get_session_manager(&self) -> Result<SessionManager> {
        let sessions_dir = PathBuf::from(".ai/sessions");
        SessionManager::new(sessions_dir.to_str().unwrap())
            .await
            .map_err(|e| crate::error::CliError::Other(e.to_string()))
    }

    async fn list_sessions(&self, status: Option<String>, limit: usize) -> Result<()> {
        println!("{}", "📋 Session List".cyan().bold());
        println!();

        let manager = self.get_session_manager().await?;
        let sessions = manager.list_active_sessions();

        // Filter by status if specified
        let filtered: Vec<_> = if let Some(status_filter) = status {
            sessions
                .into_iter()
                .filter(|s| {
                    format!("{:?}", s.status)
                        .to_lowercase()
                        .contains(&status_filter.to_lowercase())
                })
                .take(limit)
                .collect()
        } else {
            sessions.into_iter().take(limit).collect()
        };

        if filtered.is_empty() {
            println!("  No sessions found");
            return Ok(());
        }

        println!("  Found {} session(s):", filtered.len());
        println!();

        for (i, session) in filtered.iter().enumerate() {
            let age = Utc::now().signed_duration_since(session.created_at);
            let age_str = if age.num_days() > 0 {
                format!("{}d ago", age.num_days())
            } else if age.num_hours() > 0 {
                format!("{}h ago", age.num_hours())
            } else {
                format!("{}m ago", age.num_minutes())
            };

            let status_color = match format!("{:?}", session.status).as_str() {
                s if s.contains("Active") => "Active".green(),
                s if s.contains("Completed") => "Completed".blue(),
                s if s.contains("Failed") => "Failed".red(),
                s if s.contains("HandedOff") => "HandedOff".yellow(),
                _ => "Unknown".white(),
            };

            println!(
                "  {}. {} {} ({})",
                (i + 1).to_string().dimmed(),
                session.id.to_string().cyan(),
                status_color,
                age_str.dimmed()
            );
            println!("     Agent: {}", session.agent_name.green());
            println!("     Purpose: {}", session.purpose);

            if let Some(parent) = &session.parent_session {
                println!("     Parent: {}", parent.to_string().dimmed());
            }

            if !session.child_sessions.is_empty() {
                println!(
                    "     Children: {}",
                    session.child_sessions.len().to_string().yellow()
                );
            }

            println!();
        }

        Ok(())
    }

    async fn get_session(&self, session_id: &str) -> Result<()> {
        println!("{}", "🔍 Session Details".cyan().bold());
        println!();

        let manager = self.get_session_manager().await?;
        let uuid = Uuid::parse_str(session_id)
            .map_err(|_| crate::error::CliError::Other("Invalid session UUID".to_string()))?;

        let session = manager
            .get_session(uuid)
            .map_err(|e| crate::error::CliError::Other(e.to_string()))?;

        println!("  ID: {}", session.id.to_string().cyan());
        println!("  Agent: {}", session.agent_name.green());
        println!("  Purpose: {}", session.purpose);
        println!("  Status: {:?}", session.status);
        println!("  Created: {}", session.created_at.to_rfc3339());
        println!();

        println!("  Context:");
        if let Some(issue_num) = session.context.issue_number {
            println!("    Issue: #{}", issue_num);
        }
        println!(
            "    Phase: {}",
            format!("{:?}", session.context.current_phase).yellow()
        );
        if let Some(path) = &session.context.worktree_path {
            println!("    Worktree: {}", path.display().to_string().dimmed());
        }
        println!();

        if let Some(parent) = session.parent_session {
            println!("  Parent Session: {}", parent.to_string().dimmed());
        }

        if !session.child_sessions.is_empty() {
            println!("  Child Sessions: {}", session.child_sessions.len());
            for child_id in &session.child_sessions {
                println!("    - {}", child_id.to_string().dimmed());
            }
        }

        if let Some(handoff_to) = &session.handoff_to {
            println!("  Handed off to: {}", handoff_to.green());
        }

        if let Some(error) = &session.error_message {
            println!("  Error: {}", error.red());
        }

        Ok(())
    }

    async fn show_stats(&self) -> Result<()> {
        println!("{}", "📊 Session Statistics".cyan().bold());
        println!();

        let manager = self.get_session_manager().await?;
        let stats = manager.get_stats();

        println!(
            "  Total Sessions: {}",
            stats.total.to_string().cyan().bold()
        );
        println!("  Active: {}", stats.active.to_string().green());
        println!("  Completed: {}", stats.completed.to_string().blue());
        println!("  Failed: {}", stats.failed.to_string().red());
        println!("  Handed Off: {}", stats.handed_off.to_string().yellow());

        Ok(())
    }

    async fn show_lineage(&self, session_id: &str) -> Result<()> {
        println!("{}", "🌳 Session Lineage".cyan().bold());
        println!();

        let manager = self.get_session_manager().await?;
        let uuid = Uuid::parse_str(session_id)
            .map_err(|_| crate::error::CliError::Other("Invalid session UUID".to_string()))?;

        let lineage = manager.get_session_lineage(uuid);

        if lineage.is_empty() {
            println!("  No lineage found for session {}", session_id);
            return Ok(());
        }

        println!("  Session Lineage ({} sessions):", lineage.len());
        println!();

        for (i, session) in lineage.iter().enumerate() {
            let indent = "  ".repeat(i);
            println!(
                "{}└─ {} - {} ({:?})",
                indent,
                session.id.to_string().cyan(),
                session.agent_name.green(),
                session.status
            );
            println!("{}   Purpose: {}", indent, session.purpose);
            println!();
        }

        Ok(())
    }

    async fn monitor_session(&self, session_id: &str) -> Result<()> {
        println!("{}", "👁️  Session Monitor".cyan().bold());
        println!();

        let manager = self.get_session_manager().await?;
        let uuid = Uuid::parse_str(session_id)
            .map_err(|_| crate::error::CliError::Other("Invalid session UUID".to_string()))?;

        let session = manager
            .get_session(uuid)
            .map_err(|e| crate::error::CliError::Other(e.to_string()))?;

        println!("  Session: {}", session.id.to_string().cyan());
        println!("  Agent: {}", session.agent_name.green());
        println!("  Status: {:?}", session.status);

        let is_active = matches!(
            session.status,
            miyabi_session_manager::SessionStatus::Active
        );

        if is_active {
            println!("  State: {}", "Active".green().bold());
        } else {
            println!("  State: {}", "Not Active".dimmed());

            if let Some(error) = &session.error_message {
                println!("  Error: {}", error.red());
            }
        }

        Ok(())
    }

    async fn terminate_session(&self, session_id: &str) -> Result<()> {
        println!("{}", "⚠️  Terminate Session".yellow().bold());
        println!();

        let manager = self.get_session_manager().await?;
        let uuid = Uuid::parse_str(session_id)
            .map_err(|_| crate::error::CliError::Other("Invalid session UUID".to_string()))?;

        println!("  Terminating session: {}", session_id.cyan());

        manager
            .fail_session(uuid, "Terminated by user".to_string())
            .await
            .map_err(|e| crate::error::CliError::Other(e.to_string()))?;

        println!("  {}", "✅ Session terminated successfully".green());

        Ok(())
    }
}
