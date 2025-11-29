# ==============================================================================
# DynamoDB Table for Miyabi Lambda Functions
# ==============================================================================
# Purpose: Single-table design for all Miyabi entities
# Documentation: See openai-apps/miyabi-app/DYNAMODB_SCHEMA.md
# ==============================================================================

resource "aws_dynamodb_table" "miyabi_lambda_data" {
  name           = "${var.project_name}-lambda-data-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST" # On-Demand for Lambda workloads
  hash_key       = "PK"
  range_key      = "SK"
  stream_enabled = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  # ==============================================================================
  # Point-in-Time Recovery (PITR)
  # ==============================================================================
  point_in_time_recovery {
    enabled = true
  }

  # ==============================================================================
  # Server-Side Encryption
  # ==============================================================================
  server_side_encryption {
    enabled     = true
    kms_key_arn = var.dynamodb_kms_key_arn != "" ? var.dynamodb_kms_key_arn : null
  }

  # ==============================================================================
  # Primary Keys
  # ==============================================================================
  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  # ==============================================================================
  # GSI1 Attributes (Status/Type Index)
  # ==============================================================================
  attribute {
    name = "GSI1PK"
    type = "S"
  }

  attribute {
    name = "GSI1SK"
    type = "S"
  }

  # ==============================================================================
  # GSI2 Attributes (Organization Index)
  # ==============================================================================
  attribute {
    name = "GSI2PK"
    type = "S"
  }

  attribute {
    name = "GSI2SK"
    type = "S"
  }

  # ==============================================================================
  # GSI1: StatusIndex
  # ==============================================================================
  # Purpose: Query by status, agent type, or other categorical filters
  # Access Patterns:
  #   - Get all running executions
  #   - Get all pending tasks
  #   - Get all executions by agent type
  # ==============================================================================
  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }

  # ==============================================================================
  # GSI2: OrganizationIndex
  # ==============================================================================
  # Purpose: Query organization-scoped entities
  # Access Patterns:
  #   - Get all users in an organization
  #   - Get all repositories in an organization
  #   - Organization-based access control
  # ==============================================================================
  global_secondary_index {
    name            = "GSI2"
    hash_key        = "GSI2PK"
    range_key       = "GSI2SK"
    projection_type = "ALL"
  }

  # ==============================================================================
  # TTL Configuration
  # ==============================================================================
  # Automatically deletes expired items (WebSocket connections, logs, etc.)
  # ==============================================================================
  ttl {
    attribute_name = "TTL"
    enabled        = true
  }

  # ==============================================================================
  # Tags
  # ==============================================================================
  tags = {
    Name        = "${var.project_name}-lambda-data"
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = var.project_name
    Purpose     = "Single-table design for Miyabi entities"
  }
}

# ==============================================================================
# CloudWatch Alarms for DynamoDB
# ==============================================================================

# Alarm: Throttling Detection
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttle" {
  alarm_name          = "${var.project_name}-dynamodb-throttle-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "DynamoDB throttling detected - consider switching to provisioned capacity"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.miyabi_lambda_data.name
  }

  tags = {
    Name        = "${var.project_name}-dynamodb-throttle-alarm"
    Environment = var.environment
    Severity    = "high"
  }
}

# Alarm: High Latency Detection
resource "aws_cloudwatch_metric_alarm" "dynamodb_latency" {
  alarm_name          = "${var.project_name}-dynamodb-latency-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "SuccessfulRequestLatency"
  namespace           = "AWS/DynamoDB"
  period              = "60"
  statistic           = "Average"
  threshold           = "50" # 50ms p99 latency
  alarm_description   = "DynamoDB average latency exceeds 50ms"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.miyabi_lambda_data.name
  }

  tags = {
    Name        = "${var.project_name}-dynamodb-latency-alarm"
    Environment = var.environment
    Severity    = "medium"
  }
}

# Alarm: System Errors
resource "aws_cloudwatch_metric_alarm" "dynamodb_system_errors" {
  alarm_name          = "${var.project_name}-dynamodb-system-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "SystemErrors"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "DynamoDB system errors detected"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.miyabi_lambda_data.name
  }

  tags = {
    Name        = "${var.project_name}-dynamodb-system-errors-alarm"
    Environment = var.environment
    Severity    = "critical"
  }
}

# ==============================================================================
# DynamoDB Streams Lambda Processor (Optional)
# ==============================================================================
# Uncomment if you need to process DynamoDB stream events
# ==============================================================================

# resource "aws_lambda_function" "dynamodb_stream_processor" {
#   function_name    = "${var.project_name}-dynamodb-stream-processor-${var.environment}"
#   role             = aws_iam_role.lambda_stream_processor.arn
#   handler          = "index.handler"
#   runtime          = "nodejs18.x"
#   filename         = "${path.module}/../lambda/stream-processor.zip"
#   source_code_hash = filebase64sha256("${path.module}/../lambda/stream-processor.zip")
#
#   environment {
#     variables = {
#       ENVIRONMENT = var.environment
#       TABLE_NAME  = aws_dynamodb_table.miyabi_lambda_data.name
#     }
#   }
#
#   tags = {
#     Name        = "${var.project_name}-stream-processor"
#     Environment = var.environment
#   }
# }
#
# resource "aws_lambda_event_source_mapping" "dynamodb_stream" {
#   event_source_arn  = aws_dynamodb_table.miyabi_lambda_data.stream_arn
#   function_name     = aws_lambda_function.dynamodb_stream_processor.arn
#   starting_position = "LATEST"
#   batch_size        = 100
#
#   filter_criteria {
#     filter {
#       pattern = jsonencode({
#         eventName = ["INSERT", "MODIFY"]
#       })
#     }
#   }
# }

# ==============================================================================
# Outputs
# ==============================================================================

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.miyabi_lambda_data.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.miyabi_lambda_data.arn
}

output "dynamodb_stream_arn" {
  description = "ARN of the DynamoDB stream"
  value       = aws_dynamodb_table.miyabi_lambda_data.stream_arn
}

output "dynamodb_gsi1_name" {
  description = "Name of GSI1 (StatusIndex)"
  value       = "GSI1"
}

output "dynamodb_gsi2_name" {
  description = "Name of GSI2 (OrganizationIndex)"
  value       = "GSI2"
}
