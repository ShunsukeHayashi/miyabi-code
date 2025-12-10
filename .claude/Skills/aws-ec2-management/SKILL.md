---
name: aws-ec2-management
description: Manage AWS EC2 instances for Miyabi infrastructure (MUGEN, MAJIN servers). Use when launching, stopping, monitoring, or configuring EC2 instances. Triggers include "EC2 management", "AWS instance", "start/stop server", "MUGEN server", "MAJIN server", or any AWS EC2 operations.
---

# AWS EC2 Management

Manage Miyabi cloud infrastructure on AWS EC2 instances.

## Instance Registry

| Name | Instance ID | Type | Purpose | Region |
|------|-------------|------|---------|--------|
| MUGEN | i-xxx | t3.large | Main development | ap-northeast-1 |
| MAJIN | i-yyy | t3.medium | MCP servers | ap-northeast-1 |

## Quick Commands

### Instance Control
```bash
# Start instance
aws ec2 start-instances --instance-ids i-xxx

# Stop instance
aws ec2 stop-instances --instance-ids i-xxx

# Reboot instance
aws ec2 reboot-instances --instance-ids i-xxx

# Check status
aws ec2 describe-instance-status --instance-ids i-xxx
```

### Instance Information
```bash
# Get instance details
aws ec2 describe-instances --instance-ids i-xxx \
  --query 'Reservations[].Instances[].[InstanceId,State.Name,PublicIpAddress,PrivateIpAddress]' \
  --output table

# Get all running instances
aws ec2 describe-instances \
  --filters "Name=instance-state-name,Values=running" \
  --query 'Reservations[].Instances[].[Tags[?Key==`Name`].Value|[0],InstanceId,InstanceType,PublicIpAddress]' \
  --output table
```

## Connection Methods

### SSH via Tailscale
```bash
# Using Tailscale IP (preferred)
ssh ubuntu@100.x.x.x

# Using hostname
ssh ubuntu@mugen
ssh ubuntu@majin
```

### SSH via Public IP
```bash
# Direct SSH (requires security group)
ssh -i ~/.ssh/miyabi-key.pem ubuntu@<public-ip>
```

### SSM Session Manager
```bash
# No SSH key required
aws ssm start-session --target i-xxx
```

## Security Group Rules

### Development Server (MUGEN)
```
Inbound:
- SSH (22): Tailscale IPs only
- HTTP (80): 0.0.0.0/0
- HTTPS (443): 0.0.0.0/0
- Custom (3000-3010): Tailscale IPs

Outbound:
- All traffic: 0.0.0.0/0
```

### MCP Server (MAJIN)
```
Inbound:
- SSH (22): Tailscale IPs only
- MCP ports (8000-8100): Tailscale IPs

Outbound:
- All traffic: 0.0.0.0/0
```

## Monitoring

### CloudWatch Metrics
```bash
# CPU utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --dimensions Name=InstanceId,Value=i-xxx \
  --start-time $(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 \
  --statistics Average
```

### System Logs
```bash
# Get console output
aws ec2 get-console-output --instance-id i-xxx

# CloudWatch Logs
aws logs tail /var/log/syslog --follow
```

## Cost Management

### Scheduled Start/Stop
```bash
# Using EventBridge (cron)
# Start at 9:00 JST weekdays
aws events put-rule --name "StartMUGEN" \
  --schedule-expression "cron(0 0 ? * MON-FRI *)"

# Stop at 22:00 JST weekdays
aws events put-rule --name "StopMUGEN" \
  --schedule-expression "cron(0 13 ? * MON-FRI *)"
```

### Cost Estimation
```
t3.large (MUGEN):  ~$0.1088/hour = ~$78/month (24/7)
t3.medium (MAJIN): ~$0.0544/hour = ~$39/month (24/7)

With scheduled stop (12h/day): ~50% savings
```

## Backup & Recovery

### Create AMI Backup
```bash
# Create AMI
aws ec2 create-image \
  --instance-id i-xxx \
  --name "MUGEN-backup-$(date +%Y%m%d)" \
  --no-reboot

# List AMIs
aws ec2 describe-images --owners self \
  --query 'Images[].[ImageId,Name,CreationDate]' \
  --output table
```

### EBS Snapshot
```bash
# Create snapshot
aws ec2 create-snapshot \
  --volume-id vol-xxx \
  --description "MUGEN data backup"
```

## Troubleshooting

### Instance Won't Start
```bash
# Check instance state reason
aws ec2 describe-instances --instance-ids i-xxx \
  --query 'Reservations[].Instances[].StateReason'

# Common issues:
# - InsufficientInstanceCapacity
# - VolumeLimitExceeded
# - InvalidSnapshot.NotFound
```

### Connection Issues
```bash
# 1. Check instance is running
aws ec2 describe-instance-status --instance-ids i-xxx

# 2. Check security groups
aws ec2 describe-security-groups --group-ids sg-xxx

# 3. Check network ACLs
aws ec2 describe-network-acls --filters "Name=vpc-id,Values=vpc-xxx"

# 4. Test connectivity
nc -zv <ip> 22
```

### High CPU/Memory
```bash
# SSH into instance
ssh ubuntu@mugen

# Check processes
top -bn1 | head -20
ps aux --sort=-%mem | head -10

# Check memory
free -h

# Check disk
df -h
```

## Best Practices

1. Always use Tailscale for secure access
2. Create AMI before major changes
3. Use tags for cost allocation
4. Monitor CloudWatch alarms
5. Implement scheduled start/stop for cost savings
6. Keep security groups minimal
