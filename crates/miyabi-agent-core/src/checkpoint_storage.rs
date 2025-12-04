//! Checkpoint Storage Backends
//!
//! Provides persistent storage implementations for checkpoint data,
//! supporting local filesystem and S3-compatible object storage.

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use tokio::fs;
use uuid::Uuid;

use crate::checkpoint::{Checkpoint, CheckpointError, CheckpointId, CheckpointStorage};

/// Local filesystem storage backend
pub struct LocalStorage {
    /// Base directory for checkpoint storage
    base_path: PathBuf,
    /// Content storage directory
    content_path: PathBuf,
    /// Index file path
    index_path: PathBuf,
    /// In-memory index cache
    index_cache: tokio::sync::RwLock<StorageIndex>,
}

/// Storage index for fast lookups
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
struct StorageIndex {
    /// Checkpoint ID to file path mapping
    checkpoints: HashMap<String, String>,
    /// Session ID to checkpoint IDs mapping
    sessions: HashMap<String, Vec<String>>,
    /// Content hash to file path mapping
    contents: HashMap<String, String>,
}

impl LocalStorage {
    /// Create new local storage at the given path
    pub async fn new(base_path: impl AsRef<Path>) -> Result<Self, CheckpointError> {
        let base = base_path.as_ref().to_path_buf();
        let content_path = base.join("content");
        let index_path = base.join("index.json");

        // Create directories
        fs::create_dir_all(&base).await
            .map_err(|e| CheckpointError::Storage(e.to_string()))?;
        fs::create_dir_all(&content_path).await
            .map_err(|e| CheckpointError::Storage(e.to_string()))?;

        // Load or create index
        let index = if index_path.exists() {
            let data = fs::read_to_string(&index_path).await
                .map_err(|e| CheckpointError::Storage(e.to_string()))?;
            serde_json::from_str(&data)
                .map_err(|e| CheckpointError::Serialization(e.to_string()))?
        } else {
            StorageIndex::default()
        };

        Ok(Self {
            base_path: base,
            content_path,
            index_path,
            index_cache: tokio::sync::RwLock::new(index),
        })
    }

    /// Save index to disk
    async fn save_index(&self) -> Result<(), CheckpointError> {
        let index = self.index_cache.read().await;
        let data = serde_json::to_string_pretty(&*index)
            .map_err(|e| CheckpointError::Serialization(e.to_string()))?;
        fs::write(&self.index_path, data).await
            .map_err(|e| CheckpointError::Storage(e.to_string()))?;
        Ok(())
    }

    /// Get checkpoint file path
    fn checkpoint_path(&self, id: &CheckpointId) -> PathBuf {
        self.base_path.join(format!("{}.json", id))
    }

    /// Get content file path
    fn content_file_path(&self, hash: &str) -> PathBuf {
        // Use first 2 chars as subdirectory for better filesystem performance
        let subdir = &hash[..2.min(hash.len())];
        self.content_path.join(subdir).join(hash)
    }
}

#[async_trait]
impl CheckpointStorage for LocalStorage {
    async fn save(&self, checkpoint: &Checkpoint) -> Result<(), CheckpointError> {
        let path = self.checkpoint_path(&checkpoint.id);
        let data = serde_json::to_string_pretty(checkpoint)
            .map_err(|e| CheckpointError::Serialization(e.to_string()))?;

        fs::write(&path, data).await
            .map_err(|e| CheckpointError::Storage(e.to_string()))?;

        // Update index
        {
            let mut index = self.index_cache.write().await;
            index.checkpoints.insert(
                checkpoint.id.to_string(),
                path.to_string_lossy().to_string(),
            );
            index.sessions
                .entry(checkpoint.session_id.clone())
                .or_default()
                .push(checkpoint.id.to_string());
        }
        self.save_index().await?;

        Ok(())
    }

    async fn load(&self, id: CheckpointId) -> Result<Option<Checkpoint>, CheckpointError> {
        let path = self.checkpoint_path(&id);

        if !path.exists() {
            return Ok(None);
        }

        let data = fs::read_to_string(&path).await
            .map_err(|e| CheckpointError::Storage(e.to_string()))?;
        let checkpoint: Checkpoint = serde_json::from_str(&data)
            .map_err(|e| CheckpointError::Serialization(e.to_string()))?;

        Ok(Some(checkpoint))
    }

    async fn list(&self, session_id: &str) -> Result<Vec<CheckpointId>, CheckpointError> {
        let index = self.index_cache.read().await;
        let ids = index.sessions
            .get(session_id)
            .map(|v| {
                v.iter()
                    .filter_map(|s| Uuid::parse_str(s).ok())
                    .collect()
            })
            .unwrap_or_default();
        Ok(ids)
    }

    async fn delete(&self, id: CheckpointId) -> Result<(), CheckpointError> {
        let path = self.checkpoint_path(&id);

        if path.exists() {
            fs::remove_file(&path).await
                .map_err(|e| CheckpointError::Storage(e.to_string()))?;
        }

        // Update index
        {
            let mut index = self.index_cache.write().await;
            index.checkpoints.remove(&id.to_string());
            for sessions in index.sessions.values_mut() {
                sessions.retain(|s| s != &id.to_string());
            }
        }
        self.save_index().await?;

        Ok(())
    }

    async fn store_content(&self, hash: &str, content: &[u8]) -> Result<(), CheckpointError> {
        let path = self.content_file_path(hash);

        // Create subdirectory if needed
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).await
                .map_err(|e| CheckpointError::Storage(e.to_string()))?;
        }

        fs::write(&path, content).await
            .map_err(|e| CheckpointError::Storage(e.to_string()))?;

        // Update index
        {
            let mut index = self.index_cache.write().await;
            index.contents.insert(hash.to_string(), path.to_string_lossy().to_string());
        }
        self.save_index().await?;

        Ok(())
    }

    async fn get_content(&self, hash: &str) -> Result<Option<Vec<u8>>, CheckpointError> {
        let path = self.content_file_path(hash);

        if !path.exists() {
            return Ok(None);
        }

        let content = fs::read(&path).await
            .map_err(|e| CheckpointError::Storage(e.to_string()))?;

        Ok(Some(content))
    }
}

/// S3-compatible object storage backend
#[derive(Clone)]
pub struct S3Storage {
    /// S3 client configuration
    #[allow(dead_code)]
    config: S3Config,
    /// Bucket name
    #[allow(dead_code)]
    bucket: String,
    /// Key prefix
    prefix: String,
}

/// S3 configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct S3Config {
    /// AWS region
    pub region: String,
    /// Endpoint URL (for S3-compatible services)
    pub endpoint: Option<String>,
    /// Access key ID
    pub access_key_id: Option<String>,
    /// Secret access key
    pub secret_access_key: Option<String>,
    /// Use path-style addressing
    pub path_style: bool,
}

impl Default for S3Config {
    fn default() -> Self {
        Self {
            region: "us-east-1".to_string(),
            endpoint: None,
            access_key_id: None,
            secret_access_key: None,
            path_style: false,
        }
    }
}

impl S3Storage {
    /// Create new S3 storage
    pub fn new(#[allow(dead_code)]
    config: S3Config, bucket: &str, prefix: &str) -> Self {
        Self {
            config,
            bucket: bucket.to_string(),
            prefix: prefix.to_string(),
        }
    }

    /// Get full S3 key for checkpoint
    fn checkpoint_key(&self, id: &CheckpointId) -> String {
        format!("{}/checkpoints/{}.json", self.prefix, id)
    }

    /// Get full S3 key for content
    fn content_key(&self, hash: &str) -> String {
        let subdir = &hash[..2.min(hash.len())];
        format!("{}/content/{}/{}", self.prefix, subdir, hash)
    }

    /// Get full S3 key for index
    #[allow(dead_code)]
    fn index_key(&self) -> String {
        format!("{}/index.json", self.prefix)
    }
}

// Note: Full S3 implementation would use aws-sdk-s3 crate
// This is a placeholder showing the interface
#[async_trait]
impl CheckpointStorage for S3Storage {
    async fn save(&self, checkpoint: &Checkpoint) -> Result<(), CheckpointError> {
        let _key = self.checkpoint_key(&checkpoint.id);
        let _data = serde_json::to_vec(checkpoint)
            .map_err(|e| CheckpointError::Serialization(e.to_string()))?;

        // TODO: Implement actual S3 put_object
        // self.client.put_object()
        //     .bucket(&self.bucket)
        //     .key(&key)
        //     .body(data.into())
        //     .send()
        //     .await?;

        Ok(())
    }

    async fn load(&self, id: CheckpointId) -> Result<Option<Checkpoint>, CheckpointError> {
        let _key = self.checkpoint_key(&id);

        // TODO: Implement actual S3 get_object
        // let result = self.client.get_object()
        //     .bucket(&self.bucket)
        //     .key(&key)
        //     .send()
        //     .await;

        Ok(None)
    }

    async fn list(&self, _session_id: &str) -> Result<Vec<CheckpointId>, CheckpointError> {
        // TODO: Implement S3 list_objects or index lookup
        Ok(Vec::new())
    }

    async fn delete(&self, id: CheckpointId) -> Result<(), CheckpointError> {
        let _key = self.checkpoint_key(&id);

        // TODO: Implement S3 delete_object
        Ok(())
    }

    async fn store_content(&self, hash: &str, _content: &[u8]) -> Result<(), CheckpointError> {
        let _key = self.content_key(hash);

        // TODO: Implement S3 put_object
        Ok(())
    }

    async fn get_content(&self, hash: &str) -> Result<Option<Vec<u8>>, CheckpointError> {
        let _key = self.content_key(hash);

        // TODO: Implement S3 get_object
        Ok(None)
    }
}

/// In-memory storage for testing
pub struct MemoryStorage {
    checkpoints: tokio::sync::RwLock<HashMap<CheckpointId, Checkpoint>>,
    contents: tokio::sync::RwLock<HashMap<String, Vec<u8>>>,
}

impl MemoryStorage {
    /// Create new in-memory storage
    pub fn new() -> Self {
        Self {
            checkpoints: tokio::sync::RwLock::new(HashMap::new()),
            contents: tokio::sync::RwLock::new(HashMap::new()),
        }
    }
}

impl Default for MemoryStorage {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl CheckpointStorage for MemoryStorage {
    async fn save(&self, checkpoint: &Checkpoint) -> Result<(), CheckpointError> {
        let mut store = self.checkpoints.write().await;
        store.insert(checkpoint.id, checkpoint.clone());
        Ok(())
    }

    async fn load(&self, id: CheckpointId) -> Result<Option<Checkpoint>, CheckpointError> {
        let store = self.checkpoints.read().await;
        Ok(store.get(&id).cloned())
    }

    async fn list(&self, session_id: &str) -> Result<Vec<CheckpointId>, CheckpointError> {
        let store = self.checkpoints.read().await;
        let ids: Vec<CheckpointId> = store
            .values()
            .filter(|c| c.session_id == session_id)
            .map(|c| c.id)
            .collect();
        Ok(ids)
    }

    async fn delete(&self, id: CheckpointId) -> Result<(), CheckpointError> {
        let mut store = self.checkpoints.write().await;
        store.remove(&id);
        Ok(())
    }

    async fn store_content(&self, hash: &str, content: &[u8]) -> Result<(), CheckpointError> {
        let mut store = self.contents.write().await;
        store.insert(hash.to_string(), content.to_vec());
        Ok(())
    }

    async fn get_content(&self, hash: &str) -> Result<Option<Vec<u8>>, CheckpointError> {
        let store = self.contents.read().await;
        Ok(store.get(hash).cloned())
    }
}

/// Storage factory for creating storage backends
pub struct StorageFactory;

impl StorageFactory {
    /// Create local filesystem storage
    pub async fn local(path: impl AsRef<Path>) -> Result<LocalStorage, CheckpointError> {
        LocalStorage::new(path).await
    }

    /// Create S3 storage
    pub fn s3(#[allow(dead_code)]
    config: S3Config, bucket: &str, prefix: &str) -> S3Storage {
        S3Storage::new(config, bucket, prefix)
    }

    /// Create in-memory storage (for testing)
    pub fn memory() -> MemoryStorage {
        MemoryStorage::new()
    }
}

/// Compressed storage wrapper
pub struct CompressedStorage<S: CheckpointStorage> {
    inner: S,
    #[allow(dead_code)]
    compression_level: u32,
}

impl<S: CheckpointStorage> CompressedStorage<S> {
    /// Create compressed storage wrapper
    pub fn new(inner: S, compression_level: u32) -> Self {
        Self {
            inner,
            compression_level,
        }
    }

    /// Compress data using zstd
    fn compress(&self, data: &[u8]) -> Result<Vec<u8>, CheckpointError> {
        // Using simple implementation - in production would use zstd crate
        // zstd::encode_all(data, self.compression_level as i32)
        Ok(data.to_vec()) // Placeholder
    }

    /// Decompress data
    fn decompress(&self, data: &[u8]) -> Result<Vec<u8>, CheckpointError> {
        // zstd::decode_all(data)
        Ok(data.to_vec()) // Placeholder
    }
}

#[async_trait]
impl<S: CheckpointStorage + Send + Sync> CheckpointStorage for CompressedStorage<S> {
    async fn save(&self, checkpoint: &Checkpoint) -> Result<(), CheckpointError> {
        self.inner.save(checkpoint).await
    }

    async fn load(&self, id: CheckpointId) -> Result<Option<Checkpoint>, CheckpointError> {
        self.inner.load(id).await
    }

    async fn list(&self, session_id: &str) -> Result<Vec<CheckpointId>, CheckpointError> {
        self.inner.list(session_id).await
    }

    async fn delete(&self, id: CheckpointId) -> Result<(), CheckpointError> {
        self.inner.delete(id).await
    }

    async fn store_content(&self, hash: &str, content: &[u8]) -> Result<(), CheckpointError> {
        let compressed = self.compress(content)?;
        self.inner.store_content(hash, &compressed).await
    }

    async fn get_content(&self, hash: &str) -> Result<Option<Vec<u8>>, CheckpointError> {
        match self.inner.get_content(hash).await? {
            Some(compressed) => {
                let data = self.decompress(&compressed)?;
                Ok(Some(data))
            }
            None => Ok(None),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::checkpoint::CheckpointState;
    use chrono::Utc;
    use std::collections::HashMap;

    fn create_test_checkpoint() -> Checkpoint {
        Checkpoint {
            id: Uuid::new_v4(),
            parent_id: None,
            created_at: Utc::now(),
            description: "Test checkpoint".to_string(),
            agent_id: "test-agent".to_string(),
            session_id: "test-session".to_string(),
            state: CheckpointState {
                files: HashMap::new(),
                environment: HashMap::new(),
                working_directory: PathBuf::from("/tmp"),
                git_state: None,
                metadata: HashMap::new(),
            },
            tags: vec!["test".to_string()],
            auto_save: false,
        }
    }

    #[tokio::test]
    async fn test_memory_storage() {
        let storage = MemoryStorage::new();
        let checkpoint = create_test_checkpoint();

        // Save
        storage.save(&checkpoint).await.unwrap();

        // Load
        let loaded = storage.load(checkpoint.id).await.unwrap();
        assert!(loaded.is_some());
        assert_eq!(loaded.unwrap().id, checkpoint.id);

        // List
        let list = storage.list(&checkpoint.session_id).await.unwrap();
        assert_eq!(list.len(), 1);

        // Delete
        storage.delete(checkpoint.id).await.unwrap();
        let loaded = storage.load(checkpoint.id).await.unwrap();
        assert!(loaded.is_none());
    }

    #[tokio::test]
    async fn test_memory_storage_content() {
        let storage = MemoryStorage::new();
        let hash = "abc123";
        let content = b"Hello, World!";

        // Store
        storage.store_content(hash, content).await.unwrap();

        // Retrieve
        let retrieved = storage.get_content(hash).await.unwrap();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap(), content);

        // Non-existent
        let missing = storage.get_content("nonexistent").await.unwrap();
        assert!(missing.is_none());
    }

    #[test]
    fn test_s3_config_default() {
        let config = S3Config::default();
        assert_eq!(config.region, "us-east-1");
        assert!(!config.path_style);
    }

    #[test]
    fn test_s3_storage_keys() {
        let storage = S3Storage::new(
            S3Config::default(),
            "my-bucket",
            "miyabi/checkpoints",
        );

        let id = Uuid::new_v4();
        let key = storage.checkpoint_key(&id);
        assert!(key.starts_with("miyabi/checkpoints/checkpoints/"));
        assert!(key.ends_with(".json"));

        let content_key = storage.content_key("abcdef123456");
        assert!(content_key.contains("/content/ab/"));
    }
}
