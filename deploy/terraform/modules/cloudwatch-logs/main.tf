# ==============================================================================
# CloudWatch Logs Module for Miyabi MCP Server
# ==============================================================================

# KMS Key for CloudWatch Logs encryption
resource "aws_kms_key" "cloudwatch_logs" {
  description             = "KMS key for CloudWatch Logs encryption - ${var.project_name}"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-cloudwatch-logs-key"
    }
  )
}

resource "aws_kms_alias" "cloudwatch_logs" {
  name          = "alias/${var.project_name}-cloudwatch-logs"
  target_key_id = aws_kms_key.cloudwatch_logs.key_id
}

# CloudWatch Logs Key Policy
resource "aws_kms_key_policy" "cloudwatch_logs" {
  key_id = aws_kms_key.cloudwatch_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.aws_account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${var.aws_account_id}:log-group:/aws/ec2/${var.project_name}-*"
          }
        }
      }
    ]
  })
}

# ==============================================================================
# CloudWatch Log Groups
# ==============================================================================

# Application Logs
resource "aws_cloudwatch_log_group" "mcp_server" {
  name              = "/aws/ec2/${var.project_name}-mcp-server"
  retention_in_days = var.application_log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  tags = merge(
    var.tags,
    {
      Name        = "${var.project_name}-mcp-server-logs"
      Application = "miyabi-mcp-server"
      LogType     = "application"
    }
  )
}

# System Logs
resource "aws_cloudwatch_log_group" "system" {
  name              = "/aws/ec2/${var.project_name}-system"
  retention_in_days = var.system_log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  tags = merge(
    var.tags,
    {
      Name    = "${var.project_name}-system-logs"
      LogType = "system"
    }
  )
}

# CloudWatch Agent Logs
resource "aws_cloudwatch_log_group" "cloudwatch_agent" {
  name              = "/aws/ec2/${var.project_name}-cloudwatch-agent"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  tags = merge(
    var.tags,
    {
      Name    = "${var.project_name}-cloudwatch-agent-logs"
      LogType = "agent"
    }
  )
}

# ==============================================================================
# Log Metric Filters
# ==============================================================================

# Error Count Metric Filter
resource "aws_cloudwatch_log_metric_filter" "error_count" {
  name           = "${var.project_name}-error-count"
  log_group_name = aws_cloudwatch_log_group.mcp_server.name
  pattern        = "[time, request_id, level=ERROR*, ...]"

  metric_transformation {
    name      = "ErrorCount"
    namespace = var.cloudwatch_namespace
    value     = "1"
    unit      = "Count"
  }
}

# Critical Error Metric Filter
resource "aws_cloudwatch_log_metric_filter" "critical_error_count" {
  name           = "${var.project_name}-critical-error-count"
  log_group_name = aws_cloudwatch_log_group.mcp_server.name
  pattern        = "[time, request_id, level=CRITICAL*, ...]"

  metric_transformation {
    name      = "CriticalErrorCount"
    namespace = var.cloudwatch_namespace
    value     = "1"
    unit      = "Count"
  }
}

# Exception Metric Filter
resource "aws_cloudwatch_log_metric_filter" "exception_count" {
  name           = "${var.project_name}-exception-count"
  log_group_name = aws_cloudwatch_log_group.mcp_server.name
  pattern        = "Exception"

  metric_transformation {
    name      = "ExceptionCount"
    namespace = var.cloudwatch_namespace
    value     = "1"
    unit      = "Count"
  }
}

# Slow Request Metric Filter (>5 seconds)
resource "aws_cloudwatch_log_metric_filter" "slow_request_count" {
  name           = "${var.project_name}-slow-request-count"
  log_group_name = aws_cloudwatch_log_group.mcp_server.name
  pattern        = "[time, request_id, ..., duration>5000, ...]"

  metric_transformation {
    name      = "SlowRequestCount"
    namespace = var.cloudwatch_namespace
    value     = "1"
    unit      = "Count"
  }
}

# ==============================================================================
# CloudWatch Alarms
# ==============================================================================

# SNS Topic for Alarms
resource "aws_sns_topic" "cloudwatch_alarms" {
  name              = "${var.project_name}-cloudwatch-alarms"
  kms_master_key_id = aws_kms_key.cloudwatch_logs.id

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-cloudwatch-alarms"
    }
  )
}

resource "aws_sns_topic_subscription" "cloudwatch_alarms_email" {
  count     = var.alarm_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.cloudwatch_alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# Error Rate Alarm
resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "${var.project_name}-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ErrorCount"
  namespace           = var.cloudwatch_namespace
  period              = "300"
  statistic           = "Sum"
  threshold           = var.error_count_threshold
  alarm_description   = "This metric monitors error count"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms.arn]
  treat_missing_data  = "notBreaching"

  tags = merge(
    var.tags,
    {
      Name     = "${var.project_name}-high-error-rate-alarm"
      Severity = "High"
    }
  )
}

# Critical Error Alarm
resource "aws_cloudwatch_metric_alarm" "critical_error" {
  alarm_name          = "${var.project_name}-critical-error"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "CriticalErrorCount"
  namespace           = var.cloudwatch_namespace
  period              = "60"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors critical errors"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms.arn]
  treat_missing_data  = "notBreaching"

  tags = merge(
    var.tags,
    {
      Name     = "${var.project_name}-critical-error-alarm"
      Severity = "Critical"
    }
  )
}

# Exception Rate Alarm
resource "aws_cloudwatch_metric_alarm" "high_exception_rate" {
  alarm_name          = "${var.project_name}-high-exception-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ExceptionCount"
  namespace           = var.cloudwatch_namespace
  period              = "300"
  statistic           = "Sum"
  threshold           = var.exception_count_threshold
  alarm_description   = "This metric monitors exception count"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms.arn]
  treat_missing_data  = "notBreaching"

  tags = merge(
    var.tags,
    {
      Name     = "${var.project_name}-high-exception-rate-alarm"
      Severity = "High"
    }
  )
}

# Slow Request Alarm
resource "aws_cloudwatch_metric_alarm" "slow_requests" {
  alarm_name          = "${var.project_name}-slow-requests"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "SlowRequestCount"
  namespace           = var.cloudwatch_namespace
  period              = "300"
  statistic           = "Sum"
  threshold           = var.slow_request_count_threshold
  alarm_description   = "This metric monitors slow request count (>5s)"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms.arn]
  treat_missing_data  = "notBreaching"

  tags = merge(
    var.tags,
    {
      Name     = "${var.project_name}-slow-requests-alarm"
      Severity = "Medium"
    }
  )
}

# Log Group Size Alarm (prevent excessive logging)
resource "aws_cloudwatch_metric_alarm" "log_group_size" {
  alarm_name          = "${var.project_name}-log-group-size"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "IncomingBytes"
  namespace           = "AWS/Logs"
  period              = "3600"
  statistic           = "Sum"
  threshold           = var.log_size_threshold_bytes
  alarm_description   = "This metric monitors log group size"
  alarm_actions       = [aws_sns_topic.cloudwatch_alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    LogGroupName = aws_cloudwatch_log_group.mcp_server.name
  }

  tags = merge(
    var.tags,
    {
      Name     = "${var.project_name}-log-group-size-alarm"
      Severity = "Low"
    }
  )
}
