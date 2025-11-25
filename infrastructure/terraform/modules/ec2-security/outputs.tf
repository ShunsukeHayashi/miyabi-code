# EC2 Security Module Outputs
# Issue: #860 - AWS Security Group設定 - Miyabi API (Port 3002)開放

# =============================================================================
# Security Group IDs
# =============================================================================

output "miyabi_api_security_group_id" {
  description = "Security group ID for Miyabi API"
  value       = aws_security_group.miyabi_api.id
}

output "miyabi_api_security_group_arn" {
  description = "Security group ARN for Miyabi API"
  value       = aws_security_group.miyabi_api.arn
}

output "agent_workers_security_group_id" {
  description = "Security group ID for Agent workers"
  value       = aws_security_group.agent_workers.id
}

output "agent_workers_security_group_arn" {
  description = "Security group ARN for Agent workers"
  value       = aws_security_group.agent_workers.arn
}

output "database_security_group_id" {
  description = "Security group ID for database"
  value       = aws_security_group.database.id
}

output "database_security_group_arn" {
  description = "Security group ARN for database"
  value       = aws_security_group.database.arn
}

output "cache_security_group_id" {
  description = "Security group ID for cache (Redis/ElastiCache)"
  value       = aws_security_group.cache.id
}

output "cache_security_group_arn" {
  description = "Security group ARN for cache (Redis/ElastiCache)"
  value       = aws_security_group.cache.arn
}

# =============================================================================
# Security Group Names
# =============================================================================

output "miyabi_api_security_group_name" {
  description = "Security group name for Miyabi API"
  value       = aws_security_group.miyabi_api.name
}

output "agent_workers_security_group_name" {
  description = "Security group name for Agent workers"
  value       = aws_security_group.agent_workers.name
}

output "database_security_group_name" {
  description = "Security group name for database"
  value       = aws_security_group.database.name
}

output "cache_security_group_name" {
  description = "Security group name for cache"
  value       = aws_security_group.cache.name
}

# =============================================================================
# Summary
# =============================================================================

output "security_groups_summary" {
  description = "Summary of all security groups"
  value = {
    miyabi_api = {
      id   = aws_security_group.miyabi_api.id
      name = aws_security_group.miyabi_api.name
      ports = {
        management_api = 3002
        web_api        = 4000
        ssh            = 22
        https          = 443
        http           = 80
      }
    }
    agent_workers = {
      id   = aws_security_group.agent_workers.id
      name = aws_security_group.agent_workers.name
      ports = {
        internal = "0-65535 (self)"
        ssh      = 22
      }
    }
    database = {
      id   = aws_security_group.database.id
      name = aws_security_group.database.name
      ports = {
        postgresql = 5432
      }
    }
    cache = {
      id   = aws_security_group.cache.id
      name = aws_security_group.cache.name
      ports = {
        redis = 6379
      }
    }
  }
}

# =============================================================================
# Port Information
# =============================================================================

output "api_ports" {
  description = "List of API ports and their purposes"
  value = {
    "3002" = "Miyabi Management API"
    "4000" = "Miyabi Web API"
    "22"   = "SSH Access"
    "443"  = "HTTPS"
    "80"   = "HTTP (redirect)"
  }
}
