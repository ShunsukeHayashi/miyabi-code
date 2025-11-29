# Complete Monitoring Example
# This example demonstrates a full production monitoring setup

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

# Complete monitoring configuration with all features enabled
module "monitoring_complete" {
  source = "../"

  project_name = "miyabi"
  environment  = "prod"
  aws_region   = "ap-northeast-1"

  # ==========================================================================
  # Alarm Notifications
  # ==========================================================================

  alarm_email_endpoints = [
    "platform-oncall@example.com",
    "engineering-alerts@example.com"
  ]

  # ==========================================================================
  # API Gateway Monitoring
  # ==========================================================================

  api_name = "miyabi-api"

  # Absolute error counts (legacy alarms)
  api_5xx_threshold = 10

  # Error rate percentages (new alarms)
  api_5xx_error_rate_threshold = 5  # 5% server errors
  api_4xx_error_rate_threshold = 20 # 20% client errors

  # Latency thresholds
  api_latency_threshold_ms     = 3000 # P95 latency
  api_latency_p50_threshold_ms = 1000 # P50 latency
  api_latency_p99_threshold_ms = 5000 # P99 latency

  # ==========================================================================
  # ECS/Fargate Monitoring
  # ==========================================================================

  ecs_cluster_name = "miyabi-cluster-prod"
  ecs_service_name = "miyabi-app-service"

  ecs_cpu_threshold    = 80 # 80% CPU utilization
  ecs_memory_threshold = 80 # 80% memory utilization
  ecs_min_task_count   = 2  # Minimum 2 tasks running

  # ==========================================================================
  # Application Load Balancer Monitoring
  # ==========================================================================

  # ALB name format: app/name/id
  alb_name = "app/miyabi-alb-prod/1234567890abcdef"

  # Target group format: targetgroup/name/id
  alb_target_group_name = "targetgroup/miyabi-tg-prod/abcdef1234567890"

  # Response time thresholds
  alb_response_time_threshold_ms = 2000 # 2 seconds P95
  # P99 is automatically set to 1.5x P95 = 3 seconds

  # Error rate percentages
  alb_5xx_error_rate_threshold = 5  # 5% server errors
  alb_4xx_error_rate_threshold = 20 # 20% client errors

  # Healthy host requirements
  alb_min_healthy_hosts = 1 # At least 1 healthy target

  # ==========================================================================
  # Lambda Monitoring
  # ==========================================================================

  lambda_function_names = [
    "miyabi-api-handler",
    "miyabi-agent-processor",
    "miyabi-orchestrator",
    "miyabi-data-aggregator"
  ]

  # Absolute error count (legacy)
  lambda_error_threshold = 5

  # Error rate percentage (new)
  lambda_error_rate_threshold = 5 # 5% error rate

  # Duration threshold
  lambda_duration_threshold_ms = 10000 # 10 seconds P95

  # Throttling and concurrency
  lambda_throttle_threshold              = 10  # 10 throttles triggers alarm
  lambda_concurrent_executions_threshold = 100 # 100 concurrent executions

  # ==========================================================================
  # RDS Monitoring (Optional)
  # ==========================================================================

  rds_instance_identifier = "miyabi-db-prod"

  rds_cpu_threshold          = 80          # 80% CPU
  rds_connections_threshold  = 100         # 100 connections
  rds_storage_threshold_bytes = 5368709120 # 5GB free storage

  # ==========================================================================
  # Advanced Features
  # ==========================================================================

  # Enable composite alarms for complex failure scenarios
  enable_composite_alarms = true

  # Enable machine learning-based anomaly detection
  enable_anomaly_detection = true

  # ==========================================================================
  # Logging
  # ==========================================================================

  log_retention_days = 30 # 30 days retention

  # ==========================================================================
  # Tags
  # ==========================================================================

  tags = {
    Terraform   = "true"
    Environment = "prod"
    Team        = "platform"
    CostCenter  = "engineering"
    Project     = "miyabi"
  }
}

# =============================================================================
# Outputs
# =============================================================================

output "sns_topic_arn" {
  description = "SNS topic ARN for alarm notifications"
  value       = module.monitoring_complete.sns_topic_arn
}

output "dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = module.monitoring_complete.alarm_summary.dashboard_url
}

output "alarm_summary" {
  description = "Summary of all created alarms"
  value       = module.monitoring_complete.alarm_summary
}

output "critical_alarms" {
  description = "Critical composite alarm ARNs"
  value = {
    critical_system_health = module.monitoring_complete.critical_system_health_alarm_arn
    service_degradation    = module.monitoring_complete.service_degradation_alarm_arn
    resource_exhaustion    = module.monitoring_complete.resource_exhaustion_alarm_arn
  }
}
