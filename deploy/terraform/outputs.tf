# Miyabi Frontend Infrastructure - Outputs

output "s3_bucket_name" {
  description = "S3 bucket name for static website"
  value       = aws_s3_bucket.webui.id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.webui.arn
}

output "s3_bucket_regional_domain_name" {
  description = "S3 bucket regional domain name"
  value       = aws_s3_bucket.webui.bucket_regional_domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.webui.id
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.webui.arn
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.webui.domain_name
}

output "website_url" {
  description = "Website URL (CloudFront default or custom domain)"
  value       = var.acm_certificate_arn != "" ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.webui.domain_name}"
}

output "deploy_command" {
  description = "Command to deploy frontend"
  value       = <<-EOT
    # Build and deploy frontend
    cd miyabi-console && npm run build
    aws s3 sync dist/ s3://${aws_s3_bucket.webui.id}/ --delete
    aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.webui.id} --paths "/*"
  EOT
}

# ==============================================================================
# Lambda Artifacts Bucket Outputs
# ==============================================================================

output "lambda_artifacts_bucket_name" {
  description = "S3 bucket name for Lambda deployment artifacts"
  value       = aws_s3_bucket.lambda_artifacts.id
}

output "lambda_artifacts_bucket_arn" {
  description = "S3 bucket ARN for Lambda artifacts"
  value       = aws_s3_bucket.lambda_artifacts.arn
}

output "lambda_artifacts_bucket_regional_domain_name" {
  description = "S3 bucket regional domain name for Lambda artifacts"
  value       = aws_s3_bucket.lambda_artifacts.bucket_regional_domain_name
}

output "lambda_deploy_command_example" {
  description = "Example command to upload Lambda artifact"
  value       = <<-EOT
    # Package and upload Lambda function
    zip -r function.zip index.js node_modules/
    aws s3 cp function.zip s3://${aws_s3_bucket.lambda_artifacts.id}/my-function/v1.0.0/function.zip

    # Update Lambda function code
    aws lambda update-function-code \
      --function-name my-function \
      --s3-bucket ${aws_s3_bucket.lambda_artifacts.id} \
      --s3-key my-function/v1.0.0/function.zip
  EOT
}

# ==============================================================================
# Lambda Function Outputs
# ==============================================================================

output "lambda_function_name" {
  description = "Lambda function name for MCP server"
  value       = aws_lambda_function.mcp_server.function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN"
  value       = aws_lambda_function.mcp_server.arn
}

output "lambda_function_url" {
  description = "Lambda function URL (if enabled)"
  value       = var.enable_lambda_function_url ? aws_lambda_function_url.mcp_server[0].function_url : null
}

output "lambda_role_arn" {
  description = "Lambda execution role ARN"
  value       = aws_iam_role.lambda_exec.arn
}

# ==============================================================================
# API Gateway Outputs
# ==============================================================================

output "api_gateway_id" {
  description = "API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.mcp_api.id
}

output "api_gateway_arn" {
  description = "API Gateway REST API ARN"
  value       = aws_api_gateway_rest_api.mcp_api.arn
}

output "api_gateway_stage_name" {
  description = "API Gateway stage name"
  value       = aws_api_gateway_stage.main.stage_name
}

output "api_gateway_invoke_url" {
  description = "API Gateway invoke URL"
  value       = aws_api_gateway_stage.main.invoke_url
}

output "api_gateway_custom_domain" {
  description = "API Gateway custom domain (if configured)"
  value       = var.api_custom_domain != "" && var.api_certificate_arn != "" ? "https://${var.api_custom_domain}" : null
}

output "api_url" {
  description = "Final API URL (custom domain or default)"
  value       = var.api_custom_domain != "" && var.api_certificate_arn != "" ? "https://${var.api_custom_domain}" : aws_api_gateway_stage.main.invoke_url
}

# ==============================================================================
# Deployment Instructions
# ==============================================================================

output "mcp_server_deploy_command" {
  description = "Command to deploy MCP server Lambda function"
  value       = <<-EOT
    # Build Lambda deployment package
    cd openai-apps/miyabi-app/server
    pip install -r requirements.txt mangum -t package/
    cp *.py package/
    cd package && zip -r ../../../dist/lambda/miyabi-api-arm64.zip . && cd ..

    # Deploy with Terraform
    cd ../../deploy/terraform
    terraform apply

    # Or update Lambda directly
    aws lambda update-function-code \
      --function-name ${aws_lambda_function.mcp_server.function_name} \
      --zip-file fileb://../../dist/lambda/miyabi-api-arm64.zip
  EOT
}

output "api_test_command" {
  description = "Command to test API Gateway"
  value       = "Run 'terraform output api_gateway_invoke_url' to get the API URL, then test with: curl -X GET <API_URL>/"
}
