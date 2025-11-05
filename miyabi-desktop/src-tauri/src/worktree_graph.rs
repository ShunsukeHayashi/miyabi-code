//! Worktree Graph Generation
//!
//! Generates graph data structure showing relationships between branches and worktrees
//! for visualization in miyabi-desktop's React frontend using react-flow.

use chrono::{DateTime, Utc};
use git2::{BranchType, Repository, WorktreeLockStatus};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

/// Complete graph structure with nodes, edges, and metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorktreeGraph {
    pub nodes: Vec<GraphNode>,
    pub edges: Vec<GraphEdge>,
    pub metadata: GraphMetadata,
}

/// Graph metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphMetadata {
    pub generated_at: String,
    pub repo_root: String,
    pub branch_count: usize,
    pub worktree_count: usize,
}

/// Graph node (either branch or worktree)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "kind")]
pub enum GraphNode {
    #[serde(rename = "branch")]
    Branch {
        id: String,
        label: String,
        branch: BranchNode,
    },
    #[serde(rename = "worktree")]
    Worktree {
        id: String,
        label: String,
        worktree: WorktreeNode,
    },
}

/// Branch information node
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BranchNode {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub head: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub upstream: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub latest_commit_time: Option<String>,
}

/// Worktree information node
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorktreeNode {
    pub path: String,
    pub branch: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub head: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_commit: Option<String>,
    pub status: WorktreeStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub locked_reason: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub issue_number: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agent: Option<AgentInfo>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_commit_time: Option<String>,
}

/// Worktree status
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum WorktreeStatus {
    Active,
    Locked,
    Stale,
}

/// Agent information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentInfo {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agent_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub agent_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub execution_mode: Option<String>,
}

/// Graph edge (relationship between nodes)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphEdge {
    pub id: String,
    pub from: String,
    pub to: String,
    pub kind: EdgeKind,
}

/// Edge type
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EdgeKind {
    BranchHierarchy,
    BranchWorktree,
}

/// Build complete worktree graph
pub async fn build_worktree_graph() -> Result<WorktreeGraph, String> {
    // Find repository root
    let repo = Repository::discover(".")
        .map_err(|e| format!("Failed to open repository: {}", e))?;

    let repo_path = repo.path()
        .parent()
        .ok_or("Failed to get repository root")?;

    let mut nodes = Vec::new();
    let mut edges = Vec::new();
    let mut branch_names = HashSet::new();

    // Collect all branches
    let branches = repo
        .branches(Some(BranchType::Local))
        .map_err(|e| format!("Failed to list branches: {}", e))?;

    let mut branch_upstream_map: HashMap<String, String> = HashMap::new();

    for branch_result in branches {
        let (branch, _branch_type) = branch_result
            .map_err(|e| format!("Failed to read branch: {}", e))?;

        let branch_name = branch
            .name()
            .map_err(|e| format!("Failed to get branch name: {}", e))?
            .ok_or("Branch name is not valid UTF-8")?
            .to_string();

        branch_names.insert(branch_name.clone());

        let head_commit = branch
            .get()
            .peel_to_commit()
            .ok()
            .map(|c| c.id().to_string());

        let upstream_name = branch.upstream().ok().and_then(|upstream| {
            upstream
                .name()
                .ok()
                .flatten()
                .map(|name| name.to_string())
        });

        if let Some(ref upstream) = upstream_name {
            // Extract short name (e.g., "origin/main" -> "main")
            if let Some(short_upstream) = upstream.split('/').last() {
                branch_upstream_map.insert(branch_name.clone(), short_upstream.to_string());
            }
        }

        let latest_commit_time = branch
            .get()
            .peel_to_commit()
            .ok()
            .and_then(|commit| {
                let timestamp = commit.time().seconds();
                DateTime::from_timestamp(timestamp, 0)
                    .map(|dt: DateTime<Utc>| dt.to_rfc3339())
            });

        let branch_node = GraphNode::Branch {
            id: format!("branch:{}", branch_name),
            label: branch_name.clone(),
            branch: BranchNode {
                name: branch_name.clone(),
                head: head_commit,
                upstream: upstream_name,
                latest_commit_time,
            },
        };

        nodes.push(branch_node);
    }

    // Collect all worktrees
    let worktrees = repo
        .worktrees()
        .map_err(|e| format!("Failed to list worktrees: {}", e))?;

    let mut worktree_count = 0;

    // Collect worktree data first (synchronously) before any async operations
    struct WorktreeData {
        name: String,
        path: String,
        branch_name: String,
        head_commit: Option<String>,
        last_commit_time: Option<String>,
        status: WorktreeStatus,
        locked_reason: Option<String>,
        issue_number: Option<u64>,
        worktree_path: std::path::PathBuf,
    }

    let worktree_names: Vec<String> = worktrees
        .iter()
        .flatten()
        .map(|s| s.to_string())
        .collect();

    let mut worktree_data_list: Vec<WorktreeData> = Vec::new();

    for worktree_name in worktree_names.iter() {
        let worktree = repo
            .find_worktree(worktree_name)
            .map_err(|e| format!("Failed to open worktree {}: {}", worktree_name, e))?;

        // Skip main worktree (repository root)
        if worktree.path() == repo_path {
            continue;
        }

        worktree_count += 1;

        let worktree_path_str = worktree.path().to_string_lossy().to_string();
        let worktree_path_buf = worktree.path().to_path_buf();

        // Try to open worktree as repository to get branch info
        let worktree_repo = Repository::open(worktree.path())
            .map_err(|e| format!("Failed to open worktree repo: {}", e))?;

        let head = worktree_repo.head().ok();
        let branch_name = head
            .as_ref()
            .and_then(|h| h.shorthand())
            .unwrap_or("(detached)")
            .to_string();

        let head_commit = head
            .as_ref()
            .and_then(|h| h.peel_to_commit().ok())
            .map(|c| c.id().to_string());

        let last_commit_time = head
            .as_ref()
            .and_then(|h| h.peel_to_commit().ok())
            .and_then(|commit| {
                let timestamp = commit.time().seconds();
                DateTime::from_timestamp(timestamp, 0)
                    .map(|dt: DateTime<Utc>| dt.to_rfc3339())
            });

        // Determine status
        let lock_status = worktree.is_locked().ok();
        let (is_locked, locked_reason) = match lock_status {
            Some(WorktreeLockStatus::Locked(reason)) => {
                (true, reason.map(|s| s.to_string()))
            }
            _ => (false, None),
        };

        let status = if is_locked {
            WorktreeStatus::Locked
        } else {
            // Simple heuristic: stale if no commits in last 7 days
            let is_stale = last_commit_time.as_ref().map_or(true, |time_str| {
                if let Ok(commit_time) = DateTime::parse_from_rfc3339(time_str) {
                    let now = Utc::now();
                    let duration = now.signed_duration_since(commit_time);
                    duration.num_days() > 7
                } else {
                    true
                }
            });

            if is_stale {
                WorktreeStatus::Stale
            } else {
                WorktreeStatus::Active
            }
        };

        // Try to extract issue number from branch name (e.g., "issue-123-feature" -> 123)
        let issue_number = extract_issue_number(&branch_name);

        worktree_data_list.push(WorktreeData {
            name: worktree_name.clone(),
            path: worktree_path_str,
            branch_name: branch_name.clone(),
            head_commit,
            last_commit_time,
            status,
            locked_reason,
            issue_number,
            worktree_path: worktree_path_buf,
        });
    }

    // Now build worktree nodes
    for worktree_data in worktree_data_list.iter() {
        // Try to extract agent info from .agent-context.json
        let agent = read_agent_context(&worktree_data.worktree_path);

        let worktree_node = GraphNode::Worktree {
            id: format!("worktree:{}", worktree_data.name),
            label: worktree_data.name.to_string(),
            worktree: WorktreeNode {
                path: worktree_data.path.clone(),
                branch: worktree_data.branch_name.clone(),
                head: worktree_data.head_commit.clone(),
                base_commit: None, // TODO: Calculate merge base
                status: worktree_data.status.clone(),
                locked_reason: worktree_data.locked_reason.clone(),
                issue_number: worktree_data.issue_number,
                agent,
                last_commit_time: worktree_data.last_commit_time.clone(),
            },
        };

        nodes.push(worktree_node.clone());

        // Create edge: branch -> worktree
        if branch_names.contains(&worktree_data.branch_name) {
            edges.push(GraphEdge {
                id: format!("edge:branch:{}->worktree:{}", worktree_data.branch_name, worktree_data.name),
                from: format!("branch:{}", worktree_data.branch_name),
                to: format!("worktree:{}", worktree_data.name),
                kind: EdgeKind::BranchWorktree,
            });
        }
    }

    // Create branch hierarchy edges based on upstream relationships
    for (branch, upstream) in branch_upstream_map.iter() {
        if branch_names.contains(upstream) {
            edges.push(GraphEdge {
                id: format!("edge:branch:{}->branch:{}", upstream, branch),
                from: format!("branch:{}", upstream),
                to: format!("branch:{}", branch),
                kind: EdgeKind::BranchHierarchy,
            });
        }
    }

    let metadata = GraphMetadata {
        generated_at: Utc::now().to_rfc3339(),
        repo_root: repo_path.to_string_lossy().to_string(),
        branch_count: branch_names.len(),
        worktree_count,
    };

    Ok(WorktreeGraph {
        nodes,
        edges,
        metadata,
    })
}

/// Extract issue number from branch name
fn extract_issue_number(branch_name: &str) -> Option<u64> {
    // Common patterns: "issue-123", "issue/123", "#123", "123-feature"
    let patterns = [
        r"issue[-/](\d+)",
        r"#(\d+)",
        r"^(\d+)[-/]",
    ];

    for pattern in patterns {
        if let Ok(re) = regex::Regex::new(pattern) {
            if let Some(captures) = re.captures(branch_name) {
                if let Some(num_str) = captures.get(1) {
                    if let Ok(num) = num_str.as_str().parse::<u64>() {
                        return Some(num);
                    }
                }
            }
        }
    }

    None
}

/// Read agent context from worktree (synchronous version)
fn read_agent_context(worktree_path: &std::path::Path) -> Option<AgentInfo> {
    let context_path = worktree_path.join(".agent-context.json");

    if !context_path.exists() {
        return None;
    }

    let content = std::fs::read_to_string(context_path).ok()?;
    let json: serde_json::Value = serde_json::from_str(&content).ok()?;

    Some(AgentInfo {
        agent_type: json.get("agent_type")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        agent_name: json.get("agent_name")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        execution_mode: json.get("execution_mode")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
    })
}
