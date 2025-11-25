# AWS IAM Identity Center (SSO) Module

Issue: #814 - AWS Multi-Account Strategy

## Overview

This Terraform module configures AWS IAM Identity Center (formerly AWS SSO) for centralized access management across multiple AWS accounts in the Miyabi ecosystem.

## Features

- **Permission Sets**: Define access levels with managed and inline policies
- **Groups**: Create groups for role-based access control
- **Users**: Optionally manage users in Identity Store
- **Account Assignments**: Assign permission sets to groups/users per account

## Usage

### Basic Usage

```hcl
module "sso" {
  source = "./modules/sso"

  # Use default permission sets and groups
  # Customize as needed

  common_tags = {
    Project = "Miyabi"
    Owner   = "Platform Team"
  }
}
```

### Full Configuration

```hcl
module "sso" {
  source = "./modules/sso"

  permission_sets = [
    {
      name                = "AdministratorAccess"
      description         = "Full administrator access"
      session_duration    = "PT4H"
      managed_policy_arns = ["arn:aws:iam::aws:policy/AdministratorAccess"]
    },
    {
      name             = "DeveloperAccess"
      description      = "Developer access"
      session_duration = "PT8H"
      managed_policy_arns = [
        "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser",
        "arn:aws:iam::aws:policy/AmazonECS_FullAccess",
      ]
      inline_policy = jsonencode({
        Version = "2012-10-17"
        Statement = [
          {
            Effect   = "Allow"
            Action   = ["s3:GetObject", "s3:PutObject"]
            Resource = ["arn:aws:s3:::miyabi-*/*"]
          }
        ]
      })
    },
  ]

  groups = [
    {
      name        = "Administrators"
      description = "Full administrative access"
    },
    {
      name        = "Developers"
      description = "Development team"
    },
  ]

  users = [
    {
      user_name    = "shunsuke"
      display_name = "Shunsuke Hayashi"
      given_name   = "Shunsuke"
      family_name  = "Hayashi"
      email        = "shunsuke@miyabi.io"
    },
  ]

  group_memberships = [
    {
      group_name = "Administrators"
      user_name  = "shunsuke"
    },
  ]

  account_assignments = [
    # Admin access to all accounts
    {
      account_id          = "111111111111"  # Management
      permission_set_name = "AdministratorAccess"
      principal_type      = "GROUP"
      principal_name      = "Administrators"
    },
    {
      account_id          = "222222222222"  # Development
      permission_set_name = "DeveloperAccess"
      principal_type      = "GROUP"
      principal_name      = "Developers"
    },
    {
      account_id          = "333333333333"  # Production
      permission_set_name = "ReadOnlyAccess"
      principal_type      = "GROUP"
      principal_name      = "Developers"
    },
  ]
}
```

## Default Permission Sets

| Name | Description | Session Duration |
|------|-------------|------------------|
| `AdministratorAccess` | Full administrator access | 4 hours |
| `PowerUserAccess` | Power user (no IAM) | 8 hours |
| `ViewOnlyAccess` | View only access | 8 hours |
| `ReadOnlyAccess` | Read only access | 8 hours |
| `DeveloperAccess` | Developer services access | 8 hours |
| `SecurityAudit` | Security audit access | 8 hours |
| `BillingAccess` | Billing and cost access | 8 hours |

## Default Groups

| Group | Description |
|-------|-------------|
| `Administrators` | Full admin access to all accounts |
| `Developers` | Development team members |
| `Platform` | Platform engineering team |
| `Security` | Security team members |
| `ReadOnly` | Auditors and viewers |
| `Finance` | Billing access |

## Access Matrix Example

```
┌──────────────────────┬──────────────┬─────────────────┬──────────────────┐
│ Group                │ Development  │ Staging         │ Production       │
├──────────────────────┼──────────────┼─────────────────┼──────────────────┤
│ Administrators       │ Admin        │ Admin           │ Admin            │
│ Platform             │ PowerUser    │ PowerUser       │ Admin            │
│ Developers           │ Developer    │ Developer       │ ReadOnly         │
│ Security             │ SecurityAudit│ SecurityAudit   │ SecurityAudit    │
│ Finance              │ -            │ -               │ Billing          │
│ ReadOnly             │ ViewOnly     │ ViewOnly        │ ViewOnly         │
└──────────────────────┴──────────────┴─────────────────┴──────────────────┘
```

## Inputs

| Name | Description | Type | Default |
|------|-------------|------|---------|
| `permission_sets` | Permission sets to create | `list(object)` | See defaults |
| `groups` | Groups to create | `list(object)` | See defaults |
| `users` | Users to create | `list(object)` | `[]` |
| `group_memberships` | Group memberships | `list(object)` | `[]` |
| `account_assignments` | Account assignments | `list(object)` | `[]` |
| `common_tags` | Tags for all resources | `map(string)` | See defaults |

## Outputs

| Name | Description |
|------|-------------|
| `identity_store_id` | ID of the Identity Store |
| `sso_instance_arn` | ARN of the SSO instance |
| `permission_sets` | Map of created permission sets |
| `permission_set_arns` | Permission set name to ARN mapping |
| `groups` | Map of created groups |
| `group_ids` | Group name to ID mapping |
| `users` | Map of created users |
| `account_assignments` | List of account assignments |
| `summary` | SSO configuration summary |

## Best Practices

### 1. Use Groups, Not Users

Always assign permission sets to groups, not individual users:
```hcl
# Good
{
  principal_type = "GROUP"
  principal_name = "Developers"
}

# Avoid
{
  principal_type = "USER"
  principal_name = "john.doe"
}
```

### 2. Least Privilege

Start with minimal permissions and add as needed:
- Dev accounts: Developer access
- Prod accounts: Read-only for most, limited write for deployments

### 3. Session Duration

Use shorter sessions for privileged access:
- Admin: 4 hours max
- Developer: 8 hours
- Read-only: 12 hours

### 4. External Identity Provider

For production, integrate with external IdP:
- Google Workspace
- Azure AD
- Okta

## Integration with Organizations Module

```hcl
module "organizations" {
  source = "./modules/organizations"
  # ...
}

module "sso" {
  source = "./modules/sso"

  account_assignments = [
    for name, acc in module.organizations.accounts : {
      account_id          = acc.id
      permission_set_name = "AdministratorAccess"
      principal_type      = "GROUP"
      principal_name      = "Administrators"
    }
  ]
}
```

## Related Issues

- Issue #814: AWS Multi-Account Strategy
- Issue #860: AWS Security Group設定
