# EC2 Security Module for Miyabi Infrastructure
# Issue: #860 - AWS Security Group設定 - Miyabi API (Port 3002)開放
#
# Manages Security Groups for Miyabi API and related services

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# =============================================================================
# Local Variables
# =============================================================================

locals {
  name_prefix = "miyabi-${var.environment}"

  common_tags = merge(var.tags, {
    Module      = "ec2-security"
    Environment = var.environment
    Project     = "Miyabi"
  })
}

# =============================================================================
# Miyabi API Security Group
# =============================================================================

resource "aws_security_group" "miyabi_api" {
  name        = "${local.name_prefix}-api-sg"
  description = "Security group for Miyabi Management API"
  vpc_id      = var.vpc_id

  # Miyabi Management API (Port 3002)
  ingress {
    description = "Miyabi Management API"
    from_port   = 3002
    to_port     = 3002
    protocol    = "tcp"
    cidr_blocks = var.api_allowed_cidrs
  }

  # Web API (Port 4000)
  ingress {
    description = "Miyabi Web API"
    from_port   = 4000
    to_port     = 4000
    protocol    = "tcp"
    cidr_blocks = var.web_api_allowed_cidrs
  }

  # SSH access
  ingress {
    description = "SSH access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_allowed_cidrs
  }

  # HTTPS
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP (for redirect)
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All outbound traffic
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# =============================================================================
# Agent Worker Security Group
# =============================================================================

resource "aws_security_group" "agent_workers" {
  name        = "${local.name_prefix}-agent-workers-sg"
  description = "Security group for Miyabi Agent workers"
  vpc_id      = var.vpc_id

  # Internal communication between agents
  ingress {
    description = "Internal agent communication"
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    self        = true
  }

  # SSH access for debugging
  ingress {
    description = "SSH access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_allowed_cidrs
  }

  # All outbound traffic (for API calls, git, etc.)
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-agent-workers-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# =============================================================================
# Database Security Group
# =============================================================================

resource "aws_security_group" "database" {
  name        = "${local.name_prefix}-database-sg"
  description = "Security group for Miyabi database"
  vpc_id      = var.vpc_id

  # PostgreSQL from API servers
  ingress {
    description     = "PostgreSQL from API"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.miyabi_api.id]
  }

  # PostgreSQL from Agent workers
  ingress {
    description     = "PostgreSQL from agents"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.agent_workers.id]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-database-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# =============================================================================
# Redis/ElastiCache Security Group
# =============================================================================

resource "aws_security_group" "cache" {
  name        = "${local.name_prefix}-cache-sg"
  description = "Security group for Miyabi cache (Redis/ElastiCache)"
  vpc_id      = var.vpc_id

  # Redis from API servers
  ingress {
    description     = "Redis from API"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.miyabi_api.id]
  }

  # Redis from Agent workers
  ingress {
    description     = "Redis from agents"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.agent_workers.id]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cache-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# =============================================================================
# Additional API Port Rules (Dynamic)
# =============================================================================

resource "aws_security_group_rule" "additional_api_ports" {
  for_each = var.additional_api_ports

  type              = "ingress"
  from_port         = each.value.port
  to_port           = each.value.port
  protocol          = "tcp"
  cidr_blocks       = each.value.cidr_blocks
  description       = each.value.description
  security_group_id = aws_security_group.miyabi_api.id
}

# =============================================================================
# Data Sources
# =============================================================================

data "aws_region" "current" {}
