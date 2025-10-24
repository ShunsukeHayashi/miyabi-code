//! インデックスキャッシュシステム
//!
//! ログファイルのインデックス状態を追跡し、増分インデックス化を可能にします。

use crate::error::{KnowledgeError, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};

/// インデックスキャッシュ
///
/// ワークスペース毎にインデックス済みログファイルを追跡します。
/// ファイルパスとSHA256ハッシュをマッピングし、変更検出に使用します。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndexCache {
    /// ログファイルパス → SHA256ハッシュ
    pub indexed_files: HashMap<PathBuf, String>,

    /// 最終インデックス化タイムスタンプ
    pub last_indexed_at: DateTime<Utc>,

    /// ワークスペース名
    pub workspace: String,
}

impl IndexCache {
    /// 新しいキャッシュを作成
    pub fn new(workspace: String) -> Self {
        Self {
            indexed_files: HashMap::new(),
            last_indexed_at: Utc::now(),
            workspace,
        }
    }

    /// キャッシュファイルをロード、存在しない場合はデフォルト作成
    ///
    /// # Arguments
    ///
    /// * `workspace` - ワークスペース名
    ///
    /// # Example
    ///
    /// ```
    /// use miyabi_knowledge::IndexCache;
    ///
    /// let cache = IndexCache::load_or_default("my-workspace")?;
    /// ```
    pub fn load_or_default(workspace: &str) -> Result<Self> {
        let path = Self::cache_path(workspace)?;

        if path.exists() {
            let content = std::fs::read_to_string(&path)?;
            let cache: Self = serde_json::from_str(&content)?;
            Ok(cache)
        } else {
            Ok(Self::new(workspace.to_string()))
        }
    }

    /// キャッシュをファイルに保存
    ///
    /// # Example
    ///
    /// ```
    /// use miyabi_knowledge::IndexCache;
    ///
    /// let mut cache = IndexCache::new("my-workspace".to_string());
    /// cache.mark_indexed("path/to/log.md".into(), "abc123...".to_string());
    /// cache.save()?;
    /// ```
    pub fn save(&self) -> Result<()> {
        let path = Self::cache_path(&self.workspace)?;

        // ディレクトリを作成
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        // JSON形式で保存
        let content = serde_json::to_string_pretty(self)?;
        std::fs::write(&path, content)?;

        Ok(())
    }

    /// ファイルがインデックス済みかチェック
    ///
    /// # Arguments
    ///
    /// * `path` - ログファイルパス
    /// * `hash` - ファイルのSHA256ハッシュ
    ///
    /// # Returns
    ///
    /// ファイルがインデックス済みで、ハッシュが一致する場合は`true`
    pub fn is_indexed(&self, path: &Path, hash: &str) -> bool {
        self.indexed_files
            .get(path)
            .is_some_and(|cached_hash| cached_hash == hash)
    }

    /// ファイルをインデックス済みとしてマーク
    ///
    /// # Arguments
    ///
    /// * `path` - ログファイルパス
    /// * `hash` - ファイルのSHA256ハッシュ
    pub fn mark_indexed(&mut self, path: PathBuf, hash: String) {
        self.indexed_files.insert(path, hash);
        self.last_indexed_at = Utc::now();
    }

    /// インデックス済みファイル数を取得
    pub fn indexed_count(&self) -> usize {
        self.indexed_files.len()
    }

    /// キャッシュをクリア
    pub fn clear(&mut self) {
        self.indexed_files.clear();
        self.last_indexed_at = Utc::now();
    }

    /// キャッシュファイルパスを取得
    ///
    /// パス: `~/.cache/miyabi/knowledge/{workspace}.json` (Unix)
    ///       `%LOCALAPPDATA%\miyabi\knowledge\{workspace}.json` (Windows)
    fn cache_path(workspace: &str) -> Result<PathBuf> {
        let cache_dir = dirs::cache_dir()
            .ok_or_else(|| KnowledgeError::Config("Failed to determine cache directory".into()))?;

        let path = cache_dir
            .join("miyabi")
            .join("knowledge")
            .join(format!("{}.json", workspace));

        Ok(path)
    }

    /// 指定ワークスペースのキャッシュファイルを削除
    ///
    /// # Arguments
    ///
    /// * `workspace` - ワークスペース名（Noneの場合は全ワークスペース）
    pub fn delete_cache(workspace: Option<&str>) -> Result<usize> {
        let base_cache_dir = dirs::cache_dir()
            .ok_or_else(|| KnowledgeError::Config("Failed to determine cache directory".into()))?;

        let cache_dir = base_cache_dir
            .join("miyabi")
            .join("knowledge");

        if !cache_dir.exists() {
            return Ok(0);
        }

        let mut deleted = 0;

        if let Some(ws) = workspace {
            // 特定ワークスペースのみ削除
            let path = cache_dir.join(format!("{}.json", ws));
            if path.exists() {
                std::fs::remove_file(path)?;
                deleted = 1;
            }
        } else {
            // 全ワークスペース削除
            for entry in std::fs::read_dir(&cache_dir)? {
                let entry = entry?;
                let path = entry.path();
                if path.extension().and_then(|s| s.to_str()) == Some("json") {
                    std::fs::remove_file(path)?;
                    deleted += 1;
                }
            }
        }

        Ok(deleted)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_cache() {
        let cache = IndexCache::new("test-workspace".to_string());
        assert_eq!(cache.workspace, "test-workspace");
        assert_eq!(cache.indexed_count(), 0);
    }

    #[test]
    fn test_mark_indexed() {
        let mut cache = IndexCache::new("test".to_string());
        let path = PathBuf::from("test.md");
        let hash = "abc123".to_string();

        cache.mark_indexed(path.clone(), hash.clone());

        assert_eq!(cache.indexed_count(), 1);
        assert!(cache.is_indexed(&path, &hash));
    }

    #[test]
    fn test_is_indexed_false_for_unknown_file() {
        let cache = IndexCache::new("test".to_string());
        let path = PathBuf::from("unknown.md");
        assert!(!cache.is_indexed(&path, "any_hash"));
    }

    #[test]
    fn test_is_indexed_false_for_different_hash() {
        let mut cache = IndexCache::new("test".to_string());
        let path = PathBuf::from("test.md");
        cache.mark_indexed(path.clone(), "hash1".to_string());

        assert!(!cache.is_indexed(&path, "hash2"));
    }

    #[test]
    fn test_clear() {
        let mut cache = IndexCache::new("test".to_string());
        cache.mark_indexed(PathBuf::from("file1.md"), "hash1".to_string());
        cache.mark_indexed(PathBuf::from("file2.md"), "hash2".to_string());

        assert_eq!(cache.indexed_count(), 2);

        cache.clear();

        assert_eq!(cache.indexed_count(), 0);
    }

    #[test]
    fn test_serialization() {
        let mut cache = IndexCache::new("test".to_string());
        cache.mark_indexed(PathBuf::from("test.md"), "abc123".to_string());

        let json = serde_json::to_string(&cache).unwrap();
        let deserialized: IndexCache = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.workspace, cache.workspace);
        assert_eq!(deserialized.indexed_count(), cache.indexed_count());
    }
}
