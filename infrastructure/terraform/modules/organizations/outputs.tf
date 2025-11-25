# AWS Organizations Module - Outputs
# Issue: #814 - AWS Multi-Account Strategy

#------------------------------------------------------------------------------
# Organization Outputs
#------------------------------------------------------------------------------

output "organization_id" {
  description = "The ID of the organization"
  value       = var.create_organization ? aws_organizations_organization.main[0].id : null
}

output "organization_arn" {
  description = "ARN of the organization"
  value       = var.create_organization ? aws_organizations_organization.main[0].arn : null
}

output "organization_master_account_id" {
  description = "ID of the master account"
  value       = var.create_organization ? aws_organizations_organization.main[0].master_account_id : null
}

output "organization_root_id" {
  description = "ID of the root OU"
  value       = var.create_organization ? aws_organizations_organization.main[0].roots[0].id : var.organization_root_id
}

#------------------------------------------------------------------------------
# Organizational Unit Outputs
#------------------------------------------------------------------------------

output "root_organizational_units" {
  description = "Map of root organizational units"
  value = {
    for name, ou in aws_organizations_organizational_unit.root_ous : name => {
      id   = ou.id
      arn  = ou.arn
      name = ou.name
    }
  }
}

output "child_organizational_units" {
  description = "Map of child organizational units"
  value = {
    for name, ou in aws_organizations_organizational_unit.child_ous : name => {
      id        = ou.id
      arn       = ou.arn
      name      = ou.name
      parent_id = ou.parent_id
    }
  }
}

output "all_organizational_units" {
  description = "Map of all organizational units (root and child)"
  value = merge(
    {
      for name, ou in aws_organizations_organizational_unit.root_ous : name => {
        id        = ou.id
        arn       = ou.arn
        name      = ou.name
        parent_id = ou.parent_id
        type      = "root"
      }
    },
    {
      for name, ou in aws_organizations_organizational_unit.child_ous : name => {
        id        = ou.id
        arn       = ou.arn
        name      = ou.name
        parent_id = ou.parent_id
        type      = "child"
      }
    }
  )
}

#------------------------------------------------------------------------------
# Account Outputs
#------------------------------------------------------------------------------

output "accounts" {
  description = "Map of created AWS accounts"
  value = {
    for name, acc in aws_organizations_account.accounts : name => {
      id               = acc.id
      arn              = acc.arn
      name             = acc.name
      email            = acc.email
      status           = acc.status
      parent_id        = acc.parent_id
      assume_role_arn  = "arn:aws:iam::${acc.id}:role/${var.default_role_name}"
    }
  }
}

output "account_ids" {
  description = "Map of account names to account IDs"
  value = {
    for name, acc in aws_organizations_account.accounts : name => acc.id
  }
}

output "account_arns" {
  description = "Map of account names to account ARNs"
  value = {
    for name, acc in aws_organizations_account.accounts : name => acc.arn
  }
}

#------------------------------------------------------------------------------
# SCP Outputs
#------------------------------------------------------------------------------

output "service_control_policies" {
  description = "Map of created Service Control Policies"
  value = {
    for name, scp in aws_organizations_policy.scps : name => {
      id   = scp.id
      arn  = scp.arn
      name = scp.name
    }
  }
}

#------------------------------------------------------------------------------
# Tag Policy Outputs
#------------------------------------------------------------------------------

output "tag_policies" {
  description = "Map of created tag policies"
  value = {
    for name, tp in aws_organizations_policy.tag_policies : name => {
      id   = tp.id
      arn  = tp.arn
      name = tp.name
    }
  }
}

#------------------------------------------------------------------------------
# Backup Policy Outputs
#------------------------------------------------------------------------------

output "backup_policies" {
  description = "Map of created backup policies"
  value = {
    for name, bp in aws_organizations_policy.backup_policies : name => {
      id   = bp.id
      arn  = bp.arn
      name = bp.name
    }
  }
}

#------------------------------------------------------------------------------
# Summary Outputs
#------------------------------------------------------------------------------

output "summary" {
  description = "Summary of the organization structure"
  value = {
    organization_id     = var.create_organization ? aws_organizations_organization.main[0].id : "existing"
    root_ou_count       = length(aws_organizations_organizational_unit.root_ous)
    child_ou_count      = length(aws_organizations_organizational_unit.child_ous)
    account_count       = length(aws_organizations_account.accounts)
    scp_count           = length(aws_organizations_policy.scps)
    tag_policy_count    = length(aws_organizations_policy.tag_policies)
    backup_policy_count = length(aws_organizations_policy.backup_policies)
  }
}

#------------------------------------------------------------------------------
# Cross-Account Role ARN Helper
#------------------------------------------------------------------------------

output "cross_account_role_arns" {
  description = "Map of account names to cross-account role ARNs"
  value = {
    for name, acc in aws_organizations_account.accounts : name =>
    "arn:aws:iam::${acc.id}:role/${var.default_role_name}"
  }
}
