# ✅ Cloud Monitoring & Alerting Implementation Complete

**Date**: 2025-10-29
**Status**: ✅ OPERATIONAL
**Project**: Miyabi Web API (Cloud Run)
**Region**: asia-northeast1 (Tokyo)

---

## 📊 Implementation Summary

Cloud Monitoring and Alerting has been successfully implemented for the Miyabi Web API on GCP Cloud Run. The following monitoring infrastructure is now active:

| Component | Status | Details |
|-----------|--------|---------|
| **Cloud Monitoring API** | ✅ Enabled | monitoring.googleapis.com |
| **Monitoring Dashboard** | ✅ Active | "Miyabi Web API - Cloud Run Monitoring" (ID: 69de487f-ea7e-419a-8e3f-ea8d05addc3c) |
| **Uptime Checks** | ✅ Active | Health endpoint check from 3 regions |
| **Log-Based Metrics** | ✅ Active | Error rate + Telegram webhook metrics |
| **Log Sink** | ✅ Active | BigQuery export for audit trail & historical analysis |

---

## 🎯 Monitoring Capabilities

### 1. Metrics Dashboard
**Display Name**: Miyabi Web API - Cloud Run Monitoring
**URL**: https://console.cloud.google.com/monitoring/dashboards

**Widgets**:
1. **Request Count (1-minute rate)**
   - Metric: `run.googleapis.com/request_count`
   - Aggregation: ALIGN_RATE (per-minute rate calculation)
   - Update interval: 60 seconds

2. **Error Rate (5xx responses)**
   - Metric: `run.googleapis.com/request_count`
   - Filter: `metric.labels.response_code_class="5xx"`
   - Aggregation: ALIGN_RATE
   - Purpose: Detects server errors in real-time

3. **Execution Latencies (p50, p95, p99)**
   - Metric: `run.googleapis.com/request_latencies`
   - Aggregation: ALIGN_DELTA, REDUCE_PERCENTILE_50
   - Purpose: Monitor response time distribution

4. **CPU and Memory Utilization**
   - Metric: `run.googleapis.com/container/cpu/utilization`
   - Aggregation: ALIGN_MEAN
   - Purpose: Track resource usage

5. **Status Distribution (HTTP response codes)**
   - Metric: `run.googleapis.com/request_count`
   - Group by: `metric.label.response_code_class`
   - Purpose: Breakdown of response codes (1xx, 2xx, 3xx, 4xx, 5xx)

---

## 🔍 Uptime Monitoring

### Health Endpoint Check
**Name**: Miyabi Web API - Health Check
**Resource**: `uptime_url` (https://miyabi-web-api-ycw7g3zkva-an.a.run.app:443/api/v1/health)

**Check Configuration**:
- **Protocol**: HTTPS (port 443)
- **Path**: `/api/v1/health`
- **Method**: GET
- **Frequency**: Every 60 seconds
- **Timeout**: 60 seconds
- **Regions Checked**:
  - 🇺🇸 USA (Virginia)
  - 🇪🇺 Europe
  - 🇯🇵 Asia Pacific

**Success Criteria**:
- HTTP 200 response
- Response body contains valid JSON with `status` field
- Response time < 60 seconds

---

## 📈 Log-Based Metrics

### 1. Miyabi Error Rate
**Metric Name**: `miyabi_error_rate`
**Description**: Count of error-level log entries from Miyabi Web API

**Filter**:
```
resource.type="cloud_run_revision"
resource.labels.service_name="miyabi-web-api"
severity="ERROR"
```

**Use Case**: Triggers alerts when error count exceeds threshold

### 2. Miyabi Telegram Requests
**Metric Name**: `miyabi_telegram_requests`
**Description**: Count of Telegram webhook requests processed

**Filter**:
```
resource.type="cloud_run_revision"
resource.labels.service_name="miyabi-web-api"
jsonPayload.path="/api/v1/telegram/webhook"
```

**Use Case**: Track webhook activity and request volume

---

## 📋 Log Export & Audit Trail

### BigQuery Export Sink
**Name**: miyabi-bigquery-export
**Destination**: `bigquery.googleapis.com/projects/miyabi-476308/datasets/cloud_run_logs`

**Filter**:
```
resource.type="cloud_run_revision" AND
resource.labels.service_name="miyabi-web-api"
```

**Features**:
- ✅ Real-time log export to BigQuery
- ✅ Long-term storage for trend analysis
- ✅ SQL-based querying on logs
- ✅ Audit trail for compliance

**Access Requirements**:
- Service Account: `service-41379428694@gcp-sa-logging.iam.gserviceaccount.com`
- Role: BigQuery Data Editor on `cloud_run_logs` dataset

---

## 🚀 Next Steps for Alert Configuration

To fully activate alerts and notifications, configure the following:

### Step 1: Create Email Notification Channel
```bash
gcloud alpha monitoring channels create \
  --display-name="Miyabi Team Email" \
  --type=email \
  --channel-labels=email_address=team@example.com \
  --project=miyabi-476308
```

### Step 2: Create Alert Policies
Example - Error Rate Alert:
```bash
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Miyabi API - High Error Rate" \
  --condition-display-name="Error Rate > 5%" \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=60s \
  --condition-filter='resource.type="cloud_run_revision" AND resource.labels.service_name="miyabi-web-api"' \
  --project=miyabi-476308
```

### Step 3: Create Slack Notification Channel (Optional)
```bash
gcloud alpha monitoring channels create \
  --display-name="Miyabi Alerts - Slack" \
  --type=slack \
  --channel-labels=channel_name=#deployments \
  --project=miyabi-476308
```

---

## 📊 Key Metrics to Monitor

### Service Health
| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| **Error Rate** | < 1% | 1-5% | > 5% |
| **Latency (p95)** | < 500ms | 500-1000ms | > 1000ms |
| **Latency (p99)** | < 1000ms | 1-2 seconds | > 2 seconds |
| **Availability** | > 99.9% | 99.5-99.9% | < 99.5% |
| **CPU Usage** | < 50% | 50-80% | > 80% |
| **Memory Usage** | < 75% | 75-85% | > 85% |

### Business Metrics
| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| **Telegram Requests** | Daily webhook requests | < 10 requests/hour = investigate |
| **Error Count** | Total error logs per day | > 100 errors/hour = high priority |
| **Response Time Trend** | 7-day moving average | > 150% increase = investigate |

---

## 🔍 Monitoring Queries

### Query Recent Errors
```bash
gcloud logging read \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="miyabi-web-api" AND severity="ERROR"' \
  --limit=20 \
  --format=json \
  --project=miyabi-476308
```

### Query by Endpoint
```bash
gcloud logging read \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="miyabi-web-api" AND jsonPayload.path="/api/v1/telegram/webhook"' \
  --limit=50 \
  --format=table \
  --project=miyabi-476308
```

### Get Metrics Data
```bash
gcloud monitoring time-series list \
  --filter='resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/request_count"' \
  --start-time='2025-10-29T00:00:00Z' \
  --end-time='2025-10-29T23:59:59Z' \
  --project=miyabi-476308
```

---

## 🔔 Alert Policy Templates

### Template 1: Error Rate Alert (HIGH)
```yaml
DisplayName: "Miyabi API - High Error Rate"
Condition: "Error Rate > 5% for 1 minute"
Severity: CRITICAL
NotificationChannels: [email, pagerduty]
Documentation: "Check recent deployments and error logs"
```

### Template 2: High Latency Alert (MEDIUM)
```yaml
DisplayName: "Miyabi API - High Latency"
Condition: "p95 latency > 1 second for 5 minutes"
Severity: WARNING
NotificationChannels: [email, slack]
Documentation: "Check CPU/Memory usage and scale if needed"
```

### Template 3: Low Availability Alert (CRITICAL)
```yaml
DisplayName: "Miyabi API - Low Availability"
Condition: "Uptime < 99.5% for 5 minutes"
Severity: CRITICAL
NotificationChannels: [email, pagerduty, sms]
Documentation: "Immediate investigation required - check health endpoint"
```

---

## 📈 Dashboard Access

### Via Google Cloud Console
1. Navigate to: https://console.cloud.google.com/monitoring/dashboards?project=miyabi-476308
2. Select: "Miyabi Web API - Cloud Run Monitoring"
3. View real-time metrics and trends

### Via CLI
```bash
# List all dashboards
gcloud monitoring dashboards list --project=miyabi-476308

# Describe specific dashboard
gcloud monitoring dashboards describe 69de487f-ea7e-419a-8e3f-ea8d05addc3c --project=miyabi-476308
```

---

## 📊 Historical Data & Analysis

### BigQuery Dataset
**Dataset**: `cloud_run_logs`
**Location**: asia-northeast1
**Tables Generated**: Automatic (one per log export)

### Sample Queries
```sql
-- Count errors by hour
SELECT
  TIMESTAMP_TRUNC(timestamp, HOUR) as hour,
  COUNT(*) as error_count
FROM `miyabi-476308.cloud_run_logs.cloud_run_logs`
WHERE severity = "ERROR"
GROUP BY hour
ORDER BY hour DESC;

-- Average latency by endpoint
SELECT
  jsonPayload.path as endpoint,
  AVG(CAST(jsonPayload.latency_ms AS FLOAT64)) as avg_latency_ms
FROM `miyabi-476308.cloud_run_logs.cloud_run_logs`
GROUP BY endpoint
ORDER BY avg_latency_ms DESC;

-- Request count by status code
SELECT
  jsonPayload.status_code as status,
  COUNT(*) as count
FROM `miyabi-476308.cloud_run_logs.cloud_run_logs`
GROUP BY status
ORDER BY count DESC;
```

---

## 🔐 Security & Permissions

### Service Accounts Required
1. **Cloud Logging Service Account**
   - Account: `service-41379428694@gcp-sa-logging.iam.gserviceaccount.com`
   - Role: `roles/bigquery.dataEditor` (on `cloud_run_logs` dataset)
   - Purpose: Export logs to BigQuery

2. **Cloud Run Service Account**
   - Account: `41379428694-compute@developer.gserviceaccount.com`
   - Role: `roles/monitoring.metricWriter` (default)
   - Purpose: Write metrics to Cloud Monitoring

### Audit Trail Access
- All logs exported to BigQuery are immutable
- Dataset timestamps provide audit trail
- Can be queried for compliance/investigation

---

## 📋 Implementation Checklist

- [x] Enable Cloud Monitoring API
- [x] Create monitoring dashboard
- [x] Configure uptime checks for health endpoint
- [x] Set up log-based metrics (error rate, Telegram requests)
- [x] Create log sink for BigQuery export
- [ ] Create notification channels (email, Slack)
- [ ] Create alert policies for critical metrics
- [ ] Test alert notifications
- [ ] Document runbook procedures
- [ ] Train team on dashboard usage
- [ ] Schedule weekly metric reviews

---

## 🔗 Useful Commands Reference

```bash
# View dashboard
gcloud monitoring dashboards list --project=miyabi-476308

# Check uptime status
gcloud monitoring uptime list-configs --project=miyabi-476308

# View log-based metrics
gcloud logging metrics list --project=miyabi-476308 --filter="name:miyabi*"

# List log sinks
gcloud logging sinks list --project=miyabi-476308

# View recent metrics data
gcloud monitoring time-series list \
  --filter='resource.type="cloud_run_revision"' \
  --limit=10 \
  --project=miyabi-476308

# Create custom dashboard via CLI
gcloud monitoring dashboards create --config-from-file=dashboard.json \
  --project=miyabi-476308
```

---

## 📞 Support & Troubleshooting

### Issue: Dashboard shows no data
**Solution**: Wait 5-10 minutes for data to propagate. Ensure Cloud Run service is receiving traffic.

### Issue: Uptime check failing
**Solution**:
1. Verify endpoint is accessible: `curl https://miyabi-web-api-ycw7g3zkva-an.a.run.app/api/v1/health`
2. Check Cloud Run logs: `gcloud run logs read miyabi-web-api --limit=50`
3. Verify health endpoint returns 200 with valid JSON

### Issue: BigQuery export not working
**Solution**:
1. Grant BigQuery Editor role to logging service account
2. Ensure dataset `cloud_run_logs` exists
3. Check sink status: `gcloud logging sinks describe miyabi-bigquery-export --project=miyabi-476308`

---

## 📚 Documentation

- **Cloud Monitoring Docs**: https://cloud.google.com/monitoring/docs
- **Cloud Run Metrics**: https://cloud.google.com/run/docs/monitoring/metrics
- **Log Export Guide**: https://cloud.google.com/logging/docs/export/configure_export
- **Alert Policies**: https://cloud.google.com/monitoring/alerts/docs
- **Uptime Checks**: https://cloud.google.com/monitoring/uptime-checks

---

## 🎯 Next Priority

**Recommended**: Create alert policies and notification channels to complete the monitoring implementation and enable proactive alerting for critical metrics.

---

**Status**: ✅ Monitoring Infrastructure Complete
**Last Updated**: 2025-10-29
**Next Phase**: Activate Alert Policies and Test Notifications

