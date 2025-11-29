# CloudWatch Logs Deployment Guide

Complete guide for deploying CloudWatch Logs monitoring for the Miyabi MCP Server.

## Overview

This deployment sets up comprehensive logging and monitoring for the Miyabi MCP Server running on EC2 (MUGEN):

- **CloudWatch Logs**: Centralized log collection and storage
- **CloudWatch Metrics**: Custom metrics extracted from logs
- **CloudWatch Alarms**: Proactive alerting for errors and performance issues
- **KMS Encryption**: All logs encrypted at rest
- **IAM Roles**: Proper permissions for EC2 instances

## Prerequisites

1. **AWS Account**: Access to AWS account with admin permissions
2. **Terraform**: Version >= 1.5.0 installed
3. **AWS CLI**: Configured with appropriate credentials
4. **EC2 Instance**: MUGEN instance running Miyabi MCP Server

## Deployment Steps

### Step 1: Configure Terraform Variables

Create or update your Terraform variables file:

```bash
cd /home/ubuntu/miyabi-private/deploy/terraform
```

Create `terraform.tfvars`:

```hcl
# AWS Configuration
aws_region     = "ap-northeast-1"
aws_account_id = "YOUR_AWS_ACCOUNT_ID"  # Replace with your account ID
project_name   = "miyabi"

# CloudWatch Logs Configuration
application_log_retention_days = 30
system_log_retention_days      = 7

# Alarm Configuration
alarm_email                   = "your-email@example.com"  # Replace with your email
error_count_threshold         = 10
exception_count_threshold     = 5
slow_request_count_threshold  = 5
log_size_threshold_bytes      = 1073741824  # 1GB

# Tags
tags = {
  Project     = "Miyabi"
  Environment = "Production"
  ManagedBy   = "Terraform"
  Owner       = "DevOps"
}
```

### Step 2: Add CloudWatch Logs Module to Main Terraform

Edit `deploy/terraform/main.tf` and add the CloudWatch Logs module:

```hcl
# Add to your existing main.tf

module "cloudwatch_logs" {
  source = "./modules/cloudwatch-logs"

  project_name   = var.project_name
  aws_region     = var.aws_region
  aws_account_id = var.aws_account_id

  # Log retention
  application_log_retention_days = var.application_log_retention_days
  system_log_retention_days      = var.system_log_retention_days

  # Alarm configuration
  alarm_email                    = var.alarm_email
  error_count_threshold          = var.error_count_threshold
  exception_count_threshold      = var.exception_count_threshold
  slow_request_count_threshold   = var.slow_request_count_threshold
  log_size_threshold_bytes       = var.log_size_threshold_bytes

  # IAM
  create_iam_role = true
  iam_role_name   = "${var.project_name}-ec2-cloudwatch-role"

  tags = var.tags
}

# Output the IAM instance profile ARN
output "ec2_instance_profile_arn" {
  description = "ARN of the IAM instance profile for EC2 instances"
  value       = module.cloudwatch_logs.iam_instance_profile_arn
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = module.cloudwatch_logs.log_group_mcp_server_name
}

output "cloudwatch_sns_topic_arn" {
  description = "ARN of the SNS topic for alarms"
  value       = module.cloudwatch_logs.sns_topic_arn
}
```

### Step 3: Add Variables to `variables.tf`

Edit `deploy/terraform/variables.tf` and add:

```hcl
variable "application_log_retention_days" {
  description = "Retention period for application logs in days"
  type        = number
  default     = 30
}

variable "system_log_retention_days" {
  description = "Retention period for system logs in days"
  type        = number
  default     = 7
}

variable "alarm_email" {
  description = "Email address for alarm notifications"
  type        = string
  default     = ""
}

variable "error_count_threshold" {
  description = "Threshold for error count alarm"
  type        = number
  default     = 10
}

variable "exception_count_threshold" {
  description = "Threshold for exception count alarm"
  type        = number
  default     = 5
}

variable "slow_request_count_threshold" {
  description = "Threshold for slow request count alarm"
  type        = number
  default     = 5
}

variable "log_size_threshold_bytes" {
  description = "Threshold for log group size alarm (bytes per hour)"
  type        = number
  default     = 1073741824
}
```

### Step 4: Initialize and Apply Terraform

```bash
cd /home/ubuntu/miyabi-private/deploy/terraform

# Initialize Terraform (download modules and providers)
terraform init

# Review the planned changes
terraform plan

# Apply the changes
terraform apply
```

When prompted, type `yes` to confirm.

**Expected output:**
```
Apply complete! Resources: 25 added, 0 changed, 0 destroyed.

Outputs:

cloudwatch_log_group_name = "/aws/ec2/miyabi-mcp-server"
cloudwatch_sns_topic_arn = "arn:aws:sns:ap-northeast-1:XXXXXXXXXXXX:miyabi-cloudwatch-alarms"
ec2_instance_profile_arn = "arn:aws:iam::XXXXXXXXXXXX:instance-profile/miyabi-ec2-cloudwatch-profile"
```

### Step 5: Confirm SNS Email Subscription

1. Check your email inbox for a confirmation email from AWS SNS
2. Click the "Confirm subscription" link
3. You should see a confirmation message

### Step 6: Attach IAM Instance Profile to EC2 Instance

**Option A: Via AWS Console**

1. Go to EC2 Console → Instances
2. Select the MUGEN instance
3. Actions → Security → Modify IAM role
4. Select `miyabi-ec2-cloudwatch-profile`
5. Click "Update IAM role"

**Option B: Via AWS CLI**

```bash
# Get instance ID
INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=MUGEN" \
  --query 'Reservations[0].Instances[0].InstanceId' \
  --output text)

# Attach instance profile
aws ec2 associate-iam-instance-profile \
  --instance-id $INSTANCE_ID \
  --iam-instance-profile Name=miyabi-ec2-cloudwatch-profile
```

### Step 7: Install CloudWatch Agent on MUGEN

SSH into the MUGEN instance:

```bash
ssh mugen
```

Run the installation script:

```bash
cd ~/miyabi-private/openai-apps/miyabi-app/cloudwatch
./install-cloudwatch-agent.sh
```

**Expected output:**
```
==============================================
[INFO] CloudWatch Agent Installation
==============================================

[STEP] Step 1: Checking prerequisites...
[INFO] Detected OS: Ubuntu 22.04.3 LTS
[INFO] Prerequisites check passed

[STEP] Step 2: Installing CloudWatch Agent...
[INFO] CloudWatch Agent installed successfully

[STEP] Step 3: Configuring CloudWatch Agent...
[INFO] Configuration applied

[STEP] Step 4: Creating log directories...
[INFO] Log directories created

[STEP] Step 5: Verifying IAM permissions...
[INFO] IAM instance profile detected: miyabi-ec2-cloudwatch-profile

[STEP] Step 6: Starting CloudWatch Agent...
[INFO] CloudWatch Agent started successfully

[STEP] Step 7: Verifying installation...
[INFO] ✅ CloudWatch Agent is running

[STEP] Step 8: Testing log collection...
[INFO] Test log entry created

==============================================
[INFO] ✅ Installation Complete!
==============================================
```

### Step 8: Verify Logs in CloudWatch

Wait 1-2 minutes for logs to appear, then check:

**Option A: AWS Console**

1. Go to CloudWatch Console
2. Navigate to Logs → Log groups
3. Find `/aws/ec2/miyabi-mcp-server`
4. Click on the log group
5. You should see log streams for your instance

**Option B: AWS CLI**

```bash
# List log groups
aws logs describe-log-groups --log-group-name-prefix /aws/ec2/miyabi

# List log streams
aws logs describe-log-streams \
  --log-group-name /aws/ec2/miyabi-mcp-server \
  --max-items 10

# Get recent logs
aws logs tail /aws/ec2/miyabi-mcp-server --follow
```

### Step 9: Verify Metrics and Alarms

**View Metrics:**

```bash
# List custom metrics
aws cloudwatch list-metrics --namespace MiyabiMCP

# Get metric statistics
aws cloudwatch get-metric-statistics \
  --namespace MiyabiMCP \
  --metric-name ErrorCount \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

**View Alarms:**

```bash
# List alarms
aws cloudwatch describe-alarms --alarm-name-prefix miyabi
```

## Post-Deployment Configuration

### Customize Log Patterns

If your application log format is different, update the metric filters in:
```
deploy/terraform/modules/cloudwatch-logs/main.tf
```

Then run:
```bash
terraform apply
```

### Adjust Alarm Thresholds

Edit `deploy/terraform/terraform.tfvars`:

```hcl
error_count_threshold        = 20  # Increase threshold
exception_count_threshold    = 10
slow_request_count_threshold = 10
```

Then run:
```bash
terraform apply
```

### Add Additional Log Files

Edit `openai-apps/miyabi-app/cloudwatch/cloudwatch-agent-config.json`:

```json
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/path/to/your/log/file.log",
            "log_group_name": "/aws/ec2/miyabi-mcp-server",
            "log_stream_name": "{instance_id}/custom-log",
            "retention_in_days": 30
          }
        ]
      }
    }
  }
}
```

Restart CloudWatch Agent:
```bash
ssh mugen
sudo systemctl restart amazon-cloudwatch-agent
```

## Monitoring Dashboard

### Create CloudWatch Dashboard

```bash
aws cloudwatch put-dashboard \
  --dashboard-name Miyabi-MCP-Server \
  --dashboard-body file://dashboard.json
```

Example `dashboard.json`:

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["MiyabiMCP", "ErrorCount"],
          [".", "ExceptionCount"],
          [".", "SlowRequestCount"]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "ap-northeast-1",
        "title": "Application Errors"
      }
    },
    {
      "type": "log",
      "properties": {
        "query": "SOURCE '/aws/ec2/miyabi-mcp-server'\n| fields @timestamp, @message\n| filter @message like /ERROR/\n| sort @timestamp desc\n| limit 20",
        "region": "ap-northeast-1",
        "title": "Recent Errors"
      }
    }
  ]
}
```

## Troubleshooting

### Issue: Logs not appearing

**Solution 1: Check CloudWatch Agent**
```bash
ssh mugen
sudo systemctl status amazon-cloudwatch-agent
sudo tail -f /opt/aws/amazon-cloudwatch-agent/logs/amazon-cloudwatch-agent.log
```

**Solution 2: Verify IAM Permissions**
```bash
aws sts get-caller-identity
aws iam get-instance-profile --instance-profile-name miyabi-ec2-cloudwatch-profile
```

**Solution 3: Check log file exists**
```bash
ssh mugen
ls -la /tmp/miyabi-mcp-v2.log
tail -f /tmp/miyabi-mcp-v2.log
```

### Issue: Alarms not triggering

**Solution 1: Verify SNS subscription**
```bash
aws sns list-subscriptions-by-topic --topic-arn $(terraform output -raw cloudwatch_sns_topic_arn)
```

**Solution 2: Test alarm manually**
```bash
aws cloudwatch set-alarm-state \
  --alarm-name miyabi-high-error-rate \
  --state-value ALARM \
  --state-reason "Testing alarm"
```

**Solution 3: Check alarm history**
```bash
aws cloudwatch describe-alarm-history \
  --alarm-name miyabi-high-error-rate \
  --max-records 10
```

### Issue: High CloudWatch costs

**Solution 1: Reduce log retention**
```hcl
# In terraform.tfvars
application_log_retention_days = 7  # Reduce from 30
```

**Solution 2: Use log sampling**

Edit CloudWatch Agent config to sample logs:
```json
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/tmp/miyabi-mcp-v2.log",
            "log_group_name": "/aws/ec2/miyabi-mcp-server",
            "log_stream_name": "{instance_id}/application",
            "retention_in_days": 7,
            "filters": [
              {
                "type": "exclude",
                "expression": "INFO"
              }
            ]
          }
        ]
      }
    }
  }
}
```

## Cost Estimation

**Monthly costs** (approximate):

- CloudWatch Logs ingestion: $0.50/GB
- CloudWatch Logs storage: $0.03/GB/month
- CloudWatch Metrics: $0.30 per custom metric
- CloudWatch Alarms: $0.10 per alarm
- KMS key: $1/month

**Example scenario:**
- 10GB logs/month: $5.30
- 5 custom metrics: $1.50
- 5 alarms: $0.50
- KMS key: $1.00
- **Total: ~$8.30/month**

## Security Best Practices

1. **Encrypt all logs**: Already enabled via KMS
2. **Restrict IAM permissions**: Follow least-privilege principle
3. **Use VPC endpoints**: Reduce data transfer costs and improve security
4. **Enable MFA delete**: For S3 log archives
5. **Audit CloudWatch access**: Use CloudTrail

## Cleanup (if needed)

To remove all CloudWatch Logs resources:

```bash
# Uninstall CloudWatch Agent
ssh mugen
sudo systemctl stop amazon-cloudwatch-agent
sudo systemctl disable amazon-cloudwatch-agent
sudo apt-get remove -y amazon-cloudwatch-agent

# Destroy Terraform resources
cd /home/ubuntu/miyabi-private/deploy/terraform
terraform destroy
```

## References

- [CloudWatch Logs Documentation](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/)
- [CloudWatch Agent Configuration Reference](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-Agent-Configuration-File-Details.html)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
