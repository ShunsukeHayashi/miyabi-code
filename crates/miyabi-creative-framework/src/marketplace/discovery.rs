//! Model discovery service

use crate::error::Result;
use crate::marketplace::{AIModelListing, ModelProvider, ProviderConnector};
use dashmap::DashMap;
use std::sync::Arc;

/// Model discovery service
pub struct ModelDiscovery {
    /// Cache of discovered models
    cache: DashMap<String, AIModelListing>,
    /// Last discovery time per provider
    last_discovery: DashMap<ModelProvider, chrono::DateTime<chrono::Utc>>,
    /// Cache TTL in seconds
    cache_ttl_seconds: u64,
}

impl ModelDiscovery {
    /// Create a new discovery service
    pub fn new() -> Self {
        Self {
            cache: DashMap::new(),
            last_discovery: DashMap::new(),
            cache_ttl_seconds: 3600, // 1 hour
        }
    }

    /// Create with custom cache TTL
    pub fn with_cache_ttl(cache_ttl_seconds: u64) -> Self {
        Self {
            cache: DashMap::new(),
            last_discovery: DashMap::new(),
            cache_ttl_seconds,
        }
    }

    /// Discover models from all registered connectors
    pub async fn discover_all(
        &self,
        connectors: &DashMap<ModelProvider, Arc<dyn ProviderConnector>>,
    ) -> Result<Vec<AIModelListing>> {
        let mut all_models = Vec::new();

        for entry in connectors.iter() {
            let provider = entry.key().clone();
            let connector = entry.value();

            match self.discover_from_provider(&provider, connector.as_ref()).await {
                Ok(models) => {
                    all_models.extend(models);
                }
                Err(e) => {
                    tracing::warn!(
                        provider = %provider,
                        error = %e,
                        "Failed to discover models from provider"
                    );
                }
            }
        }

        Ok(all_models)
    }

    /// Discover models from a specific provider
    pub async fn discover_from_provider(
        &self,
        provider: &ModelProvider,
        connector: &dyn ProviderConnector,
    ) -> Result<Vec<AIModelListing>> {
        // Check if cache is still valid
        if let Some(last_time) = self.last_discovery.get(provider) {
            let age = chrono::Utc::now()
                .signed_duration_since(*last_time)
                .num_seconds() as u64;

            if age < self.cache_ttl_seconds {
                // Return cached models
                return Ok(self.get_cached_models(provider));
            }
        }

        // Check provider availability
        if !connector.check_availability().await.unwrap_or(false) {
            tracing::warn!(provider = %provider, "Provider not available");
            return Ok(vec![]);
        }

        // Fetch fresh models
        let models = connector.list_available_models().await?;

        // Update cache
        for model in &models {
            self.cache.insert(model.id.clone(), model.clone());
        }

        self.last_discovery.insert(provider.clone(), chrono::Utc::now());

        tracing::info!(
            provider = %provider,
            count = models.len(),
            "Discovered models from provider"
        );

        Ok(models)
    }

    /// Get cached models for a provider
    fn get_cached_models(&self, provider: &ModelProvider) -> Vec<AIModelListing> {
        self.cache
            .iter()
            .filter(|entry| &entry.value().provider == provider)
            .map(|entry| entry.value().clone())
            .collect()
    }

    /// Clear the discovery cache
    pub fn clear_cache(&self) {
        self.cache.clear();
        self.last_discovery.clear();
    }

    /// Clear cache for a specific provider
    pub fn clear_provider_cache(&self, provider: &ModelProvider) {
        self.cache.retain(|_, model| &model.provider != provider);
        self.last_discovery.remove(provider);
    }

    /// Get cache statistics
    pub fn cache_stats(&self) -> DiscoveryCacheStats {
        DiscoveryCacheStats {
            total_models: self.cache.len(),
            providers_cached: self.last_discovery.len(),
            cache_ttl_seconds: self.cache_ttl_seconds,
        }
    }
}

impl Default for ModelDiscovery {
    fn default() -> Self {
        Self::new()
    }
}

/// Discovery cache statistics
#[derive(Debug, Clone)]
pub struct DiscoveryCacheStats {
    pub total_models: usize,
    pub providers_cached: usize,
    pub cache_ttl_seconds: u64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_discovery_creation() {
        let discovery = ModelDiscovery::new();
        assert_eq!(discovery.cache_ttl_seconds, 3600);
    }

    #[test]
    fn test_discovery_with_custom_ttl() {
        let discovery = ModelDiscovery::with_cache_ttl(7200);
        assert_eq!(discovery.cache_ttl_seconds, 7200);
    }

    #[test]
    fn test_cache_stats() {
        let discovery = ModelDiscovery::new();
        let stats = discovery.cache_stats();

        assert_eq!(stats.total_models, 0);
        assert_eq!(stats.providers_cached, 0);
    }
}
