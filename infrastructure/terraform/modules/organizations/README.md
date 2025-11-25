# AWS Organizations Module

Issue: #814 - AWS Multi-Account Strategy

## Overview

This Terraform module creates and manages AWS Organizations structure for the Miyabi multi-account architecture following AWS best practices.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AWS Organization                              │
│                    (Management Account)                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  Security   │  │Infrastructure│  │  Workloads  │  │   Sandbox   │ │
│  │     OU      │  │     OU      │  │     OU      │  │     OU      │ │
│  └─────────────┘  └─────────────┘  └──────┬──────┘  └─────────────┘ │
│        │                │                 │                │        │
│        │                │         ┌───────┼───────┐        │        │
│        ▼                ▼         ▼       ▼       ▼        ▼        │
│   ┌─────────┐     ┌─────────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────────┐   │
│   │Security │     │  Shared │ │ Dev │ │Stage│ │Prod │ │Sandbox  │   │
│   │ Account │     │ Infra   │ │ Acc │ │ Acc │ │ Acc │ │ Account │   │
│   └─────────┘     └─────────┘ └─────┘ └─────┘ └─────┘ └─────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Features

- **AWS Organizations Setup**: Create or use existing organization
- **Organizational Units**: Hierarchical OU structure (root and nested)
- **AWS Accounts**: Create and manage member accounts
- **Service Control Policies (SCPs)**: Enforce security boundaries
- **Tag Policies**: Ensure consistent tagging
- **Backup Policies**: Organization-wide backup governance
- **Delegated Administration**: Delegate services to security account

## Usage

### Basic Usage

```hcl
module "organizations" {
  source = "./modules/organizations"

  create_organization = false
  organization_root_id = "r-xxxx"

  organizational_units = [
    { name = "Security", parent = "root" },
    { name = "Infrastructure", parent = "root" },
    { name = "Workloads", parent = "root" },
    { name = "Sandbox", parent = "root" },
    { name = "Development", parent = "Workloads" },
    { name = "Staging", parent = "Workloads" },
    { name = "Production", parent = "Workloads" },
  ]

  common_tags = {
    Project = "Miyabi"
    Owner   = "Platform Team"
  }
}
```

### With Accounts

```hcl
module "organizations" {
  source = "./modules/organizations"

  create_organization  = false
  organization_root_id = "r-xxxx"

  accounts = [
    {
      name        = "miyabi-security"
      email       = "aws-security@miyabi.io"
      ou_name     = "Security"
      environment = "shared"
      tags = {
        Purpose = "Security and audit logs"
      }
    },
    {
      name        = "miyabi-development"
      email       = "aws-dev@miyabi.io"
      ou_name     = "Development"
      environment = "development"
    },
    {
      name        = "miyabi-staging"
      email       = "aws-staging@miyabi.io"
      ou_name     = "Staging"
      environment = "staging"
    },
    {
      name        = "miyabi-production"
      email       = "aws-prod@miyabi.io"
      ou_name     = "Production"
      environment = "production"
    },
  ]
}
```

### With Service Control Policies

```hcl
module "organizations" {
  source = "./modules/organizations"

  # ... other config ...

  service_control_policies = [
    {
      name        = "DenyRootUser"
      description = "Deny root user actions"
      content     = <<-EOF
        {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "DenyRootUser",
              "Effect": "Deny",
              "Action": "*",
              "Resource": "*",
              "Condition": {
                "StringLike": {
                  "aws:PrincipalArn": "arn:aws:iam::*:root"
                }
              }
            }
          ]
        }
      EOF
    },
    {
      name        = "RequireIMDSv2"
      description = "Require IMDSv2 for EC2 instances"
      content     = <<-EOF
        {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "RequireIMDSv2",
              "Effect": "Deny",
              "Action": "ec2:RunInstances",
              "Resource": "arn:aws:ec2:*:*:instance/*",
              "Condition": {
                "StringNotEquals": {
                  "ec2:MetadataHttpTokens": "required"
                }
              }
            }
          ]
        }
      EOF
    },
  ]

  scp_attachments = [
    {
      policy_name = "DenyRootUser"
      target_type = "ou"
      target_name = "Workloads"
    },
    {
      policy_name = "RequireIMDSv2"
      target_type = "ou"
      target_name = "Production"
    },
  ]
}
```

## Inputs

| Name | Description | Type | Default |
|------|-------------|------|---------|
| `create_organization` | Create new organization | `bool` | `false` |
| `organization_root_id` | Root ID of existing org | `string` | `null` |
| `feature_set` | Organization feature set | `string` | `"ALL"` |
| `organizational_units` | List of OUs to create | `list(object)` | See defaults |
| `accounts` | List of accounts to create | `list(object)` | `[]` |
| `service_control_policies` | List of SCPs | `list(object)` | `[]` |
| `scp_attachments` | SCP to OU/account attachments | `list(object)` | `[]` |
| `tag_policies` | List of tag policies | `list(object)` | `[]` |
| `backup_policies` | List of backup policies | `list(object)` | `[]` |
| `delegated_administrators` | Delegated admin config | `list(object)` | `[]` |
| `common_tags` | Tags for all resources | `map(string)` | See defaults |

## Outputs

| Name | Description |
|------|-------------|
| `organization_id` | ID of the organization |
| `organization_arn` | ARN of the organization |
| `organization_root_id` | ID of the root OU |
| `root_organizational_units` | Map of root OUs |
| `child_organizational_units` | Map of child OUs |
| `all_organizational_units` | Map of all OUs |
| `accounts` | Map of created accounts |
| `account_ids` | Account name to ID mapping |
| `service_control_policies` | Map of created SCPs |
| `cross_account_role_arns` | Cross-account role ARNs |
| `summary` | Organization structure summary |

## Default OU Structure

```
root
├── Security          # Security tooling, audit logs
├── Infrastructure    # Shared infrastructure, networking
├── Workloads
│   ├── Development   # Dev environment
│   ├── Staging       # Staging environment
│   └── Production    # Production environment
├── Sandbox          # Experimentation accounts
└── Suspended        # Accounts pending closure
```

## Best Practices

### 1. Account Email Convention

Use a consistent email format:
```
aws-{purpose}@{domain}
aws-security@miyabi.io
aws-dev@miyabi.io
aws-prod@miyabi.io
```

### 2. SCP Layering

Apply SCPs at appropriate OU levels:
- Root level: Global restrictions (regions, root user)
- Workload OUs: Environment-specific restrictions
- Individual accounts: Exception-based policies

### 3. Service Access Principals

Enable only needed service integrations:
```hcl
service_access_principals = [
  "cloudtrail.amazonaws.com",    # Required for org trails
  "config.amazonaws.com",        # Required for org config rules
  "guardduty.amazonaws.com",     # Security monitoring
  "securityhub.amazonaws.com",   # Security findings
  "sso.amazonaws.com",           # IAM Identity Center
]
```

### 4. Account Lifecycle

1. Create accounts via Terraform
2. Set up baseline (IAM, VPC, CloudTrail)
3. Apply appropriate SCPs
4. Enable in AWS SSO

## Security Considerations

1. **Root User Protection**: Always attach DenyRootUser SCP
2. **Region Restrictions**: Limit to approved regions
3. **Service Restrictions**: Block unused/risky services
4. **Encryption Requirements**: Enforce EBS/S3 encryption

## Related Resources

- [AWS Organizations Documentation](https://docs.aws.amazon.com/organizations/)
- [SCP Examples](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps_examples.html)
- [AWS Well-Architected Multi-Account](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/aws-account-management-and-separation.html)

## Related Issues

- Issue #814: AWS Multi-Account Strategy
- Issue #860: AWS Security Group設定
- Issue #993: Production Infrastructure
