//! Approval command implementation

use clap::{Args, Subcommand};
use colored::Colorize;
use miyabi_approval::{ApprovalGate, ApprovalStore};
use miyabi_types::MiyabiError;

/// Approval management commands
#[derive(Debug, Args)]
pub struct ApprovalCommand {
    #[command(subcommand)]
    pub command: ApprovalSubcommand,
}

#[derive(Debug, Subcommand)]
pub enum ApprovalSubcommand {
    /// Approve a workflow
    Approve {
        /// Approval ID
        #[arg(short, long)]
        id: String,

        /// Approver identifier (e.g., GitHub username)
        #[arg(short = 'u', long)]
        approver: String,

        /// Optional comment
        #[arg(short, long)]
        comment: Option<String>,
    },

    /// Reject a workflow
    Reject {
        /// Approval ID
        #[arg(short, long)]
        id: String,

        /// Approver identifier (e.g., GitHub username)
        #[arg(short = 'u', long)]
        approver: String,

        /// Rejection reason
        #[arg(short, long)]
        reason: Option<String>,
    },

    /// List pending approvals
    List {
        /// Filter by approver
        #[arg(short = 'u', long)]
        approver: Option<String>,

        /// Show all approvals (not just pending)
        #[arg(short, long)]
        all: bool,
    },

    /// Show approval details
    Show {
        /// Approval ID
        #[arg(short, long)]
        id: String,
    },
}

impl ApprovalCommand {
    pub async fn execute(&self) -> Result<(), MiyabiError> {
        match &self.command {
            ApprovalSubcommand::Approve {
                id,
                approver,
                comment,
            } => {
                Self::approve(id, approver, comment.clone()).await?;
            }
            ApprovalSubcommand::Reject {
                id,
                approver,
                reason,
            } => {
                Self::reject(id, approver, reason.clone()).await?;
            }
            ApprovalSubcommand::List { approver, all } => {
                Self::list(approver.as_deref(), *all).await?;
            }
            ApprovalSubcommand::Show { id } => {
                Self::show(id).await?;
            }
        }
        Ok(())
    }

    async fn approve(
        approval_id: &str,
        approver: &str,
        comment: Option<String>,
    ) -> Result<(), MiyabiError> {
        let store = ApprovalStore::new().map_err(|e| {
            MiyabiError::Validation(format!("Failed to open approval store: {}", e))
        })?;

        // Load approval state to get gate_id
        let state = store
            .load(approval_id)
            .map_err(|e| MiyabiError::Validation(format!("Failed to load approval: {}", e)))?
            .ok_or_else(|| {
                MiyabiError::Validation(format!("Approval not found: {}", approval_id))
            })?;

        // Recreate gate (with minimal config, only need store)
        let gate = ApprovalGate::builder(&state.gate_id)
            .required_approvers(state.required_approvers.clone())
            .timeout_seconds(state.timeout_seconds)
            .build()
            .map_err(|e| MiyabiError::Validation(format!("Failed to build gate: {}", e)))?;

        // Approve
        let updated_state = gate
            .approve(approval_id, approver, comment.clone())
            .await
            .map_err(|e| MiyabiError::Validation(format!("Failed to approve: {}", e)))?;

        println!("{}", "✅ Approval recorded".green().bold());
        println!("Approval ID: {}", approval_id);
        println!("Approver: {}", approver);
        if let Some(c) = comment {
            println!("Comment: {}", c);
        }
        println!("Status: {:?}", updated_state.status);
        println!(
            "Approvals: {}/{}",
            updated_state.approval_count(),
            updated_state.required_approvers.len()
        );

        if updated_state.is_completed() {
            println!("\n{}", "🎉 Approval completed!".green().bold());
        }

        Ok(())
    }

    async fn reject(
        approval_id: &str,
        approver: &str,
        reason: Option<String>,
    ) -> Result<(), MiyabiError> {
        let store = ApprovalStore::new().map_err(|e| {
            MiyabiError::Validation(format!("Failed to open approval store: {}", e))
        })?;

        // Load approval state to get gate_id
        let state = store
            .load(approval_id)
            .map_err(|e| MiyabiError::Validation(format!("Failed to load approval: {}", e)))?
            .ok_or_else(|| {
                MiyabiError::Validation(format!("Approval not found: {}", approval_id))
            })?;

        // Recreate gate
        let gate = ApprovalGate::builder(&state.gate_id)
            .required_approvers(state.required_approvers.clone())
            .timeout_seconds(state.timeout_seconds)
            .build()
            .map_err(|e| MiyabiError::Validation(format!("Failed to build gate: {}", e)))?;

        // Reject
        let updated_state = gate
            .reject(approval_id, approver, reason.clone())
            .await
            .map_err(|e| MiyabiError::Validation(format!("Failed to reject: {}", e)))?;

        println!("{}", "❌ Rejection recorded".red().bold());
        println!("Approval ID: {}", approval_id);
        println!("Approver: {}", approver);
        if let Some(r) = reason {
            println!("Reason: {}", r);
        }
        println!("Status: {:?}", updated_state.status);

        Ok(())
    }

    async fn list(approver: Option<&str>, all: bool) -> Result<(), MiyabiError> {
        let store = ApprovalStore::new().map_err(|e| {
            MiyabiError::Validation(format!("Failed to open approval store: {}", e))
        })?;

        let approvals = if all {
            store
                .list_all()
                .map_err(|e| MiyabiError::Validation(format!("Failed to list approvals: {}", e)))?
        } else if let Some(approver_id) = approver {
            store
                .list_pending_for_approver(approver_id)
                .map_err(|e| MiyabiError::Validation(format!("Failed to list approvals: {}", e)))?
        } else {
            store
                .list_pending()
                .map_err(|e| MiyabiError::Validation(format!("Failed to list approvals: {}", e)))?
        };

        if approvals.is_empty() {
            println!("{}", "No approvals found".yellow());
            return Ok(());
        }

        println!("\n{}", "Pending Approvals:".bold());
        println!("{}", "─".repeat(80));

        for approval in approvals {
            println!("\n{} {}", "●".cyan(), approval.approval_id);
            println!("  Workflow: {}", approval.workflow_id);
            println!("  Gate: {}", approval.gate_id);
            println!("  Status: {:?}", approval.status);
            println!(
                "  Progress: {}/{} approvals",
                approval.approval_count(),
                approval.required_approvers.len()
            );

            if !approval.pending_approvers().is_empty() {
                let pending: Vec<String> = approval
                    .pending_approvers()
                    .iter()
                    .map(|s| s.to_string())
                    .collect();
                println!("  Pending: {}", pending.join(", "));
            }

            if !approval.responses.is_empty() {
                println!("  Responses:");
                for (approver, response) in &approval.responses {
                    let status = if response.approved {
                        "✅ Approved".green()
                    } else {
                        "❌ Rejected".red()
                    };
                    println!("    - {} {}", approver, status);
                    if let Some(comment) = &response.comment {
                        println!("      Comment: {}", comment);
                    }
                }
            }
        }

        println!();
        Ok(())
    }

    async fn show(approval_id: &str) -> Result<(), MiyabiError> {
        let store = ApprovalStore::new().map_err(|e| {
            MiyabiError::Validation(format!("Failed to open approval store: {}", e))
        })?;

        let state = store
            .load(approval_id)
            .map_err(|e| MiyabiError::Validation(format!("Failed to load approval: {}", e)))?
            .ok_or_else(|| {
                MiyabiError::Validation(format!("Approval not found: {}", approval_id))
            })?;

        println!("\n{}", "Approval Details:".bold());
        println!("{}", "─".repeat(80));
        println!("ID: {}", state.approval_id);
        println!("Workflow: {}", state.workflow_id);
        println!("Gate: {}", state.gate_id);
        println!("Status: {:?}", state.status);
        println!(
            "Created: {}",
            state.created_at.format("%Y-%m-%d %H:%M:%S UTC")
        );

        if let Some(completed) = state.completed_at {
            println!("Completed: {}", completed.format("%Y-%m-%d %H:%M:%S UTC"));
        }

        println!(
            "\nProgress: {}/{} approvals",
            state.approval_count(),
            state.required_approvers.len()
        );

        println!("\nRequired Approvers:");
        for approver in &state.required_approvers {
            let status = if state.responses.contains_key(approver) {
                "✓"
            } else {
                "○"
            };
            println!("  {} {}", status, approver);
        }

        if !state.responses.is_empty() {
            println!("\nResponses:");
            for (approver, response) in &state.responses {
                let status = if response.approved {
                    "✅ Approved".green()
                } else {
                    "❌ Rejected".red()
                };
                println!(
                    "  {} {} at {}",
                    status,
                    approver,
                    response.responded_at.format("%Y-%m-%d %H:%M:%S UTC")
                );
                if let Some(comment) = &response.comment {
                    println!("    Comment: {}", comment);
                }
            }
        }

        println!();
        Ok(())
    }
}
