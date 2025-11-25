# EC2 Security Module

Issue: #860 - AWS Security Group設定 - Miyabi API (Port 3002)開放

## Overview

This module manages AWS Security Groups for the Miyabi infrastructure, providing secure network access control for API servers, agent workers, databases, and cache services.

## Architecture

```
                    Internet
                        │
                        ▼
              ┌─────────────────┐
              │   Miyabi API    │
              │  Security Group │
              │                 │
              │ Ports: 3002,    │
              │ 4000, 22, 80,   │
              │ 443             │
              └────────┬────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Agent     │ │  Database   │ │   Cache     │
│  Workers    │ │ PostgreSQL  │ │   Redis     │
│  Security   │ │  Security   │ │  Security   │
│   Group     │ │   Group     │ │   Group     │
│             │ │             │ │             │
│ Ports:      │ │ Port: 5432  │ │ Port: 6379  │
│ Internal,22 │ │ (from API/  │ │ (from API/  │
│             │ │  agents)    │ │  agents)    │
└─────────────┘ └─────────────┘ └─────────────┘
```

## Security Groups

### 1. Miyabi API Security Group

Primary security group for the Miyabi Management API server.

| Port | Protocol | Source | Description |
|------|----------|--------|-------------|
| 3002 | TCP | `api_allowed_cidrs` | Miyabi Management API |
| 4000 | TCP | `web_api_allowed_cidrs` | Miyabi Web API |
| 22 | TCP | `ssh_allowed_cidrs` | SSH access |
| 443 | TCP | 0.0.0.0/0 | HTTPS |
| 80 | TCP | 0.0.0.0/0 | HTTP (redirect) |

### 2. Agent Workers Security Group

Security group for Miyabi Agent workers.

| Port | Protocol | Source | Description |
|------|----------|--------|-------------|
| 0-65535 | TCP | self | Internal agent communication |
| 22 | TCP | `ssh_allowed_cidrs` | SSH access for debugging |

### 3. Database Security Group

Security group for PostgreSQL database.

| Port | Protocol | Source | Description |
|------|----------|--------|-------------|
| 5432 | TCP | API SG | PostgreSQL from API servers |
| 5432 | TCP | Agent SG | PostgreSQL from agent workers |

### 4. Cache Security Group

Security group for Redis/ElastiCache.

| Port | Protocol | Source | Description |
|------|----------|--------|-------------|
| 6379 | TCP | API SG | Redis from API servers |
| 6379 | TCP | Agent SG | Redis from agent workers |

## Usage

### Basic Usage

```hcl
module "ec2_security" {
  source = "../../modules/ec2-security"

  environment = "production"
  vpc_id      = aws_vpc.main.id

  # API access control
  api_allowed_cidrs     = ["10.0.0.0/8"]  # Internal only
  web_api_allowed_cidrs = ["0.0.0.0/0"]   # Public
  ssh_allowed_cidrs     = ["203.0.113.0/24"]  # Office IP

  tags = {
    Team = "Platform"
  }
}
```

### With Additional API Ports

```hcl
module "ec2_security" {
  source = "../../modules/ec2-security"

  environment = "production"
  vpc_id      = aws_vpc.main.id

  api_allowed_cidrs = ["10.0.0.0/8"]
  ssh_allowed_cidrs = ["203.0.113.0/24"]

  # Open additional ports
  additional_api_ports = {
    metrics = {
      port        = 9090
      cidr_blocks = ["10.0.0.0/8"]
      description = "Prometheus metrics"
    }
    health = {
      port        = 8080
      cidr_blocks = ["10.0.0.0/8"]
      description = "Health check endpoint"
    }
  }

  tags = {
    Team = "Platform"
  }
}
```

### Attaching to EC2 Instance

```hcl
resource "aws_instance" "miyabi_api" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.medium"

  vpc_security_group_ids = [
    module.ec2_security.miyabi_api_security_group_id
  ]

  tags = {
    Name = "miyabi-api-server"
  }
}
```

### Attaching to RDS

```hcl
resource "aws_db_instance" "miyabi" {
  identifier     = "miyabi-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.medium"

  vpc_security_group_ids = [
    module.ec2_security.database_security_group_id
  ]
}
```

### Attaching to ElastiCache

```hcl
resource "aws_elasticache_cluster" "miyabi" {
  cluster_id      = "miyabi-cache"
  engine          = "redis"
  node_type       = "cache.t3.micro"
  num_cache_nodes = 1

  security_group_ids = [
    module.ec2_security.cache_security_group_id
  ]
}
```

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| environment | Environment name (staging/production) | `string` | - | yes |
| vpc_id | VPC ID for security groups | `string` | - | yes |
| api_allowed_cidrs | CIDRs allowed to access Management API (3002) | `list(string)` | `[]` | no |
| web_api_allowed_cidrs | CIDRs allowed to access Web API (4000) | `list(string)` | `["0.0.0.0/0"]` | no |
| ssh_allowed_cidrs | CIDRs allowed SSH access | `list(string)` | `[]` | no |
| additional_api_ports | Additional API ports to open | `map(object)` | `{}` | no |
| tags | Additional tags | `map(string)` | `{}` | no |

## Outputs

| Name | Description |
|------|-------------|
| miyabi_api_security_group_id | Security group ID for Miyabi API |
| miyabi_api_security_group_arn | Security group ARN for Miyabi API |
| agent_workers_security_group_id | Security group ID for Agent workers |
| agent_workers_security_group_arn | Security group ARN for Agent workers |
| database_security_group_id | Security group ID for database |
| database_security_group_arn | Security group ARN for database |
| cache_security_group_id | Security group ID for cache |
| cache_security_group_arn | Security group ARN for cache |
| security_groups_summary | Summary of all security groups |
| api_ports | List of API ports and their purposes |

## Security Best Practices

### 1. Principle of Least Privilege

- Only open necessary ports
- Restrict CIDR ranges to known IPs
- Use security group references instead of CIDRs where possible

### 2. Management API Protection

```hcl
# GOOD: Restrict to internal network
api_allowed_cidrs = ["10.0.0.0/8"]

# BAD: Open to internet
api_allowed_cidrs = ["0.0.0.0/0"]
```

### 3. SSH Access

```hcl
# GOOD: Restrict to office/VPN IPs
ssh_allowed_cidrs = ["203.0.113.10/32", "198.51.100.0/24"]

# BAD: Open to internet
ssh_allowed_cidrs = ["0.0.0.0/0"]
```

### 4. Database Access

Database security group only allows access from API and Agent security groups (no direct internet access).

### 5. Egress Control

All security groups allow outbound traffic by default. Consider restricting egress in high-security environments.

## Migration from Existing Setup

If migrating from an existing security group setup:

1. Create new security groups with this module
2. Attach new security groups to resources alongside existing ones
3. Test connectivity
4. Remove old security groups

```hcl
# During migration
vpc_security_group_ids = [
  module.ec2_security.miyabi_api_security_group_id,
  aws_security_group.legacy.id  # Remove after testing
]
```

## Troubleshooting

### Cannot connect to API

1. Check `api_allowed_cidrs` includes your IP
2. Verify security group is attached to instance
3. Check NACLs and route tables

### Database connection timeout

1. Verify API/Agent security group is attached to connecting resource
2. Check database security group allows the source security group
3. Verify database is in same VPC

### Agent workers cannot communicate

1. Verify `self` rule is present in agent security group
2. Check agents are using correct security group
3. Verify VPC routing

## Related Issues

- Issue #860: AWS Security Group設定 - Miyabi API (Port 3002)開放
- Issue #883: Phase 3 - 200-Agent Live Experiment
