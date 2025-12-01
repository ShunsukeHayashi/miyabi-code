//! コア型定義

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// ナレッジエントリの一意識別子
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct KnowledgeId(Uuid);

impl KnowledgeId {
    /// 新しいIDを生成
    pub fn new() -> Self {
        Self(Uuid::new_v4())
    }

    /// 文字列から生成
    pub fn from_string(s: &str) -> Result<Self, uuid::Error> {
        Ok(Self(Uuid::parse_str(s)?))
    }

    /// 文字列として取得
    pub fn as_str(&self) -> String {
        self.0.to_string()
    }
}

impl Default for KnowledgeId {
    fn default() -> Self {
        Self::new()
    }
}

impl std::fmt::Display for KnowledgeId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

/// ナレッジエントリ
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeEntry {
    /// ID
    pub id: KnowledgeId,

    /// コンテンツ
    pub content: String,

    /// メタデータ
    pub metadata: KnowledgeMetadata,

    /// タイムスタンプ
    pub timestamp: DateTime<Utc>,

    /// ベクトル埋め込み（オプション）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub embedding: Option<Vec<f32>>,
}

impl KnowledgeEntry {
    /// 新しいエントリを作成
    pub fn new(content: String, metadata: KnowledgeMetadata) -> Self {
        Self { id: KnowledgeId::new(), content, metadata, timestamp: Utc::now(), embedding: None }
    }
}

/// ナレッジメタデータ
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeMetadata {
    /// ワークスペース名
    pub workspace: String,

    /// Worktree名（オプション）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub worktree: Option<String>,

    /// Agent種別（オプション）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agent: Option<String>,

    /// Issue番号（オプション）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub issue_number: Option<u32>,

    /// Task種別（オプション）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub task_type: Option<String>,

    /// 使用したツール（オプション）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tools_used: Option<Vec<String>>,

    /// 結果（成功/失敗）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub outcome: Option<String>,

    /// 変更ファイル（オプション）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub files_changed: Option<Vec<String>>,

    /// カスタムフィールド
    #[serde(flatten)]
    pub extra: serde_json::Map<String, serde_json::Value>,
}

impl Default for KnowledgeMetadata {
    fn default() -> Self {
        Self {
            workspace: "default".to_string(),
            worktree: None,
            agent: None,
            issue_number: None,
            task_type: None,
            tools_used: None,
            outcome: None,
            files_changed: None,
            extra: serde_json::Map::new(),
        }
    }
}

/// 検索結果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KnowledgeResult {
    /// ID
    pub id: KnowledgeId,

    /// 類似度スコア（0.0-1.0）
    pub score: f32,

    /// コンテンツ
    pub content: String,

    /// メタデータ
    pub metadata: KnowledgeMetadata,

    /// タイムスタンプ
    pub timestamp: DateTime<Utc>,
}

/// インデックス化統計
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndexStats {
    /// 総エントリ数
    pub total: usize,

    /// 成功数
    pub success: usize,

    /// 失敗数
    pub failed: usize,

    /// スキップ数（増分インデックス化時）
    #[serde(default)]
    pub skipped: usize,

    /// 処理時間（秒）
    pub duration_secs: f64,
}

impl Default for IndexStats {
    fn default() -> Self {
        Self { total: 0, success: 0, failed: 0, skipped: 0, duration_secs: 0.0 }
    }
}

/// ワークスペース情報
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceInfo {
    /// ワークスペース名
    pub name: String,

    /// Worktreeリスト
    pub worktrees: Vec<String>,

    /// Agentリスト
    pub agents: Vec<String>,

    /// 総エントリ数
    pub total_entries: usize,

    /// 最終更新日時
    pub last_updated: DateTime<Utc>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_knowledge_id_generation() {
        let id1 = KnowledgeId::new();
        let id2 = KnowledgeId::new();
        assert_ne!(id1, id2);
    }

    #[test]
    fn test_knowledge_id_from_string() {
        let uuid_str = "550e8400-e29b-41d4-a716-446655440000";
        let id = KnowledgeId::from_string(uuid_str).unwrap();
        assert_eq!(id.as_str(), uuid_str);
    }

    #[test]
    fn test_knowledge_entry_creation() {
        let metadata = KnowledgeMetadata::default();
        let entry = KnowledgeEntry::new("Test content".to_string(), metadata);
        assert_eq!(entry.content, "Test content");
        assert!(entry.embedding.is_none());
    }

    #[test]
    fn test_knowledge_metadata_serialization() {
        let metadata = KnowledgeMetadata {
            workspace: "test-workspace".to_string(),
            agent: Some("CodeGenAgent".to_string()),
            ..Default::default()
        };

        let json = serde_json::to_string(&metadata).unwrap();
        let deserialized: KnowledgeMetadata = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.workspace, "test-workspace");
        assert_eq!(deserialized.agent, Some("CodeGenAgent".to_string()));
    }
}
