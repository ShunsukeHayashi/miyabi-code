/**
 * Frontend Hosting Module - Variables
 * Issue: #993 - Phase 4.6: Production Launch
 */

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "pantheon"
}

variable "environment" {
  description = "Deployment environment (staging, production)"
  type        = string

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be 'staging' or 'production'."
  }
}

variable "domain_names" {
  description = "List of domain names for CloudFront aliases"
  type        = list(string)
  default     = []
}

variable "acm_certificate_arn" {
  description = "ARN of ACM certificate for custom domain (must be in us-east-1)"
  type        = string
  default     = ""
}

variable "cloudfront_price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"

  validation {
    condition     = contains(["PriceClass_100", "PriceClass_200", "PriceClass_All"], var.cloudfront_price_class)
    error_message = "Invalid CloudFront price class."
  }
}

variable "allowed_origins" {
  description = "List of allowed CORS origins"
  type        = list(string)
  default     = ["*"]
}

variable "api_origin_domain_name" {
  description = "Domain name for API origin (optional, for API routing through CloudFront)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
