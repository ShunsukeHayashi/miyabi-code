//! Chat endpoint implementation

use crate::ai::{search_knowledge, HistoricalCharacter, PromptBuilder};
use crate::api::models::{ChatRequest, ChatResponse, ErrorResponse};
use crate::api::state::AppState;
use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use miyabi_llm::{LlmClient, Message};
use tracing::{error, info, warn};

/// POST /api/chat handler
pub async fn chat_handler(
    State(app_state): State<AppState>,
    Json(request): Json<ChatRequest>,
) -> Result<Json<ChatResponse>, ApiError> {
    info!(
        "Chat request: figure={}, user={}, message_len={}",
        request.figure,
        request.user_id,
        request.message.len()
    );

    // Step 1: Validate figure name
    let available_figures = HistoricalCharacter::available_characters();
    if !available_figures.contains(&request.figure) {
        warn!("Invalid figure requested: {}", request.figure);
        return Err(ApiError::BadRequest(format!(
            "Invalid figure '{}'. Available: {:?}",
            request.figure, available_figures
        )));
    }

    // Step 2: Load character definition
    let character = HistoricalCharacter::load(&request.figure).map_err(|e| {
        error!("Failed to load character {}: {}", request.figure, e);
        ApiError::InternalError(format!("Failed to load character: {}", e))
    })?;

    info!("Loaded character: {}", character.name);

    // Step 3: RAG search for relevant knowledge
    let search_results = search_knowledge(&request.message, &character.name, 3)
        .await
        .map_err(|e| {
            warn!("RAG search failed (non-critical): {}", e);
            // Don't fail the request if RAG fails - we can still respond without it
            e
        })
        .unwrap_or_default();

    info!("Found {} relevant documents", search_results.len());

    // Extract sources and context
    let sources: Vec<String> = search_results
        .iter()
        .map(|doc| {
            let source_type = doc.metadata.get("source").map(|s| s.as_str()).unwrap_or("unknown");
            format!("{}: {}", source_type, &doc.text[..doc.text.len().min(100)])
        })
        .collect();

    let context_docs: Vec<String> = search_results.iter().map(|doc| doc.text.clone()).collect();

    // Step 4: Build prompt using PromptBuilder
    let prompt_builder = PromptBuilder::from_character(character.clone()).map_err(|e| {
        error!("Failed to create prompt builder: {}", e);
        ApiError::InternalError(format!("Failed to create prompt builder: {}", e))
    })?;

    // Build system and user prompts
    let rag_context = if !context_docs.is_empty() {
        Some(context_docs.join("\n\n"))
    } else {
        None
    };

    let (system_prompt, user_prompt) = prompt_builder
        .build_prompt_pair(&request.message, rag_context.as_deref(), &context_docs)
        .map_err(|e| {
            error!("Failed to build prompt: {}", e);
            ApiError::InternalError(format!("Failed to build prompt: {}", e))
        })?;

    info!(
        "Built prompts - system: {} chars, user: {} chars",
        system_prompt.len(),
        user_prompt.len()
    );

    // Step 5: Call LLM
    let messages = vec![Message::system(system_prompt), Message::user(user_prompt)];

    let reply = app_state.llm_client.chat(messages).await.map_err(|e| {
        error!("LLM API call failed: {}", e);
        ApiError::InternalError(format!("AI service error: {}", e))
    })?;

    info!("Received LLM response: {} chars", reply.len());

    // Step 6: Build response
    let response = ChatResponse::new(reply, sources, request.figure);

    info!("Chat request completed successfully");
    Ok(Json(response))
}

/// API error types
#[derive(Debug)]
#[allow(dead_code)]
pub enum ApiError {
    BadRequest(String),
    InternalError(String),
    Timeout,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, error_response) = match self {
            ApiError::BadRequest(msg) => (StatusCode::BAD_REQUEST, ErrorResponse::bad_request(msg)),
            ApiError::InternalError(msg) => {
                (StatusCode::INTERNAL_SERVER_ERROR, ErrorResponse::internal_error(msg))
            },
            ApiError::Timeout => (StatusCode::GATEWAY_TIMEOUT, ErrorResponse::timeout()),
        };

        (status, Json(error_response)).into_response()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_api_error_responses() {
        let err = ApiError::BadRequest("test error".to_string());
        let response = err.into_response();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let err = ApiError::InternalError("test error".to_string());
        let response = err.into_response();
        assert_eq!(response.status(), StatusCode::INTERNAL_SERVER_ERROR);

        let err = ApiError::Timeout;
        let response = err.into_response();
        assert_eq!(response.status(), StatusCode::GATEWAY_TIMEOUT);
    }
}
