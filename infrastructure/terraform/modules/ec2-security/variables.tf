# EC2 Security Module Variables
# Issue: #860 - AWS Security Group設定 - Miyabi API (Port 3002)開放

variable "environment" {
  description = "Environment name (staging/production)"
  type        = string

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be 'staging' or 'production'."
  }
}

# =============================================================================
# VPC Configuration
# =============================================================================

variable "vpc_id" {
  description = "VPC ID for security groups"
  type        = string
}

# =============================================================================
# API Access Control
# =============================================================================

variable "api_allowed_cidrs" {
  description = "CIDR blocks allowed to access Miyabi Management API (Port 3002)"
  type        = list(string)
  default     = []

  validation {
    condition = alltrue([
      for cidr in var.api_allowed_cidrs : can(cidrhost(cidr, 0))
    ])
    error_message = "All values must be valid CIDR blocks."
  }
}

variable "web_api_allowed_cidrs" {
  description = "CIDR blocks allowed to access Web API (Port 4000)"
  type        = list(string)
  default     = ["0.0.0.0/0"]

  validation {
    condition = alltrue([
      for cidr in var.web_api_allowed_cidrs : can(cidrhost(cidr, 0))
    ])
    error_message = "All values must be valid CIDR blocks."
  }
}

variable "ssh_allowed_cidrs" {
  description = "CIDR blocks allowed SSH access"
  type        = list(string)
  default     = []

  validation {
    condition = alltrue([
      for cidr in var.ssh_allowed_cidrs : can(cidrhost(cidr, 0))
    ])
    error_message = "All values must be valid CIDR blocks."
  }
}

# =============================================================================
# Additional API Ports
# =============================================================================

variable "additional_api_ports" {
  description = "Additional API ports to open (map of port configurations)"
  type = map(object({
    port        = number
    cidr_blocks = list(string)
    description = string
  }))
  default = {}

  validation {
    condition = alltrue([
      for key, config in var.additional_api_ports :
      config.port >= 1 && config.port <= 65535
    ])
    error_message = "Port numbers must be between 1 and 65535."
  }
}

# =============================================================================
# Tags
# =============================================================================

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
