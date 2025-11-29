# ==============================================================================
# S3 Bucket for Lambda Function Code Artifacts
# ==============================================================================
# Purpose: Store Lambda deployment packages (.zip files) for serverless functions
# Security: Private bucket with encryption, versioning enabled

resource "aws_s3_bucket" "lambda_artifacts" {
  bucket = "${var.project_name}-lambda-artifacts-${var.aws_account_id}"

  tags = {
    Name        = "${var.project_name}-lambda-artifacts"
    Purpose     = "Lambda deployment packages storage"
    Environment = var.environment
  }
}

# ==============================================================================
# Security: Block All Public Access
# ==============================================================================

resource "aws_s3_bucket_public_access_block" "lambda_artifacts" {
  bucket = aws_s3_bucket.lambda_artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ==============================================================================
# Versioning: Enable for Rollback Capability
# ==============================================================================

resource "aws_s3_bucket_versioning" "lambda_artifacts" {
  bucket = aws_s3_bucket.lambda_artifacts.id

  versioning_configuration {
    status = "Enabled"
  }
}

# ==============================================================================
# Encryption: AES256 Server-Side Encryption
# ==============================================================================

resource "aws_s3_bucket_server_side_encryption_configuration" "lambda_artifacts" {
  bucket = aws_s3_bucket.lambda_artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# ==============================================================================
# Lifecycle Policy: Archive Old Versions
# ==============================================================================

resource "aws_s3_bucket_lifecycle_configuration" "lambda_artifacts" {
  bucket = aws_s3_bucket.lambda_artifacts.id

  rule {
    id     = "archive-old-versions"
    status = "Enabled"

    filter {
      prefix = ""
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_transition {
      noncurrent_days = 90
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }

  rule {
    id     = "cleanup-incomplete-uploads"
    status = "Enabled"

    filter {
      prefix = ""
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# ==============================================================================
# Bucket Policy: Allow Lambda Service and Deployment Role Access
# ==============================================================================

data "aws_iam_policy_document" "lambda_artifacts" {
  # Allow Lambda service to read artifacts
  statement {
    sid    = "AllowLambdaServiceRead"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = [
      "s3:GetObject",
      "s3:GetObjectVersion"
    ]

    resources = ["${aws_s3_bucket.lambda_artifacts.arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [var.aws_account_id]
    }
  }

  # Allow deployment role to upload artifacts
  statement {
    sid    = "AllowDeploymentRoleWrite"
    effect = "Allow"

    principals {
      type = "AWS"
      identifiers = [
        "arn:aws:iam::${var.aws_account_id}:root"
      ]
    }

    actions = [
      "s3:PutObject",
      "s3:PutObjectAcl",
      "s3:GetObject",
      "s3:GetObjectVersion",
      "s3:ListBucket"
    ]

    resources = [
      aws_s3_bucket.lambda_artifacts.arn,
      "${aws_s3_bucket.lambda_artifacts.arn}/*"
    ]
  }

  # Deny insecure transport
  statement {
    sid    = "DenyInsecureTransport"
    effect = "Deny"

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    actions = ["s3:*"]

    resources = [
      aws_s3_bucket.lambda_artifacts.arn,
      "${aws_s3_bucket.lambda_artifacts.arn}/*"
    ]

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "lambda_artifacts" {
  bucket = aws_s3_bucket.lambda_artifacts.id
  policy = data.aws_iam_policy_document.lambda_artifacts.json
}

# ==============================================================================
# CORS Configuration (if needed for browser uploads)
# ==============================================================================

# Uncomment if you need to upload Lambda artifacts from browser-based tools
# resource "aws_s3_bucket_cors_configuration" "lambda_artifacts" {
#   bucket = aws_s3_bucket.lambda_artifacts.id
#
#   cors_rule {
#     allowed_headers = ["*"]
#     allowed_methods = ["GET", "PUT", "POST"]
#     allowed_origins = ["https://${var.domain_name}"]
#     expose_headers  = ["ETag"]
#     max_age_seconds = 3000
#   }
# }
