# Rust Development Guide

**Last Updated**: 2025-10-26
**Version**: 2.0.1

**Priority**: ⭐⭐⭐

## 🦀 Rust 2021 Edition

**Language**: Rust 2021 Edition (Stable)

## 📦 Core Libraries

```toml
# 非同期ランタイム
tokio = { version = "1", features = ["full"] }
async-trait = "0.1"

# シリアライゼーション
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# エラーハンドリング
thiserror = "1"
anyhow = "1"

# CLI
clap = { version = "4", features = ["derive"] }

# GitHub API
octocrab = "0.38"

# ログ
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
```

## 🎨 Coding Standards

### Clippy
```bash
# 警告0件必須
cargo clippy -- -D warnings

# 特定警告無効化（理由コメント必須）
#[allow(clippy::too_many_arguments)]  // Reason: ...
```

### Rustfmt
```bash
# 自動フォーマット
cargo fmt

# チェックのみ
cargo fmt -- --check
```

### Documentation
```rust
/// Public APIには必ずRustdocコメント
///
/// # Examples
///
/// ```
/// use miyabi_agents::BaseAgent;
/// let agent = MyAgent::new(config);
/// ```
pub struct MyAgent {
    config: AgentConfig,
}
```

## 🧪 Testing

### 単体テスト
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_agent_execute() {
        let agent = MyAgent::new(config);
        let result = agent.execute(&task).await;
        assert!(result.is_ok());
    }
}
```

### 統合テスト
```bash
# すべてのテスト
cargo test --all

# 特定パッケージ
cargo test --package miyabi-agents

# 特定テスト
cargo test test_agent_execute
```

### カバレッジ
```bash
# カバレッジ目標: 80%以上
cargo tarpaulin --out Html
```

## 🚨 Error Handling

### MiyabiError使用
```rust
use miyabi_types::error::{MiyabiError, Result};

fn my_function() -> Result<String> {
    // Result型を常に使用
    Ok("success".to_string())
}

// エラー変換（#[from]）
fn read_file(path: &str) -> Result<String> {
    let content = std::fs::read_to_string(path)?;  // → MiyabiError::Io
    Ok(content)
}
```

### エラーハンドリングベストプラクティス
1. ✅ `Result<T>`型を常に使用
2. ✅ `?`演算子でエラー伝播
3. ✅ 具体的なエラーメッセージを提供
4. ✅ `#[from]`属性で自動変換
5. ❌ `unwrap()`/`expect()`の多用は避ける（テスト以外）
6. ❌ `panic!`の使用は避ける（致命的エラーのみ）

## 🏗️ BaseAgent Pattern

```rust
use miyabi_agents::BaseAgent;
use miyabi_types::{Task, AgentResult, MiyabiError};
use async_trait::async_trait;

pub struct MyAgent {
    config: AgentConfig,
}

impl MyAgent {
    pub fn new(config: AgentConfig) -> Self {
        Self { config }
    }
}

#[async_trait]
impl BaseAgent for MyAgent {
    async fn execute(&self, task: Task) -> Result<AgentResult, MiyabiError> {
        // Implementation
        Ok(AgentResult::success(serde_json::json!({"status": "completed"})))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_my_agent() {
        let config = AgentConfig::default();
        let agent = MyAgent::new(config);
        let task = Task::default();
        let result = agent.execute(&task).await;
        assert!(result.is_ok());
    }
}
```

## 🔧 Build & Run

### Development Build
```bash
cargo build
```

### Release Build
```bash
cargo build --release
# Binary: target/release/miyabi
```

### Run
```bash
# Development
cargo run --bin miyabi -- agent run coordinator --issue 270

# Release
./target/release/miyabi agent run coordinator --issue 270
```

## 📊 Quality Metrics

### CI/CD Targets
- **Clippy警告**: 0件
- **テストカバレッジ**: 80%以上
- **Rustdocカバレッジ**: 100% (public API)
- **ビルド時間**: <5分 (CI)

### ReviewAgent Scoring (100点満点)
- 90-100点: `quality:excellent`
- 80-89点: `quality:good`
- 70-79点: `quality:fair`
- <70点: `quality:needs-improvement`

## 🔗 Related Modules

- **Development**: [development.md](./development.md) - 開発ガイドライン全般
- **Architecture**: [architecture.md](./architecture.md) - Cargo Workspace構造

## 📖 Detailed Documentation

- **Rust Migration**: `docs/RUST_MIGRATION_REQUIREMENTS.md`
- **Rust Migration Sprint**: `docs/RUST_MIGRATION_SPRINT_PLAN.md`
- **Error Handling**: `crates/miyabi-types/src/error.rs`
