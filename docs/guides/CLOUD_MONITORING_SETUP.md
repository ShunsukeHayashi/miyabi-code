# 📊 Cloud Monitoring & Alerting Setup for Miyabi Web API

**Date**: 2025-10-29
**Status**: ⏳ Ready for Implementation
**Service**: Cloud Run - Miyabi Web API
**Project**: miyabi-476308
**Region**: asia-northeast1

---

## 🎯 Monitoring Strategy

### Key Metrics to Monitor

| Metric | Threshold | Alert Severity | Action |
|--------|-----------|-----------------|--------|
| Error Rate | > 5% | High | Page on-call engineer |
| Response Latency (p95) | > 1000ms | Medium | Investigate and scale |
| Response Latency (p99) | > 2000ms | Medium | Optimize slow endpoints |
| Availability | < 99.5% | High | Immediate investigation |
| CPU Usage | > 80% | Medium | Auto-scale up |
| Memory Usage | > 85% | Medium | Review memory settings |
| Request Volume | > 1000 req/min | Low | Monitor for scaling |
| Health Check Failures | Any | High | Verify service health |

---

## 📈 Step 1: Enable Cloud Monitoring API

```bash
# Enable monitoring API
gcloud services enable monitoring.googleapis.com \
  --project=miyabi-476308

# Verify it's enabled
gcloud services list --enabled --filter="name:monitoring" \
  --project=miyabi-476308
```

---

## 🔍 Step 2: Create Monitoring Dashboard

### 2.1 Via gcloud CLI

```bash
# Create a basic dashboard
gcloud monitoring dashboards create --config-from-file=- << 'EOF'
{
  "displayName": "Miyabi Web API - Cloud Run Monitoring",
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Request Count",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_run_revision\" resource.labels.service_name=\"miyabi-web-api\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_RATE"
                  }
                }
              }
            }]
          }
        }
      },
      {
        "xPos": 6,
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Error Rate",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "resource.type=\"cloud_run_revision\" resource.labels.service_name=\"miyabi-web-api\" metric.type=\"run.googleapis.com/request_count\" metric.labels.response_code_class=\"5xx\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_RATE"
                  }
                }
              }
            }]
          }
        }
      }
    ]
  }
}
EOF
```

### 2.2 Via Google Cloud Console

1. Go to [Cloud Monitoring Console](https://console.cloud.google.com/monitoring)
2. Select **Dashboards** → **Create Dashboard**
3. Add widgets for:
   - Request count
   - Error rate
   - Latency (p50, p95, p99)
   - CPU usage
   - Memory usage

---

## 🚨 Step 3: Create Alert Policies

### 3.1 Error Rate Alert (HIGH)

```bash
# Create alert policy for error rate > 5%
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="Miyabi API - High Error Rate" \
  --condition-display-name="Error Rate > 5%" \
  --condition-filter='resource.type="cloud_run_revision" AND resource.labels.service_name="miyabi-web-api"' \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=60s \
  --project=miyabi-476308
```

### 3.2 High Latency Alert (MEDIUM)

```bash
# Alert when p95 latency > 1 second
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="Miyabi API - High Latency" \
  --condition-display-name="Latency p95 > 1000ms" \
  --condition-filter='resource.type="cloud_run_revision" AND resource.labels.service_name="miyabi-web-api"' \
  --condition-threshold-value=1000 \
  --condition-threshold-duration=300s \
  --project=miyabi-476308
```

### 3.3 Low Availability Alert (HIGH)

```bash
# Alert when uptime < 99.5%
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="Miyabi API - Low Availability" \
  --condition-display-name="Availability < 99.5%" \
  --condition-filter='resource.type="cloud_run_revision" AND resource.labels.service_name="miyabi-web-api"' \
  --condition-threshold-value=0.995 \
  --condition-threshold-duration=300s \
  --project=miyabi-476308
```

---

## 📧 Step 4: Configure Notification Channels

### 4.1 Email Notification

```bash
# Create email notification channel
gcloud alpha monitoring channels create \
  --display-name="Miyabi Team Email" \
  --type=email \
  --channel-labels=email_address=team@example.com \
  --project=miyabi-476308
```

### 4.2 Slack Notification (Recommended)

```bash
# Create Slack notification channel
gcloud alpha monitoring channels create \
  --display-name="Miyabi Alerts - Slack" \
  --type=slack \
  --channel-labels=channel_name=#deployments \
  --project=miyabi-476308
```

### 4.3 PagerDuty Integration

```bash
# Create PagerDuty notification channel for critical alerts
gcloud alpha monitoring channels create \
  --display-name="Miyabi - PagerDuty" \
  --type=pagerduty \
  --channel-labels=service_key=YOUR_PAGERDUTY_KEY \
  --project=miyabi-476308
```

---

## 📋 Step 5: Configure Uptime Checks

### 5.1 Health Endpoint Check

```bash
# Create uptime check for health endpoint
gcloud monitoring uptime-checks create \
  --display-name="Miyabi API - Health Check" \
  --resource-type="uptime-url" \
  --monitored-resource=http_check \
  --http-check-path="/api/v1/health" \
  --http-check-port=443 \
  --http-check-use-ssl=true \
  --monitored-resource-labels=host="miyabi-web-api-ycw7g3zkva-an.a.run.app" \
  --selected-regions="USA,EUROPE,ASIA_PACIFIC" \
  --project=miyabi-476308
```

### 5.2 Webhook Endpoint Check

```bash
# Create uptime check for webhook endpoint
gcloud monitoring uptime-checks create \
  --display-name="Miyabi API - Webhook Check" \
  --resource-type="uptime-url" \
  --monitored-resource=http_check \
  --http-check-path="/api/v1/telegram/webhook" \
  --http-check-port=443 \
  --http-check-use-ssl=true \
  --http-check-request-method="GET" \
  --monitored-resource-labels=host="miyabi-web-api-ycw7g3zkva-an.a.run.app" \
  --selected-regions="USA,EUROPE,ASIA_PACIFIC" \
  --project=miyabi-476308
```

---

## 📊 Step 6: Create Custom Metrics (Optional)

### 6.1 Track API-Specific Metrics

```rust
// Example: Track successful issue creation
use google_cloudmonitoring1_alpha as cloudmonitoring;

let metric = cloudmonitoring::TimeSeries {
    metric: Some(cloudmonitoring::Metric {
        type_: Some("custom.googleapis.com/miyabi/issues_created".to_string()),
        labels: Some(vec![
            ("environment".to_string(), "production".to_string()),
            ("api_version".to_string(), "v1".to_string()),
        ].into()),
    }),
    resource: Some(cloudmonitoring::MonitoredResource {
        type_: Some("cloud_run_revision".to_string()),
        labels: Some(vec![
            ("service_name".to_string(), "miyabi-web-api".to_string()),
        ].into()),
    }),
    points: Some(vec![
        cloudmonitoring::Point {
            interval: Some(cloudmonitoring::TimeInterval {
                start_time: Some(start_time),
                end_time: Some(end_time),
            }),
            value: Some(cloudmonitoring::TypedValue {
                int64_value: Some(1),
                ..Default::default()
            }),
        }
    ]),
};
```

---

## 🔔 Step 7: Set Up Log-Based Metrics

### 7.1 Track Error Logs

```bash
# Create log-based metric for errors
gcloud logging metrics create error_rate \
  --description="Count of error-level log entries" \
  --log-filter='resource.type="cloud_run_revision"
    resource.labels.service_name="miyabi-web-api"
    severity="ERROR"' \
  --project=miyabi-476308
```

### 7.2 Track Specific Events

```bash
# Create metric for Telegram messages processed
gcloud logging metrics create telegram_messages_processed \
  --description="Count of Telegram messages processed" \
  --log-filter='resource.type="cloud_run_revision"
    resource.labels.service_name="miyabi-web-api"
    "Received Telegram update"' \
  --project=miyabi-476308
```

---

## 📱 Step 8: Configure Log Sink for Audit Trail

```bash
# Create log sink to export logs to Cloud Storage
gcloud logging sinks create miyabi-audit-sink \
  gs://miyabi-audit-logs/cloud-run-logs \
  --log-filter='resource.type="cloud_run_revision"' \
  --project=miyabi-476308
```

---

## 📈 Monitoring Best Practices

### 1. Alert Fatigue Prevention
- ⚠️ Don't alert on every metric
- ✅ Focus on user-impacting metrics
- ✅ Set realistic thresholds based on historical data
- ✅ Use different severity levels (INFO, WARNING, CRITICAL)

### 2. Metric Naming Convention
```
{component}/{object}/{action}_{metric}
Example: api/telegram/webhook_error_rate
```

### 3. Dashboard Organization
```
Dashboard Layout:
- Top: Key service health metrics
- Middle: Resource utilization (CPU, memory)
- Bottom: Detailed request/error metrics
```

### 4. Alert Escalation Policy
```
INFO (5 min) → WARNING (15 min) → CRITICAL (30 min)
```

---

## 🔍 Step 9: Health Check Configuration

### Current Health Checks

| Endpoint | Interval | Timeout | Healthy Status |
|----------|----------|---------|-----------------|
| `/api/v1/health` | 60s | 10s | 200 OK + JSON |
| `/api/v1/telegram/webhook` | 300s | 30s | 200-500 response |

### Add Custom Health Check

```bash
# Create custom health check
gcloud compute health-checks create http miyabi-health-check \
  --request-path="/api/v1/health" \
  --port=443 \
  --check-interval=60s \
  --timeout=10s \
  --healthy-threshold=2 \
  --unhealthy-threshold=3 \
  --global \
  --project=miyabi-476308
```

---

## 📊 Metrics to Export

### 7.1 Export to BigQuery

```bash
# Create sink to export metrics to BigQuery
gcloud logging sinks create bigquery-export \
  bigquery.googleapis.com/projects/miyabi-476308/datasets/cloud_run_logs \
  --log-filter='resource.type="cloud_run_revision"' \
  --project=miyabi-476308
```

### 7.2 Enable Metrics Export

```bash
# Enable export of Cloud Run metrics
gcloud monitoring channels create \
  --display-name="BigQuery Export" \
  --type=webhook_token_auth \
  --channel-labels=url="https://bigquery.googleapis.com/export" \
  --project=miyabi-476308
```

---

## 🎯 Monitoring Runbook

### What to Check When Alert Fires

#### Error Rate > 5%
1. Check recent deployments
   ```bash
   gcloud run revisions list --service=miyabi-web-api --limit=5
   ```
2. View error logs
   ```bash
   gcloud logging read 'severity=ERROR' --limit=50 --format=json
   ```
3. Check if specific endpoint is failing
   ```bash
   gcloud logging read 'resource.type="cloud_run_revision" AND severity=ERROR' \
     --format='table(timestamp,jsonPayload.message,severity)'
   ```

#### High Latency (p95 > 1s)
1. Check CPU and memory usage
   ```bash
   gcloud run services describe miyabi-web-api \
     --region=asia-northeast1 \
     --format='table(status.conditions[].message)'
   ```
2. Check for database connection issues
   ```bash
   gcloud logging read 'textPayload=~"database|connection" severity=WARNING' --limit=20
   ```
3. Consider scaling up
   ```bash
   gcloud run services update miyabi-web-api \
     --concurrency=100 \
     --max-instances=20 \
     --region=asia-northeast1
   ```

#### Low Availability
1. Check Cloud Run service status
   ```bash
   gcloud run services describe miyabi-web-api --region=asia-northeast1
   ```
2. Check uptime check results
   ```bash
   gcloud monitoring uptime-checks list-results UPTIME_CHECK_ID --limit=10
   ```
3. Check Cloud SQL connectivity
   ```bash
   gcloud sql instances describe miyabi-db
   ```

---

## 📋 Monitoring Checklist

- [ ] Create monitoring dashboard
- [ ] Set up notification channels (email, Slack, PagerDuty)
- [ ] Create alert policies:
  - [ ] Error rate > 5%
  - [ ] Latency p95 > 1000ms
  - [ ] Availability < 99.5%
  - [ ] CPU > 80%
  - [ ] Memory > 85%
- [ ] Configure uptime checks
  - [ ] Health endpoint
  - [ ] Telegram webhook
- [ ] Export logs to BigQuery
- [ ] Document runbook procedures
- [ ] Test alert notifications
- [ ] Schedule weekly review of metrics
- [ ] Archive historical data

---

## 🚀 Next Steps

### Immediate (Day 1)
1. [ ] Create monitoring dashboard
2. [ ] Set up email notifications
3. [ ] Create error rate alert

### Short-term (Week 1)
1. [ ] Configure all alert policies
2. [ ] Set up Slack integration
3. [ ] Configure uptime checks
4. [ ] Document runbook

### Medium-term (Month 1)
1. [ ] Establish performance baselines
2. [ ] Create custom metrics
3. [ ] Set up BigQuery export
4. [ ] Review and optimize thresholds

### Long-term (Ongoing)
1. [ ] Monitor trends and anomalies
2. [ ] Optimize alert rules based on data
3. [ ] Share metrics with team
4. [ ] Plan capacity based on trends

---

## 🔗 Useful Commands Reference

```bash
# View all monitoring resources
gcloud monitoring dashboards list
gcloud alpha monitoring policies list
gcloud monitoring uptime-checks list
gcloud logging metrics list

# Create dashboard programmatically
gcloud monitoring dashboards create --config-from-file=config.json

# List recent logs
gcloud logging read --limit=50 --format=json --filter='severity=ERROR'

# Get specific metric data
gcloud monitoring time-series list \
  --filter='resource.type="cloud_run_revision"' \
  --start-time='2025-10-29T00:00:00Z' \
  --end-time='2025-10-29T23:59:59Z'

# Delete alert policy
gcloud alpha monitoring policies delete POLICY_ID
```

---

## 📞 Support Resources

- **Cloud Monitoring Docs**: https://cloud.google.com/monitoring/docs
- **Cloud Run Metrics**: https://cloud.google.com/run/docs/monitoring/metrics
- **Alert Policies**: https://cloud.google.com/monitoring/alerts/docs
- **Uptime Checks**: https://cloud.google.com/monitoring/uptime-checks

---

**Status**: ⏳ Ready for Implementation
**Last Updated**: 2025-10-29
**Next Phase**: Implement monitoring dashboard and alert policies

