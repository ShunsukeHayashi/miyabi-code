# ==============================================================================
# VPC for Lambda Functions - Miyabi Infrastructure
# ==============================================================================
# Purpose: Secure VPC environment for Lambda functions
# Architecture: Multi-AZ (3 AZs) with public/private subnets
# Cost: ~$120-160/month (NAT Gateway x3 + endpoints)
# Security: Isolated private subnets, NAT for internet access, VPC endpoints for AWS services

# ==============================================================================
# Data Sources - Availability Zones
# ==============================================================================

data "aws_availability_zones" "available" {
  state = "available"
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

# ==============================================================================
# VPC
# ==============================================================================

resource "aws_vpc" "lambda" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.tags, {
    Name = "${var.project_name}-lambda-vpc"
  })
}

# ==============================================================================
# Internet Gateway
# ==============================================================================

resource "aws_internet_gateway" "lambda" {
  vpc_id = aws_vpc.lambda.id

  tags = merge(var.tags, {
    Name = "${var.project_name}-lambda-igw"
  })
}

# ==============================================================================
# Public Subnets (for NAT Gateways)
# ==============================================================================

resource "aws_subnet" "public" {
  count = var.enable_multi_az_nat ? 3 : 1

  vpc_id                  = aws_vpc.lambda.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index + 1)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(var.tags, {
    Name = "${var.project_name}-public-subnet-${count.index + 1}"
    Tier = "Public"
    AZ   = data.aws_availability_zones.available.names[count.index]
  })
}

# ==============================================================================
# Private Subnets (for Lambda functions)
# ==============================================================================

resource "aws_subnet" "private" {
  count = 3

  vpc_id            = aws_vpc.lambda.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 11)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(var.tags, {
    Name = "${var.project_name}-private-subnet-${count.index + 1}"
    Tier = "Private"
    AZ   = data.aws_availability_zones.available.names[count.index]
  })
}

# ==============================================================================
# Elastic IPs for NAT Gateways
# ==============================================================================

resource "aws_eip" "nat" {
  count = var.enable_multi_az_nat ? 3 : 1

  domain = "vpc"

  tags = merge(var.tags, {
    Name = "${var.project_name}-nat-eip-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.lambda]
}

# ==============================================================================
# NAT Gateways
# ==============================================================================
# Cost: $0.045/hour (~$32/month) per NAT Gateway
# Multi-AZ: 3 NAT Gateways = ~$96/month (high availability)
# Single NAT: 1 NAT Gateway = ~$32/month (cost savings, lower availability)

resource "aws_nat_gateway" "lambda" {
  count = var.enable_multi_az_nat ? 3 : 1

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = merge(var.tags, {
    Name = "${var.project_name}-nat-gateway-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.lambda]
}

# ==============================================================================
# Route Tables - Public
# ==============================================================================

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.lambda.id

  tags = merge(var.tags, {
    Name = "${var.project_name}-public-route-table"
  })
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.lambda.id
}

resource "aws_route_table_association" "public" {
  count = var.enable_multi_az_nat ? 3 : 1

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ==============================================================================
# Route Tables - Private (one per AZ for multi-AZ NAT)
# ==============================================================================

resource "aws_route_table" "private" {
  count = 3

  vpc_id = aws_vpc.lambda.id

  tags = merge(var.tags, {
    Name = "${var.project_name}-private-route-table-${count.index + 1}"
    AZ   = data.aws_availability_zones.available.names[count.index]
  })
}

resource "aws_route" "private_nat" {
  count = 3

  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = var.enable_multi_az_nat ? aws_nat_gateway.lambda[count.index].id : aws_nat_gateway.lambda[0].id
}

resource "aws_route_table_association" "private" {
  count = 3

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# ==============================================================================
# VPC Flow Logs (Security & Monitoring)
# ==============================================================================

resource "aws_flow_log" "lambda_vpc" {
  count = var.enable_vpc_flow_logs ? 1 : 0

  vpc_id          = aws_vpc.lambda.id
  traffic_type    = "ALL"
  iam_role_arn    = aws_iam_role.vpc_flow_logs[0].arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs[0].arn

  tags = merge(var.tags, {
    Name = "${var.project_name}-vpc-flow-logs"
  })
}

resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  count = var.enable_vpc_flow_logs ? 1 : 0

  name              = "/aws/vpc/${var.project_name}-lambda-vpc"
  retention_in_days = 7

  tags = merge(var.tags, {
    Name = "${var.project_name}-vpc-flow-logs"
  })
}

resource "aws_iam_role" "vpc_flow_logs" {
  count = var.enable_vpc_flow_logs ? 1 : 0

  name = "${var.project_name}-vpc-flow-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(var.tags, {
    Name = "${var.project_name}-vpc-flow-logs-role"
  })
}

resource "aws_iam_role_policy" "vpc_flow_logs" {
  count = var.enable_vpc_flow_logs ? 1 : 0

  name = "${var.project_name}-vpc-flow-logs-policy"
  role = aws_iam_role.vpc_flow_logs[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

# ==============================================================================
# Outputs
# ==============================================================================

output "vpc_id" {
  description = "VPC ID for Lambda functions"
  value       = aws_vpc.lambda.id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = aws_vpc.lambda.cidr_block
}

output "public_subnet_ids" {
  description = "Public subnet IDs (NAT Gateway subnets)"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs (Lambda subnets)"
  value       = aws_subnet.private[*].id
}

output "nat_gateway_ids" {
  description = "NAT Gateway IDs"
  value       = aws_nat_gateway.lambda[*].id
}

output "nat_gateway_ips" {
  description = "NAT Gateway Elastic IPs"
  value       = aws_eip.nat[*].public_ip
}
