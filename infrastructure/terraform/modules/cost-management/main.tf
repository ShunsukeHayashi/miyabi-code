# Cost Management Module for Miyabi Infrastructure
# Issue: #848 - コストトラッキング & 最適化
#
# Target: Monthly cost $1,200-1,500

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# =============================================================================
# Local Variables
# =============================================================================

locals {
  name_prefix = "miyabi-${var.environment}"

  common_tags = merge(var.tags, {
    Module      = "cost-management"
    Environment = var.environment
    Project     = "Miyabi"
    CostCenter  = "Platform"
  })
}

# =============================================================================
# AWS Budgets
# =============================================================================

resource "aws_budgets_budget" "monthly_total" {
  name              = "${local.name_prefix}-monthly-budget"
  budget_type       = "COST"
  limit_amount      = var.monthly_budget_limit
  limit_unit        = "USD"
  time_period_start = "2025-01-01_00:00"
  time_unit         = "MONTHLY"

  cost_filter {
    name = "TagKeyValue"
    values = [
      "user:Project$Miyabi"
    ]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 50
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_notification_emails
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_notification_emails
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.budget_notification_emails
  }

  tags = local.common_tags
}

# Service-specific budgets
resource "aws_budgets_budget" "ec2_budget" {
  name              = "${local.name_prefix}-ec2-budget"
  budget_type       = "COST"
  limit_amount      = var.ec2_budget_limit
  limit_unit        = "USD"
  time_period_start = "2025-01-01_00:00"
  time_unit         = "MONTHLY"

  cost_filter {
    name   = "Service"
    values = ["Amazon Elastic Compute Cloud - Compute"]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_notification_emails
  }

  tags = local.common_tags
}

resource "aws_budgets_budget" "bedrock_budget" {
  name              = "${local.name_prefix}-bedrock-budget"
  budget_type       = "COST"
  limit_amount      = var.bedrock_budget_limit
  limit_unit        = "USD"
  time_period_start = "2025-01-01_00:00"
  time_unit         = "MONTHLY"

  cost_filter {
    name   = "Service"
    values = ["Amazon Bedrock"]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 70
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_notification_emails
  }

  tags = local.common_tags
}

# =============================================================================
# S3 Intelligent-Tiering (50% savings)
# =============================================================================

resource "aws_s3_bucket_intelligent_tiering_configuration" "main" {
  count  = var.enable_s3_intelligent_tiering ? 1 : 0
  bucket = var.s3_bucket_id
  name   = "${local.name_prefix}-intelligent-tiering"

  status = "Enabled"

  filter {
    prefix = ""
  }

  tiering {
    access_tier = "ARCHIVE_ACCESS"
    days        = 90
  }

  tiering {
    access_tier = "DEEP_ARCHIVE_ACCESS"
    days        = 180
  }
}

# =============================================================================
# CloudWatch Cost Anomaly Detection
# =============================================================================

resource "aws_ce_anomaly_monitor" "service_monitor" {
  name              = "${local.name_prefix}-service-anomaly"
  monitor_type      = "DIMENSIONAL"
  monitor_dimension = "SERVICE"
}

resource "aws_ce_anomaly_subscription" "alerts" {
  name      = "${local.name_prefix}-anomaly-alerts"
  frequency = "DAILY"

  monitor_arn_list = [
    aws_ce_anomaly_monitor.service_monitor.arn
  ]

  subscriber {
    type    = "EMAIL"
    address = var.budget_notification_emails[0]
  }

  threshold_expression {
    dimension {
      key           = "ANOMALY_TOTAL_IMPACT_ABSOLUTE"
      values        = [var.anomaly_threshold_usd]
      match_options = ["GREATER_THAN_OR_EQUAL"]
    }
  }

  tags = local.common_tags
}

# =============================================================================
# VPC Endpoints (NAT Gateway savings)
# =============================================================================

resource "aws_vpc_endpoint" "s3" {
  count = var.enable_vpc_endpoints && var.vpc_id != "" ? 1 : 0

  vpc_id            = var.vpc_id
  service_name      = "com.amazonaws.${data.aws_region.current.name}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = var.route_table_ids

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-endpoint"
    Type = "gateway"
  })
}

resource "aws_vpc_endpoint" "dynamodb" {
  count = var.enable_vpc_endpoints && var.vpc_id != "" ? 1 : 0

  vpc_id            = var.vpc_id
  service_name      = "com.amazonaws.${data.aws_region.current.name}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = var.route_table_ids

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-dynamodb-endpoint"
    Type = "gateway"
  })
}

resource "aws_vpc_endpoint" "ecr_api" {
  count = var.enable_vpc_endpoints && var.vpc_id != "" ? 1 : 0

  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.ecr.api"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.private_subnet_ids
  security_group_ids  = var.vpc_endpoint_security_group_ids
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ecr-api-endpoint"
    Type = "interface"
  })
}

resource "aws_vpc_endpoint" "ecr_dkr" {
  count = var.enable_vpc_endpoints && var.vpc_id != "" ? 1 : 0

  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.private_subnet_ids
  security_group_ids  = var.vpc_endpoint_security_group_ids
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ecr-dkr-endpoint"
    Type = "interface"
  })
}

resource "aws_vpc_endpoint" "logs" {
  count = var.enable_vpc_endpoints && var.vpc_id != "" ? 1 : 0

  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.logs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.private_subnet_ids
  security_group_ids  = var.vpc_endpoint_security_group_ids
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-logs-endpoint"
    Type = "interface"
  })
}

# =============================================================================
# Cost Dashboard
# =============================================================================

resource "aws_cloudwatch_dashboard" "cost" {
  dashboard_name = "${local.name_prefix}-cost-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "text"
        x      = 0
        y      = 0
        width  = 24
        height = 1
        properties = {
          markdown = "# Miyabi Cost Dashboard - Target: $${var.monthly_budget_limit}/month"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 1
        width  = 12
        height = 6
        properties = {
          title  = "Daily Cost Trend"
          region = data.aws_region.current.name
          metrics = [
            ["AWS/Billing", "EstimatedCharges", "Currency", "USD", { stat = "Maximum", period = 86400 }]
          ]
          view = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 1
        width  = 12
        height = 6
        properties = {
          title  = "EC2 Instance Hours"
          region = data.aws_region.current.name
          metrics = [
            ["AWS/EC2", "CPUUtilization", { stat = "SampleCount", period = 86400 }]
          ]
          view = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 7
        width  = 8
        height = 6
        properties = {
          title  = "DynamoDB Consumed Capacity"
          region = data.aws_region.current.name
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", { stat = "Sum", period = 86400 }],
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", { stat = "Sum", period = 86400 }]
          ]
          view = "bar"
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 7
        width  = 8
        height = 6
        properties = {
          title  = "S3 Storage Size"
          region = data.aws_region.current.name
          metrics = [
            ["AWS/S3", "BucketSizeBytes", "StorageType", "StandardStorage", { stat = "Average", period = 86400 }]
          ]
          view = "bar"
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 7
        width  = 8
        height = 6
        properties = {
          title  = "NAT Gateway Data Transfer"
          region = data.aws_region.current.name
          metrics = [
            ["AWS/NATGateway", "BytesOutToDestination", { stat = "Sum", period = 86400 }],
            ["AWS/NATGateway", "BytesOutToSource", { stat = "Sum", period = 86400 }]
          ]
          view = "timeSeries"
        }
      }
    ]
  })
}

# =============================================================================
# Cost Alarms
# =============================================================================

resource "aws_cloudwatch_metric_alarm" "daily_cost_spike" {
  alarm_name          = "${local.name_prefix}-daily-cost-spike"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "EstimatedCharges"
  namespace           = "AWS/Billing"
  period              = 86400
  statistic           = "Maximum"
  threshold           = var.daily_cost_threshold
  alarm_description   = "Daily cost exceeds threshold"

  dimensions = {
    Currency = "USD"
  }

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  tags = local.common_tags
}

# =============================================================================
# Data Sources
# =============================================================================

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}
