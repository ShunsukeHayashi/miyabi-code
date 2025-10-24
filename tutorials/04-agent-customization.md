# Tutorial 4: Agent Customization - Building Your Own Prompts

**Estimated Time**: 60 minutes
**Difficulty**: ⭐⭐ Intermediate
**Prerequisites**: Completed Tutorials 1-3, YAML/Markdown familiarity, Basic understanding of LLM prompting

## Learning Objectives

By the end of this tutorial, you will:
- Understand Agent spec file structure and key components
- Customize existing Agent prompts for specific workflows
- Configure Agent parameters via `miyabi.toml`
- Override default Agent behaviors safely
- Test and validate custom Agents before deployment

## Prerequisites

Before starting, ensure you have:
- **Completed Beginner Tutorials**: Tutorials 1-3 are essential
- **Text Editor**: VS Code, Vim, or any editor with YAML/Markdown syntax highlighting
- **LLM Prompting Knowledge**: Basic understanding of how to write effective AI prompts
- **Running Miyabi Installation**: Able to execute `miyabi agent run` commands

## Introduction

Miyabi's power lies in its 21 autonomous Agents, but one size doesn't fit all. Different teams have different coding standards, documentation styles, and workflows. That's where Agent customization comes in.

In this tutorial, you'll learn how to customize Agents to match your team's unique requirements. You'll modify CodeGenAgent to follow a specific coding style, adjust ReviewAgent's scoring criteria, and configure Agents to use different LLM backends.

By the end, you'll have a customized Miyabi setup that feels like it was built specifically for your team.

## Agent Spec Files Overview

Every Miyabi Agent is defined by two key files:
1. **Agent Spec** (`.claude/agents/specs/coding/*.md` or `.../business/*.md`)
2. **Agent Prompt** (`.claude/agents/prompts/coding/*.md`)

### Location and Structure

```bash
.claude/agents/
├── specs/
│   ├── coding/
│   │   ├── coordinator-agent.md
│   │   ├── codegen-agent.md
│   │   ├── review-agent.md
│   │   └── ...
│   └── business/
│       ├── ai-entrepreneur-agent.md
│       ├── content-creation-agent.md
│       └── ...
└── prompts/
    └── coding/
        ├── codegen-agent-prompt.md
        ├── review-agent-prompt.md
        └── ...
```

### Agent Spec Anatomy

Let's examine the structure of a typical Agent spec file. Here's a simplified version of `codegen-agent.md`:

```yaml
---
name: CodeGenAgent
description: AI駆動コード生成Agent - Claude Sonnet 4による自動コード生成
authority: 🔵実行権限
escalation: TechLead (アーキテクチャ問題時)
---

# CodeGenAgent - AI駆動コード生成Agent

## 役割
GitHub Issueの内容を解析し、Claude Sonnet 4 APIを使用して必要なコード実装を自動生成します。

## 責任範囲
- Issue内容の理解と要件抽出
- Rustコード自動生成（Rust 2021 Edition、Clippy準拠）
- ユニットテスト自動生成
- 型定義の追加
- Rustdocコメントの生成

## 実行権限
🔵 **実行権限**: コード生成を直接実行可能（ReviewAgent検証後にマージ）

## 成功条件
✅ **必須条件**:
- コードが`cargo build`成功する
- `cargo clippy`警告0件
- `cargo test`がパスする
- 基本的なテストが生成される
```

**Key Sections**:
- **YAML Frontmatter**: Metadata about the Agent (name, authority, escalation rules)
- **役割 (Role)**: High-level description of the Agent's purpose
- **責任範囲 (Responsibilities)**: Specific tasks the Agent handles
- **実行権限 (Execution Authority)**: What the Agent can do autonomously
- **成功条件 (Success Criteria)**: Measurable outcomes to verify completion

### Agent Prompt Anatomy

Agent prompts are Markdown files containing step-by-step instructions for execution within a Git Worktree. Example from `codegen-agent-prompt.md`:

```markdown
# CodeGenAgent - Worktree実行プロンプト

あなたはCodeGenAgent（つくるん）です。このWorktree内でIssueに対応するコードを実装してください。

## Step 1: コンテキスト理解
`EXECUTION_CONTEXT.md`を読み、Issue内容とTaskの詳細を確認してください。

## Step 2: 既存コード分析
関連するファイルを`Read`ツールで読み込み、既存の実装パターンを理解してください。

## Step 3: コード生成
Rust 2021 Editionに準拠し、以下を満たすコードを生成してください:
- Clippy準拠（32 lints対応）
- ユニットテスト（`#[tokio::test]`）
- Rustdocコメント（`///`）

## Step 4: テスト実行
```bash
cargo test --package [your-crate]
cargo clippy
```

## Step 5: コミット
Conventional Commits形式でコミットしてください。
```

**Key Elements**:
- **Context Injection**: References to `EXECUTION_CONTEXT.md` and `.agent-context.json`
- **Step-by-Step Instructions**: Clear, actionable steps
- **Code Examples**: Runnable commands and code snippets
- **Quality Gates**: Testing and validation requirements

## Customizing Existing Agents

Now let's customize CodeGenAgent to enforce a specific coding style.

### Scenario: Enforce Custom Error Handling

Your team uses a custom error handling pattern with `thiserror` and specific error message formats. Let's customize CodeGenAgent to enforce this.

### Step 1: Copy the Original Spec

**Best Practice**: Never modify original specs directly. Create a custom version.

```bash
cd /Users/shunsuke/Dev/miyabi-private
cp .claude/agents/specs/coding/codegen-agent.md \
   .claude/agents/specs/coding/codegen-agent-custom.md
```

### Step 2: Modify the Spec

Edit `.claude/agents/specs/coding/codegen-agent-custom.md`:

```yaml
---
name: CodeGenAgent
description: AI駆動コード生成Agent - カスタムエラー処理パターン適用版
authority: 🔵実行権限
escalation: TechLead (アーキテクチャ問題時)
custom_rules:
  error_handling: thiserror
  error_format: "Context-first format"
---

# CodeGenAgent - カスタム版

## 役割
（既存の役割を維持）

## 責任範囲
（既存の責任範囲に加えて）

- **カスタムエラー処理**:
  - `thiserror` crate使用必須
  - エラー型は`{Feature}Error`命名規則
  - Context-first error messages: `Failed to {action}: {reason}`

## コード生成規則

### エラー処理パターン

すべてのエラーは以下のパターンに従う:

```rust
use thiserror::Error;

#[derive(Debug, Error)]
pub enum MyFeatureError {
    #[error("Failed to execute task: {reason}")]
    ExecutionError { reason: String },

    #[error("Failed to read file {path}: {source}")]
    FileReadError {
        path: String,
        #[source]
        source: std::io::Error,
    },
}
```

### エラーメッセージフォーマット

すべてのエラーメッセージは **Context-first** 形式:
- ✅ "Failed to connect to database: connection timeout"
- ❌ "Connection timeout: database connection failed"

## 成功条件

✅ **必須条件**（既存に加えて）:
- すべてのエラー型が`thiserror`を使用
- エラーメッセージがContext-first形式
- エラー型命名規則に準拠
```

### Step 3: Update the Agent Prompt

Edit `.claude/agents/prompts/coding/codegen-agent-prompt-custom.md`:

```markdown
# CodeGenAgent - カスタムエラー処理版プロンプト

（既存プロンプトの内容）

## Step 3: コード生成（カスタム版）

### エラー処理実装

**必須ルール**:
1. すべてのエラーは`thiserror::Error`を使用
2. エラー型命名: `{Feature}Error`
3. エラーメッセージ: `Failed to {action}: {reason}`

**実装例**:

```rust
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AgentError {
    #[error("Failed to execute agent task: {reason}")]
    ExecutionError { reason: String },

    #[error("Failed to parse config at {path}: {source}")]
    ConfigParseError {
        path: String,
        #[source]
        source: serde_json::Error,
    },
}

// 使用例
fn execute_task() -> Result<(), AgentError> {
    let config = read_config().map_err(|e| AgentError::ExecutionError {
        reason: format!("Failed to read config: {}", e),
    })?;
    Ok(())
}
```

## Step 4: 検証

カスタムルールに準拠しているか確認:

```bash
# エラー型の命名規則チェック
rg "enum \w+Error" --type rust

# thiserror使用チェック
rg "derive.*Error" --type rust

# エラーメッセージフォーマットチェック
rg 'error\("Failed to' --type rust
```
```

### Step 4: Configure Miyabi to Use Custom Spec

Edit `miyabi.toml` (or create it if it doesn't exist):

```toml
[agents.codegen]
spec_path = ".claude/agents/specs/coding/codegen-agent-custom.md"
prompt_path = ".claude/agents/prompts/coding/codegen-agent-prompt-custom.md"
enabled = true

# Optional: Override LLM settings
[agents.codegen.llm]
model = "claude-sonnet-4-20250514"
max_tokens = 8000
reasoning_effort = "medium"  # low, medium, high
```

## Creating Custom Agent Prompts

Effective prompts are the key to Agent success. Let's explore prompt engineering best practices for Miyabi Agents.

### Prompt Engineering Principles

#### 1. Be Specific and Actionable

**Bad Prompt**:
```
Generate some code for the Issue.
```

**Good Prompt**:
```
Generate Rust code that implements the Issue requirements. Ensure:
1. Code compiles with `cargo build`
2. All tests pass with `cargo test`
3. Clippy warnings are resolved
4. Code follows project style guide
```

#### 2. Provide Context

Always reference the Worktree context files:

```markdown
## Step 1: コンテキスト理解

以下のファイルを読み込み、実行コンテキストを理解してください:

1. **EXECUTION_CONTEXT.md**: Issue情報、Task詳細、Worktreeパス
2. **.agent-context.json**: 機械可読コンテキスト（Agent設定、プロンプトパス）

```bash
# コンテキスト確認
cat EXECUTION_CONTEXT.md
cat .agent-context.json
```
```

#### 3. Include Examples

Examples are worth a thousand words:

```markdown
## Step 3: ユニットテスト生成

すべての公開関数に対してテストを生成してください。

**テスト例**:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_execute_task_success() {
        let agent = CoordinatorAgent::new(Config::default());
        let task = Task::new("test-task", TaskType::Analysis);

        let result = agent.execute(&task).await;

        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_execute_task_invalid_input() {
        let agent = CoordinatorAgent::new(Config::default());
        let task = Task::new("", TaskType::Analysis);

        let result = agent.execute(&task).await;

        assert!(result.is_err());
    }
}
```
```

#### 4. Define Clear Success Criteria

```markdown
## 成功チェックリスト

実装完了前に以下を確認してください:

- [ ] `cargo build` が成功する
- [ ] `cargo test` が全てパスする
- [ ] `cargo clippy` が警告0件
- [ ] カスタムエラー処理ルールに準拠
- [ ] 全ての公開関数にRustdocコメント
- [ ] `EXECUTION_CONTEXT.md` に成果物パスを記載
```

#### 5. Output Formatting

Specify how the Agent should report results:

```markdown
## Step 5: 結果レポート

`EXECUTION_CONTEXT.md`に以下の形式で結果を追記してください:

```markdown
## 実行結果

**Generated Files**:
- `crates/miyabi-agents/src/my_feature.rs` (124 lines)
- `crates/miyabi-agents/tests/my_feature_test.rs` (56 lines)

**Test Results**:
```
cargo test
   Running tests (target/debug/deps/miyabi_agents-xxx)
running 3 tests
test tests::test_my_feature ... ok
test tests::test_error_handling ... ok
test tests::test_edge_cases ... ok

test result: ok. 3 passed; 0 failed
```

**Quality Metrics**:
- Lines of Code: 180
- Test Coverage: 85%
- Clippy Warnings: 0
```
```

### Real-World Example: Custom ReviewAgent Prompt

Let's create a custom ReviewAgent prompt that focuses on security best practices.

**File**: `.claude/agents/prompts/coding/review-agent-prompt-security.md`

```markdown
# ReviewAgent - セキュリティ重視版プロンプト

あなたはReviewAgent（めだまん）です。セキュリティベストプラクティスに特化してコードレビューを実施してください。

## Step 1: セキュリティチェックリスト

以下のセキュリティリスクを重点的に確認:

### 1. 入力バリデーション
- [ ] ユーザー入力は全てバリデーション済み
- [ ] SQLインジェクション対策（パラメータ化クエリ使用）
- [ ] パストラバーサル対策（`../`の適切な処理）

### 2. 認証・認可
- [ ] APIトークンはハードコーディングされていない
- [ ] 環境変数から安全に読み込んでいる
- [ ] アクセス権限チェックが適切

### 3. データ保護
- [ ] 機密情報はログに出力していない
- [ ] パスワードは平文保存されていない
- [ ] HTTPSを使用（HTTP禁止）

### 4. 依存関係
- [ ] 既知の脆弱性を含むcrateを使用していない
- [ ] `cargo audit`でチェック済み

## Step 2: セキュリティスコアリング

100点満点でスコアリング（90点以上必須）:

- **入力バリデーション**: 25点
- **認証・認可**: 25点
- **データ保護**: 25点
- **依存関係セキュリティ**: 25点

## Step 3: レポート生成

セキュリティレビューレポートを生成:

```markdown
# セキュリティレビューレポート

**Total Score**: 92/100

## 詳細評価

### 入力バリデーション (23/25)
✅ ユーザー入力のバリデーション実装済み
⚠️ エッジケース（空文字列）のテスト不足

### 認証・認可 (25/25)
✅ APIトークンは環境変数から読み込み
✅ アクセス権限チェック実装済み

### データ保護 (22/25)
✅ 機密情報はログ出力していない
⚠️ エラーメッセージに内部パス情報が含まれる可能性

### 依存関係セキュリティ (22/25)
✅ `cargo audit`で脆弱性なし
⚠️ 一部のcrateバージョンが古い

## 推奨事項

1. エッジケーステストを追加
2. エラーメッセージから内部情報を削除
3. 依存関係を最新版にアップデート
```
```

## Configuration Options

Miyabi's behavior can be customized via `miyabi.toml` configuration file.

### Basic Configuration Structure

```toml
# miyabi.toml
[project]
name = "miyabi"
version = "2.0.0"
repository = "https://github.com/ShunsukeHayashi/Miyabi"

[github]
token_env = "GITHUB_TOKEN"
default_branch = "main"

[agents]
# Global Agent settings
max_concurrency = 5
default_reasoning_effort = "medium"

[agents.coordinator]
enabled = true
spec_path = ".claude/agents/specs/coding/coordinator-agent.md"
prompt_path = ".claude/agents/prompts/coding/coordinator-agent-prompt.md"

[agents.coordinator.llm]
model = "claude-sonnet-4-20250514"
max_tokens = 16000
reasoning_effort = "high"  # coordinator needs deep reasoning

[agents.codegen]
enabled = true
spec_path = ".claude/agents/specs/coding/codegen-agent-custom.md"  # Custom spec
prompt_path = ".claude/agents/prompts/coding/codegen-agent-prompt-custom.md"

[agents.codegen.llm]
model = "claude-sonnet-4-20250514"
max_tokens = 8000
reasoning_effort = "medium"

[agents.review]
enabled = true
spec_path = ".claude/agents/specs/coding/review-agent.md"
prompt_path = ".claude/agents/prompts/coding/review-agent-prompt-security.md"  # Custom prompt

[agents.review.llm]
model = "claude-sonnet-4-20250514"
max_tokens = 6000
reasoning_effort = "medium"

[agents.review.scoring]
# Custom scoring weights
quality_weight = 0.4
security_weight = 0.3  # Increased from default 0.2
maintainability_weight = 0.2
performance_weight = 0.1

[worktree]
base_path = ".worktrees"
auto_cleanup = true
max_worktrees = 10

[logging]
level = "info"  # trace, debug, info, warn, error
format = "json"  # json, pretty
output_dir = ".ai/logs"
```

### LLM Backend Selection

Miyabi supports multiple LLM backends:

```toml
[agents.codegen.llm]
# Option 1: Claude Sonnet 4 (default, most capable)
model = "claude-sonnet-4-20250514"
provider = "anthropic"

# Option 2: GPT-OSS-20B (open-source, self-hosted)
model = "gpt-oss-20b"
provider = "ollama"
endpoint = "http://localhost:11434"

# Option 3: Groq (fast inference)
model = "llama-3.1-70b"
provider = "groq"
api_key_env = "GROQ_API_KEY"

# Option 4: vLLM (self-hosted, optimized)
model = "meta-llama/Meta-Llama-3.1-70B"
provider = "vllm"
endpoint = "http://localhost:8000"
```

### Reasoning Effort Levels

Control the depth of reasoning for each Agent:

```toml
[agents.coordinator.llm]
reasoning_effort = "high"  # Deep analysis, slower, more accurate

[agents.codegen.llm]
reasoning_effort = "medium"  # Balanced

[agents.deployment.llm]
reasoning_effort = "low"  # Quick decisions, fast execution
```

**Effort Levels**:
- **Low**: Fast responses, basic reasoning (~1-2 seconds)
- **Medium**: Balanced reasoning and speed (~3-5 seconds)
- **High**: Deep analysis, complex decision-making (~5-10 seconds)

## Testing Custom Agents

Before deploying custom Agents to production, thorough testing is essential.

### Dry-Run Mode

Test your custom Agent without making actual changes:

```bash
miyabi agent run codegen --issue 270 --dry-run
```

**What Happens in Dry-Run**:
1. Agent reads the Issue and Task
2. Plans the execution (visible in logs)
3. Simulates file changes (no actual writes)
4. Reports what would have been done
5. No Git commits, no PR creation

**Expected Output**:

```
[DRY-RUN] CodeGenAgent Starting
[DRY-RUN] Read Issue #270: "Add custom error handling"
[DRY-RUN] Would generate files:
  - crates/miyabi-core/src/error.rs (145 lines)
  - crates/miyabi-core/tests/error_test.rs (78 lines)
[DRY-RUN] Would run: cargo test --package miyabi-core
[DRY-RUN] Would commit: "feat(core): add custom error handling with thiserror"
[DRY-RUN] Execution successful (no changes made)
```

### Log Analysis

Inspect Agent execution logs to verify behavior:

```bash
# View latest Agent execution logs
cat .ai/logs/agent-execution-$(date +%Y-%m-%d).json | jq .

# Filter CodeGenAgent logs
cat .ai/logs/agent-execution-$(date +%Y-%m-%d).json | jq 'select(.agent_type == "CodeGenAgent")'

# Check for errors
cat .ai/logs/agent-execution-$(date +%Y-%m-%d).json | jq 'select(.level == "error")'
```

**Example Log Entry**:

```json
{
  "timestamp": "2025-10-24T15:30:45Z",
  "level": "info",
  "agent_type": "CodeGenAgent",
  "issue_number": 270,
  "worktree_path": ".worktrees/issue-270",
  "message": "Generated error.rs with custom thiserror patterns",
  "files_created": [
    "crates/miyabi-core/src/error.rs"
  ],
  "metrics": {
    "lines_of_code": 145,
    "execution_time_ms": 3241
  }
}
```

### Validation Checklist

Before considering your custom Agent production-ready:

**Functional Validation**:
- [ ] Agent executes without errors in dry-run mode
- [ ] Generated code compiles (`cargo build`)
- [ ] Tests pass (`cargo test`)
- [ ] Custom rules are enforced (e.g., error handling patterns)
- [ ] Output files are in expected locations

**Quality Validation**:
- [ ] ReviewAgent scores 80+ points
- [ ] Code follows custom style guide
- [ ] Documentation is generated (Rustdoc)
- [ ] No Clippy warnings

**Integration Validation**:
- [ ] Agent works within Worktree workflow
- [ ] Conventional Commits are generated correctly
- [ ] EXECUTION_CONTEXT.md is updated properly
- [ ] Agent escalates correctly when needed

### Test Workflow

Here's a complete test workflow for a custom Agent:

```bash
# 1. Create a test Issue
gh issue create --title "Test custom CodeGenAgent" --body "Generate code with custom error handling"

# 2. Run Agent in dry-run mode
miyabi agent run codegen --issue 271 --dry-run

# 3. Review dry-run output
cat .ai/logs/agent-execution-$(date +%Y-%m-%d).json | jq 'select(.issue_number == 271)'

# 4. Run Agent for real (creates Worktree)
miyabi agent run codegen --issue 271

# 5. Inspect Worktree
cd .worktrees/issue-271
cat EXECUTION_CONTEXT.md
cat .agent-context.json

# 6. Verify generated code
cargo build --package miyabi-core
cargo test --package miyabi-core
cargo clippy --package miyabi-core

# 7. Check custom rules
rg "thiserror::Error" crates/miyabi-core/src/error.rs
rg 'error\("Failed to' crates/miyabi-core/src/error.rs

# 8. Return to main repo
cd ../..

# 9. Merge Worktree (if satisfied)
git merge worktree/issue-271

# 10. Cleanup
git worktree remove .worktrees/issue-271
```

## Real-World Examples

Let's explore some practical customization scenarios.

### Example 1: Custom Documentation Style

Your team requires specific documentation headers in all Rust files.

**Custom Spec Addition** (`.claude/agents/specs/coding/codegen-agent-custom.md`):

```markdown
## ドキュメント規則

### ファイルヘッダー

すべてのRustファイルに以下のヘッダーを追加:

```rust
// Copyright (c) 2025 Your Company
// Licensed under MIT License
//
// File: {filename}
// Purpose: {brief description}
// Author: CodeGenAgent (Autonomous)
// Created: {date}
```

### モジュールドキュメント

すべてのモジュールに詳細ドキュメント:

```rust
//! # Module Name
//!
//! Brief description of the module's purpose.
//!
//! ## Overview
//!
//! Detailed explanation of what this module does.
//!
//! ## Examples
//!
//! ```
//! use crate::module::Function;
//!
//! let result = Function::execute();
//! ```
```
```

### Example 2: Custom Test Patterns

Your team uses table-driven tests for comprehensive coverage.

**Custom Prompt Addition** (`.claude/agents/prompts/coding/codegen-agent-prompt-custom.md`):

```markdown
## Step 4: テーブル駆動テスト生成

すべてのテストはテーブル駆動パターンを使用:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_execute_multiple_scenarios() {
        let test_cases = vec![
            // (input, expected_output, description)
            ("valid_input", Ok(()), "正常なインプット"),
            ("", Err(AgentError::InvalidInput), "空文字列"),
            ("toolong".repeat(100), Err(AgentError::InputTooLong), "長すぎるインプット"),
        ];

        for (input, expected, description) in test_cases {
            let result = execute_task(input).await;
            assert_eq!(result, expected, "Failed: {}", description);
        }
    }
}
```
```

## Troubleshooting

### Issue: Custom Spec Not Being Used

**Symptom**: Agent ignores custom spec and uses default behavior.

**Solution**:
1. Check `miyabi.toml` configuration:
   ```bash
   cat miyabi.toml | grep spec_path
   ```
2. Verify file path is correct (relative to project root)
3. Restart Miyabi CLI if configuration was just changed

### Issue: Agent Fails with Custom Prompt

**Symptom**: Agent crashes or produces unexpected output with custom prompt.

**Solution**:
1. Validate prompt syntax (valid Markdown)
2. Check for missing context references (e.g., `EXECUTION_CONTEXT.md`)
3. Run in dry-run mode to see detailed error messages
4. Compare with original prompt to find syntax errors

### Issue: Configuration Not Loading

**Symptom**: `miyabi.toml` changes don't take effect.

**Solution**:
```bash
# Verify configuration is valid TOML
cargo install taplo-cli
taplo format --check miyabi.toml

# Check configuration is being loaded
miyabi config show
```

## Success Checklist

Before considering your Agent customization complete:

- [ ] Custom spec file created and referenced in `miyabi.toml`
- [ ] Custom prompt follows project standards
- [ ] Agent executes successfully in dry-run mode
- [ ] Agent produces expected output
- [ ] Custom rules are enforced (verified with tests)
- [ ] Documentation updated with customization details
- [ ] Team reviewed and approved customizations

## Next Steps

Congratulations! You've mastered Agent customization. Here's what to explore next:

1. **Tutorial 5: Worktree-Based Parallel Execution** - Learn how to run multiple custom Agents in parallel
2. **Tutorial 6: Label System Mastery** - Use Labels to trigger custom Agent workflows
3. **Tutorial 7: MCP Integration** - Extend Agents with external tools via MCP

## Resources

- **Agent Specs Repository**: `.claude/agents/specs/`
- **Agent Prompts Repository**: `.claude/agents/prompts/`
- **Configuration Guide**: `docs/CONFIGURATION.md`
- **Agent Development Guide**: `docs/AGENT_DEVELOPMENT_GUIDE.md`

---

**Tutorial Created**: 2025-10-24
**Last Updated**: 2025-10-24
**Author**: ContentCreationAgent (かくちゃん)
