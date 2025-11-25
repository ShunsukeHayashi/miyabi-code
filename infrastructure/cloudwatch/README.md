# CloudWatch Monitoring Dashboard

Issue: #847 - CloudWatch監視ダッシュボード構築

## Overview

This directory contains CloudFormation templates and scripts for setting up comprehensive CloudWatch monitoring for the Miyabi platform.

## Components

### 1. Dashboard (`dashboard.yaml`)

CloudFormation template that creates:

- **CloudWatch Dashboard**: Visual overview of system health
  - API Request Count
  - API Response Time (avg, p95, p99)
  - API Error Rate (4xx, 5xx)
  - CloudFront Requests & Cache Hit Rate
  - S3 Bucket Requests
  - RDS Database Connections
  - API Error Logs
  - Alarm Status

- **SNS Topic**: For alarm notifications
- **Log Groups**: For API and webapp logs
- **CloudWatch Alarms**:
  - API Error Rate Alarm
  - API Latency Alarm
  - CloudFront Error Rate Alarm

- **Metric Filters**:
  - API Error Count
  - API Warning Count

### 2. Deployment Script (`deploy-dashboard.sh`)

Automated deployment script for the CloudFormation stack.

### 3. Log Insights Queries (`log-insights-queries.md`)

Pre-built CloudWatch Log Insights queries for:
- Error analysis
- Request analysis
- Authentication analysis
- Database queries
- Performance analysis
- Agent execution monitoring

## Quick Start

### Deploy to Staging

```bash
./deploy-dashboard.sh staging
```

### Deploy to Production with Email Alerts

```bash
./deploy-dashboard.sh production alerts@yourcompany.com
```

### Deploy with Additional Parameters

```bash
export CLOUDFRONT_DISTRIBUTION_ID="E1234567890"
export API_SERVICE_NAME="miyabi-web-api"
export WEBAPP_BUCKET_NAME="pantheon-webapp"

./deploy-dashboard.sh production alerts@yourcompany.com
```

## Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| Environment | staging or production | staging |
| AlarmEmail | Email for notifications | (empty) |
| ApiServiceName | Name of API service | miyabi-web-api |
| WebAppBucketName | S3 bucket base name | pantheon-webapp |
| CloudFrontDistributionId | CloudFront distribution ID | (empty) |

## Dashboard Widgets

### Row 1: API Metrics
- Request Count (time series)
- Response Time with percentiles
- Error Rate (4xx, 5xx)

### Row 2: CloudFront Metrics
- Requests
- Error Rate
- Cache Hit Rate

### Row 3: Storage & Database
- S3 Bucket Requests
- RDS Database Connections

### Row 4: Logs
- API Error Logs (real-time)

### Row 5: Alarms
- Alarm Status summary

## Alarms Configuration

### API Error Rate Alarm
- **Metric**: HTTPCode_Target_5XX_Count
- **Threshold**: > 10 errors in 5 minutes
- **Evaluation**: 2 consecutive periods
- **Action**: SNS notification

### API Latency Alarm
- **Metric**: TargetResponseTime
- **Threshold**: > 2 seconds average
- **Evaluation**: 3 consecutive periods
- **Action**: SNS notification

### CloudFront Error Rate Alarm
- **Metric**: 5xxErrorRate
- **Threshold**: > 5% average
- **Evaluation**: 2 consecutive periods
- **Action**: SNS notification

## Log Retention

| Environment | Retention |
|-------------|-----------|
| Staging | 7 days |
| Production | 30 days |

## Cost Estimation

Approximate monthly costs (ap-northeast-1):
- Dashboard: Free (first 3 dashboards)
- Alarms: ~$0.30 per alarm
- Log Storage: $0.50 per GB ingested
- Log Retention: $0.03 per GB per month
- SNS Notifications: $0.50 per 1M notifications

## Troubleshooting

### Deployment Fails

1. Check AWS credentials:
   ```bash
   aws sts get-caller-identity
   ```

2. Validate template:
   ```bash
   aws cloudformation validate-template --template-body file://dashboard.yaml
   ```

3. Check stack events:
   ```bash
   aws cloudformation describe-stack-events --stack-name miyabi-cloudwatch-staging
   ```

### Alarms Not Triggering

1. Verify metric data exists:
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace AWS/ApplicationELB \
     --metric-name RequestCount \
     --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
     --period 300 \
     --statistics Sum
   ```

2. Check alarm state:
   ```bash
   aws cloudwatch describe-alarms --alarm-names "miyabi-staging-api-error-rate"
   ```

### Logs Not Appearing

1. Verify log group exists:
   ```bash
   aws logs describe-log-groups --log-group-name-prefix "/miyabi/staging"
   ```

2. Check for recent log streams:
   ```bash
   aws logs describe-log-streams \
     --log-group-name "/miyabi/staging/api" \
     --order-by LastEventTime \
     --descending \
     --limit 5
   ```

## Related Issues

- #852 - CI/CD Pipeline (integrated with monitoring)
- #993 - Production Launch (monitoring pre-requisite)
