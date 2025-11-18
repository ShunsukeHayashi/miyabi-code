output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.mcp_sse_gateway.repository_url
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.mcp_sse.dns_name
}

output "alb_zone_id" {
  description = "ALB zone ID (for Route53)"
  value       = aws_lb.mcp_sse.zone_id
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.mcp_sse.name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.mcp_sse.name
}

output "sse_tmux_endpoint" {
  description = "SSE endpoint for tmux MCP"
  value       = "http${var.certificate_arn != "" ? "s" : ""}://${aws_lb.mcp_sse.dns_name}/sse/tmux"
}

output "sse_rules_endpoint" {
  description = "SSE endpoint for rules MCP"
  value       = "http${var.certificate_arn != "" ? "s" : ""}://${aws_lb.mcp_sse.dns_name}/sse/rules"
}

output "health_check_endpoint" {
  description = "Health check endpoint"
  value       = "http${var.certificate_arn != "" ? "s" : ""}://${aws_lb.mcp_sse.dns_name}/health"
}
