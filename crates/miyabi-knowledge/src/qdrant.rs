//! Qdrant クライアント統合

use crate::config::KnowledgeConfig;
use crate::error::{KnowledgeError, Result};
use crate::types::{KnowledgeEntry, KnowledgeId};
use qdrant_client::qdrant::vectors_config::Config;
use qdrant_client::qdrant::{
    CollectionInfo, CreateCollectionBuilder, Distance, PointStruct, ScoredPoint,
    SearchPointsBuilder, UpsertPointsBuilder, VectorParams, VectorsConfig,
};
use serde_json::json;
use tracing::{debug, info};

/// Qdrantクライアントラッパー
pub struct QdrantClient {
    pub client: qdrant_client::Qdrant,
    config: KnowledgeConfig,
}

impl QdrantClient {
    /// 新しいQdrantClientを作成
    pub async fn new(config: KnowledgeConfig) -> Result<Self> {
        let url = format!("http://{}:{}", config.vector_db.host, config.vector_db.port);
        info!("Connecting to Qdrant at: {}", url);

        let client = qdrant_client::Qdrant::from_url(&url)
            .build()
            .map_err(|e| KnowledgeError::Qdrant(format!("Failed to create client: {}", e)))?;

        let qdrant_client = Self { client, config };

        // Collectionが存在しない場合は作成
        qdrant_client.ensure_collection().await?;

        Ok(qdrant_client)
    }

    /// Collectionが存在することを確認（なければ作成）
    async fn ensure_collection(&self) -> Result<()> {
        let collection_name = &self.config.vector_db.collection;

        // Collection存在確認
        let exists = self
            .client
            .collection_exists(collection_name)
            .await
            .map_err(|e| KnowledgeError::Qdrant(format!("Failed to check collection: {}", e)))?;

        if exists {
            info!("Collection '{}' already exists", collection_name);
            return Ok(());
        }

        info!("Creating collection '{}'", collection_name);

        // Vector設定
        let vector_params = VectorParams {
            size: self.config.embeddings.dimension as u64,
            distance: Distance::Cosine.into(),
            ..Default::default()
        };

        let vectors_config = VectorsConfig {
            config: Some(Config::Params(vector_params)),
        };

        // Collection作成
        self.client
            .create_collection(
                CreateCollectionBuilder::new(collection_name)
                    .vectors_config(vectors_config)
                    .build(),
            )
            .await
            .map_err(|e| KnowledgeError::Qdrant(format!("Failed to create collection: {}", e)))?;

        info!("Collection '{}' created successfully", collection_name);
        Ok(())
    }

    /// エントリを挿入
    pub async fn insert(&self, entry: &KnowledgeEntry, vector: Vec<f32>) -> Result<()> {
        let collection_name = &self.config.vector_db.collection;

        // PointStruct作成
        let point = PointStruct::new(
            entry.id.as_str(),
            vector,
            json!({
                "workspace": entry.metadata.workspace,
                "worktree": entry.metadata.worktree,
                "agent": entry.metadata.agent,
                "issue_number": entry.metadata.issue_number,
                "task_type": entry.metadata.task_type,
                "tools_used": entry.metadata.tools_used,
                "outcome": entry.metadata.outcome,
                "files_changed": entry.metadata.files_changed,
                "content": entry.content,
                "timestamp": entry.timestamp.to_rfc3339(),
            })
            .as_object()
            .unwrap()
            .clone(),
        );

        // 挿入
        self.client
            .upsert_points(UpsertPointsBuilder::new(collection_name, vec![point]))
            .await
            .map_err(|e| KnowledgeError::Qdrant(format!("Failed to insert point: {}", e)))?;

        debug!("Inserted entry {} to Qdrant", entry.id);
        Ok(())
    }

    /// バッチ挿入
    pub async fn insert_batch(
        &self,
        entries: &[(KnowledgeEntry, Vec<f32>)],
    ) -> Result<Vec<KnowledgeId>> {
        let collection_name = &self.config.vector_db.collection;
        let mut inserted_ids = Vec::new();

        // PointStructのバッチ作成
        let points: Vec<PointStruct> = entries
            .iter()
            .map(|(entry, vector)| {
                inserted_ids.push(entry.id.clone());
                PointStruct::new(
                    entry.id.as_str(),
                    vector.clone(),
                    json!({
                        "workspace": entry.metadata.workspace,
                        "worktree": entry.metadata.worktree,
                        "agent": entry.metadata.agent,
                        "issue_number": entry.metadata.issue_number,
                        "task_type": entry.metadata.task_type,
                        "tools_used": entry.metadata.tools_used,
                        "outcome": entry.metadata.outcome,
                        "files_changed": entry.metadata.files_changed,
                        "content": entry.content,
                        "timestamp": entry.timestamp.to_rfc3339(),
                    })
                    .as_object()
                    .unwrap()
                    .clone(),
                )
            })
            .collect();

        // バッチ挿入
        self.client
            .upsert_points(UpsertPointsBuilder::new(collection_name, points))
            .await
            .map_err(|e| KnowledgeError::Qdrant(format!("Failed to batch insert: {}", e)))?;

        info!("Batch inserted {} entries to Qdrant", inserted_ids.len());
        Ok(inserted_ids)
    }

    /// ベクトル検索
    pub async fn search(&self, vector: Vec<f32>, limit: usize) -> Result<Vec<ScoredPoint>> {
        let collection_name = &self.config.vector_db.collection;

        let search_result = self
            .client
            .search_points(
                SearchPointsBuilder::new(collection_name, vector, limit as u64)
                    .with_payload(true)
                    .build(),
            )
            .await
            .map_err(|e| KnowledgeError::Qdrant(format!("Failed to search: {}", e)))?;

        debug!("Found {} results", search_result.result.len());
        Ok(search_result.result)
    }

    /// IDでエントリを取得
    pub async fn get_by_id(&self, id: &KnowledgeId) -> Result<Option<PointStruct>> {
        // TODO: Implement using correct Qdrant API
        // Current version is placeholder
        debug!("Getting entry {} from Qdrant (TODO)", id);
        Ok(None)
    }

    /// エントリを削除
    pub async fn delete(&self, id: &KnowledgeId) -> Result<()> {
        // TODO: Implement using correct Qdrant API
        // Current version is placeholder
        debug!("Deleting entry {} from Qdrant (TODO)", id);
        Ok(())
    }

    /// Collection統計を取得
    pub async fn collection_info(&self) -> Result<CollectionInfo> {
        let collection_name = &self.config.vector_db.collection;

        let info = self
            .client
            .collection_info(collection_name)
            .await
            .map_err(|e| KnowledgeError::Qdrant(format!("Failed to get collection info: {}", e)))?;

        Ok(info.result.unwrap())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::KnowledgeMetadata;

    // Note: These tests require a running Qdrant instance
    // Skip them in CI by using #[ignore]

    #[tokio::test]
    #[ignore]
    async fn test_qdrant_connection() {
        let config = KnowledgeConfig::default();
        let client = QdrantClient::new(config).await;
        assert!(client.is_ok());
    }

    #[tokio::test]
    #[ignore]
    async fn test_insert_and_search() {
        let config = KnowledgeConfig::default();
        let client = QdrantClient::new(config).await.unwrap();

        // テストエントリ作成
        let metadata = KnowledgeMetadata {
            workspace: "test-workspace".to_string(),
            ..Default::default()
        };
        let entry = KnowledgeEntry::new("Test content".to_string(), metadata);

        // ダミーベクトル（384次元）
        let vector = vec![0.1; 384];

        // 挿入
        client.insert(&entry, vector.clone()).await.unwrap();

        // 検索
        let results = client.search(vector, 5).await.unwrap();
        assert!(!results.is_empty());
    }
}
