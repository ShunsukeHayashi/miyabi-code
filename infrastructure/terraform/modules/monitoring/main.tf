/**
 * Monitoring Module
 * Issue: #851 - Terraform/CDK Infrastructure as Code
 *
 * Creates CloudWatch dashboards, alarms, and log groups
 * for comprehensive monitoring of Miyabi infrastructure.
 */

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

# =============================================================================
# Local Variables
# =============================================================================

locals {
  common_tags = merge(var.tags, {
    Module      = "monitoring"
    Project     = var.project_name
    Environment = var.environment
  })
}

# =============================================================================
# CloudWatch Log Groups
# =============================================================================

resource "aws_cloudwatch_log_group" "api" {
  name              = "/miyabi/${var.environment}/api"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "agents" {
  name              = "/miyabi/${var.environment}/agents"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "orchestrator" {
  name              = "/miyabi/${var.environment}/orchestrator"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

# =============================================================================
# SNS Topic for Alarms
# =============================================================================

resource "aws_sns_topic" "alarms" {
  name = "${var.project_name}-${var.environment}-alarms"

  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "email" {
  count = length(var.alarm_email_endpoints)

  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email_endpoints[count.index]
}

# =============================================================================
# CloudWatch Alarms - API
# =============================================================================

resource "aws_cloudwatch_metric_alarm" "api_5xx_errors" {
  alarm_name          = "${var.project_name}-${var.environment}-api-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = var.api_5xx_threshold
  alarm_description   = "API 5XX errors exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  ok_actions          = [aws_sns_topic.alarms.arn]

  dimensions = {
    ApiName = var.api_name
    Stage   = var.environment
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "${var.project_name}-${var.environment}-api-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = 300
  extended_statistic  = "p95"
  threshold           = var.api_latency_threshold_ms
  alarm_description   = "API P95 latency exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    ApiName = var.api_name
    Stage   = var.environment
  }

  tags = local.common_tags
}

# =============================================================================
# CloudWatch Alarms - Lambda
# =============================================================================

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = toset(var.lambda_function_names)

  alarm_name          = "${var.project_name}-${var.environment}-lambda-${each.key}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = var.lambda_error_threshold
  alarm_description   = "Lambda function ${each.key} errors exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    FunctionName = each.key
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  for_each = toset(var.lambda_function_names)

  alarm_name          = "${var.project_name}-${var.environment}-lambda-${each.key}-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 300
  extended_statistic  = "p95"
  threshold           = var.lambda_duration_threshold_ms
  alarm_description   = "Lambda function ${each.key} P95 duration exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    FunctionName = each.key
  }

  tags = local.common_tags
}

# =============================================================================
# CloudWatch Alarms - RDS
# =============================================================================

resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  count = var.rds_instance_identifier != "" ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-rds-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = var.rds_cpu_threshold
  alarm_description   = "RDS CPU utilization exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_identifier
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "rds_connections" {
  count = var.rds_instance_identifier != "" ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-rds-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = var.rds_connections_threshold
  alarm_description   = "RDS connections exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_identifier
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "rds_storage" {
  count = var.rds_instance_identifier != "" ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-rds-storage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = var.rds_storage_threshold_bytes
  alarm_description   = "RDS free storage space below threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_identifier
  }

  tags = local.common_tags
}

# =============================================================================
# CloudWatch Dashboard
# =============================================================================

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "API Response Time (P95)"
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          metrics = [
            ["AWS/ApiGateway", "Latency", "ApiName", var.api_name, "Stage", var.environment, { stat = "p95" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "API Request Count"
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiName", var.api_name, "Stage", var.environment, { stat = "Sum" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title   = "API Errors"
          view    = "timeSeries"
          stacked = true
          region  = var.aws_region
          metrics = [
            ["AWS/ApiGateway", "4XXError", "ApiName", var.api_name, "Stage", var.environment, { stat = "Sum", color = "#ff7f0e" }],
            [".", "5XXError", ".", ".", ".", ".", { stat = "Sum", color = "#d62728" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title   = "Lambda Invocations"
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          metrics = [
            for fn in var.lambda_function_names : ["AWS/Lambda", "Invocations", "FunctionName", fn, { stat = "Sum" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 24
        height = 6
        properties = {
          title   = "RDS Metrics"
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          metrics = var.rds_instance_identifier != "" ? [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", var.rds_instance_identifier, { stat = "Average" }],
            [".", "DatabaseConnections", ".", ".", { stat = "Average", yAxis = "right" }]
          ] : []
        }
      }
    ]
  })
}

# =============================================================================
# CloudWatch Alarms - ECS/Fargate
# =============================================================================

# ECS Service CPU Utilization
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  count = var.ecs_cluster_name != "" ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = var.ecs_cpu_threshold
  alarm_description   = "ECS CPU utilization exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  ok_actions          = [aws_sns_topic.alarms.arn]

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }

  tags = local.common_tags
}

# ECS Service Memory Utilization
resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  count = var.ecs_cluster_name != "" ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-ecs-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = var.ecs_memory_threshold
  alarm_description   = "ECS memory utilization exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  ok_actions          = [aws_sns_topic.alarms.arn]

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }

  tags = local.common_tags
}

# ECS Running Task Count (Low)
resource "aws_cloudwatch_metric_alarm" "ecs_task_count_low" {
  count = var.ecs_cluster_name != "" ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-ecs-task-count-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "RunningTaskCount"
  namespace           = "ECS/ContainerInsights"
  period              = 60
  statistic           = "Average"
  threshold           = var.ecs_min_task_count
  alarm_description   = "ECS running task count below minimum threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }

  tags = local.common_tags
}

# =============================================================================
# CloudWatch Alarms - ALB (Application Load Balancer)
# =============================================================================

# ALB Target Response Time (P95)
resource "aws_cloudwatch_metric_alarm" "alb_response_time_p95" {
  count = var.alb_name != "" ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-alb-response-time-p95"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  extended_statistic  = "p95"
  threshold           = var.alb_response_time_threshold_ms / 1000
  alarm_description   = "ALB target P95 response time exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  ok_actions          = [aws_sns_topic.alarms.arn]

  dimensions = {
    LoadBalancer = var.alb_name
  }

  tags = local.common_tags
}

# ALB Target Response Time (P99)
resource "aws_cloudwatch_metric_alarm" "alb_response_time_p99" {
  count = var.alb_name != "" ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-alb-response-time-p99"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  extended_statistic  = "p99"
  threshold           = (var.alb_response_time_threshold_ms * 1.5) / 1000
  alarm_description   = "ALB target P99 response time exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    LoadBalancer = var.alb_name
  }

  tags = local.common_tags
}

# ALB 5XX Error Rate
resource "aws_cloudwatch_metric_alarm" "alb_5xx_error_rate" {
  count = var.alb_name != "" ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-alb-5xx-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  threshold           = var.alb_5xx_error_rate_threshold

  alarm_description = "ALB 5XX error rate exceeded threshold"
  alarm_actions     = [aws_sns_topic.alarms.arn]
  ok_actions        = [aws_sns_topic.alarms.arn]

  metric_query {
    id          = "error_rate"
    expression  = "error_count / request_count * 100"
    label       = "5XX Error Rate (%)"
    return_data = true
  }

  metric_query {
    id = "error_count"
    metric {
      metric_name = "HTTPCode_Target_5XX_Count"
      namespace   = "AWS/ApplicationELB"
      period      = 300
      stat        = "Sum"
      dimensions = {
        LoadBalancer = var.alb_name
      }
    }
  }

  metric_query {
    id = "request_count"
    metric {
      metric_name = "RequestCount"
      namespace   = "AWS/ApplicationELB"
      period      = 300
      stat        = "Sum"
      dimensions = {
        LoadBalancer = var.alb_name
      }
    }
  }

  tags = local.common_tags
}

# ALB 4XX Error Rate
resource "aws_cloudwatch_metric_alarm" "alb_4xx_error_rate" {
  count = var.alb_name != "" ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-alb-4xx-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  threshold           = var.alb_4xx_error_rate_threshold

  alarm_description = "ALB 4XX error rate exceeded threshold"
  alarm_actions     = [aws_sns_topic.alarms.arn]

  metric_query {
    id          = "error_rate"
    expression  = "error_count / request_count * 100"
    label       = "4XX Error Rate (%)"
    return_data = true
  }

  metric_query {
    id = "error_count"
    metric {
      metric_name = "HTTPCode_Target_4XX_Count"
      namespace   = "AWS/ApplicationELB"
      period      = 300
      stat        = "Sum"
      dimensions = {
        LoadBalancer = var.alb_name
      }
    }
  }

  metric_query {
    id = "request_count"
    metric {
      metric_name = "RequestCount"
      namespace   = "AWS/ApplicationELB"
      period      = 300
      stat        = "Sum"
      dimensions = {
        LoadBalancer = var.alb_name
      }
    }
  }

  tags = local.common_tags
}

# ALB Unhealthy Host Count
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_hosts" {
  count = var.alb_target_group_name != "" ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-alb-unhealthy-hosts"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "ALB has unhealthy targets"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  ok_actions          = [aws_sns_topic.alarms.arn]

  dimensions = {
    TargetGroup  = var.alb_target_group_name
    LoadBalancer = var.alb_name
  }

  tags = local.common_tags
}

# ALB Healthy Host Count (Low)
resource "aws_cloudwatch_metric_alarm" "alb_healthy_hosts_low" {
  count = var.alb_target_group_name != "" ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-alb-healthy-hosts-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = var.alb_min_healthy_hosts
  alarm_description   = "ALB healthy host count below minimum threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    TargetGroup  = var.alb_target_group_name
    LoadBalancer = var.alb_name
  }

  tags = local.common_tags
}

# =============================================================================
# CloudWatch Alarms - API Gateway Error Rate
# =============================================================================

# API Gateway 5XX Error Rate
resource "aws_cloudwatch_metric_alarm" "api_5xx_error_rate" {
  alarm_name          = "${var.project_name}-${var.environment}-api-5xx-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  threshold           = var.api_5xx_error_rate_threshold

  alarm_description = "API Gateway 5XX error rate exceeded threshold"
  alarm_actions     = [aws_sns_topic.alarms.arn]
  ok_actions        = [aws_sns_topic.alarms.arn]

  metric_query {
    id          = "error_rate"
    expression  = "error_count / request_count * 100"
    label       = "5XX Error Rate (%)"
    return_data = true
  }

  metric_query {
    id = "error_count"
    metric {
      metric_name = "5XXError"
      namespace   = "AWS/ApiGateway"
      period      = 300
      stat        = "Sum"
      dimensions = {
        ApiName = var.api_name
        Stage   = var.environment
      }
    }
  }

  metric_query {
    id = "request_count"
    metric {
      metric_name = "Count"
      namespace   = "AWS/ApiGateway"
      period      = 300
      stat        = "Sum"
      dimensions = {
        ApiName = var.api_name
        Stage   = var.environment
      }
    }
  }

  tags = local.common_tags
}

# API Gateway 4XX Error Rate
resource "aws_cloudwatch_metric_alarm" "api_4xx_error_rate" {
  alarm_name          = "${var.project_name}-${var.environment}-api-4xx-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  threshold           = var.api_4xx_error_rate_threshold

  alarm_description = "API Gateway 4XX error rate exceeded threshold"
  alarm_actions     = [aws_sns_topic.alarms.arn]

  metric_query {
    id          = "error_rate"
    expression  = "error_count / request_count * 100"
    label       = "4XX Error Rate (%)"
    return_data = true
  }

  metric_query {
    id = "error_count"
    metric {
      metric_name = "4XXError"
      namespace   = "AWS/ApiGateway"
      period      = 300
      stat        = "Sum"
      dimensions = {
        ApiName = var.api_name
        Stage   = var.environment
      }
    }
  }

  metric_query {
    id = "request_count"
    metric {
      metric_name = "Count"
      namespace   = "AWS/ApiGateway"
      period      = 300
      stat        = "Sum"
      dimensions = {
        ApiName = var.api_name
        Stage   = var.environment
      }
    }
  }

  tags = local.common_tags
}

# API Gateway Latency P50
resource "aws_cloudwatch_metric_alarm" "api_latency_p50" {
  alarm_name          = "${var.project_name}-${var.environment}-api-latency-p50"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = 300
  extended_statistic  = "p50"
  threshold           = var.api_latency_p50_threshold_ms
  alarm_description   = "API P50 latency exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    ApiName = var.api_name
    Stage   = var.environment
  }

  tags = local.common_tags
}

# API Gateway Latency P99
resource "aws_cloudwatch_metric_alarm" "api_latency_p99" {
  alarm_name          = "${var.project_name}-${var.environment}-api-latency-p99"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = 300
  extended_statistic  = "p99"
  threshold           = var.api_latency_p99_threshold_ms
  alarm_description   = "API P99 latency exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    ApiName = var.api_name
    Stage   = var.environment
  }

  tags = local.common_tags
}

# =============================================================================
# CloudWatch Alarms - Lambda Error Rate
# =============================================================================

# Lambda Error Rate per Function
resource "aws_cloudwatch_metric_alarm" "lambda_error_rate" {
  for_each = toset(var.lambda_function_names)

  alarm_name          = "${var.project_name}-${var.environment}-lambda-${each.key}-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  threshold           = var.lambda_error_rate_threshold

  alarm_description = "Lambda function ${each.key} error rate exceeded threshold"
  alarm_actions     = [aws_sns_topic.alarms.arn]
  ok_actions        = [aws_sns_topic.alarms.arn]

  metric_query {
    id          = "error_rate"
    expression  = "errors / invocations * 100"
    label       = "Error Rate (%)"
    return_data = true
  }

  metric_query {
    id = "errors"
    metric {
      metric_name = "Errors"
      namespace   = "AWS/Lambda"
      period      = 300
      stat        = "Sum"
      dimensions = {
        FunctionName = each.key
      }
    }
  }

  metric_query {
    id = "invocations"
    metric {
      metric_name = "Invocations"
      namespace   = "AWS/Lambda"
      period      = 300
      stat        = "Sum"
      dimensions = {
        FunctionName = each.key
      }
    }
  }

  tags = local.common_tags
}

# Lambda Throttles
resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  for_each = toset(var.lambda_function_names)

  alarm_name          = "${var.project_name}-${var.environment}-lambda-${each.key}-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = var.lambda_throttle_threshold
  alarm_description   = "Lambda function ${each.key} throttles detected"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    FunctionName = each.key
  }

  tags = local.common_tags
}

# Lambda Concurrent Executions
resource "aws_cloudwatch_metric_alarm" "lambda_concurrent_executions" {
  for_each = toset(var.lambda_function_names)

  alarm_name          = "${var.project_name}-${var.environment}-lambda-${each.key}-concurrent-executions"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ConcurrentExecutions"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Maximum"
  threshold           = var.lambda_concurrent_executions_threshold
  alarm_description   = "Lambda function ${each.key} concurrent executions exceeded threshold"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    FunctionName = each.key
  }

  tags = local.common_tags
}

# =============================================================================
# Composite Alarms
# =============================================================================

# Critical System Health: High Error Rate + High Latency
resource "aws_cloudwatch_composite_alarm" "critical_system_health" {
  count = var.enable_composite_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-critical-system-health"
  alarm_description   = "Critical: High error rate AND high latency detected"
  actions_enabled     = true
  alarm_actions       = [aws_sns_topic.alarms.arn]
  ok_actions          = [aws_sns_topic.alarms.arn]

  alarm_rule = "ALARM(${aws_cloudwatch_metric_alarm.api_5xx_error_rate.alarm_name}) AND ALARM(${aws_cloudwatch_metric_alarm.api_latency.alarm_name})"

  tags = local.common_tags
}

# Service Degradation: High latency OR elevated errors
resource "aws_cloudwatch_composite_alarm" "service_degradation" {
  count = var.enable_composite_alarms && var.alb_name != "" ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-service-degradation"
  alarm_description   = "Service degradation: High latency OR elevated errors"
  actions_enabled     = true
  alarm_actions       = [aws_sns_topic.alarms.arn]

  alarm_rule = "ALARM(${aws_cloudwatch_metric_alarm.alb_response_time_p95[0].alarm_name}) OR ALARM(${aws_cloudwatch_metric_alarm.alb_5xx_error_rate[0].alarm_name})"

  tags = local.common_tags
}

# Resource Exhaustion: High CPU + High Memory
resource "aws_cloudwatch_composite_alarm" "resource_exhaustion" {
  count = var.enable_composite_alarms && var.ecs_cluster_name != "" ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-resource-exhaustion"
  alarm_description   = "Resource exhaustion: High CPU AND high memory utilization"
  actions_enabled     = true
  alarm_actions       = [aws_sns_topic.alarms.arn]
  ok_actions          = [aws_sns_topic.alarms.arn]

  alarm_rule = "ALARM(${aws_cloudwatch_metric_alarm.ecs_cpu_high[0].alarm_name}) AND ALARM(${aws_cloudwatch_metric_alarm.ecs_memory_high[0].alarm_name})"

  tags = local.common_tags
}

# =============================================================================
# CloudWatch Anomaly Detection
# =============================================================================

# API Request Count Anomaly Detection
resource "aws_cloudwatch_metric_alarm" "api_request_anomaly" {
  count = var.enable_anomaly_detection ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-api-request-anomaly"
  comparison_operator = "LessThanLowerOrGreaterThanUpperThreshold"
  evaluation_periods  = 2
  threshold_metric_id = "anomaly_threshold"
  alarm_description   = "API request count shows anomalous behavior"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  metric_query {
    id          = "actual_requests"
    return_data = true
    metric {
      metric_name = "Count"
      namespace   = "AWS/ApiGateway"
      period      = 300
      stat        = "Sum"
      dimensions = {
        ApiName = var.api_name
        Stage   = var.environment
      }
    }
  }

  metric_query {
    id          = "anomaly_threshold"
    expression  = "ANOMALY_DETECTION_BAND(actual_requests, 2)"
    label       = "Request Count (Expected)"
    return_data = true
  }

  tags = local.common_tags
}

# ALB Response Time Anomaly Detection
resource "aws_cloudwatch_metric_alarm" "alb_response_time_anomaly" {
  count = var.enable_anomaly_detection && var.alb_name != "" ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-alb-response-time-anomaly"
  comparison_operator = "GreaterThanUpperThreshold"
  evaluation_periods  = 2
  threshold_metric_id = "anomaly_threshold"
  alarm_description   = "ALB response time shows anomalous behavior"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  metric_query {
    id          = "actual_response_time"
    return_data = true
    metric {
      metric_name = "TargetResponseTime"
      namespace   = "AWS/ApplicationELB"
      period      = 300
      stat        = "Average"
      dimensions = {
        LoadBalancer = var.alb_name
      }
    }
  }

  metric_query {
    id          = "anomaly_threshold"
    expression  = "ANOMALY_DETECTION_BAND(actual_response_time, 2)"
    label       = "Response Time (Expected)"
    return_data = true
  }

  tags = local.common_tags
}
