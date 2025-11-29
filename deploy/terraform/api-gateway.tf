# ==============================================================================
# API Gateway REST API for Miyabi MCP Server
# ==============================================================================

# API Gateway REST API
resource "aws_api_gateway_rest_api" "mcp_api" {
  name        = "${var.project_name}-mcp-api"
  description = "Miyabi MCP Server API Gateway"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name = "${var.project_name}-mcp-api"
  }
}

# API Gateway Resource (proxy for all paths)
resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.mcp_api.id
  parent_id   = aws_api_gateway_rest_api.mcp_api.root_resource_id
  path_part   = "{proxy+}"
}

# API Gateway Method (ANY for all HTTP methods)
resource "aws_api_gateway_method" "proxy_any" {
  rest_api_id   = aws_api_gateway_rest_api.mcp_api.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

# API Gateway Root Method (for root path "/")
resource "aws_api_gateway_method" "root_any" {
  rest_api_id   = aws_api_gateway_rest_api.mcp_api.id
  resource_id   = aws_api_gateway_rest_api.mcp_api.root_resource_id
  http_method   = "ANY"
  authorization = "NONE"
}

# ==============================================================================
# Lambda Integration
# ==============================================================================

# Lambda Integration for proxy paths
resource "aws_api_gateway_integration" "lambda_proxy" {
  rest_api_id             = aws_api_gateway_rest_api.mcp_api.id
  resource_id             = aws_api_gateway_resource.proxy.id
  http_method             = aws_api_gateway_method.proxy_any.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.mcp_server.invoke_arn
}

# Lambda Integration for root path
resource "aws_api_gateway_integration" "lambda_root" {
  rest_api_id             = aws_api_gateway_rest_api.mcp_api.id
  resource_id             = aws_api_gateway_rest_api.mcp_api.root_resource_id
  http_method             = aws_api_gateway_method.root_any.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.mcp_server.invoke_arn
}

# ==============================================================================
# Lambda Permissions
# ==============================================================================

# Lambda permission for API Gateway to invoke Lambda (proxy paths)
resource "aws_lambda_permission" "api_gateway_proxy" {
  statement_id  = "AllowAPIGatewayInvokeProxy"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.mcp_server.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.mcp_api.execution_arn}/*/*"
}

# Lambda permission for API Gateway to invoke Lambda (root path)
resource "aws_lambda_permission" "api_gateway_root" {
  statement_id  = "AllowAPIGatewayInvokeRoot"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.mcp_server.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.mcp_api.execution_arn}/*/"
}

# ==============================================================================
# API Gateway Deployment
# ==============================================================================

# API Gateway Deployment
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.mcp_api.id

  # Force new deployment on any change
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.proxy.id,
      aws_api_gateway_method.proxy_any.id,
      aws_api_gateway_method.root_any.id,
      aws_api_gateway_integration.lambda_proxy.id,
      aws_api_gateway_integration.lambda_root.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.lambda_proxy,
    aws_api_gateway_integration.lambda_root,
  ]
}

# API Gateway Stage
resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.mcp_api.id
  stage_name    = var.api_gateway_stage_name

  # Enable CloudWatch Logs
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      caller         = "$context.identity.caller"
      user           = "$context.identity.user"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = {
    Name = "${var.project_name}-api-${var.api_gateway_stage_name}"
  }
}

# API Gateway Method Settings (Throttling)
resource "aws_api_gateway_method_settings" "all" {
  rest_api_id = aws_api_gateway_rest_api.mcp_api.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  method_path = "*/*"

  settings {
    throttling_burst_limit = var.api_gateway_burst_limit
    throttling_rate_limit  = var.api_gateway_rate_limit
    logging_level          = "INFO"
    data_trace_enabled     = true
    metrics_enabled        = true
  }
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project_name}-mcp-api"
  retention_in_days = 7

  tags = {
    Name = "${var.project_name}-api-gateway-logs"
  }
}

# ==============================================================================
# Custom Domain (Optional)
# ==============================================================================

# Custom Domain Name for API Gateway
resource "aws_api_gateway_domain_name" "main" {
  count           = var.api_custom_domain != "" && var.api_certificate_arn != "" ? 1 : 0
  domain_name     = var.api_custom_domain
  certificate_arn = var.api_certificate_arn

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name = "${var.project_name}-api-domain"
  }
}

# Base Path Mapping
resource "aws_api_gateway_base_path_mapping" "main" {
  count       = var.api_custom_domain != "" && var.api_certificate_arn != "" ? 1 : 0
  api_id      = aws_api_gateway_rest_api.mcp_api.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  domain_name = aws_api_gateway_domain_name.main[0].domain_name
}

# ==============================================================================
# API Gateway Usage Plan (Optional - for rate limiting)
# ==============================================================================

resource "aws_api_gateway_usage_plan" "main" {
  count = var.enable_api_usage_plan ? 1 : 0
  name  = "${var.project_name}-usage-plan"

  api_stages {
    api_id = aws_api_gateway_rest_api.mcp_api.id
    stage  = aws_api_gateway_stage.main.stage_name
  }

  quota_settings {
    limit  = var.api_quota_limit
    period = "DAY"
  }

  throttle_settings {
    burst_limit = var.api_gateway_burst_limit
    rate_limit  = var.api_gateway_rate_limit
  }

  tags = {
    Name = "${var.project_name}-usage-plan"
  }
}
