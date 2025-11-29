# ==============================================================================
# VPC Endpoints - Miyabi Infrastructure
# ==============================================================================
# Purpose: Cost optimization and security for Lambda-to-AWS service communication
# Cost Savings:
#   - Gateway endpoints (S3, DynamoDB): $0/month (FREE)
#   - Interface endpoints: ~$7/month per endpoint
#   - Data transfer savings: ~30% reduction in NAT Gateway costs
# Security: Private connectivity to AWS services without internet gateway

# ==============================================================================
# Gateway Endpoints (FREE - always recommended)
# ==============================================================================

# S3 Gateway Endpoint
# Cost: $0/month
# Benefit: All S3 API calls from Lambda go through private AWS network
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.lambda.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"

  route_table_ids = concat(
    [aws_route_table.public.id],
    aws_route_table.private[*].id
  )

  tags = merge(var.tags, {
    Name = "${var.project_name}-s3-gateway-endpoint"
  })
}

# DynamoDB Gateway Endpoint
# Cost: $0/month
# Benefit: All DynamoDB API calls from Lambda go through private AWS network
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.lambda.id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"

  route_table_ids = concat(
    [aws_route_table.public.id],
    aws_route_table.private[*].id
  )

  tags = merge(var.tags, {
    Name = "${var.project_name}-dynamodb-gateway-endpoint"
  })
}

# ==============================================================================
# Interface Endpoints (Conditional - based on var.enable_interface_endpoints)
# ==============================================================================
# Cost: ~$7/month per endpoint + data transfer
# Recommendation: Enable for production environments

# Secrets Manager Interface Endpoint
# Use case: Securely access GitHub tokens, OAuth secrets, API keys
resource "aws_vpc_endpoint" "secretsmanager" {
  count = var.enable_interface_endpoints ? 1 : 0

  vpc_id              = aws_vpc.lambda.id
  service_name        = "com.amazonaws.${var.aws_region}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true

  subnet_ids         = aws_subnet.private[*].id
  security_group_ids = [aws_security_group.vpc_endpoints.id]

  tags = merge(var.tags, {
    Name = "${var.project_name}-secretsmanager-interface-endpoint"
  })
}

# CloudWatch Logs Interface Endpoint
# Use case: Lambda logs without NAT Gateway
resource "aws_vpc_endpoint" "logs" {
  count = var.enable_interface_endpoints ? 1 : 0

  vpc_id              = aws_vpc.lambda.id
  service_name        = "com.amazonaws.${var.aws_region}.logs"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true

  subnet_ids         = aws_subnet.private[*].id
  security_group_ids = [aws_security_group.vpc_endpoints.id]

  tags = merge(var.tags, {
    Name = "${var.project_name}-logs-interface-endpoint"
  })
}

# Lambda Interface Endpoint (for Lambda-to-Lambda invocations)
# Use case: Synchronous Lambda invocations without NAT Gateway
resource "aws_vpc_endpoint" "lambda" {
  count = var.enable_interface_endpoints ? 1 : 0

  vpc_id              = aws_vpc.lambda.id
  service_name        = "com.amazonaws.${var.aws_region}.lambda"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true

  subnet_ids         = aws_subnet.private[*].id
  security_group_ids = [aws_security_group.vpc_endpoints.id]

  tags = merge(var.tags, {
    Name = "${var.project_name}-lambda-interface-endpoint"
  })
}

# STS Interface Endpoint (for IAM role assumptions)
# Use case: Lambda assuming roles without NAT Gateway
resource "aws_vpc_endpoint" "sts" {
  count = var.enable_interface_endpoints ? 1 : 0

  vpc_id              = aws_vpc.lambda.id
  service_name        = "com.amazonaws.${var.aws_region}.sts"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true

  subnet_ids         = aws_subnet.private[*].id
  security_group_ids = [aws_security_group.vpc_endpoints.id]

  tags = merge(var.tags, {
    Name = "${var.project_name}-sts-interface-endpoint"
  })
}

# KMS Interface Endpoint (for encrypted environment variables)
# Use case: Decrypting Lambda environment variables without NAT Gateway
resource "aws_vpc_endpoint" "kms" {
  count = var.enable_interface_endpoints ? 1 : 0

  vpc_id              = aws_vpc.lambda.id
  service_name        = "com.amazonaws.${var.aws_region}.kms"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true

  subnet_ids         = aws_subnet.private[*].id
  security_group_ids = [aws_security_group.vpc_endpoints.id]

  tags = merge(var.tags, {
    Name = "${var.project_name}-kms-interface-endpoint"
  })
}

# SQS Interface Endpoint (for event-driven architecture)
# Use case: Lambda reading from SQS queues without NAT Gateway
resource "aws_vpc_endpoint" "sqs" {
  count = var.enable_interface_endpoints ? 1 : 0

  vpc_id              = aws_vpc.lambda.id
  service_name        = "com.amazonaws.${var.aws_region}.sqs"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true

  subnet_ids         = aws_subnet.private[*].id
  security_group_ids = [aws_security_group.vpc_endpoints.id]

  tags = merge(var.tags, {
    Name = "${var.project_name}-sqs-interface-endpoint"
  })
}

# SNS Interface Endpoint (for notifications)
# Use case: Lambda publishing to SNS topics without NAT Gateway
resource "aws_vpc_endpoint" "sns" {
  count = var.enable_interface_endpoints ? 1 : 0

  vpc_id              = aws_vpc.lambda.id
  service_name        = "com.amazonaws.${var.aws_region}.sns"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true

  subnet_ids         = aws_subnet.private[*].id
  security_group_ids = [aws_security_group.vpc_endpoints.id]

  tags = merge(var.tags, {
    Name = "${var.project_name}-sns-interface-endpoint"
  })
}

# ==============================================================================
# S3 Gateway Endpoint Policy (Principle of Least Privilege)
# ==============================================================================

data "aws_iam_policy_document" "s3_endpoint_policy" {
  # Allow access to specific buckets only
  statement {
    sid    = "AllowMiyabiBuckets"
    effect = "Allow"

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:ListBucket"
    ]

    resources = [
      aws_s3_bucket.webui.arn,
      "${aws_s3_bucket.webui.arn}/*",
      aws_s3_bucket.lambda_artifacts.arn,
      "${aws_s3_bucket.lambda_artifacts.arn}/*"
    ]
  }

  # Allow public repository access (for package downloads)
  statement {
    sid    = "AllowPublicRepos"
    effect = "Allow"

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions = [
      "s3:GetObject"
    ]

    resources = [
      "arn:aws:s3:::amazonlinux-2-repos-*/*",
      "arn:aws:s3:::prod-*-starport-layer-bucket/*"
    ]
  }
}

# ==============================================================================
# Outputs
# ==============================================================================

output "s3_gateway_endpoint_id" {
  description = "S3 Gateway Endpoint ID"
  value       = aws_vpc_endpoint.s3.id
}

output "dynamodb_gateway_endpoint_id" {
  description = "DynamoDB Gateway Endpoint ID"
  value       = aws_vpc_endpoint.dynamodb.id
}

output "interface_endpoint_ids" {
  description = "Map of Interface Endpoint IDs"
  value = var.enable_interface_endpoints ? {
    secretsmanager = aws_vpc_endpoint.secretsmanager[0].id
    logs           = aws_vpc_endpoint.logs[0].id
    lambda         = aws_vpc_endpoint.lambda[0].id
    sts            = aws_vpc_endpoint.sts[0].id
    kms            = aws_vpc_endpoint.kms[0].id
    sqs            = aws_vpc_endpoint.sqs[0].id
    sns            = aws_vpc_endpoint.sns[0].id
  } : {}
}

output "vpc_endpoint_cost_estimate" {
  description = "Estimated monthly cost for VPC endpoints"
  value = var.enable_interface_endpoints ? {
    gateway_endpoints   = "$0/month (S3 + DynamoDB)"
    interface_endpoints = "$49/month (7 endpoints × $7/month)"
    total               = "$49/month"
    savings             = "NAT Gateway data transfer: ~30% reduction"
  } : {
    gateway_endpoints   = "$0/month (S3 + DynamoDB)"
    interface_endpoints = "$0/month (disabled)"
    total               = "$0/month"
  }
}
