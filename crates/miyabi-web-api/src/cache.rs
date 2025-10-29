// cache.rs
// Redis ベースのキャッシング戦略実装

use redis::{aio::ConnectionManager, AsyncCommands};
use serde::{de::DeserializeOwned, Serialize};
use std::time::Duration;
use crate::error::ApiError;
use tracing::{debug, warn, instrument};

/// キャッシュマネージャー
/// Redis を使用して頻繁にアクセスされるデータをキャッシュ
#[derive(Clone)]
pub struct CacheManager {
    redis: ConnectionManager,
}

impl CacheManager {
    /// 新しいキャッシュマネージャーを作成
    pub async fn new(redis_url: &str) -> Result<Self, ApiError> {
        let client = redis::Client::open(redis_url)
            .map_err(|e| ApiError::Config(format!("Redis connection error: {}", e)))?;

        let manager = ConnectionManager::new(client)
            .await
            .map_err(|e| ApiError::Config(format!("Redis connection pool error: {}", e)))?;

        Ok(Self { redis: manager })
    }

    /// キャッシュから値を取得、なければ DB から取得してキャッシュ
    #[instrument(skip(self, fetch_fn), fields(key = %key))]
    pub async fn get_or_fetch<T, F, Fut>(
        &self,
        key: &str,
        ttl_seconds: usize,
        fetch_fn: F,
    ) -> Result<T, ApiError>
    where
        T: Serialize + DeserializeOwned + Send + Sync,
        F: Fn() -> Fut + Send,
        Fut: std::future::Future<Output = Result<T, ApiError>> + Send,
    {
        // 1. Redis からキャッシュ取得を試みる
        let mut conn = self.redis.clone();

        match conn.get::<_, String>(key).await {
            Ok(cached_json) => {
                // キャッシュヒット
                match serde_json::from_str::<T>(&cached_json) {
                    Ok(value) => {
                        debug!("cache_hit: {}", key);
                        return Ok(value);
                    }
                    Err(e) => {
                        // デシリアライズエラー → キャッシュ削除
                        warn!("cache_deserialization_error: {} - {}", key, e);
                        let _ = conn.del::<_, ()>(key).await;
                    }
                }
            }
            Err(redis::RedisError { .. }) => {
                // キャッシュミス or Redis エラー
                debug!("cache_miss: {}", key);
            }
        }

        // 2. キャッシュミス → DB から取得
        let value = fetch_fn().await?;

        // 3. Redis にキャッシュ保存
        let serialized = serde_json::to_string(&value)
            .map_err(|e| ApiError::InternalServer(format!("Serialization error: {}", e)))?;

        // キャッシュ保存失敗は無視（データは返す）
        if let Err(e) = conn
            .set_ex::<_, _, ()>(key, serialized, ttl_seconds)
            .await
        {
            warn!("cache_set_error: {} - {}", key, e);
        }

        Ok(value)
    }

    /// キャッシュを削除
    pub async fn invalidate(&self, key: &str) -> Result<(), ApiError> {
        let mut conn = self.redis.clone();
        conn.del::<_, ()>(key)
            .await
            .map_err(|e| ApiError::InternalServer(format!("Cache invalidation error: {}", e)))?;

        debug!("cache_invalidated: {}", key);
        Ok(())
    }

    /// パターンマッチでキャッシュ削除
    pub async fn invalidate_pattern(&self, pattern: &str) -> Result<u32, ApiError> {
        let mut conn = self.redis.clone();
        let keys: Vec<String> = redis::cmd("KEYS")
            .arg(pattern)
            .query_async(&mut conn)
            .await
            .map_err(|e| ApiError::InternalServer(format!("Pattern search error: {}", e)))?;

        if keys.is_empty() {
            return Ok(0);
        }

        let deleted: u32 = conn.del(keys)
            .await
            .map_err(|e| ApiError::InternalServer(format!("Cache deletion error: {}", e)))?;

        debug!("cache_pattern_invalidated: {} (deleted: {})", pattern, deleted);
        Ok(deleted)
    }

    /// キャッシュを設定（カスタムシリアライズ）
    pub async fn set<T: Serialize>(
        &self,
        key: &str,
        value: &T,
        ttl_seconds: usize,
    ) -> Result<(), ApiError> {
        let mut conn = self.redis.clone();
        let serialized = serde_json::to_string(value)
            .map_err(|e| ApiError::InternalServer(format!("Serialization error: {}", e)))?;

        conn.set_ex::<_, _, ()>(key, serialized, ttl_seconds)
            .await
            .map_err(|e| ApiError::InternalServer(format!("Cache set error: {}", e)))?;

        Ok(())
    }

    /// キャッシュを取得（型付き）
    pub async fn get<T: DeserializeOwned>(
        &self,
        key: &str,
    ) -> Result<Option<T>, ApiError> {
        let mut conn = self.redis.clone();
        let cached: Option<String> = conn.get(key)
            .await
            .map_err(|e| ApiError::InternalServer(format!("Cache get error: {}", e)))?;

        match cached {
            Some(json) => {
                let value = serde_json::from_str(&json)
                    .map_err(|e| ApiError::InternalServer(format!("Deserialization error: {}", e)))?;
                Ok(Some(value))
            }
            None => Ok(None),
        }
    }
}

/// キャッシュキー生成ヘルパー
pub mod keys {
    /// ユーザーのリポジトリリスト
    pub fn user_repositories(user_id: i64) -> String {
        format!("user:{}:repositories", user_id)
    }

    /// ユーザープロフィール
    pub fn user_profile(user_id: i64) -> String {
        format!("user:{}:profile", user_id)
    }

    /// Repository 情報
    pub fn repository(repo_id: i64) -> String {
        format!("repo:{}", repo_id)
    }

    /// Agent 実行履歴
    pub fn user_executions(user_id: i64) -> String {
        format!("user:{}:executions", user_id)
    }

    /// GitHub API レスポンス
    pub fn github_api(endpoint: &str, params: &str) -> String {
        format!("github:{}:{}", endpoint, params)
    }

    /// パターンマッチで削除用
    pub fn user_pattern(user_id: i64) -> String {
        format!("user:{}:*", user_id)
    }
}

/// キャッシュ TTL 定義
pub mod ttl {
    use std::time::Duration;

    pub const SHORT: usize = 5 * 60; // 5 分
    pub const MEDIUM: usize = 10 * 60; // 10 分
    pub const LONG: usize = 60 * 60; // 1 時間
    pub const VERY_LONG: usize = 24 * 60 * 60; // 24 時間

    /// GitHub API レスポンス（API レート制限対策）
    pub const GITHUB_API: usize = 5 * 60; // 5 分

    /// ユーザープロフィール（変更頻度が低い）
    pub const USER_PROFILE: usize = 60 * 60; // 1 時間

    /// リポジトリ情報（変更が稀）
    pub const REPOSITORY: usize = 24 * 60 * 60; // 24 時間
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn test_cache_manager() {
        // Redis が利用可能な環境でテスト
        // let cache = CacheManager::new("redis://localhost").await.unwrap();
        // let key = "test:key";
        // let value = "test_value";
        // cache.set(key, &value, 60).await.unwrap();
        // let cached: Option<String> = cache.get(key).await.unwrap();
        // assert_eq!(cached, Some(value.to_string()));
    }
}
