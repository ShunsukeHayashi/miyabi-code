# Miyabi Multi-Tenant Sandbox Infrastructure
# Main Terraform Configuration

terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "miyabi-terraform-state"
    key            = "sandbox/terraform.tfstate"
    region         = "ap-northeast-1"
    dynamodb_table = "miyabi-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "Miyabi"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# ============================================
# Variables
# ============================================

variable "aws_region" {
  default = "ap-northeast-1"
}

variable "environment" {
  default = "production"
}

variable "github_app_id" {
  type      = string
  sensitive = true
}

variable "github_client_id" {
  type      = string
  sensitive = true
}

variable "github_client_secret" {
  type      = string
  sensitive = true
}

# ============================================
# VPC & Networking
# ============================================

module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "5.1.0"

  name = "miyabi-sandbox-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["${var.aws_region}a", "${var.aws_region}c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true

  tags = {
    Name = "miyabi-sandbox-vpc"
  }
}

# ============================================
# ECS Cluster
# ============================================

resource "aws_ecs_cluster" "sandbox" {
  name = "miyabi-sandbox-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  configuration {
    execute_command_configuration {
      logging = "OVERRIDE"
      log_configuration {
        cloud_watch_log_group_name = aws_cloudwatch_log_group.ecs.name
      }
    }
  }
}

resource "aws_ecs_cluster_capacity_providers" "sandbox" {
  cluster_name = aws_ecs_cluster.sandbox.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE_SPOT"  # コスト最適化
  }
}

resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/miyabi-sandbox"
  retention_in_days = 30
}

# ============================================
# ECS Task Definition (Template)
# ============================================

resource "aws_ecs_task_definition" "sandbox" {
  family                   = "miyabi-sandbox"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 1024   # 1 vCPU
  memory                   = 2048   # 2 GB
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "miyabi-sandbox"
      image = "${aws_ecr_repository.sandbox.repository_url}:latest"
      
      essential = true
      
      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]
      
      environment = [
        { name = "MIYABI_ENV", value = "sandbox" },
        { name = "AWS_REGION", value = var.aws_region }
      ]
      
      secrets = [
        {
          name      = "GITHUB_TOKEN"
          valueFrom = "${aws_secretsmanager_secret.github_token.arn}:GITHUB_TOKEN::"
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "sandbox"
        }
      }
      
      linuxParameters = {
        initProcessEnabled = true
      }
    }
  ])
}

# ============================================
# ECR Repository
# ============================================

resource "aws_ecr_repository" "sandbox" {
  name                 = "miyabi-sandbox"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }
}

# ============================================
# DynamoDB Tables
# ============================================

resource "aws_dynamodb_table" "users" {
  name           = "miyabi-users"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "user_id"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }
}

resource "aws_dynamodb_table" "sandboxes" {
  name           = "miyabi-sandboxes"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "sandbox_id"
  range_key      = "user_id"

  attribute {
    name = "sandbox_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "user-index"
    hash_key        = "user_id"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "status-index"
    hash_key        = "status"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  ttl {
    attribute_name = "expires_at"
    enabled        = true
  }
}

# ============================================
# Cognito User Pool
# ============================================

resource "aws_cognito_user_pool" "main" {
  name = "miyabi-users"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  schema {
    name                = "github_username"
    attribute_data_type = "String"
    mutable             = true
    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }
}

resource "aws_cognito_user_pool_client" "web" {
  name         = "miyabi-web-client"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  supported_identity_providers = ["COGNITO", "GitHub"]

  callback_urls = [
    "https://portal.miyabi-world.com/auth/callback",
    "http://localhost:3000/auth/callback"
  ]

  logout_urls = [
    "https://portal.miyabi-world.com",
    "http://localhost:3000"
  ]

  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  allowed_oauth_flows_user_pool_client = true
}

resource "aws_cognito_identity_provider" "github" {
  user_pool_id  = aws_cognito_user_pool.main.id
  provider_name = "GitHub"
  provider_type = "OIDC"

  provider_details = {
    client_id                     = var.github_client_id
    client_secret                 = var.github_client_secret
    attributes_request_method     = "GET"
    oidc_issuer                   = "https://github.com"
    authorize_scopes              = "openid user:email repo"
    authorize_url                 = "https://github.com/login/oauth/authorize"
    token_url                     = "https://github.com/login/oauth/access_token"
    attributes_url                = "https://api.github.com/user"
    jwks_uri                      = "https://token.actions.githubusercontent.com/.well-known/jwks"
  }

  attribute_mapping = {
    email    = "email"
    username = "sub"
    name     = "name"
  }
}

# ============================================
# Secrets Manager
# ============================================

resource "aws_secretsmanager_secret" "github_token" {
  name        = "miyabi/github-app-token"
  description = "GitHub App token for Miyabi sandbox provisioning"
}

resource "aws_secretsmanager_secret" "user_tokens" {
  name        = "miyabi/user-tokens"
  description = "Per-user GitHub tokens (encrypted)"
}

# ============================================
# IAM Roles
# ============================================

resource "aws_iam_role" "ecs_execution" {
  name = "miyabi-sandbox-ecs-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_execution_secrets" {
  name = "secrets-access"
  role = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue"
      ]
      Resource = [
        aws_secretsmanager_secret.github_token.arn,
        aws_secretsmanager_secret.user_tokens.arn
      ]
    }]
  })
}

resource "aws_iam_role" "ecs_task" {
  name = "miyabi-sandbox-ecs-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "ecs_task" {
  name = "sandbox-permissions"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.ecs.arn}:*"
      }
    ]
  })
}

# ============================================
# Lambda for Provisioning
# ============================================

resource "aws_lambda_function" "provisioner" {
  filename         = "lambda/sandbox-provisioner.zip"
  function_name    = "miyabi-sandbox-provisioner"
  role             = aws_iam_role.lambda_provisioner.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 300
  memory_size      = 512

  environment {
    variables = {
      ECS_CLUSTER_ARN       = aws_ecs_cluster.sandbox.arn
      TASK_DEFINITION_ARN   = aws_ecs_task_definition.sandbox.arn
      DYNAMODB_USERS_TABLE  = aws_dynamodb_table.users.name
      DYNAMODB_SANDBOX_TABLE = aws_dynamodb_table.sandboxes.name
      GITHUB_ORG            = "customer-cloud"
      TEMPLATE_REPO         = "miyabi-sandbox-template"
      SUBNET_IDS            = join(",", module.vpc.private_subnets)
      SECURITY_GROUP_ID     = aws_security_group.sandbox.id
    }
  }

  vpc_config {
    subnet_ids         = module.vpc.private_subnets
    security_group_ids = [aws_security_group.lambda.id]
  }
}

resource "aws_iam_role" "lambda_provisioner" {
  name = "miyabi-lambda-provisioner"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "lambda_provisioner" {
  name = "provisioner-permissions"
  role = aws_iam_role.lambda_provisioner.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecs:RunTask",
          "ecs:StopTask",
          "ecs:DescribeTasks"
        ]
        Resource = "*"
        Condition = {
          ArnEquals = {
            "ecs:cluster" = aws_ecs_cluster.sandbox.arn
          }
        }
      },
      {
        Effect = "Allow"
        Action = ["iam:PassRole"]
        Resource = [
          aws_iam_role.ecs_execution.arn,
          aws_iam_role.ecs_task.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.users.arn,
          aws_dynamodb_table.sandboxes.arn,
          "${aws_dynamodb_table.users.arn}/index/*",
          "${aws_dynamodb_table.sandboxes.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.github_token.arn
        ]
      },
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
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = "*"
      }
    ]
  })
}

# ============================================
# Security Groups
# ============================================

resource "aws_security_group" "sandbox" {
  name        = "miyabi-sandbox-sg"
  description = "Security group for Miyabi sandbox containers"
  vpc_id      = module.vpc.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "lambda" {
  name        = "miyabi-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = module.vpc.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ============================================
# Outputs
# ============================================

output "ecs_cluster_arn" {
  value = aws_ecs_cluster.sandbox.arn
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.web.id
}

output "dynamodb_users_table" {
  value = aws_dynamodb_table.users.name
}

output "dynamodb_sandboxes_table" {
  value = aws_dynamodb_table.sandboxes.name
}

output "ecr_repository_url" {
  value = aws_ecr_repository.sandbox.repository_url
}

output "lambda_provisioner_arn" {
  value = aws_lambda_function.provisioner.arn
}
