# Security Module Outputs
# Issue: #849 - Security Hardening & Audit

# =============================================================================
# GuardDuty
# =============================================================================

output "guardduty_detector_id" {
  description = "GuardDuty detector ID"
  value       = var.enable_guardduty ? aws_guardduty_detector.main[0].id : null
}

output "guardduty_detector_arn" {
  description = "GuardDuty detector ARN"
  value       = var.enable_guardduty ? aws_guardduty_detector.main[0].arn : null
}

# =============================================================================
# WAF
# =============================================================================

output "waf_web_acl_id" {
  description = "WAF Web ACL ID"
  value       = var.enable_waf ? aws_wafv2_web_acl.main[0].id : null
}

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = var.enable_waf ? aws_wafv2_web_acl.main[0].arn : null
}

# =============================================================================
# KMS
# =============================================================================

output "kms_key_id" {
  description = "KMS key ID"
  value       = aws_kms_key.main.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN"
  value       = aws_kms_key.main.arn
}

output "kms_alias_arn" {
  description = "KMS alias ARN"
  value       = aws_kms_alias.main.arn
}

# =============================================================================
# Secrets Manager
# =============================================================================

output "database_secret_arn" {
  description = "Database credentials secret ARN"
  value       = aws_secretsmanager_secret.database.arn
}

output "api_keys_secret_arn" {
  description = "API keys secret ARN"
  value       = aws_secretsmanager_secret.api_keys.arn
}

# =============================================================================
# CloudWatch Logs
# =============================================================================

output "security_log_group_name" {
  description = "Security log group name"
  value       = aws_cloudwatch_log_group.security_logs.name
}

output "security_log_group_arn" {
  description = "Security log group ARN"
  value       = aws_cloudwatch_log_group.security_logs.arn
}

output "audit_log_group_name" {
  description = "Audit log group name"
  value       = aws_cloudwatch_log_group.audit_logs.name
}

output "audit_log_group_arn" {
  description = "Audit log group ARN"
  value       = aws_cloudwatch_log_group.audit_logs.arn
}

# =============================================================================
# IAM Policies
# =============================================================================

output "security_audit_policy_arn" {
  description = "Security audit IAM policy ARN"
  value       = aws_iam_policy.security_audit.arn
}

output "app_least_privilege_policy_arn" {
  description = "Application least privilege IAM policy ARN"
  value       = aws_iam_policy.least_privilege_app.arn
}

# =============================================================================
# Summary
# =============================================================================

output "security_summary" {
  description = "Summary of security resources"
  value = {
    guardduty_enabled   = var.enable_guardduty
    security_hub_enabled = var.enable_security_hub
    waf_enabled         = var.enable_waf
    kms_key_id          = aws_kms_key.main.key_id
    log_retention_days  = var.log_retention_days
  }
}
