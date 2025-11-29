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

# =============================================================================
# ECS/Fargate Variables
# =============================================================================

variable "ecs_cluster_name" {
  description = "ECS cluster name for monitoring"
  type        = string
  default     = ""
}

variable "ecs_service_name" {
  description = "ECS service name for monitoring"
  type        = string
  default     = ""
}

variable "ecs_cpu_threshold" {
  description = "Threshold for ECS CPU utilization percentage"
  type        = number
  default     = 80
}

variable "ecs_memory_threshold" {
  description = "Threshold for ECS memory utilization percentage"
  type        = number
  default     = 80
}

variable "ecs_min_task_count" {
  description = "Minimum number of running tasks"
  type        = number
  default     = 1
}

# =============================================================================
# ALB Variables
# =============================================================================

variable "alb_name" {
  description = "ALB name for monitoring (LoadBalancer dimension format: app/name/id)"
  type        = string
  default     = ""
}

variable "alb_target_group_name" {
  description = "ALB target group name for monitoring"
  type        = string
  default     = ""
}

variable "alb_response_time_threshold_ms" {
  description = "Threshold for ALB P95 response time in milliseconds"
  type        = number
  default     = 2000
}

variable "alb_5xx_error_rate_threshold" {
  description = "Threshold for ALB 5XX error rate percentage"
  type        = number
  default     = 5
}

variable "alb_4xx_error_rate_threshold" {
  description = "Threshold for ALB 4XX error rate percentage"
  type        = number
  default     = 20
}

variable "alb_min_healthy_hosts" {
  description = "Minimum number of healthy hosts"
  type        = number
  default     = 1
}

# =============================================================================
# API Gateway Enhanced Variables
# =============================================================================

variable "api_5xx_error_rate_threshold" {
  description = "Threshold for API Gateway 5XX error rate percentage"
  type        = number
  default     = 5
}

variable "api_4xx_error_rate_threshold" {
  description = "Threshold for API Gateway 4XX error rate percentage"
  type        = number
  default     = 20
}

variable "api_latency_p50_threshold_ms" {
  description = "Threshold for API Gateway P50 latency in milliseconds"
  type        = number
  default     = 1000
}

variable "api_latency_p99_threshold_ms" {
  description = "Threshold for API Gateway P99 latency in milliseconds"
  type        = number
  default     = 5000
}

# =============================================================================
# Lambda Enhanced Variables
# =============================================================================

variable "lambda_error_rate_threshold" {
  description = "Threshold for Lambda error rate percentage"
  type        = number
  default     = 5
}

variable "lambda_throttle_threshold" {
  description = "Threshold for Lambda throttles count"
  type        = number
  default     = 10
}

variable "lambda_concurrent_executions_threshold" {
  description = "Threshold for Lambda concurrent executions"
  type        = number
  default     = 100
}

# =============================================================================
# Advanced Monitoring Features
# =============================================================================

variable "enable_composite_alarms" {
  description = "Enable composite alarms for complex failure scenarios"
  type        = bool
  default     = true
}

variable "enable_anomaly_detection" {
  description = "Enable CloudWatch Anomaly Detection alarms"
  type        = bool
  default     = true
}
