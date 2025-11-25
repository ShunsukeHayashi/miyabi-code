# Cost Management Module Variables
# Issue: #848 - コストトラッキング & 最適化

variable "environment" {
  description = "Environment name (staging/production)"
  type        = string

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be 'staging' or 'production'."
  }
}

# =============================================================================
# Budget Settings
# =============================================================================

variable "monthly_budget_limit" {
  description = "Monthly budget limit in USD"
  type        = number
  default     = 1500 # Target: $1,200-1,500
}

variable "ec2_budget_limit" {
  description = "Monthly EC2 budget limit in USD"
  type        = number
  default     = 500
}

variable "bedrock_budget_limit" {
  description = "Monthly Bedrock/AI budget limit in USD"
  type        = number
  default     = 300
}

variable "daily_cost_threshold" {
  description = "Daily cost threshold for alerts in USD"
  type        = number
  default     = 100
}

variable "budget_notification_emails" {
  description = "Email addresses for budget notifications"
  type        = list(string)
  default     = []
}

# =============================================================================
# Cost Anomaly Detection
# =============================================================================

variable "anomaly_threshold_usd" {
  description = "Cost anomaly threshold in USD"
  type        = string
  default     = "50"
}

# =============================================================================
# S3 Intelligent-Tiering
# =============================================================================

variable "enable_s3_intelligent_tiering" {
  description = "Enable S3 Intelligent-Tiering for cost optimization"
  type        = bool
  default     = true
}

variable "s3_bucket_id" {
  description = "S3 bucket ID for Intelligent-Tiering configuration"
  type        = string
  default     = ""
}

# =============================================================================
# VPC Endpoints
# =============================================================================

variable "enable_vpc_endpoints" {
  description = "Enable VPC endpoints to reduce NAT Gateway costs"
  type        = bool
  default     = true
}

variable "vpc_id" {
  description = "VPC ID for VPC endpoints"
  type        = string
  default     = ""
}

variable "route_table_ids" {
  description = "Route table IDs for gateway endpoints"
  type        = list(string)
  default     = []
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for interface endpoints"
  type        = list(string)
  default     = []
}

variable "vpc_endpoint_security_group_ids" {
  description = "Security group IDs for VPC interface endpoints"
  type        = list(string)
  default     = []
}

# =============================================================================
# Alerting
# =============================================================================

variable "alarm_sns_topic_arn" {
  description = "SNS topic ARN for cost alarms"
  type        = string
  default     = ""
}

# =============================================================================
# Tags
# =============================================================================

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
