# Miyabi Infrastructure - Development Environment
# Issue #1021 - VPC, Security Groups & IAM Roles
# Issue #1022 - ECS Cluster, ALB & Redis
# Issue #1023 - ECS Service Deployment

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment for remote state (recommended for production)
  # backend "s3" {
  #   bucket         = "miyabi-terraform-state"
  #   key            = "dev/terraform.tfstate"
  #   region         = "us-west-2"
  #   encrypt        = true
  #   dynamodb_table = "miyabi-terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      Issue       = "#1021, #1022"
    }
  }
}

# VPC and Networking
module "networking" {
  source = "../../modules/networking"

  project_name = var.project_name
  environment  = var.environment

  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs

  enable_nat_gateway = true
  single_nat_gateway = var.environment == "dev" # Use single NAT for dev to save costs
}

# Security Groups
module "security_groups" {
  source = "../../modules/security-groups"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.networking.vpc_id
}

# IAM Roles for ECS
module "iam" {
  source = "../../modules/iam"

  project_name = var.project_name
  environment  = var.environment
}

# Application Load Balancer
module "alb" {
  source = "../../modules/alb"

  project_name           = var.project_name
  environment            = var.environment
  vpc_id                 = module.networking.vpc_id
  public_subnet_ids      = module.networking.public_subnet_ids
  alb_security_group_id  = module.security_groups.alb_security_group_id
  container_port         = var.container_port
  health_check_path      = var.health_check_path
  certificate_arn        = var.certificate_arn
}

# ECS Cluster and Task Definition
module "ecs" {
  source = "../../modules/ecs"

  project_name                = var.project_name
  environment                 = var.environment
  aws_region                  = var.aws_region
  ecr_image_uri               = var.ecr_image_uri
  task_cpu                    = var.task_cpu
  task_memory                 = var.task_memory
  container_port              = var.container_port
  ecs_task_execution_role_arn = module.iam.ecs_task_execution_role_arn
  ecs_task_role_arn           = module.iam.ecs_task_role_arn
  log_retention_days          = var.log_retention_days
  environment_variables       = var.environment_variables
  secrets                     = var.secrets
}

# ElastiCache Redis
module "elasticache" {
  source = "../../modules/elasticache"

  project_name             = var.project_name
  environment              = var.environment
  private_subnet_ids       = module.networking.private_subnet_ids
  redis_security_group_id  = module.security_groups.redis_security_group_id
  redis_node_type          = var.redis_node_type
  redis_engine_version     = var.redis_engine_version
}

# ECS Service with Auto-Scaling
module "ecs_service" {
  source = "../../modules/ecs-service"

  project_name              = var.project_name
  environment               = var.environment
  vpc_id                    = module.networking.vpc_id
  ecs_cluster_id            = module.ecs.cluster_id
  ecs_cluster_name          = module.ecs.cluster_name
  ecs_task_definition_arn   = module.ecs.task_definition_arn
  private_subnet_ids        = module.networking.private_subnet_ids
  ecs_security_group_id     = module.security_groups.ecs_security_group_id
  target_group_arn          = module.alb.target_group_arn
  container_port            = var.container_port
  desired_count             = var.ecs_desired_count
  autoscaling_min_capacity  = var.ecs_autoscaling_min
  autoscaling_max_capacity  = var.ecs_autoscaling_max
  autoscaling_cpu_target    = var.ecs_autoscaling_cpu_target
  autoscaling_memory_target = var.ecs_autoscaling_memory_target
  autoscaling_requests_target = var.ecs_autoscaling_requests_target
  alb_arn_suffix            = module.alb.alb_arn_suffix
  target_group_arn_suffix   = module.alb.target_group_arn_suffix
  enable_service_discovery  = var.enable_service_discovery
}

# Lambda API (Issue #1169)
module "lambda_api" {
  source = "../../modules/lambda-api"

  function_name   = "${var.project_name}-api-${var.environment}"
  lambda_zip_path = var.lambda_zip_path
  architecture    = "arm64"
  memory_size     = 512
  timeout         = 30
  log_level       = var.environment == "dev" ? "debug" : "info"

  # VPC configuration for RDS access
  vpc_config = {
    subnet_ids         = module.networking.private_subnet_ids
    security_group_ids = [module.security_groups.ecs_security_group_id]
  }

  # Environment variables
  environment_variables = {
    DATABASE_URL    = var.database_url
    REDIS_URL       = "redis://${module.elasticache.redis_endpoint}:6379"
    JWT_SECRET      = var.jwt_secret
    ENVIRONMENT     = var.environment
  }

  # Secrets access
  secrets_arns = var.secrets_arns

  # API Gateway
  enable_api_gateway = true
  cors_origins       = var.cors_origins

  tags = {
    Project     = var.project_name
    Environment = var.environment
    Issue       = "#1169"
  }
}
