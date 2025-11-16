//! Qdrant クライアント統合

use crate::config::KnowledgeConfig;
use crate::error::{KnowledgeError, Result};
use crate::types::{KnowledgeEntry, KnowledgeId};
use qdrant_client::qdrant::vectors_config::Config;
use qdrant_client::qdrant::{
    CollectionInfo, CreateCollectionBuilder, Distance, PointStruct, RetrievedPoint, ScoredPoint,
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
        let exists =
            self.client.collection_exists(collection_name).await.map_err(|e| {
                KnowledgeError::Qdrant(format!("Failed to check collection: {}", e))
            })?;

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
    pub async fn get_by_id(&self, id: &KnowledgeId) -> Result<Option<RetrievedPoint>> {
        use qdrant_client::qdrant::{GetPointsBuilder, PointId};

        let collection_name = &self.config.vector_db.collection;
        let point_id = PointId::from(id.as_str());

        let result = self
            .client
            .get_points(
                GetPointsBuilder::new(collection_name, vec![point_id])
                    .with_payload(true)
                    .with_vectors(true)
                    .build(),
            )
            .await
            .map_err(|e| KnowledgeError::Qdrant(format!("Failed to get point: {}", e)))?;

        Ok(result.result.first().cloned())
    }

    /// エントリを削除
    pub async fn delete_by_id(&self, id: &KnowledgeId) -> Result<()> {
        use qdrant_client::qdrant::{DeletePointsBuilder, PointId};

        let collection_name = &self.config.vector_db.collection;
        let point_id = PointId::from(id.as_str());

        self.client
            .delete_points(DeletePointsBuilder::new(collection_name).points(vec![point_id]))
            .await
            .map_err(|e| KnowledgeError::Qdrant(format!("Failed to delete point: {}", e)))?;

        debug!("Deleted entry {} from Qdrant", id);
        Ok(())
    }

    /// 全エントリをリスト
    pub async fn list_all_entries(&self) -> Result<Vec<KnowledgeEntry>> {
        use crate::types::KnowledgeMetadata;
        use chrono::DateTime;
        use qdrant_client::qdrant::ScrollPointsBuilder;

        let collection_name = &self.config.vector_db.collection;
        let mut all_entries = Vec::new();
        let mut offset = None;

        // Scroll through all points
        loop {
            let mut builder =
                ScrollPointsBuilder::new(collection_name).with_payload(true).limit(100);

            if let Some(offset_id) = offset {
                builder = builder.offset(offset_id);
            }

            let result =
                self.client.scroll(builder.build()).await.map_err(|e| {
                    KnowledgeError::Qdrant(format!("Failed to scroll points: {}", e))
                })?;

            for point in &result.result {
                let payload = &point.payload;
                // Extract metadata from payload
                let workspace = payload
                    .get("workspace")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| "default".to_string());

                let content = payload
                    .get("content")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
                    .unwrap_or_default();

                let timestamp_str =
                    payload.get("timestamp").and_then(|v| v.as_str()).map_or("", |v| v);

                let timestamp = DateTime::parse_from_rfc3339(timestamp_str)
                    .map(|dt| dt.with_timezone(&chrono::Utc))
                    .unwrap_or_else(|_| chrono::Utc::now());

                // Convert point.id to string
                let id_string = match &point.id {
                    Some(pid) => match &pid.point_id_options {
                        Some(qdrant_client::qdrant::point_id::PointIdOptions::Num(n)) => {
                            n.to_string()
                        },
                        Some(qdrant_client::qdrant::point_id::PointIdOptions::Uuid(u)) => u.clone(),
                        None => String::new(),
                    },
                    None => String::new(),
                };

                let metadata = KnowledgeMetadata {
                    workspace,
                    worktree: payload.get("worktree").and_then(|v| v.as_str()).map(String::from),
                    agent: payload.get("agent").and_then(|v| v.as_str()).map(String::from),
                    issue_number: payload
                        .get("issue_number")
                        .and_then(|v| v.as_integer())
                        .map(|i| i as u32),
                    task_type: payload.get("task_type").and_then(|v| v.as_str()).map(String::from),
                    outcome: payload.get("outcome").and_then(|v| v.as_str()).map(String::from),
                    tools_used: None,
                    files_changed: None,
                    extra: serde_json::Map::new(),
                };

                let entry = KnowledgeEntry {
                    id: KnowledgeId::from_string(&id_string).unwrap_or_else(|_| KnowledgeId::new()),
                    content,
                    metadata,
                    timestamp,
                    embedding: None,
                };

                all_entries.push(entry);
            }

            // Check if there are more results
            if result.next_page_offset.is_none() || result.result.is_empty() {
                break;
            }
            offset = result.next_page_offset;
        }

        info!("Listed {} entries from Qdrant", all_entries.len());
        Ok(all_entries)
    }

    /// Collection統計を取得
    pub async fn collection_info(&self) -> Result<CollectionInfo> {
        let collection_name = &self.config.vector_db.collection;

        let info =
            self.client.collection_info(collection_name).await.map_err(|e| {
                KnowledgeError::Qdrant(format!("Failed to get collection info: {}", e))
            })?;

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
