# ==============================================================================
# CloudWatch Logs Module Outputs
# ==============================================================================

output "kms_key_id" {
  description = "ID of the KMS key for CloudWatch Logs encryption"
  value       = aws_kms_key.cloudwatch_logs.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key for CloudWatch Logs encryption"
  value       = aws_kms_key.cloudwatch_logs.arn
}

output "log_group_mcp_server_name" {
  description = "Name of the MCP server log group"
  value       = aws_cloudwatch_log_group.mcp_server.name
}

output "log_group_mcp_server_arn" {
  description = "ARN of the MCP server log group"
  value       = aws_cloudwatch_log_group.mcp_server.arn
}

output "log_group_system_name" {
  description = "Name of the system log group"
  value       = aws_cloudwatch_log_group.system.name
}

output "log_group_system_arn" {
  description = "ARN of the system log group"
  value       = aws_cloudwatch_log_group.system.arn
}

output "log_group_cloudwatch_agent_name" {
  description = "Name of the CloudWatch Agent log group"
  value       = aws_cloudwatch_log_group.cloudwatch_agent.name
}

output "log_group_cloudwatch_agent_arn" {
  description = "ARN of the CloudWatch Agent log group"
  value       = aws_cloudwatch_log_group.cloudwatch_agent.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for CloudWatch alarms"
  value       = aws_sns_topic.cloudwatch_alarms.arn
}

output "sns_topic_name" {
  description = "Name of the SNS topic for CloudWatch alarms"
  value       = aws_sns_topic.cloudwatch_alarms.name
}

output "iam_role_arn" {
  description = "ARN of the IAM role for EC2 instances"
  value       = var.create_iam_role ? aws_iam_role.ec2_cloudwatch[0].arn : var.existing_iam_role_arn
}

output "iam_role_name" {
  description = "Name of the IAM role for EC2 instances"
  value       = var.create_iam_role ? aws_iam_role.ec2_cloudwatch[0].name : ""
}

output "iam_instance_profile_arn" {
  description = "ARN of the IAM instance profile for EC2 instances"
  value       = var.create_iam_role ? aws_iam_instance_profile.ec2_cloudwatch[0].arn : ""
}

output "iam_instance_profile_name" {
  description = "Name of the IAM instance profile for EC2 instances"
  value       = var.create_iam_role ? aws_iam_instance_profile.ec2_cloudwatch[0].name : ""
}

# Alarm ARNs
output "alarm_high_error_rate_arn" {
  description = "ARN of the high error rate alarm"
  value       = aws_cloudwatch_metric_alarm.high_error_rate.arn
}

output "alarm_critical_error_arn" {
  description = "ARN of the critical error alarm"
  value       = aws_cloudwatch_metric_alarm.critical_error.arn
}

output "alarm_high_exception_rate_arn" {
  description = "ARN of the high exception rate alarm"
  value       = aws_cloudwatch_metric_alarm.high_exception_rate.arn
}

output "alarm_slow_requests_arn" {
  description = "ARN of the slow requests alarm"
  value       = aws_cloudwatch_metric_alarm.slow_requests.arn
}

output "alarm_log_group_size_arn" {
  description = "ARN of the log group size alarm"
  value       = aws_cloudwatch_metric_alarm.log_group_size.arn
}

# CloudWatch Agent Configuration
output "cloudwatch_agent_config" {
  description = "CloudWatch Agent configuration (for reference)"
  value = {
    config_file_path = "/opt/aws/amazon-cloudwatch-agent/etc/config.json"
    log_group_name   = aws_cloudwatch_log_group.mcp_server.name
    namespace        = var.cloudwatch_namespace
  }
}
