//! ベクトル化・インデックス化機能

use crate::cache::IndexCache;
use crate::chunking::{ChunkConfig, TextChunker};
use crate::collector::{KnowledgeCollector, LogCollector};
use crate::config::KnowledgeConfig;
use crate::embeddings::{create_embedding_generator, EmbeddingGenerator};
use crate::error::Result;
use crate::hasher::hash_file;
use crate::qdrant::QdrantClient;
use crate::types::{IndexStats, KnowledgeEntry, KnowledgeId};
use async_trait::async_trait;
use std::path::PathBuf;
use std::sync::Arc;
use tracing::{debug, info, warn};
use walkdir::WalkDir;

/// インデックス化トレイト
#[async_trait]
pub trait KnowledgeIndexer: Send + Sync {
    /// 単一エントリをインデックス化
    async fn index(&self, entry: &KnowledgeEntry) -> Result<KnowledgeId>;

    /// バッチインデックス化
    async fn index_batch(&self, entries: &[KnowledgeEntry]) -> Result<IndexStats>;

    /// ワークスペース全体をインデックス化
    async fn index_workspace(&self, workspace: &str) -> Result<IndexStats>;

    /// ワークスペース全体を増分インデックス化（差分検出）
    async fn index_workspace_incremental(&self, workspace: &str) -> Result<IndexStats>;
}

/// Qdrantインデックス実装
pub struct QdrantIndexer {
    config: KnowledgeConfig,
    qdrant_client: Arc<QdrantClient>,
    embedding_generator: Box<dyn EmbeddingGenerator>,
    chunker: TextChunker,
}

impl QdrantIndexer {
    /// 新しいQdrantIndexerを作成
    pub async fn new(config: KnowledgeConfig) -> Result<Self> {
        info!("Initializing Qdrant indexer");

        // Qdrant Client初期化
        let qdrant_client = Arc::new(QdrantClient::new(config.clone()).await?);

        // 埋め込みジェネレータ初期化
        let embedding_generator = create_embedding_generator(config.clone())?;

        // チャンカー初期化
        let chunker = TextChunker::new(ChunkConfig::default());

        Ok(Self { config, qdrant_client, embedding_generator, chunker })
    }

    /// エントリをベクトル化
    async fn vectorize(&self, content: &str) -> Result<Vec<f32>> {
        debug!("Vectorizing content: {} chars", content.len());
        self.embedding_generator.generate(content).await
    }

    /// エントリをチャンク化してインデックス化
    async fn index_with_chunking(&self, entry: &KnowledgeEntry) -> Result<Vec<KnowledgeId>> {
        // テキストをチャンク化
        let chunks = self.chunker.chunk(&entry.content)?;
        info!("Entry {} split into {} chunks", entry.id, chunks.len());

        let mut chunk_ids = Vec::new();

        for (i, chunk) in chunks.iter().enumerate() {
            // チャンクごとにエントリを作成
            let mut chunk_metadata = entry.metadata.clone();
            chunk_metadata
                .extra
                .insert("chunk_index".to_string(), serde_json::json!(i));
            chunk_metadata
                .extra
                .insert("total_chunks".to_string(), serde_json::json!(chunks.len()));
            chunk_metadata
                .extra
                .insert("parent_id".to_string(), serde_json::json!(entry.id.as_str()));

            let chunk_entry = KnowledgeEntry::new(chunk.clone(), chunk_metadata);

            // ベクトル化
            let vector = self.vectorize(chunk).await?;

            // Qdrantに挿入
            self.qdrant_client.insert(&chunk_entry, vector).await?;

            chunk_ids.push(chunk_entry.id);
        }

        Ok(chunk_ids)
    }
}

#[async_trait]
impl KnowledgeIndexer for QdrantIndexer {
    async fn index(&self, entry: &KnowledgeEntry) -> Result<KnowledgeId> {
        info!("Indexing entry: {}", entry.id);

        // コンテンツが長い場合はチャンク化
        if entry.content.len() > 1000 {
            let chunk_ids = self.index_with_chunking(entry).await?;
            info!("Entry {} indexed with {} chunks", entry.id, chunk_ids.len());
            Ok(entry.id.clone())
        } else {
            // 短いコンテンツはそのままインデックス化
            let vector = self.vectorize(&entry.content).await?;
            self.qdrant_client.insert(entry, vector).await?;
            Ok(entry.id.clone())
        }
    }

    async fn index_batch(&self, entries: &[KnowledgeEntry]) -> Result<IndexStats> {
        info!("Indexing batch of {} entries", entries.len());
        let start = std::time::Instant::now();

        let mut stats = IndexStats { total: entries.len(), ..Default::default() };

        // バッチサイズごとに処理
        let batch_size = self.config.collection.batch_size;

        for chunk in entries.chunks(batch_size) {
            // 並列ベクトル化
            let mut vectorization_tasks = Vec::new();

            for entry in chunk {
                let content = entry.content.clone();
                let embedding_generator = &self.embedding_generator;

                // 非同期タスクとして埋め込み生成
                vectorization_tasks.push(async move { embedding_generator.generate(&content).await });
            }

            // 全てのベクトル化を並列実行
            let vectors_results = futures::future::join_all(vectorization_tasks).await;

            // Qdrantにバッチ挿入
            let mut batch_entries = Vec::new();

            for (i, vector_result) in vectors_results.into_iter().enumerate() {
                match vector_result {
                    Ok(vector) => {
                        batch_entries.push((chunk[i].clone(), vector));
                    }
                    Err(e) => {
                        warn!("Failed to vectorize entry {}: {}", chunk[i].id, e);
                        stats.failed += 1;
                    }
                }
            }

            // バッチ挿入
            match self.qdrant_client.insert_batch(&batch_entries).await {
                Ok(inserted_ids) => {
                    stats.success += inserted_ids.len();
                    debug!("Batch inserted {} entries", inserted_ids.len());
                }
                Err(e) => {
                    warn!("Batch insert failed: {}", e);
                    stats.failed += batch_entries.len();
                }
            }
        }

        stats.duration_secs = start.elapsed().as_secs_f64();
        info!(
            "Batch indexing complete: {} success, {} failed in {:.2}s",
            stats.success, stats.failed, stats.duration_secs
        );

        Ok(stats)
    }

    async fn index_workspace(&self, workspace: &str) -> Result<IndexStats> {
        info!("Indexing workspace: {}", workspace);

        // TODO: CollectorでWorkspaceからエントリを収集
        // TODO: 収集したエントリをindex_batchで処理

        warn!("index_workspace is not yet implemented");
        Ok(IndexStats::default())
    }

    async fn index_workspace_incremental(&self, workspace: &str) -> Result<IndexStats> {
        info!("Incremental indexing workspace: {}", workspace);
        let start = std::time::Instant::now();

        // キャッシュをロード
        let mut cache = IndexCache::load_or_default(workspace)?;
        info!("Loaded cache with {} indexed files", cache.indexed_count());

        let mut stats = IndexStats::default();

        // ログディレクトリから全てのMarkdownファイルを収集
        let log_files = self.collect_log_files()?;
        stats.total = log_files.len();
        info!("Found {} log files", log_files.len());

        // Collector初期化
        let collector = LogCollector::new(self.config.clone())?;

        // 各ファイルをチェック
        for file_path in log_files {
            // ハッシュ計算
            let hash = match hash_file(&file_path) {
                Ok(h) => h,
                Err(e) => {
                    warn!("Failed to hash file {:?}: {}", file_path, e);
                    stats.failed += 1;
                    continue;
                }
            };

            // キャッシュチェック
            if cache.is_indexed(&file_path, &hash) {
                debug!("Skipping unchanged file: {:?}", file_path);
                stats.skipped += 1;
                continue;
            }

            // ファイルが変更されているのでインデックス化
            info!("Indexing changed file: {:?}", file_path);

            match collector.collect(&file_path).await {
                Ok(entries) => {
                    // エントリをインデックス化
                    match self.index_batch(&entries).await {
                        Ok(batch_stats) => {
                            stats.success += batch_stats.success;
                            stats.failed += batch_stats.failed;

                            // キャッシュを更新
                            cache.mark_indexed(file_path.clone(), hash);
                        }
                        Err(e) => {
                            warn!("Failed to index entries from {:?}: {}", file_path, e);
                            stats.failed += 1;
                        }
                    }
                }
                Err(e) => {
                    warn!("Failed to collect from {:?}: {}", file_path, e);
                    stats.failed += 1;
                }
            }
        }

        // キャッシュを保存
        if let Err(e) = cache.save() {
            warn!("Failed to save cache: {}", e);
        }

        stats.duration_secs = start.elapsed().as_secs_f64();

        info!(
            "Incremental indexing complete: {} success, {} skipped, {} failed in {:.2}s",
            stats.success, stats.skipped, stats.failed, stats.duration_secs
        );

        Ok(stats)
    }
}

impl QdrantIndexer {
    /// ログディレクトリから全てのMarkdownファイルを収集
    fn collect_log_files(&self) -> Result<Vec<PathBuf>> {
        let log_dir = &self.config.collection.log_dir;

        if !log_dir.exists() {
            return Ok(Vec::new());
        }

        let mut files = Vec::new();

        for entry in WalkDir::new(log_dir)
            .follow_links(true)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            let path = entry.path();

            // Markdownファイルのみ
            if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("md") {
                files.push(path.to_path_buf());
            }
        }

        Ok(files)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Integration test - requires Qdrant server running
    /// Run with: cargo test -- --ignored
    /// Start Qdrant: docker run -p 6333:6333 qdrant/qdrant
    #[tokio::test]
    #[ignore]
    async fn test_vectorize_placeholder() {
        let config = KnowledgeConfig::default();
        let indexer = QdrantIndexer::new(config).await.unwrap();

        let vector = indexer.vectorize("test content").await.unwrap();
        assert_eq!(vector.len(), 384);
    }

    /// Integration test - requires Qdrant server running
    /// Run with: cargo test -- --ignored
    #[tokio::test]
    #[ignore]
    async fn test_index_batch_empty() {
        let config = KnowledgeConfig::default();
        let indexer = QdrantIndexer::new(config).await.unwrap();

        let entries = vec![];
        let stats = indexer.index_batch(&entries).await.unwrap();

        assert_eq!(stats.total, 0);
        assert_eq!(stats.success, 0);
    }
}
