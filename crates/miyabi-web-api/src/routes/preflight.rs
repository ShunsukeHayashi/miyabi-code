//! Preflight checks endpoint - Environment & system validation

use axum::{routing::get, Json, Router};
use serde::Serialize;
use std::env;
use std::path::Path;
use std::process::Command;

/// Individual check result
#[derive(Serialize, Debug)]
pub struct Check {
    pub name: String,
    pub status: CheckStatus,
    pub message: String,
}

/// Check status enum
#[derive(Serialize, Debug, Clone, Copy, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum CheckStatus {
    Pass,
    Fail,
}

/// Overall system status
#[derive(Serialize, Debug, Clone, Copy, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SystemStatus {
    Healthy,
    Degraded,
    Unhealthy,
}

/// Preflight check response
#[derive(Serialize)]
pub struct PreflightResponse {
    pub status: SystemStatus,
    pub checks: Vec<Check>,
    pub timestamp: String,
}

/// Perform all preflight checks
pub async fn preflight_checks() -> Json<PreflightResponse> {
    let mut checks = Vec::new();

    // Check 1: GITHUB_TOKEN environment variable
    let github_token_check = check_github_token();
    checks.push(github_token_check);

    // Check 2: gh CLI authentication status
    let gh_auth_check = check_gh_auth();
    checks.push(gh_auth_check);

    // Check 3: .ai/logs directory exists
    let logs_dir_check = check_logs_directory();
    checks.push(logs_dir_check);

    // Check 4: LOG_DIRECTORY environment variable (optional)
    let log_dir_env_check = check_log_directory_env();
    checks.push(log_dir_env_check);

    // Determine overall status
    let status = determine_system_status(&checks);

    Json(PreflightResponse {
        status,
        checks,
        timestamp: chrono::Utc::now().to_rfc3339(),
    })
}

/// Check if GITHUB_TOKEN environment variable is set
fn check_github_token() -> Check {
    match env::var("GITHUB_TOKEN") {
        Ok(token) if !token.is_empty() => Check {
            name: "github_token".to_string(),
            status: CheckStatus::Pass,
            message: "GITHUB_TOKEN environment variable is set".to_string(),
        },
        Ok(_) => Check {
            name: "github_token".to_string(),
            status: CheckStatus::Fail,
            message: "GITHUB_TOKEN is set but empty".to_string(),
        },
        Err(_) => Check {
            name: "github_token".to_string(),
            status: CheckStatus::Fail,
            message: "GITHUB_TOKEN environment variable is not set".to_string(),
        },
    }
}

/// Check gh CLI authentication status
fn check_gh_auth() -> Check {
    match Command::new("gh").arg("auth").arg("status").output() {
        Ok(output) => {
            if output.status.success() {
                Check {
                    name: "gh_auth".to_string(),
                    status: CheckStatus::Pass,
                    message: "gh CLI is authenticated".to_string(),
                }
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                Check {
                    name: "gh_auth".to_string(),
                    status: CheckStatus::Fail,
                    message: format!("gh CLI authentication failed: {}", stderr.trim()),
                }
            }
        }
        Err(e) => Check {
            name: "gh_auth".to_string(),
            status: CheckStatus::Fail,
            message: format!("Failed to run gh CLI: {}", e),
        },
    }
}

/// Check if .ai/logs directory exists
fn check_logs_directory() -> Check {
    // Check multiple possible locations
    let possible_paths = vec![
        ".ai/logs",
        "/Users/shunsuke/Dev/miyabi-private/.ai/logs",
        "../.ai/logs",
        "../../.ai/logs",
    ];

    for path in possible_paths {
        if Path::new(path).exists() {
            return Check {
                name: "logs_directory".to_string(),
                status: CheckStatus::Pass,
                message: format!(".ai/logs directory exists at: {}", path),
            };
        }
    }

    Check {
        name: "logs_directory".to_string(),
        status: CheckStatus::Fail,
        message: ".ai/logs directory not found in any expected location".to_string(),
    }
}

/// Check LOG_DIRECTORY environment variable (optional check)
fn check_log_directory_env() -> Check {
    match env::var("LOG_DIRECTORY") {
        Ok(dir) if !dir.is_empty() => {
            if Path::new(&dir).exists() {
                Check {
                    name: "log_directory_env".to_string(),
                    status: CheckStatus::Pass,
                    message: format!("LOG_DIRECTORY is set and exists: {}", dir),
                }
            } else {
                Check {
                    name: "log_directory_env".to_string(),
                    status: CheckStatus::Fail,
                    message: format!("LOG_DIRECTORY is set but path doesn't exist: {}", dir),
                }
            }
        }
        Ok(_) => Check {
            name: "log_directory_env".to_string(),
            status: CheckStatus::Fail,
            message: "LOG_DIRECTORY is set but empty".to_string(),
        },
        Err(_) => Check {
            name: "log_directory_env".to_string(),
            status: CheckStatus::Pass,
            message: "LOG_DIRECTORY not set (optional)".to_string(),
        },
    }
}

/// Determine overall system status based on check results
fn determine_system_status(checks: &[Check]) -> SystemStatus {
    let failed_count = checks
        .iter()
        .filter(|c| c.status == CheckStatus::Fail)
        .count();
    let total_count = checks.len();

    // Critical checks (must pass for healthy status)
    let critical_checks = ["github_token", "gh_auth"];
    let critical_failed = checks
        .iter()
        .any(|c| critical_checks.contains(&c.name.as_str()) && c.status == CheckStatus::Fail);

    if critical_failed {
        SystemStatus::Unhealthy
    } else if failed_count > 0 {
        SystemStatus::Degraded
    } else if failed_count == total_count {
        SystemStatus::Unhealthy
    } else {
        SystemStatus::Healthy
    }
}

/// Create router for preflight checks
pub fn routes() -> Router {
    Router::new().route("/", get(preflight_checks))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_determine_system_status_all_pass() {
        let checks = vec![
            Check {
                name: "test1".to_string(),
                status: CheckStatus::Pass,
                message: "ok".to_string(),
            },
            Check {
                name: "test2".to_string(),
                status: CheckStatus::Pass,
                message: "ok".to_string(),
            },
        ];
        assert_eq!(determine_system_status(&checks), SystemStatus::Healthy);
    }

    #[test]
    fn test_determine_system_status_critical_fail() {
        let checks = vec![
            Check {
                name: "github_token".to_string(),
                status: CheckStatus::Fail,
                message: "not set".to_string(),
            },
            Check {
                name: "gh_auth".to_string(),
                status: CheckStatus::Pass,
                message: "ok".to_string(),
            },
        ];
        assert_eq!(determine_system_status(&checks), SystemStatus::Unhealthy);
    }

    #[test]
    fn test_determine_system_status_non_critical_fail() {
        let checks = vec![
            Check {
                name: "github_token".to_string(),
                status: CheckStatus::Pass,
                message: "ok".to_string(),
            },
            Check {
                name: "logs_directory".to_string(),
                status: CheckStatus::Fail,
                message: "not found".to_string(),
            },
        ];
        assert_eq!(determine_system_status(&checks), SystemStatus::Degraded);
    }
}
