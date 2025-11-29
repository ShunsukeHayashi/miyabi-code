# ==============================================================================
# Lambda Function for Miyabi MCP Server
# ==============================================================================

# IAM Role for Lambda
resource "aws_iam_role" "lambda_exec" {
  name = "${var.project_name}-lambda-exec"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-lambda-exec-role"
  }
}

# Attach basic Lambda execution policy (MCP Server specific)
resource "aws_iam_role_policy_attachment" "lambda_basic_execution_mcp" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Custom policy for Lambda (GitHub access, etc.)
resource "aws_iam_role_policy" "lambda_custom" {
  name = "${var.project_name}-lambda-custom-policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = "arn:aws:secretsmanager:${var.aws_region}:${var.aws_account_id}:secret:*"
      }
    ]
  })
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.project_name}-mcp-server"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-lambda-logs"
  }
}

# Lambda Function
resource "aws_lambda_function" "mcp_server" {
  filename         = "${path.module}/../../dist/lambda/miyabi-api-arm64.zip"
  function_name    = "${var.project_name}-mcp-server"
  role            = aws_iam_role.lambda_exec.arn
  handler         = "main.handler"
  source_code_hash = fileexists("${path.module}/../../dist/lambda/miyabi-api-arm64.zip") ? filebase64sha256("${path.module}/../../dist/lambda/miyabi-api-arm64.zip") : ""
  runtime         = "python3.12"
  timeout         = 30
  memory_size     = 512

  # ARM64 for better performance and cost
  architectures = ["arm64"]

  environment {
    variables = {
      MIYABI_ROOT                  = "/var/task"
      BASE_URL                     = var.lambda_base_url
      GITHUB_TOKEN                 = var.github_token
      MIYABI_REPO_OWNER           = var.repo_owner
      MIYABI_REPO_NAME            = var.repo_name
      MIYABI_ACCESS_TOKEN         = var.miyabi_access_token
      OAUTH_CLIENT_ID             = var.oauth_client_id
      OAUTH_CLIENT_SECRET         = var.oauth_client_secret
      OAUTH_ISSUER                = var.oauth_issuer
      GITHUB_OAUTH_CLIENT_ID      = var.github_oauth_client_id
      GITHUB_OAUTH_CLIENT_SECRET  = var.github_oauth_client_secret
      GITHUB_OAUTH_CALLBACK_URL   = var.github_oauth_callback_url
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda,
    aws_iam_role_policy_attachment.lambda_basic_execution_mcp
  ]

  tags = {
    Name = "${var.project_name}-mcp-server"
  }
}

# Lambda Function URL (optional - for direct invocation)
resource "aws_lambda_function_url" "mcp_server" {
  count              = var.enable_lambda_function_url ? 1 : 0
  function_name      = aws_lambda_function.mcp_server.function_name
  authorization_type = "NONE"  # Use "AWS_IAM" for authenticated access

  cors {
    allow_credentials = true
    allow_origins     = ["*"]
    allow_methods     = ["*"]
    allow_headers     = ["*"]
    max_age          = 86400
  }
}
