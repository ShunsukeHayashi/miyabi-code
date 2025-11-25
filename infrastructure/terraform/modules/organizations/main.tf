# AWS Organizations Module
# Issue: #814 - AWS Multi-Account Strategy
#
# This module creates and manages AWS Organizations structure
# for Miyabi multi-account architecture.

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

#------------------------------------------------------------------------------
# AWS Organization
#------------------------------------------------------------------------------

resource "aws_organizations_organization" "main" {
  count = var.create_organization ? 1 : 0

  aws_service_access_principals = var.service_access_principals
  enabled_policy_types          = var.enabled_policy_types
  feature_set                   = var.feature_set
}

#------------------------------------------------------------------------------
# Organizational Units (OUs)
#------------------------------------------------------------------------------

# Root OUs
resource "aws_organizations_organizational_unit" "root_ous" {
  for_each = { for ou in var.organizational_units : ou.name => ou if ou.parent == "root" }

  name      = each.value.name
  parent_id = var.create_organization ? aws_organizations_organization.main[0].roots[0].id : var.organization_root_id

  tags = merge(var.common_tags, {
    Name = each.value.name
    Type = "root-ou"
  })
}

# Child OUs (under root OUs)
resource "aws_organizations_organizational_unit" "child_ous" {
  for_each = { for ou in var.organizational_units : ou.name => ou if ou.parent != "root" }

  name      = each.value.name
  parent_id = aws_organizations_organizational_unit.root_ous[each.value.parent].id

  tags = merge(var.common_tags, {
    Name   = each.value.name
    Parent = each.value.parent
    Type   = "child-ou"
  })

  depends_on = [aws_organizations_organizational_unit.root_ous]
}

#------------------------------------------------------------------------------
# Service Control Policies (SCPs)
#------------------------------------------------------------------------------

resource "aws_organizations_policy" "scps" {
  for_each = { for scp in var.service_control_policies : scp.name => scp }

  name        = each.value.name
  description = each.value.description
  type        = "SERVICE_CONTROL_POLICY"
  content     = each.value.content

  tags = merge(var.common_tags, {
    Name = each.value.name
    Type = "scp"
  })
}

# SCP Attachments
resource "aws_organizations_policy_attachment" "scp_attachments" {
  for_each = { for att in var.scp_attachments : "${att.policy_name}-${att.target_name}" => att }

  policy_id = aws_organizations_policy.scps[each.value.policy_name].id
  target_id = each.value.target_type == "ou" ? (
    contains(keys(aws_organizations_organizational_unit.root_ous), each.value.target_name) ?
    aws_organizations_organizational_unit.root_ous[each.value.target_name].id :
    aws_organizations_organizational_unit.child_ous[each.value.target_name].id
  ) : each.value.target_id

  depends_on = [
    aws_organizations_policy.scps,
    aws_organizations_organizational_unit.root_ous,
    aws_organizations_organizational_unit.child_ous,
  ]
}

#------------------------------------------------------------------------------
# AWS Accounts
#------------------------------------------------------------------------------

resource "aws_organizations_account" "accounts" {
  for_each = { for acc in var.accounts : acc.name => acc }

  name      = each.value.name
  email     = each.value.email
  parent_id = each.value.ou_name != null ? (
    contains(keys(aws_organizations_organizational_unit.root_ous), each.value.ou_name) ?
    aws_organizations_organizational_unit.root_ous[each.value.ou_name].id :
    aws_organizations_organizational_unit.child_ous[each.value.ou_name].id
  ) : null

  role_name                  = var.default_role_name
  iam_user_access_to_billing = each.value.billing_access ? "ALLOW" : "DENY"
  close_on_deletion          = var.close_accounts_on_deletion

  tags = merge(var.common_tags, each.value.tags, {
    Name        = each.value.name
    Environment = each.value.environment
  })

  lifecycle {
    ignore_changes = [
      role_name,
    ]
  }

  depends_on = [
    aws_organizations_organizational_unit.root_ous,
    aws_organizations_organizational_unit.child_ous,
  ]
}

#------------------------------------------------------------------------------
# Delegated Administrator
#------------------------------------------------------------------------------

resource "aws_organizations_delegated_administrator" "delegations" {
  for_each = { for del in var.delegated_administrators : "${del.account_id}-${del.service_principal}" => del }

  account_id        = each.value.account_id
  service_principal = each.value.service_principal
}

#------------------------------------------------------------------------------
# Tag Policies
#------------------------------------------------------------------------------

resource "aws_organizations_policy" "tag_policies" {
  for_each = { for tp in var.tag_policies : tp.name => tp }

  name        = each.value.name
  description = each.value.description
  type        = "TAG_POLICY"
  content     = each.value.content

  tags = merge(var.common_tags, {
    Name = each.value.name
    Type = "tag-policy"
  })
}

#------------------------------------------------------------------------------
# Resource Policies (Backup Policies, AI Opt-Out Policies)
#------------------------------------------------------------------------------

resource "aws_organizations_policy" "backup_policies" {
  for_each = { for bp in var.backup_policies : bp.name => bp }

  name        = each.value.name
  description = each.value.description
  type        = "BACKUP_POLICY"
  content     = each.value.content

  tags = merge(var.common_tags, {
    Name = each.value.name
    Type = "backup-policy"
  })
}
