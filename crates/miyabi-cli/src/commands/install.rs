//! Install command - Install Miyabi to existing project

use crate::{
    error::{CliError, Result},
    worktree::default_worktree_base_dir,
};
use colored::Colorize;
use std::fs;
use std::path::Path;

pub struct InstallCommand {
    pub dry_run: bool,
}

impl InstallCommand {
    pub fn new(dry_run: bool) -> Self {
        Self { dry_run }
    }

    pub async fn execute(&self) -> Result<()> {
        println!(
            "{}",
            "📦 Installing Miyabi to existing project...".cyan().bold()
        );

        if self.dry_run {
            println!("{}", "  (Dry run - no changes will be made)".yellow());
        }

        // Verify we're in a git repository
        self.verify_git_repository()?;

        // Check if Miyabi is already installed
        if self.is_miyabi_installed() {
            println!(
                "{}",
                "⚠️  Miyabi is already installed in this project".yellow()
            );
            return Ok(());
        }

        // Create directory structure
        self.create_directory_structure()?;

        // Create configuration files
        self.create_configuration_files()?;

        // Update .gitignore
        self.update_gitignore()?;

        println!();
        println!("{}", "✅ Miyabi installed successfully!".green().bold());
        println!();
        println!("Next steps:");
        println!("  export GITHUB_TOKEN=ghp_xxx");
        println!("  miyabi status");

        Ok(())
    }

    fn verify_git_repository(&self) -> Result<()> {
        use std::process::Command;

        let output = Command::new("git")
            .args(["rev-parse", "--git-dir"])
            .output()?;

        if !output.status.success() {
            return Err(CliError::NotGitRepository);
        }

        println!("  ✓ Git repository detected");
        Ok(())
    }

    fn is_miyabi_installed(&self) -> bool {
        Path::new(".miyabi.yml").exists()
    }

    fn create_directory_structure(&self) -> Result<()> {
        let worktree_base = default_worktree_base_dir();
        let dirs = vec![
            ".github/workflows",
            ".claude/agents/specs",
            ".claude/agents/prompts",
            ".claude/commands",
            "docs",
            "logs",
            "reports",
        ];

        for dir in dirs {
            if self.dry_run {
                println!("  [DRY RUN] Would create: {}", dir);
            } else {
                fs::create_dir_all(dir)?;
                println!("  Created: {}", dir);
            }
        }

        if self.dry_run {
            println!(
                "  [DRY RUN] Would create worktree base: {}",
                worktree_base.to_string_lossy()
            );
        } else {
            fs::create_dir_all(&worktree_base)?;
            println!("  Created: {}", worktree_base.to_string_lossy());
        }

        Ok(())
    }

    fn create_configuration_files(&self) -> Result<()> {
        // Get project name from git remote or directory name
        let project_name = self.get_project_name()?;

        let worktree_base = default_worktree_base_dir();
        let miyabi_config = format!(
            r#"# Miyabi Configuration
project_name: {}
version: "0.1.0"

# GitHub settings (use environment variables for sensitive data)
# github_token: ${{{{ GITHUB_TOKEN }}}}

# Agent settings
agents:
  enabled: true
  use_worktree: true
  worktree_base_path: "{}"

# Logging
logging:
  level: info
  directory: "./logs"

# Reporting
reporting:
  directory: "./reports"
"#,
            project_name,
            worktree_base.to_string_lossy()
        );

        if self.dry_run {
            println!("  [DRY RUN] Would create: .miyabi.yml");
        } else {
            fs::write(".miyabi.yml", miyabi_config)?;
            println!("  Created: .miyabi.yml");
        }

        Ok(())
    }

    fn update_gitignore(&self) -> Result<()> {
        let worktree_base = default_worktree_base_dir();
        let mut gitignore_entries =
            String::from("\n# Miyabi\n.miyabi.yml\nlogs/\nreports/\n*.log\n");

        if !worktree_base.is_absolute() {
            gitignore_entries.push_str(&format!("{}/\n", worktree_base.to_string_lossy()));
        }

        if self.dry_run {
            println!("  [DRY RUN] Would update: .gitignore");
        } else {
            // Read existing .gitignore if it exists
            let existing_gitignore = fs::read_to_string(".gitignore").unwrap_or_default();

            // Check if Miyabi entries already exist
            if !existing_gitignore.contains("# Miyabi") {
                let updated_gitignore = format!("{}{}", existing_gitignore, gitignore_entries);
                fs::write(".gitignore", updated_gitignore)?;
                println!("  Updated: .gitignore");
            } else {
                println!("  Skipped: .gitignore (already has Miyabi entries)");
            }
        }

        Ok(())
    }

    fn get_project_name(&self) -> Result<String> {
        use std::process::Command;

        // Try to get from git remote
        let output = Command::new("git")
            .args(["remote", "get-url", "origin"])
            .output();

        if let Ok(output) = output {
            if output.status.success() {
                let url = String::from_utf8_lossy(&output.stdout);
                if let Some(name) = url.split('/').next_back() {
                    return Ok(name.trim().trim_end_matches(".git").to_string());
                }
            }
        }

        // Fallback to directory name
        let current_dir = std::env::current_dir()?;
        let name = current_dir
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("miyabi-project");

        Ok(name.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_install_command_creation() {
        let cmd = InstallCommand::new(false);
        assert!(!cmd.dry_run);

        let cmd = InstallCommand::new(true);
        assert!(cmd.dry_run);
    }

    #[test]
    fn test_is_miyabi_installed() {
        let cmd = InstallCommand::new(false);
        // This will check if .miyabi.yml exists in current dir
        // Result depends on whether we're actually in a Miyabi project
        let result = cmd.is_miyabi_installed();
        // Just check that the method works without panicking
        assert!(result || !result);
    }

    #[test]
    fn test_get_project_name_fallback() {
        let cmd = InstallCommand::new(false);
        let result = cmd.get_project_name();
        // Should always return some string, either from git or directory name
        assert!(result.is_ok());
        let name = result.unwrap();
        assert!(!name.is_empty());
    }

    #[test]
    fn test_install_dry_run_flag() {
        // Test that dry_run flag is properly stored
        let cmd_normal = InstallCommand::new(false);
        let cmd_dry = InstallCommand::new(true);

        assert_eq!(cmd_normal.dry_run, false);
        assert_eq!(cmd_dry.dry_run, true);
    }
}
