//! Potpie integration helpers for Agents
//!
//! Provides utility functions for Agents to leverage Potpie's knowledge graph
//! and semantic search capabilities.

use miyabi_knowledge::potpie::knowledge_graph::SemanticSearchResult;
use miyabi_knowledge::potpie::{PotpieClient, PotpieConfig, PotpieError};
use miyabi_types::error::{MiyabiError, Result};
use tracing::{debug, info, warn};

/// Potpie integration helper
pub struct PotpieIntegration {
    client: Option<PotpieClient>,
    enabled: bool,
}

impl PotpieIntegration {
    /// Create new Potpie integration with optional configuration
    pub fn new(config: Option<PotpieConfig>) -> Self {
        let (client, enabled) = match config {
            Some(cfg) => match PotpieClient::new(cfg.clone()) {
                Ok(client) => {
                    info!("Potpie integration enabled");
                    (Some(client), true)
                }
                Err(e) => {
                    warn!(
                        "Failed to create Potpie client: {}. Fallback mode activated.",
                        e
                    );
                    (None, false)
                }
            },
            None => {
                debug!("Potpie integration disabled (no config provided)");
                (None, false)
            }
        };

        Self { client, enabled }
    }

    /// Check if Potpie is enabled and available
    pub async fn is_available(&self) -> bool {
        if !self.enabled {
            return false;
        }

        if let Some(ref client) = self.client {
            client.health_check().await.unwrap_or(false)
        } else {
            false
        }
    }

    /// Search for relevant code using semantic search
    ///
    /// Returns relevant code snippets that match the query.
    /// Falls back gracefully if Potpie is unavailable.
    pub async fn semantic_search(
        &self,
        query: &str,
        top_k: Option<usize>,
    ) -> Result<Vec<SemanticSearchResult>> {
        if !self.enabled {
            debug!("Potpie disabled, skipping semantic search");
            return Ok(vec![]);
        }

        let client = self
            .client
            .as_ref()
            .ok_or_else(|| MiyabiError::Unknown("Potpie client not initialized".to_string()))?;

        match client.semantic_search(query, top_k).await {
            Ok(results) => {
                info!("Potpie semantic search returned {} results", results.len());
                Ok(results)
            }
            Err(PotpieError::ServiceUnavailable(msg)) => {
                warn!("Potpie service unavailable: {}", msg);
                Ok(vec![]) // Graceful fallback
            }
            Err(PotpieError::Timeout(seconds)) => {
                warn!("Potpie request timed out after {}s", seconds);
                Ok(vec![]) // Graceful fallback
            }
            Err(e) => {
                warn!("Potpie semantic search failed: {}", e);
                Ok(vec![]) // Graceful fallback for all errors
            }
        }
    }

    /// Find existing implementations that match the task description
    ///
    /// Useful for CodeGenAgent to learn from existing patterns
    pub async fn find_existing_implementations(&self, task_description: &str) -> Result<String> {
        let results = self.semantic_search(task_description, Some(3)).await?;

        if results.is_empty() {
            return Ok(String::new());
        }

        let mut context = String::from("\n\n## 📚 Existing Implementations\n\n");
        context.push_str("The following existing code may be relevant:\n\n");

        for (idx, result) in results.iter().enumerate() {
            context.push_str(&format!(
                "### {}. {} (Score: {:.2})\n\n",
                idx + 1,
                result.node_name,
                result.score
            ));
            context.push_str(&format!("**File**: `{}`\n\n", result.file_path));

            if let Some(ref snippet) = result.snippet {
                context.push_str("```rust\n");
                context.push_str(snippet);
                context.push_str("\n```\n\n");
            }

            if let Some(ref explanation) = result.explanation {
                context.push_str(&format!("*{}*\n\n", explanation));
            }
        }

        context.push_str("**Note**: Consider these patterns when implementing the task.\n\n");

        Ok(context)
    }

    /// Track dependencies for a module
    pub async fn get_dependencies(&self, module_name: &str) -> Result<Vec<String>> {
        if !self.enabled {
            return Ok(vec![]);
        }

        let client = self
            .client
            .as_ref()
            .ok_or_else(|| MiyabiError::Unknown("Potpie client not initialized".to_string()))?;

        match client.track_dependencies(module_name).await {
            Ok(deps) => {
                let dep_names: Vec<String> = deps.iter().map(|d| d.name.clone()).collect();
                info!("Found {} dependencies for {}", dep_names.len(), module_name);
                Ok(dep_names)
            }
            Err(e) => {
                warn!("Failed to track dependencies: {}", e);
                Ok(vec![]) // Graceful fallback
            }
        }
    }
}

impl Default for PotpieIntegration {
    fn default() -> Self {
        Self::new(None)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_config() -> PotpieConfig {
        PotpieConfig {
            api_url: "http://localhost:8080".to_string(),
            auth_token: Some("test_api_key_12345".to_string()),
            timeout_seconds: 30,
            cache_ttl_seconds: 300,
            fallback_to_git: true,
        }
    }

    #[tokio::test]
    async fn test_potpie_integration_disabled() {
        let integration = PotpieIntegration::new(None);
        assert!(!integration.enabled);
        assert!(!integration.is_available().await);
    }

    #[tokio::test]
    async fn test_potpie_integration_enabled_creation() {
        // Note: Client creation succeeds even without server
        // (server check happens during health_check, not during new())
        let config = create_test_config();
        let integration = PotpieIntegration::new(Some(config));

        // Client is created successfully
        assert!(integration.client.is_some());
        assert!(integration.enabled);
    }

    #[tokio::test]
    async fn test_semantic_search_disabled() {
        let integration = PotpieIntegration::new(None);
        let results = integration.semantic_search("test", Some(5)).await.unwrap();
        assert!(results.is_empty());
    }

    #[tokio::test]
    async fn test_semantic_search_with_empty_query() {
        let integration = PotpieIntegration::new(None);
        let results = integration.semantic_search("", Some(5)).await.unwrap();
        assert!(results.is_empty());
    }

    #[tokio::test]
    async fn test_semantic_search_with_default_top_k() {
        let integration = PotpieIntegration::new(None);
        let results = integration
            .semantic_search("test query", None)
            .await
            .unwrap();
        assert!(results.is_empty());
    }

    #[tokio::test]
    async fn test_find_existing_implementations_empty() {
        let integration = PotpieIntegration::new(None);
        let context = integration
            .find_existing_implementations("test")
            .await
            .unwrap();
        assert_eq!(context, "");
    }

    #[tokio::test]
    async fn test_find_existing_implementations_with_long_description() {
        let integration = PotpieIntegration::new(None);
        let long_description = "a".repeat(1000);
        let context = integration
            .find_existing_implementations(&long_description)
            .await
            .unwrap();
        assert_eq!(context, "");
    }

    #[tokio::test]
    async fn test_get_dependencies_disabled() {
        let integration = PotpieIntegration::new(None);
        let deps = integration.get_dependencies("test-module").await.unwrap();
        assert!(deps.is_empty());
    }

    #[tokio::test]
    async fn test_get_dependencies_empty_module_name() {
        let integration = PotpieIntegration::new(None);
        let deps = integration.get_dependencies("").await.unwrap();
        assert!(deps.is_empty());
    }

    #[tokio::test]
    async fn test_get_dependencies_with_path() {
        let integration = PotpieIntegration::new(None);
        let deps = integration
            .get_dependencies("crates/miyabi-core")
            .await
            .unwrap();
        assert!(deps.is_empty());
    }

    #[tokio::test]
    async fn test_default_constructor() {
        let integration = PotpieIntegration::default();
        assert!(!integration.enabled);
        assert!(integration.client.is_none());
    }

    #[tokio::test]
    async fn test_is_available_no_client() {
        let integration = PotpieIntegration {
            client: None,
            enabled: true, // Artificially set to true
        };
        assert!(!integration.is_available().await);
    }

    #[test]
    fn test_potpie_integration_creation_patterns() {
        // Pattern 1: Disabled by default
        let integration1 = PotpieIntegration::default();
        assert!(!integration1.enabled);

        // Pattern 2: Explicitly disabled
        let integration2 = PotpieIntegration::new(None);
        assert!(!integration2.enabled);

        // Pattern 3: With config (client created successfully)
        let config = create_test_config();
        let integration3 = PotpieIntegration::new(Some(config));
        assert!(integration3.enabled); // Client is created, even without server
        assert!(integration3.client.is_some());
    }

    #[tokio::test]
    async fn test_semantic_search_error_handling() {
        // Disabled integration should return empty results, not error
        let integration = PotpieIntegration::new(None);

        let result = integration
            .semantic_search("complex query with special chars !@#$%", Some(10))
            .await;

        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }

    #[tokio::test]
    async fn test_find_existing_implementations_formats_correctly() {
        // Even with disabled integration, the function should work
        // We can't test actual Potpie responses without a real server,
        // but we can test the formatting logic indirectly

        let integration = PotpieIntegration::new(None);

        let context = integration
            .find_existing_implementations("implement authentication")
            .await
            .unwrap();

        // Should return empty string for disabled integration
        assert_eq!(context, "");
    }

    #[tokio::test]
    async fn test_multiple_semantic_searches() {
        let integration = PotpieIntegration::new(None);

        // Multiple searches should all return empty for disabled integration
        let results1 = integration
            .semantic_search("query1", Some(5))
            .await
            .unwrap();
        let results2 = integration
            .semantic_search("query2", Some(3))
            .await
            .unwrap();
        let results3 = integration.semantic_search("query3", None).await.unwrap();

        assert!(results1.is_empty());
        assert!(results2.is_empty());
        assert!(results3.is_empty());
    }

    #[tokio::test]
    async fn test_concurrent_operations() {
        use tokio::join;

        let integration = PotpieIntegration::new(None);

        // Test concurrent operations don't interfere
        let (search_result, impl_result, dep_result) = join!(
            integration.semantic_search("test", Some(5)),
            integration.find_existing_implementations("test"),
            integration.get_dependencies("test-module")
        );

        assert!(search_result.unwrap().is_empty());
        assert_eq!(impl_result.unwrap(), "");
        assert!(dep_result.unwrap().is_empty());
    }

    #[test]
    fn test_config_creation() {
        let config = create_test_config();

        assert_eq!(config.api_url, "http://localhost:8080");
        assert_eq!(config.auth_token, Some("test_api_key_12345".to_string()));
        assert_eq!(config.timeout_seconds, 30);
        assert_eq!(config.cache_ttl_seconds, 300);
        assert!(config.fallback_to_git);
    }
}
