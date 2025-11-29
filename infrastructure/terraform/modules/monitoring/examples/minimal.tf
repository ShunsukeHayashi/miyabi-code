# Minimal Monitoring Example
# This example shows the minimum required configuration for basic monitoring

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

provider "aws" {
  region = "ap-northeast-1"
}

# Minimal monitoring configuration with only essential alarms
module "monitoring_minimal" {
  source = "../"

  project_name = "miyabi"
  environment  = "dev"
  aws_region   = "ap-northeast-1"

  # Basic email notifications
  alarm_email_endpoints = [
    "dev-team@example.com"
  ]

  # API Gateway monitoring (required)
  api_name = "miyabi-api"

  # Using default thresholds for most values
  # Only override what's specific to your environment

  # Optional: Disable advanced features for dev environment
  enable_composite_alarms  = false
  enable_anomaly_detection = false

  # Reduced log retention for cost savings
  log_retention_days = 7
}

# =============================================================================
# Outputs
# =============================================================================

output "sns_topic_arn" {
  description = "SNS topic ARN for alarm notifications"
  value       = module.monitoring_minimal.sns_topic_arn
}

output "dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = module.monitoring_minimal.dashboard_name
}
