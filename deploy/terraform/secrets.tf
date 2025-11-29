# ==============================================================================
# AWS Secrets Manager - Secret Storage for Lambda Functions
# ==============================================================================
# This file manages sensitive credentials for the Miyabi Lambda functions
# All secrets are encrypted at rest using AWS KMS

# ------------------------------------------------------------------------------
# KMS Key for Secrets Manager Encryption
# ------------------------------------------------------------------------------

resource "aws_kms_key" "secrets" {
  description             = "${var.project_name} Secrets Manager KMS Key"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-secrets-kms"
    }
  )
}

resource "aws_kms_alias" "secrets" {
  name          = "alias/${var.project_name}-secrets"
  target_key_id = aws_kms_key.secrets.key_id
}

# ------------------------------------------------------------------------------
# Secrets Manager Secret - API Keys and Tokens
# ------------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "api_keys" {
  name        = "${var.project_name}/${var.environment}/api-keys"
  description = "API keys and tokens for ${var.project_name} Lambda functions"
  kms_key_id  = aws_kms_key.secrets.key_id

  tags = merge(
    var.tags,
    {
      Name        = "${var.project_name}-api-keys"
      Description = "GitHub, OAuth, and other API credentials"
    }
  )
}

# Secret version with placeholder values
# IMPORTANT: Update these values manually after Terraform apply
resource "aws_secretsmanager_secret_version" "api_keys" {
  secret_id = aws_secretsmanager_secret.api_keys.id
  secret_string = jsonencode({
    # GitHub Personal Access Token
    GITHUB_TOKEN = var.github_token

    # Miyabi API Access Token (OAuth 2.1)
    MIYABI_ACCESS_TOKEN = var.miyabi_access_token

    # OAuth Configuration
    OAUTH_CLIENT_ID     = var.oauth_client_id
    OAUTH_CLIENT_SECRET = var.oauth_client_secret
    OAUTH_ISSUER        = var.oauth_issuer

    # GitHub OAuth App Credentials
    GITHUB_OAUTH_CLIENT_ID     = var.github_oauth_client_id
    GITHUB_OAUTH_CLIENT_SECRET = var.github_oauth_client_secret
    GITHUB_OAUTH_CALLBACK_URL  = var.github_oauth_callback_url
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# ------------------------------------------------------------------------------
# Secrets Manager Secret - Project Configuration
# ------------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "project_config" {
  name        = "${var.project_name}/${var.environment}/config"
  description = "Project configuration for ${var.project_name}"
  kms_key_id  = aws_kms_key.secrets.key_id

  tags = merge(
    var.tags,
    {
      Name        = "${var.project_name}-config"
      Description = "Repository and project settings"
    }
  )
}

resource "aws_secretsmanager_secret_version" "project_config" {
  secret_id = aws_secretsmanager_secret.project_config.id
  secret_string = jsonencode({
    # GitHub Repository
    MIYABI_REPO_OWNER = var.repo_owner
    MIYABI_REPO_NAME  = var.repo_name

    # Base URL (API Gateway or ALB)
    BASE_URL = var.base_url

    # Miyabi Root Path (Lambda)
    MIYABI_ROOT = "/var/task"
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}

# ------------------------------------------------------------------------------
# IAM Policy for Secrets Access
# ------------------------------------------------------------------------------

data "aws_iam_policy_document" "secrets_access" {
  # Allow Lambda to retrieve secrets
  statement {
    sid    = "AllowSecretsManagerRead"
    effect = "Allow"

    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ]

    resources = [
      aws_secretsmanager_secret.api_keys.arn,
      aws_secretsmanager_secret.project_config.arn
    ]
  }

  # Allow Lambda to decrypt secrets using KMS
  statement {
    sid    = "AllowKMSDecrypt"
    effect = "Allow"

    actions = [
      "kms:Decrypt",
      "kms:DescribeKey"
    ]

    resources = [aws_kms_key.secrets.arn]

    condition {
      test     = "StringEquals"
      variable = "kms:ViaService"
      values   = ["secretsmanager.${var.aws_region}.amazonaws.com"]
    }
  }
}

resource "aws_iam_policy" "secrets_access" {
  name        = "${var.project_name}-lambda-secrets-access"
  description = "Allows Lambda functions to access Secrets Manager"
  policy      = data.aws_iam_policy_document.secrets_access.json

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-lambda-secrets-access"
    }
  )
}

# ------------------------------------------------------------------------------
# Attach Secrets Access Policy to Lambda Execution Role (defined in iam.tf)
# ------------------------------------------------------------------------------

# Attach our custom secrets access policy to the main Lambda execution role
resource "aws_iam_role_policy_attachment" "lambda_secrets_access" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.secrets_access.arn
}

# ------------------------------------------------------------------------------
# Additional IAM Policy for GitHub API Access (if needed)
# ------------------------------------------------------------------------------

data "aws_iam_policy_document" "github_access" {
  # Lambda may need to make outbound HTTPS calls to GitHub API
  # No specific IAM permissions needed, just network access
  # This is a placeholder for future GitHub-specific permissions
  statement {
    sid    = "AllowLogging"
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]

    resources = ["arn:aws:logs:${var.aws_region}:${var.aws_account_id}:log-group:/aws/lambda/${var.project_name}-*"]
  }
}

resource "aws_iam_policy" "github_access" {
  name        = "${var.project_name}-lambda-github-access"
  description = "Additional permissions for GitHub API access"
  policy      = data.aws_iam_policy_document.github_access.json

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-lambda-github-access"
    }
  )
}

resource "aws_iam_role_policy_attachment" "lambda_github_access" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.github_access.arn
}

# ------------------------------------------------------------------------------
# Outputs
# ------------------------------------------------------------------------------

output "secrets_kms_key_id" {
  description = "KMS key ID used for Secrets Manager encryption"
  value       = aws_kms_key.secrets.id
}

output "secrets_kms_key_arn" {
  description = "KMS key ARN used for Secrets Manager encryption"
  value       = aws_kms_key.secrets.arn
}

output "api_keys_secret_arn" {
  description = "ARN of the API keys secret"
  value       = aws_secretsmanager_secret.api_keys.arn
}

output "project_config_secret_arn" {
  description = "ARN of the project config secret"
  value       = aws_secretsmanager_secret.project_config.arn
}

# Note: lambda_execution_role outputs are in iam.tf
