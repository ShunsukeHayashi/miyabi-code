/**
 * Monitoring Module - Outputs
 * Issue: #851 - Terraform/CDK Infrastructure as Code
 */

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alarms"
  value       = aws_sns_topic.alarms.arn
}

output "api_log_group_name" {
  description = "Name of the API log group"
  value       = aws_cloudwatch_log_group.api.name
}

output "agents_log_group_name" {
  description = "Name of the agents log group"
  value       = aws_cloudwatch_log_group.agents.name
}

output "orchestrator_log_group_name" {
  description = "Name of the orchestrator log group"
  value       = aws_cloudwatch_log_group.orchestrator.name
}

output "dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "dashboard_arn" {
  description = "ARN of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_arn
}
