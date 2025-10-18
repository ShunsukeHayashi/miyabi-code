//! Init command - Initialize new Miyabi project

use crate::error::{CliError, Result};
use colored::Colorize;
use std::fs;
use std::path::{Path, PathBuf};

pub struct InitCommand {
    pub name: String,
    #[allow(dead_code)] // Reserved for GitHub repo creation (public vs private)
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
            return Err(CliError::Io(std::io::Error::other(
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
            ".claude/agents/specs/coding",
            ".claude/agents/specs/business",
            ".claude/agents/prompts/coding",
            ".claude/agents/prompts/business",
            ".claude/commands",
            ".claude/prompts",
            ".claude/templates",
            "docs",
            "scripts",
            "logs",
            "reports",
        ];

        for dir in dirs {
            let dir_path = project_dir.join(dir);
            fs::create_dir_all(&dir_path)?;
        }

        // Create CLAUDE.md (project context file)
        self.create_claude_md(project_dir)?;

        // Create essential .claude files
        self.create_claude_files(project_dir)?;

        println!("  Created project structure");
        Ok(())
    }

    fn create_claude_md(&self, project_dir: &Path) -> Result<()> {
        let claude_md = format!(
            r#"# Claude Code プロジェクト設定

このファイルは、Claude Codeが自動的に参照するプロジェクトコンテキストファイルです。

## プロジェクト概要

**{}** - Miyabi自律型開発プロジェクト

## アーキテクチャ

### コアコンポーネント

1. **Agent System** - 自律実行Agent（Miyabi Framework）
2. **GitHub OS Integration** - GitHubをOSとして活用
3. **Label System** - 53ラベル体系による状態管理

### ディレクトリ構造

```
{}/
├── .claude/                    # Claude Code設定
│   ├── agents/                # Agent仕様・プロンプト
│   ├── commands/              # カスタムコマンド
│   └── prompts/               # 実行プロンプト
├── .github/                   # GitHub設定
│   └── workflows/             # GitHub Actions
├── docs/                      # ドキュメント
├── scripts/                   # 自動化スクリプト
├── logs/                      # ログファイル
└── reports/                   # レポート出力
```

## 開発ガイドライン

### コミット規約
- Conventional Commits準拠
- `feat:`, `fix:`, `chore:`, `docs:`, etc.

### セキュリティ
- トークンは環境変数
- `.miyabi.yml`は`.gitignore`に追加済み

## 環境変数

```bash
GITHUB_TOKEN=ghp_xxx        # GitHubアクセストークン
ANTHROPIC_API_KEY=sk-xxx    # Anthropic APIキー（Agent実行時）
```

## 実行例

```bash
# ステータス確認
miyabi status

# Agent実行
miyabi agent coordinator --issue 1

# テスト実行
cargo test --all

# Linter実行
cargo clippy --all-targets
```

---

**このファイルはClaude Codeが自動参照します。プロジェクトのコンテキストとして常に最新に保ってください。**
"#,
            self.name, self.name
        );

        fs::write(project_dir.join("CLAUDE.md"), claude_md)?;
        Ok(())
    }

    fn create_claude_files(&self, project_dir: &Path) -> Result<()> {
        // Create .claude/README.md
        let claude_readme = r#"# .claude Directory

Claude Code設定ディレクトリ - プロジェクト固有の設定とプロンプト

## 構造

- `agents/` - Agent仕様とプロンプト
  - `specs/coding/` - コーディング系Agent仕様
  - `specs/business/` - ビジネス系Agent仕様
  - `prompts/coding/` - 実行プロンプト
- `commands/` - カスタムスラッシュコマンド
- `prompts/` - 汎用プロンプト
- `templates/` - テンプレートファイル

## カスタムコマンド

`.claude/commands/` 配下に `*.md` ファイルを作成することで、
カスタムスラッシュコマンドを定義できます。

例: `.claude/commands/test.md` → `/test` コマンド

## Agent仕様

Agent仕様ファイル（`.claude/agents/specs/`）で、各Agentの役割・権限・エスカレーション条件を定義します。
"#;
        fs::write(project_dir.join(".claude/README.md"), claude_readme)?;

        // Create .claude/QUICK_START.md
        let quick_start = format!(
            r#"# {} - Quick Start Guide

## 🚀 3分で始めるMiyabi

### 1. 環境変数設定

```bash
export GITHUB_TOKEN=ghp_xxx
export ANTHROPIC_API_KEY=sk-xxx
```

### 2. ステータス確認

```bash
miyabi status
```

### 3. Issue作成

GitHubでIssueを作成し、以下のラベルを付与：
- `type:feature` または `type:bug`
- `priority:P1-High`

### 4. Agent実行

```bash
miyabi agent coordinator --issue 1
```

## 📚 詳細ドキュメント

- [CLAUDE.md](../CLAUDE.md) - プロジェクトコンテキスト
- [.claude/README.md](./README.md) - .claudeディレクトリ説明

---

**Miyabi** - Beauty in Autonomous Development 🌸
"#,
            self.name
        );
        fs::write(project_dir.join(".claude/QUICK_START.md"), quick_start)?;

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
