/// 自然言語処理サービス (Claude API統合)
///
/// Phase 6.3: ユーザーメッセージからタスク要件を抽出

use crate::integrations::claude::{ClaudeClient, ParsedIssue};
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
    claude_client: ClaudeClient,
}

impl NlpService {
    /// 新しいNLPサービスを作成
    pub fn new(api_key: String) -> Self {
        Self {
            claude_client: ClaudeClient::new(api_key),
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
        tracing::info!("Analyzing user message with Claude API: {}", user_message);

        // Claude APIでメッセージを解析
        let parsed = self.claude_client.analyze_message(user_message).await
            .map_err(|e| anyhow::anyhow!("Claude API error: {}", e))?;

        // ParsedIssue を TaskAnalysis に変換
        let analysis = self.convert_parsed_issue(parsed, user_message);

        tracing::info!(
            "Task analysis completed: category={:?}, priority={}",
            analysis.category,
            analysis.priority
        );

        Ok(analysis)
    }

    /// ParsedIssueをTaskAnalysisに変換
    fn convert_parsed_issue(&self, parsed: ParsedIssue, original_message: &str) -> TaskAnalysis {
        // CategoryをTaskCategoryに変換
        let category = if let Some(issue_type) = &parsed.issue_type {
            match issue_type.to_lowercase().as_str() {
                "bug" => TaskCategory::Bug,
                "feature" => TaskCategory::Feature,
                "docs" | "documentation" => TaskCategory::Documentation,
                "refactor" | "refactoring" => TaskCategory::Refactoring,
                _ => TaskCategory::Feature,
            }
        } else {
            self.infer_category(original_message)
        };

        // 優先度を数値に変換
        let priority = if let Some(p) = &parsed.priority {
            match p.as_str() {
                "P0-Critical" => 0,
                "P1-High" => 1,
                "P2-Medium" => 2,
                "P3-Low" => 3,
                _ => 2,
            }
        } else {
            2 // デフォルトはMedium
        };

        TaskAnalysis {
            title: parsed.title,
            description: parsed.description,
            category,
            priority,
            estimated_hours: Some(2.0), // デフォルト見積もり
        }
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
    #[ignore] // Requires valid ANTHROPIC_API_KEY
    async fn test_analyze_task() {
        // This test requires a valid Claude API key
        // Run with: cargo test test_analyze_task -- --ignored
        let api_key = std::env::var("ANTHROPIC_API_KEY").expect("ANTHROPIC_API_KEY must be set");
        let service = NlpService::new(api_key);
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
