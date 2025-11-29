# Lambda Function Tests

## Overview

This directory organizes test documentation and specifications for the Miyabi Lambda API functions.

## Test Location

The actual test implementation is located in:
```
crates/miyabi-web-api/tests/
```

## Test Categories

### 1. Unit Tests
Located in: `crates/miyabi-web-api/tests/lambda_unit_tests.rs`

- **Config Tests**: AppConfig environment variable loading
- **Handler Tests**: Lambda function initialization and error handling
- **Validation Tests**: Input validation and sanitization

### 2. Integration Tests
Located in: `crates/miyabi-web-api/tests/lambda_integration_tests.rs`

- **API Gateway Events**: HTTP request/response transformation
- **Database Connection**: PostgreSQL connection pooling in Lambda environment
- **Authentication**: JWT token validation
- **Error Handling**: Lambda-specific error responses

### 3. Performance Tests
Located in: `crates/miyabi-web-api/tests/lambda_performance_tests.rs`

- **Cold Start**: Measure cold start latency
- **Memory Usage**: Monitor memory consumption
- **Connection Pooling**: Database connection efficiency

## Running Tests

### All Tests
```bash
cd crates/miyabi-web-api
cargo test --features lambda
```

### Unit Tests Only
```bash
cargo test --features lambda lambda_unit_tests
```

### Integration Tests Only
```bash
cargo test --features lambda lambda_integration_tests
```

### With Coverage
```bash
cargo tarpaulin --features lambda --out Html
```

## Environment Variables for Testing

Create a `.env.test` file in `crates/miyabi-web-api/`:

```bash
DATABASE_URL=postgresql://test_user:test_pass@localhost:5432/miyabi_test
JWT_SECRET=test-secret-key-32-bytes-long!!!
GITHUB_CLIENT_ID=test-client-id
GITHUB_CLIENT_SECRET=test-client-secret
GITHUB_CALLBACK_URL=http://localhost:8080/api/v1/auth/github/callback
FRONTEND_URL=http://localhost:3000
SERVER_ADDRESS=0.0.0.0:8080
ENVIRONMENT=test
```

## Test Database Setup

```bash
# Create test database
psql -U postgres -c "CREATE DATABASE miyabi_test;"

# Run migrations
cd crates/miyabi-web-api
sqlx migrate run --database-url postgresql://test_user:test_pass@localhost:5432/miyabi_test
```

## CI/CD Integration

Tests are automatically run in GitHub Actions on:
- Pull requests
- Commits to main branch
- Release tags

See: `.github/workflows/test.yml`

## Related Documentation

- [Lambda Deployment Guide](../../docs/LAMBDA_DEPLOYMENT.md)
- [API Documentation](../../crates/miyabi-web-api/README.md)
- [Testing Strategy](../../docs/TESTING_STRATEGY.md)
