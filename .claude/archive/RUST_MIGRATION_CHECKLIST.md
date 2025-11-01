# .claude Rust対応チェックリスト

**作成日**: 2025-10-15
**目的**: `.claude`ディレクトリ内の全ドキュメントをRust移行に対応させる

## 📋 更新対象ファイル一覧

### 1. Agent仕様ファイル（specs/coding/）- 7ファイル

- [ ] `.claude/agents/specs/coding/coordinator-agent.md`
- [ ] `.claude/agents/specs/coding/codegen-agent.md`
- [ ] `.claude/agents/specs/coding/review-agent.md`
- [ ] `.claude/agents/specs/coding/issue-agent.md`
- [ ] `.claude/agents/specs/coding/pr-agent.md`
- [ ] `.claude/agents/specs/coding/deployment-agent.md`
- [ ] `.claude/agents/specs/coding/hooks-integration.md`

**更新内容**:
- TypeScript型定義 → Rust型定義
- `async execute(task: Task): Promise<AgentResult>` → `async fn execute(&self, task: Task) -> Result<AgentResult, MiyabiError>`
- `import { BaseAgent } from ...` → `use miyabi_agents::BaseAgent;`
- Vitest → `cargo test`
- ESLint → `cargo clippy`
- `npm run build` → `cargo build`
- JSDoc → Rustdoc（`///`）

### 2. Agentプロンプト（prompts/coding/）- 6ファイル

- [ ] `.claude/agents/prompts/coding/coordinator-agent-prompt.md`
- [ ] `.claude/agents/prompts/coding/codegen-agent-prompt.md`
- [ ] `.claude/agents/prompts/coding/review-agent-prompt.md`
- [ ] `.claude/agents/prompts/coding/issue-agent-prompt.md`
- [ ] `.claude/agents/prompts/coding/pr-agent-prompt.md`
- [ ] `.claude/agents/prompts/coding/deployment-agent-prompt.md`

**更新内容**:
- TypeScript Strict mode → Rust型システム + `#[derive()]`
- ESM import/export → Rust mod/use
- `export class YourAgent extends BaseAgent` → `pub struct YourAgent` + `impl BaseAgent for YourAgent`
- Vitest テスト → `#[cfg(test)] mod tests { ... }`
- JSDocコメント → Rustdoc（`///`, `//!`）
- `npm test` → `cargo test`
- `npm run build` → `cargo build`
- `package.json` → `Cargo.toml`
- BaseAgent trait実装パターン
- Error handling: `try/catch` → `Result<T, E>` + `?` operator

### 3. コマンドファイル（commands/）- 10ファイル

- [ ] `.claude/commands/agent-run.md`
- [ ] `.claude/commands/create-issue.md`
- [ ] `.claude/commands/deploy.md`
- [ ] `.claude/commands/generate-docs.md`
- [ ] `.claude/commands/miyabi-auto.md`
- [ ] `.claude/commands/miyabi-todos.md`
- [ ] `.claude/commands/review.md`
- [ ] `.claude/commands/security-scan.md`
- [ ] `.claude/commands/test.md`
- [ ] `.claude/commands/verify.md`

**更新内容**:
- `npm run agents:parallel:exec` → `cargo run --bin miyabi agent run`
- `npx miyabi init` → `miyabi init`（バイナリ実行）
- `npm test` → `cargo test`
- `npm run build` → `cargo build --release`
- `npm run lint` → `cargo clippy -- -D warnings`
- Node.js固有のコマンド → Rustツールチェーン
- `node scripts/xxx.js` → `cargo run --bin miyabi-xxx`

### 4. コアドキュメント - 3ファイル

- [ ] `CLAUDE.md`（プロジェクト設定の全面更新）
- [ ] `.claude/QUICK_START.md`
- [ ] `.claude/TROUBLESHOOTING.md`

**更新内容**:
- 技術スタック: TypeScript → Rust 2021 Edition
- ディレクトリ構造: `packages/` → `crates/`
- ビルドシステム: npm → Cargo Workspace
- 実行方法: `npm run` → `cargo run`
- テスト: Vitest → `cargo test` + insta（snapshot testing）
- リンター: ESLint → Clippy
- 型システム: TypeScript interfaces → Rust structs/enums/traits
- 非同期処理: `async/await` (JavaScript) → Tokio + `async fn`

### 5. Agent共通ドキュメント - 3ファイル

- [ ] `.claude/agents/README.md`
- [ ] `.claude/agents/AGENT_CHARACTERS.md`
- [ ] `.claude/agents/USAGE_GUIDE_SIMPLE.md`

**更新内容**:
- SDK参照: `miyabi-agent-sdk@^0.1.0-alpha.2` (npm) → `miyabi-agents` crate
- 実装例をRustに更新
- CLI実行例を`cargo run`に更新

## 🎯 TypeScript → Rust 変換パターン

### パターン1: 型定義

**TypeScript**:
```typescript
export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  status: 'pending' | 'in_progress' | 'completed';
}
```

**Rust**:
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub description: String,
    pub priority: Priority,
    pub status: TaskStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Priority {
    P0Critical,
    P1High,
    P2Medium,
    P3Low,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TaskStatus {
    Pending,
    InProgress,
    Completed,
}
```

### パターン2: BaseAgent実装

**TypeScript**:
```typescript
import { BaseAgent } from '../base-agent.js';
import { AgentResult, Task } from '../types/index.js';

export class CodeGenAgent extends BaseAgent {
  constructor(config: any) {
    super('CodeGenAgent', config);
  }

  async execute(task: Task): Promise<AgentResult> {
    this.log('🤖 CodeGenAgent starting');
    try {
      // Implementation
      return {
        status: 'success',
        data: result,
        metrics: { /* ... */ },
      };
    } catch (error) {
      await this.escalate(/* ... */);
      throw error;
    }
  }
}
```

**Rust**:
```rust
use async_trait::async_trait;
use miyabi_types::{Task, AgentResult, AgentConfig, MiyabiError};
use miyabi_agents::BaseAgent;
use tracing::{info, error};

pub struct CodeGenAgent {
    config: AgentConfig,
}

impl CodeGenAgent {
    pub fn new(config: AgentConfig) -> Self {
        Self { config }
    }
}

#[async_trait]
impl BaseAgent for CodeGenAgent {
    fn agent_type(&self) -> &str {
        "CodeGenAgent"
    }

    async fn execute(&self, task: Task) -> Result<AgentResult, MiyabiError> {
        info!("🤖 CodeGenAgent starting");

        // Implementation
        let result = self.generate_code(&task).await?;

        Ok(AgentResult {
            status: "success".to_string(),
            data: result,
            metrics: AgentMetrics {
                task_id: task.id.clone(),
                agent_type: self.agent_type().to_string(),
                duration_ms: start.elapsed().as_millis() as u64,
                timestamp: chrono::Utc::now(),
            },
        })
    }

    async fn escalate(&self, message: &str, assignee: &str, severity: &str) -> Result<(), MiyabiError> {
        // Escalation logic
        Ok(())
    }
}
```

### パターン3: テストコード

**TypeScript (Vitest)**:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { CodeGenAgent } from '../agents/codegen-agent.js';

describe('CodeGenAgent', () => {
  let agent: CodeGenAgent;

  beforeEach(() => {
    agent = new CodeGenAgent({ /* config */ });
  });

  it('should generate code successfully', async () => {
    const task = { /* task data */ };
    const result = await agent.execute(task);
    expect(result.status).toBe('success');
  });
});
```

**Rust (cargo test)**:
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use miyabi_types::{Task, TaskStatus, Priority};

    #[tokio::test]
    async fn test_codegen_agent_execute() {
        let config = AgentConfig::default();
        let agent = CodeGenAgent::new(config);

        let task = Task {
            id: "test-1".to_string(),
            title: "Test task".to_string(),
            description: "Test description".to_string(),
            priority: Priority::P2Medium,
            status: TaskStatus::Pending,
        };

        let result = agent.execute(task).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().status, "success");
    }
}
```

### パターン4: エラーハンドリング

**TypeScript**:
```typescript
try {
  const result = await doSomething();
  return result;
} catch (error) {
  this.log(`❌ Error: ${(error as Error).message}`);
  throw error;
}
```

**Rust**:
```rust
use anyhow::{Context, Result};

fn do_something() -> Result<String> {
    let result = risky_operation()
        .context("Failed to perform risky operation")?;
    Ok(result)
}

// Or with explicit error handling
match risky_operation() {
    Ok(value) => Ok(value),
    Err(e) => {
        error!("❌ Error: {}", e);
        Err(e.into())
    }
}
```

### パターン5: 非同期処理

**TypeScript**:
```typescript
async function fetchData(): Promise<Data> {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}
```

**Rust (Tokio)**:
```rust
use reqwest;
use serde::Deserialize;

#[derive(Deserialize)]
struct Data {
    // fields
}

async fn fetch_data(url: &str) -> Result<Data, reqwest::Error> {
    let response = reqwest::get(url).await?;
    let data = response.json::<Data>().await?;
    Ok(data)
}
```

## 📝 ドキュメント更新の優先順位

### Phase 1: コアドキュメント（最優先）
1. `CLAUDE.md` - プロジェクト設定の全面更新
2. `.claude/QUICK_START.md` - クイックスタートガイド
3. `.claude/agents/README.md` - Agent概要

### Phase 2: Agent仕様ファイル（高優先）
4-10. Coding Agent仕様（7ファイル）

### Phase 3: Agentプロンプト（高優先）
11-16. Coding Agentプロンプト（6ファイル）

### Phase 4: コマンドファイル（中優先）
17-26. Claude Codeコマンド（10ファイル）

### Phase 5: サポートドキュメント（低優先）
27-29. トラブルシューティング、キャラクター図鑑等

## ✅ 更新完了チェックリスト

各ファイル更新時に以下を確認：

- [ ] TypeScript固有の記述をすべてRustに変換
- [ ] パッケージ参照を`crates/`に更新
- [ ] コマンド例を`cargo`に更新
- [ ] テスト例を`cargo test`に更新
- [ ] エラーハンドリングを`Result<T, E>`に更新
- [ ] ドキュメント内のコードブロックがRustとして正しい
- [ ] リンク切れがない
- [ ] 整合性が取れている

## 🔗 参考リソース

- **Rust移行要件**: `docs/RUST_MIGRATION_REQUIREMENTS.md`
- **Rust移行スプリント**: `docs/RUST_MIGRATION_SPRINT_PLAN.md`
- **Rustコードベース**: `crates/` ディレクトリ
- **TypeScript版**: `packages/` ディレクトリ

---

**最終更新**: 2025-10-15
**進捗**: 0/29 (0%)
