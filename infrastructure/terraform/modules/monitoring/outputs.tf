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

# =============================================================================
# Alarm ARNs
# =============================================================================

output "api_5xx_error_rate_alarm_arn" {
  description = "ARN of the API 5XX error rate alarm"
  value       = aws_cloudwatch_metric_alarm.api_5xx_error_rate.arn
}

output "api_latency_alarm_arn" {
  description = "ARN of the API latency alarm"
  value       = aws_cloudwatch_metric_alarm.api_latency.arn
}

output "ecs_cpu_alarm_arn" {
  description = "ARN of the ECS CPU alarm"
  value       = var.ecs_cluster_name != "" ? aws_cloudwatch_metric_alarm.ecs_cpu_high[0].arn : null
}

output "ecs_memory_alarm_arn" {
  description = "ARN of the ECS memory alarm"
  value       = var.ecs_cluster_name != "" ? aws_cloudwatch_metric_alarm.ecs_memory_high[0].arn : null
}

output "alb_response_time_p95_alarm_arn" {
  description = "ARN of the ALB P95 response time alarm"
  value       = var.alb_name != "" ? aws_cloudwatch_metric_alarm.alb_response_time_p95[0].arn : null
}

output "alb_5xx_error_rate_alarm_arn" {
  description = "ARN of the ALB 5XX error rate alarm"
  value       = var.alb_name != "" ? aws_cloudwatch_metric_alarm.alb_5xx_error_rate[0].arn : null
}

# =============================================================================
# Composite Alarm ARNs
# =============================================================================

output "critical_system_health_alarm_arn" {
  description = "ARN of the critical system health composite alarm"
  value       = var.enable_composite_alarms ? aws_cloudwatch_composite_alarm.critical_system_health[0].arn : null
}

output "service_degradation_alarm_arn" {
  description = "ARN of the service degradation composite alarm"
  value       = var.enable_composite_alarms && var.alb_name != "" ? aws_cloudwatch_composite_alarm.service_degradation[0].arn : null
}

output "resource_exhaustion_alarm_arn" {
  description = "ARN of the resource exhaustion composite alarm"
  value       = var.enable_composite_alarms && var.ecs_cluster_name != "" ? aws_cloudwatch_composite_alarm.resource_exhaustion[0].arn : null
}

# =============================================================================
# Alarm Summary
# =============================================================================

output "alarm_summary" {
  description = "Summary of all created alarms"
  value = {
    sns_topic_arn = aws_sns_topic.alarms.arn
    dashboard_url = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"

    api_alarms = {
      error_rate_5xx = aws_cloudwatch_metric_alarm.api_5xx_error_rate.alarm_name
      error_rate_4xx = aws_cloudwatch_metric_alarm.api_4xx_error_rate.alarm_name
      latency_p50    = aws_cloudwatch_metric_alarm.api_latency_p50.alarm_name
      latency_p95    = aws_cloudwatch_metric_alarm.api_latency.alarm_name
      latency_p99    = aws_cloudwatch_metric_alarm.api_latency_p99.alarm_name
      request_anomaly = var.enable_anomaly_detection ? aws_cloudwatch_metric_alarm.api_request_anomaly[0].alarm_name : null
    }

    ecs_alarms = var.ecs_cluster_name != "" ? {
      cpu_high        = aws_cloudwatch_metric_alarm.ecs_cpu_high[0].alarm_name
      memory_high     = aws_cloudwatch_metric_alarm.ecs_memory_high[0].alarm_name
      task_count_low  = aws_cloudwatch_metric_alarm.ecs_task_count_low[0].alarm_name
    } : null

    alb_alarms = var.alb_name != "" ? {
      response_time_p95     = aws_cloudwatch_metric_alarm.alb_response_time_p95[0].alarm_name
      response_time_p99     = aws_cloudwatch_metric_alarm.alb_response_time_p99[0].alarm_name
      error_rate_5xx        = aws_cloudwatch_metric_alarm.alb_5xx_error_rate[0].alarm_name
      error_rate_4xx        = aws_cloudwatch_metric_alarm.alb_4xx_error_rate[0].alarm_name
      unhealthy_hosts       = var.alb_target_group_name != "" ? aws_cloudwatch_metric_alarm.alb_unhealthy_hosts[0].alarm_name : null
      healthy_hosts_low     = var.alb_target_group_name != "" ? aws_cloudwatch_metric_alarm.alb_healthy_hosts_low[0].alarm_name : null
      response_time_anomaly = var.enable_anomaly_detection ? aws_cloudwatch_metric_alarm.alb_response_time_anomaly[0].alarm_name : null
    } : null

    composite_alarms = var.enable_composite_alarms ? {
      critical_system_health = aws_cloudwatch_composite_alarm.critical_system_health[0].alarm_name
      service_degradation    = var.alb_name != "" ? aws_cloudwatch_composite_alarm.service_degradation[0].alarm_name : null
      resource_exhaustion    = var.ecs_cluster_name != "" ? aws_cloudwatch_composite_alarm.resource_exhaustion[0].alarm_name : null
    } : null
  }
}
