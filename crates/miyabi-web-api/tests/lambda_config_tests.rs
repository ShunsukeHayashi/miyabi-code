//! Lambda Configuration Tests
//!
//! Unit tests for AppConfig environment variable loading
//! specifically for AWS Lambda deployment scenarios.

use std::env;

// Helper function to set up test environment
fn setup_test_env() {
    env::set_var("DATABASE_URL", "postgresql://test:test@localhost:5432/test");
    env::set_var("JWT_SECRET", "test-jwt-secret-32-bytes-long!!");
    env::set_var("GITHUB_CLIENT_ID", "test-github-client-id");
    env::set_var("GITHUB_CLIENT_SECRET", "test-github-client-secret");
    env::set_var("GITHUB_CALLBACK_URL", "http://localhost:8080/callback");
    env::set_var("FRONTEND_URL", "http://localhost:3000");
    env::set_var("SERVER_ADDRESS", "0.0.0.0:8080");
    env::set_var("ENVIRONMENT", "test");
}

// Helper function to clear test environment
fn cleanup_test_env() {
    env::remove_var("DATABASE_URL");
    env::remove_var("JWT_SECRET");
    env::remove_var("GITHUB_CLIENT_ID");
    env::remove_var("GITHUB_CLIENT_SECRET");
    env::remove_var("GITHUB_CALLBACK_URL");
    env::remove_var("FRONTEND_URL");
    env::remove_var("SERVER_ADDRESS");
    env::remove_var("ENVIRONMENT");
    env::remove_var("JWT_EXPIRATION");
    env::remove_var("REFRESH_EXPIRATION");
}

#[test]
fn test_config_from_env_with_all_required_vars() {
    setup_test_env();

    let config = miyabi_web_api::AppConfig::from_env();

    assert!(config.is_ok(), "Config should load successfully with all required vars");

    let config = config.unwrap();
    assert_eq!(config.database_url, "postgresql://test:test@localhost:5432/test");
    assert_eq!(config.jwt_secret, "test-jwt-secret-32-bytes-long!!");
    assert_eq!(config.github_client_id, "test-github-client-id");
    assert_eq!(config.github_client_secret, "test-github-client-secret");
    assert_eq!(config.environment, "test");

    cleanup_test_env();
}

#[test]
fn test_config_from_env_missing_database_url() {
    cleanup_test_env();
    setup_test_env();
    env::remove_var("DATABASE_URL");

    let config = miyabi_web_api::AppConfig::from_env();

    assert!(config.is_err(), "Config should fail without DATABASE_URL");
    assert!(config.unwrap_err().contains("DATABASE_URL"), "Error message should mention DATABASE_URL");

    cleanup_test_env();
}

#[test]
fn test_config_from_env_missing_jwt_secret() {
    cleanup_test_env();
    setup_test_env();
    env::remove_var("JWT_SECRET");

    let config = miyabi_web_api::AppConfig::from_env();

    assert!(config.is_err(), "Config should fail without JWT_SECRET");
    assert!(config.unwrap_err().contains("JWT_SECRET"), "Error message should mention JWT_SECRET");

    cleanup_test_env();
}

#[test]
fn test_config_from_env_missing_github_client_id() {
    cleanup_test_env();
    setup_test_env();
    env::remove_var("GITHUB_CLIENT_ID");

    let config = miyabi_web_api::AppConfig::from_env();

    assert!(config.is_err(), "Config should fail without GITHUB_CLIENT_ID");
    assert!(config.unwrap_err().contains("GITHUB_CLIENT_ID"), "Error message should mention GITHUB_CLIENT_ID");

    cleanup_test_env();
}

#[test]
fn test_config_from_env_missing_github_client_secret() {
    cleanup_test_env();
    setup_test_env();
    env::remove_var("GITHUB_CLIENT_SECRET");

    let config = miyabi_web_api::AppConfig::from_env();

    assert!(config.is_err(), "Config should fail without GITHUB_CLIENT_SECRET");
    assert!(
        config.unwrap_err().contains("GITHUB_CLIENT_SECRET"),
        "Error message should mention GITHUB_CLIENT_SECRET"
    );

    cleanup_test_env();
}

#[test]
fn test_config_default_values() {
    setup_test_env();
    // Don't set optional variables
    env::remove_var("SERVER_ADDRESS");
    env::remove_var("GITHUB_CALLBACK_URL");
    env::remove_var("FRONTEND_URL");
    env::remove_var("JWT_EXPIRATION");
    env::remove_var("REFRESH_EXPIRATION");
    env::remove_var("ENVIRONMENT");

    let config = miyabi_web_api::AppConfig::from_env().unwrap();

    assert_eq!(config.server_address, "0.0.0.0:8080", "Should use default server address");
    assert_eq!(
        config.github_callback_url, "http://localhost:8080/api/v1/auth/github/callback",
        "Should use default callback URL"
    );
    assert_eq!(config.frontend_url, "http://localhost:3000", "Should use default frontend URL");
    assert_eq!(config.jwt_expiration, 3600, "Should use default JWT expiration");
    assert_eq!(config.refresh_expiration, 604800, "Should use default refresh expiration");
    assert_eq!(config.environment, "development", "Should use default environment");

    cleanup_test_env();
}

#[test]
fn test_config_custom_expiration() {
    setup_test_env();
    env::set_var("JWT_EXPIRATION", "7200");
    env::set_var("REFRESH_EXPIRATION", "1209600");

    let config = miyabi_web_api::AppConfig::from_env().unwrap();

    assert_eq!(config.jwt_expiration, 7200, "Should use custom JWT expiration");
    assert_eq!(config.refresh_expiration, 1209600, "Should use custom refresh expiration");

    cleanup_test_env();
}

#[test]
fn test_config_production_environment() {
    setup_test_env();
    env::set_var("ENVIRONMENT", "production");

    let config = miyabi_web_api::AppConfig::from_env().unwrap();

    assert!(config.is_production(), "Should detect production environment");
    assert!(!config.is_development(), "Should not detect development environment");

    cleanup_test_env();
}

#[test]
fn test_config_development_environment() {
    setup_test_env();
    env::set_var("ENVIRONMENT", "development");

    let config = miyabi_web_api::AppConfig::from_env().unwrap();

    assert!(config.is_development(), "Should detect development environment");
    assert!(!config.is_production(), "Should not detect production environment");

    cleanup_test_env();
}

#[test]
fn test_config_invalid_expiration_uses_default() {
    setup_test_env();
    env::set_var("JWT_EXPIRATION", "invalid");
    env::set_var("REFRESH_EXPIRATION", "not-a-number");

    let config = miyabi_web_api::AppConfig::from_env().unwrap();

    assert_eq!(config.jwt_expiration, 3600, "Should use default for invalid JWT expiration");
    assert_eq!(config.refresh_expiration, 604800, "Should use default for invalid refresh expiration");

    cleanup_test_env();
}

#[test]
fn test_config_rds_database_url_format() {
    setup_test_env();
    // Simulate AWS RDS URL
    env::set_var(
        "DATABASE_URL",
        "postgresql://miyabi:password@miyabi-prod.abc123.us-west-2.rds.amazonaws.com:5432/miyabi",
    );

    let config = miyabi_web_api::AppConfig::from_env().unwrap();

    assert!(config.database_url.contains("rds.amazonaws.com"), "Should accept RDS database URL");

    cleanup_test_env();
}

#[test]
fn test_config_cloudfront_frontend_url() {
    setup_test_env();
    env::set_var("FRONTEND_URL", "https://d1234567890.cloudfront.net");

    let config = miyabi_web_api::AppConfig::from_env().unwrap();

    assert_eq!(config.frontend_url, "https://d1234567890.cloudfront.net");

    cleanup_test_env();
}

#[test]
fn test_config_api_gateway_callback_url() {
    setup_test_env();
    env::set_var(
        "GITHUB_CALLBACK_URL",
        "https://abcdef1234.execute-api.us-west-2.amazonaws.com/api/v1/auth/github/callback",
    );

    let config = miyabi_web_api::AppConfig::from_env().unwrap();

    assert!(config.github_callback_url.contains("execute-api"), "Should accept API Gateway callback URL");

    cleanup_test_env();
}
