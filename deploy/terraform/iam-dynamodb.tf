# ==============================================================================
# IAM Policies for DynamoDB Access
# ==============================================================================
# Purpose: Grant Lambda functions access to DynamoDB table and streams
# ==============================================================================

# ==============================================================================
# Lambda Execution Role (if not already created)
# ==============================================================================

# Uncomment if lambda execution role doesn't exist
# resource "aws_iam_role" "lambda_execution" {
#   name = "${var.project_name}-lambda-execution-${var.environment}"
#
#   assume_role_policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Action = "sts:AssumeRole"
#         Effect = "Allow"
#         Principal = {
#           Service = "lambda.amazonaws.com"
#         }
#       }
#     ]
#   })
#
#   tags = {
#     Name        = "${var.project_name}-lambda-execution"
#     Environment = var.environment
#   }
# }

# ==============================================================================
# DynamoDB Access Policy
# ==============================================================================

data "aws_iam_policy_document" "lambda_dynamodb" {
  # DynamoDB Table Operations
  statement {
    sid    = "DynamoDBTableAccess"
    effect = "Allow"

    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem",
      "dynamodb:ConditionCheckItem",
    ]

    resources = [
      aws_dynamodb_table.miyabi_lambda_data.arn,
    ]
  }

  # DynamoDB GSI Operations
  statement {
    sid    = "DynamoDBIndexAccess"
    effect = "Allow"

    actions = [
      "dynamodb:Query",
      "dynamodb:Scan",
    ]

    resources = [
      "${aws_dynamodb_table.miyabi_lambda_data.arn}/index/*"
    ]
  }

  # DynamoDB Streams
  statement {
    sid    = "DynamoDBStreamsAccess"
    effect = "Allow"

    actions = [
      "dynamodb:DescribeStream",
      "dynamodb:GetRecords",
      "dynamodb:GetShardIterator",
      "dynamodb:ListStreams",
    ]

    resources = [
      "${aws_dynamodb_table.miyabi_lambda_data.arn}/stream/*"
    ]
  }

  # DynamoDB Transactions
  statement {
    sid    = "DynamoDBTransactions"
    effect = "Allow"

    actions = [
      "dynamodb:TransactGetItems",
      "dynamodb:TransactWriteItems",
    ]

    resources = [
      aws_dynamodb_table.miyabi_lambda_data.arn,
    ]
  }
}

resource "aws_iam_policy" "lambda_dynamodb" {
  name        = "${var.project_name}-lambda-dynamodb-${var.environment}"
  description = "DynamoDB access policy for Miyabi Lambda functions"
  policy      = data.aws_iam_policy_document.lambda_dynamodb.json

  tags = {
    Name        = "${var.project_name}-lambda-dynamodb"
    Environment = var.environment
  }
}

# ==============================================================================
# Attach DynamoDB Policy to Lambda Execution Role
# ==============================================================================

# Update this to attach to your existing Lambda execution role
# resource "aws_iam_role_policy_attachment" "lambda_dynamodb" {
#   role       = aws_iam_role.lambda_execution.name
#   policy_arn = aws_iam_policy.lambda_dynamodb.arn
# }

# ==============================================================================
# KMS Key Policy for DynamoDB Encryption (Optional)
# ==============================================================================

# Uncomment if using customer-managed KMS key
# data "aws_iam_policy_document" "dynamodb_kms" {
#   statement {
#     sid    = "Enable IAM User Permissions"
#     effect = "Allow"
#
#     principals {
#       type        = "AWS"
#       identifiers = ["arn:aws:iam::${var.aws_account_id}:root"]
#     }
#
#     actions   = ["kms:*"]
#     resources = ["*"]
#   }
#
#   statement {
#     sid    = "Allow DynamoDB to use the key"
#     effect = "Allow"
#
#     principals {
#       type        = "Service"
#       identifiers = ["dynamodb.amazonaws.com"]
#     }
#
#     actions = [
#       "kms:Decrypt",
#       "kms:DescribeKey",
#       "kms:CreateGrant",
#     ]
#
#     resources = ["*"]
#
#     condition {
#       test     = "StringEquals"
#       variable = "kms:ViaService"
#       values   = ["dynamodb.${var.aws_region}.amazonaws.com"]
#     }
#   }
#
#   statement {
#     sid    = "Allow Lambda to decrypt"
#     effect = "Allow"
#
#     principals {
#       type        = "AWS"
#       identifiers = [aws_iam_role.lambda_execution.arn]
#     }
#
#     actions = [
#       "kms:Decrypt",
#       "kms:DescribeKey",
#     ]
#
#     resources = ["*"]
#   }
# }
#
# resource "aws_kms_key" "dynamodb" {
#   description             = "KMS key for DynamoDB encryption"
#   deletion_window_in_days = 30
#   enable_key_rotation     = true
#   policy                  = data.aws_iam_policy_document.dynamodb_kms.json
#
#   tags = {
#     Name        = "${var.project_name}-dynamodb-kms"
#     Environment = var.environment
#   }
# }
#
# resource "aws_kms_alias" "dynamodb" {
#   name          = "alias/${var.project_name}-dynamodb-${var.environment}"
#   target_key_id = aws_kms_key.dynamodb.key_id
# }

# ==============================================================================
# CloudWatch Logs Policy for Lambda
# ==============================================================================

data "aws_iam_policy_document" "lambda_logs" {
  statement {
    sid    = "AllowCloudWatchLogs"
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]

    resources = [
      "arn:aws:logs:${var.aws_region}:${var.aws_account_id}:log-group:/aws/lambda/${var.project_name}-*"
    ]
  }
}

resource "aws_iam_policy" "lambda_logs" {
  name        = "${var.project_name}-lambda-logs-${var.environment}"
  description = "CloudWatch Logs policy for Lambda functions"
  policy      = data.aws_iam_policy_document.lambda_logs.json

  tags = {
    Name        = "${var.project_name}-lambda-logs"
    Environment = var.environment
  }
}

# resource "aws_iam_role_policy_attachment" "lambda_logs" {
#   role       = aws_iam_role.lambda_execution.name
#   policy_arn = aws_iam_policy.lambda_logs.arn
# }

# ==============================================================================
# VPC Access Policy (if Lambda is in VPC)
# ==============================================================================

# Uncomment if Lambda functions need VPC access
# resource "aws_iam_role_policy_attachment" "lambda_vpc" {
#   role       = aws_iam_role.lambda_execution.name
#   policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
# }

# ==============================================================================
# Outputs
# ==============================================================================

output "dynamodb_policy_arn" {
  description = "ARN of the DynamoDB access policy"
  value       = aws_iam_policy.lambda_dynamodb.arn
}

output "logs_policy_arn" {
  description = "ARN of the CloudWatch Logs policy"
  value       = aws_iam_policy.lambda_logs.arn
}
