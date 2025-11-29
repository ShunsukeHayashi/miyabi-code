# CloudWatch Logs Module for Miyabi MCP Server

This Terraform module configures CloudWatch Logs for the Miyabi MCP Server running on EC2 instances.

## Features

- **Encrypted Log Storage**: All logs are encrypted at rest using KMS
- **Multiple Log Groups**: Separate log groups for application, system, and CloudWatch Agent logs
- **Automatic Log Retention**: Configurable retention periods for each log group
- **Metric Filters**: Automatically extract metrics from logs (errors, exceptions, slow requests)
- **CloudWatch Alarms**: Proactive monitoring with SNS notifications
- **IAM Roles**: Proper permissions for EC2 instances to write to CloudWatch Logs

## Architecture

```
EC2 Instance (MUGEN)
├── Miyabi MCP Server (Uvicorn)
│   └── Logs → /tmp/miyabi-mcp-v2.log
├── CloudWatch Agent
│   ├── Collects logs from /tmp/miyabi-mcp-v2.log
│   ├── Collects system logs (/var/log/syslog)
│   ├── Collects metrics (CPU, Memory, Disk, Network)
│   └── Sends to CloudWatch Logs
└── CloudWatch Logs
    ├── Log Group: /aws/ec2/miyabi-mcp-server
    │   ├── Stream: {instance_id}/application
    │   ├── Stream: {instance_id}/syslog
    │   └── Stream: {instance_id}/cloud-init
    ├── Metric Filters
    │   ├── ErrorCount
    │   ├── CriticalErrorCount
    │   ├── ExceptionCount
    │   └── SlowRequestCount
    └── CloudWatch Alarms
        ├── High Error Rate
        ├── Critical Errors
        ├── High Exception Rate
        ├── Slow Requests
        └── Log Group Size
```

## Usage

### 1. Add to your Terraform configuration

```hcl
module "cloudwatch_logs" {
  source = "./modules/cloudwatch-logs"

  project_name   = "miyabi"
  aws_region     = "ap-northeast-1"
  aws_account_id = "YOUR_ACCOUNT_ID"

  # Log retention
  application_log_retention_days = 30
  system_log_retention_days      = 7

  # Alarm configuration
  alarm_email                    = "your-email@example.com"
  error_count_threshold          = 10
  exception_count_threshold      = 5
  slow_request_count_threshold   = 5

  # IAM
  create_iam_role = true

  tags = {
    Project     = "Miyabi"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}
```

### 2. Output IAM Instance Profile ARN

```hcl
output "ec2_instance_profile_arn" {
  value = module.cloudwatch_logs.iam_instance_profile_arn
}
```

### 3. Apply Terraform

```bash
cd deploy/terraform
terraform init
terraform plan
terraform apply
```

### 4. Install CloudWatch Agent on EC2

Use the provided installation script:

```bash
# On the EC2 instance (MUGEN)
cd ~/miyabi-private/openai-apps/miyabi-app/cloudwatch
./install-cloudwatch-agent.sh
```

## CloudWatch Agent Configuration

The CloudWatch Agent configuration is stored in:
```
openai-apps/miyabi-app/cloudwatch/cloudwatch-agent-config.json
```

This configuration:
- Collects logs from `/tmp/miyabi-mcp-v2.log`
- Sends logs to CloudWatch Logs with log group `/aws/ec2/miyabi-mcp-server`
- Collects system metrics (CPU, Memory, Disk, Network)
- Sends metrics to CloudWatch Metrics namespace `MiyabiMCP`

## Metric Filters

### ErrorCount
- **Pattern**: `[time, request_id, level=ERROR*, ...]`
- **Description**: Counts ERROR level log entries
- **Unit**: Count

### CriticalErrorCount
- **Pattern**: `[time, request_id, level=CRITICAL*, ...]`
- **Description**: Counts CRITICAL level log entries
- **Unit**: Count

### ExceptionCount
- **Pattern**: `Exception`
- **Description**: Counts occurrences of "Exception" in logs
- **Unit**: Count

### SlowRequestCount
- **Pattern**: `[time, request_id, ..., duration>5000, ...]`
- **Description**: Counts requests taking more than 5 seconds
- **Unit**: Count

## CloudWatch Alarms

### High Error Rate
- **Metric**: ErrorCount
- **Threshold**: 10 errors per 5 minutes
- **Evaluation**: 2 periods
- **Severity**: High

### Critical Error
- **Metric**: CriticalErrorCount
- **Threshold**: > 0 critical errors
- **Evaluation**: 1 period (1 minute)
- **Severity**: Critical

### High Exception Rate
- **Metric**: ExceptionCount
- **Threshold**: 5 exceptions per 5 minutes
- **Evaluation**: 2 periods
- **Severity**: High

### Slow Requests
- **Metric**: SlowRequestCount
- **Threshold**: 5 slow requests (>5s) per 5 minutes
- **Evaluation**: 2 periods
- **Severity**: Medium

### Log Group Size
- **Metric**: IncomingBytes
- **Threshold**: 1GB per hour
- **Evaluation**: 1 period
- **Severity**: Low

## Variables

| Name | Description | Type | Default |
|------|-------------|------|---------|
| `project_name` | Project name for resource naming | string | `"miyabi"` |
| `aws_region` | AWS region | string | `"ap-northeast-1"` |
| `aws_account_id` | AWS account ID | string | **Required** |
| `application_log_retention_days` | Retention period for application logs | number | `30` |
| `system_log_retention_days` | Retention period for system logs | number | `7` |
| `cloudwatch_namespace` | CloudWatch custom metrics namespace | string | `"MiyabiMCP"` |
| `alarm_email` | Email for alarm notifications | string | `""` |
| `error_count_threshold` | Error count threshold (per 5 min) | number | `10` |
| `exception_count_threshold` | Exception count threshold (per 5 min) | number | `5` |
| `slow_request_count_threshold` | Slow request threshold (per 5 min) | number | `5` |
| `log_size_threshold_bytes` | Log size threshold (per hour) | number | `1073741824` (1GB) |
| `create_iam_role` | Create IAM role for EC2 | bool | `true` |

## Outputs

| Name | Description |
|------|-------------|
| `kms_key_arn` | ARN of KMS key for log encryption |
| `log_group_mcp_server_name` | Name of MCP server log group |
| `log_group_mcp_server_arn` | ARN of MCP server log group |
| `sns_topic_arn` | ARN of SNS topic for alarms |
| `iam_role_arn` | ARN of IAM role for EC2 instances |
| `iam_instance_profile_arn` | ARN of IAM instance profile |

## Monitoring

### View Logs in AWS Console

1. Go to CloudWatch → Log groups
2. Select `/aws/ec2/miyabi-mcp-server`
3. View log streams by instance ID

### View Metrics in AWS Console

1. Go to CloudWatch → Metrics
2. Select namespace `MiyabiMCP`
3. View custom metrics (ErrorCount, ExceptionCount, etc.)

### View Alarms in AWS Console

1. Go to CloudWatch → Alarms
2. View all alarms with prefix `miyabi-`

## Troubleshooting

### Logs not appearing in CloudWatch

1. Check CloudWatch Agent status:
```bash
sudo systemctl status amazon-cloudwatch-agent
```

2. Check CloudWatch Agent logs:
```bash
sudo tail -f /opt/aws/amazon-cloudwatch-agent/logs/amazon-cloudwatch-agent.log
```

3. Verify IAM permissions:
```bash
aws sts get-caller-identity
aws logs describe-log-groups --log-group-name-prefix /aws/ec2/miyabi
```

### Metrics not appearing

1. Verify log pattern matches your log format
2. Check metric filter configuration in CloudWatch Console
3. Generate test log entries to verify patterns

### Alarms not triggering

1. Check SNS topic subscription (confirm email subscription)
2. Verify alarm thresholds are appropriate
3. Check alarm evaluation history in CloudWatch Console

## Cost Optimization

- **Log Retention**: Adjust retention periods to reduce storage costs
- **Metric Filters**: Remove unused metric filters
- **Alarms**: Consolidate similar alarms
- **Log Sampling**: Consider sampling high-volume logs

## Security

- All logs are encrypted at rest using KMS
- IAM policies follow least-privilege principle
- SNS topic is encrypted with KMS
- Log groups have restricted access via IAM

## Maintenance

### Update CloudWatch Agent Configuration

```bash
# 1. Edit configuration
nano openai-apps/miyabi-app/cloudwatch/cloudwatch-agent-config.json

# 2. Restart agent
sudo systemctl restart amazon-cloudwatch-agent
```

### Update Metric Filters

Edit `deploy/terraform/modules/cloudwatch-logs/main.tf` and run:
```bash
terraform apply
```

### Update Alarms

Edit threshold variables in your Terraform configuration and run:
```bash
terraform apply
```

## References

- [CloudWatch Logs Documentation](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/WhatIsCloudWatchLogs.html)
- [CloudWatch Agent Documentation](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Install-CloudWatch-Agent.html)
- [CloudWatch Metrics](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/working_with_metrics.html)
- [CloudWatch Alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html)
