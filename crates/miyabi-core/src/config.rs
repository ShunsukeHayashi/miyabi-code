//! Configuration management for Miyabi
//!
//! Supports multiple configuration sources in order of precedence:
//! 1. Environment variables (highest priority)
//! 2. .miyabi.yml / .miyabi.yaml
//! 3. .miyabi.toml
//! 4. .miyabi.json
//! 5. ~/.miyabi/config.yml (fallback)

use miyabi_types::error::{MiyabiError, Result};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use validator::{Validate, ValidationError};

/// Main configuration structure
#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct Config {
    /// GitHub personal access token
    #[validate(length(min = 1, message = "GitHub token is required"))]
    pub github_token: String,

    /// Device identifier for tracking execution
    #[validate(length(min = 1, message = "Device identifier is required"))]
    pub device_identifier: String,

    /// Log level (trace, debug, info, warn, error)
    #[serde(default = "default_log_level")]
    #[validate(custom(function = "validate_log_level"))]
    pub log_level: String,

    /// Maximum concurrent worktrees
    #[serde(default = "default_concurrency")]
    #[validate(range(min = 1, max = 100, message = "Concurrency must be between 1 and 100"))]
    pub max_concurrency: usize,

    /// Log directory path
    #[serde(default = "default_log_directory")]
    pub log_directory: String,

    /// Report directory path
    #[serde(default = "default_report_directory")]
    pub report_directory: String,

    /// Worktree base path (optional)
    #[serde(
        default,
        skip_serializing_if = "Option::is_none",
        serialize_with = "serde_path::serialize_option",
        deserialize_with = "serde_path::deserialize_option"
    )]
    pub worktree_base_path: Option<PathBuf>,

    /// Tech lead GitHub username (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tech_lead_github_username: Option<String>,

    /// CISO GitHub username (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ciso_github_username: Option<String>,

    /// PO GitHub username (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub po_github_username: Option<String>,
}

mod serde_path {
    use serde::{Deserialize, Deserializer, Serializer};
    use std::path::{Path, PathBuf};

    pub fn serialize_option<S>(
        value: &Option<PathBuf>,
        serializer: S,
    ) -> std::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        match value {
            Some(path) => serializer.serialize_some(&path_to_string(path)),
            None => serializer.serialize_none(),
        }
    }

    pub fn deserialize_option<'de, D>(
        deserializer: D,
    ) -> std::result::Result<Option<PathBuf>, D::Error>
    where
        D: Deserializer<'de>,
    {
        let option = Option::<String>::deserialize(deserializer)?;
        Ok(option.map(PathBuf::from))
    }

    fn path_to_string(path: &Path) -> String {
        path.to_string_lossy().into_owned()
    }
}

// Default value functions
fn default_log_level() -> String {
    "info".to_string()
}

fn default_concurrency() -> usize {
    3
}

fn default_log_directory() -> String {
    "./logs".to_string()
}

fn default_report_directory() -> String {
    "./reports".to_string()
}

// Custom validator for log level
fn validate_log_level(level: &str) -> std::result::Result<(), ValidationError> {
    match level.to_lowercase().as_str() {
        "trace" | "debug" | "info" | "warn" | "error" => Ok(()),
        _ => Err(ValidationError::new(
            "Invalid log level. Must be one of: trace, debug, info, warn, error",
        )),
    }
}

impl Config {
    /// Load configuration from environment or files
    ///
    /// Priority order:
    /// 1. Environment variables
    /// 2. .miyabi.yml/.miyabi.yaml (current directory)
    /// 3. .miyabi.toml (current directory)
    /// 4. .miyabi.json (current directory)
    /// 5. ~/.miyabi/config.yml (home directory)
    pub fn load() -> Result<Self> {
        // Try environment variables first
        if let Some(config) = Self::from_env()? {
            config.validate().map_err(|e| {
                MiyabiError::Config(format!("Configuration validation failed: {}", e))
            })?;
            return Ok(config);
        }

        // Try loading from files in order
        let config_paths = Self::config_file_paths();
        for path in config_paths {
            if path.exists() {
                match Self::from_file(&path) {
                    Ok(config) => {
                        config.validate().map_err(|e| {
                            MiyabiError::Config(format!("Configuration validation failed: {}", e))
                        })?;
                        return Ok(config);
                    }
                    Err(e) => {
                        tracing::warn!("Failed to load config from {:?}: {}", path, e);
                        continue;
                    }
                }
            }
        }

        Err(MiyabiError::Config(
            "No configuration found. Set GITHUB_TOKEN environment variable or create .miyabi.yml"
                .to_string(),
        ))
    }

    /// Load configuration from environment variables
    fn from_env() -> Result<Option<Self>> {
        let token = match std::env::var("GITHUB_TOKEN") {
            Ok(t) => t,
            Err(_) => return Ok(None),
        };

        Ok(Some(Self {
            github_token: token,
            device_identifier: std::env::var("DEVICE_IDENTIFIER")
                .unwrap_or_else(|_| hostname::get().unwrap().to_string_lossy().to_string()),
            log_level: std::env::var("MIYABI_LOG_LEVEL").unwrap_or_else(|_| default_log_level()),
            max_concurrency: std::env::var("MIYABI_MAX_CONCURRENCY")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or_else(default_concurrency),
            log_directory: std::env::var("MIYABI_LOG_DIRECTORY")
                .unwrap_or_else(|_| default_log_directory()),
            report_directory: std::env::var("MIYABI_REPORT_DIRECTORY")
                .unwrap_or_else(|_| default_report_directory()),
            worktree_base_path: std::env::var("MIYABI_WORKTREE_BASE_PATH")
                .ok()
                .map(PathBuf::from),
            tech_lead_github_username: std::env::var("TECH_LEAD_GITHUB_USERNAME").ok(),
            ciso_github_username: std::env::var("CISO_GITHUB_USERNAME").ok(),
            po_github_username: std::env::var("PO_GITHUB_USERNAME").ok(),
        }))
    }

    /// Load configuration from a file
    ///
    /// Supports YAML, TOML, and JSON formats based on file extension
    pub fn from_file(path: impl AsRef<Path>) -> Result<Self> {
        let path = path.as_ref();
        let content = std::fs::read_to_string(path).map_err(|e| {
            MiyabiError::Config(format!("Failed to read config file {:?}: {}", path, e))
        })?;

        let config = match path.extension().and_then(|s| s.to_str()) {
            Some("yml") | Some("yaml") => serde_yaml::from_str(&content)
                .map_err(|e| MiyabiError::Config(format!("Failed to parse YAML config: {}", e)))?,
            Some("toml") => toml::from_str(&content)
                .map_err(|e| MiyabiError::Config(format!("Failed to parse TOML config: {}", e)))?,
            Some("json") => serde_json::from_str(&content)
                .map_err(|e| MiyabiError::Config(format!("Failed to parse JSON config: {}", e)))?,
            _ => {
                return Err(MiyabiError::Config(format!(
                    "Unsupported config file extension: {:?}",
                    path
                )))
            }
        };

        Ok(config)
    }

    /// Get list of config file paths to check in order
    fn config_file_paths() -> Vec<PathBuf> {
        let mut paths = vec![
            PathBuf::from(".miyabi.yml"),
            PathBuf::from(".miyabi.yaml"),
            PathBuf::from(".miyabi.toml"),
            PathBuf::from(".miyabi.json"),
        ];

        // Add home directory config if available
        if let Some(home_dir) = dirs::home_dir() {
            paths.push(home_dir.join(".miyabi").join("config.yml"));
        }

        paths
    }

    /// Save configuration to a file
    pub fn save(&self, path: impl AsRef<Path>) -> Result<()> {
        let path = path.as_ref();
        let content = match path.extension().and_then(|s| s.to_str()) {
            Some("yml") | Some("yaml") => serde_yaml::to_string(self).map_err(|e| {
                MiyabiError::Config(format!("Failed to serialize YAML config: {}", e))
            })?,
            Some("toml") => toml::to_string(self).map_err(|e| {
                MiyabiError::Config(format!("Failed to serialize TOML config: {}", e))
            })?,
            Some("json") => serde_json::to_string_pretty(self).map_err(|e| {
                MiyabiError::Config(format!("Failed to serialize JSON config: {}", e))
            })?,
            _ => {
                return Err(MiyabiError::Config(format!(
                    "Unsupported config file extension: {:?}",
                    path
                )))
            }
        };

        std::fs::write(path, content).map_err(|e| {
            MiyabiError::Config(format!("Failed to write config file {:?}: {}", path, e))
        })?;

        Ok(())
    }
}

impl Default for Config {
    fn default() -> Self {
        Self {
            github_token: String::new(),
            device_identifier: hostname::get().unwrap().to_string_lossy().to_string(),
            log_level: default_log_level(),
            max_concurrency: default_concurrency(),
            log_directory: default_log_directory(),
            report_directory: default_report_directory(),
            worktree_base_path: None,
            tech_lead_github_username: None,
            ciso_github_username: None,
            po_github_username: None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serial_test::serial;
    use std::env;
    use tempfile::NamedTempFile;

    // ========================================================================
    // Config Creation Tests
    // ========================================================================

    #[test]
    fn test_config_default() {
        let config = Config::default();
        assert_eq!(config.log_level, "info");
        assert_eq!(config.max_concurrency, 3);
        assert_eq!(config.log_directory, "./logs");
        assert_eq!(config.report_directory, "./reports");
    }

    #[test]
    fn test_config_validation_valid() {
        let config = Config {
            github_token: "ghp_test123".to_string(),
            device_identifier: "test-device".to_string(),
            log_level: "debug".to_string(),
            max_concurrency: 5,
            log_directory: "./logs".to_string(),
            report_directory: "./reports".to_string(),
            worktree_base_path: None,
            tech_lead_github_username: None,
            ciso_github_username: None,
            po_github_username: None,
        };

        assert!(config.validate().is_ok());
    }

    #[test]
    fn test_config_validation_invalid_token() {
        let config = Config {
            github_token: String::new(),
            device_identifier: "test-device".to_string(),
            log_level: "info".to_string(),
            max_concurrency: 3,
            log_directory: "./logs".to_string(),
            report_directory: "./reports".to_string(),
            worktree_base_path: None,
            tech_lead_github_username: None,
            ciso_github_username: None,
            po_github_username: None,
        };

        assert!(config.validate().is_err());
    }

    #[test]
    fn test_config_validation_invalid_log_level() {
        let config = Config {
            github_token: "ghp_test".to_string(),
            device_identifier: "test-device".to_string(),
            log_level: "invalid".to_string(),
            max_concurrency: 3,
            log_directory: "./logs".to_string(),
            report_directory: "./reports".to_string(),
            worktree_base_path: None,
            tech_lead_github_username: None,
            ciso_github_username: None,
            po_github_username: None,
        };

        assert!(config.validate().is_err());
    }

    #[test]
    fn test_config_validation_invalid_concurrency() {
        let config = Config {
            github_token: "ghp_test".to_string(),
            device_identifier: "test-device".to_string(),
            log_level: "info".to_string(),
            max_concurrency: 0,
            log_directory: "./logs".to_string(),
            report_directory: "./reports".to_string(),
            worktree_base_path: None,
            tech_lead_github_username: None,
            ciso_github_username: None,
            po_github_username: None,
        };

        assert!(config.validate().is_err());
    }

    // ========================================================================
    // File Loading Tests
    // ========================================================================

    #[test]
    fn test_config_from_yaml() {
        let yaml_content = r#"
github_token: ghp_yaml_test
device_identifier: yaml-device
log_level: debug
max_concurrency: 5
log_directory: ./yaml-logs
report_directory: ./yaml-reports
"#;

        let mut temp_file = NamedTempFile::new().unwrap();
        use std::io::Write;
        temp_file.write_all(yaml_content.as_bytes()).unwrap();
        let path = temp_file.path().with_extension("yml");
        std::fs::copy(temp_file.path(), &path).unwrap();

        let config = Config::from_file(&path).unwrap();
        assert_eq!(config.github_token, "ghp_yaml_test");
        assert_eq!(config.device_identifier, "yaml-device");
        assert_eq!(config.log_level, "debug");
        assert_eq!(config.max_concurrency, 5);

        std::fs::remove_file(&path).ok();
    }

    #[test]
    fn test_config_from_toml() {
        let toml_content = r#"
github_token = "ghp_toml_test"
device_identifier = "toml-device"
log_level = "warn"
max_concurrency = 4
log_directory = "./toml-logs"
report_directory = "./toml-reports"
"#;

        let mut temp_file = NamedTempFile::new().unwrap();
        use std::io::Write;
        temp_file.write_all(toml_content.as_bytes()).unwrap();
        let path = temp_file.path().with_extension("toml");
        std::fs::copy(temp_file.path(), &path).unwrap();

        let config = Config::from_file(&path).unwrap();
        assert_eq!(config.github_token, "ghp_toml_test");
        assert_eq!(config.device_identifier, "toml-device");
        assert_eq!(config.log_level, "warn");
        assert_eq!(config.max_concurrency, 4);

        std::fs::remove_file(&path).ok();
    }

    #[test]
    fn test_config_from_json() {
        let json_content = r#"{
  "github_token": "ghp_json_test",
  "device_identifier": "json-device",
  "log_level": "error",
  "max_concurrency": 2,
  "log_directory": "./json-logs",
  "report_directory": "./json-reports"
}"#;

        let mut temp_file = NamedTempFile::new().unwrap();
        use std::io::Write;
        temp_file.write_all(json_content.as_bytes()).unwrap();
        let path = temp_file.path().with_extension("json");
        std::fs::copy(temp_file.path(), &path).unwrap();

        let config = Config::from_file(&path).unwrap();
        assert_eq!(config.github_token, "ghp_json_test");
        assert_eq!(config.device_identifier, "json-device");
        assert_eq!(config.log_level, "error");
        assert_eq!(config.max_concurrency, 2);

        std::fs::remove_file(&path).ok();
    }

    #[test]
    fn test_config_from_file_invalid_extension() {
        let temp_file = NamedTempFile::new().unwrap();
        let path = temp_file.path().with_extension("txt");
        std::fs::write(&path, "invalid").ok();

        let result = Config::from_file(&path);
        assert!(result.is_err());

        std::fs::remove_file(&path).ok();
    }

    // ========================================================================
    // Environment Variable Tests
    // ========================================================================

    #[test]
    #[serial]
    fn test_config_from_env() {
        env::set_var("GITHUB_TOKEN", "ghp_env_test");
        env::set_var("DEVICE_IDENTIFIER", "env-device");
        env::set_var("MIYABI_LOG_LEVEL", "trace");
        env::set_var("MIYABI_MAX_CONCURRENCY", "10");

        let config = Config::from_env().unwrap().unwrap();
        assert_eq!(config.github_token, "ghp_env_test");
        assert_eq!(config.device_identifier, "env-device");
        assert_eq!(config.log_level, "trace");
        assert_eq!(config.max_concurrency, 10);

        env::remove_var("GITHUB_TOKEN");
        env::remove_var("DEVICE_IDENTIFIER");
        env::remove_var("MIYABI_LOG_LEVEL");
        env::remove_var("MIYABI_MAX_CONCURRENCY");
    }

    #[test]
    #[serial]
    fn test_config_from_env_missing_token() {
        env::remove_var("GITHUB_TOKEN");
        let result = Config::from_env().unwrap();
        assert!(result.is_none());
    }

    // ========================================================================
    // Roundtrip Tests
    // ========================================================================

    #[test]
    fn test_config_save_load_yaml_roundtrip() {
        let original = Config {
            github_token: "ghp_roundtrip".to_string(),
            device_identifier: "roundtrip-device".to_string(),
            log_level: "info".to_string(),
            max_concurrency: 7,
            log_directory: "./logs".to_string(),
            report_directory: "./reports".to_string(),
            worktree_base_path: Some(PathBuf::from("/tmp/worktrees")),
            tech_lead_github_username: Some("tech-lead".to_string()),
            ciso_github_username: None,
            po_github_username: Some("po".to_string()),
        };

        let temp_file = NamedTempFile::new().unwrap();
        let path = temp_file.path().with_extension("yml");

        original.save(&path).unwrap();
        let loaded = Config::from_file(&path).unwrap();

        assert_eq!(original.github_token, loaded.github_token);
        assert_eq!(original.device_identifier, loaded.device_identifier);
        assert_eq!(original.max_concurrency, loaded.max_concurrency);
        assert_eq!(original.worktree_base_path, loaded.worktree_base_path);

        std::fs::remove_file(&path).ok();
    }
}
