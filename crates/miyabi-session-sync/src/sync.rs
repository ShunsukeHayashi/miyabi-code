//! Sync Service
//!
//! リモートホストとのセッション同期サービス

use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use tokio::sync::broadcast;
use tracing::{info, warn, error};

/// Sync result
#[derive(Debug, Serialize, Deserialize)]
pub struct SyncResult {
    pub success: bool,
    pub sessions_synced: usize,
    pub bytes_transferred: u64,
    pub message: String,
}

/// Remote host configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemoteHost {
    pub name: String,
    pub host: String,
    pub user: String,
    pub port: u16,
    pub key_path: Option<PathBuf>,
}

/// Sync Service
#[derive(Clone)]
pub struct SyncService {
    remotes: Vec<RemoteHost>,
    auto_sync: bool,
    sync_interval: u64,
}

impl SyncService {
    /// Create new sync service
    pub fn new(remote_names: Vec<String>, auto_sync: bool, sync_interval: u64) -> Result<Self> {
        // Parse remote names into configurations
        let remotes = remote_names
            .into_iter()
            .map(|name| Self::parse_remote(&name))
            .collect::<Result<Vec<_>>>()?;

        Ok(Self {
            remotes,
            auto_sync,
            sync_interval,
        })
    }

    /// Parse remote name into configuration
    fn parse_remote(name: &str) -> Result<RemoteHost> {
        // Default configurations for known hosts
        let (host, user, port, key_path) = match name.to_lowercase().as_str() {
            "mugen" | "macbook" => (
                "192.168.1.10".to_string(),
                "shunsuke".to_string(),
                22,
                None,
            ),
            "majin" | "ec2" => (
                "ec2-xxx.compute.amazonaws.com".to_string(),
                "ubuntu".to_string(),
                22,
                Some(PathBuf::from("~/.ssh/majin.pem")),
            ),
            "pixel" | "android" => (
                "192.168.3.9".to_string(),
                "u0_a123".to_string(),
                8022,
                None,
            ),
            _ => {
                // Try to parse as host:port format
                if let Some((h, p)) = name.split_once(':') {
                    (
                        h.to_string(),
                        "user".to_string(),
                        p.parse().unwrap_or(22),
                        None,
                    )
                } else {
                    (name.to_string(), "user".to_string(), 22, None)
                }
            }
        };

        Ok(RemoteHost {
            name: name.to_string(),
            host,
            user,
            port,
            key_path,
        })
    }

    /// Check if auto-sync is enabled
    pub fn auto_sync_enabled(&self) -> bool {
        self.auto_sync
    }

    /// Sync sessions from remote host
    pub async fn sync_from_remote(
        &self,
        remote_name: &str,
        session_id: Option<&str>,
    ) -> Result<SyncResult> {
        let remote = self
            .remotes
            .iter()
            .find(|r| r.name == remote_name)
            .ok_or_else(|| anyhow::anyhow!("Remote not found: {}", remote_name))?;

        info!("Syncing from remote: {} ({})", remote.name, remote.host);

        // Build SSH command
        let remote_projects_dir = "~/.claude/projects";
        let local_projects_dir = dirs::home_dir()
            .unwrap()
            .join(".claude")
            .join("projects");

        // Create rsync command
        let mut cmd = tokio::process::Command::new("rsync");
        cmd.arg("-avz")
            .arg("--progress");

        // Add SSH options
        let ssh_opts = format!(
            "ssh -p {} -o StrictHostKeyChecking=no",
            remote.port
        );
        cmd.arg("-e").arg(&ssh_opts);

        // Add key if specified
        if let Some(key_path) = &remote.key_path {
            let expanded_key = shellexpand::tilde(&key_path.to_string_lossy()).to_string();
            cmd.arg("-e")
                .arg(format!("ssh -i {} -p {}", expanded_key, remote.port));
        }

        // Build source path
        let source = if let Some(sid) = session_id {
            format!(
                "{}@{}:{}/**/{}.jsonl",
                remote.user, remote.host, remote_projects_dir, sid
            )
        } else {
            format!(
                "{}@{}:{}/",
                remote.user, remote.host, remote_projects_dir
            )
        };

        cmd.arg(&source)
            .arg(&local_projects_dir);

        // Execute command
        let output = cmd.output().await?;

        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let lines: Vec<&str> = stdout.lines().collect();
            let sessions_synced = lines
                .iter()
                .filter(|l| l.ends_with(".jsonl"))
                .count();

            Ok(SyncResult {
                success: true,
                sessions_synced,
                bytes_transferred: 0, // TODO: parse from rsync output
                message: format!("Successfully synced {} sessions from {}", sessions_synced, remote_name),
            })
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(anyhow::anyhow!("Sync failed: {}", stderr))
        }
    }

    /// Push local session to remote host
    pub async fn push_to_remote(
        &self,
        remote_name: &str,
        session_id: &str,
    ) -> Result<SyncResult> {
        let remote = self
            .remotes
            .iter()
            .find(|r| r.name == remote_name)
            .ok_or_else(|| anyhow::anyhow!("Remote not found: {}", remote_name))?;

        info!("Pushing to remote: {} ({})", remote.name, remote.host);

        let local_projects_dir = dirs::home_dir()
            .unwrap()
            .join(".claude")
            .join("projects");

        // Find the session file
        let session_file = walkdir::WalkDir::new(&local_projects_dir)
            .into_iter()
            .filter_map(|e| e.ok())
            .find(|e| {
                e.path()
                    .file_stem()
                    .map_or(false, |s| s.to_string_lossy() == session_id)
            })
            .ok_or_else(|| anyhow::anyhow!("Session not found: {}", session_id))?;

        // Get project directory name
        let project_dir = session_file
            .path()
            .parent()
            .and_then(|p| p.file_name())
            .and_then(|n| n.to_str())
            .unwrap_or("unknown");

        // Build scp command
        let mut cmd = tokio::process::Command::new("scp");
        cmd.arg("-P").arg(remote.port.to_string());

        if let Some(key_path) = &remote.key_path {
            let expanded_key = shellexpand::tilde(&key_path.to_string_lossy()).to_string();
            cmd.arg("-i").arg(&expanded_key);
        }

        let remote_path = format!(
            "{}@{}:~/.claude/projects/{}/",
            remote.user, remote.host, project_dir
        );

        cmd.arg(session_file.path())
            .arg(&remote_path);

        // Execute command
        let output = cmd.output().await?;

        if output.status.success() {
            Ok(SyncResult {
                success: true,
                sessions_synced: 1,
                bytes_transferred: session_file.metadata()?.len(),
                message: format!("Successfully pushed session {} to {}", session_id, remote_name),
            })
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(anyhow::anyhow!("Push failed: {}", stderr))
        }
    }

    /// Handoff session to another device
    pub async fn handoff_session(
        &self,
        session_id: &str,
        target: &str,
        method: &str,
    ) -> Result<SyncResult> {
        match method {
            "ssh" | "scp" => self.push_to_remote(target, session_id).await,
            "adb" => self.handoff_via_adb(session_id, target).await,
            "sync" => {
                // Two-way sync
                self.sync_from_remote(target, None).await?;
                self.push_to_remote(target, session_id).await
            }
            _ => Err(anyhow::anyhow!("Unknown transfer method: {}", method)),
        }
    }

    /// Handoff session via ADB
    async fn handoff_via_adb(
        &self,
        session_id: &str,
        _target: &str,
    ) -> Result<SyncResult> {
        let local_projects_dir = dirs::home_dir()
            .unwrap()
            .join(".claude")
            .join("projects");

        // Find the session file
        let session_file = walkdir::WalkDir::new(&local_projects_dir)
            .into_iter()
            .filter_map(|e| e.ok())
            .find(|e| {
                e.path()
                    .file_stem()
                    .map_or(false, |s| s.to_string_lossy() == session_id)
            })
            .ok_or_else(|| anyhow::anyhow!("Session not found: {}", session_id))?;

        // Push to sdcard first (accessible location)
        let sdcard_path = "/sdcard/claude-session-handoff/";

        // Create directory
        let mut mkdir_cmd = tokio::process::Command::new("adb");
        mkdir_cmd.args(["shell", "mkdir", "-p", sdcard_path]);
        mkdir_cmd.output().await?;

        // Push file
        let mut push_cmd = tokio::process::Command::new("adb");
        push_cmd.args([
            "push",
            session_file.path().to_str().unwrap(),
            sdcard_path,
        ]);

        let output = push_cmd.output().await?;

        if output.status.success() {
            Ok(SyncResult {
                success: true,
                sessions_synced: 1,
                bytes_transferred: session_file.metadata()?.len(),
                message: format!(
                    "Session {} pushed to {}. Run in Termux:\n\
                     cp {}*.jsonl ~/.claude/projects/<project>/",
                    session_id, sdcard_path, sdcard_path
                ),
            })
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(anyhow::anyhow!("ADB push failed: {}", stderr))
        }
    }

    /// Run auto-sync loop
    pub async fn run_auto_sync(&self, event_tx: broadcast::Sender<String>) {
        if !self.auto_sync {
            return;
        }

        info!("Starting auto-sync with interval: {}s", self.sync_interval);

        let mut interval = tokio::time::interval(
            tokio::time::Duration::from_secs(self.sync_interval)
        );

        loop {
            interval.tick().await;

            for remote in &self.remotes {
                match self.sync_from_remote(&remote.name, None).await {
                    Ok(result) => {
                        info!("Auto-sync from {} completed: {} sessions", remote.name, result.sessions_synced);
                        let _ = event_tx.send(serde_json::json!({
                            "type": "auto_sync",
                            "remote": remote.name,
                            "sessions_synced": result.sessions_synced,
                            "status": "success"
                        }).to_string());
                    }
                    Err(e) => {
                        warn!("Auto-sync from {} failed: {}", remote.name, e);
                        let _ = event_tx.send(serde_json::json!({
                            "type": "auto_sync",
                            "remote": remote.name,
                            "status": "failed",
                            "error": e.to_string()
                        }).to_string());
                    }
                }
            }
        }
    }

    /// List configured remotes
    pub fn list_remotes(&self) -> &[RemoteHost] {
        &self.remotes
    }
}
