use axum::{routing::get, Json, Router};
use serde::Serialize;
use std::process::Command;

#[derive(Serialize)]
pub struct Worktree {
    pub id: String,
    pub path: String,
    pub branch: String,
    pub status: String,
    pub issue_number: Option<u32>,
    pub agent_type: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize)]
pub struct WorktreesListResponse {
    pub worktrees: Vec<Worktree>,
    pub total: usize,
}

pub async fn list_worktrees() -> Json<WorktreesListResponse> {
    // Get real worktrees from git worktree list
    let worktrees = match get_git_worktrees() {
        Ok(wts) => wts,
        Err(e) => {
            tracing::error!("Failed to get worktrees: {}", e);
            vec![]
        }
    };

    Json(WorktreesListResponse {
        total: worktrees.len(),
        worktrees,
    })
}

/// Get worktrees using git worktree list command
fn get_git_worktrees() -> Result<Vec<Worktree>, String> {
    // Run git worktree list --porcelain for machine-readable output
    let output = Command::new("git")
        .args(["worktree", "list", "--porcelain"])
        .current_dir("/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private")
        .output()
        .map_err(|e| format!("Failed to execute git worktree list: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("git worktree list failed: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut worktrees = Vec::new();
    let mut current_worktree: Option<WorktreeBuilder> = None;

    for line in stdout.lines() {
        if line.starts_with("worktree ") {
            // Save previous worktree if exists
            if let Some(builder) = current_worktree.take() {
                if let Some(wt) = builder.build() {
                    worktrees.push(wt);
                }
            }
            // Start new worktree
            let path = line.strip_prefix("worktree ").unwrap_or("").to_string();
            current_worktree = Some(WorktreeBuilder::new(path));
        } else if line.starts_with("HEAD ") {
            if let Some(ref mut builder) = current_worktree {
                builder.head = Some(line.strip_prefix("HEAD ").unwrap_or("").to_string());
            }
        } else if line.starts_with("branch ") {
            if let Some(ref mut builder) = current_worktree {
                let branch = line
                    .strip_prefix("branch refs/heads/")
                    .unwrap_or(line.strip_prefix("branch ").unwrap_or(""))
                    .to_string();
                builder.branch = Some(branch);
            }
        } else if line == "bare" {
            if let Some(ref mut builder) = current_worktree {
                builder.is_bare = true;
            }
        } else if line == "detached" {
            if let Some(ref mut builder) = current_worktree {
                builder.is_detached = true;
            }
        }
    }

    // Don't forget the last worktree
    if let Some(builder) = current_worktree {
        if let Some(wt) = builder.build() {
            worktrees.push(wt);
        }
    }

    Ok(worktrees)
}

struct WorktreeBuilder {
    path: String,
    head: Option<String>,
    branch: Option<String>,
    is_bare: bool,
    is_detached: bool,
}

impl WorktreeBuilder {
    fn new(path: String) -> Self {
        Self {
            path,
            head: None,
            branch: None,
            is_bare: false,
            is_detached: false,
        }
    }

    fn build(self) -> Option<Worktree> {
        // Skip bare repositories
        if self.is_bare {
            return None;
        }

        // Generate ID from path
        let id = self
            .path
            .rsplit('/')
            .next()
            .unwrap_or("unknown")
            .to_string();

        // Determine branch name
        let branch = if self.is_detached {
            self.head.clone().unwrap_or_else(|| "detached".to_string())
        } else {
            self.branch.clone().unwrap_or_else(|| "unknown".to_string())
        };

        // Try to extract issue number from branch name
        let issue_number = extract_issue_number(&branch);

        // Determine status based on path
        let status = if self.path.contains(".worktrees") {
            "Active"
        } else {
            "Main"
        }
        .to_string();

        // Get file modification time for timestamps
        let (created_at, updated_at) = get_worktree_timestamps(&self.path);

        Some(Worktree {
            id,
            path: self.path,
            branch,
            status,
            issue_number,
            agent_type: None, // Would need to read from metadata file
            created_at,
            updated_at,
        })
    }
}

/// Extract issue number from branch name (e.g., "feat/issue-123-description" -> 123)
fn extract_issue_number(branch: &str) -> Option<u32> {
    // Try "issue-" pattern
    if let Some(pos) = branch.find("issue-") {
        let after = &branch[pos + 6..];
        if let Some(num) = extract_leading_number(after) {
            return Some(num);
        }
    }

    // Try "#" pattern
    if let Some(pos) = branch.find('#') {
        let after = &branch[pos + 1..];
        if let Some(num) = extract_leading_number(after) {
            return Some(num);
        }
    }

    // Try "/" followed by number pattern (e.g., "/123-")
    for (i, c) in branch.char_indices() {
        if c == '/' && i + 1 < branch.len() {
            let after = &branch[i + 1..];
            if let Some(num) = extract_leading_number(after) {
                return Some(num);
            }
        }
    }

    None
}

/// Extract leading number from string
fn extract_leading_number(s: &str) -> Option<u32> {
    let num_str: String = s.chars().take_while(|c| c.is_ascii_digit()).collect();
    if !num_str.is_empty() {
        num_str.parse().ok()
    } else {
        None
    }
}

/// Get worktree timestamps from filesystem
fn get_worktree_timestamps(path: &str) -> (String, String) {
    let now = chrono::Utc::now().to_rfc3339();

    if let Ok(metadata) = std::fs::metadata(path) {
        let created = metadata
            .created()
            .map(|t| chrono::DateTime::<chrono::Utc>::from(t).to_rfc3339())
            .unwrap_or_else(|_| now.clone());
        let modified = metadata
            .modified()
            .map(|t| chrono::DateTime::<chrono::Utc>::from(t).to_rfc3339())
            .unwrap_or_else(|_| now.clone());
        (created, modified)
    } else {
        (now.clone(), now)
    }
}

pub fn routes() -> Router {
    Router::new().route("/", get(list_worktrees))
}
