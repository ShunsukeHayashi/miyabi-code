# Miyabi Infrastructure - Outputs
# Issue #1021 - VPC, Security Groups & IAM
# Issue #1022 - ECS, ALB & Redis
# Issue #1023 - ECS Service

# VPC Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.networking.vpc_id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = module.networking.vpc_cidr
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.networking.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.networking.private_subnet_ids
}

output "nat_gateway_id" {
  description = "NAT Gateway ID"
  value       = module.networking.nat_gateway_id
}

# Security Group Outputs
output "alb_security_group_id" {
  description = "ALB security group ID"
  value       = module.security_groups.alb_security_group_id
}

output "ecs_security_group_id" {
  description = "ECS security group ID"
  value       = module.security_groups.ecs_security_group_id
}

output "rds_security_group_id" {
  description = "RDS security group ID"
  value       = module.security_groups.rds_security_group_id
}

output "redis_security_group_id" {
  description = "Redis security group ID"
  value       = module.security_groups.redis_security_group_id
}

# IAM Outputs
output "ecs_task_execution_role_arn" {
  description = "ECS task execution role ARN"
  value       = module.iam.ecs_task_execution_role_arn
}

output "ecs_task_role_arn" {
  description = "ECS task role ARN"
  value       = module.iam.ecs_task_role_arn
}

# ALB Outputs
output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.alb_dns_name
}

output "alb_arn" {
  description = "ALB ARN"
  value       = module.alb.alb_arn
}

output "target_group_arn" {
  description = "Target group ARN"
  value       = module.alb.target_group_arn
}

# ECS Outputs
output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_cluster_arn" {
  description = "ECS cluster ARN"
  value       = module.ecs.cluster_arn
}

output "ecs_task_definition_arn" {
  description = "ECS task definition ARN"
  value       = module.ecs.task_definition_arn
}

output "ecs_task_definition_family" {
  description = "ECS task definition family"
  value       = module.ecs.task_definition_family
}

output "ecs_log_group_name" {
  description = "CloudWatch log group name for ECS"
  value       = module.ecs.log_group_name
}

# ElastiCache Outputs
output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = module.elasticache.redis_endpoint
}

output "redis_port" {
  description = "Redis port"
  value       = module.elasticache.redis_port
}

output "redis_connection_string" {
  description = "Redis connection string"
  value       = module.elasticache.redis_connection_string
}

output "redis_cluster_id" {
  description = "Redis cluster ID"
  value       = module.elasticache.redis_cluster_id
}

# ECS Service Outputs
output "ecs_service_name" {
  description = "ECS service name"
  value       = module.ecs_service.service_name
}

output "ecs_service_arn" {
  description = "ECS service ARN"
  value       = module.ecs_service.service_arn
}

output "ecs_service_desired_count" {
  description = "ECS service desired count"
  value       = module.ecs_service.service_desired_count
}

output "service_discovery_dns_name" {
  description = "Service discovery DNS name (if enabled)"
  value       = module.ecs_service.service_discovery_dns_name
}

# Lambda API Outputs (Issue #1169)
output "lambda_function_name" {
  description = "Lambda function name"
  value       = module.lambda_api.function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = module.lambda_api.function_arn
}

output "api_gateway_endpoint" {
  description = "API Gateway endpoint URL"
  value       = module.lambda_api.api_gateway_endpoint
}

output "lambda_cloudwatch_log_group" {
  description = "Lambda CloudWatch Log Group"
  value       = module.lambda_api.cloudwatch_log_group
}
