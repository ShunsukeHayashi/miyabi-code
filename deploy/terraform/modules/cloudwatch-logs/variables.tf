# ==============================================================================
# CloudWatch Logs Module Variables
# ==============================================================================

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "miyabi"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "aws_account_id" {
  description = "AWS account ID"
  type        = string
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}

# ==============================================================================
# CloudWatch Logs Configuration
# ==============================================================================

variable "application_log_retention_days" {
  description = "Retention period for application logs in days"
  type        = number
  default     = 30
}

variable "system_log_retention_days" {
  description = "Retention period for system logs in days"
  type        = number
  default     = 7
}

variable "cloudwatch_namespace" {
  description = "CloudWatch custom metrics namespace"
  type        = string
  default     = "MiyabiMCP"
}

# ==============================================================================
# Alarm Configuration
# ==============================================================================

variable "alarm_email" {
  description = "Email address for alarm notifications (leave empty to skip email subscription)"
  type        = string
  default     = ""
}

variable "error_count_threshold" {
  description = "Threshold for error count alarm (errors per 5 minutes)"
  type        = number
  default     = 10
}

variable "exception_count_threshold" {
  description = "Threshold for exception count alarm (exceptions per 5 minutes)"
  type        = number
  default     = 5
}

variable "slow_request_count_threshold" {
  description = "Threshold for slow request count alarm (requests >5s per 5 minutes)"
  type        = number
  default     = 5
}

variable "log_size_threshold_bytes" {
  description = "Threshold for log group size alarm (bytes per hour)"
  type        = number
  default     = 1073741824 # 1GB
}

# ==============================================================================
# IAM Configuration
# ==============================================================================

variable "create_iam_role" {
  description = "Whether to create IAM role for EC2 instances"
  type        = bool
  default     = true
}

variable "iam_role_name" {
  description = "Name of the IAM role to create (if create_iam_role is true)"
  type        = string
  default     = ""
}

variable "existing_iam_role_arn" {
  description = "ARN of existing IAM role to use (if create_iam_role is false)"
  type        = string
  default     = ""
}
