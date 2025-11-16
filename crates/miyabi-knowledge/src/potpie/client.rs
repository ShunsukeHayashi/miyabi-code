//! Potpie API client implementation

use crate::potpie::error::{PotpieError, Result};
use crate::potpie::knowledge_graph::*;
use reqwest::{Client, StatusCode};
use serde::{Deserialize, Serialize};
use std::time::Duration;
use tracing::{debug, info, warn};

/// Configuration for Potpie client
#[derive(Debug, Clone)]
pub struct PotpieConfig {
    /// API base URL (e.g., "http://localhost:8000")
    pub api_url: String,
    /// Authentication token
    pub auth_token: Option<String>,
    /// Request timeout in seconds
    pub timeout_seconds: u64,
    /// Cache TTL in seconds
    pub cache_ttl_seconds: u64,
    /// Fallback to Git when Potpie unavailable
    pub fallback_to_git: bool,
}

impl Default for PotpieConfig {
    fn default() -> Self {
        Self {
            api_url: "http://localhost:8000".to_string(),
            auth_token: None,
            timeout_seconds: 30,
            cache_ttl_seconds: 300,
            fallback_to_git: true,
        }
    }
}

/// Potpie API client
pub struct PotpieClient {
    config: PotpieConfig,
    http_client: Client,
}

impl PotpieClient {
    /// Create new Potpie client
    pub fn new(config: PotpieConfig) -> Result<Self> {
        let http_client = Client::builder()
            .timeout(Duration::from_secs(config.timeout_seconds))
            .build()
            .map_err(|e| {
                PotpieError::ConfigError(format!("Failed to create HTTP client: {}", e))
            })?;

        Ok(Self {
            config,
            http_client,
        })
    }

    /// Build request with authentication
    #[allow(dead_code)]
    fn build_request(&self, endpoint: &str) -> reqwest::RequestBuilder {
        let url = format!("{}{}", self.config.api_url, endpoint);
        let mut request = self.http_client.get(&url);

        if let Some(ref token) = self.config.auth_token {
            request = request.bearer_auth(token);
        }

        request
    }

    /// Handle API response
    async fn handle_response<T: for<'de> Deserialize<'de>>(
        &self,
        response: reqwest::Response,
    ) -> Result<T> {
        let status = response.status();

        if status.is_success() {
            response
                .json::<T>()
                .await
                .map_err(|e| PotpieError::InvalidResponse(format!("Failed to parse JSON: {}", e)))
        } else {
            let message = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());

            Err(PotpieError::ApiError {
                status: status.as_u16(),
                message,
            })
        }
    }

    /// Check if Potpie service is available
    pub async fn health_check(&self) -> Result<bool> {
        debug!("Performing Potpie health check");

        match self.http_client.get(format!("{}/health", self.config.api_url)).send().await {
            Ok(response) => {
                if response.status() == StatusCode::OK {
                    Ok(true)
                } else {
                    Err(PotpieError::ServiceUnavailable(format!(
                        "Health check returned status: {}",
                        response.status()
                    )))
                }
            },
            Err(e) => {
                warn!("Potpie health check failed: {}", e);
                Err(PotpieError::ServiceUnavailable(e.to_string()))
            },
        }
    }

    // ============================================
    // 8 Potpie Tools Implementation
    // ============================================

    /// Tool 1: Search nodes by name
    pub async fn search_nodes(
        &self,
        query: &str,
        node_types: Option<Vec<String>>,
    ) -> Result<Vec<GraphNode>> {
        info!("Searching nodes with query: {}", query);

        #[derive(Serialize)]
        struct SearchRequest {
            query: String,
            #[serde(skip_serializing_if = "Option::is_none")]
            node_types: Option<Vec<String>>,
        }

        let request_body = SearchRequest {
            query: query.to_string(),
            node_types,
        };

        let response = self
            .http_client
            .post(format!("{}/api/v1/search_nodes", self.config.api_url))
            .json(&request_body)
            .send()
            .await?;

        self.handle_response(response).await
    }

    /// Tool 2: Get code graph for a file or module
    pub async fn get_code_graph(&self, path: &str, depth: Option<u32>) -> Result<CodeGraph> {
        info!("Getting code graph for path: {}", path);

        #[derive(Serialize)]
        struct GraphRequest {
            path: String,
            #[serde(skip_serializing_if = "Option::is_none")]
            depth: Option<u32>,
        }

        let request_body = GraphRequest {
            path: path.to_string(),
            depth,
        };

        let response = self
            .http_client
            .post(format!("{}/api/v1/get_code_graph", self.config.api_url))
            .json(&request_body)
            .send()
            .await?;

        self.handle_response(response).await
    }

    /// Tool 3: Detect changes and their impact
    pub async fn detect_changes(
        &self,
        base_commit: &str,
        head_commit: &str,
    ) -> Result<ChangeDetection> {
        info!("Detecting changes between {} and {}", base_commit, head_commit);

        #[derive(Serialize)]
        struct ChangesRequest {
            base_commit: String,
            head_commit: String,
        }

        let request_body = ChangesRequest {
            base_commit: base_commit.to_string(),
            head_commit: head_commit.to_string(),
        };

        let response = self
            .http_client
            .post(format!("{}/api/v1/detect_changes", self.config.api_url))
            .json(&request_body)
            .send()
            .await?;

        self.handle_response(response).await
    }

    /// Tool 4: Get file structure (modules, functions, classes)
    pub async fn get_file_structure(&self, file_path: &str) -> Result<FileStructure> {
        info!("Getting file structure for: {}", file_path);

        #[derive(Serialize)]
        struct FileStructureRequest {
            file_path: String,
        }

        let request_body = FileStructureRequest {
            file_path: file_path.to_string(),
        };

        let response = self
            .http_client
            .post(format!("{}/api/v1/get_file_structure", self.config.api_url))
            .json(&request_body)
            .send()
            .await?;

        self.handle_response(response).await
    }

    /// Tool 5: Parse AST for a file
    pub async fn parse_ast(&self, file_path: &str) -> Result<Vec<AstNode>> {
        info!("Parsing AST for: {}", file_path);

        #[derive(Serialize)]
        struct AstRequest {
            file_path: String,
        }

        let request_body = AstRequest {
            file_path: file_path.to_string(),
        };

        let response = self
            .http_client
            .post(format!("{}/api/v1/parse_ast", self.config.api_url))
            .json(&request_body)
            .send()
            .await?;

        self.handle_response(response).await
    }

    /// Tool 6: Track dependencies
    pub async fn track_dependencies(&self, module_name: &str) -> Result<Vec<DependencyInfo>> {
        info!("Tracking dependencies for: {}", module_name);

        #[derive(Serialize)]
        struct DependencyRequest {
            module_name: String,
        }

        let request_body = DependencyRequest {
            module_name: module_name.to_string(),
        };

        let response = self
            .http_client
            .post(format!("{}/api/v1/track_dependencies", self.config.api_url))
            .json(&request_body)
            .send()
            .await?;

        self.handle_response(response).await
    }

    /// Tool 7: Analyze Git diff
    pub async fn analyze_git_diff(&self, diff_text: &str) -> Result<GitDiffAnalysis> {
        info!("Analyzing Git diff ({} bytes)", diff_text.len());

        #[derive(Serialize)]
        struct DiffRequest {
            diff_text: String,
        }

        let request_body = DiffRequest {
            diff_text: diff_text.to_string(),
        };

        let response = self
            .http_client
            .post(format!("{}/api/v1/analyze_git_diff", self.config.api_url))
            .json(&request_body)
            .send()
            .await?;

        self.handle_response(response).await
    }

    /// Tool 8: Semantic search (RAG-powered)
    pub async fn semantic_search(
        &self,
        query: &str,
        top_k: Option<usize>,
    ) -> Result<Vec<SemanticSearchResult>> {
        info!("Performing semantic search: {}", query);

        #[derive(Serialize)]
        struct SemanticSearchRequest {
            query: String,
            #[serde(skip_serializing_if = "Option::is_none")]
            top_k: Option<usize>,
        }

        let request_body = SemanticSearchRequest {
            query: query.to_string(),
            top_k,
        };

        let response = self
            .http_client
            .post(format!("{}/api/v1/semantic_search", self.config.api_url))
            .json(&request_body)
            .send()
            .await?;

        self.handle_response(response).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_potpie_config_default() {
        let config = PotpieConfig::default();
        assert_eq!(config.api_url, "http://localhost:8000");
        assert_eq!(config.timeout_seconds, 30);
        assert_eq!(config.cache_ttl_seconds, 300);
        assert!(config.fallback_to_git);
    }

    #[test]
    fn test_potpie_client_new() {
        let config = PotpieConfig::default();
        let client = PotpieClient::new(config);
        assert!(client.is_ok());
    }

    #[tokio::test]
    async fn test_health_check_service_unavailable() {
        let config = PotpieConfig {
            api_url: "http://localhost:9999".to_string(), // Unlikely port
            ..Default::default()
        };
        let client = PotpieClient::new(config).unwrap();
        let result = client.health_check().await;
        assert!(result.is_err());
        if let Err(e) = result {
            assert!(e.should_fallback_to_git());
        }
    }
}
