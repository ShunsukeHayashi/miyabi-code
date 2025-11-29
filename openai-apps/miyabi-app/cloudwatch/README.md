# CloudWatch Logs for Miyabi MCP Server

This directory contains configuration and scripts for CloudWatch Logs integration with the Miyabi MCP Server.

## Contents

- `cloudwatch-agent-config.json` - CloudWatch Agent configuration
- `install-cloudwatch-agent.sh` - Installation script for CloudWatch Agent
- `DEPLOYMENT_GUIDE.md` - Complete deployment guide

## Quick Start

### 1. Deploy Terraform Infrastructure

```bash
cd /home/ubuntu/miyabi-private/deploy/terraform
terraform init
terraform apply
```

### 2. Install CloudWatch Agent on MUGEN

```bash
ssh mugen
cd ~/miyabi-private/openai-apps/miyabi-app/cloudwatch
./install-cloudwatch-agent.sh
```

### 3. Verify Logs

```bash
# View logs in CloudWatch
aws logs tail /aws/ec2/miyabi-mcp-server --follow

# View metrics
aws cloudwatch list-metrics --namespace MiyabiMCP
```

## Architecture

```
Miyabi MCP Server (EC2)
  ↓ writes to
/tmp/miyabi-mcp-v2.log
  ↓ collected by
CloudWatch Agent
  ↓ sends to
CloudWatch Logs
  ↓ processes with
Metric Filters
  ↓ triggers
CloudWatch Alarms
  ↓ notifies via
SNS (Email)
```

## Features

- **Automatic Log Collection**: Collects logs from Miyabi MCP Server
- **Metric Extraction**: Extracts metrics from logs (errors, exceptions, slow requests)
- **Alarms**: Proactive monitoring with email notifications
- **Encryption**: All logs encrypted with KMS
- **Retention**: Configurable retention periods (30 days for app logs, 7 days for system logs)

## Configuration

### CloudWatch Agent

Edit `cloudwatch-agent-config.json` to customize:
- Log file paths
- Log group names
- Metrics collection interval
- Custom metrics

### Terraform Module

Located at: `deploy/terraform/modules/cloudwatch-logs/`

Key resources:
- CloudWatch Log Groups
- KMS encryption keys
- IAM roles and policies
- Metric filters
- CloudWatch Alarms
- SNS topics

## Monitoring

### View Logs

**AWS Console:**
1. CloudWatch → Logs → Log groups
2. Select `/aws/ec2/miyabi-mcp-server`

**AWS CLI:**
```bash
aws logs tail /aws/ec2/miyabi-mcp-server --follow
```

### View Metrics

**AWS Console:**
1. CloudWatch → Metrics
2. Select namespace `MiyabiMCP`

**AWS CLI:**
```bash
aws cloudwatch list-metrics --namespace MiyabiMCP
```

### View Alarms

**AWS Console:**
1. CloudWatch → Alarms
2. Filter by `miyabi-`

**AWS CLI:**
```bash
aws cloudwatch describe-alarms --alarm-name-prefix miyabi
```

## Alarms

The following alarms are configured:

1. **High Error Rate** - Triggers when >10 errors in 5 minutes
2. **Critical Errors** - Triggers on any CRITICAL log entry
3. **High Exception Rate** - Triggers when >5 exceptions in 5 minutes
4. **Slow Requests** - Triggers when >5 slow requests (>5s) in 5 minutes
5. **Log Group Size** - Triggers when >1GB logs per hour

All alarms send notifications to the configured SNS topic.

## Troubleshooting

### CloudWatch Agent not running

```bash
ssh mugen
sudo systemctl status amazon-cloudwatch-agent
sudo systemctl restart amazon-cloudwatch-agent
```

### Logs not appearing

```bash
# Check agent logs
sudo tail -f /opt/aws/amazon-cloudwatch-agent/logs/amazon-cloudwatch-agent.log

# Verify IAM permissions
aws sts get-caller-identity

# Check log file exists
tail -f /tmp/miyabi-mcp-v2.log
```

### Alarms not triggering

```bash
# Verify SNS subscription
aws sns list-subscriptions

# Test alarm manually
aws cloudwatch set-alarm-state \
  --alarm-name miyabi-high-error-rate \
  --state-value ALARM \
  --state-reason "Test"
```

## Cost Optimization

- Adjust log retention periods in Terraform variables
- Use log filtering to reduce ingestion volume
- Archive old logs to S3 for long-term storage
- Remove unused metric filters and alarms

## Security

- All logs encrypted at rest with KMS
- IAM roles follow least-privilege principle
- SNS topic encrypted
- VPC endpoints for CloudWatch (optional, for private connectivity)

## Documentation

- [CloudWatch Agent Configuration](cloudwatch-agent-config.json)
- [Installation Script](install-cloudwatch-agent.sh)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Terraform Module README](../../deploy/terraform/modules/cloudwatch-logs/README.md)

## Support

For issues or questions:
1. Check the Deployment Guide
2. Review Terraform module README
3. Check CloudWatch Agent logs
4. Create an issue in the repository
