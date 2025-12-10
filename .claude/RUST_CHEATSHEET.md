# Miyabi Rust Cheatsheet
## Claude Quick Reference for Code Generation

**Purpose**: Claudeがイディオマティックなコードを生成するためのパターン集

---

## 🎯 Golden Rules

```
1. unwrap() / expect() 禁止 → 必ず ? 演算子
2. Clone よりも参照を優先
3. String よりも &str を引数に
4. pub は最小限（内部実装は非公開）
5. 型注釈は省略可能なら省略
```

---

## 📦 新クレート作成テンプレート

### Cargo.toml
```toml
[package]
name = "miyabi-new-feature"
version = "0.1.0"
edition = "2021"

[dependencies]
miyabi-types = { path = "../miyabi-types" }
miyabi-core = { path = "../miyabi-core" }
tokio = { version = "1", features = ["full"] }
async-trait = "0.1"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
thiserror = "1"
tracing = "0.1"

[dev-dependencies]
tokio-test = "0.4"
```

### lib.rs
```rust
//! miyabi-new-feature
//!
//! 機能の簡潔な説明

mod feature;
mod config;

pub use feature::*;
pub use config::*;
```

---

## 🤖 新エージェント作成

### 完全テンプレート
```rust
use async_trait::async_trait;
use miyabi_agents::BaseAgent;
use miyabi_llm::LlmProvider;
use miyabi_types::{AgentConfig, AgentResult, MiyabiError, Result, Task};
use std::sync::Arc;
use tracing::{debug, info, warn};

pub struct NewAgent {
    config: AgentConfig,
    llm: Arc<dyn LlmProvider>,
}

impl NewAgent {
    pub fn new(config: AgentConfig, llm: Arc<dyn LlmProvider>) -> Self {
        Self { config, llm }
    }
    
    async fn process_task(&self, task: &Task) -> Result<serde_json::Value> {
        info!("Processing task: {}", task.id);
        
        let prompt = self.build_prompt(task);
        let response = self.llm.complete(&prompt).await?;
        
        debug!("LLM response received");
        Ok(response)
    }
    
    fn build_prompt(&self, task: &Task) -> String {
        format!(
            "You are a helpful assistant.\n\nTask: {}\n\nContext: {}",
            task.description,
            task.context.as_deref().unwrap_or("None")
        )
    }
}

#[async_trait]
impl BaseAgent for NewAgent {
    fn name(&self) -> &str {
        "new-agent"
    }
    
    async fn execute(&self, task: Task) -> Result<AgentResult> {
        let result = self.process_task(&task).await?;
        Ok(AgentResult::success(result))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_new_agent_execute() {
        // Mock setup
        let config = AgentConfig::default();
        let llm = Arc::new(MockLlm::new());
        let agent = NewAgent::new(config, llm);
        
        let task = Task::default();
        let result = agent.execute(task).await;
        
        assert!(result.is_ok());
    }
}
```

---

## 🔧 よく使うパターン

### Error Handling
```rust
// 基本パターン
fn process_data(input: &str) -> Result<String> {
    let parsed = parse_input(input)?;      // ? でエラー伝播
    let validated = validate(parsed)?;
    Ok(validated)
}

// カスタムエラーメッセージ
fn read_config(path: &str) -> Result<Config> {
    std::fs::read_to_string(path)
        .map_err(|e| MiyabiError::Config(format!("Failed to read {}: {}", path, e)))?
        .parse()
        .map_err(|e| MiyabiError::Config(format!("Invalid config: {}", e)))
}

// Option → Result 変換
fn get_required_field(data: &Data) -> Result<&str> {
    data.field.as_deref()
        .ok_or_else(|| MiyabiError::Config("field is required".into()))
}
```

### Async/Await
```rust
// 並列実行
async fn process_all(items: Vec<Item>) -> Result<Vec<Output>> {
    let futures: Vec<_> = items.iter()
        .map(|item| process_single(item))
        .collect();
    
    futures::future::try_join_all(futures).await
}

// タイムアウト付き
use tokio::time::{timeout, Duration};

async fn with_timeout<T, F>(fut: F) -> Result<T>
where
    F: std::future::Future<Output = Result<T>>,
{
    timeout(Duration::from_secs(30), fut)
        .await
        .map_err(|_| MiyabiError::Timeout("Operation timed out".into()))?
}
```

### Serialization
```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub name: String,
    #[serde(default)]
    pub enabled: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub optional_field: Option<String>,
}

// JSON変換
fn to_json(data: &impl Serialize) -> Result<String> {
    serde_json::to_string_pretty(data)
        .map_err(|e| MiyabiError::Serialization(e.to_string()))
}

fn from_json<T: DeserializeOwned>(json: &str) -> Result<T> {
    serde_json::from_str(json)
        .map_err(|e| MiyabiError::Serialization(e.to_string()))
}
```

### Logging
```rust
use tracing::{debug, error, info, instrument, warn};

#[instrument(skip(self), fields(task_id = %task.id))]
async fn execute(&self, task: Task) -> Result<Output> {
    info!("Starting execution");
    
    match self.process(task).await {
        Ok(output) => {
            info!(result = ?output, "Execution completed");
            Ok(output)
        }
        Err(e) => {
            error!(error = %e, "Execution failed");
            Err(e)
        }
    }
}
```

---

## 🚫 アンチパターン

### ❌ 避けるべきコード
```rust
// ❌ unwrap
let value = some_option.unwrap();

// ❌ expect without context
let file = File::open("config.json").expect("failed");

// ❌ Clone for ownership
fn process(data: MyData) { ... }
process(my_data.clone());

// ❌ Unnecessary String allocation
fn greet(name: String) { ... }

// ❌ pub で全公開
pub struct Internal { pub field: String }
```

### ✅ 推奨コード
```rust
// ✅ ? 演算子
let value = some_option.ok_or(MiyabiError::NotFound)?;

// ✅ context付きexpect（テストのみ）
let file = File::open("config.json")
    .expect("test config should exist");

// ✅ 参照で借用
fn process(data: &MyData) { ... }
process(&my_data);

// ✅ &str を引数に
fn greet(name: &str) { ... }

// ✅ 最小限のpub
pub struct Public { field: String }  // fieldは非公開
impl Public {
    pub fn field(&self) -> &str { &self.field }
}
```

---

## 📋 テストテンプレート

### 基本テスト
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sync_function() {
        let input = "test";
        let result = sync_function(input);
        assert_eq!(result, "expected");
    }

    #[tokio::test]
    async fn test_async_function() {
        let result = async_function().await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_error_case() {
        let result = function_that_fails().await;
        assert!(matches!(result, Err(MiyabiError::NotFound)));
    }
}
```

### プロパティベーステスト
```rust
#[cfg(test)]
mod property_tests {
    use proptest::prelude::*;

    proptest! {
        #[test]
        fn test_roundtrip(s in "\\PC*") {
            let encoded = encode(&s);
            let decoded = decode(&encoded).unwrap();
            prop_assert_eq!(s, decoded);
        }
    }
}
```

---

## 🔑 依存追加チェックリスト

新しい依存を追加する前に確認：

- [ ] `miyabi-types` で既に定義されていないか？
- [ ] 同様の機能を持つクレートが workspace にないか？
- [ ] features は最小限か？
- [ ] async-trait は必要な場合のみ
- [ ] dev-dependencies で十分ではないか？

---

## 🎯 Claude向けヒント

コード生成時に意識すること：

1. **エラー型**: 必ず `MiyabiError` を使用
2. **Result型**: `miyabi_types::Result<T>` を使用
3. **ログ**: `tracing` マクロを使用
4. **設定**: `miyabi-core` の `Config` を参照
5. **テスト**: 各public関数にテスト必須

---

*このチートシートを参照し、Miyabiプロジェクトのコーディング規約に従ったコードを生成してください。*
