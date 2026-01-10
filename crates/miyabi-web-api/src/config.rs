//! Configuration management

use serde::Deserialize;
use std::env;
use std::time::Duration;

/// Database connection pool configuration
#[derive(Debug, Clone)]
pub struct DatabasePoolConfig {
    /// Maximum number of connections in the pool
    pub max_connections: u32,
    /// Minimum number of idle connections to maintain
    pub min_connections: u32,
    /// Timeout for acquiring a connection from the pool
    pub acquire_timeout: Duration,
    /// Maximum idle time for a connection before it's closed
    pub idle_timeout: Option<Duration>,
    /// Maximum lifetime of a connection before it's closed
    pub max_lifetime: Option<Duration>,
    /// Test connections before acquiring them
    pub test_before_acquire: bool,
}

impl DatabasePoolConfig {
    /// Create configuration optimized for production environment
    ///
    /// - High connection limit for Lambda concurrency
    /// - Warm connection pool to reduce latency
    /// - Longer timeouts for stability
    pub fn production() -> Self {
        Self {
            max_connections: 100,
            min_connections: 10,
            acquire_timeout: Duration::from_secs(30),
            idle_timeout: Some(Duration::from_secs(600)), // 10 minutes
            max_lifetime: Some(Duration::from_secs(1800)), // 30 minutes
            test_before_acquire: true,
        }
    }

    /// Create configuration optimized for development environment
    ///
    /// - Lower connection limit to avoid overwhelming local DB
    /// - Shorter timeouts for faster feedback
    pub fn development() -> Self {
        Self {
            max_connections: 20,
            min_connections: 5,
            acquire_timeout: Duration::from_secs(10),
            idle_timeout: Some(Duration::from_secs(300)), // 5 minutes
            max_lifetime: Some(Duration::from_secs(900)), // 15 minutes
            test_before_acquire: false,
        }
    }

    /// Create configuration optimized for test environment
    ///
    /// - Minimal connections to avoid test interference
    /// - Short timeouts for fast test execution
    pub fn test() -> Self {
        Self {
            max_connections: 5,
            min_connections: 1,
            acquire_timeout: Duration::from_secs(5),
            idle_timeout: Some(Duration::from_secs(60)), // 1 minute
            max_lifetime: Some(Duration::from_secs(300)), // 5 minutes
            test_before_acquire: false,
        }
    }

    /// Create configuration from environment variables
    ///
    /// Falls back to environment-specific defaults if variables are not set
    pub fn from_env(environment: &str) -> Self {
        let base_config = match environment {
            "production" => Self::production(),
            "test" => Self::test(),
            _ => Self::development(),
        };

        Self {
            max_connections: env::var("DB_MAX_CONNECTIONS")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(base_config.max_connections),
            min_connections: env::var("DB_MIN_CONNECTIONS")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(base_config.min_connections),
            acquire_timeout: env::var("DB_ACQUIRE_TIMEOUT_SECS")
                .ok()
                .and_then(|s| s.parse().ok())
                .map(Duration::from_secs)
                .unwrap_or(base_config.acquire_timeout),
            idle_timeout: env::var("DB_IDLE_TIMEOUT_SECS")
                .ok()
                .and_then(|s| s.parse().ok())
                .map(Duration::from_secs)
                .or(base_config.idle_timeout),
            max_lifetime: env::var("DB_MAX_LIFETIME_SECS")
                .ok()
                .and_then(|s| s.parse().ok())
                .map(Duration::from_secs)
                .or(base_config.max_lifetime),
            test_before_acquire: env::var("DB_TEST_BEFORE_ACQUIRE")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(base_config.test_before_acquire),
        }
    }
}

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
    /// Database pool configuration (not deserializable, created from environment)
    #[serde(skip)]
    pub database_pool: Option<DatabasePoolConfig>,
    /// Redis URL for token blacklist (optional)
    #[serde(skip)]
    pub redis_url: Option<String>,
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

        // DATABASE_URL is required for PostgreSQL connection
        // For local development, use: postgresql://miyabi_admin:miyabi_local_dev@localhost:5432/miyabi
        let database_url = env::var("DATABASE_URL").map_err(|_| {
            "DATABASE_URL environment variable is required.\n\
             Example: DATABASE_URL=postgresql://user:password@host:5432/database\n\
             For local development: DATABASE_URL=postgresql://miyabi_admin:miyabi_local_dev@localhost:5432/miyabi"
                .to_string()
        })?;

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

        // Optional Redis URL
        let redis_url = env::var("REDIS_URL").ok();

        // Create database pool configuration based on environment
        let database_pool = Some(DatabasePoolConfig::from_env(&environment));

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
            database_pool,
            redis_url,
        })
    }

    /// Get database pool configuration
    ///
    /// Returns the configured pool settings, or creates default settings for the environment
    pub fn database_pool(&self) -> DatabasePoolConfig {
        self.database_pool
            .clone()
            .unwrap_or_else(|| DatabasePoolConfig::from_env(&self.environment))
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
            database_pool: None,
        };

        assert!(config.is_production());
        assert!(!config.is_development());
    }

    #[test]
    fn test_database_pool_configs() {
        // Test production config
        let prod_config = DatabasePoolConfig::production();
        assert_eq!(prod_config.max_connections, 100);
        assert_eq!(prod_config.min_connections, 10);
        assert!(prod_config.test_before_acquire);

        // Test development config
        let dev_config = DatabasePoolConfig::development();
        assert_eq!(dev_config.max_connections, 20);
        assert_eq!(dev_config.min_connections, 5);
        assert!(!dev_config.test_before_acquire);

        // Test test config
        let test_config = DatabasePoolConfig::test();
        assert_eq!(test_config.max_connections, 5);
        assert_eq!(test_config.min_connections, 1);
        assert!(!test_config.test_before_acquire);
    }

    #[test]
    fn test_pool_config_from_env() {
        // Test production environment
        let prod_pool = DatabasePoolConfig::from_env("production");
        assert_eq!(prod_pool.max_connections, 100);

        // Test development environment
        let dev_pool = DatabasePoolConfig::from_env("development");
        assert_eq!(dev_pool.max_connections, 20);

        // Test test environment
        let test_pool = DatabasePoolConfig::from_env("test");
        assert_eq!(test_pool.max_connections, 5);

        // Test unknown environment (defaults to development)
        let unknown_pool = DatabasePoolConfig::from_env("staging");
        assert_eq!(unknown_pool.max_connections, 20);
    }
}
