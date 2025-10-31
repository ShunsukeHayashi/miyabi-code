use portable_pty::Child;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

/// Monitor for tracking shell process lifecycle
#[derive(Clone)]
pub struct ProcessMonitor {
    start_time: Instant,
    exit_code: Arc<Mutex<Option<u32>>>,
}

impl ProcessMonitor {
    pub fn new(mut child: Box<dyn Child + Send>) -> Self {
        let exit_code = Arc::new(Mutex::new(None));
        let exit_code_clone = exit_code.clone();

        // Monitor process in background thread
        std::thread::spawn(move || {
            match child.wait() {
                Ok(status) => {
                    let code = status.exit_code();
                    *exit_code_clone.lock().unwrap() = Some(code);
                    tracing::info!("Process exited with code: {}", code);
                }
                Err(e) => {
                    tracing::error!("Process monitor error: {}", e);
                    *exit_code_clone.lock().unwrap() = Some(u32::MAX);
                }
            }
        });

        Self {
            start_time: Instant::now(),
            exit_code,
        }
    }

    /// Check if process is still running
    pub fn is_alive(&self) -> bool {
        self.exit_code.lock().unwrap().is_none()
    }

    /// Get process exit code (None if still running)
    pub fn exit_code(&self) -> Option<u32> {
        *self.exit_code.lock().unwrap()
    }

    /// Get process uptime
    pub fn uptime(&self) -> Duration {
        self.start_time.elapsed()
    }

    /// Get uptime in seconds
    pub fn uptime_seconds(&self) -> u64 {
        self.uptime().as_secs()
    }

    /// Wait for process to exit (with timeout)
    pub async fn wait_for_exit(&self, timeout: Duration) -> Option<u32> {
        let start = Instant::now();

        loop {
            if let Some(code) = self.exit_code() {
                return Some(code);
            }

            if start.elapsed() > timeout {
                return None;
            }

            tokio::time::sleep(Duration::from_millis(100)).await;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Note: These tests require mock Child implementation
    // In real usage, Child comes from portable-pty

    #[test]
    fn test_process_monitor_creation() {
        // This test would need a mock Child
        // Skipping for now as it requires portable-pty integration
    }
}
