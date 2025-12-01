//! AWS Lambda entry point for Miyabi Web API
//!
//! This binary wraps the Axum application for deployment to AWS Lambda.
//! It uses the lambda_http crate to adapt HTTP events to Axum handlers.

use lambda_http::{run, Error};
use miyabi_web_api::{create_app, AppConfig};

#[tokio::main]
async fn main() -> Result<(), Error> {
    // Initialize tracing for Lambda
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_target(false)
        .without_time()
        .init();

    tracing::info!("Starting Miyabi API Lambda function");

    // Load configuration from environment variables
    let config = AppConfig::from_env().map_err(|e| Error::from(format!("Failed to load configuration: {}", e)))?;

    // Create Axum application
    let app = create_app(config)
        .await
        .map_err(|e| Error::from(format!("Failed to create application: {}", e)))?;

    // Run Lambda runtime with Axum app directly
    // lambda_http::run handles the conversion between Lambda events and HTTP requests
    run(app).await
}
