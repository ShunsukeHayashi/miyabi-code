//! Session storage - JSON persistence

use crate::error::{Result, SessionError};
use crate::session::ManagedSession;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tokio::fs;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use uuid::Uuid;

/// セッション永続化ストレージ
#[derive(Debug, Clone)]
pub struct SessionStorage {
    /// セッションファイルのパス
    file_path: PathBuf,
}

impl SessionStorage {
    /// 新しいストレージを作成
    pub async fn new<P: AsRef<Path>>(file_path: P) -> Result<Self> {
        let file_path = file_path.as_ref().to_path_buf();

        // ファイルが存在しない場合は空のデータベースを作成
        if !file_path.exists() {
            let empty_db = SessionDatabase {
                sessions: vec![],
                version: 1,
            };
            let json = serde_json::to_string_pretty(&empty_db)?;
            fs::write(&file_path, json).await?;
        }

        Ok(Self { file_path })
    }

    /// セッションを保存
    pub async fn save(&self, session: &ManagedSession) -> Result<()> {
        let mut db = self.load_database().await?;

        // 既存のセッションを更新 or 新規追加
        if let Some(existing) = db.sessions.iter_mut().find(|s| s.id == session.id) {
            *existing = session.clone();
        } else {
            db.sessions.push(session.clone());
        }

        self.save_database(&db).await?;
        Ok(())
    }

    /// セッションを削除
    pub async fn delete(&self, session_id: Uuid) -> Result<()> {
        let mut db = self.load_database().await?;
        db.sessions.retain(|s| s.id != session_id);
        self.save_database(&db).await?;
        Ok(())
    }

    /// 全セッションを取得
    pub async fn list(&self) -> Result<Vec<ManagedSession>> {
        let db = self.load_database().await?;
        Ok(db.sessions)
    }

    /// データベース全体をロード
    async fn load_database(&self) -> Result<SessionDatabase> {
        let mut file = fs::File::open(&self.file_path).await?;
        let mut contents = String::new();
        file.read_to_string(&mut contents).await?;

        serde_json::from_str(&contents).map_err(|e| {
            SessionError::StorageError(format!("Failed to parse sessions.json: {}", e))
        })
    }

    /// データベース全体を保存
    async fn save_database(&self, db: &SessionDatabase) -> Result<()> {
        let json = serde_json::to_string_pretty(db)?;
        let mut file = fs::File::create(&self.file_path).await?;
        file.write_all(json.as_bytes()).await?;
        file.flush().await?;
        Ok(())
    }
}

/// セッションデータベース構造
#[derive(Debug, Clone, Serialize, Deserialize)]
struct SessionDatabase {
    sessions: Vec<ManagedSession>,
    version: u32,
}

// serde_json::Error → SessionError の変換
impl From<serde_json::Error> for SessionError {
    fn from(err: serde_json::Error) -> Self {
        SessionError::StorageError(err.to_string())
    }
}
