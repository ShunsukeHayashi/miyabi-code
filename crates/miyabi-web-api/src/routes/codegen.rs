//! CodeGen API routes - Claudable integration
//!
//! Provides REST API for code generation using Claudable (frontend) or GPT-OSS-20B (backend).

use axum::{
    extract::{Path, Query},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};

/// Router for CodeGen endpoints
pub fn routes() -> Router {
    Router::new()
        .route("/generate", post(generate_code))
        .route("/history", get(get_history))
        .route("/history/:id", get(get_generation_detail))
}

/// LLM Provider selection
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LlmProvider {
    /// Anthropic Claude (直接API - Claude Code不要)
    Claude,
    /// OpenAI GPT-4 (オプション)
    #[serde(rename = "gpt-4")]
    Gpt4,
    /// GPT-OSS-20B via Ollama (デフォルト)
    #[serde(rename = "gpt-oss")]
    GptOss,
    /// Groq (高速推論)
    Groq,
}

impl Default for LlmProvider {
    fn default() -> Self {
        Self::GptOss
    }
}

/// Request body for code generation
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateCodeRequest {
    /// Task description (e.g., "ダッシュボードUIを作成")
    pub task_description: String,
    /// Output directory (optional)
    pub output_dir: Option<String>,
    /// Priority (1-5)
    #[serde(default = "default_priority")]
    pub priority: u32,
    /// LLM Provider (defaults to GPT-OSS-20B)
    #[serde(default)]
    pub llm_provider: LlmProvider,
}

fn default_priority() -> u32 {
    1
}

/// Response for code generation
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateCodeResponse {
    /// Generation ID
    pub id: String,
    /// Task description
    pub task_description: String,
    /// Detection result
    pub is_frontend: bool,
    /// Engine used (claudable or gpt-oss-20b)
    pub engine: String,
    /// Status (queued, processing, completed, failed)
    pub status: String,
    /// Created timestamp
    pub created_at: String,
}

/// Generation history item
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerationHistoryItem {
    pub id: String,
    pub task_description: String,
    pub is_frontend: bool,
    pub engine: String,
    pub status: String,
    pub created_at: String,
    pub completed_at: Option<String>,
    pub files_generated: Option<u32>,
    pub lines_generated: Option<u32>,
}

/// Query parameters for history
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryQuery {
    /// Limit results
    #[serde(default = "default_limit")]
    pub limit: u32,
    /// Offset for pagination
    #[serde(default)]
    pub offset: u32,
}

fn default_limit() -> u32 {
    50
}

/// POST /api/codegen/generate
///
/// Generate code using Claudable (frontend) or GPT-OSS-20B (backend)
async fn generate_code(
    Json(req): Json<GenerateCodeRequest>,
) -> Result<Json<GenerateCodeResponse>, (StatusCode, String)> {
    tracing::info!("🎨 CodeGen request: {}", req.task_description);

    // Frontend detection logic (same as miyabi-agent-codegen/frontend.rs)
    let is_frontend = detect_frontend_task(&req.task_description);

    // Determine engine based on task type and provider
    let engine = if is_frontend {
        "claudable".to_string()
    } else {
        match req.llm_provider {
            LlmProvider::Claude => "anthropic-claude".to_string(),
            LlmProvider::Gpt4 => "openai-gpt-4".to_string(),
            LlmProvider::GptOss => "gpt-oss-20b".to_string(),
            LlmProvider::Groq => "groq-llama".to_string(),
        }
    };

    // Generate unique ID
    let id = uuid::Uuid::new_v4().to_string();
    let created_at = chrono::Utc::now().to_rfc3339();

    tracing::info!(
        "  → Detected: {} | Provider: {:?} | Engine: {}",
        if is_frontend { "Frontend" } else { "Backend" },
        req.llm_provider,
        engine
    );

    // TODO: Actually execute CodeGenAgent here
    // For now, return queued status
    let response = GenerateCodeResponse {
        id,
        task_description: req.task_description,
        is_frontend,
        engine,
        status: "queued".to_string(),
        created_at,
    };

    Ok(Json(response))
}

/// GET /api/codegen/history
///
/// Get code generation history
async fn get_history(
    Query(query): Query<HistoryQuery>,
) -> Result<Json<Vec<GenerationHistoryItem>>, (StatusCode, String)> {
    tracing::debug!(
        "Fetching generation history (limit: {}, offset: {})",
        query.limit,
        query.offset
    );

    // TODO: Fetch from database
    // For now, return empty list
    Ok(Json(vec![]))
}

/// GET /api/codegen/history/:id
///
/// Get detailed generation result
async fn get_generation_detail(
    Path(id): Path<String>,
) -> Result<Json<GenerationHistoryItem>, (StatusCode, String)> {
    tracing::debug!("Fetching generation detail: {}", id);

    // TODO: Fetch from database
    Err((StatusCode::NOT_FOUND, "Not implemented yet".to_string()))
}

/// Frontend task detection (32 keywords)
///
/// Same logic as miyabi-agent-codegen/src/frontend.rs
fn detect_frontend_task(description: &str) -> bool {
    const FRONTEND_KEYWORDS: &[&str] = &[
        // UI/Frontend
        "ui",
        "dashboard",
        "frontend",
        "web app",
        "webapp",
        // Frameworks
        "next.js",
        "nextjs",
        "react",
        "vue",
        "svelte",
        // Pages
        "landing page",
        "lp",
        "homepage",
        "page",
        // Components
        "form",
        "chart",
        "graph",
        "table",
        "component",
        "button",
        "modal",
        "dialog",
        // Styling
        "tailwind",
        "css",
        "style",
        "design",
        "layout",
        // UI Libraries
        "shadcn",
        "mui",
        "chakra",
        "ant design",
    ];

    let desc_lower = description.to_lowercase();
    FRONTEND_KEYWORDS
        .iter()
        .any(|keyword| desc_lower.contains(keyword))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_frontend_task() {
        assert!(detect_frontend_task("ダッシュボードUIを作成"));
        assert!(detect_frontend_task("Create a dashboard with charts"));
        assert!(detect_frontend_task("Build Next.js landing page"));
        assert!(!detect_frontend_task("Implement user authentication API"));
        assert!(!detect_frontend_task("Add database migration"));
    }
}
