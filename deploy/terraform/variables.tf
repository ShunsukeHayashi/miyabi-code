# Miyabi Frontend Infrastructure - Variables
# S3 + CloudFront for miyabi-console hosting
# AWS Account: 211234825975 (Hayashi)
# Domain: miyabi-world.com

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "aws_account_id" {
  description = "AWS Account ID"
  type        = string
  default     = "211234825975"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "miyabi"
}

variable "domain_name" {
  description = "Primary domain name for CloudFront"
  type        = string
  default     = "miyabi-world.com"
}

variable "api_origin_domain" {
  description = "API Gateway/ALB domain for /api/* proxy"
  type        = string
  default     = "" # Optional: Set if API proxy is needed
}

variable "acm_certificate_arn" {
  description = "ACM Certificate ARN for HTTPS (must be in us-east-1 for CloudFront)"
  type        = string
  default     = "" # Optional: Set for custom domain HTTPS
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "Miyabi"
    ManagedBy   = "Terraform"
    Environment = "prod"
  }
}

# ==============================================================================
# Secrets Manager Variables
# ==============================================================================

variable "github_token" {
  description = "GitHub Personal Access Token for API access"
  type        = string
  sensitive   = true
  default     = ""  # Set via environment variable: TF_VAR_github_token
}

variable "miyabi_access_token" {
  description = "Miyabi API Access Token (OAuth 2.1)"
  type        = string
  sensitive   = true
  default     = ""  # Set via environment variable: TF_VAR_miyabi_access_token
}

variable "oauth_client_id" {
  description = "OAuth 2.1 Client ID"
  type        = string
  default     = "miyabi-mcp-client"
}

variable "oauth_client_secret" {
  description = "OAuth 2.1 Client Secret"
  type        = string
  sensitive   = true
  default     = ""  # Auto-generated if empty
}

variable "oauth_issuer" {
  description = "OAuth 2.1 Issuer URL"
  type        = string
  default     = "https://miyabi-mcp.local"
}

variable "github_oauth_client_id" {
  description = "GitHub OAuth App Client ID"
  type        = string
  sensitive   = true
  default     = ""  # Set via environment variable: TF_VAR_github_oauth_client_id
}

variable "github_oauth_client_secret" {
  description = "GitHub OAuth App Client Secret"
  type        = string
  sensitive   = true
  default     = ""  # Set via environment variable: TF_VAR_github_oauth_client_secret
}

variable "github_oauth_callback_url" {
  description = "GitHub OAuth App Callback URL"
  type        = string
  default     = ""  # e.g., https://api.miyabi-world.com/auth/github/callback
}

variable "repo_owner" {
  description = "GitHub repository owner"
  type        = string
  default     = "customer-cloud"
}

variable "repo_name" {
  description = "GitHub repository name"
  type        = string
  default     = "miyabi-private"
}

variable "base_url" {
  description = "Base URL for the Miyabi API"
  type        = string
  default     = ""  # e.g., https://api.miyabi-world.com
}

# ==============================================================================
# Lambda Configuration
# ==============================================================================

variable "lambda_base_url" {
  description = "Base URL for Lambda function (alias for base_url)"
  type        = string
  default     = ""  # Will be set to API Gateway URL after deployment
}

variable "enable_lambda_function_url" {
  description = "Enable Lambda Function URL for direct invocation"
  type        = bool
  default     = false
}

# ==============================================================================
# API Gateway Configuration
# ==============================================================================

variable "api_gateway_stage_name" {
  description = "API Gateway stage name"
  type        = string
  default     = "prod"
}

variable "api_gateway_burst_limit" {
  description = "API Gateway burst limit (requests per second)"
  type        = number
  default     = 5000
}

variable "api_gateway_rate_limit" {
  description = "API Gateway rate limit (requests per second)"
  type        = number
  default     = 2000
}

variable "api_custom_domain" {
  description = "Custom domain for API Gateway (e.g., api.miyabi-world.com)"
  type        = string
  default     = ""
}

variable "api_certificate_arn" {
  description = "ACM Certificate ARN for API Gateway custom domain (must be in same region)"
  type        = string
  default     = ""
}

variable "enable_api_usage_plan" {
  description = "Enable API Gateway usage plan for rate limiting"
  type        = bool
  default     = true
}

variable "api_quota_limit" {
  description = "API Gateway daily quota limit"
  type        = number
  default     = 100000
}

# ==============================================================================
# VPC Configuration
# ==============================================================================

variable "vpc_cidr" {
  description = "CIDR block for Lambda VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "enable_vpc_flow_logs" {
  description = "Enable VPC Flow Logs for network monitoring"
  type        = bool
  default     = false
}

variable "enable_multi_az_nat" {
  description = "Enable multi-AZ NAT gateways for high availability"
  type        = bool
  default     = false
}

variable "enable_interface_endpoints" {
  description = "Enable VPC interface endpoints for AWS services"
  type        = bool
  default     = false
}

# ==============================================================================
# DynamoDB Configuration
# ==============================================================================

variable "dynamodb_kms_key_arn" {
  description = "KMS Key ARN for DynamoDB encryption (optional, uses AWS managed key if empty)"
  type        = string
  default     = ""
}

variable "dynamodb_billing_mode" {
  description = "DynamoDB billing mode (PAY_PER_REQUEST or PROVISIONED)"
  type        = string
  default     = "PAY_PER_REQUEST"
  validation {
    condition     = contains(["PAY_PER_REQUEST", "PROVISIONED"], var.dynamodb_billing_mode)
    error_message = "DynamoDB billing mode must be either PAY_PER_REQUEST or PROVISIONED"
  }
}

variable "dynamodb_read_capacity" {
  description = "DynamoDB read capacity units (only used if billing_mode is PROVISIONED)"
  type        = number
  default     = 5
}

variable "dynamodb_write_capacity" {
  description = "DynamoDB write capacity units (only used if billing_mode is PROVISIONED)"
  type        = number
  default     = 5
}

variable "enable_dynamodb_autoscaling" {
  description = "Enable DynamoDB auto-scaling (only used if billing_mode is PROVISIONED)"
  type        = bool
  default     = false
}

variable "dynamodb_alarm_threshold_throttle" {
  description = "CloudWatch alarm threshold for DynamoDB throttling (UserErrors)"
  type        = number
  default     = 10
}

variable "dynamodb_alarm_threshold_latency_ms" {
  description = "CloudWatch alarm threshold for DynamoDB latency in milliseconds"
  type        = number
  default     = 50
}

variable "enable_dynamodb_pitr" {
  description = "Enable Point-in-Time Recovery for DynamoDB"
  type        = bool
  default     = true
}

variable "enable_dynamodb_streams" {
  description = "Enable DynamoDB Streams"
  type        = bool
  default     = true
}

variable "sns_alarm_topic_arn" {
  description = "SNS Topic ARN for CloudWatch alarms (optional)"
  type        = string
  default     = ""
}
