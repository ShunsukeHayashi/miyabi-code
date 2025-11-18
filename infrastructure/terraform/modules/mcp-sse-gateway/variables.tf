variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "miyabi"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for ALB"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for ECS tasks"
  type        = list(string)
}

variable "ecr_repository_url" {
  description = "ECR repository URL for miyabi-sse-gateway image"
  type        = string
}

variable "image_tag" {
  description = "Docker image tag"
  type        = string
  default     = "latest"
}

variable "container_port" {
  description = "Container port"
  type        = number
  default     = 3000
}

variable "desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 1
}

variable "cpu" {
  description = "Fargate CPU units (256, 512, 1024, 2048, 4096)"
  type        = number
  default     = 512
}

variable "memory" {
  description = "Fargate memory in MB (512, 1024, 2048, etc.)"
  type        = number
  default     = 1024
}

variable "miyabi_rules_api_url" {
  description = "Miyabi Rules API URL"
  type        = string
  default     = ""
}

variable "miyabi_api_key" {
  description = "Miyabi API key (stored in AWS Secrets Manager)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS (optional)"
  type        = string
  default     = ""
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access ALB (default: all)"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}
