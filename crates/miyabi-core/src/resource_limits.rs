//! Resource limits management for Miyabi system
//!
//! This module provides hardware resource detection and limit calculation
//! for managing concurrent worktrees and parallel execution.

use miyabi_types::error::MiyabiError;
use serde::{Deserialize, Serialize};
use std::fmt;
use tracing::{debug, info, warn};

/// Hardware limits detected from the system
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct HardwareLimits {
    /// Total system memory in GB
    pub total_memory_gb: usize,
    /// Total CPU cores
    pub total_cpu_cores: usize,
    /// Total disk space in GB
    pub total_disk_gb: usize,
}

impl fmt::Display for HardwareLimits {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "Memory: {}GB, CPU: {} cores, Disk: {}GB",
            self.total_memory_gb, self.total_cpu_cores, self.total_disk_gb
        )
    }
}

impl HardwareLimits {
    /// Detects hardware limits from the system
    ///
    /// # Returns
    /// - `Ok(HardwareLimits)` with detected system resources
    /// - `Err(MiyabiError)` if detection fails
    ///
    /// # Example
    ///
    /// ```no_run
    /// use miyabi_core::resource_limits::HardwareLimits;
    ///
    /// let limits = HardwareLimits::detect().unwrap();
    /// println!("System has {} GB RAM", limits.total_memory_gb);
    /// ```
    pub fn detect() -> Result<Self, MiyabiError> {
        use sysinfo::{Disks, System};

        let mut sys = System::new_all();
        sys.refresh_all();

        // Get total memory in GB
        let total_memory_bytes = sys.total_memory();
        let total_memory_gb = (total_memory_bytes / (1024 * 1024 * 1024)) as usize;

        // Get CPU count
        let total_cpu_cores = sys.cpus().len();

        // Get disk space in GB
        let disks = Disks::new_with_refreshed_list();
        let total_disk_bytes: u64 = disks.iter().map(|disk| disk.total_space()).sum();
        let total_disk_gb = (total_disk_bytes / (1024 * 1024 * 1024)) as usize;

        let limits = Self {
            total_memory_gb,
            total_cpu_cores,
            total_disk_gb,
        };

        info!(
            memory_gb = limits.total_memory_gb,
            cpu_cores = limits.total_cpu_cores,
            disk_gb = limits.total_disk_gb,
            "Detected hardware limits"
        );

        Ok(limits)
    }

    /// Creates HardwareLimits with custom values (for testing)
    pub fn custom(memory_gb: usize, cpu_cores: usize, disk_gb: usize) -> Self {
        Self {
            total_memory_gb: memory_gb,
            total_cpu_cores: cpu_cores,
            total_disk_gb: disk_gb,
        }
    }

    /// Calculates maximum number of concurrent worktrees based on per-worktree limits
    ///
    /// # Arguments
    /// * `per_worktree` - Resource limits per worktree
    ///
    /// # Returns
    /// Maximum number of worktrees that can run concurrently
    ///
    /// # Algorithm
    /// Takes the minimum of:
    /// - Memory capacity: `total_memory / per_worktree_memory`
    /// - CPU capacity: `total_cores / per_worktree_threads`
    /// - Disk capacity: `total_disk / per_worktree_disk`
    ///
    /// # Example
    ///
    /// ```
    /// use miyabi_core::resource_limits::{HardwareLimits, PerWorktreeLimits};
    ///
    /// let hardware = HardwareLimits::custom(32, 8, 500);
    /// let per_worktree = PerWorktreeLimits::default();
    ///
    /// let max_concurrent = hardware.max_concurrent_worktrees(&per_worktree);
    /// assert_eq!(max_concurrent, 4); // min(32/2, 8/2, 500/5) = min(16, 4, 100) = 4
    /// ```
    pub fn max_concurrent_worktrees(&self, per_worktree: &PerWorktreeLimits) -> usize {
        if per_worktree.memory_gb == 0 || per_worktree.cpu_threads == 0 || per_worktree.disk_gb == 0
        {
            warn!("Invalid per-worktree limits (contains zero) - returning 1");
            return 1;
        }

        let memory_limit = self.total_memory_gb / per_worktree.memory_gb;
        let cpu_limit = self.total_cpu_cores / per_worktree.cpu_threads;
        let disk_limit = self.total_disk_gb / per_worktree.disk_gb;

        let max_concurrent = memory_limit.min(cpu_limit).min(disk_limit);

        debug!(
            memory_limit = memory_limit,
            cpu_limit = cpu_limit,
            disk_limit = disk_limit,
            max_concurrent = max_concurrent,
            "Calculated max concurrent worktrees"
        );

        // At least 1 worktree should be allowed
        max_concurrent.max(1)
    }

    /// Checks if the system has enough resources for N worktrees
    pub fn can_run_worktrees(&self, count: usize, per_worktree: &PerWorktreeLimits) -> bool {
        let max_concurrent = self.max_concurrent_worktrees(per_worktree);
        count <= max_concurrent
    }

    /// Gets the bottleneck resource (which resource limits concurrency)
    pub fn bottleneck_resource(&self, per_worktree: &PerWorktreeLimits) -> ResourceType {
        if per_worktree.memory_gb == 0 || per_worktree.cpu_threads == 0 || per_worktree.disk_gb == 0
        {
            return ResourceType::Unknown;
        }

        let memory_limit = self.total_memory_gb / per_worktree.memory_gb;
        let cpu_limit = self.total_cpu_cores / per_worktree.cpu_threads;
        let disk_limit = self.total_disk_gb / per_worktree.disk_gb;

        if memory_limit <= cpu_limit && memory_limit <= disk_limit {
            ResourceType::Memory
        } else if cpu_limit <= disk_limit {
            ResourceType::Cpu
        } else {
            ResourceType::Disk
        }
    }
}

/// Resource limits per worktree
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PerWorktreeLimits {
    /// Memory per worktree in GB
    pub memory_gb: usize,
    /// CPU threads per worktree
    pub cpu_threads: usize,
    /// Disk space per worktree in GB
    pub disk_gb: usize,
}

impl Default for PerWorktreeLimits {
    /// Default limits: 2GB RAM, 2 CPU threads, 5GB disk
    fn default() -> Self {
        Self {
            memory_gb: 2,
            cpu_threads: 2,
            disk_gb: 5,
        }
    }
}

impl PerWorktreeLimits {
    /// Creates conservative limits (minimal resource usage)
    pub fn conservative() -> Self {
        Self {
            memory_gb: 1,
            cpu_threads: 1,
            disk_gb: 2,
        }
    }

    /// Creates aggressive limits (high resource usage)
    pub fn aggressive() -> Self {
        Self {
            memory_gb: 4,
            cpu_threads: 4,
            disk_gb: 10,
        }
    }

    /// Creates custom limits
    pub fn custom(memory_gb: usize, cpu_threads: usize, disk_gb: usize) -> Self {
        Self {
            memory_gb,
            cpu_threads,
            disk_gb,
        }
    }
}

/// Type of system resource
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ResourceType {
    /// Memory (RAM)
    Memory,
    /// CPU cores
    Cpu,
    /// Disk space
    Disk,
    /// Unknown/invalid
    Unknown,
}

impl fmt::Display for ResourceType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ResourceType::Memory => write!(f, "Memory"),
            ResourceType::Cpu => write!(f, "CPU"),
            ResourceType::Disk => write!(f, "Disk"),
            ResourceType::Unknown => write!(f, "Unknown"),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hardware_limits_custom() {
        let limits = HardwareLimits::custom(32, 8, 500);
        assert_eq!(limits.total_memory_gb, 32);
        assert_eq!(limits.total_cpu_cores, 8);
        assert_eq!(limits.total_disk_gb, 500);
    }

    #[test]
    fn test_hardware_limits_detect() {
        // This test will actually detect system resources
        let result = HardwareLimits::detect();
        assert!(result.is_ok(), "Should detect hardware limits");

        let limits = result.unwrap();
        assert!(limits.total_memory_gb > 0, "Should detect non-zero memory");
        assert!(
            limits.total_cpu_cores > 0,
            "Should detect non-zero CPU cores"
        );
        // Note: disk_gb might be 0 on some systems, so we don't assert it
    }

    #[test]
    fn test_max_concurrent_worktrees_memory_bottleneck() {
        let hardware = HardwareLimits::custom(8, 16, 1000); // 8GB RAM
        let per_worktree = PerWorktreeLimits::custom(2, 2, 5); // 2GB per worktree

        let max = hardware.max_concurrent_worktrees(&per_worktree);
        assert_eq!(max, 4); // 8GB / 2GB = 4 (memory is bottleneck)
    }

    #[test]
    fn test_max_concurrent_worktrees_cpu_bottleneck() {
        let hardware = HardwareLimits::custom(32, 4, 1000); // 4 CPU cores
        let per_worktree = PerWorktreeLimits::custom(2, 2, 5); // 2 threads per worktree

        let max = hardware.max_concurrent_worktrees(&per_worktree);
        assert_eq!(max, 2); // 4 cores / 2 threads = 2 (CPU is bottleneck)
    }

    #[test]
    fn test_max_concurrent_worktrees_disk_bottleneck() {
        let hardware = HardwareLimits::custom(32, 16, 20); // 20GB disk
        let per_worktree = PerWorktreeLimits::custom(2, 2, 5); // 5GB per worktree

        let max = hardware.max_concurrent_worktrees(&per_worktree);
        assert_eq!(max, 4); // 20GB / 5GB = 4 (disk is bottleneck)
    }

    #[test]
    fn test_max_concurrent_worktrees_minimum_one() {
        let hardware = HardwareLimits::custom(1, 1, 1);
        let per_worktree = PerWorktreeLimits::custom(10, 10, 10); // Requires more than available

        let max = hardware.max_concurrent_worktrees(&per_worktree);
        assert_eq!(max, 1); // Should return at least 1
    }

    #[test]
    fn test_max_concurrent_worktrees_zero_limits() {
        let hardware = HardwareLimits::custom(32, 8, 500);
        let per_worktree = PerWorktreeLimits::custom(0, 2, 5); // Invalid: 0 memory

        let max = hardware.max_concurrent_worktrees(&per_worktree);
        assert_eq!(max, 1); // Should handle invalid input gracefully
    }

    #[test]
    fn test_per_worktree_limits_default() {
        let limits = PerWorktreeLimits::default();
        assert_eq!(limits.memory_gb, 2);
        assert_eq!(limits.cpu_threads, 2);
        assert_eq!(limits.disk_gb, 5);
    }

    #[test]
    fn test_per_worktree_limits_conservative() {
        let limits = PerWorktreeLimits::conservative();
        assert_eq!(limits.memory_gb, 1);
        assert_eq!(limits.cpu_threads, 1);
        assert_eq!(limits.disk_gb, 2);
    }

    #[test]
    fn test_per_worktree_limits_aggressive() {
        let limits = PerWorktreeLimits::aggressive();
        assert_eq!(limits.memory_gb, 4);
        assert_eq!(limits.cpu_threads, 4);
        assert_eq!(limits.disk_gb, 10);
    }

    #[test]
    fn test_can_run_worktrees() {
        let hardware = HardwareLimits::custom(32, 8, 500);
        let per_worktree = PerWorktreeLimits::default(); // 2GB, 2 threads, 5GB

        // max_concurrent = min(32/2, 8/2, 500/5) = min(16, 4, 100) = 4
        assert!(hardware.can_run_worktrees(4, &per_worktree));
        assert!(!hardware.can_run_worktrees(5, &per_worktree));
    }

    #[test]
    fn test_bottleneck_resource_memory() {
        let hardware = HardwareLimits::custom(8, 16, 1000);
        let per_worktree = PerWorktreeLimits::custom(2, 2, 5);

        let bottleneck = hardware.bottleneck_resource(&per_worktree);
        assert_eq!(bottleneck, ResourceType::Memory);
    }

    #[test]
    fn test_bottleneck_resource_cpu() {
        let hardware = HardwareLimits::custom(32, 4, 1000);
        let per_worktree = PerWorktreeLimits::custom(2, 2, 5);

        let bottleneck = hardware.bottleneck_resource(&per_worktree);
        assert_eq!(bottleneck, ResourceType::Cpu);
    }

    #[test]
    fn test_bottleneck_resource_disk() {
        let hardware = HardwareLimits::custom(32, 16, 20);
        let per_worktree = PerWorktreeLimits::custom(2, 2, 5);

        let bottleneck = hardware.bottleneck_resource(&per_worktree);
        assert_eq!(bottleneck, ResourceType::Disk);
    }

    #[test]
    fn test_hardware_limits_display() {
        let limits = HardwareLimits::custom(32, 8, 500);
        let display = format!("{}", limits);
        assert_eq!(display, "Memory: 32GB, CPU: 8 cores, Disk: 500GB");
    }

    #[test]
    fn test_resource_type_display() {
        assert_eq!(format!("{}", ResourceType::Memory), "Memory");
        assert_eq!(format!("{}", ResourceType::Cpu), "CPU");
        assert_eq!(format!("{}", ResourceType::Disk), "Disk");
        assert_eq!(format!("{}", ResourceType::Unknown), "Unknown");
    }
}
