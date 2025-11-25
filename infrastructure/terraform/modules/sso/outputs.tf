# AWS IAM Identity Center (SSO) Module - Outputs
# Issue: #814 - AWS Multi-Account Strategy

#------------------------------------------------------------------------------
# Instance Outputs
#------------------------------------------------------------------------------

output "identity_store_id" {
  description = "ID of the Identity Store"
  value       = local.identity_store_id
}

output "sso_instance_arn" {
  description = "ARN of the SSO instance"
  value       = local.instance_arn
}

#------------------------------------------------------------------------------
# Permission Set Outputs
#------------------------------------------------------------------------------

output "permission_sets" {
  description = "Map of created permission sets"
  value = {
    for name, ps in aws_ssoadmin_permission_set.permission_sets : name => {
      arn              = ps.arn
      name             = ps.name
      session_duration = ps.session_duration
      created_date     = ps.created_date
    }
  }
}

output "permission_set_arns" {
  description = "Map of permission set names to ARNs"
  value = {
    for name, ps in aws_ssoadmin_permission_set.permission_sets : name => ps.arn
  }
}

#------------------------------------------------------------------------------
# Group Outputs
#------------------------------------------------------------------------------

output "groups" {
  description = "Map of created groups"
  value = {
    for name, g in aws_identitystore_group.groups : name => {
      group_id     = g.group_id
      display_name = g.display_name
    }
  }
}

output "group_ids" {
  description = "Map of group names to group IDs"
  value = {
    for name, g in aws_identitystore_group.groups : name => g.group_id
  }
}

#------------------------------------------------------------------------------
# User Outputs
#------------------------------------------------------------------------------

output "users" {
  description = "Map of created users"
  value = {
    for name, u in aws_identitystore_user.users : name => {
      user_id      = u.user_id
      user_name    = u.user_name
      display_name = u.display_name
    }
  }
}

output "user_ids" {
  description = "Map of user names to user IDs"
  value = {
    for name, u in aws_identitystore_user.users : name => u.user_id
  }
}

#------------------------------------------------------------------------------
# Account Assignment Outputs
#------------------------------------------------------------------------------

output "account_assignments" {
  description = "List of account assignments created"
  value = [
    for key, a in aws_ssoadmin_account_assignment.assignments : {
      account_id     = a.target_id
      principal_type = a.principal_type
      principal_id   = a.principal_id
      permission_set = a.permission_set_arn
    }
  ]
}

#------------------------------------------------------------------------------
# Summary
#------------------------------------------------------------------------------

output "summary" {
  description = "Summary of SSO configuration"
  value = {
    identity_store_id    = local.identity_store_id
    sso_instance_arn     = local.instance_arn
    permission_set_count = length(aws_ssoadmin_permission_set.permission_sets)
    group_count          = length(aws_identitystore_group.groups)
    user_count           = length(aws_identitystore_user.users)
    assignment_count     = length(aws_ssoadmin_account_assignment.assignments)
  }
}
