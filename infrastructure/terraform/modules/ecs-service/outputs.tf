# ECS Service Module Outputs

output "service_id" {
  description = "ECS service ID"
  value       = aws_ecs_service.app.id
}

output "service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.app.name
}

output "service_arn" {
  description = "ECS service ARN"
  value       = aws_ecs_service.app.arn
}

output "service_desired_count" {
  description = "Desired count of ECS tasks"
  value       = aws_ecs_service.app.desired_count
}

output "autoscaling_target_id" {
  description = "Auto-scaling target ID"
  value       = aws_appautoscaling_target.ecs.id
}

output "service_discovery_namespace_id" {
  description = "Service discovery namespace ID (if enabled)"
  value       = var.enable_service_discovery ? aws_service_discovery_private_dns_namespace.app[0].id : null
}

output "service_discovery_service_arn" {
  description = "Service discovery service ARN (if enabled)"
  value       = var.enable_service_discovery ? aws_service_discovery_service.app[0].arn : null
}

output "service_discovery_dns_name" {
  description = "Service discovery DNS name (if enabled)"
  value       = var.enable_service_discovery ? "${var.project_name}-app.${var.project_name}.local" : null
}
