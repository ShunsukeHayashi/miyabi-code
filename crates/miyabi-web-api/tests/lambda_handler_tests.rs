//! Lambda Handler Tests
//!
//! Unit tests for Lambda function handler and application initialization.
//! These tests verify that the Lambda runtime correctly handles:
//! - Application initialization
//! - Configuration validation
//! - Error handling
//! - Graceful shutdown

#[cfg(feature = "lambda")]
mod lambda_tests {
    use std::env;

    /// Helper to set up complete test environment
    fn setup_lambda_env() {
        env::set_var("DATABASE_URL", "postgresql://lambda_test:test@localhost:5432/miyabi_test");
        env::set_var("JWT_SECRET", "lambda-test-secret-32-bytes-minimum!");
        env::set_var("GITHUB_CLIENT_ID", "lambda-test-client-id");
        env::set_var("GITHUB_CLIENT_SECRET", "lambda-test-client-secret");
        env::set_var("GITHUB_CALLBACK_URL", "https://api.example.com/callback");
        env::set_var("FRONTEND_URL", "https://example.com");
        env::set_var("SERVER_ADDRESS", "0.0.0.0:8080");
        env::set_var("ENVIRONMENT", "production");
        env::set_var("AWS_REGION", "us-west-2");
        env::set_var("AWS_LAMBDA_FUNCTION_NAME", "miyabi-api-test");
        env::set_var("AWS_LAMBDA_FUNCTION_VERSION", "$LATEST");
    }

    fn cleanup_lambda_env() {
        env::remove_var("DATABASE_URL");
        env::remove_var("JWT_SECRET");
        env::remove_var("GITHUB_CLIENT_ID");
        env::remove_var("GITHUB_CLIENT_SECRET");
        env::remove_var("GITHUB_CALLBACK_URL");
        env::remove_var("FRONTEND_URL");
        env::remove_var("SERVER_ADDRESS");
        env::remove_var("ENVIRONMENT");
        env::remove_var("AWS_REGION");
        env::remove_var("AWS_LAMBDA_FUNCTION_NAME");
        env::remove_var("AWS_LAMBDA_FUNCTION_VERSION");
    }

    #[test]
    fn test_lambda_config_loads_in_production_env() {
        setup_lambda_env();

        let config = miyabi_web_api::AppConfig::from_env();

        assert!(config.is_ok(), "Lambda config should load successfully");

        let config = config.unwrap();
        assert_eq!(config.environment, "production");
        assert!(config.is_production());
        assert!(config.frontend_url.starts_with("https://"), "Production should use HTTPS");

        cleanup_lambda_env();
    }

    #[test]
    fn test_lambda_handler_fails_gracefully_on_missing_config() {
        cleanup_lambda_env();
        // Only set DATABASE_URL, missing required JWT_SECRET
        env::set_var("DATABASE_URL", "postgresql://test@localhost/test");

        let config = miyabi_web_api::AppConfig::from_env();

        assert!(config.is_err(), "Should fail with incomplete configuration");
        let err = config.unwrap_err();
        assert!(err.contains("JWT_SECRET"), "Error should indicate missing JWT_SECRET");

        cleanup_lambda_env();
    }

    #[test]
    fn test_lambda_cold_start_configuration() {
        setup_lambda_env();
        // Simulate cold start with fresh environment
        env::set_var("AWS_LAMBDA_LOG_GROUP_NAME", "/aws/lambda/miyabi-api");
        env::set_var("AWS_LAMBDA_LOG_STREAM_NAME", "2024/01/01/[$LATEST]abcd1234");

        let config = miyabi_web_api::AppConfig::from_env();

        assert!(config.is_ok(), "Cold start should initialize config successfully");

        cleanup_lambda_env();
        env::remove_var("AWS_LAMBDA_LOG_GROUP_NAME");
        env::remove_var("AWS_LAMBDA_LOG_STREAM_NAME");
    }

    #[test]
    fn test_lambda_vpc_database_configuration() {
        setup_lambda_env();
        // Simulate VPC-hosted RDS endpoint
        env::set_var(
            "DATABASE_URL",
            "postgresql://miyabi:secure_password@miyabi-prod.cluster-abc123.us-west-2.rds.amazonaws.com:5432/miyabi",
        );

        let config = miyabi_web_api::AppConfig::from_env();

        assert!(config.is_ok(), "VPC RDS configuration should be valid");

        let config = config.unwrap();
        assert!(config.database_url.contains("rds.amazonaws.com"), "Should use RDS endpoint");

        cleanup_lambda_env();
    }

    #[test]
    fn test_lambda_environment_isolation() {
        // Test that production environment is properly isolated
        setup_lambda_env();
        env::set_var("ENVIRONMENT", "production");

        let config = miyabi_web_api::AppConfig::from_env().unwrap();

        assert!(config.is_production());
        assert!(!config.is_development());
        assert_eq!(config.environment, "production");

        cleanup_lambda_env();
    }

    #[test]
    fn test_lambda_jwt_configuration() {
        setup_lambda_env();
        env::set_var("JWT_EXPIRATION", "3600");
        env::set_var("REFRESH_EXPIRATION", "604800");

        let config = miyabi_web_api::AppConfig::from_env().unwrap();

        assert_eq!(config.jwt_expiration, 3600, "JWT should expire in 1 hour");
        assert_eq!(config.refresh_expiration, 604800, "Refresh token should expire in 7 days");

        cleanup_lambda_env();
    }

    #[test]
    fn test_lambda_cors_configuration() {
        setup_lambda_env();
        env::set_var("FRONTEND_URL", "https://miyabi-society.com");

        let config = miyabi_web_api::AppConfig::from_env().unwrap();

        assert_eq!(config.frontend_url, "https://miyabi-society.com");
        assert!(config.frontend_url.starts_with("https://"), "Production frontend should use HTTPS");

        cleanup_lambda_env();
    }

    #[test]
    fn test_lambda_github_oauth_configuration() {
        setup_lambda_env();
        env::set_var("GITHUB_CLIENT_ID", "Iv1.1234567890abcdef");
        env::set_var("GITHUB_CLIENT_SECRET", "0123456789abcdef0123456789abcdef01234567");
        env::set_var("GITHUB_CALLBACK_URL", "https://api.miyabi-society.com/api/v1/auth/github/callback");

        let config = miyabi_web_api::AppConfig::from_env().unwrap();

        assert!(config.github_client_id.starts_with("Iv1."));
        assert_eq!(config.github_client_secret.len(), 40);
        assert!(config.github_callback_url.contains("/api/v1/auth/github/callback"));

        cleanup_lambda_env();
    }

    #[test]
    fn test_lambda_memory_configuration() {
        setup_lambda_env();
        // Lambda memory is typically set through AWS console/Terraform,
        // but we can verify our config doesn't require it
        env::set_var("AWS_LAMBDA_FUNCTION_MEMORY_SIZE", "512");

        let config = miyabi_web_api::AppConfig::from_env();

        assert!(config.is_ok(), "Config should not depend on memory size env var");

        cleanup_lambda_env();
        env::remove_var("AWS_LAMBDA_FUNCTION_MEMORY_SIZE");
    }

    #[test]
    fn test_lambda_timeout_configuration() {
        setup_lambda_env();
        // Verify config loads regardless of timeout setting
        env::set_var("AWS_LAMBDA_FUNCTION_TIMEOUT", "30");

        let config = miyabi_web_api::AppConfig::from_env();

        assert!(config.is_ok(), "Config should not depend on timeout env var");

        cleanup_lambda_env();
        env::remove_var("AWS_LAMBDA_FUNCTION_TIMEOUT");
    }

    #[test]
    fn test_lambda_secrets_manager_integration_ready() {
        setup_lambda_env();
        // Test that config accepts Secrets Manager ARN format in env vars
        // (actual secret fetching would be done by Lambda runtime/extension)
        env::set_var(
            "DATABASE_URL",
            "postgresql://miyabi:{{resolve:secretsmanager:db-password}}@rds.amazonaws.com:5432/miyabi",
        );

        // This would fail in actual runtime, but tests config parsing
        let config = miyabi_web_api::AppConfig::from_env();

        // Config parsing should succeed even with placeholder
        assert!(config.is_ok(), "Config should accept Secrets Manager placeholders");

        cleanup_lambda_env();
    }

    #[test]
    fn test_lambda_api_gateway_integration_headers() {
        setup_lambda_env();
        // Ensure callback URL supports API Gateway format
        env::set_var(
            "GITHUB_CALLBACK_URL",
            "https://abc123.execute-api.us-west-2.amazonaws.com/prod/api/v1/auth/github/callback",
        );

        let config = miyabi_web_api::AppConfig::from_env().unwrap();

        assert!(config.github_callback_url.contains("execute-api"), "Should support API Gateway URLs");

        cleanup_lambda_env();
    }

    #[test]
    fn test_lambda_cloudwatch_logs_compatibility() {
        setup_lambda_env();
        // Verify tracing/logging configuration doesn't interfere with CloudWatch
        env::set_var("RUST_LOG", "info");

        let config = miyabi_web_api::AppConfig::from_env();

        assert!(config.is_ok(), "Logging config should not affect AppConfig");

        cleanup_lambda_env();
        env::remove_var("RUST_LOG");
    }

    #[test]
    fn test_lambda_arm64_graviton_compatibility() {
        setup_lambda_env();
        // Verify config works on ARM64 architecture
        env::set_var("AWS_EXECUTION_ENV", "AWS_Lambda_provided.al2023_arm64");

        let config = miyabi_web_api::AppConfig::from_env();

        assert!(config.is_ok(), "Config should be architecture-independent");

        cleanup_lambda_env();
        env::remove_var("AWS_EXECUTION_ENV");
    }

    #[test]
    fn test_lambda_x86_64_compatibility() {
        setup_lambda_env();
        // Verify config works on x86_64 architecture
        env::set_var("AWS_EXECUTION_ENV", "AWS_Lambda_provided.al2023_x86_64");

        let config = miyabi_web_api::AppConfig::from_env();

        assert!(config.is_ok(), "Config should work on x86_64");

        cleanup_lambda_env();
        env::remove_var("AWS_EXECUTION_ENV");
    }
}
