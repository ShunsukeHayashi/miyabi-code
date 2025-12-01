//! Request and Response models for the API

use serde::{Deserialize, Serialize};

/// Request body for /api/chat endpoint
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatRequest {
    /// The historical figure identifier (e.g., "oda_nobunaga")
    pub figure: String,

    /// User's message/question
    pub message: String,

    /// User identifier for session tracking
    pub user_id: String,
}

/// Response body for /api/chat endpoint
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatResponse {
    /// The AI's response in character
    pub reply: String,

    /// Sources used for the response (from RAG retrieval)
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub sources: Vec<String>,

    /// Timestamp of the response
    pub timestamp: String,

    /// The figure that responded
    pub figure: String,
}

impl ChatResponse {
    /// Create a new chat response
    pub fn new(reply: String, sources: Vec<String>, figure: String) -> Self {
        Self { reply, sources, timestamp: chrono::Utc::now().to_rfc3339(), figure }
    }
}

/// Error response for API errors
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorResponse {
    /// Error message
    pub error: String,

    /// Error code
    pub code: String,
}

impl ErrorResponse {
    /// Create a new error response
    pub fn new(error: String, code: String) -> Self {
        Self { error, code }
    }

    /// Create a bad request error
    pub fn bad_request(message: impl Into<String>) -> Self {
        Self::new(message.into(), "BAD_REQUEST".to_string())
    }

    /// Create an internal server error
    pub fn internal_error(message: impl Into<String>) -> Self {
        Self::new(message.into(), "INTERNAL_SERVER_ERROR".to_string())
    }

    /// Create a gateway timeout error
    pub fn timeout() -> Self {
        Self::new("Request timed out".to_string(), "GATEWAY_TIMEOUT".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_chat_request_serialization() {
        let request = ChatRequest {
            figure: "oda_nobunaga".to_string(),
            message: "経営戦略について教えて".to_string(),
            user_id: "test_user".to_string(),
        };

        let json = serde_json::to_string(&request).unwrap();
        assert!(json.contains("oda_nobunaga"));
        assert!(json.contains("経営戦略について教えて"));
    }

    #[test]
    fn test_chat_response_serialization() {
        let response = ChatResponse::new(
            "その迷いは不要であろう...".to_string(),
            vec!["Wikipedia: 桶狭間の戦い".to_string()],
            "oda_nobunaga".to_string(),
        );

        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("その迷いは不要であろう"));
        assert!(json.contains("桶狭間の戦い"));
        assert!(json.contains("timestamp"));
    }

    #[test]
    fn test_error_response() {
        let error = ErrorResponse::bad_request("Invalid figure name");
        assert_eq!(error.code, "BAD_REQUEST");

        let error = ErrorResponse::internal_error("Database error");
        assert_eq!(error.code, "INTERNAL_SERVER_ERROR");

        let error = ErrorResponse::timeout();
        assert_eq!(error.code, "GATEWAY_TIMEOUT");
    }
}
