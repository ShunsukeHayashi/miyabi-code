# AWS Organizations Module - Variables
# Issue: #814 - AWS Multi-Account Strategy

#------------------------------------------------------------------------------
# Organization Settings
#------------------------------------------------------------------------------

variable "create_organization" {
  description = "Whether to create a new AWS Organization. Set false if organization already exists."
  type        = bool
  default     = false
}

variable "organization_root_id" {
  description = "Root ID of existing organization (required if create_organization is false)"
  type        = string
  default     = null
}

variable "feature_set" {
  description = "Feature set of the organization. Valid values: ALL, CONSOLIDATED_BILLING"
  type        = string
  default     = "ALL"

  validation {
    condition     = contains(["ALL", "CONSOLIDATED_BILLING"], var.feature_set)
    error_message = "Feature set must be ALL or CONSOLIDATED_BILLING."
  }
}

variable "service_access_principals" {
  description = "List of AWS service principal names for which you want to enable integration."
  type        = list(string)
  default = [
    "cloudtrail.amazonaws.com",
    "config.amazonaws.com",
    "guardduty.amazonaws.com",
    "securityhub.amazonaws.com",
    "sso.amazonaws.com",
    "aws-artifact-account-sync.amazonaws.com",
    "backup.amazonaws.com",
    "member.org.stacksets.cloudformation.amazonaws.com",
    "access-analyzer.amazonaws.com",
    "macie.amazonaws.com",
    "inspector2.amazonaws.com",
  ]
}

variable "enabled_policy_types" {
  description = "List of Organizations policy types to enable."
  type        = list(string)
  default = [
    "SERVICE_CONTROL_POLICY",
    "TAG_POLICY",
    "BACKUP_POLICY",
  ]
}

#------------------------------------------------------------------------------
# Organizational Units
#------------------------------------------------------------------------------

variable "organizational_units" {
  description = "List of Organizational Units to create."
  type = list(object({
    name   = string
    parent = string # "root" or name of parent OU
  }))
  default = [
    # Root level OUs
    { name = "Security", parent = "root" },
    { name = "Infrastructure", parent = "root" },
    { name = "Workloads", parent = "root" },
    { name = "Sandbox", parent = "root" },
    { name = "Suspended", parent = "root" },

    # Child OUs under Workloads
    { name = "Development", parent = "Workloads" },
    { name = "Staging", parent = "Workloads" },
    { name = "Production", parent = "Workloads" },
  ]
}

#------------------------------------------------------------------------------
# AWS Accounts
#------------------------------------------------------------------------------

variable "accounts" {
  description = "List of AWS accounts to create."
  type = list(object({
    name           = string
    email          = string
    ou_name        = optional(string)
    environment    = optional(string, "shared")
    billing_access = optional(bool, true)
    tags           = optional(map(string), {})
  }))
  default = []
}

variable "default_role_name" {
  description = "IAM role name for cross-account access from management account."
  type        = string
  default     = "OrganizationAccountAccessRole"
}

variable "close_accounts_on_deletion" {
  description = "Whether to close AWS accounts when removed from Terraform."
  type        = bool
  default     = false
}

#------------------------------------------------------------------------------
# Service Control Policies
#------------------------------------------------------------------------------

variable "service_control_policies" {
  description = "List of Service Control Policies to create."
  type = list(object({
    name        = string
    description = string
    content     = string
  }))
  default = []
}

variable "scp_attachments" {
  description = "List of SCP attachments to OUs or accounts."
  type = list(object({
    policy_name = string
    target_type = string # "ou" or "account"
    target_name = string # OU name or account name
    target_id   = optional(string)
  }))
  default = []
}

#------------------------------------------------------------------------------
# Tag Policies
#------------------------------------------------------------------------------

variable "tag_policies" {
  description = "List of tag policies to create."
  type = list(object({
    name        = string
    description = string
    content     = string
  }))
  default = []
}

#------------------------------------------------------------------------------
# Backup Policies
#------------------------------------------------------------------------------

variable "backup_policies" {
  description = "List of backup policies to create."
  type = list(object({
    name        = string
    description = string
    content     = string
  }))
  default = []
}

#------------------------------------------------------------------------------
# Delegated Administrators
#------------------------------------------------------------------------------

variable "delegated_administrators" {
  description = "List of delegated administrator configurations."
  type = list(object({
    account_id        = string
    service_principal = string
  }))
  default = []
}

#------------------------------------------------------------------------------
# Common Tags
#------------------------------------------------------------------------------

variable "common_tags" {
  description = "Common tags to apply to all resources."
  type        = map(string)
  default = {
    Project   = "Miyabi"
    ManagedBy = "Terraform"
    Module    = "organizations"
  }
}
