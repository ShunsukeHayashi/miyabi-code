/// GitHub API統合サービス
///
/// Phase 6.3: Issue自動作成機能

use serde::{Deserialize, Serialize};

/// GitHub Issue作成結果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatedIssue {
    /// Issue番号
    pub number: u64,
    /// IssueタイトL
    pub title: String,
    /// Issue URL
    pub html_url: String,
}

/// GitHub Issue作成リクエスト
#[derive(Debug, Serialize)]
struct CreateIssueRequest {
    title: String,
    body: String,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    labels: Vec<String>,
}

/// GitHub Issue作成レスポンス
#[derive(Debug, Deserialize)]
struct CreateIssueResponse {
    number: u64,
    title: String,
    html_url: String,
}

/// GitHubサービス
#[derive(Clone)]
pub struct GitHubService {
    access_token: String,
    http_client: reqwest::Client,
    owner: String,
    repo: String,
}

impl GitHubService {
    /// 新しいGitHubサービスを作成
    ///
    /// ## 引数
    /// - `access_token`: GitHub Personal Access Token
    /// - `owner`: リポジトリオーナー（例: "ShunsukeHayashi"）
    /// - `repo`: リポジトリ名（例: "Miyabi"）
    pub fn new(access_token: String, owner: String, repo: String) -> Self {
        Self {
            access_token,
            http_client: reqwest::Client::new(),
            owner,
            repo,
        }
    }

    /// GitHub Issueを作成
    ///
    /// ## 引数
    /// - `title`: Issueタイトル
    /// - `body`: Issue本文（Markdown）
    /// - `labels`: ラベル一覧
    ///
    /// ## 戻り値
    /// - `Ok(CreatedIssue)`: Issue作成成功
    /// - `Err(...)`: API呼び出し失敗
    pub async fn create_issue(
        &self,
        title: &str,
        body: &str,
        labels: Vec<String>,
    ) -> anyhow::Result<CreatedIssue> {
        let url = format!(
            "https://api.github.com/repos/{}/{}/issues",
            self.owner, self.repo
        );

        let request_body = CreateIssueRequest {
            title: title.to_string(),
            body: body.to_string(),
            labels,
        };

        tracing::info!(
            "Creating GitHub Issue: {} (owner={}, repo={})",
            title,
            self.owner,
            self.repo
        );

        let response = self
            .http_client
            .post(&url)
            .header("Accept", "application/vnd.github+json")
            .header("Authorization", format!("Bearer {}", self.access_token))
            .header("X-GitHub-Api-Version", "2022-11-28")
            .header("User-Agent", "Miyabi-LINE-Bot/1.0")
            .json(&request_body)
            .send()
            .await?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            anyhow::bail!(
                "GitHub API error: {} - {}",
                status,
                error_text
            );
        }

        let issue_response: CreateIssueResponse = response.json().await?;

        tracing::info!(
            "GitHub Issue created successfully: #{} - {}",
            issue_response.number,
            issue_response.html_url
        );

        Ok(CreatedIssue {
            number: issue_response.number,
            title: issue_response.title,
            html_url: issue_response.html_url,
        })
    }

    /// ラベルをカテゴリから推定
    pub fn infer_labels(category: &str) -> Vec<String> {
        match category {
            "バグ修正" => vec!["bug".to_string()],
            "新機能" => vec!["enhancement".to_string(), "feature".to_string()],
            "改善" => vec!["enhancement".to_string()],
            "ドキュメント" => vec!["documentation".to_string()],
            "コード整理" => vec!["refactoring".to_string()],
            _ => vec![],
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_infer_labels_bug() {
        let labels = GitHubService::infer_labels("バグ修正");
        assert_eq!(labels, vec!["bug"]);
    }

    #[test]
    fn test_infer_labels_feature() {
        let labels = GitHubService::infer_labels("新機能");
        assert_eq!(labels, vec!["enhancement", "feature"]);
    }

    #[test]
    fn test_infer_labels_unknown() {
        let labels = GitHubService::infer_labels("その他");
        assert!(labels.is_empty());
    }
}
