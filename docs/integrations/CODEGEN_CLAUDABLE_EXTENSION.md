# CodeGenAgent Extension for Claudable Integration

**作成日**: 2025-10-25
**バージョン**: v1.0
**ステータス**: 📋 設計完了

---

## 概要

CodeGenAgentにClaudable統合機能を追加し、フロントエンド生成タスクを自動検出して専用のNext.js生成パイプラインを実行する。

---

## アーキテクチャ

### 拡張ポイント

```rust
pub struct CodeGenAgent {
    config: AgentConfig,
    llm_provider: Option<GPTOSSProvider>,
    claudable_client: Option<ClaudableClient>, // NEW
}

impl CodeGenAgent {
    /// Create with Claudable integration
    pub fn new_with_claudable(config: AgentConfig, claudable_url: String) -> Result<Self> {
        let claudable_client = ClaudableClient::new(claudable_url)?;

        Ok(Self {
            config,
            llm_provider: None,
            claudable_client: Some(claudable_client),
        })
    }

    /// Generate code (extended with frontend detection)
    pub async fn generate_code(
        &self,
        task: &Task,
        worktree_path: Option<&Path>,
    ) -> Result<CodeGenerationResult> {
        // NEW: Frontend task detection
        if self.is_frontend_task(task) && self.claudable_client.is_some() {
            return self.generate_frontend_with_claudable(task, worktree_path).await;
        }

        // Existing LLM/Claude Code logic
        // ...
    }
}
```

---

## 新規Crate: miyabi-claudable

### Cargo.toml

```toml
[package]
name = "miyabi-claudable"
version = "0.1.0"
edition = "2021"
description = "Claudable API client for Next.js frontend generation"

[dependencies]
miyabi-types = { version = "0.1.0", path = "../miyabi-types" }
miyabi-core = { version = "0.1.0", path = "../miyabi-core" }

reqwest = { version = "0.12", features = ["json"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.35", features = ["full"] }
thiserror = "1.0"
tracing = "0.1"
async-trait = "0.1"

[dev-dependencies]
mockito = "1.2"
tokio-test = "0.4"
```

### ディレクトリ構成

```
crates/miyabi-claudable/
├── Cargo.toml
├── README.md
└── src/
    ├── lib.rs
    ├── client.rs       # HTTP API client
    ├── types.rs        # Request/Response types
    ├── error.rs        # Error types
    └── worktree.rs     # Worktree integration
```

---

## コア実装

### 1. Claudable API Client

**crates/miyabi-claudable/src/client.rs** (250行予定):

```rust
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;
use thiserror::Error;

#[derive(Debug, Clone)]
pub struct ClaudableClient {
    api_url: String,
    http_client: Client,
    api_key: Option<String>,
}

impl ClaudableClient {
    pub fn new(api_url: String) -> Result<Self, ClaudableError> {
        let http_client = Client::builder()
            .timeout(Duration::from_secs(180)) // 3 minutes
            .build()?;

        Ok(Self {
            api_url,
            http_client,
            api_key: std::env::var("CLAUDABLE_API_KEY").ok(),
        })
    }

    /// Generate Next.js app
    pub async fn generate(
        &self,
        request: GenerateRequest,
    ) -> Result<GenerateResponse, ClaudableError> {
        let url = format!("{}/generate", self.api_url);

        let mut req = self.http_client.post(&url).json(&request);

        if let Some(ref key) = self.api_key {
            req = req.header("Authorization", format!("Bearer {}", key));
        }

        let response = req.send().await?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            return Err(ClaudableError::ApiError(
                status.as_u16(),
                error_text,
            ));
        }

        let generate_response: GenerateResponse = response.json().await?;
        Ok(generate_response)
    }

    /// Check Claudable health
    pub async fn health_check(&self) -> Result<bool, ClaudableError> {
        let url = format!("{}/health", self.api_url);
        let response = self.http_client.get(&url).send().await?;
        Ok(response.status().is_success())
    }
}

#[derive(Debug, Error)]
pub enum ClaudableError {
    #[error("HTTP request failed: {0}")]
    HttpError(#[from] reqwest::Error),

    #[error("Claudable API error {0}: {1}")]
    ApiError(u16, String),

    #[error("Invalid response format: {0}")]
    ParseError(String),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
}
```

### 2. Request/Response Types

**crates/miyabi-claudable/src/types.rs** (150行予定):

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize)]
pub struct GenerateRequest {
    pub description: String,
    pub framework: String, // "nextjs"
    pub agent: String,     // "claude-code"

    #[serde(skip_serializing_if = "Option::is_none")]
    pub options: Option<GenerateOptions>,
}

#[derive(Debug, Clone, Serialize)]
pub struct GenerateOptions {
    #[serde(default = "default_true")]
    pub typescript: bool,

    #[serde(default = "default_true")]
    pub tailwind: bool,

    #[serde(default = "default_true")]
    pub shadcn: bool,

    #[serde(default)]
    pub supabase: bool,
}

fn default_true() -> bool {
    true
}

#[derive(Debug, Clone, Deserialize)]
pub struct GenerateResponse {
    pub project_id: String,
    pub files: Vec<GeneratedFile>,
    pub dependencies: Vec<String>,
    pub structure: ProjectStructure,
}

#[derive(Debug, Clone, Deserialize)]
pub struct GeneratedFile {
    pub path: String,
    pub content: String,
    #[serde(rename = "type")]
    pub file_type: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ProjectStructure {
    #[serde(default)]
    pub app: Vec<String>,

    #[serde(default)]
    pub components: Vec<String>,

    #[serde(default)]
    pub lib: Vec<String>,

    #[serde(default)]
    pub public: Vec<String>,
}

impl GenerateRequest {
    pub fn new(description: impl Into<String>) -> Self {
        Self {
            description: description.into(),
            framework: "nextjs".to_string(),
            agent: "claude-code".to_string(),
            options: Some(GenerateOptions::default()),
        }
    }
}

impl Default for GenerateOptions {
    fn default() -> Self {
        Self {
            typescript: true,
            tailwind: true,
            shadcn: true,
            supabase: false,
        }
    }
}
```

### 3. Worktree Integration

**crates/miyabi-claudable/src/worktree.rs** (200行予定):

```rust
use std::path::Path;
use tokio::fs;
use tokio::process::Command;
use tracing::{info, warn};

use crate::types::GenerateResponse;
use crate::error::ClaudableError;

/// Write Claudable-generated files to worktree
pub async fn write_files_to_worktree(
    worktree_path: &Path,
    response: &GenerateResponse,
) -> Result<WriteSummary, ClaudableError> {
    info!(
        "Writing {} files from Claudable to worktree: {}",
        response.files.len(),
        worktree_path.display()
    );

    let mut files_written = 0;
    let mut total_lines = 0;

    for file in &response.files {
        let file_path = worktree_path.join(&file.path);

        // Create parent directories
        if let Some(parent) = file_path.parent() {
            fs::create_dir_all(parent).await?;
        }

        // Write file content
        fs::write(&file_path, &file.content).await?;

        files_written += 1;
        total_lines += file.content.lines().count();

        info!("  ✅ {}", file.path);
    }

    Ok(WriteSummary {
        files_written,
        total_lines,
    })
}

/// Install dependencies in worktree
pub async fn install_dependencies(
    worktree_path: &Path,
) -> Result<(), ClaudableError> {
    info!("Installing npm dependencies in worktree...");

    let output = Command::new("npm")
        .arg("install")
        .current_dir(worktree_path)
        .output()
        .await?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        warn!("npm install failed: {}", stderr);
        return Err(ClaudableError::ParseError(format!(
            "npm install failed: {}",
            stderr
        )));
    }

    info!("  ✅ npm install completed");
    Ok(())
}

/// Build Next.js app in worktree
pub async fn build_nextjs_app(
    worktree_path: &Path,
) -> Result<(), ClaudableError> {
    info!("Building Next.js app in worktree...");

    let output = Command::new("npm")
        .arg("run")
        .arg("build")
        .current_dir(worktree_path)
        .output()
        .await?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        warn!("npm run build failed: {}", stderr);
        return Err(ClaudableError::ParseError(format!(
            "npm run build failed: {}",
            stderr
        )));
    }

    info!("  ✅ Next.js build completed");
    Ok(())
}

#[derive(Debug)]
pub struct WriteSummary {
    pub files_written: usize,
    pub total_lines: usize,
}
```

---

## CodeGenAgent拡張

### Frontend Task Detection

**crates/miyabi-agent-codegen/src/frontend.rs** (新規, 150行予定):

```rust
use miyabi_types::Task;

/// Keywords for frontend task detection
const FRONTEND_KEYWORDS: &[&str] = &[
    "ui", "dashboard", "frontend", "web app", "webapp",
    "next.js", "nextjs", "react", "landing page", "lp",
    "form", "chart", "table", "component",
    "tailwind", "css", "design", "layout",
];

/// Detect if task requires frontend generation
pub fn is_frontend_task(task: &Task) -> bool {
    let title_lower = task.title.to_lowercase();
    let desc_lower = task.description.to_lowercase();

    FRONTEND_KEYWORDS.iter().any(|keyword| {
        title_lower.contains(keyword) || desc_lower.contains(keyword)
    })
}

/// Extract frontend description from task
pub fn extract_frontend_description(task: &Task) -> String {
    // Combine title and description for more context
    format!("{}\n\n{}", task.title, task.description)
}

#[cfg(test)]
mod tests {
    use super::*;
    use miyabi_types::{Task, TaskType, AgentType};

    #[test]
    fn test_is_frontend_task_ui_keyword() {
        let task = Task {
            id: "1".to_string(),
            title: "Create dashboard UI".to_string(),
            description: "".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec![],
            estimated_duration: None,
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        };

        assert!(is_frontend_task(&task));
    }

    #[test]
    fn test_is_frontend_task_nextjs_keyword() {
        let task = Task {
            id: "2".to_string(),
            title: "Implement feature".to_string(),
            description: "Use Next.js for this".to_string(),
            task_type: TaskType::Feature,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec![],
            estimated_duration: None,
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        };

        assert!(is_frontend_task(&task));
    }

    #[test]
    fn test_is_not_frontend_task() {
        let task = Task {
            id: "3".to_string(),
            title: "Fix backend API bug".to_string(),
            description: "Database query optimization".to_string(),
            task_type: TaskType::Bug,
            priority: 1,
            severity: None,
            impact: None,
            assigned_agent: Some(AgentType::CodeGenAgent),
            dependencies: vec![],
            estimated_duration: None,
            status: None,
            start_time: None,
            end_time: None,
            metadata: None,
        };

        assert!(!is_frontend_task(&task));
    }
}
```

### CodeGenAgent Integration

**crates/miyabi-agent-codegen/src/codegen.rs** (修正):

```rust
// Add to imports
use miyabi_claudable::ClaudableClient;
mod frontend; // NEW

pub struct CodeGenAgent {
    config: AgentConfig,
    llm_provider: Option<GPTOSSProvider>,
    claudable_client: Option<ClaudableClient>, // NEW
}

impl CodeGenAgent {
    /// Create with Claudable integration
    pub fn new_with_claudable(config: AgentConfig) -> Result<Self> {
        let claudable_url = std::env::var("CLAUDABLE_API_URL")
            .unwrap_or_else(|_| "http://localhost:8080".to_string());

        let claudable_client = ClaudableClient::new(claudable_url)
            .map_err(|e| MiyabiError::Unknown(format!("Failed to create Claudable client: {}", e)))?;

        Ok(Self {
            config,
            llm_provider: None,
            claudable_client: Some(claudable_client),
        })
    }

    /// Generate frontend using Claudable
    async fn generate_frontend_with_claudable(
        &self,
        task: &Task,
        worktree_path: Option<&Path>,
    ) -> Result<CodeGenerationResult> {
        tracing::info!("🎨 Frontend task detected, using Claudable for generation");

        let claudable = self
            .claudable_client
            .as_ref()
            .ok_or_else(|| MiyabiError::Validation("Claudable client not configured".to_string()))?;

        // Build request
        let description = frontend::extract_frontend_description(task);
        let request = miyabi_claudable::types::GenerateRequest::new(description);

        // Call Claudable API
        let response = claudable
            .generate(request)
            .await
            .map_err(|e| MiyabiError::Unknown(format!("Claudable generation failed: {}", e)))?;

        // If worktree provided, write files and build
        if let Some(worktree) = worktree_path {
            use miyabi_claudable::worktree::{
                write_files_to_worktree,
                install_dependencies,
                build_nextjs_app,
            };

            // Write files
            let summary = write_files_to_worktree(worktree, &response).await
                .map_err(|e| MiyabiError::Unknown(format!("Failed to write files: {}", e)))?;

            tracing::info!("  📝 Wrote {} files ({} lines)", summary.files_written, summary.total_lines);

            // Install dependencies
            install_dependencies(worktree).await
                .map_err(|e| MiyabiError::Unknown(format!("npm install failed: {}", e)))?;

            // Build app
            build_nextjs_app(worktree).await
                .map_err(|e| MiyabiError::Unknown(format!("Next.js build failed: {}", e)))?;

            Ok(CodeGenerationResult {
                files_created: response.files.iter().map(|f| f.path.clone()).collect(),
                files_modified: vec![],
                lines_added: summary.total_lines as u32,
                lines_removed: 0,
                tests_added: 0, // Claudable may generate tests
                commit_sha: None,
            })
        } else {
            // Return result without worktree
            Ok(CodeGenerationResult {
                files_created: response.files.iter().map(|f| f.path.clone()).collect(),
                files_modified: vec![],
                lines_added: response.files.iter().map(|f| f.content.lines().count()).sum::<usize>() as u32,
                lines_removed: 0,
                tests_added: 0,
                commit_sha: None,
            })
        }
    }

    /// Generate code (extended with frontend detection)
    pub async fn generate_code(
        &self,
        task: &Task,
        worktree_path: Option<&Path>,
    ) -> Result<CodeGenerationResult> {
        tracing::info!("Generating code for task: {}", task.title);

        // NEW: Frontend task detection
        if frontend::is_frontend_task(task) && self.claudable_client.is_some() {
            return self.generate_frontend_with_claudable(task, worktree_path).await;
        }

        // Validate task type
        if !matches!(
            task.task_type,
            TaskType::Feature | TaskType::Bug | TaskType::Refactor
        ) {
            return Err(MiyabiError::Validation(format!(
                "CodeGenAgent cannot handle task type: {:?}",
                task.task_type
            )));
        }

        // Existing LLM/Claude Code logic...
        // ...
    }
}
```

---

## 環境変数

```bash
# Claudable Configuration
CLAUDABLE_API_URL=http://localhost:8080
CLAUDABLE_API_KEY=secret_key_here  # Optional

# Existing
ANTHROPIC_API_KEY=sk-ant-xxx
GITHUB_TOKEN=ghp_xxx
```

---

## テスト戦略

### Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_frontend_detection() {
        let task = create_frontend_task();
        assert!(frontend::is_frontend_task(&task));
    }

    #[tokio::test]
    #[ignore] // Requires Claudable server
    async fn test_claudable_integration() {
        let config = create_test_config();
        let agent = CodeGenAgent::new_with_claudable(config).unwrap();
        let task = create_frontend_task();

        let result = agent.generate_code(&task, None).await;
        assert!(result.is_ok());
    }
}
```

### Integration Tests

```rust
#[tokio::test]
#[ignore]
async fn test_e2e_frontend_generation() {
    // 1. Start Claudable Docker container
    // 2. Create frontend task
    // 3. Execute CodeGenAgent
    // 4. Verify Next.js files created
    // 5. Verify npm install succeeds
    // 6. Verify build succeeds
}
```

---

## パフォーマンス

| フェーズ | 目標時間 |
|----------|---------|
| Claudable API呼び出し | < 2分 |
| ファイル書き込み | < 5秒 |
| npm install | < 30秒 |
| npm run build | < 1分 |
| **合計** | **< 4分** |

---

## エラーハンドリング

```rust
#[derive(Debug, Error)]
pub enum ClaudableError {
    #[error("HTTP request failed: {0}")]
    HttpError(#[from] reqwest::Error),

    #[error("Claudable API error {0}: {1}")]
    ApiError(u16, String),

    #[error("npm install failed: {0}")]
    NpmInstallError(String),

    #[error("Next.js build failed: {0}")]
    BuildError(String),
}
```

**リトライ戦略**:
- HTTP errors: 最大3回リトライ (exponential backoff)
- npm install失敗: 1回リトライ
- Build失敗: リトライなし (ReviewAgentにエスカレーション)

---

## 今後の拡張

- [ ] **複数フレームワーク対応**: Vue.js, Svelte
- [ ] **デザインシステム統合**: Figma → Claudable
- [ ] **プレビューデプロイ**: Vercel自動デプロイ
- [ ] **A/Bテスト生成**: 複数バリエーション

---

**Status**: ✅ 設計完了
**Next**: Phase 1実装開始

🤖 Generated with [Claude Code](https://claude.com/claude-code)
