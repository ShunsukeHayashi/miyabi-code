//! Server configuration

use clap::Parser;
use serde::{Deserialize, Serialize};
use std::net::{IpAddr, Ipv4Addr};
use std::path::PathBuf;

use crate::error::{Result, ServerError};

/// MCP Server configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfig {
    /// GitHub API token
    pub github_token: String,

    /// Repository owner
    pub repo_owner: String,

    /// Repository name
    pub repo_name: String,

    /// Anthropic API key (optional, for AI-driven agents)
    pub anthropic_api_key: Option<String>,

    /// Working directory
    pub working_dir: PathBuf,

    /// Device identifier (optional)
    pub device_identifier: Option<String>,

    /// Transport mode
    pub transport: TransportMode,

    /// HTTP server host (only for HTTP transport)
    pub http_host: IpAddr,

    /// HTTP server port (only for HTTP transport)
    pub http_port: u16,
}

/// Transport mode for MCP server
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TransportMode {
    /// Standard input/output (default)
    Stdio,
    /// HTTP server
    Http,
}

impl Default for TransportMode {
    fn default() -> Self {
        TransportMode::Stdio
    }
}

/// CLI arguments for MCP server
#[derive(Debug, Parser)]
#[command(name = "miyabi-mcp-server")]
#[command(about = "MCP (Model Context Protocol) Server for Miyabi", long_about = None)]
pub struct ServerArgs {
    /// Transport mode: stdio (default) or http
    #[arg(short, long, default_value = "stdio")]
    pub transport: String,

    /// HTTP server host (only for HTTP transport)
    #[arg(long, default_value = "127.0.0.1")]
    pub host: String,

    /// HTTP server port (only for HTTP transport)
    #[arg(long, default_value = "3030")]
    pub port: u16,

    /// GitHub token (can also be set via GITHUB_TOKEN env var)
    #[arg(long, env = "GITHUB_TOKEN")]
    pub github_token: Option<String>,

    /// Repository owner (can also be set via MIYABI_REPO_OWNER env var)
    #[arg(long, env = "MIYABI_REPO_OWNER")]
    pub repo_owner: Option<String>,

    /// Repository name (can also be set via MIYABI_REPO_NAME env var)
    #[arg(long, env = "MIYABI_REPO_NAME")]
    pub repo_name: Option<String>,

    /// Anthropic API key (can also be set via ANTHROPIC_API_KEY env var)
    #[arg(long, env = "ANTHROPIC_API_KEY")]
    pub anthropic_api_key: Option<String>,

    /// Working directory (defaults to current directory)
    #[arg(long)]
    pub working_dir: Option<PathBuf>,

    /// Device identifier (can also be set via DEVICE_IDENTIFIER env var)
    #[arg(long, env = "DEVICE_IDENTIFIER")]
    pub device_identifier: Option<String>,
}

impl ServerConfig {
    /// Create configuration from CLI arguments
    pub fn from_args(args: ServerArgs) -> Result<Self> {
        let transport = match args.transport.as_str() {
            "stdio" => TransportMode::Stdio,
            "http" => {
                #[cfg(feature = "http")]
                {
                    TransportMode::Http
                }
                #[cfg(not(feature = "http"))]
                {
                    return Err(ServerError::Config(
                        "HTTP transport requires 'http' feature to be enabled".to_string(),
                    ));
                }
            }
            _ => {
                return Err(ServerError::Config(format!(
                    "Invalid transport mode: {}. Must be 'stdio' or 'http'",
                    args.transport
                )))
            }
        };

        let github_token = args.github_token.ok_or_else(|| {
            ServerError::Config("GITHUB_TOKEN is required (via --github-token or env var)".to_string())
        })?;

        let repo_owner = args.repo_owner.ok_or_else(|| {
            ServerError::Config(
                "MIYABI_REPO_OWNER is required (via --repo-owner or env var)".to_string(),
            )
        })?;

        let repo_name = args.repo_name.ok_or_else(|| {
            ServerError::Config(
                "MIYABI_REPO_NAME is required (via --repo-name or env var)".to_string(),
            )
        })?;

        let working_dir = args
            .working_dir
            .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));

        let http_host: IpAddr = args
            .host
            .parse()
            .map_err(|_| ServerError::Config(format!("Invalid host: {}", args.host)))?;

        let config = Self {
            github_token,
            repo_owner,
            repo_name,
            anthropic_api_key: args.anthropic_api_key,
            working_dir,
            device_identifier: args.device_identifier,
            transport,
            http_host,
            http_port: args.port,
        };

        config.validate()?;
        Ok(config)
    }

    /// Validate configuration
    pub fn validate(&self) -> Result<()> {
        if self.github_token.is_empty() {
            return Err(ServerError::Config("GitHub token is empty".to_string()));
        }

        if self.repo_owner.is_empty() {
            return Err(ServerError::Config("Repository owner is empty".to_string()));
        }

        if self.repo_name.is_empty() {
            return Err(ServerError::Config("Repository name is empty".to_string()));
        }

        if !self.working_dir.exists() {
            return Err(ServerError::Config(format!(
                "Working directory does not exist: {}",
                self.working_dir.display()
            )));
        }

        Ok(())
    }
}

impl Default for ServerConfig {
    fn default() -> Self {
        Self {
            github_token: String::new(),
            repo_owner: String::new(),
            repo_name: String::new(),
            anthropic_api_key: None,
            working_dir: PathBuf::from("."),
            device_identifier: None,
            transport: TransportMode::default(),
            http_host: IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1)),
            http_port: 3030,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transport_mode_default() {
        assert_eq!(TransportMode::default(), TransportMode::Stdio);
    }

    #[test]
    fn test_config_validation_empty_token() {
        let config = ServerConfig {
            github_token: String::new(),
            repo_owner: "owner".to_string(),
            repo_name: "repo".to_string(),
            ..Default::default()
        };

        assert!(config.validate().is_err());
    }

    #[test]
    fn test_config_validation_empty_owner() {
        let config = ServerConfig {
            github_token: "token".to_string(),
            repo_owner: String::new(),
            repo_name: "repo".to_string(),
            ..Default::default()
        };

        assert!(config.validate().is_err());
    }

    #[test]
    fn test_config_validation_empty_repo() {
        let config = ServerConfig {
            github_token: "token".to_string(),
            repo_owner: "owner".to_string(),
            repo_name: String::new(),
            ..Default::default()
        };

        assert!(config.validate().is_err());
    }
}
