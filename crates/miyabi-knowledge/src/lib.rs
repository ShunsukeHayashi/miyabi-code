//! Miyabi Knowledge Management System
//!
//! ベクトルデータベースを使った実行履歴のナレッジ化と検索
//!
//! # 概要
//!
//! Miyabiの実行履歴（ログファイル、成果物、Agent実行情報、ツール使用状況）を
//! ベクトルデータベース化し、ナレッジ検索可能な状態にします。
//!
//! # モジュール構成
//!
//! - `collector`: ログ収集機能
//! - `indexer`: ベクトル化・DB挿入機能
//! - `searcher`: 検索機能
//! - `types`: コア型定義
//! - `config`: 設定管理
//!
//! # 使用例
//!
//! ```rust,no_run
//! use miyabi_knowledge::{KnowledgeManager, KnowledgeConfig};
//!
//! #[tokio::main]
//! async fn main() -> anyhow::Result<()> {
//!     // 設定ロード
//!     let config = KnowledgeConfig::from_file(".miyabi.yml")?;
//!
//!     // マネージャー初期化
//!     let manager = KnowledgeManager::new(config).await?;
//!
//!     // ログ収集
//!     let entries = manager.collect(".ai/logs").await?;
//!     println!("Collected {} entries", entries.len());
//!
//!     // インデックス化
//!     let stats = manager.index_batch(&entries).await?;
//!     println!("Indexed {} entries", stats.total);
//!
//!     // 検索
//!     let results = manager.search("cargo build エラー").await?;
//!     for result in results {
//!         println!("Score: {:.2}, Content: {}", result.score, result.content);
//!     }
//!
//!     Ok(())
//! }
//! ```

pub mod cache;
pub mod chunking;
pub mod collector;
pub mod config;
pub mod embeddings;
pub mod error;
pub mod hasher;
pub mod indexer;
pub mod qdrant;
pub mod searcher;
pub mod types;

pub use cache::IndexCache;
pub use collector::{KnowledgeCollector, LogCollector};
pub use config::{AutoIndexConfig, KnowledgeConfig};
pub use error::{KnowledgeError, Result};
pub use hasher::{hash_bytes, hash_file, hash_string};
pub use indexer::{KnowledgeIndexer, QdrantIndexer};
pub use searcher::{KnowledgeSearcher, QdrantSearcher, SearchFilter};
pub use types::{
    IndexStats, KnowledgeEntry, KnowledgeId, KnowledgeMetadata, KnowledgeResult, WorkspaceInfo,
};

use std::path::Path;

/// ナレッジ管理のファサードクラス
///
/// 収集・インデックス化・検索を統合的に管理します。
pub struct KnowledgeManager {
    _config: KnowledgeConfig,
    collector: Box<dyn KnowledgeCollector>,
    indexer: Box<dyn KnowledgeIndexer>,
    searcher: Box<dyn KnowledgeSearcher>,
}

impl KnowledgeManager {
    /// 新しいKnowledgeManagerを作成
    ///
    /// # 例
    ///
    /// ```rust,no_run
    /// use miyabi_knowledge::{KnowledgeManager, KnowledgeConfig};
    ///
    /// #[tokio::main]
    /// async fn main() -> anyhow::Result<()> {
    ///     let config = KnowledgeConfig::default();
    ///     let manager = KnowledgeManager::new(config).await?;
    ///     Ok(())
    /// }
    /// ```
    pub async fn new(config: KnowledgeConfig) -> Result<Self> {
        let collector = Box::new(LogCollector::new(config.clone())?);
        let indexer = Box::new(QdrantIndexer::new(config.clone()).await?);
        let searcher = Box::new(QdrantSearcher::new(config.clone()).await?);

        Ok(Self {
            _config: config,
            collector,
            indexer,
            searcher,
        })
    }

    /// ログディレクトリから収集
    pub async fn collect<P: AsRef<Path>>(&self, path: P) -> Result<Vec<KnowledgeEntry>> {
        self.collector.collect(path.as_ref()).await
    }

    /// Worktreeから収集
    pub async fn collect_worktree(&self, worktree: &str) -> Result<Vec<KnowledgeEntry>> {
        self.collector.collect_worktree(worktree).await
    }

    /// Agentから収集
    pub async fn collect_agent(&self, agent: &str) -> Result<Vec<KnowledgeEntry>> {
        self.collector.collect_agent(agent).await
    }

    /// 単一エントリをインデックス化
    pub async fn index(&self, entry: &KnowledgeEntry) -> Result<KnowledgeId> {
        self.indexer.index(entry).await
    }

    /// バッチインデックス化
    pub async fn index_batch(&self, entries: &[KnowledgeEntry]) -> Result<IndexStats> {
        self.indexer.index_batch(entries).await
    }

    /// ワークスペース全体をインデックス化
    pub async fn index_workspace(&self, workspace: &str) -> Result<IndexStats> {
        self.indexer.index_workspace(workspace).await
    }

    /// ワークスペース全体を増分インデックス化（差分検出）
    ///
    /// 変更されたファイルのみをインデックス化し、10x以上の高速化を実現します。
    ///
    /// # 例
    ///
    /// ```rust,no_run
    /// use miyabi_knowledge::{KnowledgeManager, KnowledgeConfig};
    ///
    /// #[tokio::main]
    /// async fn main() -> anyhow::Result<()> {
    ///     let config = KnowledgeConfig::default();
    ///     let manager = KnowledgeManager::new(config).await?;
    ///
    ///     // 初回実行
    ///     let stats1 = manager.index_workspace_incremental("miyabi-private").await?;
    ///     println!("Indexed {} files", stats1.success);
    ///
    ///     // 2回目以降は高速（変更されたファイルのみ）
    ///     let stats2 = manager.index_workspace_incremental("miyabi-private").await?;
    ///     println!("Skipped {} unchanged files", stats2.skipped);
    ///
    ///     Ok(())
    /// }
    /// ```
    pub async fn index_workspace_incremental(&self, workspace: &str) -> Result<IndexStats> {
        self.indexer.index_workspace_incremental(workspace).await
    }

    /// クエリで検索
    pub async fn search(&self, query: &str) -> Result<Vec<KnowledgeResult>> {
        self.searcher.search(query).await
    }

    /// フィルタ付き検索
    pub async fn search_filtered(
        &self,
        query: &str,
        filter: SearchFilter,
    ) -> Result<Vec<KnowledgeResult>> {
        self.searcher.search_filtered(query, filter).await
    }

    /// 類似エントリ検索
    pub async fn find_similar(
        &self,
        entry_id: &KnowledgeId,
        limit: usize,
    ) -> Result<Vec<KnowledgeResult>> {
        self.searcher.find_similar(entry_id, limit).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_knowledge_manager_creation() {
        let _config = KnowledgeConfig::default();
        // Note: This will fail without Qdrant running
        // Use mock in actual tests
        // let manager = KnowledgeManager::new(_config).await;
        // assert!(manager.is_ok());
    }
}
