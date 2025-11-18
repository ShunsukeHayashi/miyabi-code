# Variables for GitHub Actions Self-Hosted Runners Module

variable "project_name" {
  description = "Project name used for resource tagging"
  type        = string
  default     = "miyabi"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where runners will be deployed"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block for security group rules"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for runner placement"
  type        = list(string)
}

variable "github_org" {
  description = "GitHub organization name"
  type        = string
  default     = "customer-cloud"
}

variable "github_runner_token" {
  description = "GitHub runner registration token (should be from Secrets Manager)"
  type        = string
  sensitive   = true
}

# MUGEN Runner Configuration
variable "mugen_instance_type" {
  description = "EC2 instance type for MUGEN runner"
  type        = string
  default     = "t3.large" # 2 vCPU, 8 GB RAM
}

variable "mugen_volume_size" {
  description = "Root volume size in GB for MUGEN runner"
  type        = number
  default     = 100
}

# MAJIN Runner Configuration
variable "majin_instance_type" {
  description = "EC2 instance type for MAJIN runner"
  type        = string
  default     = "g4dn.xlarge" # 4 vCPU, 16 GB RAM, 1x NVIDIA T4 GPU
}

variable "majin_volume_size" {
  description = "Root volume size in GB for MAJIN runner"
  type        = number
  default     = 150
}

# S3 Buckets
variable "artifacts_bucket" {
  description = "S3 bucket name for build artifacts"
  type        = string
}

variable "terraform_state_bucket" {
  description = "S3 bucket name for Terraform state"
  type        = string
  default     = ""
}

variable "terraform_lock_table" {
  description = "DynamoDB table name for Terraform state locking"
  type        = string
  default     = ""
}

# CloudWatch
variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

# Tags
variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
