//! 検索機能

use crate::config::KnowledgeConfig;
use crate::embeddings::{create_embedding_generator, EmbeddingGenerator};
use crate::error::{KnowledgeError, Result};
use crate::qdrant::QdrantClient;
use crate::types::{KnowledgeId, KnowledgeMetadata, KnowledgeResult};
use async_trait::async_trait;
use qdrant_client::qdrant::{Condition, Filter};
use std::sync::Arc;
use tracing::{debug, info};

/// 検索フィルタ
#[derive(Debug, Clone, Default)]
pub struct SearchFilter {
    /// ワークスペース
    pub workspace: Option<String>,

    /// Worktree
    pub worktree: Option<String>,

    /// Agent
    pub agent: Option<String>,

    /// Issue番号
    pub issue_number: Option<u32>,

    /// Task種別
    pub task_type: Option<String>,

    /// 結果（success/failed）
    pub outcome: Option<String>,
}

impl SearchFilter {
    /// 新しいフィルタを作成
    pub fn new() -> Self {
        Self::default()
    }

    /// ワークスペースフィルタを設定
    pub fn with_workspace(mut self, workspace: impl Into<String>) -> Self {
        self.workspace = Some(workspace.into());
        self
    }

    /// Worktreeフィルタを設定
    pub fn with_worktree(mut self, worktree: impl Into<String>) -> Self {
        self.worktree = Some(worktree.into());
        self
    }

    /// Agentフィルタを設定
    pub fn with_agent(mut self, agent: impl Into<String>) -> Self {
        self.agent = Some(agent.into());
        self
    }

    /// Issue番号フィルタを設定
    pub fn with_issue_number(mut self, issue_number: u32) -> Self {
        self.issue_number = Some(issue_number);
        self
    }

    /// Task種別フィルタを設定
    pub fn with_task_type(mut self, task_type: impl Into<String>) -> Self {
        self.task_type = Some(task_type.into());
        self
    }

    /// 結果フィルタを設定
    pub fn with_outcome(mut self, outcome: impl Into<String>) -> Self {
        self.outcome = Some(outcome.into());
        self
    }
}

/// 検索トレイト
#[async_trait]
pub trait KnowledgeSearcher: Send + Sync {
    /// クエリで検索
    async fn search(&self, query: &str) -> Result<Vec<KnowledgeResult>>;

    /// フィルタ付き検索
    async fn search_filtered(
        &self,
        query: &str,
        filter: SearchFilter,
    ) -> Result<Vec<KnowledgeResult>>;

    /// 類似エントリ検索
    async fn find_similar(
        &self,
        entry_id: &KnowledgeId,
        limit: usize,
    ) -> Result<Vec<KnowledgeResult>>;
}

/// Qdrant検索実装
pub struct QdrantSearcher {
    config: KnowledgeConfig,
    qdrant_client: Arc<QdrantClient>,
    embedding_generator: Box<dyn EmbeddingGenerator>,
}

impl QdrantSearcher {
    /// 新しいQdrantSearcherを作成
    pub async fn new(config: KnowledgeConfig) -> Result<Self> {
        info!("Initializing Qdrant searcher");

        // Qdrant Client初期化
        let qdrant_client = Arc::new(QdrantClient::new(config.clone()).await?);

        // 埋め込みジェネレータ初期化
        let embedding_generator = create_embedding_generator(config.clone())?;

        Ok(Self {
            config,
            qdrant_client,
            embedding_generator,
        })
    }

    /// クエリをベクトル化
    async fn vectorize_query(&self, query: &str) -> Result<Vec<f32>> {
        debug!("Vectorizing query: {}", query);
        self.embedding_generator.generate(query).await
    }

    /// Qdrantで検索
    async fn search_qdrant(
        &self,
        vector: Vec<f32>,
        filter: Option<SearchFilter>,
        limit: usize,
    ) -> Result<Vec<KnowledgeResult>> {
        debug!("Searching Qdrant with limit: {}", limit);

        // Qdrantフィルタ構築
        let qdrant_filter = self.build_qdrant_filter(filter);

        // Qdrant検索実行
        let scored_points = if let Some(f) = qdrant_filter {
            // フィルタ付き検索
            let collection_name = &self.config.vector_db.collection;
            self.qdrant_client
                .client
                .search_points(
                    qdrant_client::qdrant::SearchPointsBuilder::new(
                        collection_name,
                        vector,
                        limit as u64,
                    )
                    .filter(f)
                    .with_payload(true)
                    .build(),
                )
                .await
                .map_err(|e| KnowledgeError::Qdrant(format!("Search failed: {}", e)))?
                .result
        } else {
            // フィルタなし検索
            self.qdrant_client.search(vector, limit).await?
        };

        // KnowledgeResult変換
        let results: Vec<KnowledgeResult> = scored_points
            .into_iter()
            .map(|point| {
                let payload = point.payload;
                let content = payload
                    .get("content")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
                    .unwrap_or_default();

                let metadata = KnowledgeMetadata {
                    workspace: payload
                        .get("workspace")
                        .and_then(|v| v.as_str())
                        .map(|s| s.to_string())
                        .unwrap_or_default(),
                    worktree: payload
                        .get("worktree")
                        .and_then(|v| v.as_str())
                        .map(|s| s.to_string()),
                    agent: payload.get("agent").and_then(|v| v.as_str()).map(|s| s.to_string()),
                    issue_number: payload
                        .get("issue_number")
                        .and_then(|v| v.as_integer())
                        .map(|n| n as u32),
                    task_type: payload
                        .get("task_type")
                        .and_then(|v| v.as_str())
                        .map(|s| s.to_string()),
                    tools_used: payload.get("tools_used").and_then(|v| v.as_list()).map(|list| {
                        list.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect()
                    }),
                    outcome: payload.get("outcome").and_then(|v| v.as_str()).map(|s| s.to_string()),
                    files_changed: payload.get("files_changed").and_then(|v| v.as_list()).map(
                        |list| {
                            list.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect()
                        },
                    ),
                    extra: serde_json::Map::new(),
                };

                let id_string = point
                    .id
                    .map(|id| match id.point_id_options {
                        Some(qdrant_client::qdrant::point_id::PointIdOptions::Uuid(uuid)) => uuid,
                        Some(qdrant_client::qdrant::point_id::PointIdOptions::Num(num)) => {
                            num.to_string()
                        },
                        None => "unknown".to_string(),
                    })
                    .unwrap_or_else(|| "unknown".to_string());

                let timestamp = payload
                    .get("timestamp")
                    .and_then(|v| v.as_str())
                    .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok())
                    .map(|dt| dt.with_timezone(&chrono::Utc))
                    .unwrap_or_else(chrono::Utc::now);

                KnowledgeResult {
                    id: KnowledgeId::from_string(&id_string).unwrap_or_default(),
                    content,
                    metadata,
                    score: point.score,
                    timestamp,
                }
            })
            .collect();

        info!("Found {} results", results.len());
        Ok(results)
    }

    /// SearchFilterをQdrantフィルタに変換
    fn build_qdrant_filter(&self, filter: Option<SearchFilter>) -> Option<Filter> {
        let filter = filter?;

        let mut conditions = Vec::new();

        if let Some(workspace) = filter.workspace {
            conditions.push(Condition::matches("workspace", workspace));
        }

        if let Some(worktree) = filter.worktree {
            conditions.push(Condition::matches("worktree", worktree));
        }

        if let Some(agent) = filter.agent {
            conditions.push(Condition::matches("agent", agent));
        }

        if let Some(issue_number) = filter.issue_number {
            conditions.push(Condition::matches("issue_number", issue_number as i64));
        }

        if let Some(task_type) = filter.task_type {
            conditions.push(Condition::matches("task_type", task_type));
        }

        if let Some(outcome) = filter.outcome {
            conditions.push(Condition::matches("outcome", outcome));
        }

        if conditions.is_empty() {
            None
        } else {
            Some(Filter::must(conditions))
        }
    }
}

#[async_trait]
impl KnowledgeSearcher for QdrantSearcher {
    async fn search(&self, query: &str) -> Result<Vec<KnowledgeResult>> {
        info!("Searching for: {}", query);

        // クエリをベクトル化
        let vector = self.vectorize_query(query).await?;

        // Qdrantで検索
        let results = self.search_qdrant(vector, None, self.config.search.default_limit).await?;

        info!("Found {} results", results.len());
        Ok(results)
    }

    async fn search_filtered(
        &self,
        query: &str,
        filter: SearchFilter,
    ) -> Result<Vec<KnowledgeResult>> {
        info!("Searching for: {} with filter", query);

        // クエリをベクトル化
        let vector = self.vectorize_query(query).await?;

        // Qdrantで検索（フィルタ付き）
        let results = self
            .search_qdrant(vector, Some(filter), self.config.search.default_limit)
            .await?;

        info!("Found {} results", results.len());
        Ok(results)
    }

    async fn find_similar(
        &self,
        entry_id: &KnowledgeId,
        _limit: usize,
    ) -> Result<Vec<KnowledgeResult>> {
        info!("Finding similar entries for: {}", entry_id);

        // TODO: Get entry vector from Qdrant
        // TODO: Search for similar vectors

        Ok(Vec::new())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_search_filter_builder() {
        let filter = SearchFilter::new()
            .with_workspace("miyabi-private")
            .with_agent("CodeGenAgent")
            .with_task_type("feature");

        assert_eq!(filter.workspace, Some("miyabi-private".to_string()));
        assert_eq!(filter.agent, Some("CodeGenAgent".to_string()));
        assert_eq!(filter.task_type, Some("feature".to_string()));
    }

    /// Integration test - requires Qdrant server running
    /// Run with: cargo test -- --ignored
    /// Start Qdrant: docker run -p 6333:6333 qdrant/qdrant
    #[tokio::test]
    #[ignore]
    async fn test_vectorize_query_placeholder() {
        let config = KnowledgeConfig::default();
        let searcher = QdrantSearcher::new(config).await.unwrap();

        let vector = searcher.vectorize_query("test query").await.unwrap();
        assert_eq!(vector.len(), 384);
    }
}
