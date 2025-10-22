//! 設定管理

use crate::error::Result;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

/// ナレッジ管理システムの設定
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeConfig {
    /// ベクトルDB設定
    pub vector_db: VectorDbConfig,

    /// 埋め込み設定
    pub embeddings: EmbeddingsConfig,

    /// ワークスペース設定
    pub workspace: WorkspaceConfig,

    /// 収集設定
    pub collection: CollectionConfig,

    /// 検索設定
    pub search: SearchConfig,

    /// 自動インデックス化設定
    #[serde(default)]
    pub auto_index: AutoIndexConfig,
}

impl Default for KnowledgeConfig {
    fn default() -> Self {
        Self {
            vector_db: VectorDbConfig::default(),
            embeddings: EmbeddingsConfig::default(),
            workspace: WorkspaceConfig::default(),
            collection: CollectionConfig::default(),
            search: SearchConfig::default(),
            auto_index: AutoIndexConfig::default(),
        }
    }
}

impl KnowledgeConfig {
    /// ファイルから設定をロード
    pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self> {
        let content = std::fs::read_to_string(path)?;
        let config: Self = serde_json::from_str(&content)?;
        Ok(config)
    }

    /// ファイルに設定を保存
    pub fn save<P: AsRef<Path>>(&self, path: P) -> Result<()> {
        let content = serde_json::to_string_pretty(self)?;
        std::fs::write(path, content)?;
        Ok(())
    }
}

/// ベクトルDB設定
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorDbConfig {
    /// DB種別（現在はqdrantのみ）
    #[serde(rename = "type")]
    pub db_type: String,

    /// ホスト
    pub host: String,

    /// ポート
    pub port: u16,

    /// Collection名
    pub collection: String,
}

impl Default for VectorDbConfig {
    fn default() -> Self {
        Self {
            db_type: "qdrant".to_string(),
            host: "localhost".to_string(),
            port: 6333,
            collection: "miyabi-knowledge".to_string(),
        }
    }
}

/// 埋め込み設定
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmbeddingsConfig {
    /// Provider（openai, ollama, local）
    pub provider: String,

    /// モデル名
    pub model: String,

    /// 次元数
    pub dimension: usize,

    /// API Key（オプション）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub api_key: Option<String>,

    /// エンドポイント（オプション）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub endpoint: Option<String>,
}

impl Default for EmbeddingsConfig {
    fn default() -> Self {
        Self {
            provider: "ollama".to_string(),
            model: "all-MiniLM-L6-v2".to_string(),
            dimension: 384,
            api_key: None,
            endpoint: None,
        }
    }
}

/// ワークスペース設定
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceConfig {
    /// ワークスペース名
    pub name: String,

    /// 階層構造（project, worktree, agent）
    pub hierarchy: String,
}

impl Default for WorkspaceConfig {
    fn default() -> Self {
        Self {
            name: "default".to_string(),
            hierarchy: "project > worktree > agent".to_string(),
        }
    }
}

/// 収集設定
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectionConfig {
    /// ログディレクトリ
    pub log_dir: PathBuf,

    /// Worktreeディレクトリ
    pub worktree_dir: PathBuf,

    /// 自動インデックス化
    pub auto_index: bool,

    /// バッチサイズ
    pub batch_size: usize,
}

impl Default for CollectionConfig {
    fn default() -> Self {
        Self {
            log_dir: PathBuf::from(".ai/logs"),
            worktree_dir: PathBuf::from(".worktrees"),
            auto_index: true,
            batch_size: 100,
        }
    }
}

/// 検索設定
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchConfig {
    /// デフォルト結果数
    pub default_limit: usize,

    /// 最小スコア
    pub min_score: f32,
}

impl Default for SearchConfig {
    fn default() -> Self {
        Self {
            default_limit: 10,
            min_score: 0.7,
        }
    }
}

/// 自動インデックス化設定
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutoIndexConfig {
    /// 自動インデックス化の有効/無効
    #[serde(default = "default_auto_index_enabled")]
    pub enabled: bool,

    /// Agent実行完了後の遅延秒数（デフォルト: 2秒）
    #[serde(default = "default_delay_seconds")]
    pub delay_seconds: u64,

    /// インデックス化失敗時のリトライ回数（デフォルト: 3回）
    #[serde(default = "default_retry_count")]
    pub retry_count: u32,
}

impl Default for AutoIndexConfig {
    fn default() -> Self {
        Self {
            enabled: default_auto_index_enabled(),
            delay_seconds: default_delay_seconds(),
            retry_count: default_retry_count(),
        }
    }
}

/// デフォルト: 自動インデックス化有効
fn default_auto_index_enabled() -> bool {
    true
}

/// デフォルト: 2秒遅延
fn default_delay_seconds() -> u64 {
    2
}

/// デフォルト: 3回リトライ
fn default_retry_count() -> u32 {
    3
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_default_config() {
        let config = KnowledgeConfig::default();
        assert_eq!(config.vector_db.db_type, "qdrant");
        assert_eq!(config.embeddings.provider, "ollama");
        assert_eq!(config.workspace.name, "default");
    }

    #[test]
    fn test_config_serialization() {
        let config = KnowledgeConfig::default();
        let json = serde_json::to_string(&config).unwrap();
        let deserialized: KnowledgeConfig = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.vector_db.host, "localhost");
        assert_eq!(deserialized.embeddings.model, "all-MiniLM-L6-v2");
    }

    #[test]
    fn test_config_file_io() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("config.json");

        let config = KnowledgeConfig::default();
        config.save(&file_path).unwrap();

        let loaded = KnowledgeConfig::from_file(&file_path).unwrap();
        assert_eq!(loaded.vector_db.port, 6333);
    }

    #[test]
    fn test_auto_index_config_default() {
        let config = AutoIndexConfig::default();
        assert!(config.enabled);
        assert_eq!(config.delay_seconds, 2);
        assert_eq!(config.retry_count, 3);
    }

    #[test]
    fn test_auto_index_config_serialization() {
        let config = AutoIndexConfig {
            enabled: false,
            delay_seconds: 5,
            retry_count: 10,
        };

        let json = serde_json::to_string(&config).unwrap();
        let deserialized: AutoIndexConfig = serde_json::from_str(&json).unwrap();

        assert!(!deserialized.enabled);
        assert_eq!(deserialized.delay_seconds, 5);
        assert_eq!(deserialized.retry_count, 10);
    }

    #[test]
    fn test_knowledge_config_with_auto_index() {
        let config = KnowledgeConfig::default();
        assert!(config.auto_index.enabled);
        assert_eq!(config.auto_index.delay_seconds, 2);
    }

    #[test]
    fn test_backward_compatibility() {
        // 古いJSON（auto_indexフィールドなし）でも読み込めることを確認
        let json = r#"{
            "vector_db": {
                "type": "qdrant",
                "host": "localhost",
                "port": 6333,
                "collection": "test"
            },
            "embeddings": {
                "provider": "ollama",
                "model": "test-model",
                "dimension": 384
            },
            "workspace": {
                "name": "test",
                "hierarchy": "project > worktree > agent"
            },
            "collection": {
                "log_dir": ".ai/logs",
                "worktree_dir": ".worktrees",
                "auto_index": true,
                "batch_size": 100
            },
            "search": {
                "default_limit": 10,
                "min_score": 0.7
            }
        }"#;

        let config: KnowledgeConfig = serde_json::from_str(json).unwrap();
        // #[serde(default)]により、デフォルト値が使用される
        assert!(config.auto_index.enabled);
        assert_eq!(config.auto_index.delay_seconds, 2);
    }
}
