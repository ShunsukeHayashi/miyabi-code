# AWS IAM Identity Center (SSO) Module - Variables
# Issue: #814 - AWS Multi-Account Strategy

#------------------------------------------------------------------------------
# Permission Sets
#------------------------------------------------------------------------------

variable "permission_sets" {
  description = "List of permission sets to create."
  type = list(object({
    name                      = string
    description               = string
    session_duration          = optional(string, "PT8H") # ISO 8601 duration
    relay_state               = optional(string)
    managed_policy_arns       = optional(list(string), [])
    inline_policy             = optional(string)
    customer_managed_policies = optional(list(object({
      name = string
      path = optional(string, "/")
    })))
    permissions_boundary = optional(string)
  }))
  default = [
    {
      name                = "AdministratorAccess"
      description         = "Full administrator access"
      session_duration    = "PT4H"
      managed_policy_arns = ["arn:aws:iam::aws:policy/AdministratorAccess"]
    },
    {
      name                = "PowerUserAccess"
      description         = "Power user access (no IAM)"
      session_duration    = "PT8H"
      managed_policy_arns = ["arn:aws:iam::aws:policy/PowerUserAccess"]
    },
    {
      name                = "ViewOnlyAccess"
      description         = "View only access"
      session_duration    = "PT8H"
      managed_policy_arns = ["arn:aws:iam::aws:policy/ViewOnlyAccess"]
    },
    {
      name                = "ReadOnlyAccess"
      description         = "Read only access"
      session_duration    = "PT8H"
      managed_policy_arns = ["arn:aws:iam::aws:policy/ReadOnlyAccess"]
    },
    {
      name             = "DeveloperAccess"
      description      = "Developer access (limited IAM, full dev services)"
      session_duration = "PT8H"
      managed_policy_arns = [
        "arn:aws:iam::aws:policy/AWSCodeBuildDeveloperAccess",
        "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser",
        "arn:aws:iam::aws:policy/AmazonECS_FullAccess",
        "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess",
      ]
    },
    {
      name             = "SecurityAudit"
      description      = "Security audit access"
      session_duration = "PT8H"
      managed_policy_arns = [
        "arn:aws:iam::aws:policy/SecurityAudit",
        "arn:aws:iam::aws:policy/AWSSecurityHubReadOnlyAccess",
      ]
    },
    {
      name             = "BillingAccess"
      description      = "Billing and cost management access"
      session_duration = "PT8H"
      managed_policy_arns = [
        "arn:aws:iam::aws:policy/AWSBillingReadOnlyAccess",
        "arn:aws:iam::aws:policy/AWSCostAndUsageReportAutomationPolicy",
      ]
    },
  ]
}

#------------------------------------------------------------------------------
# Groups
#------------------------------------------------------------------------------

variable "groups" {
  description = "List of groups to create in Identity Store."
  type = list(object({
    name        = string
    description = string
  }))
  default = [
    {
      name        = "Administrators"
      description = "Full administrative access to all accounts"
    },
    {
      name        = "Developers"
      description = "Development team members"
    },
    {
      name        = "Platform"
      description = "Platform engineering team"
    },
    {
      name        = "Security"
      description = "Security team members"
    },
    {
      name        = "ReadOnly"
      description = "Read-only access for auditors and viewers"
    },
    {
      name        = "Finance"
      description = "Finance team for billing access"
    },
  ]
}

#------------------------------------------------------------------------------
# Users
#------------------------------------------------------------------------------

variable "users" {
  description = "List of users to create in Identity Store."
  type = list(object({
    user_name    = string
    display_name = string
    given_name   = string
    family_name  = string
    email        = string
  }))
  default = []
}

#------------------------------------------------------------------------------
# Group Memberships
#------------------------------------------------------------------------------

variable "group_memberships" {
  description = "List of group memberships (user to group assignments)."
  type = list(object({
    group_name = string
    user_name  = string
  }))
  default = []
}

#------------------------------------------------------------------------------
# Account Assignments
#------------------------------------------------------------------------------

variable "account_assignments" {
  description = "List of account assignments (permission set to principal to account)."
  type = list(object({
    account_id          = string
    permission_set_name = string
    principal_type      = string # "GROUP" or "USER"
    principal_name      = string
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
    Module    = "sso"
  }
}
