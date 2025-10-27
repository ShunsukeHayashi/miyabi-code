//! Configuration management

use serde::Deserialize;
use std::env;

/// Application configuration
#[derive(Debug, Clone, Deserialize)]
pub struct AppConfig {
    /// Database connection URL
    pub database_url: String,
    /// Server address (e.g., "0.0.0.0:8080")
    pub server_address: String,
    /// JWT secret for token signing
    pub jwt_secret: String,
    /// GitHub OAuth client ID
    pub github_client_id: String,
    /// GitHub OAuth client secret
    pub github_client_secret: String,
    /// GitHub OAuth callback URL
    pub github_callback_url: String,
    /// Frontend URL for CORS and redirects
    pub frontend_url: String,
    /// JWT token expiration in seconds (default: 3600)
    #[serde(default = "default_jwt_expiration")]
    pub jwt_expiration: i64,
    /// Refresh token expiration in seconds (default: 604800 = 7 days)
    #[serde(default = "default_refresh_expiration")]
    pub refresh_expiration: i64,
    /// Environment (development, staging, production)
    #[serde(default = "default_environment")]
    pub environment: String,
}

fn default_jwt_expiration() -> i64 {
    3600 // 1 hour
}

fn default_refresh_expiration() -> i64 {
    604800 // 7 days
}

fn default_environment() -> String {
    "development".to_string()
}

impl AppConfig {
    /// Load configuration from environment variables
    ///
    /// # Errors
    ///
    /// Returns error if required environment variables are missing
    pub fn from_env() -> Result<Self, String> {
        // Load .env file if it exists
        dotenvy::dotenv().ok();

        // TEMPORARY: Make database optional for Telegram-only deployment
        // TODO: Replace with Firebase/Firestore from scratch
        let database_url = env::var("DATABASE_URL").unwrap_or_else(|_| {
            eprintln!("WARNING: DATABASE_URL not set, using dummy value");
            "postgresql://dummy:dummy@localhost:5432/dummy".to_string()
        });

        let server_address =
            env::var("SERVER_ADDRESS").unwrap_or_else(|_| "0.0.0.0:8080".to_string());

        let jwt_secret = env::var("JWT_SECRET")
            .map_err(|_| "JWT_SECRET environment variable is required".to_string())?;

        let github_client_id = env::var("GITHUB_CLIENT_ID")
            .map_err(|_| "GITHUB_CLIENT_ID environment variable is required".to_string())?;

        let github_client_secret = env::var("GITHUB_CLIENT_SECRET")
            .map_err(|_| "GITHUB_CLIENT_SECRET environment variable is required".to_string())?;

        let github_callback_url = env::var("GITHUB_CALLBACK_URL")
            .unwrap_or_else(|_| "http://localhost:8080/api/v1/auth/github/callback".to_string());

        let frontend_url =
            env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:3000".to_string());

        let jwt_expiration = env::var("JWT_EXPIRATION")
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or_else(default_jwt_expiration);

        let refresh_expiration = env::var("REFRESH_EXPIRATION")
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or_else(default_refresh_expiration);

        let environment = env::var("ENVIRONMENT").unwrap_or_else(|_| default_environment());

        Ok(Self {
            database_url,
            server_address,
            jwt_secret,
            github_client_id,
            github_client_secret,
            github_callback_url,
            frontend_url,
            jwt_expiration,
            refresh_expiration,
            environment,
        })
    }

    /// Check if running in production environment
    pub fn is_production(&self) -> bool {
        self.environment == "production"
    }

    /// Check if running in development environment
    pub fn is_development(&self) -> bool {
        self.environment == "development"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_values() {
        assert_eq!(default_jwt_expiration(), 3600);
        assert_eq!(default_refresh_expiration(), 604800);
        assert_eq!(default_environment(), "development");
    }

    #[test]
    fn test_environment_checks() {
        let config = AppConfig {
            database_url: "postgres://localhost/test".to_string(),
            server_address: "0.0.0.0:8080".to_string(),
            jwt_secret: "test-secret".to_string(),
            github_client_id: "test-client-id".to_string(),
            github_client_secret: "test-client-secret".to_string(),
            github_callback_url: "http://localhost:8080/callback".to_string(),
            frontend_url: "http://localhost:3000".to_string(),
            jwt_expiration: 3600,
            refresh_expiration: 604800,
            environment: "production".to_string(),
        };

        assert!(config.is_production());
        assert!(!config.is_development());
    }
}
