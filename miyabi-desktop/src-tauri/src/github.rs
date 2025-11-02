// GitHub integration module for Miyabi Desktop
//
// Provides Tauri commands for GitHub Issue management

use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter};

/// Issue state
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum IssueState {
    Open,
    Closed,
    All,
}

/// Issue label
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IssueLabel {
    pub name: String,
    pub color: String,
    pub description: Option<String>,
}

/// GitHub Issue
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubIssue {
    pub number: u64,
    pub title: String,
    pub body: Option<String>,
    pub state: String,
    pub labels: Vec<IssueLabel>,
    pub assignees: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
    pub html_url: String,
}

/// Load an environment value, falling back to parsing the nearest `.env` file.
pub(crate) fn load_env_value(key: &str) -> Result<String, String> {
    if let Ok(value) = env::var(key) {
        let trimmed = value.trim();
        if !trimmed.is_empty() {
            return Ok(trimmed.to_string());
        }
    }

    if let Some(dotenv_path) = find_project_dotenv()? {
        let content = fs::read_to_string(&dotenv_path)
            .map_err(|e| format!("Failed to read {}: {}", dotenv_path.display(), e))?;

        for line in content.lines() {
            let mut trimmed = line.trim();

            if trimmed.is_empty() || trimmed.starts_with('#') {
                continue;
            }

            if let Some(stripped) = trimmed.strip_prefix("export ") {
                trimmed = stripped.trim();
            }

            if let Some((env_key, env_value)) = trimmed.split_once('=') {
                if env_key.trim() == key {
                    let mut value = env_value.trim().to_string();
                    if let (Some(first), Some(last)) = (value.chars().next(), value.chars().last())
                    {
                        if (first == '\"' && last == '\"') || (first == '\'' && last == '\'') {
                            value = value[1..value.len() - 1].to_string();
                        }
                    }

                    if !value.is_empty() {
                        env::set_var(key, &value);
                        return Ok(value);
                    }
                }
            }
        }
    }

    Err(format!("{} not set", key))
}

/// Locate the `.env` file by walking up from the current directory.
pub(crate) fn find_project_dotenv() -> Result<Option<PathBuf>, String> {
    let mut dir =
        env::current_dir().map_err(|e| format!("Failed to determine current directory: {}", e))?;

    loop {
        let candidate = dir.join(".env");
        if candidate.exists() {
            return Ok(Some(candidate));
        }

        match dir.parent() {
            Some(parent) => dir = parent.to_path_buf(),
            None => return Ok(None),
        }
    }
}

/// Issue creation request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateIssueRequest {
    pub title: String,
    pub body: Option<String>,
    pub labels: Vec<String>,
    pub assignees: Vec<String>,
}

/// Issue update request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateIssueRequest {
    pub number: u64,
    pub title: Option<String>,
    pub body: Option<String>,
    pub state: Option<String>,
    pub labels: Option<Vec<String>>,
}

/// List Issues from GitHub
pub async fn list_issues(
    state: Option<IssueState>,
    labels: Vec<String>,
    _app_handle: AppHandle,
) -> Result<Vec<GitHubIssue>, String> {
    let token = load_env_value("GITHUB_TOKEN")?;
    let repo = load_env_value("GITHUB_REPOSITORY")
        .unwrap_or_else(|_| "ShunsukeHayashi/Miyabi".to_string());

    let parts: Vec<&str> = repo.split('/').collect();
    if parts.len() != 2 {
        return Err("Invalid GITHUB_REPOSITORY format".to_string());
    }
    let (owner, repo_name) = (parts[0], parts[1]);

    // Build GitHub API URL
    let mut url = format!(
        "https://api.github.com/repos/{}/{}/issues",
        owner, repo_name
    );

    // Add query parameters
    let mut params = vec![];
    if let Some(s) = state {
        let state_str = match s {
            IssueState::Open => "open",
            IssueState::Closed => "closed",
            IssueState::All => "all",
        };
        params.push(format!("state={}", state_str));
    }

    if !labels.is_empty() {
        params.push(format!("labels={}", labels.join(",")));
    }

    params.push("per_page=100".to_string());

    if !params.is_empty() {
        url.push_str(&format!("?{}", params.join("&")));
    }

    // Make API request
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("User-Agent", "Miyabi-Desktop")
        .header("Accept", "application/vnd.github+json")
        .send()
        .await
        .map_err(|e| format!("Failed to fetch issues: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("GitHub API error: {}", response.status()));
    }

    let issues: Vec<serde_json::Value> = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    // Convert to GitHubIssue structs
    let result: Vec<GitHubIssue> = issues
        .into_iter()
        .filter_map(|issue| {
            Some(GitHubIssue {
                number: issue.get("number")?.as_u64()?,
                title: issue.get("title")?.as_str()?.to_string(),
                body: issue
                    .get("body")
                    .and_then(|b| b.as_str())
                    .map(|s| s.to_string()),
                state: issue.get("state")?.as_str()?.to_string(),
                labels: issue
                    .get("labels")?
                    .as_array()?
                    .iter()
                    .filter_map(|label| {
                        Some(IssueLabel {
                            name: label.get("name")?.as_str()?.to_string(),
                            color: label.get("color")?.as_str()?.to_string(),
                            description: label
                                .get("description")
                                .and_then(|d| d.as_str())
                                .map(|s| s.to_string()),
                        })
                    })
                    .collect(),
                assignees: issue
                    .get("assignees")?
                    .as_array()?
                    .iter()
                    .filter_map(|a| a.get("login")?.as_str().map(|s| s.to_string()))
                    .collect(),
                created_at: issue.get("created_at")?.as_str()?.to_string(),
                updated_at: issue.get("updated_at")?.as_str()?.to_string(),
                html_url: issue.get("html_url")?.as_str()?.to_string(),
            })
        })
        .collect();

    Ok(result)
}

/// Get a single issue
pub async fn get_issue(number: u64) -> Result<GitHubIssue, String> {
    let token = load_env_value("GITHUB_TOKEN")?;
    let repo = load_env_value("GITHUB_REPOSITORY")
        .unwrap_or_else(|_| "ShunsukeHayashi/Miyabi".to_string());

    let parts: Vec<&str> = repo.split('/').collect();
    if parts.len() != 2 {
        return Err("Invalid GITHUB_REPOSITORY format".to_string());
    }
    let (owner, repo_name) = (parts[0], parts[1]);

    let url = format!(
        "https://api.github.com/repos/{}/{}/issues/{}",
        owner, repo_name, number
    );

    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("User-Agent", "Miyabi-Desktop")
        .header("Accept", "application/vnd.github+json")
        .send()
        .await
        .map_err(|e| format!("Failed to fetch issue: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("GitHub API error: {}", response.status()));
    }

    let issue: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    Ok(GitHubIssue {
        number: issue
            .get("number")
            .and_then(|n| n.as_u64())
            .ok_or("Missing number")?,
        title: issue
            .get("title")
            .and_then(|t| t.as_str())
            .ok_or("Missing title")?
            .to_string(),
        body: issue
            .get("body")
            .and_then(|b| b.as_str())
            .map(|s| s.to_string()),
        state: issue
            .get("state")
            .and_then(|s| s.as_str())
            .ok_or("Missing state")?
            .to_string(),
        labels: issue
            .get("labels")
            .and_then(|l| l.as_array())
            .unwrap_or(&vec![])
            .iter()
            .filter_map(|label| {
                Some(IssueLabel {
                    name: label.get("name")?.as_str()?.to_string(),
                    color: label.get("color")?.as_str()?.to_string(),
                    description: label
                        .get("description")
                        .and_then(|d| d.as_str())
                        .map(|s| s.to_string()),
                })
            })
            .collect(),
        assignees: issue
            .get("assignees")
            .and_then(|a| a.as_array())
            .unwrap_or(&vec![])
            .iter()
            .filter_map(|a| a.get("login")?.as_str().map(|s| s.to_string()))
            .collect(),
        created_at: issue
            .get("created_at")
            .and_then(|c| c.as_str())
            .ok_or("Missing created_at")?
            .to_string(),
        updated_at: issue
            .get("updated_at")
            .and_then(|u| u.as_str())
            .ok_or("Missing updated_at")?
            .to_string(),
        html_url: issue
            .get("html_url")
            .and_then(|u| u.as_str())
            .ok_or("Missing html_url")?
            .to_string(),
    })
}

/// Update an issue
pub async fn update_issue(
    request: UpdateIssueRequest,
    app_handle: AppHandle,
) -> Result<GitHubIssue, String> {
    let token = load_env_value("GITHUB_TOKEN")?;
    let repo = load_env_value("GITHUB_REPOSITORY")
        .unwrap_or_else(|_| "ShunsukeHayashi/Miyabi".to_string());

    let parts: Vec<&str> = repo.split('/').collect();
    if parts.len() != 2 {
        return Err("Invalid GITHUB_REPOSITORY format".to_string());
    }
    let (owner, repo_name) = (parts[0], parts[1]);

    let url = format!(
        "https://api.github.com/repos/{}/{}/issues/{}",
        owner, repo_name, request.number
    );

    // Build request body
    let mut body = serde_json::Map::new();
    if let Some(title) = &request.title {
        body.insert(
            "title".to_string(),
            serde_json::Value::String(title.clone()),
        );
    }
    if let Some(body_text) = &request.body {
        body.insert(
            "body".to_string(),
            serde_json::Value::String(body_text.clone()),
        );
    }
    if let Some(state) = &request.state {
        body.insert(
            "state".to_string(),
            serde_json::Value::String(state.clone()),
        );
    }
    if let Some(labels) = &request.labels {
        body.insert(
            "labels".to_string(),
            serde_json::Value::Array(
                labels
                    .iter()
                    .map(|l| serde_json::Value::String(l.clone()))
                    .collect(),
            ),
        );
    }

    let client = reqwest::Client::new();
    let response = client
        .patch(&url)
        .header("Authorization", format!("Bearer {}", token))
        .header("User-Agent", "Miyabi-Desktop")
        .header("Accept", "application/vnd.github+json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Failed to update issue: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("GitHub API error: {}", response.status()));
    }

    let issue: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let result = GitHubIssue {
        number: issue
            .get("number")
            .and_then(|n| n.as_u64())
            .ok_or("Missing number")?,
        title: issue
            .get("title")
            .and_then(|t| t.as_str())
            .ok_or("Missing title")?
            .to_string(),
        body: issue
            .get("body")
            .and_then(|b| b.as_str())
            .map(|s| s.to_string()),
        state: issue
            .get("state")
            .and_then(|s| s.as_str())
            .ok_or("Missing state")?
            .to_string(),
        labels: issue
            .get("labels")
            .and_then(|l| l.as_array())
            .unwrap_or(&vec![])
            .iter()
            .filter_map(|label| {
                Some(IssueLabel {
                    name: label.get("name")?.as_str()?.to_string(),
                    color: label.get("color")?.as_str()?.to_string(),
                    description: label
                        .get("description")
                        .and_then(|d| d.as_str())
                        .map(|s| s.to_string()),
                })
            })
            .collect(),
        assignees: issue
            .get("assignees")
            .and_then(|a| a.as_array())
            .unwrap_or(&vec![])
            .iter()
            .filter_map(|a| a.get("login")?.as_str().map(|s| s.to_string()))
            .collect(),
        created_at: issue
            .get("created_at")
            .and_then(|c| c.as_str())
            .ok_or("Missing created_at")?
            .to_string(),
        updated_at: issue
            .get("updated_at")
            .and_then(|u| u.as_str())
            .ok_or("Missing updated_at")?
            .to_string(),
        html_url: issue
            .get("html_url")
            .and_then(|u| u.as_str())
            .ok_or("Missing html_url")?
            .to_string(),
    };

    let _ = app_handle.emit("issue-updated", &result);

    Ok(result)
}
