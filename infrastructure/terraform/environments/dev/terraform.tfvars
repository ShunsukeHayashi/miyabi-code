# Miyabi Infrastructure - Development Environment Variables
# Issue #1021

project_name = "miyabi"
environment  = "dev"
aws_region   = "us-west-2"

# VPC Configuration
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]
availability_zones   = ["us-west-2a", "us-west-2b"]

# ECR Image (from Issue #1020)
ecr_image_uri = "112530848482.dkr.ecr.us-west-2.amazonaws.com/miyabi-web-api:latest"
