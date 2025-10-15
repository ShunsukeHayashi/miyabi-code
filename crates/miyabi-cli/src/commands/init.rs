//! Init command - Initialize new Miyabi project

use crate::error::{CliError, Result};
use colored::Colorize;
use std::fs;
use std::path::{Path, PathBuf};

pub struct InitCommand {
    pub name: String,
    pub private: bool,
}

impl InitCommand {
    pub fn new(name: String, private: bool) -> Self {
        Self { name, private }
    }

    pub async fn execute(&self) -> Result<()> {
        println!("{}", "🚀 Initializing new Miyabi project...".cyan().bold());

        // Validate project name
        self.validate_project_name()?;

        // Create project directory
        let project_dir = self.create_project_directory()?;

        // Initialize git repository
        self.init_git_repository(&project_dir)?;

        // Create basic structure
        self.create_project_structure(&project_dir)?;

        // Create configuration files
        self.create_config_files(&project_dir)?;

        println!();
        println!("{}", "✅ Project initialized successfully!".green().bold());
        println!();
        println!("Next steps:");
        println!("  cd {}", self.name);
        println!("  export GITHUB_TOKEN=ghp_xxx");
        println!("  miyabi status");

        Ok(())
    }

    fn validate_project_name(&self) -> Result<()> {
        // Check if name is valid
        if self.name.is_empty() {
            return Err(CliError::InvalidProjectName(
                "Project name cannot be empty".to_string(),
            ));
        }

        // Check if name contains invalid characters
        if !self
            .name
            .chars()
            .all(|c| c.is_alphanumeric() || c == '-' || c == '_')
        {
            return Err(CliError::InvalidProjectName(
                "Project name can only contain alphanumeric characters, hyphens, and underscores"
                    .to_string(),
            ));
        }

        Ok(())
    }

    fn create_project_directory(&self) -> Result<PathBuf> {
        let project_dir = PathBuf::from(&self.name);

        // Check if directory already exists
        if project_dir.exists() {
            return Err(CliError::ProjectExists(self.name.clone()));
        }

        // Create directory
        fs::create_dir(&project_dir)?;
        println!("  Created directory: {}", project_dir.display());

        Ok(project_dir)
    }

    fn init_git_repository(&self, project_dir: &Path) -> Result<()> {
        use std::process::Command;

        // Initialize git repository
        let output = Command::new("git")
            .args(["init"])
            .current_dir(project_dir)
            .output()?;

        if !output.status.success() {
            return Err(CliError::Io(std::io::Error::new(
                std::io::ErrorKind::Other,
                "Failed to initialize git repository",
            )));
        }

        println!("  Initialized git repository");
        Ok(())
    }

    fn create_project_structure(&self, project_dir: &Path) -> Result<()> {
        // Create standard directories
        let dirs = vec![
            ".github/workflows",
            ".claude/agents/specs",
            ".claude/agents/prompts",
            ".claude/commands",
            "docs",
            "scripts",
            "logs",
            "reports",
        ];

        for dir in dirs {
            let dir_path = project_dir.join(dir);
            fs::create_dir_all(&dir_path)?;
        }

        println!("  Created project structure");
        Ok(())
    }

    fn create_config_files(&self, project_dir: &Path) -> Result<()> {
        // Create .miyabi.yml
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
  worktree_base_path: ".worktrees"

# Logging
logging:
  level: info
  directory: "./logs"

# Reporting
reporting:
  directory: "./reports"
"#,
            self.name
        );

        fs::write(project_dir.join(".miyabi.yml"), miyabi_config)?;

        // Create .gitignore
        let gitignore = r#"# Miyabi
.miyabi.yml
.worktrees/
logs/
reports/
*.log

# Environment
.env
.env.local

# Dependencies
node_modules/
target/

# IDE
.vscode/
.idea/
*.swp
*.swo
"#;

        fs::write(project_dir.join(".gitignore"), gitignore)?;

        // Create README.md
        let readme = format!(
            r#"# {}

Miyabi autonomous development project.

## Setup

1. Set GitHub token:
   ```bash
   export GITHUB_TOKEN=ghp_xxx
   ```

2. Check status:
   ```bash
   miyabi status
   ```

3. Run agent:
   ```bash
   miyabi agent coordinator --issue 1
   ```

## Documentation

- See `docs/` directory for detailed documentation
- See `.claude/agents/specs/` for agent specifications
"#,
            self.name
        );

        fs::write(project_dir.join("README.md"), readme)?;

        println!("  Created configuration files");
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_project_name() {
        let valid_cmd = InitCommand::new("my-project".to_string(), false);
        assert!(valid_cmd.validate_project_name().is_ok());

        let valid_cmd = InitCommand::new("my_project_123".to_string(), false);
        assert!(valid_cmd.validate_project_name().is_ok());

        let invalid_cmd = InitCommand::new("".to_string(), false);
        assert!(invalid_cmd.validate_project_name().is_err());

        let invalid_cmd = InitCommand::new("my project".to_string(), false);
        assert!(invalid_cmd.validate_project_name().is_err());

        let invalid_cmd = InitCommand::new("my@project".to_string(), false);
        assert!(invalid_cmd.validate_project_name().is_err());
    }
}
