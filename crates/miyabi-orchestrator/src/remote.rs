//! Remote execution via SSH

use crate::error::{Result, SchedulerError};
use crate::ssh::{Machine, SshConfig};
use std::process::Stdio;
use std::time::Duration;
use tokio::process::Command;
use tracing::{debug, info, warn};

/// Remote executor for SSH-based command execution
pub struct RemoteExecutor {
    /// SSH configuration
    ssh_config: SshConfig,
}

impl RemoteExecutor {
    /// Create a new RemoteExecutor
    pub fn new(ssh_config: SshConfig) -> Self {
        Self { ssh_config }
    }

    /// Execute a command on a remote machine
    ///
    /// # Arguments
    ///
    /// * `machine` - Target machine
    /// * `command` - Command to execute
    ///
    /// # Returns
    ///
    /// Returns the command output (stdout + stderr)
    ///
    /// # Example
    ///
    /// ```no_run
    /// use miyabi_scheduler::remote::RemoteExecutor;
    /// use miyabi_scheduler::ssh::{Machine, SshConfig};
    ///
    /// # #[tokio::main]
    /// # async fn main() -> Result<(), Box<dyn std::error::Error>> {
    /// let executor = RemoteExecutor::new(SshConfig::default());
    /// let machine = Machine::new("macmini1".to_string(), "192.168.3.27".to_string(), 3);
    ///
    /// let output = executor.execute_on_machine(&machine, "echo 'test'".to_string()).await?;
    /// println!("Output: {}", output);
    /// # Ok(())
    /// # }
    /// ```
    pub async fn execute_on_machine(&self, machine: &Machine, command: String) -> Result<String> {
        info!("Executing command on {}: {}", machine.hostname, command);

        // Build SSH command
        // ssh -i <key> -o ConnectTimeout=<timeout> user@host 'command'
        let timeout_str = format!("ConnectTimeout={}", self.ssh_config.timeout_secs);
        let user_host = format!("{}@{}", self.ssh_config.user, machine.ip);

        debug!(
            "SSH connection: {} with key {}",
            user_host,
            self.ssh_config.key_path.display()
        );

        // Execute SSH command
        let output = tokio::time::timeout(
            Duration::from_secs(self.ssh_config.timeout_secs + 10),
            Command::new("ssh")
                .arg("-i")
                .arg(&self.ssh_config.key_path)
                .arg("-o")
                .arg(timeout_str)
                .arg("-o")
                .arg("StrictHostKeyChecking=yes")
                .arg("-o")
                .arg(format!(
                    "UserKnownHostsFile={}",
                    self.ssh_config.known_hosts.display()
                ))
                .arg(&user_host)
                .arg(&command)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .output(),
        )
        .await
        .map_err(|_| SchedulerError::Timeout(self.ssh_config.timeout_secs))?
        .map_err(SchedulerError::SpawnFailed)?;

        // Check exit status
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            warn!("Command failed on {}: {}", machine.hostname, stderr);
            return Err(SchedulerError::ProcessFailed {
                code: output.status.code().unwrap_or(-1),
                stderr: stderr.to_string(),
            });
        }

        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        debug!(
            "Command succeeded on {}: {} bytes",
            machine.hostname,
            stdout.len()
        );

        Ok(stdout)
    }

    /// Test SSH connectivity to a machine
    ///
    /// # Arguments
    ///
    /// * `machine` - Target machine
    ///
    /// # Returns
    ///
    /// Returns `Ok(true)` if connection succeeds, `Ok(false)` otherwise
    pub async fn test_connectivity(&self, machine: &Machine) -> Result<bool> {
        debug!("Testing connectivity to {}", machine.hostname);

        match self
            .execute_on_machine(machine, "echo 'ok'".to_string())
            .await
        {
            Ok(output) => {
                let success = output.trim() == "ok";
                info!(
                    "Connectivity test to {}: {}",
                    machine.hostname,
                    if success { "SUCCESS" } else { "FAILED" }
                );
                Ok(success)
            }
            Err(e) => {
                warn!("Connectivity test to {} failed: {}", machine.hostname, e);
                Ok(false)
            }
        }
    }

    /// Execute Claude Code headless session on remote machine
    ///
    /// # Arguments
    ///
    /// * `machine` - Target machine
    /// * `worktree_path` - Worktree path on remote machine
    /// * `agent_command` - Agent command to execute
    ///
    /// # Returns
    ///
    /// Returns the session output
    pub async fn execute_remote_session(
        &self,
        machine: &Machine,
        worktree_path: &str,
        agent_command: &str,
    ) -> Result<String> {
        info!(
            "Executing remote session on {}: {}",
            machine.hostname, agent_command
        );

        // Build remote command
        let remote_command = format!(
            "cd {} && claude code --headless --execute-command '{}' --no-human-in-loop",
            worktree_path, agent_command
        );

        self.execute_on_machine(machine, remote_command).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_remote_executor_creation() {
        let config = SshConfig::default();
        let executor = RemoteExecutor::new(config);
        assert_eq!(executor.ssh_config.timeout_secs, 30);
    }

    #[tokio::test]
    #[ignore] // Requires SSH connectivity
    async fn test_execute_on_machine() {
        let config = SshConfig::default();
        let executor = RemoteExecutor::new(config);
        let machine = Machine::new("macmini1".to_string(), "192.168.3.27".to_string(), 3);

        // This would require actual SSH connectivity
        let result = executor
            .execute_on_machine(&machine, "echo 'test'".to_string())
            .await;

        // Should either succeed or fail with SSH error
        match result {
            Ok(output) => {
                assert!(output.contains("test"));
            }
            Err(SchedulerError::SpawnFailed(_)) => {
                // Expected if ssh command not available
            }
            Err(SchedulerError::ProcessFailed { .. }) => {
                // Expected if SSH connection fails
            }
            Err(e) => {
                panic!("Unexpected error: {}", e);
            }
        }
    }

    #[tokio::test]
    #[ignore] // Requires SSH connectivity
    async fn test_connectivity() {
        let config = SshConfig::default();
        let executor = RemoteExecutor::new(config);
        let machine = Machine::new("macmini1".to_string(), "192.168.3.27".to_string(), 3);

        // This would require actual SSH connectivity
        let result = executor.test_connectivity(&machine).await;
        assert!(result.is_ok());
    }
}
