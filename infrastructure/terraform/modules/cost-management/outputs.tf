# Cost Management Module Outputs
# Issue: #848 - コストトラッキング & 最適化

# =============================================================================
# Budget Outputs
# =============================================================================

output "monthly_budget_id" {
  description = "Monthly budget ID"
  value       = aws_budgets_budget.monthly_total.id
}

output "ec2_budget_id" {
  description = "EC2 budget ID"
  value       = aws_budgets_budget.ec2_budget.id
}

output "bedrock_budget_id" {
  description = "Bedrock budget ID"
  value       = aws_budgets_budget.bedrock_budget.id
}

# =============================================================================
# Anomaly Detection
# =============================================================================

output "anomaly_monitor_arn" {
  description = "Cost anomaly monitor ARN"
  value       = aws_ce_anomaly_monitor.service_monitor.arn
}

output "anomaly_subscription_id" {
  description = "Cost anomaly subscription ID"
  value       = aws_ce_anomaly_subscription.alerts.id
}

# =============================================================================
# VPC Endpoints
# =============================================================================

output "s3_endpoint_id" {
  description = "S3 VPC endpoint ID"
  value       = var.enable_vpc_endpoints && var.vpc_id != "" ? aws_vpc_endpoint.s3[0].id : null
}

output "dynamodb_endpoint_id" {
  description = "DynamoDB VPC endpoint ID"
  value       = var.enable_vpc_endpoints && var.vpc_id != "" ? aws_vpc_endpoint.dynamodb[0].id : null
}

output "ecr_api_endpoint_id" {
  description = "ECR API VPC endpoint ID"
  value       = var.enable_vpc_endpoints && var.vpc_id != "" ? aws_vpc_endpoint.ecr_api[0].id : null
}

output "ecr_dkr_endpoint_id" {
  description = "ECR DKR VPC endpoint ID"
  value       = var.enable_vpc_endpoints && var.vpc_id != "" ? aws_vpc_endpoint.ecr_dkr[0].id : null
}

output "logs_endpoint_id" {
  description = "CloudWatch Logs VPC endpoint ID"
  value       = var.enable_vpc_endpoints && var.vpc_id != "" ? aws_vpc_endpoint.logs[0].id : null
}

# =============================================================================
# Dashboard
# =============================================================================

output "cost_dashboard_arn" {
  description = "Cost dashboard ARN"
  value       = aws_cloudwatch_dashboard.cost.dashboard_arn
}

output "cost_dashboard_name" {
  description = "Cost dashboard name"
  value       = aws_cloudwatch_dashboard.cost.dashboard_name
}

# =============================================================================
# Summary
# =============================================================================

output "cost_optimization_summary" {
  description = "Summary of cost optimization features"
  value = {
    monthly_budget              = var.monthly_budget_limit
    s3_intelligent_tiering      = var.enable_s3_intelligent_tiering
    vpc_endpoints_enabled       = var.enable_vpc_endpoints
    anomaly_detection_enabled   = true
    cost_dashboard              = aws_cloudwatch_dashboard.cost.dashboard_name
  }
}

output "estimated_savings" {
  description = "Estimated cost savings from optimization"
  value = {
    s3_intelligent_tiering = "Up to 50% for infrequent access data"
    vpc_endpoints          = "Up to 90% reduction in NAT Gateway data transfer"
    spot_instances         = "Up to 60% (must be configured separately)"
    savings_plans          = "Up to 30% (must be purchased separately)"
    reserved_dynamodb      = "Up to 40% (must be configured separately)"
  }
}
