#!/usr/bin/env python3
"""
Lambda Handler for Miyabi MCP Server
Adapts FastAPI app to AWS Lambda using Mangum

This handler:
1. Loads secrets from AWS Secrets Manager on cold start
2. Adapts FastAPI app to Lambda using Mangum
3. Handles all incoming Lambda events
"""

from mangum import Mangum
from core.secrets import load_secrets_to_env
from main import app

# Load secrets from AWS Secrets Manager on cold start
# This will merge secrets into environment variables
# Skip if not running in Lambda (AWS_EXECUTION_ENV is set)
load_secrets_to_env(project_name="miyabi", environment="prod")

# Create Lambda handler using Mangum adapter
# lifespan="off" disables FastAPI lifespan events (not needed in Lambda)
handler = Mangum(app, lifespan="off")

# Export for Lambda
lambda_handler = handler
