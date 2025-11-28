# Miyabi Frontend Infrastructure - Variables
# S3 + CloudFront for miyabi-console hosting

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
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
  default     = "miyabi-society.com"
}

variable "api_origin_domain" {
  description = "API Gateway/ALB domain for /api/* proxy"
  type        = string
  default     = ""  # Optional: Set if API proxy is needed
}

variable "acm_certificate_arn" {
  description = "ACM Certificate ARN for HTTPS (must be in us-east-1 for CloudFront)"
  type        = string
  default     = ""  # Optional: Set for custom domain HTTPS
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
