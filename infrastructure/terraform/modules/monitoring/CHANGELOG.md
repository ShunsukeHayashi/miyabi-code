# Changelog - Monitoring Module

## [2.0.0] - 2025-11-29

### Added - Comprehensive Error Rate and Latency Monitoring

#### Error Rate Monitoring
- **API Gateway Error Rates**
  - `api_5xx_error_rate`: Percentage-based 5XX error monitoring
  - `api_4xx_error_rate`: Percentage-based 4XX error monitoring
  - Uses metric math to calculate `(errors / total_requests) * 100`

- **ALB Error Rates**
  - `alb_5xx_error_rate`: Target 5XX error percentage monitoring
  - `alb_4xx_error_rate`: Target 4XX error percentage monitoring
  - Calculated using `HTTPCode_Target_5XX_Count` and `RequestCount`

- **Lambda Error Rates**
  - `lambda_error_rate`: Per-function error rate percentage
  - Calculated using `Errors / Invocations * 100`

#### Latency Monitoring (Multiple Percentiles)
- **API Gateway Latency**
  - `api_latency_p50`: Median latency (50th percentile)
  - `api_latency_p95`: 95th percentile (existing, kept for compatibility)
  - `api_latency_p99`: 99th percentile

- **ALB Response Time**
  - `alb_response_time_p95`: 95th percentile target response time
  - `alb_response_time_p99`: 99th percentile (automatically set to 1.5x P95)

#### ECS/Fargate Monitoring
- **Resource Utilization**
  - `ecs_cpu_high`: CPU utilization alarm
  - `ecs_memory_high`: Memory utilization alarm

- **Service Health**
  - `ecs_task_count_low`: Running task count monitoring

#### ALB Health Monitoring
- **Target Health**
  - `alb_unhealthy_hosts`: Unhealthy target count alarm
  - `alb_healthy_hosts_low`: Minimum healthy target requirement

#### Lambda Advanced Monitoring
- **Concurrency and Throttling**
  - `lambda_throttles`: Throttle detection
  - `lambda_concurrent_executions`: Concurrent execution limit monitoring

#### Composite Alarms
- **Critical System Health**
  - Triggers when: API 5XX errors AND API latency both exceed thresholds
  - Indicates severe system-wide issues

- **Service Degradation**
  - Triggers when: ALB response time OR ALB 5XX errors exceed thresholds
  - Early warning for service quality issues

- **Resource Exhaustion**
  - Triggers when: ECS CPU AND memory both exceed thresholds
  - Indicates capacity issues requiring scaling

#### Anomaly Detection
- **API Request Anomaly**
  - Machine learning-based detection of unusual traffic patterns
  - Uses 2-sigma band (99.7% confidence)

- **ALB Response Time Anomaly**
  - Detects unexpected response time increases
  - Adaptive to normal traffic patterns

### Variables Added

```hcl
# ECS/Fargate
ecs_cluster_name
ecs_service_name
ecs_cpu_threshold (default: 80)
ecs_memory_threshold (default: 80)
ecs_min_task_count (default: 1)

# ALB
alb_name
alb_target_group_name
alb_response_time_threshold_ms (default: 2000)
alb_5xx_error_rate_threshold (default: 5)
alb_4xx_error_rate_threshold (default: 20)
alb_min_healthy_hosts (default: 1)

# API Gateway Enhanced
api_5xx_error_rate_threshold (default: 5)
api_4xx_error_rate_threshold (default: 20)
api_latency_p50_threshold_ms (default: 1000)
api_latency_p99_threshold_ms (default: 5000)

# Lambda Enhanced
lambda_error_rate_threshold (default: 5)
lambda_throttle_threshold (default: 10)
lambda_concurrent_executions_threshold (default: 100)

# Advanced Features
enable_composite_alarms (default: true)
enable_anomaly_detection (default: true)
```

### Outputs Added

```hcl
# Individual Alarm ARNs
api_5xx_error_rate_alarm_arn
ecs_cpu_alarm_arn
ecs_memory_alarm_arn
alb_response_time_p95_alarm_arn
alb_5xx_error_rate_alarm_arn

# Composite Alarm ARNs
critical_system_health_alarm_arn
service_degradation_alarm_arn
resource_exhaustion_alarm_arn

# Comprehensive Summary
alarm_summary (structured object with all alarms)
```

### Documentation Added

- **README.md**: Comprehensive module documentation
  - Feature overview
  - Usage examples
  - Threshold recommendations
  - Best practices
  - Troubleshooting guide

- **examples/complete.tf**: Full production configuration example
- **examples/minimal.tf**: Minimal development configuration
- **examples/ecs-only.tf**: ECS-focused monitoring setup

### Breaking Changes

None - All new alarms are optional and use conditional creation based on variable values.

### Migration Guide

#### From v1.x to v2.0

No breaking changes. New alarms are created only when relevant variables are provided:

```hcl
# Before (v1.x) - still works
module "monitoring" {
  source = "../modules/monitoring"

  api_name = "my-api"
  api_5xx_threshold = 10
  # ... other v1.x variables
}

# After (v2.0) - add new features
module "monitoring" {
  source = "../modules/monitoring"

  # Existing v1.x variables (still work)
  api_name = "my-api"
  api_5xx_threshold = 10

  # New v2.0 features (optional)
  api_5xx_error_rate_threshold = 5
  ecs_cluster_name = "my-cluster"
  enable_composite_alarms = true
  enable_anomaly_detection = true
}
```

### Cost Impact

**New alarms added (maximum configuration)**:
- Error rate alarms: 6 alarms × $0.10 = $0.60/month
- Latency alarms: 4 alarms × $0.10 = $0.40/month
- ECS alarms: 3 alarms × $0.10 = $0.30/month
- ALB alarms: 6 alarms × $0.10 = $0.60/month
- Lambda alarms: 6 alarms × $0.10 = $0.60/month (assuming 2 functions)
- Composite alarms: 3 alarms × $0.50 = $1.50/month
- Anomaly detection: 2 alarms × $0.30 = $0.60/month

**Total additional cost**: ~$4.60/month (maximum, all features enabled)

**Cost optimization**:
- Development: Disable composite alarms and anomaly detection (~$2.10/month savings)
- Production: Enable all features for comprehensive monitoring

### Alarm Summary

| Category | Alarm Count | Monthly Cost |
|----------|-------------|--------------|
| API Gateway (v1.x) | 3 | $0.30 |
| API Gateway (new) | 3 | $0.30 |
| ECS/Fargate (new) | 3 | $0.30 |
| ALB (new) | 6 | $0.60 |
| Lambda (v1.x) | 2 per function | $0.20/function |
| Lambda (new) | 3 per function | $0.30/function |
| RDS (v1.x) | 3 | $0.30 |
| Composite (new) | 3 | $1.50 |
| Anomaly (new) | 2 | $0.60 |
| **Total (full config)** | **~30** | **~$4.60** |

### Performance Impact

- No performance impact on monitored resources
- CloudWatch metrics are asynchronously collected
- Dashboard refreshes every 60 seconds by default

### Security Considerations

- SNS topic uses AWS managed encryption by default
- Add `kms_master_key_id` to `aws_sns_topic` for customer-managed keys
- Email subscriptions require confirmation
- Consider using HTTPS endpoints for webhook integrations

### Future Enhancements

Planned for v2.1:
- [ ] Custom metric namespace support
- [ ] Enhanced dashboard with additional widgets
- [ ] Slack/PagerDuty integration examples
- [ ] Auto-remediation actions (Lambda triggers)
- [ ] Cross-region alarm aggregation

### Credits

Developed for Miyabi autonomous AI development platform.
Issue: https://github.com/customer-cloud/miyabi-private/issues/XXX

### License

Copyright © 2025 Miyabi Project
