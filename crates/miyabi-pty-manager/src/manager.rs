use crate::errors::{PtyError, Result};
use crate::output_buffer::SessionOutputBuffer;
use crate::process_monitor::ProcessMonitor;
use crate::session::{SessionInfo, TerminalSession};
use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use std::collections::HashMap;
use std::io::{BufReader, Read, Write};
use std::sync::{Arc, Mutex};

/// Callback for receiving PTY output
pub type OutputCallback = Arc<dyn Fn(String) + Send + Sync>;

struct PtySession {
    id: String,
    writer: Box<dyn Write + Send>,
    metadata: TerminalSession,
    output_buffer: SessionOutputBuffer,
    process_monitor: Option<ProcessMonitor>,
    output_callbacks: Vec<OutputCallback>,
}

pub struct PtyManager {
    sessions: Arc<Mutex<HashMap<String, PtySession>>>,
}

impl PtyManager {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Spawn a shell session (user-managed)
    pub fn spawn_shell(&self, cols: u16, rows: u16) -> Result<TerminalSession> {
        self.spawn_shell_with_manager(cols, rows, None)
    }

    /// Spawn a shell session with a specific manager
    pub fn spawn_shell_with_manager(
        &self,
        cols: u16,
        rows: u16,
        managed_by: Option<String>,
    ) -> Result<TerminalSession> {
        let pty_system = native_pty_system();

        // Create PTY
        let pair = pty_system
            .openpty(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| PtyError::OpenPtyFailed(e.to_string()))?;

        // Spawn shell
        let shell = get_shell();
        let cwd = get_home_dir();
        let mut cmd = CommandBuilder::new(shell);
        cmd.cwd(&cwd);

        let child = pair
            .slave
            .spawn_command(cmd)
            .map_err(|e| PtyError::SpawnShellFailed(e.to_string()))?;

        // Get reader and writer
        let reader = pair
            .master
            .try_clone_reader()
            .map_err(|e| PtyError::CloneReaderFailed(e.to_string()))?;
        let writer = pair
            .master
            .take_writer()
            .map_err(|e| PtyError::GetWriterFailed(e.to_string()))?;

        // Create session metadata
        let metadata = TerminalSession::new(cols, rows, cwd, shell.to_string(), managed_by);

        // Create output buffer and process monitor
        let output_buffer = SessionOutputBuffer::new(1000); // Keep last 1000 lines
        let process_monitor = ProcessMonitor::new(child);

        // Store session
        let session = PtySession {
            id: metadata.id.clone(),
            writer,
            metadata: metadata.clone(),
            output_buffer: output_buffer.clone(),
            process_monitor: Some(process_monitor.clone()),
            output_callbacks: Vec::new(),
        };

        self.sessions
            .lock()
            .unwrap()
            .insert(metadata.id.clone(), session);

        // Start reading output in background
        let session_id = metadata.id.clone();
        let sessions = self.sessions.clone();

        std::thread::spawn(move || {
            let mut reader = BufReader::new(reader);
            let mut buffer = vec![0u8; 8192]; // 8KB buffer for better UTF-8 handling

            loop {
                match reader.read(&mut buffer) {
                    Ok(0) => break, // EOF
                    Ok(n) => {
                        let data = String::from_utf8_lossy(&buffer[..n]).to_string();

                        // Store in buffer
                        output_buffer.push(data.clone());

                        // Notify callbacks
                        if let Ok(sessions_lock) = sessions.lock() {
                            if let Some(session) = sessions_lock.get(&session_id) {
                                for callback in &session.output_callbacks {
                                    callback(data.clone());
                                }
                            }
                        }
                    }
                    Err(_) => break,
                }
            }

            tracing::info!("PTY output reader terminated for session: {}", session_id);
        });

        Ok(metadata)
    }

    /// Write data to a PTY session
    pub fn write_to_pty(&self, session_id: &str, data: &str) -> Result<()> {
        let mut sessions = self.sessions.lock().unwrap();

        if let Some(session) = sessions.get_mut(session_id) {
            session
                .writer
                .write_all(data.as_bytes())
                .map_err(|e| PtyError::WriteFailed(e.to_string()))?;

            session
                .writer
                .flush()
                .map_err(|e| PtyError::FlushFailed(e.to_string()))?;

            Ok(())
        } else {
            Err(PtyError::SessionNotFound(session_id.to_string()))
        }
    }

    /// Execute a command in a session (adds newline automatically)
    pub fn execute_command(&self, session_id: &str, command: &str) -> Result<()> {
        let command_with_newline = format!("{}\n", command);
        self.write_to_pty(session_id, &command_with_newline)
    }

    /// Resize a PTY session
    pub fn resize_pty(&self, session_id: &str, cols: u16, rows: u16) -> Result<()> {
        // Note: portable-pty doesn't provide resize API
        // This would require platform-specific implementation
        tracing::warn!(
            "Resize requested for session {}: {}x{} (not implemented)",
            session_id,
            cols,
            rows
        );
        Ok(())
    }

    /// Kill a session
    pub fn kill_session(&self, session_id: &str) -> Result<()> {
        let mut sessions = self.sessions.lock().unwrap();

        if sessions.remove(session_id).is_some() {
            tracing::info!("Killed session: {}", session_id);
            Ok(())
        } else {
            Err(PtyError::SessionNotFound(session_id.to_string()))
        }
    }

    /// List all sessions
    pub fn list_sessions(&self) -> Vec<TerminalSession> {
        let sessions = self.sessions.lock().unwrap();
        sessions.values().map(|s| s.metadata.clone()).collect()
    }

    /// Get session info
    pub fn get_session_info(&self, session_id: &str) -> Result<SessionInfo> {
        let sessions = self.sessions.lock().unwrap();

        if let Some(session) = sessions.get(session_id) {
            let (is_alive, exit_code, uptime_seconds) =
                if let Some(ref monitor) = session.process_monitor {
                    (
                        monitor.is_alive(),
                        monitor.exit_code(),
                        monitor.uptime_seconds(),
                    )
                } else {
                    (false, Some(u32::MAX), 0)
                };

            Ok(SessionInfo {
                session: session.metadata.clone(),
                is_alive,
                exit_code,
                uptime_seconds,
            })
        } else {
            Err(PtyError::SessionNotFound(session_id.to_string()))
        }
    }

    /// Get recent output from a session
    pub fn get_output(&self, session_id: &str, lines: usize) -> Result<Vec<String>> {
        let sessions = self.sessions.lock().unwrap();

        if let Some(session) = sessions.get(session_id) {
            Ok(session.output_buffer.get_recent(lines))
        } else {
            Err(PtyError::SessionNotFound(session_id.to_string()))
        }
    }

    /// Search output for a pattern
    pub fn search_output(&self, session_id: &str, pattern: &str) -> Result<Vec<String>> {
        let sessions = self.sessions.lock().unwrap();

        if let Some(session) = sessions.get(session_id) {
            Ok(session.output_buffer.search(pattern))
        } else {
            Err(PtyError::SessionNotFound(session_id.to_string()))
        }
    }

    /// Register an output callback for a session
    pub fn add_output_callback(
        &self,
        session_id: &str,
        callback: OutputCallback,
    ) -> Result<()> {
        let mut sessions = self.sessions.lock().unwrap();

        if let Some(session) = sessions.get_mut(session_id) {
            session.output_callbacks.push(callback);
            Ok(())
        } else {
            Err(PtyError::SessionNotFound(session_id.to_string()))
        }
    }

    /// Wait for a pattern to appear in output
    pub async fn wait_for_pattern(
        &self,
        session_id: &str,
        pattern: &str,
        timeout: std::time::Duration,
    ) -> Result<Option<String>> {
        let output_buffer = {
            let sessions = self.sessions.lock().unwrap();
            if let Some(session) = sessions.get(session_id) {
                session.output_buffer.clone()
            } else {
                return Err(PtyError::SessionNotFound(session_id.to_string()));
            }
        };

        Ok(output_buffer.wait_for_pattern(pattern, timeout).await)
    }

    /// List sessions by manager
    pub fn list_sessions_by_manager(&self, manager_id: &str) -> Vec<TerminalSession> {
        let sessions = self.sessions.lock().unwrap();
        sessions
            .values()
            .filter(|s| {
                s.metadata
                    .managed_by
                    .as_ref()
                    .map(|m| m == manager_id)
                    .unwrap_or(false)
            })
            .map(|s| s.metadata.clone())
            .collect()
    }

    /// Kill all sessions by manager
    pub fn kill_sessions_by_manager(&self, manager_id: &str) -> Result<usize> {
        let mut sessions = self.sessions.lock().unwrap();
        let to_remove: Vec<String> = sessions
            .iter()
            .filter(|(_, s)| {
                s.metadata
                    .managed_by
                    .as_ref()
                    .map(|m| m == manager_id)
                    .unwrap_or(false)
            })
            .map(|(id, _)| id.clone())
            .collect();

        let count = to_remove.len();
        for id in to_remove {
            sessions.remove(&id);
        }

        tracing::info!("Killed {} sessions for manager: {}", count, manager_id);
        Ok(count)
    }

    /// Cleanup dead sessions
    pub fn cleanup_dead_sessions(&self) -> usize {
        let mut sessions = self.sessions.lock().unwrap();
        let dead_sessions: Vec<String> = sessions
            .iter()
            .filter(|(_, s)| {
                s.process_monitor
                    .as_ref()
                    .map(|m| !m.is_alive())
                    .unwrap_or(true)
            })
            .map(|(id, _)| id.clone())
            .collect();

        let count = dead_sessions.len();
        for id in dead_sessions {
            sessions.remove(&id);
        }

        if count > 0 {
            tracing::info!("Cleaned up {} dead sessions", count);
        }

        count
    }
}

impl Default for PtyManager {
    fn default() -> Self {
        Self::new()
    }
}

// ========== Platform-specific helpers ==========

#[cfg(target_os = "windows")]
fn get_shell() -> &'static str {
    "powershell.exe"
}

#[cfg(not(target_os = "windows"))]
fn get_shell() -> &'static str {
    std::env::var("SHELL")
        .ok()
        .and_then(|s| {
            if s.is_empty() {
                None
            } else {
                Some(Box::leak(s.into_boxed_str()) as &str)
            }
        })
        .unwrap_or("/bin/bash")
}

fn get_home_dir() -> String {
    std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .unwrap_or_else(|_| ".".to_string())
}
