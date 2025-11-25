/**
 * Miyabi Staging Environment
 * Issue: #993 - Phase 4.6: Production Launch
 *
 * Staging infrastructure configuration (cost-optimized).
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
    key            = "staging/terraform.tfstate"
    region         = "ap-northeast-1"
    encrypt        = true
    dynamodb_table = "miyabi-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Miyabi"
      Environment = "staging"
      ManagedBy   = "Terraform"
    }
  }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# =============================================================================
# Variables
# =============================================================================

variable "aws_region" {
  default = "ap-northeast-1"
}

variable "domain_name" {
  default = "staging.pantheon.example.com"
}

variable "api_domain_name" {
  default = "api.staging.pantheon.example.com"
}

# =============================================================================
# VPC (Cost-optimized: single NAT)
# =============================================================================

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "miyabi-staging"
  cidr = "10.1.0.0/16"

  azs             = ["ap-northeast-1a", "ap-northeast-1c"]
  private_subnets = ["10.1.1.0/24", "10.1.2.0/24"]
  public_subnets  = ["10.1.101.0/24", "10.1.102.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true  # Cost optimization

  enable_dns_hostnames = true
  enable_dns_support   = true
}

# =============================================================================
# ACM Certificate
# =============================================================================

resource "aws_acm_certificate" "frontend" {
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# =============================================================================
# Frontend Hosting
# =============================================================================

module "frontend" {
  source = "../../modules/frontend-hosting"

  project_name           = "pantheon"
  environment            = "staging"
  domain_names           = [var.domain_name]
  acm_certificate_arn    = aws_acm_certificate.frontend.arn
  cloudfront_price_class = "PriceClass_100"  # Cost optimization

  allowed_origins = ["https://${var.domain_name}"]
}

# =============================================================================
# RDS (Cost-optimized: single-AZ, smaller instance)
# =============================================================================

resource "aws_db_subnet_group" "main" {
  name       = "miyabi-staging"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_security_group" "rds" {
  name        = "miyabi-staging-rds"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = module.vpc.private_subnets_cidr_blocks
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "main" {
  identifier = "miyabi-staging"

  engine               = "postgres"
  engine_version       = "16.1"
  instance_class       = "db.t3.micro"  # Cost optimization
  allocated_storage    = 20

  db_name  = "miyabi"
  username = "miyabi_admin"
  password = "staging_password_change_me"  # Use Secrets Manager in real setup

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  multi_az            = false  # Cost optimization
  publicly_accessible = false
  storage_encrypted   = true
  skip_final_snapshot = true  # Staging only

  backup_retention_period = 7
}

# =============================================================================
# Outputs
# =============================================================================

output "frontend_url" {
  value = "https://${var.domain_name}"
}

output "api_url" {
  value = "https://${var.api_domain_name}"
}

output "cloudfront_domain" {
  value = module.frontend.cloudfront_domain_name
}
