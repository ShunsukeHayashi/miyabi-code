//! Application state shared across request handlers

use miyabi_llm::OpenAIClient;
use std::sync::Arc;

/// Shared application state
#[derive(Clone)]
pub struct AppState {
    /// LLM client for AI responses
    pub llm_client: Arc<OpenAIClient>,
}

impl AppState {
    /// Create a new application state
    pub fn new(llm_client: OpenAIClient) -> Self {
        Self { llm_client: Arc::new(llm_client) }
    }

    /// Create application state from environment variables
    pub fn from_env() -> anyhow::Result<Self> {
        let llm_client = OpenAIClient::from_env()?;
        Ok(Self::new(llm_client))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_app_state_creation() {
        let client = OpenAIClient::new("test-key".to_string());
        let state = AppState::new(client);

        // Verify state can be cloned (Arc works)
        let _state2 = state.clone();
    }
}
