# ==============================================================================
# Security Groups for Lambda Functions - Miyabi Infrastructure
# ==============================================================================
# Purpose: Network security controls for Lambda functions in VPC
# Architecture: Principle of Least Privilege (PoLP)
# - Lambda SG: Minimal ingress, controlled egress
# - VPC Endpoint SG: HTTPS from Lambda SG only

# ==============================================================================
# Security Group - Lambda Functions (Default)
# ==============================================================================

resource "aws_security_group" "lambda_default" {
  name_prefix = "${var.project_name}-lambda-default-"
  description = "Default security group for Lambda functions"
  vpc_id      = aws_vpc.lambda.id

  tags = merge(var.tags, {
    Name = "${var.project_name}-lambda-default-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Egress Rules - Lambda Default SG
# Allow all outbound traffic (Lambda initiates all connections)

resource "aws_vpc_security_group_egress_rule" "lambda_default_https" {
  security_group_id = aws_security_group.lambda_default.id
  description       = "HTTPS to internet (API calls, package downloads)"

  ip_protocol = "tcp"
  from_port   = 443
  to_port     = 443
  cidr_ipv4   = "0.0.0.0/0"

  tags = {
    Name = "lambda-default-egress-https"
  }
}

resource "aws_vpc_security_group_egress_rule" "lambda_default_http" {
  security_group_id = aws_security_group.lambda_default.id
  description       = "HTTP to internet (package downloads, redirects)"

  ip_protocol = "tcp"
  from_port   = 80
  to_port     = 80
  cidr_ipv4   = "0.0.0.0/0"

  tags = {
    Name = "lambda-default-egress-http"
  }
}

resource "aws_vpc_security_group_egress_rule" "lambda_default_dns_tcp" {
  security_group_id = aws_security_group.lambda_default.id
  description       = "DNS queries (TCP)"

  ip_protocol = "tcp"
  from_port   = 53
  to_port     = 53
  cidr_ipv4   = "0.0.0.0/0"

  tags = {
    Name = "lambda-default-egress-dns-tcp"
  }
}

resource "aws_vpc_security_group_egress_rule" "lambda_default_dns_udp" {
  security_group_id = aws_security_group.lambda_default.id
  description       = "DNS queries (UDP)"

  ip_protocol = "udp"
  from_port   = 53
  to_port     = 53
  cidr_ipv4   = "0.0.0.0/0"

  tags = {
    Name = "lambda-default-egress-dns-udp"
  }
}

# ==============================================================================
# Security Group - VPC Endpoints
# ==============================================================================

resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "${var.project_name}-vpc-endpoints-"
  description = "Security group for VPC endpoints (S3, Secrets Manager, etc.)"
  vpc_id      = aws_vpc.lambda.id

  tags = merge(var.tags, {
    Name = "${var.project_name}-vpc-endpoints-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Ingress Rules - VPC Endpoint SG
# Allow HTTPS from Lambda security groups only

resource "aws_vpc_security_group_ingress_rule" "vpc_endpoints_https_from_lambda" {
  security_group_id = aws_security_group.vpc_endpoints.id
  description       = "HTTPS from Lambda functions"

  ip_protocol                  = "tcp"
  from_port                    = 443
  to_port                      = 443
  referenced_security_group_id = aws_security_group.lambda_default.id

  tags = {
    Name = "vpc-endpoints-ingress-https-lambda"
  }
}

# ==============================================================================
# Security Group - Database (Future)
# ==============================================================================
# Uncomment when RDS/Aurora is deployed

# resource "aws_security_group" "database" {
#   name_prefix = "${var.project_name}-database-"
#   description = "Security group for RDS/Aurora databases"
#   vpc_id      = aws_vpc.lambda.id
#
#   tags = merge(var.tags, {
#     Name = "${var.project_name}-database-sg"
#   })
#
#   lifecycle {
#     create_before_destroy = true
#   }
# }
#
# resource "aws_vpc_security_group_ingress_rule" "database_postgres_from_lambda" {
#   security_group_id = aws_security_group.database.id
#   description       = "PostgreSQL from Lambda functions"
#
#   ip_protocol                  = "tcp"
#   from_port                    = 5432
#   to_port                      = 5432
#   referenced_security_group_id = aws_security_group.lambda_default.id
#
#   tags = {
#     Name = "database-ingress-postgres-lambda"
#   }
# }

# ==============================================================================
# Security Group - ElastiCache (Future)
# ==============================================================================
# Uncomment when Redis/Memcached is deployed

# resource "aws_security_group" "cache" {
#   name_prefix = "${var.project_name}-cache-"
#   description = "Security group for ElastiCache (Redis/Memcached)"
#   vpc_id      = aws_vpc.lambda.id
#
#   tags = merge(var.tags, {
#     Name = "${var.project_name}-cache-sg"
#   })
#
#   lifecycle {
#     create_before_destroy = true
#   }
# }
#
# resource "aws_vpc_security_group_ingress_rule" "cache_redis_from_lambda" {
#   security_group_id = aws_security_group.cache.id
#   description       = "Redis from Lambda functions"
#
#   ip_protocol                  = "tcp"
#   from_port                    = 6379
#   to_port                      = 6379
#   referenced_security_group_id = aws_security_group.lambda_default.id
#
#   tags = {
#     Name = "cache-ingress-redis-lambda"
#   }
# }

# ==============================================================================
# Security Group - Lambda to Lambda Communication
# ==============================================================================
# Allows Lambda functions to communicate with each other (if needed)

resource "aws_vpc_security_group_ingress_rule" "lambda_self_reference" {
  security_group_id = aws_security_group.lambda_default.id
  description       = "Allow Lambda-to-Lambda communication"

  ip_protocol                  = "-1" # All protocols
  referenced_security_group_id = aws_security_group.lambda_default.id

  tags = {
    Name = "lambda-ingress-self"
  }
}

# ==============================================================================
# Outputs
# ==============================================================================

output "lambda_default_security_group_id" {
  description = "Default security group ID for Lambda functions"
  value       = aws_security_group.lambda_default.id
}

output "lambda_default_security_group_arn" {
  description = "Default security group ARN for Lambda functions"
  value       = aws_security_group.lambda_default.arn
}

output "vpc_endpoints_security_group_id" {
  description = "Security group ID for VPC endpoints"
  value       = aws_security_group.vpc_endpoints.id
}

output "vpc_endpoints_security_group_arn" {
  description = "Security group ARN for VPC endpoints"
  value       = aws_security_group.vpc_endpoints.arn
}
