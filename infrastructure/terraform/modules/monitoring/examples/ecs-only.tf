# ECS-Only Monitoring Example
# Focused monitoring for ECS/Fargate applications with ALB

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

# ECS-focused monitoring configuration
module "monitoring_ecs" {
  source = "../"

  project_name = "miyabi"
  environment  = "staging"
  aws_region   = "ap-northeast-1"

  # Notifications
  alarm_email_endpoints = [
    "platform-team@example.com"
  ]

  # ==========================================================================
  # ECS/Fargate Monitoring
  # ==========================================================================

  ecs_cluster_name = "miyabi-cluster-staging"
  ecs_service_name = "miyabi-app-service"

  # Resource thresholds
  ecs_cpu_threshold    = 75 # Alert at 75% CPU
  ecs_memory_threshold = 75 # Alert at 75% memory
  ecs_min_task_count   = 2  # Ensure at least 2 tasks running

  # ==========================================================================
  # Application Load Balancer
  # ==========================================================================

  # ALB monitors the health of ECS tasks
  alb_name              = "app/miyabi-alb-staging/abc123"
  alb_target_group_name = "targetgroup/miyabi-tg-staging/xyz789"

  # Response time thresholds
  alb_response_time_threshold_ms = 3000 # 3 seconds for staging

  # Error rate thresholds
  alb_5xx_error_rate_threshold = 10 # More lenient for staging
  alb_4xx_error_rate_threshold = 30

  # Health checks
  alb_min_healthy_hosts = 1 # At least 1 healthy target

  # ==========================================================================
  # API Gateway (Minimal)
  # ==========================================================================

  # Required but not primary focus
  api_name = "miyabi-api-staging"

  # ==========================================================================
  # Advanced Features
  # ==========================================================================

  # Enable composite alarms to detect resource exhaustion
  enable_composite_alarms = true

  # Composite alarm will trigger when:
  # - ECS CPU > 75% AND ECS memory > 75% (resource exhaustion)
  # - ALB response time high OR ALB errors high (service degradation)

  # Disable anomaly detection for staging
  enable_anomaly_detection = false

  # Logging
  log_retention_days = 14

  tags = {
    Terraform   = "true"
    Environment = "staging"
    Team        = "platform"
    Service     = "ecs-app"
  }
}

# =============================================================================
# Outputs
# =============================================================================

output "ecs_alarms" {
  description = "ECS alarm names"
  value = {
    cpu_high       = module.monitoring_ecs.alarm_summary.ecs_alarms.cpu_high
    memory_high    = module.monitoring_ecs.alarm_summary.ecs_alarms.memory_high
    task_count_low = module.monitoring_ecs.alarm_summary.ecs_alarms.task_count_low
  }
}

output "alb_alarms" {
  description = "ALB alarm names"
  value       = module.monitoring_ecs.alarm_summary.alb_alarms
}

output "composite_alarms" {
  description = "Composite alarm names"
  value = {
    resource_exhaustion = module.monitoring_ecs.resource_exhaustion_alarm_arn
    service_degradation = module.monitoring_ecs.service_degradation_alarm_arn
  }
}

output "dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = module.monitoring_ecs.alarm_summary.dashboard_url
}
