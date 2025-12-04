//! Benchmark and Production Tests for Claude Agent SDK
//!
//! Provides utilities for testing agent orchestration performance
//! and validating production readiness.

use std::time::{Duration, Instant};

use crate::miyabi_adapter::MiyabiAgentType;

/// Benchmark result for agent operations
#[derive(Debug, Clone)]
pub struct BenchmarkResult {
    /// Operation name
    pub operation: String,
    /// Number of iterations
    pub iterations: usize,
    /// Total duration
    pub total_duration: Duration,
    /// Average duration per operation
    pub avg_duration: Duration,
    /// Min duration
    pub min_duration: Duration,
    /// Max duration
    pub max_duration: Duration,
    /// Operations per second
    pub ops_per_second: f64,
    /// Success count
    pub success_count: usize,
    /// Failure count
    pub failure_count: usize,
}

impl BenchmarkResult {
    /// Create new benchmark result
    pub fn new(operation: &str, iterations: usize, durations: Vec<Duration>, failures: usize) -> Self {
        let total: Duration = durations.iter().sum();
        let avg = total / iterations as u32;
        let min = durations.iter().min().copied().unwrap_or(Duration::ZERO);
        let max = durations.iter().max().copied().unwrap_or(Duration::ZERO);
        let ops_per_second = iterations as f64 / total.as_secs_f64();

        Self {
            operation: operation.to_string(),
            iterations,
            total_duration: total,
            avg_duration: avg,
            min_duration: min,
            max_duration: max,
            ops_per_second,
            success_count: iterations - failures,
            failure_count: failures,
        }
    }

    /// Format as report string
    pub fn to_report(&self) -> String {
        format!(
            "📊 {} Benchmark\n\
             ├─ Iterations: {}\n\
             ├─ Total Time: {:?}\n\
             ├─ Avg Time: {:?}\n\
             ├─ Min/Max: {:?} / {:?}\n\
             ├─ Ops/sec: {:.2}\n\
             └─ Success/Fail: {} / {}",
            self.operation,
            self.iterations,
            self.total_duration,
            self.avg_duration,
            self.min_duration,
            self.max_duration,
            self.ops_per_second,
            self.success_count,
            self.failure_count
        )
    }
}

/// Production test suite
pub struct ProductionTestSuite {
    /// Test results
    results: Vec<TestResult>,
    /// Start time
    started_at: Instant,
}

/// Individual test result
#[derive(Debug, Clone)]
pub struct TestResult {
    pub name: String,
    pub passed: bool,
    pub duration: Duration,
    pub message: Option<String>,
}

impl ProductionTestSuite {
    /// Create new test suite
    pub fn new() -> Self {
        Self {
            results: Vec::new(),
            started_at: Instant::now(),
        }
    }

    /// Add test result
    pub fn add_result(&mut self, name: &str, passed: bool, duration: Duration, message: Option<String>) {
        self.results.push(TestResult {
            name: name.to_string(),
            passed,
            duration,
            message,
        });
    }

    /// Get summary
    pub fn summary(&self) -> TestSummary {
        let total = self.results.len();
        let passed = self.results.iter().filter(|r| r.passed).count();
        let failed = total - passed;
        let total_duration = self.started_at.elapsed();

        TestSummary {
            total,
            passed,
            failed,
            total_duration,
            results: self.results.clone(),
        }
    }
}

impl Default for ProductionTestSuite {
    fn default() -> Self {
        Self::new()
    }
}

/// Test summary
#[derive(Debug, Clone)]
pub struct TestSummary {
    pub total: usize,
    pub passed: usize,
    pub failed: usize,
    pub total_duration: Duration,
    pub results: Vec<TestResult>,
}

impl TestSummary {
    /// Format as report
    pub fn to_report(&self) -> String {
        let status = if self.failed == 0 { "✅ PASSED" } else { "❌ FAILED" };
        let mut report = format!(
            "🧪 Production Test Suite {}\n\
             ├─ Total: {} tests\n\
             ├─ Passed: {} ✓\n\
             ├─ Failed: {} ✗\n\
             └─ Duration: {:?}\n\n\
             Results:\n",
            status, self.total, self.passed, self.failed, self.total_duration
        );

        for result in &self.results {
            let icon = if result.passed { "✓" } else { "✗" };
            report.push_str(&format!(
                "  {} {} ({:?}){}\n",
                icon,
                result.name,
                result.duration,
                result.message.as_ref().map(|m| format!(" - {}", m)).unwrap_or_default()
            ));
        }

        report
    }
}

/// Agent spawn configuration for testing
#[derive(Debug, Clone)]
pub struct TestAgentConfig {
    pub agent_type: MiyabiAgentType,
    pub expected_startup_ms: u64,
    pub expected_memory_mb: u64,
}

impl TestAgentConfig {
    /// Get test configurations for all development agents
    pub fn dev_agents() -> Vec<Self> {
        vec![
            Self { agent_type: MiyabiAgentType::Coordinator, expected_startup_ms: 500, expected_memory_mb: 256 },
            Self { agent_type: MiyabiAgentType::CodeGen, expected_startup_ms: 800, expected_memory_mb: 512 },
            Self { agent_type: MiyabiAgentType::Review, expected_startup_ms: 600, expected_memory_mb: 384 },
            Self { agent_type: MiyabiAgentType::Issue, expected_startup_ms: 400, expected_memory_mb: 256 },
            Self { agent_type: MiyabiAgentType::PR, expected_startup_ms: 500, expected_memory_mb: 256 },
            Self { agent_type: MiyabiAgentType::Deploy, expected_startup_ms: 700, expected_memory_mb: 384 },
            Self { agent_type: MiyabiAgentType::Refresher, expected_startup_ms: 300, expected_memory_mb: 128 },
        ]
    }

    /// Get test configurations for business agents
    pub fn business_agents() -> Vec<Self> {
        vec![
            Self { agent_type: MiyabiAgentType::AiEntrepreneur, expected_startup_ms: 600, expected_memory_mb: 384 },
            Self { agent_type: MiyabiAgentType::SelfAnalysis, expected_startup_ms: 400, expected_memory_mb: 256 },
            Self { agent_type: MiyabiAgentType::MarketResearch, expected_startup_ms: 500, expected_memory_mb: 384 },
            Self { agent_type: MiyabiAgentType::Persona, expected_startup_ms: 400, expected_memory_mb: 256 },
            Self { agent_type: MiyabiAgentType::ProductConcept, expected_startup_ms: 500, expected_memory_mb: 256 },
            Self { agent_type: MiyabiAgentType::ProductDesign, expected_startup_ms: 600, expected_memory_mb: 384 },
            Self { agent_type: MiyabiAgentType::ContentCreation, expected_startup_ms: 700, expected_memory_mb: 512 },
            Self { agent_type: MiyabiAgentType::FunnelDesign, expected_startup_ms: 500, expected_memory_mb: 256 },
            Self { agent_type: MiyabiAgentType::SnsStrategy, expected_startup_ms: 400, expected_memory_mb: 256 },
            Self { agent_type: MiyabiAgentType::Marketing, expected_startup_ms: 500, expected_memory_mb: 384 },
            Self { agent_type: MiyabiAgentType::Sales, expected_startup_ms: 500, expected_memory_mb: 384 },
            Self { agent_type: MiyabiAgentType::Crm, expected_startup_ms: 400, expected_memory_mb: 256 },
            Self { agent_type: MiyabiAgentType::Analytics, expected_startup_ms: 600, expected_memory_mb: 512 },
            Self { agent_type: MiyabiAgentType::YouTube, expected_startup_ms: 500, expected_memory_mb: 384 },
        ]
    }
}

/// Parallel execution test harness
pub struct ParallelExecutionTest {
    /// Number of agents to spawn
    pub agent_count: usize,
    /// Agent types to use
    pub agent_types: Vec<MiyabiAgentType>,
    /// Max concurrent agents
    pub max_concurrent: usize,
    /// Timeout per agent
    pub timeout: Duration,
}

impl ParallelExecutionTest {
    /// Create test for development workflow
    pub fn dev_workflow() -> Self {
        Self {
            agent_count: 7,
            agent_types: vec![
                MiyabiAgentType::Coordinator,
                MiyabiAgentType::CodeGen,
                MiyabiAgentType::Review,
                MiyabiAgentType::Issue,
                MiyabiAgentType::PR,
                MiyabiAgentType::Deploy,
                MiyabiAgentType::Refresher,
            ],
            max_concurrent: 7,
            timeout: Duration::from_secs(60),
        }
    }

    /// Create test for business workflow
    pub fn business_workflow() -> Self {
        Self {
            agent_count: 14,
            agent_types: vec![
                MiyabiAgentType::AiEntrepreneur,
                MiyabiAgentType::SelfAnalysis,
                MiyabiAgentType::MarketResearch,
                MiyabiAgentType::Persona,
                MiyabiAgentType::ProductConcept,
                MiyabiAgentType::ProductDesign,
                MiyabiAgentType::ContentCreation,
                MiyabiAgentType::FunnelDesign,
                MiyabiAgentType::SnsStrategy,
                MiyabiAgentType::Marketing,
                MiyabiAgentType::Sales,
                MiyabiAgentType::Crm,
                MiyabiAgentType::Analytics,
                MiyabiAgentType::YouTube,
            ],
            max_concurrent: 8,
            timeout: Duration::from_secs(120),
        }
    }

    /// Create test for full workflow (all 21 agents)
    pub fn full_workflow() -> Self {
        Self {
            agent_count: 21,
            agent_types: MiyabiAgentType::all(),
            max_concurrent: 8,
            timeout: Duration::from_secs(180),
        }
    }

    /// Get expected total memory usage in MB
    pub fn expected_memory_mb(&self) -> u64 {
        // Base: ~256MB per agent on average
        (self.agent_count as u64) * 256
    }

    /// Get expected total startup time
    pub fn expected_startup_time(&self) -> Duration {
        // Parallel startup, so divide by concurrency
        let sequential_time_ms = (self.agent_count as u64) * 500;
        let parallel_batches = (self.agent_count + self.max_concurrent - 1) / self.max_concurrent;
        Duration::from_millis(sequential_time_ms / self.max_concurrent as u64 * parallel_batches as u64)
    }
}

/// Health check for production readiness
#[derive(Debug, Clone)]
pub struct HealthCheck {
    /// Check name
    pub name: String,
    /// Check status
    pub status: HealthStatus,
    /// Details
    pub details: Option<String>,
    /// Timestamp
    pub checked_at: chrono::DateTime<chrono::Utc>,
}

/// Health status
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HealthStatus {
    Healthy,
    Degraded,
    Unhealthy,
    Unknown,
}

impl HealthStatus {
    pub fn icon(&self) -> &'static str {
        match self {
            Self::Healthy => "🟢",
            Self::Degraded => "🟡",
            Self::Unhealthy => "🔴",
            Self::Unknown => "⚪",
        }
    }
}

/// System health report
#[derive(Debug, Clone)]
pub struct SystemHealthReport {
    pub checks: Vec<HealthCheck>,
    pub overall_status: HealthStatus,
    pub generated_at: chrono::DateTime<chrono::Utc>,
}

impl SystemHealthReport {
    /// Generate health report from checks
    pub fn from_checks(checks: Vec<HealthCheck>) -> Self {
        let overall_status = if checks.iter().all(|c| c.status == HealthStatus::Healthy) {
            HealthStatus::Healthy
        } else if checks.iter().any(|c| c.status == HealthStatus::Unhealthy) {
            HealthStatus::Unhealthy
        } else if checks.iter().any(|c| c.status == HealthStatus::Degraded) {
            HealthStatus::Degraded
        } else {
            HealthStatus::Unknown
        };

        Self {
            checks,
            overall_status,
            generated_at: chrono::Utc::now(),
        }
    }

    /// Format as report
    pub fn to_report(&self) -> String {
        let mut report = format!(
            "🏥 System Health Report\n\
             ├─ Status: {} {:?}\n\
             └─ Generated: {}\n\n\
             Checks:\n",
            self.overall_status.icon(),
            self.overall_status,
            self.generated_at.format("%Y-%m-%d %H:%M:%S UTC")
        );

        for check in &self.checks {
            report.push_str(&format!(
                "  {} {} - {:?}{}\n",
                check.status.icon(),
                check.name,
                check.status,
                check.details.as_ref().map(|d| format!(" ({})", d)).unwrap_or_default()
            ));
        }

        report
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_benchmark_result() {
        let durations = vec![
            Duration::from_millis(100),
            Duration::from_millis(150),
            Duration::from_millis(120),
        ];
        let result = BenchmarkResult::new("test_op", 3, durations, 0);
        
        assert_eq!(result.iterations, 3);
        assert_eq!(result.min_duration, Duration::from_millis(100));
        assert_eq!(result.max_duration, Duration::from_millis(150));
        assert_eq!(result.success_count, 3);
        assert_eq!(result.failure_count, 0);
    }

    #[test]
    fn test_production_test_suite() {
        let mut suite = ProductionTestSuite::new();
        suite.add_result("test1", true, Duration::from_millis(100), None);
        suite.add_result("test2", false, Duration::from_millis(200), Some("error".to_string()));
        
        let summary = suite.summary();
        assert_eq!(summary.total, 2);
        assert_eq!(summary.passed, 1);
        assert_eq!(summary.failed, 1);
    }

    #[test]
    fn test_dev_agents_config() {
        let configs = TestAgentConfig::dev_agents();
        assert_eq!(configs.len(), 7);
    }

    #[test]
    fn test_business_agents_config() {
        let configs = TestAgentConfig::business_agents();
        assert_eq!(configs.len(), 14);
    }

    #[test]
    fn test_parallel_execution_dev() {
        let test = ParallelExecutionTest::dev_workflow();
        assert_eq!(test.agent_count, 7);
        assert_eq!(test.max_concurrent, 7);
    }

    #[test]
    fn test_parallel_execution_full() {
        let test = ParallelExecutionTest::full_workflow();
        assert_eq!(test.agent_count, 21);
        assert_eq!(test.agent_types.len(), 21);
    }

    #[test]
    fn test_health_status() {
        assert_eq!(HealthStatus::Healthy.icon(), "🟢");
        assert_eq!(HealthStatus::Unhealthy.icon(), "🔴");
    }

    #[test]
    fn test_health_report() {
        let checks = vec![
            HealthCheck {
                name: "cpu".to_string(),
                status: HealthStatus::Healthy,
                details: None,
                checked_at: chrono::Utc::now(),
            },
            HealthCheck {
                name: "memory".to_string(),
                status: HealthStatus::Degraded,
                details: Some("80% used".to_string()),
                checked_at: chrono::Utc::now(),
            },
        ];
        
        let report = SystemHealthReport::from_checks(checks);
        assert_eq!(report.overall_status, HealthStatus::Degraded);
        assert_eq!(report.checks.len(), 2);
    }
}
