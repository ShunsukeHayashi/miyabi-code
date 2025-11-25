# Task Queue Module for 200-Agent Experiment
# Issue: #883 - Phase 3: 200-Agent Live Experiment & Production Readiness
#
# This module creates SQS queues for agent task management
# with dead letter queues for failed tasks.

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
    Module      = "task-queue"
    Environment = var.environment
    Project     = "Miyabi"
  })
}

# =============================================================================
# Agent Task Queue (Main Queue)
# =============================================================================

resource "aws_sqs_queue" "agent_tasks" {
  name                        = "${local.name_prefix}-agent-tasks"
  delay_seconds               = 0
  max_message_size            = 262144  # 256 KB
  message_retention_seconds   = 1209600 # 14 days
  receive_wait_time_seconds   = 20      # Long polling
  visibility_timeout_seconds  = var.visibility_timeout

  # Dead Letter Queue
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.agent_tasks_dlq.arn
    maxReceiveCount     = var.max_retry_count
  })

  # Server-side encryption
  sqs_managed_sse_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-agent-tasks"
    Type = "main-queue"
  })
}

# Dead Letter Queue for failed tasks
resource "aws_sqs_queue" "agent_tasks_dlq" {
  name                        = "${local.name_prefix}-agent-tasks-dlq"
  message_retention_seconds   = 1209600 # 14 days
  sqs_managed_sse_enabled     = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-agent-tasks-dlq"
    Type = "dead-letter-queue"
  })
}

# =============================================================================
# High Priority Queue
# =============================================================================

resource "aws_sqs_queue" "high_priority" {
  name                        = "${local.name_prefix}-agent-tasks-high"
  delay_seconds               = 0
  max_message_size            = 262144
  message_retention_seconds   = 1209600
  receive_wait_time_seconds   = 20
  visibility_timeout_seconds  = var.visibility_timeout

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.agent_tasks_dlq.arn
    maxReceiveCount     = var.max_retry_count
  })

  sqs_managed_sse_enabled = true

  tags = merge(local.common_tags, {
    Name     = "${local.name_prefix}-agent-tasks-high"
    Type     = "high-priority-queue"
    Priority = "high"
  })
}

# =============================================================================
# Agent Results Queue
# =============================================================================

resource "aws_sqs_queue" "agent_results" {
  name                        = "${local.name_prefix}-agent-results"
  delay_seconds               = 0
  max_message_size            = 262144
  message_retention_seconds   = 604800 # 7 days
  receive_wait_time_seconds   = 20
  visibility_timeout_seconds  = 30

  sqs_managed_sse_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-agent-results"
    Type = "results-queue"
  })
}

# =============================================================================
# FIFO Queue for Ordered Tasks (Optional)
# =============================================================================

resource "aws_sqs_queue" "ordered_tasks" {
  count = var.enable_fifo_queue ? 1 : 0

  name                        = "${local.name_prefix}-agent-tasks-ordered.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  deduplication_scope         = "messageGroup"
  fifo_throughput_limit       = "perMessageGroupId"

  message_retention_seconds   = 1209600
  receive_wait_time_seconds   = 20
  visibility_timeout_seconds  = var.visibility_timeout

  sqs_managed_sse_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-agent-tasks-ordered"
    Type = "fifo-queue"
  })
}

# =============================================================================
# CloudWatch Alarms
# =============================================================================

resource "aws_cloudwatch_metric_alarm" "queue_depth" {
  alarm_name          = "${local.name_prefix}-queue-depth"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Average"
  threshold           = var.queue_depth_alarm_threshold
  alarm_description   = "Agent task queue depth exceeds threshold"

  dimensions = {
    QueueName = aws_sqs_queue.agent_tasks.name
  }

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []
  ok_actions    = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "${local.name_prefix}-dlq-messages"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Messages in dead letter queue"

  dimensions = {
    QueueName = aws_sqs_queue.agent_tasks_dlq.name
  }

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "message_age" {
  alarm_name          = "${local.name_prefix}-message-age"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "ApproximateAgeOfOldestMessage"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Maximum"
  threshold           = var.max_message_age_seconds
  alarm_description   = "Oldest message in queue exceeds age threshold"

  dimensions = {
    QueueName = aws_sqs_queue.agent_tasks.name
  }

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  tags = local.common_tags
}

# =============================================================================
# IAM Policy for Queue Access
# =============================================================================

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

resource "aws_iam_policy" "task_queue_access" {
  name        = "${local.name_prefix}-task-queue-access"
  description = "Policy for accessing Miyabi agent task queues"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SendMessages"
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:SendMessageBatch"
        ]
        Resource = [
          aws_sqs_queue.agent_tasks.arn,
          aws_sqs_queue.high_priority.arn,
          aws_sqs_queue.agent_results.arn
        ]
      },
      {
        Sid    = "ReceiveMessages"
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:DeleteMessageBatch",
          "sqs:ChangeMessageVisibility",
          "sqs:ChangeMessageVisibilityBatch"
        ]
        Resource = [
          aws_sqs_queue.agent_tasks.arn,
          aws_sqs_queue.high_priority.arn,
          aws_sqs_queue.agent_results.arn
        ]
      },
      {
        Sid    = "GetQueueAttributes"
        Effect = "Allow"
        Action = [
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl"
        ]
        Resource = [
          aws_sqs_queue.agent_tasks.arn,
          aws_sqs_queue.high_priority.arn,
          aws_sqs_queue.agent_results.arn,
          aws_sqs_queue.agent_tasks_dlq.arn
        ]
      }
    ]
  })

  tags = local.common_tags
}
