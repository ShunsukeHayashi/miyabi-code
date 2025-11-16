//! Init command - Initialize new Miyabi project

use crate::{
    error::{CliError, Result},
    worktree::default_worktree_base_dir,
};
use colored::Colorize;
use dialoguer::{theme::ColorfulTheme, Confirm, Select};
use std::fs;
use std::path::{Path, PathBuf};

pub struct InitCommand {
    pub name: String,
    #[allow(dead_code)] // Reserved for GitHub repo creation (public vs private)
    pub private: bool,
    pub interactive: bool,
}

#[derive(Debug, Clone)]
enum ProjectType {
    WebApp,
    ApiBackend,
    CliTool,
    Library,
}

impl ProjectType {
    fn as_str(&self) -> &str {
        match self {
            ProjectType::WebApp => "Web App (React/Next.js/SvelteKit)",
            ProjectType::ApiBackend => "API Backend (Rust/Node.js/Python)",
            ProjectType::CliTool => "CLI Tool (Rust/Go)",
            ProjectType::Library => "Library/SDK (Rust/TypeScript)",
        }
    }
}

impl InitCommand {
    pub fn with_interactive(name: String, private: bool, interactive: bool) -> Self {
        Self {
            name,
            private,
            interactive,
        }
    }

    pub async fn execute(&self) -> Result<()> {
        if self.interactive {
            self.execute_interactive().await
        } else {
            self.execute_simple(Some(self.private)).await
        }
    }

    async fn execute_interactive(&self) -> Result<()> {
        println!();
        println!("{}", "🎯 Welcome to Miyabi!".cyan().bold());
        println!();

        // Step 1: Project type selection
        let project_types = [
            ProjectType::WebApp,
            ProjectType::ApiBackend,
            ProjectType::CliTool,
            ProjectType::Library,
        ];

        let project_type_selection = Select::with_theme(&ColorfulTheme::default())
            .with_prompt("What are you building?")
            .items(project_types.iter().map(|t| t.as_str()).collect::<Vec<_>>())
            .default(0)
            .interact()
            .map_err(|e| CliError::InvalidProjectName(e.to_string()))?;

        let project_type = &project_types[project_type_selection];

        println!();
        println!(
            "  {} {}",
            "✨".green(),
            format!("Great choice! Building: {}", project_type.as_str()).bold()
        );
        println!();

        // Step 2: GitHub connection
        let connect_github = Confirm::with_theme(&ColorfulTheme::default())
            .with_prompt("Connect to GitHub?")
            .default(true)
            .interact()
            .map_err(|e| CliError::InvalidProjectName(e.to_string()))?;

        println!();
        if connect_github {
            println!("  {} Will set up GitHub integration", "🔗".green());
        } else {
            println!("  {} Skipping GitHub (you can set it up later)", "⏭️".yellow());
        }
        println!();

        // Step 3: AI Agents setup
        println!("{}", "🤖 Setting up AI Agents...".cyan().bold());
        println!("  {} CoordinatorAgent (Task planning)", "✅".green());
        println!("  {} CodeGenAgent (Code generation)", "✅".green());
        println!("  {} ReviewAgent (Quality checks)", "✅".green());
        println!();

        let repo_visibility = if connect_github {
            let make_private = Confirm::with_theme(&ColorfulTheme::default())
                .with_prompt("Create as a PRIVATE GitHub repository?")
                .default(true)
                .interact()
                .map_err(|e| CliError::GitConfig(e.to_string()))?;
            Some(make_private)
        } else {
            None
        };

        self.execute_simple(repo_visibility).await?;

        // Interactive-specific success message
        println!();
        println!("{}", "🎉 You're all set!".green().bold());
        println!();
        println!("Your first AI-powered task:");
        println!("  {}", "miyabi work-on \"Setup project structure\"".yellow());
        println!();
        println!("Or try the traditional way:");
        println!("  {}", "miyabi agent run coordinator --issue 1".cyan());

        Ok(())
    }

    fn create_github_repository(&self, project_dir: &Path, private_repo: bool) -> Result<()> {
        use std::process::Command;

        println!(
            "  {} Creating GitHub repository ({})...",
            "🔗".green(),
            if private_repo { "private" } else { "public" }
        );

        let gh_check = Command::new("gh").arg("--version").output().map_err(|_| {
            CliError::GitConfig(
                "gh CLI not found. Install from https://cli.github.com/".to_string(),
            )
        })?;

        if !gh_check.status.success() {
            return Err(CliError::GitConfig(
                "gh CLI could not be executed. Verify installation.".to_string(),
            ));
        }

        let gh_auth = Command::new("gh")
            .args(["auth", "status"])
            .output()
            .map_err(|e| CliError::GitConfig(format!("Failed to check gh auth status: {}", e)))?;

        if !gh_auth.status.success() {
            return Err(CliError::GitConfig(
                "GitHub authentication required. Run: gh auth login".to_string(),
            ));
        }

        let add_status =
            Command::new("git")
                .args(["add", "."])
                .current_dir(project_dir)
                .status()
                .map_err(|e| CliError::GitConfig(format!("Failed to stage files: {}", e)))?;

        if !add_status.success() {
            return Err(CliError::GitConfig(
                "Failed to stage files for initial commit".to_string(),
            ));
        }

        let commit_output = Command::new("git")
            .args(["commit", "-m", "chore: bootstrap Miyabi project"])
            .current_dir(project_dir)
            .output()
            .map_err(|e| CliError::GitConfig(format!("Failed to run git commit: {}", e)))?;

        if !commit_output.status.success() {
            let stderr = String::from_utf8_lossy(&commit_output.stderr);
            return Err(CliError::GitConfig(format!(
                "Failed to create initial commit: {}",
                stderr.trim()
            )));
        }

        let mut args = vec!["repo", "create", &self.name];
        args.push(if private_repo {
            "--private"
        } else {
            "--public"
        });
        args.extend_from_slice(&["--source=.", "--remote=origin", "--push"]);

        let gh_create = Command::new("gh")
            .args(&args)
            .current_dir(project_dir)
            .output()
            .map_err(|e| CliError::GitConfig(format!("Failed to run gh repo create: {}", e)))?;

        if !gh_create.status.success() {
            let stderr = String::from_utf8_lossy(&gh_create.stderr);
            return Err(CliError::GitConfig(format!("gh repo create failed: {}", stderr.trim())));
        }

        Ok(())
    }

    async fn execute_simple(&self, repo_visibility: Option<bool>) -> Result<()> {
        if !self.interactive {
            println!("{}", "🚀 Initializing new Miyabi project...".cyan().bold());
        }

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

        if let Some(private_repo) = repo_visibility {
            match self.create_github_repository(&project_dir, private_repo) {
                Ok(_) => println!(
                    "  {} GitHub repository created ({}).",
                    "✅".green(),
                    if private_repo { "private" } else { "public" }
                ),
                Err(err) => {
                    eprintln!("  {} Failed to create GitHub repository: {}", "⚠️".yellow(), err);
                    eprintln!(
                        "     Run `gh repo create {} {} --source=. --remote=origin --push` later.",
                        self.name,
                        if private_repo {
                            "--private"
                        } else {
                            "--public"
                        }
                    );
                },
            }
        }

        println!();
        println!("{}", "✅ Project initialized successfully!".green().bold());
        println!();
        println!("{}", "📚 Next steps:".cyan().bold());
        println!();
        println!("  {} Enter project directory:", "1.".yellow().bold());
        println!("     cd {}", self.name);
        println!();
        println!("  {} Set up GitHub token:", "2.".yellow().bold());
        println!("     Visit: https://github.com/settings/tokens/new");
        println!("     Scopes: repo, workflow");
        println!("     export GITHUB_TOKEN=ghp_xxx");
        println!();
        println!("  {} Check installation:", "3.".yellow().bold());
        println!("     miyabi status");
        println!();
        println!("  {} Create your first issue on GitHub, then:", "4.".yellow().bold());
        println!("     miyabi agent run coordinator --issue 1");
        println!();
        println!("{}", "📖 Documentation:".cyan().bold());
        println!("  • Quick Start: .claude/QUICK_START.md");
        println!("  • Full Guide: CLAUDE.md");
        println!("  • Agent Specs: .claude/agents/README.md");
        println!();
        println!("{}", "🔗 Resources:".cyan().bold());
        println!("  • crates.io: https://crates.io/crates/miyabi-cli");
        println!("  • GitHub: https://github.com/ShunsukeHayashi/Miyabi");
        println!("  • Docs: https://docs.rs/miyabi-agents");

        Ok(())
    }

    fn validate_project_name(&self) -> Result<()> {
        // Check if name is valid
        if self.name.is_empty() {
            return Err(CliError::InvalidProjectName("Project name cannot be empty".to_string()));
        }

        // Check if name contains invalid characters
        if !self.name.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_') {
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
        let output = Command::new("git").args(["init"]).current_dir(project_dir).output()?;

        if !output.status.success() {
            return Err(CliError::Io(std::io::Error::other("Failed to initialize git repository")));
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

        // Create .claude/agents/README.md
        let agents_readme = r#"# Miyabi Agents

このディレクトリには、Miyabiプロジェクトで使用するAgent仕様とプロンプトを配置します。

## 📁 ディレクトリ構造

```
agents/
├── specs/           # Agent仕様定義
│   ├── coding/     # コーディング系Agent（7種類）
│   └── business/   # ビジネス系Agent（14種類）
└── prompts/        # 実行プロンプト
    ├── coding/     # コーディング系Agentプロンプト
    └── business/   # ビジネス系Agentプロンプト
```

## 🤖 Coding Agents（7種類）

1. **CoordinatorAgent** - タスク統括・DAG分解
2. **CodeGenAgent** - AI駆動コード生成
3. **ReviewAgent** - コード品質レビュー
4. **IssueAgent** - Issue分析・ラベリング
5. **PRAgent** - Pull Request自動作成
6. **DeploymentAgent** - CI/CDデプロイ自動化
7. **RefresherAgent** - Issue状態監視・更新

## 💼 Business Agents（14種類）

### 戦略・企画系（6種類）
- AIEntrepreneurAgent, ProductConceptAgent, ProductDesignAgent
- FunnelDesignAgent, PersonaAgent, SelfAnalysisAgent

### マーケティング系（5種類）
- MarketResearchAgent, MarketingAgent, ContentCreationAgent
- SNSStrategyAgent, YouTubeAgent

### 営業・顧客管理系（3種類）
- SalesAgent, CRMAgent, AnalyticsAgent

## 📝 Agent仕様の書き方

詳細は各ディレクトリのREADME.mdを参照してください：
- [specs/coding/README.md](specs/coding/README.md)
- [specs/business/README.md](specs/business/README.md)

## 🚀 Agent実行方法

```bash
# CoordinatorAgentでIssue処理
miyabi agent run coordinator --issue 123

# 複数Issue並列処理
miyabi agent run coordinator --issues 123,124,125 --concurrency 3
```

## 🔗 参考リンク

- [Miyabi Agent SDK](https://docs.rs/miyabi-agents)
- [CLAUDE.md](../../CLAUDE.md) - プロジェクトコンテキスト
"#;
        fs::write(project_dir.join(".claude/agents/README.md"), agents_readme)?;

        // Create .claude/agents/specs/coding/README.md
        let coding_specs_readme = r#"# Coding Agent 仕様

このディレクトリには、コーディング系Agent（7種類）の仕様を配置します。

## Agent仕様ファイルのフォーマット

各Agentの仕様は以下の構造で記述します：

```markdown
# [Agent名] 仕様

## 概要
Agentの役割と責任範囲

## 入力
- 受け取るTask/Issueの形式
- 必須パラメータ

## 処理フロー
1. ステップ1
2. ステップ2
3. ...

## 出力
- 生成する成果物
- 更新するIssue/PR

## エスカレーション条件
- 上位Agentへのエスカレーション基準
- エラーハンドリング

## 実行例
\`\`\`bash
miyabi agent run [agent-type] --issue 123
\`\`\`
```

## 📋 テンプレート

新しいAgent仕様を作成する場合、以下のテンプレートを使用してください：

```bash
cp example-agent-spec.md my-custom-agent.md
```

## 🔗 参考

既存のAgent仕様は以下を参照：
- Miyabiプロジェクトの `.claude/agents/specs/coding/` ディレクトリ
- [Agent Operations Manual](https://github.com/ShunsukeHayashi/Miyabi/blob/main/docs/AGENT_OPERATIONS_MANUAL.md)
"#;
        fs::write(project_dir.join(".claude/agents/specs/coding/README.md"), coding_specs_readme)?;

        // Create .claude/agents/specs/business/README.md
        let business_specs_readme = r#"# Business Agent 仕様

このディレクトリには、ビジネス系Agent（14種類）の仕様を配置します。

## Agent仕様ファイルのフォーマット

各Agentの仕様は以下の構造で記述します：

```markdown
# [Agent名] 仕様

## 概要
Agentの役割とビジネス目標

## 入力
- ユーザー要求（市場情報、目標KPI等）
- 必須パラメータ

## 実行フェーズ
1. Phase 1: データ収集
2. Phase 2: 分析
3. Phase 3: 戦略立案
4. ...

## 出力
- 生成するビジネスドキュメント
- レポート形式

## 品質基準
- 検証項目
- スコアリング基準（100点満点）

## 実行例
\`\`\`bash
miyabi agent run ai-entrepreneur --output business-plan.md
\`\`\`
```

## 📊 Business Agent一覧

### 戦略・企画系
- **AIEntrepreneurAgent** - 包括的ビジネスプラン作成
- **ProductConceptAgent** - 製品コンセプト設計
- **ProductDesignAgent** - サービス詳細設計
- **FunnelDesignAgent** - 導線設計
- **PersonaAgent** - ターゲット顧客ペルソナ
- **SelfAnalysisAgent** - 自己分析

### マーケティング系
- **MarketResearchAgent** - 市場調査
- **MarketingAgent** - マーケティング戦略
- **ContentCreationAgent** - コンテンツ制作
- **SNSStrategyAgent** - SNS戦略
- **YouTubeAgent** - YouTube運用最適化

### 営業・顧客管理系
- **SalesAgent** - セールスプロセス最適化
- **CRMAgent** - 顧客関係管理
- **AnalyticsAgent** - データ分析・PDCA

## 🔗 参考

- [SaaS Business Model Guide](https://github.com/ShunsukeHayashi/Miyabi/blob/main/docs/SAAS_BUSINESS_MODEL.md)
- [Business Agents User Guide](https://github.com/ShunsukeHayashi/Miyabi/blob/main/docs/BUSINESS_AGENTS_USER_GUIDE.md)
"#;
        fs::write(
            project_dir.join(".claude/agents/specs/business/README.md"),
            business_specs_readme,
        )?;

        // Create .claude/agents/prompts/coding/example-prompt.md
        let example_prompt = r#"# Example Agent Prompt

このファイルは、Agentプロンプトのサンプルです。

## プロンプト構造

```markdown
# [Task名]

## Context
プロジェクトのコンテキスト情報

## Objective
このAgentが達成すべき目標

## Inputs
- Issue URL: https://github.com/user/repo/issues/123
- Task ID: TASK-456
- Dependencies: TASK-123, TASK-124

## Instructions
1. ステップ1を実行
2. ステップ2を実行
3. ...

## Output Format
期待される出力形式（JSON, Markdown, Code等）

## Success Criteria
- 基準1
- 基準2
```

## 使用方法

Worktree内でClaude Codeセッションを起動する際、このプロンプトが自動的に読み込まれます。

```bash
cd .worktrees/issue-123
# Claude Codeがこのプロンプトを参照して実行
```

## カスタマイズ

プロジェクト固有のプロンプトを作成する場合：

1. このファイルをコピー
2. 内容をカスタマイズ
3. `.claude/agents/prompts/coding/` に配置

## 🔗 参考

実際のプロンプト例は、Miyabiプロジェクトの `.claude/agents/prompts/coding/` を参照してください。
"#;
        fs::write(
            project_dir.join(".claude/agents/prompts/coding/example-prompt.md"),
            example_prompt,
        )?;

        // Create REAL example: CodeGen Agent spec
        let codegen_example = r#"# CodeGenAgent Specification

## 概要
CodeGenAgentは、AI駆動のコード生成を担当するSpecialist Agentです。
Claude Sonnet 4を使用して、型安全で高品質なRustコードを生成します。

## 入力
- **Task**: CoordinatorAgentから受け取ったTask
  - Task ID
  - 依存関係（Dependencies）
  - 生成すべきコードの仕様
- **Issue Context**: 元のIssue情報

## 処理フロー

### 1. 要件分析
- Taskの内容を解析
- 必要なモジュール・トレイト・構造体を特定
- 既存コードとの整合性確認

### 2. コード生成
```rust
// 例: 新しいAgent構造体の生成
pub struct NewAgent {
    config: AgentConfig,
}

#[async_trait]
impl BaseAgent for NewAgent {
    async fn execute(&self, task: Task) -> Result<AgentResult> {
        // Implementation
        Ok(AgentResult::success(data))
    }
}
```

### 3. テスト生成
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_new_agent() {
        let agent = NewAgent::new(config);
        let result = agent.execute(task).await.unwrap();
        assert_eq!(result.status, ResultStatus::Success);
    }
}
```

### 4. ドキュメント生成
- Rustdocコメント（`///`）の追加
- 使用例の記述
- パラメータ・戻り値の説明

## 出力
- **生成コード**: Rust source files
- **テスト**: `#[cfg(test)]` mod
- **ドキュメント**: Rustdoc comments
- **Commit**: Conventional Commits形式

## エスカレーション条件
- 既存コードとの大規模なコンフリクト
- セキュリティ上の懸念（unsafe使用等）
- 外部依存の追加が必要

## 品質基準
- ✅ Clippy警告0件
- ✅ テストカバレッジ80%以上
- ✅ すべてのpublic APIにRustdoc
- ✅ エラーハンドリング完備

## 実行例
```bash
miyabi agent run codegen --issue 123
```

または簡易コマンド:
```bash
miyabi work-on 123
```

---

**このファイルはClaude Codeが参照する実際のAgent仕様です。**
**プロジェクト固有の要件に合わせてカスタマイズしてください。**
"#;
        fs::write(
            project_dir.join(".claude/agents/specs/coding/codegen-agent-example.md"),
            codegen_example,
        )?;

        // Create REAL example: Issue creation workflow
        let issue_workflow_example = format!(
            r#"# Issue Creation Workflow Example

このファイルは、{}プロジェクトでの標準的なIssue作成フローです。

## ステップ1: Issue作成

### GitHub Web UIで作成
1. リポジトリの"Issues"タブをクリック
2. "New issue"をクリック
3. Issueテンプレートを使用（推奨）

### GitHub CLIで作成（推奨）
```bash
gh issue create \
  --title "✨ Add user authentication" \
  --body "$(cat <<'EOF'
## 概要
ユーザー認証機能を追加する

## 要件
- [ ] JWT トークン認証
- [ ] ログイン/ログアウトエンドポイント
- [ ] トークンリフレッシュ機能

## 期待される成果
- 認証付きAPIエンドポイント
- テストカバレッジ90%以上
- セキュリティ監査パス
EOF
)" \
  --label "type:feature,priority:P1-High,state:pending"
```

## ステップ2: Agent実行

### 方法1: 新しいwork-onコマンド（推奨）
```bash
# Issue番号で実行
miyabi work-on 1

# または作業説明で実行（Issue作成を提案）
miyabi work-on "Add user authentication"
```

### 方法2: 従来のagentコマンド
```bash
miyabi agent run coordinator --issue 1
```

### 方法3: 並列実行
```bash
miyabi parallel --issues 1,2,3 --concurrency 2
```

## ステップ3: 進捗確認

```bash
# プロジェクトステータス確認
miyabi status

# Issue状態確認
gh issue view 1

# Worktree確認
git worktree list

# ログ確認
tail -f logs/miyabi-$(date +%Y%m%d).log
```

## ステップ4: レビュー

Agentが自動的に：
1. コード生成
2. テスト作成
3. Linter実行
4. PR作成

あなたがすべきこと：
1. PRレビュー
2. 追加修正（必要なら）
3. マージ

## 実際の例

### 成功例: Issue #42 "Setup CI/CD pipeline"

```bash
$ miyabi work-on 42

🚀 Let's work on it!
  📋 Issue #42

🤖 CoordinatorAgent starting...
  ✅ Analyzed issue
  ✅ Created 3 tasks
  ✅ Assigned CodeGenAgent, ReviewAgent, DeploymentAgent

⏱️  Estimated time: 15 minutes
🌳 Created worktree: .worktrees/issue-42

[15 minutes later]

✅ All tasks completed!
📊 Quality score: 95/100
🔗 PR created: #43
```

## トラブルシューティング

### Agentがスタックした場合
```bash
# ログ確認
grep -i "error" logs/miyabi-*.log

# Worktreeクリーンアップ
git worktree prune

# 再実行
miyabi work-on 42
```

### より詳しいヘルプ
```bash
# トラブルシューティングガイド
cat docs/TROUBLESHOOTING.md

# Agent仕様確認
cat .claude/agents/README.md
```

---

**{}プロジェクトの標準ワークフロー**
**Miyabi - Beauty in Autonomous Development 🌸**
"#,
            self.name, self.name
        );
        fs::write(
            project_dir.join(".claude/agents/issue-workflow-example.md"),
            issue_workflow_example,
        )?;

        Ok(())
    }

    fn create_config_files(&self, project_dir: &Path) -> Result<()> {
        // Create .miyabi.yml
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
            self.name,
            worktree_base.to_string_lossy()
        );

        fs::write(project_dir.join(".miyabi.yml"), miyabi_config)?;

        // Create .gitignore
        let gitignore = format!(
            r#"# Miyabi
.miyabi.yml
{worktree_entry}logs/
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
"#,
            worktree_entry = if worktree_base.is_absolute() {
                String::new()
            } else {
                format!("{}/\n", worktree_base.to_string_lossy())
            }
        );

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

        // Create docs/GETTING_STARTED.md
        let getting_started = format!(
            r#"# Getting Started with {}

Miyabiプロジェクトへようこそ！このガイドでは、ゼロからMiyabiを使い始めるまでの手順を詳しく解説します。

## 📋 前提条件

### 必須

- **Rust**: 1.75.0以上
  ```bash
  rustc --version  # 確認
  ```

- **Git**: バージョン管理用
  ```bash
  git --version
  ```

- **GitHubアカウント**: Issue/PR管理用

### 推奨

- **GitHub CLI (`gh`)**: GitHub操作を簡単に
  ```bash
  brew install gh  # macOS
  gh --version
  ```

## 🚀 セットアップ手順

### Step 1: 環境変数の設定

#### 1.1 GitHub Personal Access Token取得

1. https://github.com/settings/tokens/new にアクセス
2. Token名を入力（例: "Miyabi Local Dev"）
3. 以下のスコープを選択：
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
4. "Generate token"をクリック
5. トークンをコピー（**一度しか表示されません！**）

#### 1.2 環境変数をシェルプロファイルに追加

**Bash (.bashrc / .bash_profile):**
```bash
echo 'export GITHUB_TOKEN=ghp_xxxxx' >> ~/.bashrc
echo 'export ANTHROPIC_API_KEY=sk-ant-xxxxx' >> ~/.bashrc
source ~/.bashrc
```

**Zsh (.zshrc):**
```bash
echo 'export GITHUB_TOKEN=ghp_xxxxx' >> ~/.zshrc
echo 'export ANTHROPIC_API_KEY=sk-ant-xxxxx' >> ~/.zshrc
source ~/.zshrc
```

#### 1.3 環境変数確認
```bash
echo $GITHUB_TOKEN
echo $ANTHROPIC_API_KEY
```

### Step 2: GitHubリポジトリ作成

#### 2.1 GitHub CLI使用（推奨）
```bash
cd {}
gh repo create {} --private --source=. --remote=origin
```

#### 2.2 手動作成
1. https://github.com/new にアクセス
2. Repository nameに `{}` を入力
3. "Private"を選択
4. "Create repository"をクリック
5. ローカルリポジトリと接続：
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/{}.git
   git branch -M main
   git add .
   git commit -m "feat: initial commit 🚀"
   git push -u origin main
   ```

### Step 3: Label体系のセットアップ

Miyabiは53ラベル体系で自動化を制御します。

#### 3.1 自動セットアップ（将来実装予定）
```bash
miyabi setup labels
```

#### 3.2 手動セットアップ
GitHubリポジトリの設定から、以下のラベルを作成：

**STATE（8個）**:
- `📥 state:pending` (Gray)
- `🔍 state:analyzing` (Blue)
- `🏗️ state:implementing` (Yellow)
- `👀 state:reviewing` (Orange)
- `✅ state:done` (Green)
- `❌ state:blocked` (Red)
- `⏸️ state:on-hold` (Purple)
- `🔄 state:reopened` (Pink)

（残り45ラベルは`.github/labels.yml`を参照）

### Step 4: 最初のIssue作成

#### 4.1 GitHub Web UIで作成
1. リポジトリの"Issues"タブをクリック
2. "New issue"をクリック
3. Title: "✨ Setup project configuration"
4. Body:
   ```markdown
   ## 概要
   プロジェクトの初期設定を行う

   ## タスク
   - [ ] .miyabi.yml の設定確認
   - [ ] GitHub Actionsの設定
   - [ ] 開発環境の準備

   ## 期待される成果
   - プロジェクトが動作可能な状態
   ```
5. Labels:
   - `✨ type:feature`
   - `⚠️ priority:P1-High`
   - `📥 state:pending`
6. "Submit new issue"をクリック

#### 4.2 GitHub CLIで作成
```bash
gh issue create --title "✨ Setup project configuration" \
  --body "初期設定タスク" \
  --label "type:feature,priority:P1-High,state:pending"
```

### Step 5: Agent実行

#### 5.1 ステータス確認
```bash
miyabi status
```

出力例：
```
📊 Project Status

Miyabi Installation:
  ✅ Miyabi is installed
    ✓ .claude/agents
    ✓ .github/workflows

Environment:
  ✅ GITHUB_TOKEN is set
  ✅ DEVICE_IDENTIFIER: YourMac.local

Git Repository:
  ✅ Git repository detected
    Branch: main
    Remotes: origin
```

#### 5.2 CoordinatorAgent実行
```bash
miyabi agent run coordinator --issue 1
```

Agentは以下を実行します：
1. Issue分析
2. Task分解（DAG構築）
3. Worktree作成
4. Specialist Agent割り当て
5. 並列実行
6. 結果統合

## 🎯 よくある使い方

### Issue処理の基本フロー
```bash
# 1. Issue作成（GitHub UI または gh CLI）
gh issue create --title "新機能実装" --label "type:feature"

# 2. Agent実行
miyabi agent run coordinator --issue 2

# 3. ステータス確認
miyabi status

# 4. ログ確認
cat logs/miyabi-*.log
```

### 複数Issue並列処理
```bash
miyabi agent run coordinator --issues 1,2,3 --concurrency 2
```

### Worktree確認
```bash
git worktree list
```

## 📚 次に読むべきドキュメント

1. **CLAUDE.md** - プロジェクトコンテキスト（Claude Codeが自動参照）
2. **.claude/QUICK_START.md** - 3分で始めるクイックガイド
3. **.claude/agents/README.md** - Agent一覧と使い方
4. **docs/TROUBLESHOOTING.md** - トラブルシューティング

## 🆘 困ったときは

### エラーが出た場合
1. `docs/TROUBLESHOOTING.md` を確認
2. `miyabi status` で環境確認
3. GitHub Issuesで質問: https://github.com/ShunsukeHayashi/Miyabi/issues

### ログ確認
```bash
# 最新のログファイル
tail -f logs/miyabi-$(date +%Y%m%d).log

# エラーログのみ抽出
grep -i error logs/miyabi-*.log
```

## 🎉 次のステップ

おめでとうございます！Miyabiのセットアップが完了しました。

次は：
1. **独自のAgent仕様作成**: `.claude/agents/specs/coding/` にカスタムAgent追加
2. **Label体系のカスタマイズ**: プロジェクトに合わせたLabel追加
3. **GitHub Actionsの設定**: `.github/workflows/` でCI/CD自動化
4. **Worktree並列実行**: 複数Issueの同時処理

---

**Miyabi** - Beauty in Autonomous Development 🌸
"#,
            self.name, self.name, self.name, self.name, self.name
        );
        fs::write(project_dir.join("docs/GETTING_STARTED.md"), getting_started)?;

        // Create docs/TROUBLESHOOTING.md
        let troubleshooting = r#"# Troubleshooting Guide

Miyabi使用中に発生する可能性のある問題と解決策をまとめています。

## 🔧 環境関連

### GITHUB_TOKENが設定されていない

**症状**:
```
Error: GITHUB_TOKEN not set
```

**解決策**:
1. トークンを取得: https://github.com/settings/tokens/new
2. 環境変数を設定:
   ```bash
   export GITHUB_TOKEN=ghp_xxxxx
   ```
3. シェルプロファイルに追加（永続化）:
   ```bash
   echo 'export GITHUB_TOKEN=ghp_xxxxx' >> ~/.zshrc
   source ~/.zshrc
   ```

### ANTHROPIC_API_KEYが設定されていない

**症状**:
```
Error: ANTHROPIC_API_KEY not set
```

**解決策**:
1. Anthropic Consoleでキー取得: https://console.anthropic.com/
2. 環境変数を設定:
   ```bash
   export ANTHROPIC_API_KEY=sk-ant-xxxxx
   ```

## 🐛 Git関連

### Git repositoryが見つからない

**症状**:
```
Error: Not a git repository
```

**解決策**:
```bash
cd your-project
git init
```

### Worktreeが残ったまま

**症状**:
```
Error: Worktree already exists: .worktrees/issue-123
```

**解決策**:
```bash
# Worktree一覧確認
git worktree list

# 不要なWorktreeを削除
git worktree remove .worktrees/issue-123

# すべてのstale Worktreeをクリーンアップ
git worktree prune
```

### マージコンフリクト

**症状**:
```
CONFLICT (content): Merge conflict in src/main.rs
```

**解決策**:
```bash
# コンフリクトファイルを確認
git status

# 手動でコンフリクトを解決
# エディタでファイルを開き、<<<<<<<, =======, >>>>>>> マーカーを削除

# 解決後
git add src/main.rs
git commit -m "fix: resolve merge conflict"
```

## 🤖 Agent関連

### Agent実行が失敗する

**症状**:
```
Error: Agent execution failed
```

**解決策**:
1. ログファイル確認:
   ```bash
   tail -f logs/miyabi-$(date +%Y%m%d).log
   ```
2. Issue番号が正しいか確認:
   ```bash
   gh issue list
   ```
3. Labelが正しく設定されているか確認

### Issue番号が見つからない

**症状**:
```
Error: Issue #123 not found
```

**解決策**:
```bash
# Issue一覧確認
gh issue list --limit 50

# 正しい番号で再実行
miyabi agent run coordinator --issue 正しい番号
```

## 📦 インストール関連

### `miyabi` コマンドが見つからない

**症状**:
```
command not found: miyabi
```

**解決策**:
```bash
# crates.ioから再インストール
cargo install miyabi-cli --force

# パス確認
which miyabi

# Cargo binディレクトリがPATHに含まれているか確認
echo $PATH | grep -o "$HOME/.cargo/bin"

# なければ追加
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### コンパイルエラー

**症状**:
```
error: failed to compile miyabi-cli
```

**解決策**:
```bash
# Rustを最新版にアップデート
rustup update stable

# Cargoキャッシュをクリア
rm -rf ~/.cargo/registry
rm -rf ~/.cargo/git

# 再インストール
cargo install miyabi-cli
```

## 🌐 GitHub関連

### API Rate Limit

**症状**:
```
Error: API rate limit exceeded
```

**解決策**:
1. GitHubにログイン状態か確認:
   ```bash
   gh auth status
   ```
2. Personal Access Tokenのスコープ確認
3. しばらく待つ（Rate limitは1時間でリセット）

### Permission denied

**症状**:
```
Error: Resource not accessible by personal access token
```

**解決策**:
1. トークンのスコープを確認: `repo`, `workflow` が必要
2. 新しいトークンを生成
3. 環境変数を更新

## 🔍 デバッグ方法

### 詳細ログを有効化

`.miyabi.yml` でログレベルを変更:
```yaml
logging:
  level: debug  # info → debug
  directory: "./logs"
```

### ログファイルの確認

```bash
# 最新のログ
tail -100 logs/miyabi-$(date +%Y%m%d).log

# エラーのみ抽出
grep -i "error\|fail" logs/miyabi-*.log

# 特定のAgentのログ
grep -i "CoordinatorAgent" logs/miyabi-*.log
```

### miyabi status の活用

```bash
miyabi status

# 出力例:
# Miyabi Installation: ✅ or ❌
# Environment: GITHUB_TOKEN, ANTHROPIC_API_KEY の状態
# Git Repository: ブランチ、コミット状態
# Worktrees: アクティブなWorktree数
```

## 🆘 それでも解決しない場合

### サポートを受ける

1. **GitHub Issues**: https://github.com/ShunsukeHayashi/Miyabi/issues
   - 詳細なエラーメッセージを含めてください
   - `miyabi status` の出力を添付
   - ログファイルの関連部分を添付

2. **Discord Community**: （準備中）

3. **ドキュメント**:
   - [GETTING_STARTED.md](GETTING_STARTED.md)
   - [CLAUDE.md](../CLAUDE.md)
   - [GitHub Discussions](https://github.com/ShunsukeHayashi/Miyabi/discussions)

### 報告に含めるべき情報

```bash
# システム情報
uname -a

# Rustバージョン
rustc --version
cargo --version

# miyabiバージョン
miyabi --version

# プロジェクト状態
miyabi status

# 直近のログ
tail -50 logs/miyabi-$(date +%Y%m%d).log
```

---

**Miyabi** - Beauty in Autonomous Development 🌸
"#;
        fs::write(project_dir.join("docs/TROUBLESHOOTING.md"), troubleshooting)?;

        println!("  Created configuration files");
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_project_name() {
        let valid_cmd = InitCommand::with_interactive("my-project".to_string(), false, false);
        assert!(valid_cmd.validate_project_name().is_ok());

        let valid_cmd = InitCommand::with_interactive("my_project_123".to_string(), false, false);
        assert!(valid_cmd.validate_project_name().is_ok());

        let invalid_cmd = InitCommand::with_interactive("".to_string(), false, false);
        assert!(invalid_cmd.validate_project_name().is_err());

        let invalid_cmd = InitCommand::with_interactive("my project".to_string(), false, false);
        assert!(invalid_cmd.validate_project_name().is_err());

        let invalid_cmd = InitCommand::with_interactive("my@project".to_string(), false, false);
        assert!(invalid_cmd.validate_project_name().is_err());
    }

    #[test]
    fn test_validate_project_name_valid_cases() {
        let valid_names = vec![
            "project",
            "my-project",
            "my_project",
            "Project123",
            "test-app-v2",
            "api_backend_service",
            "web-app-2024",
        ];

        for name in valid_names {
            let cmd = InitCommand::with_interactive(name.to_string(), false, false);
            assert!(cmd.validate_project_name().is_ok(), "Should be valid: {}", name);
        }
    }

    #[test]
    fn test_validate_project_name_invalid_cases() {
        let invalid_names = vec![
            "",               // empty
            "my project",     // space
            "project!",       // special char
            "project@home",   // @ symbol
            "project.name",   // dot
            "project/name",   // slash
            "project\\name",  // backslash
            "project name 2", // multiple spaces
            "project#1",      // hash
        ];

        for name in invalid_names {
            let cmd = InitCommand::with_interactive(name.to_string(), false, false);
            assert!(cmd.validate_project_name().is_err(), "Should be invalid: {}", name);
        }
    }

    #[test]
    fn test_init_command_creation() {
        let cmd = InitCommand::with_interactive("test".to_string(), false, false);
        assert_eq!(cmd.name, "test");
        assert!(!cmd.private);
        assert!(!cmd.interactive);

        let cmd = InitCommand::with_interactive("test".to_string(), true, true);
        assert_eq!(cmd.name, "test");
        assert!(cmd.private);
        assert!(cmd.interactive);
    }

    #[test]
    fn test_project_type_as_str() {
        assert_eq!(ProjectType::WebApp.as_str(), "Web App (React/Next.js/SvelteKit)");
        assert_eq!(ProjectType::ApiBackend.as_str(), "API Backend (Rust/Node.js/Python)");
        assert_eq!(ProjectType::CliTool.as_str(), "CLI Tool (Rust/Go)");
        assert_eq!(ProjectType::Library.as_str(), "Library/SDK (Rust/TypeScript)");
    }
}
