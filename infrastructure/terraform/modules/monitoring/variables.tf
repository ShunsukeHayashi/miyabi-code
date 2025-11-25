/**
 * Monitoring Module - Variables
 * Issue: #851 - Terraform/CDK Infrastructure as Code
 */

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "miyabi"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "alarm_email_endpoints" {
  description = "Email addresses for alarm notifications"
  type        = list(string)
  default     = []
}

# API Alarms
variable "api_name" {
  description = "Name of the API Gateway"
  type        = string
  default     = "miyabi-api"
}

variable "api_5xx_threshold" {
  description = "Threshold for API 5XX errors"
  type        = number
  default     = 10
}

variable "api_latency_threshold_ms" {
  description = "Threshold for API P95 latency in milliseconds"
  type        = number
  default     = 3000
}

# Lambda Alarms
variable "lambda_function_names" {
  description = "List of Lambda function names to monitor"
  type        = list(string)
  default     = []
}

variable "lambda_error_threshold" {
  description = "Threshold for Lambda errors"
  type        = number
  default     = 5
}

variable "lambda_duration_threshold_ms" {
  description = "Threshold for Lambda P95 duration in milliseconds"
  type        = number
  default     = 10000
}

# RDS Alarms
variable "rds_instance_identifier" {
  description = "RDS instance identifier"
  type        = string
  default     = ""
}

variable "rds_cpu_threshold" {
  description = "Threshold for RDS CPU utilization percentage"
  type        = number
  default     = 80
}

variable "rds_connections_threshold" {
  description = "Threshold for RDS database connections"
  type        = number
  default     = 100
}

variable "rds_storage_threshold_bytes" {
  description = "Threshold for RDS free storage in bytes (5GB default)"
  type        = number
  default     = 5368709120
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
