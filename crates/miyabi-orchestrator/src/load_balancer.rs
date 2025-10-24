//! Load balancer for distributing tasks across machines

use crate::error::{Result, SchedulerError};
use crate::remote::RemoteExecutor;
use crate::ssh::{Machine, MachineStatus, SshConfig};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{debug, info, warn};

/// Load balancer for task distribution
pub struct LoadBalancer {
    /// Available machines
    machines: Arc<RwLock<Vec<Machine>>>,
    /// Remote executor
    executor: RemoteExecutor,
}

impl LoadBalancer {
    /// Create a new LoadBalancer
    ///
    /// # Arguments
    ///
    /// * `machines` - List of available machines
    /// * `ssh_config` - SSH configuration
    pub fn new(machines: Vec<Machine>, ssh_config: SshConfig) -> Self {
        info!("LoadBalancer initialized with {} machines", machines.len());
        Self {
            machines: Arc::new(RwLock::new(machines)),
            executor: RemoteExecutor::new(ssh_config),
        }
    }

    /// Get machine with most available capacity
    ///
    /// # Returns
    ///
    /// Returns the machine with the most available slots, or None if no capacity
    pub async fn get_best_machine(&self) -> Option<Machine> {
        let machines = self.machines.read().await;

        let mut best_machine: Option<&Machine> = None;
        let mut max_capacity = 0;

        for machine in machines.iter() {
            if machine.has_capacity() {
                let available = machine.available_capacity();
                if available > max_capacity {
                    max_capacity = available;
                    best_machine = Some(machine);
                }
            }
        }

        best_machine.cloned()
    }

    /// Assign a task to the best available machine
    ///
    /// This method finds the machine with most capacity and increments its session count
    ///
    /// # Returns
    ///
    /// Returns the assigned machine
    ///
    /// # Errors
    ///
    /// Returns error if no machines have capacity
    pub async fn assign_task(&self) -> Result<Machine> {
        let mut machines = self.machines.write().await;

        // Find machine using "fill first" strategy
        // Prefer machines with more running sessions to complete filling before moving to next
        // This implements bin-packing for efficient resource utilization
        let (best_idx, _) = machines
            .iter()
            .enumerate()
            .filter(|(_, m)| m.has_capacity())
            .max_by(|(_, a), (_, b)| {
                // Prefer machine with MORE running sessions (more utilized)
                match a.running_sessions.cmp(&b.running_sessions) {
                    std::cmp::Ordering::Equal => {
                        // If equal utilization, prefer machine with higher total capacity
                        a.capacity.cmp(&b.capacity)
                    }
                    other => other,
                }
            })
            .ok_or_else(|| {
                SchedulerError::InvalidConfig(
                    "No machines available for task assignment".to_string(),
                )
            })?;

        // Increment session count
        machines[best_idx].increment_sessions();
        let machine = machines[best_idx].clone();

        info!(
            "Assigned task to {} ({}/{})",
            machine.hostname, machine.running_sessions, machine.capacity
        );

        Ok(machine)
    }

    /// Release a task from a machine (decrement session count)
    ///
    /// # Arguments
    ///
    /// * `machine_hostname` - Hostname of the machine to release
    pub async fn release_task(&self, machine_hostname: &str) {
        let mut machines = self.machines.write().await;

        if let Some(machine) = machines.iter_mut().find(|m| m.hostname == machine_hostname) {
            machine.decrement_sessions();
            debug!(
                "Released task from {} ({}/{})",
                machine.hostname, machine.running_sessions, machine.capacity
            );
        } else {
            warn!("Machine {} not found for task release", machine_hostname);
        }
    }

    /// Get all available machines (with capacity)
    pub async fn get_available_machines(&self) -> Vec<Machine> {
        let machines = self.machines.read().await;
        machines
            .iter()
            .filter(|m| m.has_capacity())
            .cloned()
            .collect()
    }

    /// Get all machines (regardless of capacity)
    pub async fn get_all_machines(&self) -> Vec<Machine> {
        let machines = self.machines.read().await;
        machines.clone()
    }

    /// Test connectivity to all machines
    ///
    /// Updates machine status based on connectivity test results
    pub async fn test_all_connectivity(&self) -> Result<Vec<(String, bool)>> {
        let mut results = Vec::new();
        let mut machines = self.machines.write().await;

        for machine in machines.iter_mut() {
            let is_connected = self
                .executor
                .test_connectivity(machine)
                .await
                .unwrap_or(false);

            if is_connected {
                if machine.status == MachineStatus::Offline {
                    machine.status = MachineStatus::Available;
                }
            } else {
                machine.status = MachineStatus::Offline;
            }

            results.push((machine.hostname.clone(), is_connected));
        }

        Ok(results)
    }

    /// Get load balancer statistics
    pub async fn get_stats(&self) -> LoadBalancerStats {
        let machines = self.machines.read().await;

        let mut stats = LoadBalancerStats {
            total_machines: machines.len(),
            available_machines: 0,
            total_capacity: 0,
            used_capacity: 0,
            available_capacity: 0,
        };

        for machine in machines.iter() {
            stats.total_capacity += machine.capacity;
            stats.used_capacity += machine.running_sessions;

            if machine.has_capacity() {
                stats.available_machines += 1;
                stats.available_capacity += machine.available_capacity();
            }
        }

        stats
    }
}

/// Load balancer statistics
#[derive(Debug, Clone)]
pub struct LoadBalancerStats {
    /// Total number of machines
    pub total_machines: usize,
    /// Number of machines with available capacity
    pub available_machines: usize,
    /// Total capacity across all machines
    pub total_capacity: usize,
    /// Currently used capacity
    pub used_capacity: usize,
    /// Available capacity
    pub available_capacity: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_machines() -> Vec<Machine> {
        vec![
            Machine::new("macmini1".to_string(), "192.168.3.27".to_string(), 3),
            Machine::new("macmini2".to_string(), "192.168.3.26".to_string(), 2),
        ]
    }

    #[tokio::test]
    async fn test_load_balancer_creation() {
        let machines = create_test_machines();
        let lb = LoadBalancer::new(machines, SshConfig::default());

        let stats = lb.get_stats().await;
        assert_eq!(stats.total_machines, 2);
        assert_eq!(stats.total_capacity, 5);
        assert_eq!(stats.used_capacity, 0);
        assert_eq!(stats.available_capacity, 5);
    }

    #[tokio::test]
    async fn test_get_best_machine() {
        let machines = create_test_machines();
        let lb = LoadBalancer::new(machines, SshConfig::default());

        let best = lb.get_best_machine().await;
        assert!(best.is_some());

        let machine = best.unwrap();
        // Should pick macmini1 (capacity 3)
        assert_eq!(machine.hostname, "macmini1");
        assert_eq!(machine.capacity, 3);
    }

    #[tokio::test]
    async fn test_assign_and_release_task() {
        let machines = create_test_machines();
        let lb = LoadBalancer::new(machines, SshConfig::default());

        // Assign first task
        let machine1 = lb.assign_task().await.unwrap();
        assert_eq!(machine1.hostname, "macmini1");
        assert_eq!(machine1.running_sessions, 1);

        // Check stats
        let stats = lb.get_stats().await;
        assert_eq!(stats.used_capacity, 1);
        assert_eq!(stats.available_capacity, 4);

        // Release task
        lb.release_task(&machine1.hostname).await;

        // Check stats after release
        let stats = lb.get_stats().await;
        assert_eq!(stats.used_capacity, 0);
        assert_eq!(stats.available_capacity, 5);
    }

    #[tokio::test]
    async fn test_assign_multiple_tasks() {
        let machines = create_test_machines();
        let lb = LoadBalancer::new(machines, SshConfig::default());

        // Assign 3 tasks (all should go to macmini1)
        for _ in 0..3 {
            let machine = lb.assign_task().await.unwrap();
            assert_eq!(machine.hostname, "macmini1");
        }

        // macmini1 should now be at capacity, next task should go to macmini2
        let machine = lb.assign_task().await.unwrap();
        assert_eq!(machine.hostname, "macmini2");

        // Check stats
        let stats = lb.get_stats().await;
        assert_eq!(stats.used_capacity, 4);
        assert_eq!(stats.available_capacity, 1);
    }

    #[tokio::test]
    async fn test_no_capacity_error() {
        let machines = create_test_machines();
        let lb = LoadBalancer::new(machines, SshConfig::default());

        // Assign all 5 tasks
        for _ in 0..5 {
            let _ = lb.assign_task().await.unwrap();
        }

        // Should fail when no capacity
        let result = lb.assign_task().await;
        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            SchedulerError::InvalidConfig(_)
        ));
    }

    #[tokio::test]
    async fn test_get_available_machines() {
        let machines = create_test_machines();
        let lb = LoadBalancer::new(machines, SshConfig::default());

        // Initially both machines available
        let available = lb.get_available_machines().await;
        assert_eq!(available.len(), 2);

        // Fill macmini1 (3 tasks)
        for _ in 0..3 {
            let _ = lb.assign_task().await.unwrap();
        }

        // Only macmini2 should be available now
        let available = lb.get_available_machines().await;
        assert_eq!(available.len(), 1);
        assert_eq!(available[0].hostname, "macmini2");
    }
}
