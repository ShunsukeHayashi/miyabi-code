# Task Queue Module

Terraform module for creating SQS queues for the Miyabi 200-Agent experiment.

## Overview

This module creates:
- **Main Task Queue**: For distributing agent tasks
- **High Priority Queue**: For urgent/critical tasks
- **Results Queue**: For collecting agent execution results
- **Dead Letter Queue**: For failed messages
- **FIFO Queue** (optional): For ordered task execution

## Usage

```hcl
module "task_queue" {
  source = "../../modules/task-queue"

  environment = "production"

  # Optional settings
  visibility_timeout          = 300  # 5 minutes
  max_retry_count             = 3
  enable_fifo_queue           = false
  queue_depth_alarm_threshold = 500
  max_message_age_seconds     = 3600
  alarm_sns_topic_arn         = aws_sns_topic.alerts.arn

  tags = {
    Team = "Platform"
  }
}
```

## Queue Architecture

```
                    ┌─────────────────────┐
                    │   Task Producers    │
                    │  (Orchestrator)     │
                    └──────────┬──────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
            ▼                  ▼                  ▼
    ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
    │ High Priority │  │  Main Queue   │  │  FIFO Queue   │
    │    Queue      │  │               │  │  (optional)   │
    └───────┬───────┘  └───────┬───────┘  └───────┬───────┘
            │                  │                  │
            └──────────────────┼──────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Task Consumers    │
                    │     (Agents)        │
                    └──────────┬──────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
            ▼                  ▼                  ▼
    ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
    │  Success →    │  │   Error →     │  │   Retry →     │
    │ Results Queue │  │   DLQ         │  │ Main Queue    │
    └───────────────┘  └───────────────┘  └───────────────┘
```

## Message Format

### Task Message

```json
{
  "task_id": "task-uuid-here",
  "agent_type": "CodeGenAgent",
  "priority": "high",
  "payload": {
    "issue_number": 123,
    "context": "Fix authentication bug"
  },
  "metadata": {
    "worktree_id": "wt-001",
    "created_at": "2025-11-26T00:00:00Z",
    "timeout_seconds": 300
  }
}
```

### Result Message

```json
{
  "task_id": "task-uuid-here",
  "status": "success|failed",
  "duration_ms": 12500,
  "output": { ... },
  "error": null,
  "metrics": {
    "lines_changed": 45,
    "tests_added": 3
  }
}
```

## Monitoring

The module creates CloudWatch alarms for:
- Queue depth exceeding threshold
- Messages in dead letter queue
- Message age exceeding threshold

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| environment | Environment name | string | - | yes |
| visibility_timeout | Message visibility timeout (seconds) | number | 300 | no |
| max_retry_count | Max retries before DLQ | number | 3 | no |
| enable_fifo_queue | Create FIFO queue | bool | false | no |
| queue_depth_alarm_threshold | Queue depth alarm threshold | number | 500 | no |
| max_message_age_seconds | Max message age alarm | number | 3600 | no |
| alarm_sns_topic_arn | SNS topic for alarms | string | "" | no |
| tags | Additional tags | map(string) | {} | no |

## Outputs

| Name | Description |
|------|-------------|
| agent_tasks_queue_url | Main task queue URL |
| agent_tasks_queue_arn | Main task queue ARN |
| high_priority_queue_url | High priority queue URL |
| agent_results_queue_url | Results queue URL |
| dlq_queue_url | Dead letter queue URL |
| queue_access_policy_arn | IAM policy ARN for queue access |
| queue_urls | Map of all queue URLs |
| queue_arns | Map of all queue ARNs |

## Cost Estimation

| Environment | Monthly Cost |
|-------------|--------------|
| Staging | ~$5 |
| Production | ~$20-50 |

*Based on 1M messages/month, actual costs depend on usage.

## Security

- All queues use server-side encryption (SSE-SQS)
- IAM policy follows least privilege
- Dead letter queue for message retention
- No public access

## Related Issues

- Issue #883: Phase 3 - 200-Agent Live Experiment
