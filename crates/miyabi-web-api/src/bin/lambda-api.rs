//! AWS Lambda entry point for Miyabi Web API
//!
//! This binary wraps the Axum application for deployment to AWS Lambda.
//! It uses the lambda_http crate to adapt HTTP events to Axum handlers.

use lambda_http::{run, service_fn, Error, Request, Response};
use miyabi_web_api::{create_app, AppConfig};
use tower::ServiceExt;

/// Lambda handler function
///
/// This function is called for each Lambda invocation.
/// It forwards the request to the Axum application.
async fn function_handler(event: Request) -> Result<Response<String>, Error> {
    // Load configuration from environment variables
    let config = AppConfig::from_env()
        .map_err(|e| Error::from(format!("Failed to load configuration: {}", e)))?;

    // Create Axum application
    let app = create_app(config)
        .await
        .map_err(|e| Error::from(format!("Failed to create application: {}", e)))?;

    // Convert Lambda event to Axum request
    let uri = event.uri().clone();
    let method = event.method().clone();
    let _headers = event.headers().clone();
    let body = event.body();

    // Build Axum request
    let axum_request = axum::http::Request::builder()
        .uri(uri)
        .method(method)
        .body(axum::body::Body::from(body.to_vec()))
        .map_err(|e| Error::from(format!("Failed to build request: {}", e)))?;

    // Call Axum application
    let axum_response = app
        .oneshot(axum_request)
        .await
        .map_err(|e| Error::from(format!("Failed to call application: {}", e)))?;

    // Convert Axum response to Lambda response
    let (parts, body) = axum_response.into_parts();
    let body_bytes = axum::body::to_bytes(body, usize::MAX)
        .await
        .map_err(|e| Error::from(format!("Failed to read response body: {}", e)))?;

    let mut builder = Response::builder().status(parts.status);
    for (key, value) in parts.headers.iter() {
        builder = builder.header(key, value);
    }

    let body_string = String::from_utf8_lossy(&body_bytes).to_string();
    let response = builder
        .body(body_string)
        .map_err(|e| Error::from(format!("Failed to build response: {}", e)))?;

    Ok(response)
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    // Initialize tracing for Lambda
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_target(false)
        .without_time()
        .init();

    tracing::info!("Starting Miyabi API Lambda function");

    // Run Lambda runtime
    run(service_fn(function_handler)).await
}
