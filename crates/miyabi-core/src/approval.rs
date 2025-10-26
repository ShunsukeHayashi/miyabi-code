//! Approval System for Interactive Mode
//!
//! Provides user approval UI for dangerous operations (file edits, command execution)
//! Shows diffs and prompts for confirmation before making changes.

use colored::Colorize;
use miyabi_types::error::Result;
use miyabi_types::MiyabiError;
use similar::{ChangeTag, TextDiff};
use std::io::{self, Write};

/// Approval decision from user
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ApprovalDecision {
    /// Approve and proceed
    Approve,
    /// Reject and skip
    Reject,
    /// Edit before applying
    Edit,
    /// Show more details
    Details,
}

/// Approval request for a file change
#[derive(Debug, Clone)]
pub struct FileChangeApproval {
    pub path: String,
    pub old_content: String,
    pub new_content: String,
    pub operation: FileOperation,
}

/// Type of file operation
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FileOperation {
    Create,
    Modify,
    Delete,
}

impl FileChangeApproval {
    /// Create approval request for file creation
    pub fn create(path: String, content: String) -> Self {
        Self {
            path,
            old_content: String::new(),
            new_content: content,
            operation: FileOperation::Create,
        }
    }

    /// Create approval request for file modification
    pub fn modify(path: String, old_content: String, new_content: String) -> Self {
        Self {
            path,
            old_content,
            new_content,
            operation: FileOperation::Modify,
        }
    }

    /// Create approval request for file deletion
    pub fn delete(path: String, old_content: String) -> Self {
        Self {
            path,
            old_content,
            new_content: String::new(),
            operation: FileOperation::Delete,
        }
    }
}

/// Approval request for command execution
#[derive(Debug, Clone)]
pub struct CommandApproval {
    pub command: String,
    pub args: Vec<String>,
    pub reason: String,
}

/// Main approval system
pub struct ApprovalSystem {
    /// Whether to use interactive prompts (false = auto-approve)
    interactive: bool,
}

impl ApprovalSystem {
    /// Create new approval system
    pub fn new(interactive: bool) -> Self {
        Self { interactive }
    }

    /// Request approval for file change
    pub fn request_file_change(&self, approval: &FileChangeApproval) -> Result<ApprovalDecision> {
        if !self.interactive {
            return Ok(ApprovalDecision::Approve);
        }

        self.print_file_change_header(approval);
        self.print_diff(approval)?;
        self.prompt_decision()
    }

    /// Request approval for command execution
    pub fn request_command_execution(
        &self,
        approval: &CommandApproval,
    ) -> Result<ApprovalDecision> {
        if !self.interactive {
            return Ok(ApprovalDecision::Approve);
        }

        self.print_command_header(approval);
        self.prompt_decision()
    }

    /// Print file change header
    fn print_file_change_header(&self, approval: &FileChangeApproval) {
        println!("\n{}", "─".repeat(60).cyan());

        let operation_str = match approval.operation {
            FileOperation::Create => "Create File".green(),
            FileOperation::Modify => "Modify File".yellow(),
            FileOperation::Delete => "Delete File".red(),
        };

        println!("{}: {}", operation_str.bold(), approval.path.cyan());
        println!("{}", "─".repeat(60).cyan());
    }

    /// Print command header
    fn print_command_header(&self, approval: &CommandApproval) {
        println!("\n{}", "─".repeat(60).cyan());
        println!(
            "{}: {}",
            "Execute Command".red().bold(),
            approval.command.cyan()
        );

        if !approval.args.is_empty() {
            println!("  Args: {}", approval.args.join(" "));
        }

        if !approval.reason.is_empty() {
            println!("  Reason: {}", approval.reason);
        }

        println!("{}", "─".repeat(60).cyan());
    }

    /// Print unified diff
    fn print_diff(&self, approval: &FileChangeApproval) -> Result<()> {
        match approval.operation {
            FileOperation::Create => {
                self.print_new_content(&approval.new_content);
            }
            FileOperation::Modify => {
                self.print_unified_diff(&approval.old_content, &approval.new_content)?;
            }
            FileOperation::Delete => {
                println!("{}", "File will be deleted".red());
            }
        }
        Ok(())
    }

    /// Print content for new files
    fn print_new_content(&self, content: &str) {
        let lines: Vec<&str> = content.lines().collect();
        let total = lines.len();
        let display_lines = if total > 50 { 50 } else { total };

        for line in &lines[..display_lines] {
            println!("{} {}", "+".green(), line);
        }

        if total > display_lines {
            println!(
                "{}",
                format!("... ({} more lines)", total - display_lines).dimmed()
            );
        }
    }

    /// Print unified diff using similar crate
    fn print_unified_diff(&self, old: &str, new: &str) -> Result<()> {
        let diff = TextDiff::from_lines(old, new);

        let mut changes = 0;
        for change in diff.iter_all_changes() {
            let sign = match change.tag() {
                ChangeTag::Delete => "-".red(),
                ChangeTag::Insert => "+".green(),
                ChangeTag::Equal => " ".normal(),
            };

            print!("{} {}", sign, change);

            if change.tag() != ChangeTag::Equal {
                changes += 1;
            }
        }

        if changes == 0 {
            println!("{}", "No changes detected".yellow());
        }

        Ok(())
    }

    /// Prompt user for decision
    #[allow(clippy::only_used_in_recursion)]
    fn prompt_decision(&self) -> Result<ApprovalDecision> {
        println!();
        println!("Options:");
        println!("  {} - Approve and proceed", "[y]es".green());
        println!("  {} - Reject and skip", "[n]o".red());
        println!("  {} - Show more details", "[d]etails".cyan());
        println!("  {} - Exit program", "[e]xit".yellow());
        print!("\n{} ", "Decision [y/n/d/e]:".bold());

        io::stdout()
            .flush()
            .map_err(|e| MiyabiError::Unknown(format!("IO error: {}", e)))?;

        let mut input = String::new();
        io::stdin()
            .read_line(&mut input)
            .map_err(|e| MiyabiError::Unknown(format!("Failed to read input: {}", e)))?;

        match input.trim().to_lowercase().as_str() {
            "y" | "yes" => Ok(ApprovalDecision::Approve),
            "n" | "no" => Ok(ApprovalDecision::Reject),
            "d" | "details" => Ok(ApprovalDecision::Details),
            "e" | "exit" => Err(MiyabiError::Unknown("User requested exit".to_string())),
            _ => {
                println!("{}", "Invalid input. Please enter y, n, d, or e.".yellow());
                self.prompt_decision()
            }
        }
    }
}

impl Default for ApprovalSystem {
    fn default() -> Self {
        Self::new(false)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_approval_system_non_interactive() {
        let system = ApprovalSystem::new(false);

        let approval =
            FileChangeApproval::create("test.txt".to_string(), "Hello, world!".to_string());

        let decision = system.request_file_change(&approval).unwrap();
        assert_eq!(decision, ApprovalDecision::Approve);
    }

    #[test]
    fn test_file_change_approval_create() {
        let approval =
            FileChangeApproval::create("new_file.txt".to_string(), "content".to_string());

        assert_eq!(approval.operation, FileOperation::Create);
        assert_eq!(approval.old_content, "");
        assert_eq!(approval.new_content, "content");
    }

    #[test]
    fn test_file_change_approval_modify() {
        let approval = FileChangeApproval::modify(
            "file.txt".to_string(),
            "old content".to_string(),
            "new content".to_string(),
        );

        assert_eq!(approval.operation, FileOperation::Modify);
    }

    #[test]
    fn test_file_change_approval_delete() {
        let approval =
            FileChangeApproval::delete("file.txt".to_string(), "content to delete".to_string());

        assert_eq!(approval.operation, FileOperation::Delete);
        assert_eq!(approval.new_content, "");
    }
}
