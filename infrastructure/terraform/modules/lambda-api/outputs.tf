# Outputs for Lambda API Module

output "function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.api.function_name
}

output "function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.api.arn
}

output "invoke_arn" {
  description = "Lambda invoke ARN"
  value       = aws_lambda_function.api.invoke_arn
}

output "function_url" {
  description = "Lambda Function URL (if enabled)"
  value       = var.enable_function_url ? aws_lambda_function_url.api[0].function_url : null
}

output "api_gateway_id" {
  description = "API Gateway HTTP API ID"
  value       = var.enable_api_gateway ? aws_apigatewayv2_api.api[0].id : null
}

output "api_gateway_endpoint" {
  description = "API Gateway endpoint URL"
  value       = var.enable_api_gateway ? aws_apigatewayv2_stage.api[0].invoke_url : null
}

output "api_gateway_execution_arn" {
  description = "API Gateway execution ARN"
  value       = var.enable_api_gateway ? aws_apigatewayv2_api.api[0].execution_arn : null
}

output "lambda_role_arn" {
  description = "Lambda execution role ARN"
  value       = aws_iam_role.lambda_exec.arn
}

output "cloudwatch_log_group" {
  description = "CloudWatch Log Group name for Lambda"
  value       = aws_cloudwatch_log_group.lambda.name
}
