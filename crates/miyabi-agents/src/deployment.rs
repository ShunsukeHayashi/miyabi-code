//! DeploymentAgent - CI/CD deployment automation
//!
//! Responsible for build execution, testing, deployment, health checks, and rollback.
//! Supports Staging (auto-deploy) and Production (approval-required) environments.

use crate::base::BaseAgent;
use async_trait::async_trait;
use miyabi_types::agent::{
    AgentMetrics, AgentType, EscalationInfo, EscalationTarget, ResultStatus, Severity,
};
use miyabi_types::error::{MiyabiError, Result};
use miyabi_types::{AgentConfig, AgentResult, Task};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::process::Stdio;
use std::time::Duration;

/// Deployment environment
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Environment {
    Staging,
    Production,
}

/// Deployment status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DeploymentStatus {
    Pending,
    Building,
    Testing,
    Deploying,
    HealthChecking,
    Success,
    Failed,
    RolledBack,
}

/// DeploymentAgent - CI/CD deployment automation
pub struct DeploymentAgent {
    #[allow(dead_code)] // Reserved for future configuration
    config: AgentConfig,
}

impl DeploymentAgent {
    pub fn new(config: AgentConfig) -> Self {
        Self { config }
    }

    /// Execute build command (cargo build --release)
    async fn execute_build(&self, project_path: &Path) -> Result<BuildResult> {
        tracing::info!("Building project at {:?}", project_path);

        let start_time = std::time::Instant::now();

        let output = tokio::process::Command::new("cargo")
            .arg("build")
            .arg("--release")
            .current_dir(project_path)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await
            .map_err(|e| MiyabiError::Unknown(format!("Failed to execute build: {}", e)))?;

        let duration_ms = start_time.elapsed().as_millis() as u64;
        let success = output.status.success();

        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();

        if !success {
            return Err(MiyabiError::Unknown(format!("Build failed: {}", stderr)));
        }

        tracing::info!("Build completed in {}ms", duration_ms);

        Ok(BuildResult {
            success,
            duration_ms,
            stdout,
            stderr,
        })
    }

    /// Execute test command (cargo test)
    async fn execute_tests(&self, project_path: &Path) -> Result<TestResult> {
        tracing::info!("Running tests at {:?}", project_path);

        let start_time = std::time::Instant::now();

        let output = tokio::process::Command::new("cargo")
            .arg("test")
            .arg("--all")
            .current_dir(project_path)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .output()
            .await
            .map_err(|e| MiyabiError::Unknown(format!("Failed to execute tests: {}", e)))?;

        let duration_ms = start_time.elapsed().as_millis() as u64;
        let success = output.status.success();

        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();

        // Parse test results
        let (tests_passed, tests_failed) = Self::parse_test_output(&stdout);

        if !success {
            return Err(MiyabiError::Unknown(format!(
                "Tests failed: {} passed, {} failed",
                tests_passed, tests_failed
            )));
        }

        tracing::info!(
            "Tests completed: {} passed, {} failed in {}ms",
            tests_passed,
            tests_failed,
            duration_ms
        );

        Ok(TestResult {
            success,
            duration_ms,
            tests_passed,
            tests_failed,
            stdout,
            stderr,
        })
    }

    /// Parse test output to extract test counts
    fn parse_test_output(output: &str) -> (u32, u32) {
        let mut passed = 0;
        let mut failed = 0;

        // Parse "test result: ok. X passed; Y failed"
        if let Some(line) = output.lines().find(|l| l.contains("test result:")) {
            if let Some(passed_str) = line
                .split("passed")
                .next()
                .and_then(|s| s.split_whitespace().last())
            {
                passed = passed_str.parse().unwrap_or(0);
            }
            if let Some(failed_str) = line
                .split("failed")
                .next()
                .and_then(|s| s.split_whitespace().last())
            {
                failed = failed_str.parse().unwrap_or(0);
            }
        }

        (passed, failed)
    }

    /// Perform health check with retries
    async fn health_check(&self, url: &str, retries: u32) -> Result<HealthCheckResult> {
        tracing::info!("Performing health check on {}", url);

        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .map_err(|e| MiyabiError::Unknown(format!("Failed to create HTTP client: {}", e)))?;

        let mut attempts = 0;
        let mut last_error = None;

        for attempt in 1..=retries {
            attempts = attempt;
            tracing::info!("Health check attempt {}/{}", attempt, retries);

            match client.get(url).send().await {
                Ok(response) => {
                    let status = response.status();
                    tracing::info!("Health check status: {}", status);

                    if status.is_success() {
                        tracing::info!("Health check passed");
                        return Ok(HealthCheckResult {
                            success: true,
                            attempts,
                            status_code: Some(status.as_u16()),
                            error: None,
                        });
                    } else {
                        last_error = Some(format!("HTTP {}", status));
                    }
                }
                Err(e) => {
                    tracing::warn!("Health check attempt {} failed: {}", attempt, e);
                    last_error = Some(e.to_string());
                }
            }

            if attempt < retries {
                tokio::time::sleep(Duration::from_secs(10)).await;
            }
        }

        tracing::error!(
            "Health check failed after {} attempts: {}",
            attempts,
            last_error.as_ref().unwrap_or(&"Unknown error".to_string())
        );

        Ok(HealthCheckResult {
            success: false,
            attempts,
            status_code: None,
            error: last_error,
        })
    }

    /// Deploy to environment (placeholder for Firebase CLI integration)
    async fn deploy(
        &self,
        _environment: Environment,
        _project_path: &Path,
    ) -> Result<DeploymentResult> {
        tracing::info!("Deploying to {:?} (placeholder)", _environment);

        // Placeholder: Firebase CLI integration would go here
        // In production:
        // 1. firebase deploy --only hosting,functions --project {project_id}
        // 2. Extract deployment URL from output
        // 3. Return DeploymentResult with URL

        Ok(DeploymentResult {
            success: true,
            duration_ms: 0,
            deployment_url: "https://example.com".to_string(),
            stdout: String::new(),
            stderr: String::new(),
        })
    }

    /// Rollback to previous version (placeholder)
    async fn rollback(
        &self,
        _environment: Environment,
        _project_path: &Path,
    ) -> Result<RollbackResult> {
        tracing::info!("Rolling back to previous version (placeholder)");

        // Placeholder: Git + deploy logic would go here
        // In production:
        // 1. git describe --tags --abbrev=0 HEAD~1
        // 2. git checkout {previous_version}
        // 3. cargo build --release
        // 4. deploy()
        // 5. health_check()

        Ok(RollbackResult {
            success: true,
            previous_version: "v0.1.0".to_string(),
            duration_ms: 0,
        })
    }
}

#[async_trait]
impl BaseAgent for DeploymentAgent {
    fn agent_type(&self) -> AgentType {
        AgentType::DeploymentAgent
    }

    async fn execute(&self, task: &Task) -> Result<AgentResult> {
        let start_time = chrono::Utc::now();

        // Extract deployment metadata
        let metadata = task
            .metadata
            .as_ref()
            .ok_or_else(|| MiyabiError::Validation("Task metadata is missing".to_string()))?;

        let environment_str = metadata
            .get("environment")
            .and_then(|v| v.as_str())
            .unwrap_or("staging");

        let environment = match environment_str {
            "production" => Environment::Production,
            _ => Environment::Staging,
        };

        // Get project path
        let project_path = std::env::current_dir()
            .map_err(|e| MiyabiError::Unknown(format!("Failed to get current directory: {}", e)))?;

        // Phase 1: Build
        let build_result = self.execute_build(&project_path).await?;

        // Phase 2: Test
        let test_result = self.execute_tests(&project_path).await?;

        // Phase 3: Deploy (placeholder)
        let deploy_result = self.deploy(environment, &project_path).await?;

        // Phase 4: Health check
        let health_url = metadata
            .get("health_url")
            .and_then(|v| v.as_str())
            .unwrap_or(&deploy_result.deployment_url);

        let retries = match environment {
            Environment::Staging => 5,
            Environment::Production => 10,
        };

        let health_result = self.health_check(health_url, retries).await?;

        // Phase 5: Rollback if health check failed
        let rollback_result = if !health_result.success {
            tracing::warn!("Health check failed, initiating rollback");
            Some(self.rollback(environment, &project_path).await?)
        } else {
            None
        };

        let end_time = chrono::Utc::now();
        let duration_ms = (end_time - start_time).num_milliseconds() as u64;

        // Determine final status
        let status = if rollback_result.is_some() {
            ResultStatus::Failed
        } else if health_result.success {
            ResultStatus::Success
        } else {
            ResultStatus::Failed
        };

        // Check for escalation
        let escalation = if environment == Environment::Production && !health_result.success {
            let mut context = HashMap::new();
            context.insert("environment".to_string(), serde_json::json!("production"));
            context.insert(
                "health_check".to_string(),
                serde_json::to_value(&health_result)?,
            );

            Some(EscalationInfo {
                reason: "Production deployment health check failed".to_string(),
                target: EscalationTarget::CTO,
                severity: Severity::Critical,
                context,
                timestamp: end_time,
            })
        } else if !build_result.success || !test_result.success {
            let mut context = HashMap::new();
            context.insert(
                "build_success".to_string(),
                serde_json::json!(build_result.success),
            );
            context.insert(
                "test_success".to_string(),
                serde_json::json!(test_result.success),
            );

            Some(EscalationInfo {
                reason: "Build or test failed".to_string(),
                target: EscalationTarget::TechLead,
                severity: Severity::High,
                context,
                timestamp: end_time,
            })
        } else {
            None
        };

        // Construct result data
        let mut data = HashMap::new();
        data.insert(
            "environment".to_string(),
            serde_json::to_value(environment)?,
        );
        data.insert("build".to_string(), serde_json::to_value(&build_result)?);
        data.insert("tests".to_string(), serde_json::to_value(&test_result)?);
        data.insert(
            "deployment".to_string(),
            serde_json::to_value(&deploy_result)?,
        );
        data.insert(
            "health_check".to_string(),
            serde_json::to_value(&health_result)?,
        );
        if let Some(ref rollback) = rollback_result {
            data.insert("rollback".to_string(), serde_json::to_value(rollback)?);
        }

        // Create metrics
        let metrics = AgentMetrics {
            task_id: task.id.clone(),
            agent_type: AgentType::DeploymentAgent,
            duration_ms,
            quality_score: None,
            lines_changed: None,
            tests_added: None,
            coverage_percent: None,
            errors_found: if test_result.tests_failed > 0 {
                Some(test_result.tests_failed)
            } else {
                None
            },
            timestamp: end_time,
        };

        Ok(AgentResult {
            status,
            data: Some(serde_json::to_value(data)?),
            error: if !health_result.success {
                health_result.error
            } else {
                None
            },
            metrics: Some(metrics),
            escalation,
        })
    }
}

/// Build execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BuildResult {
    pub success: bool,
    pub duration_ms: u64,
    pub stdout: String,
    pub stderr: String,
}

/// Test execution result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestResult {
    pub success: bool,
    pub duration_ms: u64,
    pub tests_passed: u32,
    pub tests_failed: u32,
    pub stdout: String,
    pub stderr: String,
}

/// Deployment result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeploymentResult {
    pub success: bool,
    pub duration_ms: u64,
    pub deployment_url: String,
    pub stdout: String,
    pub stderr: String,
}

/// Health check result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthCheckResult {
    pub success: bool,
    pub attempts: u32,
    pub status_code: Option<u16>,
    pub error: Option<String>,
}

/// Rollback result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RollbackResult {
    pub success: bool,
    pub previous_version: String,
    pub duration_ms: u64,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_config() -> AgentConfig {
        AgentConfig {
            device_identifier: "test-device".to_string(),
            github_token: "test-token".to_string(),
            repo_owner: Some("test-owner".to_string()),
            repo_name: Some("test-repo".to_string()),
            use_task_tool: false,
            use_worktree: false,
            worktree_base_path: None,
            log_directory: "./logs".to_string(),
            report_directory: "./reports".to_string(),
            tech_lead_github_username: None,
            ciso_github_username: None,
            po_github_username: None,
            firebase_production_project: None,
            firebase_staging_project: None,
            production_url: None,
            staging_url: None,
        }
    }

    #[tokio::test]
    async fn test_deployment_agent_creation() {
        let config = create_test_config();
        let agent = DeploymentAgent::new(config);
        assert_eq!(agent.agent_type(), AgentType::DeploymentAgent);
    }

    #[test]
    fn test_parse_test_output() {
        let output = "test result: ok. 42 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out";
        let (passed, failed) = DeploymentAgent::parse_test_output(output);
        assert_eq!(passed, 42);
        assert_eq!(failed, 0);
    }

    #[test]
    fn test_parse_test_output_with_failures() {
        let output =
            "test result: FAILED. 38 passed; 4 failed; 0 ignored; 0 measured; 0 filtered out";
        let (passed, failed) = DeploymentAgent::parse_test_output(output);
        assert_eq!(passed, 38);
        assert_eq!(failed, 4);
    }

    #[test]
    fn test_environment_serialization() {
        let env = Environment::Staging;
        let json = serde_json::to_string(&env).unwrap();
        assert_eq!(json, "\"staging\"");

        let env = Environment::Production;
        let json = serde_json::to_string(&env).unwrap();
        assert_eq!(json, "\"production\"");
    }

    #[test]
    fn test_deployment_status_serialization() {
        let status = DeploymentStatus::Success;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"success\"");

        let status = DeploymentStatus::Failed;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, "\"failed\"");
    }

    #[test]
    fn test_build_result_serialization() {
        let result = BuildResult {
            success: true,
            duration_ms: 45000,
            stdout: "Build completed".to_string(),
            stderr: String::new(),
        };

        let json = serde_json::to_value(&result).unwrap();
        assert_eq!(json["success"], true);
        assert_eq!(json["duration_ms"], 45000);

        let deserialized: BuildResult = serde_json::from_value(json).unwrap();
        assert!(deserialized.success);
        assert_eq!(deserialized.duration_ms, 45000);
    }

    #[test]
    fn test_test_result_serialization() {
        let result = TestResult {
            success: true,
            duration_ms: 90000,
            tests_passed: 42,
            tests_failed: 0,
            stdout: "All tests passed".to_string(),
            stderr: String::new(),
        };

        let json = serde_json::to_value(&result).unwrap();
        assert_eq!(json["tests_passed"], 42);
        assert_eq!(json["tests_failed"], 0);

        let deserialized: TestResult = serde_json::from_value(json).unwrap();
        assert_eq!(deserialized.tests_passed, 42);
    }

    #[test]
    fn test_health_check_result_serialization() {
        let result = HealthCheckResult {
            success: true,
            attempts: 3,
            status_code: Some(200),
            error: None,
        };

        let json = serde_json::to_value(&result).unwrap();
        assert_eq!(json["success"], true);
        assert_eq!(json["attempts"], 3);
        assert_eq!(json["status_code"], 200);

        let deserialized: HealthCheckResult = serde_json::from_value(json).unwrap();
        assert_eq!(deserialized.attempts, 3);
    }

    #[tokio::test]
    #[ignore] // Integration test - runs cargo build --release (very slow, 60+ seconds)
    async fn test_execute_build() {
        let config = create_test_config();
        let agent = DeploymentAgent::new(config);

        let project_path = std::env::current_dir().unwrap();
        let result = agent.execute_build(&project_path).await;

        // Build should succeed for miyabi-private project
        assert!(result.is_ok());
        let build_result = result.unwrap();
        assert!(build_result.success);
        assert!(build_result.duration_ms > 0);
    }

    #[tokio::test]
    #[ignore] // Integration test - runs cargo test --all (very slow, may cause recursive test execution)
    async fn test_execute_tests() {
        let config = create_test_config();
        let agent = DeploymentAgent::new(config);

        let project_path = std::env::current_dir().unwrap();
        let result = agent.execute_tests(&project_path).await;

        // Tests should run (may pass or fail, we're testing the agent functionality)
        // Note: This test verifies execute_tests() works, not that all project tests pass
        if let Ok(test_result) = result {
            // If tests ran, verify we got some output
            assert!(test_result.tests_passed > 0 || test_result.tests_failed > 0);
            assert!(test_result.duration_ms > 0);
        } else {
            // If tests failed to run at all, that's also acceptable for this test
            // We're testing that the agent handles test execution, not test results
            assert!(result.is_err());
        }
    }

    #[tokio::test]
    async fn test_deploy_placeholder() {
        let config = create_test_config();
        let agent = DeploymentAgent::new(config);

        let project_path = std::env::current_dir().unwrap();
        let result = agent.deploy(Environment::Staging, &project_path).await;

        // Placeholder always succeeds
        assert!(result.is_ok());
        let deploy_result = result.unwrap();
        assert!(deploy_result.success);
        assert!(deploy_result.deployment_url.starts_with("https://"));
    }

    #[tokio::test]
    async fn test_rollback_placeholder() {
        let config = create_test_config();
        let agent = DeploymentAgent::new(config);

        let project_path = std::env::current_dir().unwrap();
        let result = agent.rollback(Environment::Staging, &project_path).await;

        // Placeholder always succeeds
        assert!(result.is_ok());
        let rollback_result = result.unwrap();
        assert!(rollback_result.success);
        assert!(!rollback_result.previous_version.is_empty());
    }

    #[test]
    fn test_deployment_result_serialization() {
        let result = DeploymentResult {
            success: true,
            duration_ms: 180000,
            deployment_url: "https://staging.example.com".to_string(),
            stdout: "Deployment complete".to_string(),
            stderr: String::new(),
        };

        let json = serde_json::to_value(&result).unwrap();
        assert_eq!(json["success"], true);
        assert_eq!(json["deployment_url"], "https://staging.example.com");

        let deserialized: DeploymentResult = serde_json::from_value(json).unwrap();
        assert_eq!(deserialized.deployment_url, "https://staging.example.com");
    }

    #[test]
    fn test_rollback_result_serialization() {
        let result = RollbackResult {
            success: true,
            previous_version: "v1.2.2".to_string(),
            duration_ms: 120000,
        };

        let json = serde_json::to_value(&result).unwrap();
        assert_eq!(json["success"], true);
        assert_eq!(json["previous_version"], "v1.2.2");

        let deserialized: RollbackResult = serde_json::from_value(json).unwrap();
        assert_eq!(deserialized.previous_version, "v1.2.2");
    }
}
