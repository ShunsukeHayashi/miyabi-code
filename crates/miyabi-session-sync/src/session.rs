//! Session Manager
//!
//! Claude Code セッションの管理

use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use walkdir::WalkDir;
use chrono::{DateTime, Utc};

/// Session info
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SessionInfo {
    pub id: String,
    pub project: String,
    pub path: PathBuf,
    pub size_bytes: u64,
    pub modified: DateTime<Utc>,
    pub message_count: usize,
}

/// Session Manager
#[derive(Clone)]
pub struct SessionManager {
    projects_dir: PathBuf,
}

impl SessionManager {
    /// Create new session manager
    pub fn new(projects_dir: PathBuf) -> Result<Self> {
        if !projects_dir.exists() {
            std::fs::create_dir_all(&projects_dir)?;
        }
        Ok(Self { projects_dir })
    }

    /// List sessions
    pub fn list_sessions(
        &self,
        project_filter: Option<&str>,
        limit: usize,
    ) -> Result<Vec<SessionInfo>> {
        let mut sessions = Vec::new();

        for entry in WalkDir::new(&self.projects_dir)
            .min_depth(2)
            .max_depth(2)
        {
            let entry = entry?;
            let path = entry.path();

            if path.extension().map_or(false, |e| e == "jsonl") {
                // Get project name
                let project = path
                    .parent()
                    .and_then(|p| p.file_name())
                    .and_then(|n| n.to_str())
                    .unwrap_or("unknown")
                    .to_string();

                // Apply project filter
                if let Some(filter) = project_filter {
                    if !project.to_lowercase().contains(&filter.to_lowercase()) {
                        continue;
                    }
                }

                // Get session ID
                let id = path
                    .file_stem()
                    .and_then(|n| n.to_str())
                    .unwrap_or("unknown")
                    .to_string();

                // Get metadata
                let metadata = std::fs::metadata(path)?;
                let modified = metadata.modified()?;
                let size_bytes = metadata.len();

                // Count messages (lines in JSONL)
                let message_count = std::fs::read_to_string(path)
                    .map(|content| content.lines().count())
                    .unwrap_or(0);

                sessions.push(SessionInfo {
                    id,
                    project,
                    path: path.to_path_buf(),
                    size_bytes,
                    modified: DateTime::from(modified),
                    message_count,
                });
            }
        }

        // Sort by modified time (newest first)
        sessions.sort_by(|a, b| b.modified.cmp(&a.modified));

        // Apply limit
        sessions.truncate(limit);

        Ok(sessions)
    }

    /// Get session by ID
    pub fn get_session(&self, session_id: &str) -> Result<SessionInfo> {
        let sessions = self.list_sessions(None, usize::MAX)?;

        sessions
            .into_iter()
            .find(|s| s.id == session_id)
            .ok_or_else(|| anyhow::anyhow!("Session not found: {}", session_id))
    }

    /// Search sessions
    pub fn search_sessions(
        &self,
        query: &str,
        project_filter: Option<&str>,
    ) -> Result<Vec<SessionInfo>> {
        let sessions = self.list_sessions(project_filter, usize::MAX)?;
        let query_lower = query.to_lowercase();

        let mut results = Vec::new();

        for session in sessions {
            // Search in file content
            let content = std::fs::read_to_string(&session.path)?;
            if content.to_lowercase().contains(&query_lower) {
                results.push(session);
            }
        }

        Ok(results)
    }

    /// Get session file path
    pub fn get_session_path(&self, session_id: &str) -> Result<PathBuf> {
        let session = self.get_session(session_id)?;
        Ok(session.path)
    }

    /// Get projects directory
    pub fn projects_dir(&self) -> &Path {
        &self.projects_dir
    }
}
