/// 自然言語処理サービス (Claude API統合)
///
/// Phase 6.3: ユーザーメッセージからタスク要件を抽出

use serde::{Deserialize, Serialize};

/// タスク解析結果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskAnalysis {
    /// タスクタイトル
    pub title: String,
    /// タスク詳細説明
    pub description: String,
    /// カテゴリ（bug, feature, improvement等）
    pub category: TaskCategory,
    /// 優先度 (1-5)
    pub priority: u8,
    /// 推定作業時間（時間）
    pub estimated_hours: Option<f32>,
}

/// タスクカテゴリ
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TaskCategory {
    /// バグ修正
    Bug,
    /// 新機能
    Feature,
    /// 改善
    Improvement,
    /// ドキュメント
    Documentation,
    /// リファクタリング
    Refactoring,
    /// その他
    Other,
}

impl TaskCategory {
    /// 一般ユーザー向けのカテゴリ名を取得
    pub fn display_name(&self) -> &str {
        match self {
            TaskCategory::Bug => "バグ修正",
            TaskCategory::Feature => "新機能",
            TaskCategory::Improvement => "改善",
            TaskCategory::Documentation => "ドキュメント",
            TaskCategory::Refactoring => "コード整理",
            TaskCategory::Other => "その他",
        }
    }
}

/// 自然言語処理サービス
#[derive(Clone)]
pub struct NlpService {
    api_key: String,
    http_client: reqwest::Client,
}

impl NlpService {
    /// 新しいNLPサービスを作成
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            http_client: reqwest::Client::new(),
        }
    }

    /// ユーザーメッセージからタスクを解析
    ///
    /// ## 引数
    /// - `user_message`: ユーザーが送信したメッセージ
    ///
    /// ## 戻り値
    /// - `Ok(TaskAnalysis)`: 解析成功
    /// - `Err(...)`: API呼び出し失敗
    pub async fn analyze_task(&self, user_message: &str) -> anyhow::Result<TaskAnalysis> {
        // Phase 6.3: Claude API統合予定
        // 現在はモックレスポンスを返す

        tracing::info!("Analyzing user message: {}", user_message);

        // TODO: Claude API呼び出し実装
        // let response = self.call_claude_api(user_message).await?;

        // モックレスポンス（開発用）
        let analysis = TaskAnalysis {
            title: format!("ユーザー依頼: {}", user_message.chars().take(50).collect::<String>()),
            description: format!(
                "## ユーザーからの依頼\n\n{}\n\n## 対応方針\n\nAIが自動で処理を進めます。",
                user_message
            ),
            category: self.infer_category(user_message),
            priority: 3,
            estimated_hours: Some(2.0),
        };

        Ok(analysis)
    }

    /// メッセージからカテゴリを推測（シンプルなキーワードマッチング）
    fn infer_category(&self, message: &str) -> TaskCategory {
        let message_lower = message.to_lowercase();

        if message_lower.contains("バグ") || message_lower.contains("エラー") || message_lower.contains("直し") {
            TaskCategory::Bug
        } else if message_lower.contains("追加") || message_lower.contains("新し") || message_lower.contains("機能") {
            TaskCategory::Feature
        } else if message_lower.contains("改善") || message_lower.contains("よくし") || message_lower.contains("最適化") {
            TaskCategory::Improvement
        } else if message_lower.contains("ドキュメント") || message_lower.contains("説明") || message_lower.contains("readme") {
            TaskCategory::Documentation
        } else if message_lower.contains("リファクタ") || message_lower.contains("整理") {
            TaskCategory::Refactoring
        } else {
            TaskCategory::Feature
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_analyze_task() {
        let service = NlpService::new("test_key".to_string());
        let result = service.analyze_task("ログイン機能を追加してほしい").await;

        assert!(result.is_ok());
        let analysis = result.unwrap();
        assert!(matches!(analysis.category, TaskCategory::Feature));
    }

    #[test]
    fn test_infer_category_bug() {
        let service = NlpService::new("test_key".to_string());
        let category = service.infer_category("バグを直してほしい");
        assert!(matches!(category, TaskCategory::Bug));
    }

    #[test]
    fn test_infer_category_feature() {
        let service = NlpService::new("test_key".to_string());
        let category = service.infer_category("新しい機能を追加");
        assert!(matches!(category, TaskCategory::Feature));
    }
}
