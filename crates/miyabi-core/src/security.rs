//! Security audit utilities
//!
//! Provides utilities for security vulnerability scanning:
//! - cargo-audit integration for Rust dependency vulnerabilities
//! - Vulnerability severity assessment
//! - Security score calculation

use miyabi_types::error::{MiyabiError, Result};
use std::path::Path;
use std::process::Stdio;

/// Security vulnerability severity levels
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub enum VulnerabilitySeverity {
    /// Critical vulnerability (CVSS 9.0-10.0)
    Critical,
    /// High vulnerability (CVSS 7.0-8.9)
    High,
    /// Medium vulnerability (CVSS 4.0-6.9)
    Medium,
    /// Low vulnerability (CVSS 0.1-3.9)
    Low,
    /// Informational (CVSS 0.0)
    None,
}

impl VulnerabilitySeverity {
    /// Get score impact for this severity
    pub fn score_impact(&self) -> u8 {
        match self {
            Self::Critical => 30,
            Self::High => 20,
            Self::Medium => 10,
            Self::Low => 5,
            Self::None => 0,
        }
    }

    /// Parse severity from cargo-audit severity string
    pub fn from_audit_severity(severity: &str) -> Self {
        match severity.to_lowercase().as_str() {
            "critical" => Self::Critical,
            "high" => Self::High,
            "medium" | "moderate" => Self::Medium,
            "low" => Self::Low,
            _ => Self::None,
        }
    }
}

/// A security vulnerability
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Vulnerability {
    /// Advisory ID (e.g., RUSTSEC-2021-0001)
    pub id: String,
    /// Package name
    pub package: String,
    /// Vulnerability title
    pub title: String,
    /// Detailed description
    pub description: Option<String>,
    /// Severity level
    pub severity: VulnerabilitySeverity,
    /// CVE identifier(s)
    pub cve: Option<String>,
    /// Affected version
    pub affected_version: Option<String>,
    /// Patched version(s)
    pub patched_versions: Vec<String>,
}

/// Result of security audit
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SecurityAuditResult {
    /// Security score (0-100)
    pub score: u8,
    /// List of vulnerabilities found
    pub vulnerabilities: Vec<Vulnerability>,
    /// Number of critical vulnerabilities
    pub critical_count: usize,
    /// Number of high vulnerabilities
    pub high_count: usize,
    /// Number of medium vulnerabilities
    pub medium_count: usize,
    /// Number of low vulnerabilities
    pub low_count: usize,
    /// Whether audit passed (no critical/high vulnerabilities)
    pub passed: bool,
}

/// Run cargo-audit security scan
///
/// # Arguments
/// * `project_path` - Path to the Rust project root (containing Cargo.lock)
///
/// # Returns
/// * `Ok(SecurityAuditResult)` - Audit completed successfully
/// * `Err(MiyabiError)` - Failed to run audit
pub async fn run_cargo_audit(project_path: &Path) -> Result<SecurityAuditResult> {
    tracing::info!("Running cargo-audit at {:?}", project_path);

    // Check if Cargo.lock exists
    let cargo_lock = project_path.join("Cargo.lock");
    if !cargo_lock.exists() {
        return Err(MiyabiError::Validation(
            "Cargo.lock not found. Run 'cargo build' first.".to_string(),
        ));
    }

    // Run cargo audit with JSON output
    let output = tokio::process::Command::new("cargo")
        .arg("audit")
        .arg("--json")
        .arg("--deny=warnings")
        .current_dir(project_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .await
        .map_err(|e| {
            MiyabiError::Unknown(format!(
                "Failed to run cargo-audit. Is cargo-audit installed? Error: {}",
                e
            ))
        })?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    // If cargo audit is not installed, return error with installation instructions
    if stderr.contains("no such subcommand") || stderr.contains("not installed") {
        return Err(MiyabiError::Config(
            "cargo-audit is not installed. Install with: cargo install cargo-audit".to_string(),
        ));
    }

    // Parse JSON output
    let vulnerabilities = parse_audit_output(&stdout)?;

    // Calculate counts by severity
    let critical_count = vulnerabilities
        .iter()
        .filter(|v| v.severity == VulnerabilitySeverity::Critical)
        .count();
    let high_count = vulnerabilities
        .iter()
        .filter(|v| v.severity == VulnerabilitySeverity::High)
        .count();
    let medium_count = vulnerabilities
        .iter()
        .filter(|v| v.severity == VulnerabilitySeverity::Medium)
        .count();
    let low_count = vulnerabilities
        .iter()
        .filter(|v| v.severity == VulnerabilitySeverity::Low)
        .count();

    // Calculate security score
    // Start with 100, subtract score impact for each vulnerability
    let score = calculate_security_score(&vulnerabilities);

    // Audit passes if no critical or high vulnerabilities
    let passed = critical_count == 0 && high_count == 0;

    tracing::info!(
        "Security audit complete: {} vulnerabilities (Critical: {}, High: {}, Medium: {}, Low: {}), score: {}",
        vulnerabilities.len(),
        critical_count,
        high_count,
        medium_count,
        low_count,
        score
    );

    Ok(SecurityAuditResult {
        score,
        vulnerabilities,
        critical_count,
        high_count,
        medium_count,
        low_count,
        passed,
    })
}

/// Parse cargo-audit JSON output
fn parse_audit_output(output: &str) -> Result<Vec<Vulnerability>> {
    let mut vulnerabilities = Vec::new();

    // cargo-audit JSON format has vulnerabilities in a "vulnerabilities" object
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(output) {
        if let Some(vulns) = json.get("vulnerabilities").and_then(|v| v.get("list")) {
            if let Some(array) = vulns.as_array() {
                for vuln_json in array {
                    if let Some(vuln) = parse_vulnerability(vuln_json) {
                        vulnerabilities.push(vuln);
                    }
                }
            }
        }

        // Also check for warnings
        if let Some(warnings) = json.get("warnings") {
            if let Some(array) = warnings.as_array() {
                for warning_json in array {
                    if let Some(vuln) = parse_warning(warning_json) {
                        vulnerabilities.push(vuln);
                    }
                }
            }
        }
    }

    Ok(vulnerabilities)
}

/// Parse a single vulnerability from JSON
fn parse_vulnerability(json: &serde_json::Value) -> Option<Vulnerability> {
    let advisory = json.get("advisory")?;

    let id = advisory.get("id")?.as_str()?.to_string();
    let package = json.get("package")?.as_str()?.to_string();
    let title = advisory.get("title")?.as_str()?.to_string();
    let description = advisory
        .get("description")
        .and_then(|d| d.as_str())
        .map(String::from);

    let severity_str = advisory
        .get("cvss")
        .and_then(|c| c.get("severity"))
        .and_then(|s| s.get("value"))
        .and_then(|v| v.as_str())
        .unwrap_or("none");

    let severity = VulnerabilitySeverity::from_audit_severity(severity_str);

    let cve = advisory
        .get("cvss")
        .and_then(|c| c.get("id"))
        .and_then(|i| i.as_str())
        .map(String::from);

    let affected_version = json
        .get("versions")
        .and_then(|v| v.get("affected"))
        .and_then(|a| a.as_str())
        .map(String::from);

    let patched_versions = json
        .get("versions")
        .and_then(|v| v.get("patched"))
        .and_then(|p| p.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_str())
                .map(String::from)
                .collect()
        })
        .unwrap_or_default();

    Some(Vulnerability {
        id,
        package,
        title,
        description,
        severity,
        cve,
        affected_version,
        patched_versions,
    })
}

/// Parse a warning from JSON
fn parse_warning(json: &serde_json::Value) -> Option<Vulnerability> {
    let kind = json.get("kind")?.as_str()?;
    let package = json.get("package")?.as_str()?.to_string();
    let message = json.get("message")?.as_str()?.to_string();

    Some(Vulnerability {
        id: format!("WARNING-{}", kind.to_uppercase()),
        package,
        title: format!("{} warning", kind),
        description: Some(message),
        severity: VulnerabilitySeverity::Low,
        cve: None,
        affected_version: None,
        patched_versions: vec![],
    })
}

/// Calculate security score based on vulnerabilities
///
/// Score calculation:
/// - Start with 100
/// - Subtract impact for each vulnerability based on severity
/// - Minimum score is 0
fn calculate_security_score(vulnerabilities: &[Vulnerability]) -> u8 {
    let total_impact: u32 = vulnerabilities
        .iter()
        .map(|v| v.severity.score_impact() as u32)
        .sum();

    100u8.saturating_sub(total_impact as u8)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vulnerability_severity_score_impact() {
        assert_eq!(VulnerabilitySeverity::Critical.score_impact(), 30);
        assert_eq!(VulnerabilitySeverity::High.score_impact(), 20);
        assert_eq!(VulnerabilitySeverity::Medium.score_impact(), 10);
        assert_eq!(VulnerabilitySeverity::Low.score_impact(), 5);
        assert_eq!(VulnerabilitySeverity::None.score_impact(), 0);
    }

    #[test]
    fn test_vulnerability_severity_from_audit_severity() {
        assert_eq!(
            VulnerabilitySeverity::from_audit_severity("critical"),
            VulnerabilitySeverity::Critical
        );
        assert_eq!(
            VulnerabilitySeverity::from_audit_severity("high"),
            VulnerabilitySeverity::High
        );
        assert_eq!(
            VulnerabilitySeverity::from_audit_severity("medium"),
            VulnerabilitySeverity::Medium
        );
        assert_eq!(
            VulnerabilitySeverity::from_audit_severity("moderate"),
            VulnerabilitySeverity::Medium
        );
        assert_eq!(
            VulnerabilitySeverity::from_audit_severity("low"),
            VulnerabilitySeverity::Low
        );
        assert_eq!(
            VulnerabilitySeverity::from_audit_severity("unknown"),
            VulnerabilitySeverity::None
        );
    }

    #[test]
    fn test_calculate_security_score_no_vulnerabilities() {
        let vulnerabilities = vec![];
        let score = calculate_security_score(&vulnerabilities);
        assert_eq!(score, 100);
    }

    #[test]
    fn test_calculate_security_score_with_vulnerabilities() {
        let vulnerabilities = vec![
            Vulnerability {
                id: "RUSTSEC-2021-0001".to_string(),
                package: "test-package".to_string(),
                title: "Test vulnerability".to_string(),
                description: None,
                severity: VulnerabilitySeverity::High, // -20
                cve: None,
                affected_version: None,
                patched_versions: vec![],
            },
            Vulnerability {
                id: "RUSTSEC-2021-0002".to_string(),
                package: "another-package".to_string(),
                title: "Another vulnerability".to_string(),
                description: None,
                severity: VulnerabilitySeverity::Medium, // -10
                cve: None,
                affected_version: None,
                patched_versions: vec![],
            },
        ];

        let score = calculate_security_score(&vulnerabilities);
        assert_eq!(score, 70); // 100 - 20 - 10 = 70
    }

    #[test]
    fn test_calculate_security_score_saturating() {
        let vulnerabilities = vec![
            Vulnerability {
                id: "RUSTSEC-1".to_string(),
                package: "pkg".to_string(),
                title: "Critical".to_string(),
                description: None,
                severity: VulnerabilitySeverity::Critical, // -30
                cve: None,
                affected_version: None,
                patched_versions: vec![],
            },
            Vulnerability {
                id: "RUSTSEC-2".to_string(),
                package: "pkg".to_string(),
                title: "Critical".to_string(),
                description: None,
                severity: VulnerabilitySeverity::Critical, // -30
                cve: None,
                affected_version: None,
                patched_versions: vec![],
            },
            Vulnerability {
                id: "RUSTSEC-3".to_string(),
                package: "pkg".to_string(),
                title: "Critical".to_string(),
                description: None,
                severity: VulnerabilitySeverity::Critical, // -30
                cve: None,
                affected_version: None,
                patched_versions: vec![],
            },
            Vulnerability {
                id: "RUSTSEC-4".to_string(),
                package: "pkg".to_string(),
                title: "Critical".to_string(),
                description: None,
                severity: VulnerabilitySeverity::Critical, // -30
                cve: None,
                affected_version: None,
                patched_versions: vec![],
            },
        ];

        let score = calculate_security_score(&vulnerabilities);
        assert_eq!(score, 0); // 100 - 120 = 0 (saturated)
    }

    #[test]
    fn test_security_audit_result_serialization() {
        let result = SecurityAuditResult {
            score: 85,
            vulnerabilities: vec![],
            critical_count: 0,
            high_count: 0,
            medium_count: 1,
            low_count: 2,
            passed: true,
        };

        let json = serde_json::to_value(&result).unwrap();
        assert_eq!(json["score"], 85);
        assert_eq!(json["passed"], true);

        let deserialized: SecurityAuditResult = serde_json::from_value(json).unwrap();
        assert_eq!(deserialized.score, 85);
        assert_eq!(deserialized.medium_count, 1);
    }

    #[test]
    fn test_vulnerability_serialization() {
        let vuln = Vulnerability {
            id: "RUSTSEC-2021-0001".to_string(),
            package: "test-package".to_string(),
            title: "Test vulnerability".to_string(),
            description: Some("Description".to_string()),
            severity: VulnerabilitySeverity::High,
            cve: Some("CVE-2021-1234".to_string()),
            affected_version: Some("1.0.0".to_string()),
            patched_versions: vec!["1.0.1".to_string()],
        };

        let json = serde_json::to_value(&vuln).unwrap();
        assert_eq!(json["id"], "RUSTSEC-2021-0001");
        assert_eq!(json["package"], "test-package");
        assert_eq!(json["severity"], "High");

        let deserialized: Vulnerability = serde_json::from_value(json).unwrap();
        assert_eq!(deserialized.id, "RUSTSEC-2021-0001");
        assert_eq!(deserialized.severity, VulnerabilitySeverity::High);
    }

    #[test]
    fn test_parse_audit_output_empty() {
        let empty_output = r#"{}"#;
        let vulnerabilities = parse_audit_output(empty_output).unwrap();
        assert_eq!(vulnerabilities.len(), 0);
    }

    #[test]
    fn test_parse_audit_output_no_vulnerabilities() {
        let output = r#"{"vulnerabilities":{"list":[]},"warnings":[]}"#;
        let vulnerabilities = parse_audit_output(output).unwrap();
        assert_eq!(vulnerabilities.len(), 0);
    }
}
