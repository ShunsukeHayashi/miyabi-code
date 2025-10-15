//! Setup command - Interactive onboarding wizard

use crate::error::{CliError, Result};
use colored::Colorize;
use dialoguer::Confirm;
use std::fs;
use std::path::Path;
use std::process::Command;

pub struct SetupCommand {
    pub skip_prompts: bool,
}

impl SetupCommand {
    pub fn new(skip_prompts: bool) -> Self {
        Self { skip_prompts }
    }

    pub async fn execute(&self) -> Result<()> {
        println!("{}", "🚀 Miyabi Setup Wizard".cyan().bold());
        println!();
        println!("This wizard will help you set up Miyabi in a few simple steps.");
        println!();

        // Step 1: Check GitHub CLI authentication
        println!("{}", "Step 1: Checking GitHub authentication...".bold());
        self.check_github_auth()?;
        println!("{}", "  ✅ GitHub authentication verified".green());
        println!();

        // Step 2: Detect Git repository
        println!("{}", "Step 2: Detecting Git repository...".bold());
        let (owner, repo) = self.detect_git_repository()?;
        println!("  ✅ Detected repository: {}/{}", owner.cyan(), repo.cyan());
        println!();

        // Step 3: Create configuration files
        println!("{}", "Step 3: Creating configuration files...".bold());
        self.create_env_file(&owner, &repo)?;
        self.create_miyabi_yml(&owner, &repo)?;
        println!("{}", "  ✅ Configuration files created".green());
        println!();

        // Step 4: Create directories
        println!("{}", "Step 4: Creating directories...".bold());
        self.create_directories()?;
        println!("{}", "  ✅ Directories created".green());
        println!();

        // Step 5: Verify setup
        println!("{}", "Step 5: Verifying setup...".bold());
        self.verify_setup()?;
        println!("{}", "  ✅ Setup verified".green());
        println!();

        // Final message
        println!("{}", "🎉 Setup complete!".green().bold());
        println!();
        println!("You can now run:");
        println!("  {} {}", "miyabi agent coordinator --issue".dimmed(), "<issue-number>".yellow());
        println!("  {} {}", "miyabi status".dimmed(), "".dimmed());
        println!();

        Ok(())
    }

    fn check_github_auth(&self) -> Result<()> {
        // Check if gh CLI is installed
        let gh_version = Command::new("gh")
            .arg("--version")
            .output()
            .map_err(|_| CliError::GitConfig("gh CLI not found. Please install GitHub CLI: https://cli.github.com/".to_string()))?;

        if !gh_version.status.success() {
            return Err(CliError::GitConfig("gh CLI not working properly".to_string()));
        }

        // Check authentication status
        let auth_status = Command::new("gh")
            .args(&["auth", "status"])
            .output()
            .map_err(|e| CliError::GitConfig(format!("Failed to check gh auth status: {}", e)))?;

        if !auth_status.status.success() {
            println!("  ⚠️  GitHub authentication not found");
            println!();

            if !self.skip_prompts {
                let should_auth = Confirm::new()
                    .with_prompt("Would you like to authenticate now?")
                    .default(true)
                    .interact()
                    .map_err(|e| CliError::GitConfig(format!("Failed to prompt: {}", e)))?;

                if should_auth {
                    println!();
                    println!("  Running: gh auth login");
                    let login_result = Command::new("gh")
                        .args(&["auth", "login"])
                        .status()
                        .map_err(|e| CliError::GitConfig(format!("Failed to run gh auth login: {}", e)))?;

                    if !login_result.success() {
                        return Err(CliError::GitConfig("GitHub authentication failed".to_string()));
                    }
                } else {
                    return Err(CliError::GitConfig(
                        "GitHub authentication is required. Run: gh auth login".to_string(),
                    ));
                }
            } else {
                return Err(CliError::GitConfig(
                    "GitHub authentication is required. Run: gh auth login".to_string(),
                ));
            }
        }

        Ok(())
    }

    fn detect_git_repository(&self) -> Result<(String, String)> {
        // Run git remote get-url origin
        let output = Command::new("git")
            .args(&["remote", "get-url", "origin"])
            .output()
            .map_err(|e| CliError::GitConfig(format!("Failed to run git command: {}", e)))?;

        if !output.status.success() {
            return Err(CliError::GitConfig(
                "Not a git repository. Please initialize git first:\n  git init\n  git remote add origin <url>".to_string(),
            ));
        }

        let remote_url = String::from_utf8_lossy(&output.stdout).trim().to_string();

        // Parse HTTPS format
        if remote_url.starts_with("http") && remote_url.contains("github.com/") {
            let parts: Vec<&str> = remote_url
                .split("github.com/")
                .nth(1)
                .ok_or_else(|| CliError::GitConfig("Invalid GitHub URL".to_string()))?
                .trim_end_matches(".git")
                .split('/')
                .collect();

            if parts.len() >= 2 {
                return Ok((parts[0].to_string(), parts[1].to_string()));
            }
        }

        // Parse SSH format
        if remote_url.starts_with("git@github.com:") {
            let repo_part = remote_url
                .strip_prefix("git@github.com:")
                .ok_or_else(|| CliError::GitConfig("Invalid SSH URL".to_string()))?
                .trim_end_matches(".git");

            let parts: Vec<&str> = repo_part.split('/').collect();
            if parts.len() >= 2 {
                return Ok((parts[0].to_string(), parts[1].to_string()));
            }
        }

        Err(CliError::GitConfig(format!(
            "Could not parse GitHub owner/repo from remote URL: {}",
            remote_url
        )))
    }

    fn create_env_file(&self, owner: &str, repo: &str) -> Result<()> {
        let env_path = Path::new(".env");

        if env_path.exists() && !self.skip_prompts {
            let overwrite = Confirm::new()
                .with_prompt(".env already exists. Overwrite?")
                .default(false)
                .interact()
                .map_err(|e| CliError::GitConfig(format!("Failed to prompt: {}", e)))?;

            if !overwrite {
                println!("  ⏭️  Skipping .env creation");
                return Ok(());
            }
        }

        let content = format!(
r#"# ==============================================================================
# Miyabi - Environment Configuration
# ==============================================================================
# Generated: {}
# Platform: {}
# ==============================================================================

# -----------------------------------------------------------------------------
# Required: API Keys
# -----------------------------------------------------------------------------

# GitHub Personal Access Token
# The application automatically uses 'gh auth token' if available
# Only set this if gh CLI is not available
# GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# -----------------------------------------------------------------------------
# Repository Configuration
# -----------------------------------------------------------------------------

GITHUB_REPOSITORY={}/{}
GITHUB_REPOSITORY_OWNER={}

# Device Identifier (for logs and monitoring)
DEVICE_IDENTIFIER={}

# -----------------------------------------------------------------------------
# Rust Configuration
# -----------------------------------------------------------------------------

RUST_LOG=info
RUST_BACKTRACE=1

# -----------------------------------------------------------------------------
# Agent Configuration
# -----------------------------------------------------------------------------

LOG_DIRECTORY=.ai/logs
REPORT_DIRECTORY=.ai/parallel-reports
DEFAULT_CONCURRENCY=2

# -----------------------------------------------------------------------------
# Worktree Configuration
# -----------------------------------------------------------------------------

USE_WORKTREE=true
WORKTREE_BASE_DIR=.worktrees
"#,
            chrono::Local::now().format("%Y-%m-%d"),
            std::env::consts::OS,
            owner,
            repo,
            owner,
            hostname::get()
                .unwrap()
                .to_string_lossy()
                .to_string()
        );

        fs::write(env_path, content)
            .map_err(|e| CliError::GitConfig(format!("Failed to write .env: {}", e)))?;

        println!("  ✅ Created .env");
        Ok(())
    }

    fn create_miyabi_yml(&self, owner: &str, repo: &str) -> Result<()> {
        let yml_path = Path::new(".miyabi.yml");

        if yml_path.exists() && !self.skip_prompts {
            let overwrite = Confirm::new()
                .with_prompt(".miyabi.yml already exists. Overwrite?")
                .default(false)
                .interact()
                .map_err(|e| CliError::GitConfig(format!("Failed to prompt: {}", e)))?;

            if !overwrite {
                println!("  ⏭️  Skipping .miyabi.yml creation");
                return Ok(());
            }
        }

        let content = format!(
r#"github:
  defaultPrivate: true
  owner: {}
  repo: {}
project:
  gitignoreTemplate: Node
  licenseTemplate: Apache-2.0
labels: {{}}
workflows:
  autoLabel: true
  autoReview: true
  autoSync: true
cli:
  language: ja
  theme: default
  verboseErrors: true
"#,
            owner, repo
        );

        fs::write(yml_path, content)
            .map_err(|e| CliError::GitConfig(format!("Failed to write .miyabi.yml: {}", e)))?;

        println!("  ✅ Created .miyabi.yml");
        Ok(())
    }

    fn create_directories(&self) -> Result<()> {
        let dirs = vec![
            ".ai/logs",
            ".ai/parallel-reports",
            ".worktrees",
        ];

        for dir in dirs {
            fs::create_dir_all(dir)
                .map_err(|e| CliError::GitConfig(format!("Failed to create {}: {}", dir, e)))?;
            println!("  ✅ Created {}", dir);
        }

        Ok(())
    }

    fn verify_setup(&self) -> Result<()> {
        // Check if files exist
        let required_files = vec![".env", ".miyabi.yml"];
        let required_dirs = vec![".ai/logs", ".ai/parallel-reports", ".worktrees"];

        for file in required_files {
            if !Path::new(file).exists() {
                return Err(CliError::GitConfig(format!("Missing file: {}", file)));
            }
        }

        for dir in required_dirs {
            if !Path::new(dir).exists() {
                return Err(CliError::GitConfig(format!("Missing directory: {}", dir)));
            }
        }

        Ok(())
    }
}
