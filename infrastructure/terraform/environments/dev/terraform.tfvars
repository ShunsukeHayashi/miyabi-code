# Miyabi Infrastructure - Development Environment Variables
# Issue #1021

project_name = "miyabi"
environment  = "dev"
aws_region   = "us-west-2"

# VPC Configuration
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]
availability_zones   = ["us-west-2a", "us-west-2b"]

# ECR Image (from Issue #1020)
ecr_image_uri = "112530848482.dkr.ecr.us-west-2.amazonaws.com/miyabi-web-api:latest"

# Lambda Configuration (Issue #1169)
lambda_zip_path = "../../../dist/lambda/miyabi-api-arm64.zip"

# Database URL from RDS (#1167)
# database_url = "postgres://miyabi:PASSWORD@miyabi-dev.xxxxxxxxxx.us-west-2.rds.amazonaws.com:5432/miyabi"

# JWT Secret (generate with: openssl rand -base64 32)
# jwt_secret = "YOUR_SECRET_HERE"

# Secrets Manager ARNs for Lambda
# secrets_arns = [
#   "arn:aws:secretsmanager:us-west-2:112530848482:secret:miyabi/dev/database-XXXXXX",
#   "arn:aws:secretsmanager:us-west-2:112530848482:secret:miyabi/dev/jwt-XXXXXX"
# ]

# CORS origins for API Gateway
cors_origins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://miyabi-society.com"
]
