# Security Module

Issue: #849 - Security Hardening & Audit

Terraform module for implementing multi-layer defense security for Miyabi infrastructure.

## Overview

This module implements a comprehensive security posture including:

- **Threat Detection**: AWS GuardDuty for continuous monitoring
- **Security Posture**: AWS Security Hub with CIS and AWS Foundational benchmarks
- **Application Firewall**: AWS WAF with managed rule sets
- **Encryption**: KMS key management with automatic rotation
- **Secret Management**: AWS Secrets Manager for credentials
- **Audit Logging**: CloudWatch logs with encryption and retention
- **Security Alarms**: CloudWatch alarms for security events

## Architecture

```
                    ┌─────────────────────────────────────────┐
                    │           Security Layer                │
                    └─────────────────────────────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
        ▼                              ▼                              ▼
┌───────────────┐             ┌───────────────┐             ┌───────────────┐
│   GuardDuty   │             │  Security Hub │             │     WAF       │
│               │             │               │             │               │
│ • S3 Logs     │             │ • CIS 1.4.0   │             │ • Rate Limit  │
│ • EKS Audit   │             │ • AWS Found.  │             │ • Common Rules│
│ • Malware     │             │ • Auto-enable │             │ • SQLi        │
└───────────────┘             └───────────────┘             │ • Bad Inputs  │
                                                            │ • IP Rep      │
                                                            └───────────────┘
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
        ▼                              ▼                              ▼
┌───────────────┐             ┌───────────────┐             ┌───────────────┐
│      KMS      │             │ Secrets Mgr   │             │ CloudWatch    │
│               │             │               │             │               │
│ • Auto-rotate │             │ • DB Creds    │             │ • Security    │
│ • Log encrypt │             │ • API Keys    │             │ • Audit       │
│ • Secret enc  │             │ • KMS encrypt │             │ • Encrypted   │
└───────────────┘             └───────────────┘             └───────────────┘
```

## Usage

```hcl
module "security" {
  source = "../../modules/security"

  environment = "production"

  # GuardDuty settings
  enable_guardduty               = true
  guardduty_publishing_frequency = "FIFTEEN_MINUTES"
  enable_eks_audit               = true

  # Security Hub
  enable_security_hub = true

  # WAF settings
  enable_waf     = true
  waf_rate_limit = 2000

  # Logging
  log_retention_days       = 90
  audit_log_retention_days = 365

  # Alerting
  alarm_sns_topic_arn = aws_sns_topic.security_alerts.arn

  tags = {
    Team       = "Platform"
    CostCenter = "Security"
  }
}
```

## Security Components

### 1. AWS GuardDuty

Continuous threat detection service:

- S3 data access monitoring
- EKS audit log analysis (optional)
- Malware protection with EBS scanning
- Finding publication every 15 minutes

### 2. AWS Security Hub

Security posture management:

- CIS AWS Foundations Benchmark v1.4.0
- AWS Foundational Security Best Practices
- Auto-enabled controls for continuous compliance

### 3. AWS WAF

Web Application Firewall with:

| Rule | Description | Priority |
|------|-------------|----------|
| Rate Limiting | IP-based request throttling | 1 |
| Common Rules | OWASP top 10 protection | 2 |
| SQL Injection | SQLi attack prevention | 3 |
| Known Bad Inputs | Malicious request patterns | 4 |
| IP Reputation | Block known bad IPs | 5 |

### 4. KMS Encryption

- Customer managed key with automatic rotation
- Used for Secrets Manager and CloudWatch encryption
- IAM policies for CloudWatch Logs integration

### 5. Secrets Manager

Secure storage for:
- Database credentials
- API keys and tokens
- KMS encrypted at rest
- Configurable recovery window

### 6. CloudWatch Logs

Encrypted log groups:
- `/miyabi/{environment}/security` - Security events
- `/miyabi/{environment}/audit` - Audit trail

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| environment | Environment name | string | - | yes |
| enable_guardduty | Enable GuardDuty | bool | true | no |
| guardduty_publishing_frequency | Finding frequency | string | "FIFTEEN_MINUTES" | no |
| enable_eks_audit | Enable EKS audit in GuardDuty | bool | false | no |
| enable_security_hub | Enable Security Hub | bool | true | no |
| enable_waf | Enable WAF | bool | true | no |
| waf_rate_limit | WAF rate limit per IP | number | 2000 | no |
| log_retention_days | Log retention | number | 90 | no |
| audit_log_retention_days | Audit log retention | number | 365 | no |
| alarm_sns_topic_arn | SNS topic for alarms | string | "" | no |
| tags | Additional tags | map(string) | {} | no |

## Outputs

| Name | Description |
|------|-------------|
| guardduty_detector_id | GuardDuty detector ID |
| waf_web_acl_arn | WAF Web ACL ARN |
| kms_key_arn | KMS key ARN |
| database_secret_arn | Database secret ARN |
| security_log_group_name | Security log group name |
| security_audit_policy_arn | Security audit IAM policy ARN |
| app_least_privilege_policy_arn | App least privilege policy ARN |

## IAM Policies

### Security Audit Policy

Read-only access for security auditors:
- GuardDuty findings
- Security Hub findings
- WAF configurations
- CloudWatch logs
- CloudTrail events

### Application Least Privilege Policy

Minimum required permissions for applications:
- Secrets Manager read access (specific secrets only)
- KMS decrypt (specific key only)
- CloudWatch Logs write (specific groups only)
- Security metrics publish

## Compliance

This module supports:

- **SOC 2**: Audit logging, encryption, access controls
- **CIS AWS Foundations**: Via Security Hub benchmark
- **AWS Well-Architected**: Security pillar best practices

## Cost Estimation

| Component | Monthly Cost (Estimate) |
|-----------|------------------------|
| GuardDuty | $5-50 (based on events) |
| Security Hub | $0.001/check |
| WAF | $5 + $1/million requests |
| KMS | $1/key + $0.03/10K requests |
| Secrets Manager | $0.40/secret/month |
| CloudWatch Logs | $0.50/GB ingested |

*Costs vary by usage. See AWS pricing for details.*

## Related Issues

- Issue #849: Security Hardening & Audit
- Issue #883: Phase 3 - 200-Agent Live Experiment
