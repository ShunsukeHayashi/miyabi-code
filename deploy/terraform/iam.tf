# ==============================================================================
# IAM Roles and Policies for Miyabi Lambda Functions
# Principle of Least Privilege (PoLP)
# ==============================================================================

# ------------------------------------------------------------------------------
# Lambda Execution Role - Base Role
# ------------------------------------------------------------------------------

resource "aws_iam_role" "lambda_execution" {
  name        = "${var.project_name}-lambda-execution-role"
  description = "IAM role for Miyabi Lambda functions with minimal required permissions"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.project_name}-lambda-execution-role"
  })
}

# ------------------------------------------------------------------------------
# Managed Policy Attachments - CloudWatch Logs (AWS Managed)
# ------------------------------------------------------------------------------

# Basic Lambda execution - CloudWatch Logs only
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# ------------------------------------------------------------------------------
# Custom Policy - S3 Access (Read-Only to WebUI Bucket)
# Minimal permissions: Only GetObject from specific bucket
# ------------------------------------------------------------------------------

resource "aws_iam_policy" "lambda_s3_read" {
  name        = "${var.project_name}-lambda-s3-read"
  description = "Read-only access to Miyabi WebUI S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ReadWebUIBucket"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.webui.arn,
          "${aws_s3_bucket.webui.arn}/*"
        ]
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.project_name}-lambda-s3-read"
  })
}

resource "aws_iam_role_policy_attachment" "lambda_s3_read_attach" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_s3_read.arn
}

# ------------------------------------------------------------------------------
# Custom Policy - Secrets Manager Access (Optional)
# For securely storing GitHub tokens, OAuth secrets, etc.
# ------------------------------------------------------------------------------

resource "aws_iam_policy" "lambda_secrets_read" {
  name        = "${var.project_name}-lambda-secrets-read"
  description = "Read-only access to Miyabi secrets in Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ReadMiyabiSecrets"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          "arn:aws:secretsmanager:${var.aws_region}:${var.aws_account_id}:secret:${var.project_name}/*"
        ]
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.project_name}-lambda-secrets-read"
  })
}

resource "aws_iam_role_policy_attachment" "lambda_secrets_read_attach" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_secrets_read.arn
}

# ------------------------------------------------------------------------------
# Custom Policy - DynamoDB Access (Optional, for future state storage)
# Scoped to specific tables only
# ------------------------------------------------------------------------------

resource "aws_iam_policy" "lambda_dynamodb_access" {
  name        = "${var.project_name}-lambda-dynamodb-access"
  description = "Read/Write access to Miyabi DynamoDB tables"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AccessMiyabiTables"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:${var.aws_account_id}:table/${var.project_name}-*"
        ]
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.project_name}-lambda-dynamodb-access"
  })
}

# NOTE: Uncomment when DynamoDB tables are created
# resource "aws_iam_role_policy_attachment" "lambda_dynamodb_attach" {
#   role       = aws_iam_role.lambda_execution.name
#   policy_arn = aws_iam_policy.lambda_dynamodb_access.arn
# }

# ------------------------------------------------------------------------------
# Custom Policy - VPC Execution (If Lambda needs VPC access)
# Required for accessing resources in VPC (RDS, ElastiCache, etc.)
# ------------------------------------------------------------------------------

resource "aws_iam_policy" "lambda_vpc_execution" {
  name        = "${var.project_name}-lambda-vpc-execution"
  description = "VPC execution permissions for Lambda"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "VPCNetworkInterfaces"
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Resource = "*"
        # NOTE: EC2 network interface actions don't support resource-level permissions
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.project_name}-lambda-vpc-execution"
  })
}

# Attach VPC execution policy when Lambda is deployed in VPC
resource "aws_iam_role_policy_attachment" "lambda_vpc_attach" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_vpc_execution.arn
}

# ------------------------------------------------------------------------------
# Custom Policy - X-Ray Tracing (Optional, for debugging)
# ------------------------------------------------------------------------------

resource "aws_iam_policy" "lambda_xray" {
  name        = "${var.project_name}-lambda-xray"
  description = "X-Ray tracing permissions for Lambda"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "XRayTracing"
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.project_name}-lambda-xray"
  })
}

# NOTE: Uncomment when X-Ray tracing is enabled
# resource "aws_iam_role_policy_attachment" "lambda_xray_attach" {
#   role       = aws_iam_role.lambda_execution.name
#   policy_arn = aws_iam_policy.lambda_xray.arn
# }

# ------------------------------------------------------------------------------
# Custom Policy - KMS Decrypt (For encrypted environment variables)
# ------------------------------------------------------------------------------

resource "aws_iam_policy" "lambda_kms_decrypt" {
  name        = "${var.project_name}-lambda-kms-decrypt"
  description = "KMS decrypt permissions for Lambda environment variables"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DecryptEnvironmentVariables"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = [
          "arn:aws:kms:${var.aws_region}:${var.aws_account_id}:key/*"
        ]
        Condition = {
          StringEquals = {
            "kms:ViaService" = "lambda.${var.aws_region}.amazonaws.com"
          }
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.project_name}-lambda-kms-decrypt"
  })
}

# NOTE: Uncomment when using encrypted environment variables
# resource "aws_iam_role_policy_attachment" "lambda_kms_attach" {
#   role       = aws_iam_role.lambda_execution.name
#   policy_arn = aws_iam_policy.lambda_kms_decrypt.arn
# }

# ------------------------------------------------------------------------------
# Output - Export IAM Role ARN for Lambda Functions
# ------------------------------------------------------------------------------

output "lambda_execution_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_execution.arn
}

output "lambda_execution_role_name" {
  description = "Name of the Lambda execution role"
  value       = aws_iam_role.lambda_execution.name
}
