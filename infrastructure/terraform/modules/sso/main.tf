# AWS IAM Identity Center (SSO) Module
# Issue: #814 - AWS Multi-Account Strategy
#
# This module configures AWS IAM Identity Center for centralized
# access management across multiple AWS accounts.

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
# Data Sources
#------------------------------------------------------------------------------

data "aws_ssoadmin_instances" "main" {}

locals {
  identity_store_id = tolist(data.aws_ssoadmin_instances.main.identity_store_ids)[0]
  instance_arn      = tolist(data.aws_ssoadmin_instances.main.arns)[0]
}

#------------------------------------------------------------------------------
# Permission Sets
#------------------------------------------------------------------------------

resource "aws_ssoadmin_permission_set" "permission_sets" {
  for_each = { for ps in var.permission_sets : ps.name => ps }

  instance_arn     = local.instance_arn
  name             = each.value.name
  description      = each.value.description
  session_duration = each.value.session_duration
  relay_state      = each.value.relay_state

  tags = merge(var.common_tags, {
    Name = each.value.name
    Type = "permission-set"
  })
}

# Managed Policy Attachments
resource "aws_ssoadmin_managed_policy_attachment" "managed_policies" {
  for_each = {
    for mp in flatten([
      for ps in var.permission_sets : [
        for policy_arn in ps.managed_policy_arns : {
          permission_set_name = ps.name
          policy_arn          = policy_arn
        }
      ]
    ]) : "${mp.permission_set_name}-${md5(mp.policy_arn)}" => mp
  }

  instance_arn       = local.instance_arn
  permission_set_arn = aws_ssoadmin_permission_set.permission_sets[each.value.permission_set_name].arn
  managed_policy_arn = each.value.policy_arn
}

# Inline Policy
resource "aws_ssoadmin_permission_set_inline_policy" "inline_policies" {
  for_each = {
    for ps in var.permission_sets : ps.name => ps if ps.inline_policy != null
  }

  instance_arn       = local.instance_arn
  permission_set_arn = aws_ssoadmin_permission_set.permission_sets[each.key].arn
  inline_policy      = each.value.inline_policy
}

# Customer Managed Policy Attachments
resource "aws_ssoadmin_customer_managed_policy_attachment" "customer_policies" {
  for_each = {
    for cp in flatten([
      for ps in var.permission_sets : [
        for policy in ps.customer_managed_policies : {
          permission_set_name = ps.name
          policy_name         = policy.name
          policy_path         = policy.path
        }
      ] if ps.customer_managed_policies != null
    ]) : "${cp.permission_set_name}-${cp.policy_name}" => cp
  }

  instance_arn       = local.instance_arn
  permission_set_arn = aws_ssoadmin_permission_set.permission_sets[each.value.permission_set_name].arn

  customer_managed_policy_reference {
    name = each.value.policy_name
    path = each.value.policy_path
  }
}

# Permissions Boundary
resource "aws_ssoadmin_permissions_boundary_attachment" "boundaries" {
  for_each = {
    for ps in var.permission_sets : ps.name => ps if ps.permissions_boundary != null
  }

  instance_arn       = local.instance_arn
  permission_set_arn = aws_ssoadmin_permission_set.permission_sets[each.key].arn

  permissions_boundary {
    managed_policy_arn = each.value.permissions_boundary
  }
}

#------------------------------------------------------------------------------
# Groups
#------------------------------------------------------------------------------

resource "aws_identitystore_group" "groups" {
  for_each = { for g in var.groups : g.name => g }

  identity_store_id = local.identity_store_id
  display_name      = each.value.name
  description       = each.value.description
}

#------------------------------------------------------------------------------
# Users (Optional - can also be managed externally)
#------------------------------------------------------------------------------

resource "aws_identitystore_user" "users" {
  for_each = { for u in var.users : u.user_name => u }

  identity_store_id = local.identity_store_id
  user_name         = each.value.user_name
  display_name      = each.value.display_name

  name {
    given_name  = each.value.given_name
    family_name = each.value.family_name
  }

  emails {
    value   = each.value.email
    primary = true
  }
}

#------------------------------------------------------------------------------
# Group Memberships
#------------------------------------------------------------------------------

resource "aws_identitystore_group_membership" "memberships" {
  for_each = {
    for m in var.group_memberships : "${m.group_name}-${m.user_name}" => m
  }

  identity_store_id = local.identity_store_id
  group_id          = aws_identitystore_group.groups[each.value.group_name].group_id
  member_id         = aws_identitystore_user.users[each.value.user_name].user_id

  depends_on = [
    aws_identitystore_group.groups,
    aws_identitystore_user.users,
  ]
}

#------------------------------------------------------------------------------
# Account Assignments
#------------------------------------------------------------------------------

resource "aws_ssoadmin_account_assignment" "assignments" {
  for_each = {
    for a in var.account_assignments : "${a.account_id}-${a.permission_set_name}-${a.principal_type}-${a.principal_name}" => a
  }

  instance_arn       = local.instance_arn
  permission_set_arn = aws_ssoadmin_permission_set.permission_sets[each.value.permission_set_name].arn

  principal_id   = each.value.principal_type == "GROUP" ? aws_identitystore_group.groups[each.value.principal_name].group_id : aws_identitystore_user.users[each.value.principal_name].user_id
  principal_type = each.value.principal_type

  target_id   = each.value.account_id
  target_type = "AWS_ACCOUNT"

  depends_on = [
    aws_ssoadmin_permission_set.permission_sets,
    aws_identitystore_group.groups,
    aws_identitystore_user.users,
  ]
}
