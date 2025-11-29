# Monitoring Module

Comprehensive CloudWatch monitoring and alerting module for Miyabi infrastructure.

## Features

### Error Rate Monitoring
- **API Gateway Error Rates**: 4XX and 5XX error rate percentages
- **ALB Error Rates**: Target 4XX and 5XX error rate percentages
- **Lambda Error Rates**: Function-level error rate percentages

### Latency Monitoring
- **API Gateway**: P50, P95, and P99 latency metrics
- **ALB**: P95 and P99 target response time metrics
- **Lambda**: P95 duration metrics per function

### Resource Monitoring
- **ECS/Fargate**:
  - CPU utilization
  - Memory utilization
  - Running task count
- **RDS**:
  - CPU utilization
  - Database connections
  - Free storage space
- **Lambda**:
  - Throttles
  - Concurrent executions
  - Invocations and errors

### Advanced Features
- **Composite Alarms**: Combined failure scenarios
  - Critical system health (high errors + high latency)
  - Service degradation (high latency OR errors)
  - Resource exhaustion (high CPU AND memory)
- **Anomaly Detection**: Machine learning-based anomaly detection
  - API request count anomalies
  - ALB response time anomalies

### Alerting
- SNS topic for alarm notifications
- Email subscriptions
- Alarm actions (trigger and recovery)

### Visualization
- CloudWatch dashboard with key metrics
- Multiple widgets for different services

## Usage

```hcl
module "monitoring" {
  source = "../modules/monitoring"

  project_name = "miyabi"
  environment  = "prod"
  aws_region   = "ap-northeast-1"

  # Email notifications
  alarm_email_endpoints = [
    "ops-team@example.com",
    "oncall@example.com"
  ]

  # API Gateway monitoring
  api_name                       = "miyabi-api"
  api_5xx_threshold              = 10
  api_5xx_error_rate_threshold   = 5    # 5% error rate
  api_4xx_error_rate_threshold   = 20   # 20% error rate
  api_latency_threshold_ms       = 3000 # P95
  api_latency_p50_threshold_ms   = 1000 # P50
  api_latency_p99_threshold_ms   = 5000 # P99

  # ECS/Fargate monitoring
  ecs_cluster_name     = "miyabi-cluster-prod"
  ecs_service_name     = "miyabi-app-service"
  ecs_cpu_threshold    = 80  # 80% CPU
  ecs_memory_threshold = 80  # 80% memory
  ecs_min_task_count   = 2   # At least 2 tasks

  # ALB monitoring
  alb_name                       = "app/miyabi-alb-prod/abc123"
  alb_target_group_name          = "targetgroup/miyabi-tg-prod/xyz456"
  alb_response_time_threshold_ms = 2000 # 2 seconds P95
  alb_5xx_error_rate_threshold   = 5    # 5% error rate
  alb_4xx_error_rate_threshold   = 20   # 20% error rate
  alb_min_healthy_hosts          = 1

  # Lambda monitoring
  lambda_function_names = [
    "miyabi-api-handler",
    "miyabi-agent-processor",
    "miyabi-orchestrator"
  ]
  lambda_error_threshold                 = 5   # Absolute error count
  lambda_error_rate_threshold            = 5   # 5% error rate
  lambda_duration_threshold_ms           = 10000
  lambda_throttle_threshold              = 10
  lambda_concurrent_executions_threshold = 100

  # RDS monitoring (optional)
  rds_instance_identifier    = "miyabi-db-prod"
  rds_cpu_threshold          = 80
  rds_connections_threshold  = 100
  rds_storage_threshold_bytes = 5368709120 # 5GB

  # Advanced features
  enable_composite_alarms  = true
  enable_anomaly_detection = true

  # Logging
  log_retention_days = 30

  tags = {
    Terraform   = "true"
    Environment = "prod"
    Team        = "platform"
  }
}
```

## Alarm Thresholds

### Default Thresholds

| Alarm Type | Default | Recommended Range | Notes |
|------------|---------|-------------------|-------|
| API 5XX Error Rate | 5% | 1-10% | Lower for critical APIs |
| API 4XX Error Rate | 20% | 10-30% | Higher tolerance for user errors |
| API P50 Latency | 1000ms | 500-2000ms | Median response time |
| API P95 Latency | 3000ms | 1000-5000ms | 95th percentile |
| API P99 Latency | 5000ms | 2000-10000ms | 99th percentile |
| ALB 5XX Error Rate | 5% | 1-10% | Server errors |
| ALB 4XX Error Rate | 20% | 10-30% | Client errors |
| ALB P95 Response Time | 2000ms | 1000-3000ms | Target response time |
| ALB P99 Response Time | 3000ms | 1500-5000ms | 1.5x P95 default |
| ECS CPU Utilization | 80% | 60-85% | Leave headroom for bursts |
| ECS Memory Utilization | 80% | 60-85% | Prevent OOM kills |
| Lambda Error Rate | 5% | 1-10% | Function-level errors |
| Lambda Throttles | 10 | 5-50 | Concurrent execution limits |
| RDS CPU | 80% | 60-90% | Database load |
| RDS Connections | 100 | 50-200 | Connection pool size |

### Threshold Tuning

**Production environments**: Use stricter thresholds (lower error rates, lower latencies)

```hcl
api_5xx_error_rate_threshold = 1    # 1% instead of 5%
api_latency_threshold_ms     = 2000 # 2s instead of 3s
```

**Development environments**: Use relaxed thresholds

```hcl
api_5xx_error_rate_threshold = 10   # 10% instead of 5%
enable_composite_alarms      = false
enable_anomaly_detection     = false
```

## Alarm Types

### Metric Alarms

Standard CloudWatch metric alarms with configurable thresholds.

**Evaluation periods**: Number of consecutive periods threshold must be breached
- API/ALB errors: 2 periods (10 minutes at 5min intervals)
- Latency: 3 periods (15 minutes)
- Resource utilization: 2-3 periods

### Composite Alarms

Complex alarms combining multiple conditions:

1. **Critical System Health**: Triggers when BOTH error rate AND latency are high
   ```
   API 5XX errors > threshold AND API latency > threshold
   ```

2. **Service Degradation**: Triggers when EITHER condition is met
   ```
   ALB response time > threshold OR ALB 5XX errors > threshold
   ```

3. **Resource Exhaustion**: Triggers when resources are critically low
   ```
   ECS CPU > threshold AND ECS memory > threshold
   ```

### Anomaly Detection

Machine learning-based alarms that learn normal patterns:

- **API Request Anomaly**: Detects unusual traffic patterns (DDoS, outages)
- **ALB Response Time Anomaly**: Detects performance degradation

Anomaly detection uses a 2-sigma band (99.7% confidence).

## Outputs

### Individual Alarm ARNs

```hcl
module.monitoring.api_5xx_error_rate_alarm_arn
module.monitoring.api_latency_alarm_arn
module.monitoring.ecs_cpu_alarm_arn
module.monitoring.alb_response_time_p95_alarm_arn
```

### Composite Alarm ARNs

```hcl
module.monitoring.critical_system_health_alarm_arn
module.monitoring.service_degradation_alarm_arn
module.monitoring.resource_exhaustion_alarm_arn
```

### Summary Output

```hcl
module.monitoring.alarm_summary
```

Returns a structured object with all alarm names and dashboard URL.

## CloudWatch Dashboard

The module creates a dashboard with the following widgets:

1. **API Response Time (P95)**: Time series
2. **API Request Count**: Time series
3. **API Errors (4XX/5XX)**: Stacked area
4. **Lambda Invocations**: Time series per function
5. **RDS Metrics**: CPU and connections (if RDS enabled)
6. **ECS Metrics**: CPU and memory (if ECS enabled)
7. **ALB Metrics**: Response time and error rates (if ALB enabled)

Access: `https://console.aws.amazon.com/cloudwatch/home?region=<region>#dashboards:name=<project>-<env>`

## SNS Topic

The module creates an SNS topic for alarm notifications:

```hcl
module.monitoring.sns_topic_arn
```

**Email subscriptions**: Configured via `alarm_email_endpoints` variable

**Additional subscriptions**: Can be added after deployment:
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:region:account:miyabi-prod-alarms \
  --protocol https \
  --notification-endpoint https://hooks.slack.com/services/xxx
```

## Log Groups

Creates CloudWatch log groups with retention:

- `/miyabi/{environment}/api` - API Gateway logs
- `/miyabi/{environment}/agents` - Agent logs
- `/miyabi/{environment}/orchestrator` - Orchestrator logs

## Best Practices

### 1. Start with Defaults

Begin with default thresholds and adjust based on observed metrics.

### 2. Use Composite Alarms

Reduce alert fatigue by using composite alarms for critical issues only.

### 3. Enable Anomaly Detection

Use anomaly detection to catch unusual patterns not covered by static thresholds.

### 4. Set Appropriate Evaluation Periods

- **Transient issues**: Longer evaluation periods (3-5 periods)
- **Critical errors**: Shorter evaluation periods (1-2 periods)

### 5. Configure Recovery Actions

Use `ok_actions` to send notifications when alarms recover.

### 6. Monitor the Monitors

Set up a separate alarm for SNS delivery failures.

### 7. Test Alarms

Periodically test alarms by intentionally triggering them in non-prod environments.

## Cost Considerations

**Metric alarms**: $0.10/alarm/month
- Base configuration: ~15 alarms = $1.50/month

**Composite alarms**: $0.50/alarm/month
- 3 composite alarms = $1.50/month

**Anomaly detection**: $0.30/metric/month
- 2 anomaly detection alarms = $0.60/month

**Total estimated cost**: ~$3.60/month for full configuration

**Cost optimization**:
- Disable anomaly detection in dev: `enable_anomaly_detection = false`
- Disable composite alarms in dev: `enable_composite_alarms = false`
- Reduce number of monitored Lambda functions

## Troubleshooting

### Alarms in INSUFFICIENT_DATA state

**Cause**: Metrics not being generated (no traffic, service not running)

**Solution**:
- Verify service is running
- Check metric exists in CloudWatch console
- Ensure metric dimensions match exactly

### Alarms not triggering

**Cause**: Threshold too high or evaluation periods too long

**Solution**:
- Review metric values in CloudWatch
- Adjust threshold based on observed values
- Reduce evaluation periods for faster alerts

### Too many false alarms

**Cause**: Thresholds too strict

**Solution**:
- Increase thresholds
- Increase evaluation periods
- Use composite alarms to require multiple conditions
- Enable anomaly detection instead of static thresholds

## Related Documentation

- [AWS CloudWatch Alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html)
- [CloudWatch Composite Alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Create_Composite_Alarm.html)
- [CloudWatch Anomaly Detection](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Anomaly_Detection.html)
- [Miyabi Infrastructure Documentation](../../README.md)

## License

Copyright © 2025 Miyabi Project
