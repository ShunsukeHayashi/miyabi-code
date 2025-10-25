//! GPT-4 Natural Language Processing

use anyhow::{Context, Result};
use async_openai::{
    config::OpenAIConfig,
    types::{
        ChatCompletionRequestMessage, ChatCompletionRequestSystemMessageArgs,
        ChatCompletionRequestUserMessageArgs, CreateChatCompletionRequestArgs,
    },
    Client,
};
use serde::{Deserialize, Serialize};

/// Issue creation request from natural language
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IssueRequest {
    pub title: String,
    pub body: String,
    pub agent: String,
    pub priority: String,
    pub labels: Vec<String>,
}

/// GPT-4 NLP Processor
pub struct NlpProcessor {
    client: Client<OpenAIConfig>,
}

impl NlpProcessor {
    /// Create a new NLP processor
    pub fn new() -> Self {
        Self {
            client: Client::new(),
        }
    }

    /// Process natural language and generate Issue request
    pub async fn process_message(&self, message: &str) -> Result<IssueRequest> {
        let system_prompt = r#"
あなたは Miyabi 開発システムのタスク分析AIアシスタントです。
ユーザーからの自然言語メッセージを解析し、GitHub Issue作成に必要な情報を構造化して返してください。

## 出力形式
JSON形式で以下のフィールドを含めてください:
- title: Issue タイトル (50文字以内、簡潔に)
- body: Issue 詳細説明 (Markdown形式、実装手順を含む)
- agent: 最適なAgent名 (CoordinatorAgent, CodeGenAgent, ReviewAgent, PRAgent, DeploymentAgent, IssueAgent, RefresherAgent)
- priority: 優先度 (P0-Critical, P1-High, P2-Medium, P3-Low)
- labels: ラベルリスト (type:feature, type:bug, type:refactor等)

## Agent選択基準
- CodeGenAgent: コード実装、機能追加
- ReviewAgent: コードレビュー、品質チェック
- PRAgent: Pull Request作成
- DeploymentAgent: デプロイ、CI/CD
- CoordinatorAgent: 複雑なタスク統括
- IssueAgent: Issue管理
- RefresherAgent: Issue状態更新

## Priority基準
- P0-Critical: システム停止、セキュリティ問題
- P1-High: 重要な機能追加、バグ修正
- P2-Medium: 機能改善、リファクタリング
- P3-Low: ドキュメント、マイナー改善
"#;

        let request = CreateChatCompletionRequestArgs::default()
            .model("gpt-4o-mini")
            .messages(vec![
                ChatCompletionRequestMessage::System(
                    ChatCompletionRequestSystemMessageArgs::default()
                        .content(system_prompt)
                        .build()?,
                ),
                ChatCompletionRequestMessage::User(
                    ChatCompletionRequestUserMessageArgs::default()
                        .content(message)
                        .build()?,
                ),
            ])
            .temperature(0.3)
            .max_tokens(1000u32)
            .build()?;

        let response = self
            .client
            .chat()
            .create(request)
            .await
            .context("Failed to call OpenAI API")?;

        let content = response
            .choices
            .first()
            .and_then(|choice| choice.message.content.as_ref())
            .context("No response from GPT-4")?;

        // Parse JSON response
        let issue_request: IssueRequest =
            serde_json::from_str(content).context("Failed to parse GPT-4 response")?;

        Ok(issue_request)
    }

    /// Generate welcome message
    pub fn generate_welcome_message() -> String {
        r#"🎉 Miyabi Bot へようこそ！

私はあなたの開発をサポートする自律型AIアシスタントです。

**できること:**
✅ 自然言語からIssue自動作成
✅ Agent自動実行（コード生成、レビュー、デプロイ）
✅ 進捗通知（リアルタイム）
✅ PR自動作成

**使い方:**
メッセージを送信するだけ！

例:
- 「ログイン機能にGoogle OAuth追加して」
- 「ユーザープロフィール編集画面を作成」
- 「APIのレスポンス速度を改善して」

リッチメニューから各種機能にアクセスできます。
"#
        .to_string()
    }

    /// Generate progress update message
    pub fn generate_progress_message(issue_number: u32, progress: u8, agent_name: &str) -> String {
        format!(
            r#"⚙️ Issue #{} 進捗更新

Agent: {}
進捗: {}%
ステータス: {}

詳細: https://github.com/customer-cloud/miyabi-private/issues/{}
"#,
            issue_number,
            agent_name,
            progress,
            if progress < 50 {
                "実行中..."
            } else if progress < 100 {
                "レビュー中..."
            } else {
                "完了✅"
            },
            issue_number
        )
    }

    /// Generate completion message
    pub fn generate_completion_message(
        issue_number: u32,
        pr_number: u32,
        quality_score: u8,
    ) -> String {
        format!(
            r#"✅ Issue #{} 完了！

品質スコア: {}/100
PR: #{} 作成完了

次のアクション:
→ PR をレビュー
→ マージして本番デプロイ

PR URL: https://github.com/customer-cloud/miyabi-private/pull/{}
"#,
            issue_number, quality_score, pr_number, pr_number
        )
    }
}

impl Default for NlpProcessor {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_nlp_processor_creation() {
        let processor = NlpProcessor::new();
        assert!(std::mem::size_of_val(&processor) > 0);
    }

    #[test]
    fn test_generate_welcome_message() {
        let msg = NlpProcessor::generate_welcome_message();
        assert!(msg.contains("Miyabi Bot"));
    }

    #[test]
    fn test_generate_progress_message() {
        let msg = NlpProcessor::generate_progress_message(100, 50, "CodeGenAgent");
        assert!(msg.contains("Issue #100"));
        assert!(msg.contains("50%"));
    }

    #[test]
    fn test_generate_completion_message() {
        let msg = NlpProcessor::generate_completion_message(100, 50, 95);
        assert!(msg.contains("Issue #100"));
        assert!(msg.contains("PR: #50"));
        assert!(msg.contains("95/100"));
    }
}
