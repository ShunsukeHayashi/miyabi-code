//! Token blacklist for secure logout
//!
//! Issue #1313: Implements token invalidation to prevent token reuse after logout

use async_trait::async_trait;
use dashmap::DashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};

/// Token blacklist trait for different backend implementations
#[async_trait]
pub trait TokenBlacklist: Send + Sync {
    /// Add a token to the blacklist with expiration
    async fn add(&self, token: &str, expires_at: i64) -> Result<(), BlacklistError>;

    /// Check if a token is blacklisted
    async fn is_blacklisted(&self, token: &str) -> Result<bool, BlacklistError>;

    /// Remove expired tokens (cleanup)
    async fn cleanup_expired(&self) -> Result<usize, BlacklistError>;
}

/// Errors that can occur with token blacklist operations
#[derive(Debug, thiserror::Error)]
pub enum BlacklistError {
    #[error("Redis error: {0}")]
    Redis(String),

    #[error("Internal error: {0}")]
    Internal(String),
}

/// In-memory token blacklist using DashMap
///
/// Suitable for single-instance deployments or development
#[derive(Debug, Clone)]
pub struct MemoryTokenBlacklist {
    /// Map of token hash -> expiration time
    tokens: Arc<DashMap<String, Instant>>,
}

impl MemoryTokenBlacklist {
    /// Create a new in-memory blacklist
    pub fn new() -> Self {
        Self {
            tokens: Arc::new(DashMap::new()),
        }
    }

    /// Hash the token for storage (don't store raw tokens)
    fn hash_token(token: &str) -> String {
        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update(token.as_bytes());
        hex::encode(hasher.finalize())
    }
}

impl Default for MemoryTokenBlacklist {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl TokenBlacklist for MemoryTokenBlacklist {
    async fn add(&self, token: &str, expires_at: i64) -> Result<(), BlacklistError> {
        let hash = Self::hash_token(token);
        let now = chrono::Utc::now().timestamp();
        let ttl_secs = (expires_at - now).max(0) as u64;
        let expires = Instant::now() + Duration::from_secs(ttl_secs);
        self.tokens.insert(hash, expires);
        Ok(())
    }

    async fn is_blacklisted(&self, token: &str) -> Result<bool, BlacklistError> {
        let hash = Self::hash_token(token);
        if let Some(entry) = self.tokens.get(&hash) {
            if Instant::now() < *entry {
                return Ok(true);
            }
            // Token expired, remove it
            drop(entry);
            self.tokens.remove(&hash);
        }
        Ok(false)
    }

    async fn cleanup_expired(&self) -> Result<usize, BlacklistError> {
        let now = Instant::now();
        let before = self.tokens.len();
        self.tokens.retain(|_, expires| *expires > now);
        Ok(before - self.tokens.len())
    }
}

/// Redis-backed token blacklist
///
/// Suitable for distributed deployments with multiple instances
#[cfg(feature = "redis")]
pub struct RedisTokenBlacklist {
    client: redis::Client,
    key_prefix: String,
}

#[cfg(feature = "redis")]
impl RedisTokenBlacklist {
    /// Create a new Redis-backed blacklist
    pub fn new(redis_url: &str) -> Result<Self, BlacklistError> {
        let client = redis::Client::open(redis_url)
            .map_err(|e| BlacklistError::Redis(e.to_string()))?;
        Ok(Self {
            client,
            key_prefix: "token_blacklist:".to_string(),
        })
    }

    /// Hash the token for storage
    fn hash_token(token: &str) -> String {
        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update(token.as_bytes());
        hex::encode(hasher.finalize())
    }

    fn key(&self, token_hash: &str) -> String {
        format!("{}{}", self.key_prefix, token_hash)
    }
}

#[cfg(feature = "redis")]
#[async_trait]
impl TokenBlacklist for RedisTokenBlacklist {
    async fn add(&self, token: &str, expires_at: i64) -> Result<(), BlacklistError> {
        use redis::AsyncCommands;

        let hash = Self::hash_token(token);
        let key = self.key(&hash);
        let now = chrono::Utc::now().timestamp();
        let ttl_secs = (expires_at - now).max(1) as u64;

        let mut conn = self
            .client
            .get_multiplexed_async_connection()
            .await
            .map_err(|e| BlacklistError::Redis(e.to_string()))?;

        conn.set_ex::<_, _, ()>(&key, "1", ttl_secs)
            .await
            .map_err(|e| BlacklistError::Redis(e.to_string()))?;

        Ok(())
    }

    async fn is_blacklisted(&self, token: &str) -> Result<bool, BlacklistError> {
        use redis::AsyncCommands;

        let hash = Self::hash_token(token);
        let key = self.key(&hash);

        let mut conn = self
            .client
            .get_multiplexed_async_connection()
            .await
            .map_err(|e| BlacklistError::Redis(e.to_string()))?;

        let exists: bool = conn
            .exists(&key)
            .await
            .map_err(|e| BlacklistError::Redis(e.to_string()))?;

        Ok(exists)
    }

    async fn cleanup_expired(&self) -> Result<usize, BlacklistError> {
        // Redis handles TTL expiration automatically
        Ok(0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_memory_blacklist_add_and_check() {
        let blacklist = MemoryTokenBlacklist::new();
        let token = "test_token_123";
        let expires_at = chrono::Utc::now().timestamp() + 3600; // 1 hour from now

        // Initially not blacklisted
        assert!(!blacklist.is_blacklisted(token).await.unwrap());

        // Add to blacklist
        blacklist.add(token, expires_at).await.unwrap();

        // Now should be blacklisted
        assert!(blacklist.is_blacklisted(token).await.unwrap());
    }

    #[tokio::test]
    async fn test_memory_blacklist_expired_token() {
        let blacklist = MemoryTokenBlacklist::new();
        let token = "expired_token";
        let expires_at = chrono::Utc::now().timestamp() - 1; // Already expired

        blacklist.add(token, expires_at).await.unwrap();

        // Should not be blacklisted (expired)
        assert!(!blacklist.is_blacklisted(token).await.unwrap());
    }

    #[tokio::test]
    async fn test_memory_blacklist_cleanup() {
        let blacklist = MemoryTokenBlacklist::new();

        // Add an expired token
        let token = "cleanup_test";
        let expires_at = chrono::Utc::now().timestamp() - 1;
        blacklist.add(token, expires_at).await.unwrap();

        // Cleanup should remove it
        let removed = blacklist.cleanup_expired().await.unwrap();
        assert_eq!(removed, 1);
    }

    #[tokio::test]
    async fn test_different_tokens_independent() {
        let blacklist = MemoryTokenBlacklist::new();
        let token1 = "token_one";
        let token2 = "token_two";
        let expires_at = chrono::Utc::now().timestamp() + 3600;

        blacklist.add(token1, expires_at).await.unwrap();

        assert!(blacklist.is_blacklisted(token1).await.unwrap());
        assert!(!blacklist.is_blacklisted(token2).await.unwrap());
    }
}
