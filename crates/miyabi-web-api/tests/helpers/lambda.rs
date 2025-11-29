//! Lambda Test Helpers
//!
//! Shared utilities for Lambda function testing

use serde_json::json;
use std::env;

/// Set up a complete Lambda test environment
pub fn setup_lambda_test_env() {
    env::set_var("DATABASE_URL", "postgresql://test:test@localhost:5432/miyabi_test");
    env::set_var("JWT_SECRET", "test-jwt-secret-must-be-32-bytes!!");
    env::set_var("GITHUB_CLIENT_ID", "test-github-client-id");
    env::set_var("GITHUB_CLIENT_SECRET", "test-github-client-secret");
    env::set_var("GITHUB_CALLBACK_URL", "http://localhost:8080/api/v1/auth/github/callback");
    env::set_var("FRONTEND_URL", "http://localhost:3000");
    env::set_var("SERVER_ADDRESS", "0.0.0.0:8080");
    env::set_var("ENVIRONMENT", "test");
    env::set_var("JWT_EXPIRATION", "3600");
    env::set_var("REFRESH_EXPIRATION", "604800");
}

/// Set up a production-like Lambda environment
pub fn setup_lambda_production_env() {
    env::set_var(
        "DATABASE_URL",
        "postgresql://miyabi:password@miyabi-prod.abc123.us-west-2.rds.amazonaws.com:5432/miyabi",
    );
    env::set_var("JWT_SECRET", "prod-secret-32-bytes-minimum!!!");
    env::set_var("GITHUB_CLIENT_ID", "Iv1.prod1234567890ab");
    env::set_var("GITHUB_CLIENT_SECRET", "prod0123456789abcdef0123456789abcdef012345");
    env::set_var(
        "GITHUB_CALLBACK_URL",
        "https://api.miyabi-society.com/api/v1/auth/github/callback",
    );
    env::set_var("FRONTEND_URL", "https://miyabi-society.com");
    env::set_var("SERVER_ADDRESS", "0.0.0.0:8080");
    env::set_var("ENVIRONMENT", "production");
    env::set_var("JWT_EXPIRATION", "3600");
    env::set_var("REFRESH_EXPIRATION", "604800");
    env::set_var("AWS_REGION", "us-west-2");
    env::set_var("AWS_LAMBDA_FUNCTION_NAME", "miyabi-api-prod");
    env::set_var("AWS_LAMBDA_FUNCTION_VERSION", "$LATEST");
}

/// Clean up all Lambda test environment variables
pub fn cleanup_lambda_env() {
    let vars = [
        "DATABASE_URL",
        "JWT_SECRET",
        "GITHUB_CLIENT_ID",
        "GITHUB_CLIENT_SECRET",
        "GITHUB_CALLBACK_URL",
        "FRONTEND_URL",
        "SERVER_ADDRESS",
        "ENVIRONMENT",
        "JWT_EXPIRATION",
        "REFRESH_EXPIRATION",
        "AWS_REGION",
        "AWS_LAMBDA_FUNCTION_NAME",
        "AWS_LAMBDA_FUNCTION_VERSION",
        "AWS_LAMBDA_LOG_GROUP_NAME",
        "AWS_LAMBDA_LOG_STREAM_NAME",
        "AWS_LAMBDA_FUNCTION_MEMORY_SIZE",
        "AWS_LAMBDA_FUNCTION_TIMEOUT",
        "AWS_EXECUTION_ENV",
        "RUST_LOG",
    ];

    for var in &vars {
        env::remove_var(var);
    }
}

/// Create a mock API Gateway HTTP API v2 event
pub fn create_api_gateway_event(
    method: &str,
    path: &str,
    headers: Option<serde_json::Value>,
    body: Option<String>,
    query_params: Option<serde_json::Value>,
    path_params: Option<serde_json::Value>,
) -> serde_json::Value {
    let default_headers = json!({
        "accept": "application/json",
        "content-type": "application/json",
        "user-agent": "aws-lambda-test/1.0"
    });

    json!({
        "version": "2.0",
        "routeKey": format!("{} {}", method, path),
        "rawPath": path,
        "rawQueryString": query_params.as_ref()
            .and_then(|qp| qp.as_object())
            .map(|obj| {
                obj.iter()
                    .map(|(k, v)| format!("{}={}", k, v.as_str().unwrap_or("")))
                    .collect::<Vec<_>>()
                    .join("&")
            })
            .unwrap_or_default(),
        "headers": headers.unwrap_or(default_headers),
        "queryStringParameters": query_params,
        "pathParameters": path_params,
        "requestContext": {
            "accountId": "123456789012",
            "apiId": "test-api-id",
            "domainName": "test-api.execute-api.us-west-2.amazonaws.com",
            "domainPrefix": "test-api",
            "http": {
                "method": method,
                "path": path,
                "protocol": "HTTP/1.1",
                "sourceIp": "127.0.0.1",
                "userAgent": "aws-lambda-test/1.0"
            },
            "requestId": format!("test-{}", uuid::Uuid::new_v4()),
            "routeKey": format!("{} {}", method, path),
            "stage": "$default",
            "time": chrono::Utc::now().format("%d/%b/%Y:%H:%M:%S %z").to_string(),
            "timeEpoch": chrono::Utc::now().timestamp_millis()
        },
        "body": body,
        "isBase64Encoded": false
    })
}

/// Create a mock CloudWatch event for scheduled Lambda invocations
pub fn create_cloudwatch_event(rule_name: &str) -> serde_json::Value {
    json!({
        "version": "0",
        "id": uuid::Uuid::new_v4().to_string(),
        "detail-type": "Scheduled Event",
        "source": "aws.events",
        "account": "123456789012",
        "time": chrono::Utc::now().to_rfc3339(),
        "region": "us-west-2",
        "resources": [
            format!("arn:aws:events:us-west-2:123456789012:rule/{}", rule_name)
        ],
        "detail": {}
    })
}

/// Create a mock SNS event for Lambda notifications
pub fn create_sns_event(topic_arn: &str, message: &str) -> serde_json::Value {
    json!({
        "Records": [{
            "EventSource": "aws:sns",
            "EventVersion": "1.0",
            "EventSubscriptionArn": format!("{}:test-subscription", topic_arn),
            "Sns": {
                "Type": "Notification",
                "MessageId": uuid::Uuid::new_v4().to_string(),
                "TopicArn": topic_arn,
                "Subject": "Test",
                "Message": message,
                "Timestamp": chrono::Utc::now().to_rfc3339(),
                "SignatureVersion": "1",
                "Signature": "test-signature",
                "SigningCertUrl": "https://sns.us-west-2.amazonaws.com/test.pem",
                "UnsubscribeUrl": "https://sns.us-west-2.amazonaws.com/unsubscribe",
                "MessageAttributes": {}
            }
        }]
    })
}

/// Create a mock SQS event for Lambda queue processing
pub fn create_sqs_event(queue_url: &str, message_body: &str) -> serde_json::Value {
    json!({
        "Records": [{
            "messageId": uuid::Uuid::new_v4().to_string(),
            "receiptHandle": "test-receipt-handle",
            "body": message_body,
            "attributes": {
                "ApproximateReceiveCount": "1",
                "SentTimestamp": chrono::Utc::now().timestamp_millis().to_string(),
                "SenderId": "AIDAIT2UOQQY3AUEKVGXU",
                "ApproximateFirstReceiveTimestamp": chrono::Utc::now().timestamp_millis().to_string()
            },
            "messageAttributes": {},
            "md5OfBody": "test-md5",
            "eventSource": "aws:sqs",
            "eventSourceARN": format!("arn:aws:sqs:us-west-2:123456789012:{}", queue_url),
            "awsRegion": "us-west-2"
        }]
    })
}

/// Create authorization headers with Bearer token
pub fn create_auth_headers(token: &str) -> serde_json::Value {
    json!({
        "authorization": format!("Bearer {}", token),
        "content-type": "application/json",
        "accept": "application/json"
    })
}

/// Create CORS preflight headers
pub fn create_cors_preflight_headers(origin: &str) -> serde_json::Value {
    json!({
        "origin": origin,
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type,authorization"
    })
}

/// Verify Lambda response structure
pub fn verify_lambda_response(response: &serde_json::Value) -> bool {
    response["statusCode"].is_number()
        && response["headers"].is_object()
        && response["body"].is_string()
}

/// Extract status code from Lambda response
pub fn get_status_code(response: &serde_json::Value) -> Option<u16> {
    response["statusCode"].as_u64().map(|n| n as u16)
}

/// Extract body from Lambda response
pub fn get_response_body(response: &serde_json::Value) -> Option<String> {
    response["body"].as_str().map(|s| s.to_string())
}

/// Extract and parse JSON body from Lambda response
pub fn get_json_body(response: &serde_json::Value) -> Option<serde_json::Value> {
    get_response_body(response).and_then(|body| serde_json::from_str(&body).ok())
}

/// Check if response has CORS headers
pub fn has_cors_headers(response: &serde_json::Value) -> bool {
    response["headers"]["access-control-allow-origin"].is_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_setup_and_cleanup() {
        setup_lambda_test_env();
        assert!(env::var("DATABASE_URL").is_ok());
        assert!(env::var("JWT_SECRET").is_ok());

        cleanup_lambda_env();
        assert!(env::var("DATABASE_URL").is_err());
        assert!(env::var("JWT_SECRET").is_err());
    }

    #[test]
    fn test_create_api_gateway_event() {
        let event = create_api_gateway_event("GET", "/test", None, None, None, None);

        assert_eq!(event["version"], "2.0");
        assert_eq!(event["rawPath"], "/test");
        assert_eq!(event["requestContext"]["http"]["method"], "GET");
    }

    #[test]
    fn test_create_api_gateway_event_with_params() {
        let query = json!({"page": "1", "limit": "10"});
        let event = create_api_gateway_event("GET", "/test", None, None, Some(query), None);

        assert!(event["rawQueryString"].as_str().unwrap().contains("page=1"));
        assert_eq!(event["queryStringParameters"]["limit"], "10");
    }

    #[test]
    fn test_create_auth_headers() {
        let headers = create_auth_headers("test-token");

        assert_eq!(headers["authorization"], "Bearer test-token");
        assert_eq!(headers["content-type"], "application/json");
    }

    #[test]
    fn test_verify_lambda_response() {
        let response = json!({
            "statusCode": 200,
            "headers": {"content-type": "application/json"},
            "body": "{\"message\":\"success\"}"
        });

        assert!(verify_lambda_response(&response));
    }

    #[test]
    fn test_get_status_code() {
        let response = json!({
            "statusCode": 404,
            "headers": {},
            "body": ""
        });

        assert_eq!(get_status_code(&response), Some(404));
    }

    #[test]
    fn test_get_json_body() {
        let response = json!({
            "statusCode": 200,
            "headers": {},
            "body": "{\"result\":\"ok\"}"
        });

        let body = get_json_body(&response).unwrap();
        assert_eq!(body["result"], "ok");
    }
}
