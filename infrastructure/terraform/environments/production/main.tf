/**
 * Miyabi Production Environment
 * Issue: #993 - Phase 4.6: Production Launch
 *
 * Production infrastructure configuration using Terraform.
 */

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "miyabi-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "ap-northeast-1"
    encrypt        = true
    dynamodb_table = "miyabi-terraform-locks"
  }
}

# =============================================================================
# Provider Configuration
# =============================================================================

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Miyabi"
      Environment = "production"
      ManagedBy   = "Terraform"
      Repository  = "miyabi-private"
    }
  }
}

# Provider for ACM certificates (must be us-east-1 for CloudFront)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "Miyabi"
      Environment = "production"
      ManagedBy   = "Terraform"
    }
  }
}

# =============================================================================
# Variables
# =============================================================================

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "domain_name" {
  description = "Production domain name"
  type        = string
  default     = "pantheon.example.com"
}

variable "api_domain_name" {
  description = "API domain name"
  type        = string
  default     = "api.pantheon.example.com"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 50
}

# =============================================================================
# Data Sources
# =============================================================================

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# =============================================================================
# VPC Configuration
# =============================================================================

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "miyabi-production"
  cidr = "10.0.0.0/16"

  azs             = slice(data.aws_availability_zones.available.names, 0, 3)
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway     = true
  single_nat_gateway     = false
  one_nat_gateway_per_az = true

  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Environment = "production"
  }
}

# =============================================================================
# ACM Certificate (for CloudFront)
# =============================================================================

resource "aws_acm_certificate" "frontend" {
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "miyabi-production-frontend"
  }
}

resource "aws_acm_certificate" "api" {
  domain_name       = var.api_domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "miyabi-production-api"
  }
}

# =============================================================================
# Frontend Hosting (S3 + CloudFront)
# =============================================================================

module "frontend" {
  source = "../../modules/frontend-hosting"

  project_name           = "pantheon"
  environment            = "production"
  domain_names           = [var.domain_name]
  acm_certificate_arn    = aws_acm_certificate.frontend.arn
  cloudfront_price_class = "PriceClass_200"
  api_origin_domain_name = var.api_domain_name

  allowed_origins = [
    "https://${var.domain_name}",
    "https://www.${var.domain_name}"
  ]

  tags = {
    Environment = "production"
  }
}

# =============================================================================
# RDS PostgreSQL
# =============================================================================

resource "aws_db_subnet_group" "main" {
  name       = "miyabi-production"
  subnet_ids = module.vpc.private_subnets

  tags = {
    Name = "miyabi-production-db-subnet"
  }
}

resource "aws_security_group" "rds" {
  name        = "miyabi-production-rds"
  description = "Security group for RDS"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.api.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "miyabi-production-rds"
  }
}

resource "aws_db_instance" "main" {
  identifier = "miyabi-production"

  engine               = "postgres"
  engine_version       = "16.1"
  instance_class       = var.db_instance_class
  allocated_storage    = var.db_allocated_storage
  max_allocated_storage = 200

  db_name  = "miyabi"
  username = "miyabi_admin"
  password = data.aws_secretsmanager_secret_version.db_password.secret_string

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  multi_az               = true
  publicly_accessible    = false
  storage_encrypted      = true
  deletion_protection    = true

  backup_retention_period = 30
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = {
    Name = "miyabi-production"
  }
}

# =============================================================================
# Secrets Manager for DB Password
# =============================================================================

data "aws_secretsmanager_secret" "db_password" {
  name = "miyabi/production/db-password"
}

data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = data.aws_secretsmanager_secret.db_password.id
}

# =============================================================================
# ECS Fargate for API
# =============================================================================

resource "aws_security_group" "api" {
  name        = "miyabi-production-api"
  description = "Security group for API service"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 4000
    to_port         = 4000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "miyabi-production-api"
  }
}

resource "aws_security_group" "alb" {
  name        = "miyabi-production-alb"
  description = "Security group for ALB"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "miyabi-production-alb"
  }
}

# =============================================================================
# Application Load Balancer
# =============================================================================

resource "aws_lb" "api" {
  name               = "miyabi-production-api"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets

  enable_deletion_protection = true

  access_logs {
    bucket  = aws_s3_bucket.logs.bucket
    prefix  = "alb"
    enabled = true
  }

  tags = {
    Name = "miyabi-production-api"
  }
}

resource "aws_lb_target_group" "api" {
  name        = "miyabi-production-api"
  port        = 4000
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  tags = {
    Name = "miyabi-production-api"
  }
}

resource "aws_lb_listener" "api_https" {
  load_balancer_arn = aws_lb.api.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.api.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

resource "aws_lb_listener" "api_http" {
  load_balancer_arn = aws_lb.api.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# =============================================================================
# S3 Bucket for Logs
# =============================================================================

resource "aws_s3_bucket" "logs" {
  bucket = "miyabi-production-logs"

  tags = {
    Name = "miyabi-production-logs"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "log-retention"
    status = "Enabled"

    expiration {
      days = 90
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 60
      storage_class = "GLACIER"
    }
  }
}

# =============================================================================
# CloudWatch Monitoring
# =============================================================================

module "cloudwatch" {
  source = "../../modules/cloudwatch"

  environment                  = "production"
  alarm_email                  = var.alarm_email
  cloudfront_distribution_id   = module.frontend.cloudfront_distribution_id
  api_load_balancer_arn_suffix = aws_lb.api.arn_suffix
}

variable "alarm_email" {
  description = "Email for alarm notifications"
  type        = string
  default     = ""
}

# =============================================================================
# Outputs
# =============================================================================

output "frontend_cloudfront_domain" {
  description = "CloudFront distribution domain"
  value       = module.frontend.cloudfront_domain_name
}

output "frontend_s3_bucket" {
  description = "S3 bucket for frontend"
  value       = module.frontend.s3_bucket_name
}

output "api_alb_dns" {
  description = "API ALB DNS name"
  value       = aws_lb.api.dns_name
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}
