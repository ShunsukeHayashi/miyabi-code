//! SSH configuration and machine management

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// SSH configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SshConfig {
    /// SSH username
    pub user: String,
    /// Path to SSH private key
    pub key_path: PathBuf,
    /// Path to known_hosts file
    pub known_hosts: PathBuf,
    /// Connection timeout in seconds
    pub timeout_secs: u64,
}

impl Default for SshConfig {
    fn default() -> Self {
        Self {
            user: std::env::var("USER").unwrap_or_else(|_| "a003".to_string()),
            key_path: PathBuf::from("~/.ssh/id_ed25519"),
            known_hosts: PathBuf::from("~/.ssh/known_hosts"),
            timeout_secs: 30,
        }
    }
}

/// Machine status
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum MachineStatus {
    /// Machine is available
    Available,
    /// Machine is busy (at capacity)
    Busy,
    /// Machine is offline or unreachable
    Offline,
    /// Machine is in maintenance mode
    Maintenance,
}

/// Remote machine configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Machine {
    /// Machine hostname
    pub hostname: String,
    /// Machine IP address
    pub ip: String,
    /// Maximum parallel sessions
    pub capacity: usize,
    /// Current running sessions
    pub running_sessions: usize,
    /// Machine status
    pub status: MachineStatus,
}

impl Machine {
    /// Create a new machine configuration
    pub fn new(hostname: String, ip: String, capacity: usize) -> Self {
        Self {
            hostname,
            ip,
            capacity,
            running_sessions: 0,
            status: MachineStatus::Available,
        }
    }

    /// Check if machine has available capacity
    pub fn has_capacity(&self) -> bool {
        self.status == MachineStatus::Available && self.running_sessions < self.capacity
    }

    /// Get available capacity (remaining slots)
    pub fn available_capacity(&self) -> usize {
        if self.status != MachineStatus::Available {
            return 0;
        }
        self.capacity.saturating_sub(self.running_sessions)
    }

    /// Increment running sessions
    pub fn increment_sessions(&mut self) {
        self.running_sessions += 1;
        if self.running_sessions >= self.capacity {
            self.status = MachineStatus::Busy;
        }
    }

    /// Decrement running sessions
    pub fn decrement_sessions(&mut self) {
        self.running_sessions = self.running_sessions.saturating_sub(1);
        if self.running_sessions < self.capacity && self.status == MachineStatus::Busy {
            self.status = MachineStatus::Available;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_machine_creation() {
        let machine = Machine::new(
            "macmini1".to_string(),
            "192.168.3.27".to_string(),
            3,
        );

        assert_eq!(machine.hostname, "macmini1");
        assert_eq!(machine.ip, "192.168.3.27");
        assert_eq!(machine.capacity, 3);
        assert_eq!(machine.running_sessions, 0);
        assert_eq!(machine.status, MachineStatus::Available);
        assert!(machine.has_capacity());
        assert_eq!(machine.available_capacity(), 3);
    }

    #[test]
    fn test_machine_capacity_tracking() {
        let mut machine = Machine::new(
            "macmini1".to_string(),
            "192.168.3.27".to_string(),
            3,
        );

        // Increment sessions
        machine.increment_sessions();
        assert_eq!(machine.running_sessions, 1);
        assert_eq!(machine.available_capacity(), 2);
        assert!(machine.has_capacity());

        machine.increment_sessions();
        assert_eq!(machine.running_sessions, 2);
        assert_eq!(machine.available_capacity(), 1);
        assert!(machine.has_capacity());

        machine.increment_sessions();
        assert_eq!(machine.running_sessions, 3);
        assert_eq!(machine.available_capacity(), 0);
        assert!(!machine.has_capacity());
        assert_eq!(machine.status, MachineStatus::Busy);

        // Decrement sessions
        machine.decrement_sessions();
        assert_eq!(machine.running_sessions, 2);
        assert_eq!(machine.available_capacity(), 1);
        assert!(machine.has_capacity());
        assert_eq!(machine.status, MachineStatus::Available);
    }

    #[test]
    fn test_ssh_config_default() {
        let config = SshConfig::default();
        assert!(!config.user.is_empty());
        assert_eq!(config.key_path, PathBuf::from("~/.ssh/id_ed25519"));
        assert_eq!(config.timeout_secs, 30);
    }
}
