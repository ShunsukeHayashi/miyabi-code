# 🎓 Miyabi Web API - Team Training Guide

**Version**: 1.0.0
**Date**: 2025-10-29
**Target Audience**: DevOps, Platform, and Support Teams
**Estimated Reading Time**: 20 minutes
**Estimated Hands-on Training**: 1 hour

---

## 📚 Table of Contents

1. [Quick Overview](#quick-overview)
2. [Monitoring Dashboard](#monitoring-dashboard)
3. [Alert Response Procedures](#alert-response-procedures)
4. [Log Analysis Guide](#log-analysis-guide)
5. [Performance Tuning](#performance-tuning)
6. [Troubleshooting Guide](#troubleshooting-guide)
7. [Incident Response Checklist](#incident-response-checklist)
8. [Escalation Procedures](#escalation-procedures)

---

## Quick Overview

### What You'll Manage

The Miyabi Web API is deployed on Google Cloud Platform with:
- **Compute**: Cloud Run (serverless containers)
- **Database**: Cloud SQL PostgreSQL 15
- **Monitoring**: Google Cloud Monitoring with custom dashboards
- **Alerts**: Email-based notifications to admin@miyabi.local
- **Backups**: Automated daily + 7-day point-in-time recovery

### Current Production Status

```
✅ HEALTHY - Production Ready (90/100)
├─ Cloud Run: Revision 00019-4t6 (2 vCPU, 2Gi RAM)
├─ Database: Connected, SSL/TLS enforced
├─ Monitoring: 5-widget dashboard, 3 critical alerts
├─ Uptime Checks: 3 regions (USA, Europe, Asia Pacific)
└─ Tests: 16/16 integration tests passing
```

### Key Metrics (Current Baselines)

| Metric | Baseline | Alert Threshold |
|--------|----------|-----------------|
| **Health Check Latency** | 90ms | N/A (baseline) |
| **Error Rate** | 0% | >5% (triggers alert) |
| **P95 Latency** | <500ms | >1000ms (triggers alert) |
| **Availability** | 100% | <99.5% (triggers alert) |
| **Memory Usage** | <100MB | Monitor only |
| **CPU Utilization** | <10% | Monitor only |

---

## Monitoring Dashboard

### Accessing the Dashboard

**Location**: [Cloud Monitoring Dashboard](https://console.cloud.google.com/monitoring/dashboards?project=miyabi-476308)

**Direct Login**:
```
1. Go to: https://console.cloud.google.com/monitoring
2. Select Project: miyabi-476308
3. Navigate to: Dashboards
4. Find: "Miyabi Web API - Production Dashboard"
```

### Dashboard Widgets Explained

#### Widget 1: Health Check Status

**Purpose**: Real-time service availability across 3 global regions

**What to look for**:
- ✅ All 3 regions showing GREEN (healthy)
- ⚠️ Any region showing YELLOW (degraded) - investigate latency
- ❌ Any region showing RED (down) - page on-call immediately

**Action if degraded**:
```bash
# Check service status
gcloud run services describe miyabi-web-api \
  --region=asia-northeast1 \
  --project=miyabi-476308

# View recent logs (last 50 lines)
gcloud run services logs read miyabi-web-api \
  --region=asia-northeast1 \
  --project=miyabi-476308 \
  --limit=50
```

#### Widget 2: Request Rate & Error Rate

**Purpose**: Volume and error tracking

**Healthy State**:
- Request rate: Stable (typically 5-50 req/s depending on traffic)
- Error rate: <1% (alert fires at >5%)
- 5xx errors: None (individual error tracking)

**If error rate spikes**:
1. Check if this is expected (deployment? traffic spike?)
2. Review logs for specific error messages
3. Check database connectivity
4. If rate >5% for >60s, alert will fire automatically

**Analysis Query**:
```bash
# View error details in BigQuery
gcloud logging read \
  'resource.type=cloud_run_revision AND \
   resource.labels.service_name=miyabi-web-api AND \
   severity>=ERROR' \
  --limit=50 \
  --format=json \
  --project=miyabi-476308
```

#### Widget 3: Request Latency (P50, P95, P99)

**Purpose**: Performance tracking across percentiles

**Healthy State**:
- P50: <200ms (50% of requests faster than this)
- P95: <500ms (95% of requests faster than this) - ALERT at >1000ms
- P99: <2000ms (99% of requests faster than this)

**Latency spike investigation**:
```bash
# Check if database is slow
gcloud sql instances describe miyabi-db --project=miyabi-476308 \
  --format='table(currentDiskSize,settings.tier)'

# View slow query logs (if enabled)
gcloud sql operations list \
  --instance=miyabi-db \
  --project=miyabi-476308 \
  --limit=10
```

**Common causes**:
- **Cold start**: First request after idle period (normal)
- **Database slow queries**: Check database performance
- **Memory pressure**: Service may be hitting memory limits
- **Network latency**: Check inter-region communication

#### Widget 4: Uptime Checks Status

**Purpose**: Global availability monitoring

**3 Regions monitored**:
- 🟢 **USA (Virginia)**: Checks health endpoint every 60s
- 🟢 **Europe**: Checks health endpoint every 60s
- 🟢 **Asia Pacific**: Checks health endpoint every 60s

**If a region shows RED**:
1. May be temporary network issue (check 5 min trend)
2. Service may be restarting (check revision)
3. If persistent >5 min, is a real issue - check "Health Check Latency" widget

**Check uptime check configuration**:
```bash
# List all uptime checks
gcloud monitoring uptime describe \
  --project=miyabi-476308 \
  --format='table(displayName,monitoredResource.labels.host,period)'
```

#### Widget 5: Container Memory & CPU

**Purpose**: Resource utilization tracking

**Healthy State**:
- Memory: <100MB at idle, scales with load
- CPU: <10% at idle, <50% under load
- Max observed: <500MB memory, <70% CPU

**If memory usage high**:
1. Possible memory leak (check logs for allocation patterns)
2. Load spike (monitor and adjust if sustained)
3. Container size too small (currently 2Gi - is adequate)

**Scale up if needed**:
```bash
# Increase memory/CPU
gcloud run deploy miyabi-web-api \
  --region=asia-northeast1 \
  --project=miyabi-476308 \
  --memory=4Gi \
  --cpu=4
```

### Customizing the Dashboard

**To add new metrics**:
```bash
# Example: Add custom metric widget
gcloud monitoring dashboards create \
  --config='{
    "displayName": "Custom Widget",
    "gridLayout": {
      "widgets": [{
        "title": "Your Metric",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "metric.type=your.custom.metric"
              }
            }
          }]
        }
      }]
    }
  }' \
  --project=miyabi-476308
```

---

## Alert Response Procedures

### Understanding Alerts

**3 Critical Alert Policies Active**:

| # | Alert | Condition | Duration | Action |
|---|-------|-----------|----------|--------|
| 1 | **High Error Rate** | >5% errors | 60 seconds | Page on-call |
| 2 | **High Latency** | P95 >1000ms | 300 seconds | Investigate DB/resources |
| 3 | **Low Availability** | <99.5% uptime | 300 seconds | Emergency page |

### Alert Notification Flow

```
Alert Triggered
    ↓
Email sent to: admin@miyabi.local
    ↓
Subject: "[ALERT] Miyabi API - High Error Rate"
    ↓
Body contains:
  - Alert name
  - Metric value (current state)
  - Alert threshold
  - Time triggered
  - Link to logs
```

### Response for Alert #1: High Error Rate (>5%)

**Severity**: 🔴 CRITICAL

**Immediate Actions (First 5 minutes)**:

1. **Assess Current Impact**
   ```bash
   # Check if alert is still active
   gcloud monitoring policies list \
     --filter="displayName:'High Error Rate'" \
     --project=miyabi-476308

   # View current error rate in real-time
   gcloud logging read \
     'resource.type=cloud_run_revision AND severity>=ERROR' \
     --limit=100 \
     --format=json \
     --project=miyabi-476308
   ```

2. **Check Service Health**
   ```bash
   # Get current revision
   gcloud run services describe miyabi-web-api \
     --region=asia-northeast1 \
     --project=miyabi-476308 \
     --format='value(status.latestRevision)'

   # Check if new deployment happened recently
   gcloud run revisions list \
     --service=miyabi-web-api \
     --region=asia-northeast1 \
     --project=miyabi-476308 \
     --sort-by='~creationTimestamp' \
     --limit=3
   ```

3. **Analyze Error Types**
   ```bash
   # Group errors by type
   gcloud logging read \
     'resource.type=cloud_run_revision AND severity>=ERROR' \
     --limit=500 \
     --project=miyabi-476308 \
     --format='value(jsonPayload.error_type)' | sort | uniq -c
   ```

**If Error Spike Detected**:

- **Case A: Recent Deployment**
  - Rollback to previous revision:
    ```bash
    gcloud run services update-traffic miyabi-web-api \
      --to-revisions LATEST=0,PREVIOUS=100 \
      --region=asia-northeast1 \
      --project=miyabi-476308
    ```

- **Case B: Database Connection Errors**
  - Check database status:
    ```bash
    gcloud sql instances describe miyabi-db \
      --project=miyabi-476308 \
      --format='table(state,databaseVersion,currentDiskSize)'

    # Check if database is accepting connections
    gcloud sql connect miyabi-db \
      --project=miyabi-476308 \
      --user=postgres
    ```

- **Case C: Memory/Resource Issues**
  - Check memory pressure:
    ```bash
    # View memory metrics
    gcloud monitoring time-series list \
      --filter='metric.type=run.googleapis.com/container_memory_utilizations' \
      --project=miyabi-476308 \
      --format='table(metric.labels.instance_id,points[0].value.double_value)'
    ```

**Follow-up (After stabilization)**:

1. Post-mortem analysis of error logs
2. Check for code issues in recent commits
3. Update runbooks if new pattern discovered
4. Adjust alert threshold if needed (see Performance Tuning section)

---

### Response for Alert #2: High Latency (P95 > 1000ms)

**Severity**: 🟡 WARNING

**Immediate Actions (First 5 minutes)**:

1. **Determine if Temporary or Sustained**
   ```bash
   # Check latency trend (last 30 minutes)
   gcloud monitoring read \
     'metric.type=run.googleapis.com/request_latencies' \
     --filter='resource.labels.service_name=miyabi-web-api' \
     --format='table(points[].interval.end_time,points[].value.distribution_value.range)' \
     --project=miyabi-476308
   ```

2. **Identify Affected Endpoints**
   ```bash
   # Which endpoints are slow?
   gcloud logging read \
     'resource.type=cloud_run_revision AND \
      jsonPayload.latency_ms>1000' \
     --limit=50 \
     --format='table(jsonPayload.endpoint,jsonPayload.latency_ms,timestamp)' \
     --project=miyabi-476308
   ```

3. **Check Database Performance**
   ```bash
   # Is database slow?
   gcloud sql instances describe miyabi-db \
     --project=miyabi-476308 \
     --format='table(databaseVersion,settings.tier,currentDiskSize)'

   # Check active connections
   gcloud sql connect miyabi-db \
     --project=miyabi-476308 \
     --user=postgres \
     -c "SELECT count(*) FROM pg_stat_activity;"
   ```

**If Latency is Database-Related**:

- Query optimization needed (check slow query logs)
- Consider upgrading database tier
- Add database indexes for common queries

**If Latency is Application-Related**:

- Check CPU and memory utilization
- May need to increase container resources
- Profile code to find bottlenecks

---

### Response for Alert #3: Low Availability (<99.5%)

**Severity**: 🔴 CRITICAL

**This alert means**: Service is down or unreachable from multiple regions

**Immediate Actions (First 2 minutes)**:

1. **Confirm Service Status**
   ```bash
   # Is service running?
   gcloud run services describe miyabi-web-api \
     --region=asia-northeast1 \
     --project=miyabi-476308 \
     --format='value(status.conditions[0].status)'

   # Test health endpoint directly
   curl -I https://miyabi-web-api-ycw7g3zkva-an.a.run.app/api/v1/health
   ```

2. **Check Recent Changes**
   ```bash
   # Was there a recent deployment?
   gcloud run revisions list \
     --service=miyabi-web-api \
     --region=asia-northeast1 \
     --project=miyabi-476308 \
     --sort-by='~creationTimestamp' \
     --limit=1
   ```

3. **Immediate Recovery**
   ```bash
   # If recent deployment broke it, rollback
   gcloud run revisions list \
     --service=miyabi-web-api \
     --region=asia-northeast1 \
     --project=miyabi-476308 \
     --sort-by='~creationTimestamp' \
     --limit=2 | tail -1 | awk '{print $1}' > /tmp/prev_revision.txt

   PREV_REV=$(cat /tmp/prev_revision.txt)
   gcloud run services update-traffic miyabi-web-api \
     --to-revisions=$PREV_REV=100 \
     --region=asia-northeast1 \
     --project=miyabi-476308
   ```

---

## Log Analysis Guide

### Accessing Logs

**Three Ways to Access Logs**:

#### Method 1: Cloud Logging Console
```
https://console.cloud.google.com/logs?project=miyabi-476308
```

#### Method 2: Cloud CLI
```bash
# View last 50 log lines
gcloud logging read \
  'resource.type=cloud_run_revision AND \
   resource.labels.service_name=miyabi-web-api' \
  --limit=50 \
  --format=json \
  --project=miyabi-476308

# View errors only
gcloud logging read \
  'resource.type=cloud_run_revision AND severity>=ERROR' \
  --limit=100 \
  --project=miyabi-476308
```

#### Method 3: BigQuery (Historical Analysis)
```bash
# Query logs from past 24 hours
bq query --use_legacy_sql=false '
SELECT
  timestamp,
  jsonPayload.endpoint,
  jsonPayload.method,
  jsonPayload.status_code,
  jsonPayload.latency_ms,
  jsonPayload.error_message
FROM `miyabi-476308.cloud_run_logs.cloud_run_logs`
WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
ORDER BY timestamp DESC
LIMIT 1000
'
```

### Key Log Fields

**Every API request logs**:
```json
{
  "timestamp": "2025-10-29T12:34:56.789Z",
  "severity": "INFO",
  "jsonPayload": {
    "endpoint": "/api/v1/health",
    "method": "GET",
    "status_code": 200,
    "latency_ms": 45,
    "request_id": "abc123",
    "user_agent": "curl/7.64.1"
  }
}
```

**Error logs include**:
```json
{
  "timestamp": "2025-10-29T12:34:56.789Z",
  "severity": "ERROR",
  "jsonPayload": {
    "error_type": "DatabaseError",
    "error_message": "Failed to connect to database",
    "request_id": "xyz789",
    "endpoint": "/api/v1/users",
    "stack_trace": "..."
  }
}
```

### Common Log Queries

**1. Find all errors from last 1 hour**:
```bash
gcloud logging read \
  'severity>=ERROR AND timestamp>="'$(date -u -d '1 hour ago' +'%Y-%m-%dT%H:%M:%S')'Z"' \
  --limit=500 \
  --project=miyabi-476308 \
  --format='table(severity,timestamp,jsonPayload.error_type)'
```

**2. Find slow requests (>500ms)**:
```bash
gcloud logging read \
  'jsonPayload.latency_ms>500' \
  --limit=100 \
  --project=miyabi-476308 \
  --format='table(timestamp,jsonPayload.endpoint,jsonPayload.latency_ms)'
```

**3. Track specific user/request**:
```bash
gcloud logging read \
  'jsonPayload.request_id="abc123"' \
  --limit=50 \
  --project=miyabi-476308 \
  --format=json
```

**4. Find all failed requests**:
```bash
gcloud logging read \
  'jsonPayload.status_code>=400' \
  --limit=200 \
  --project=miyabi-476308 \
  --format='table(timestamp,jsonPayload.endpoint,jsonPayload.status_code)'
```

---

## Performance Tuning

### Current Baseline (Established 2025-10-29)

```
Health Check:     ~90ms (excellent)
P50 Latency:      ~100ms
P95 Latency:      <500ms
P99 Latency:      <2000ms
Error Rate:       0%
Memory Usage:     <100MB (idle)
CPU Usage:        <10% (idle)
Concurrent Reqs:  ~5 req/s typical, <50 req/s peak
```

### Performance is Good, But How to Optimize Further?

**If system becomes slower over time**:

1. **Identify the bottleneck**
   ```bash
   # Is it application code, database, or resources?

   # Check app CPU usage
   gcloud monitoring read \
     'metric.type=run.googleapis.com/container_cpu_utilizations' \
     --project=miyabi-476308

   # Check database queries
   gcloud sql connect miyabi-db \
     --project=miyabi-476308 \
     --user=postgres \
     -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
   ```

2. **Profile the application**
   ```bash
   # Build debug profile
   cargo build --profile debuginfo --package miyabi-web-api

   # Run with profiling
   # (See PERFORMANCE.md for detailed profiling guide)
   ```

3. **Database optimization**
   ```bash
   # Add indexes
   gcloud sql connect miyabi-db \
     --project=miyabi-476308 \
     --user=postgres \
     -c "CREATE INDEX idx_users_email ON users(email);"

   # Analyze query plans
   gcloud sql connect miyabi-db \
     --user=postgres \
     -c "EXPLAIN ANALYZE SELECT * FROM users WHERE email='test@example.com';"
   ```

4. **Increase resources** (if not bottleneck at application)
   ```bash
   # Upgrade from 2vCPU to 4vCPU, 2Gi to 4Gi
   gcloud run deploy miyabi-web-api \
     --region=asia-northeast1 \
     --project=miyabi-476308 \
     --cpu=4 \
     --memory=4Gi \
     --image=gcr.io/miyabi-476308/miyabi-web-api:latest
   ```

### Alert Threshold Adjustment

**Current thresholds tuned after 24-48 hours of production traffic**:

- **Error Rate Alert**: >5% (adjust if >1% is normal for your traffic pattern)
- **Latency Alert**: P95 >1000ms (adjust based on application needs)
- **Availability Alert**: <99.5% (industry standard)

**To adjust thresholds**:
```bash
# Get current alert policy ID
POLICY_ID=$(gcloud monitoring policies list \
  --filter="displayName:'High Error Rate'" \
  --format='value(name)' \
  --project=miyabi-476308 | cut -d'/' -f4)

# Update threshold (example: change to 3% error rate)
gcloud alpha monitoring policies update $POLICY_ID \
  --update-condition-threshold-value=0.03 \
  --project=miyabi-476308
```

---

## Troubleshooting Guide

### Issue #1: Service is Down (Returns 502 Bad Gateway)

**Diagnosis**:
```bash
# Check service status
gcloud run services describe miyabi-web-api \
  --region=asia-northeast1 \
  --project=miyabi-476308

# Check if service has any running instances
gcloud run revisions list \
  --service=miyabi-web-api \
  --region=asia-northeast1 \
  --project=miyabi-476308 \
  --sort-by='~creationTimestamp' \
  --limit=3

# Check recent error logs
gcloud logging read \
  'resource.type=cloud_run_revision AND severity>=ERROR' \
  --limit=100 \
  --project=miyabi-476308
```

**Common Causes & Fixes**:

| Cause | Fix |
|-------|-----|
| Service undeployed | Redeploy: `gcloud run deploy miyabi-web-api --region=asia-northeast1 --project=miyabi-476308` |
| All instances crashed | Check logs for crash reason, fix code, redeploy |
| Database unreachable | Check Cloud SQL status and connection string |
| Secrets missing | Verify all secrets in Secret Manager and environment variables |
| Container image not found | Check image in GCR: `gcloud container images list --project=miyabi-476308` |

---

### Issue #2: Database Connection Errors

**Diagnosis**:
```bash
# Check database status
gcloud sql instances describe miyabi-db \
  --project=miyabi-476308 \
  --format='table(state,currentDiskSize,databaseVersion)'

# Try connecting
gcloud sql connect miyabi-db \
  --project=miyabi-476308 \
  --user=postgres
```

**Common Causes & Fixes**:

| Cause | Fix |
|-------|-----|
| DATABASE_URL not set in Cloud Run | Redeploy with: `--set-secrets="DATABASE_URL=database-url:latest"` |
| Database instance down | `gcloud sql instances patch miyabi-db --backup` (may take time) |
| SSL/TLS certificate expired | Update certificate in Cloud SQL (automatic in managed service) |
| Network access restricted | Check authorized networks: `gcloud sql instances describe miyabi-db --format='table(settings.ipConfiguration.authorizedNetworks[].value)'` |

---

### Issue #3: High Memory Usage

**Diagnosis**:
```bash
# Monitor memory in real-time
gcloud monitoring read \
  'metric.type=run.googleapis.com/container_memory_utilizations' \
  --filter='resource.labels.service_name=miyabi-web-api' \
  --format='table(metric.labels.instance_id,points[0].value.double_value)' \
  --project=miyabi-476308
```

**Common Causes & Fixes**:

| Cause | Fix |
|-------|-----|
| Memory leak in code | Profile with `cargo flamegraph`, find leak, fix code |
| Large response payloads | Implement pagination, compression, reduce data transfer |
| Database result caching | Add TTL to cache, implement cache eviction |
| Traffic spike | Temporary condition, monitor for return to baseline |

---

### Issue #4: Slow Requests

**Diagnosis**:
```bash
# Find slowest endpoints
gcloud logging read \
  'jsonPayload.latency_ms>500' \
  --limit=200 \
  --project=miyabi-476308 \
  --format='table(timestamp,jsonPayload.endpoint,jsonPayload.latency_ms)' | sort -k3 -nr | head -20
```

**Common Causes & Fixes**:

| Cause | Fix |
|-------|-----|
| Slow database query | Add indexes, optimize query, use connection pooling |
| First request after idle | Normal (cold start), cache warming helps |
| N+1 query problem | Use batch queries, eager loading, query optimization |
| Large response payload | Implement compression (gzip), pagination |

---

## Incident Response Checklist

### Quick Reference Card

Print this and keep at desk during on-call rotation:

```
MIYABI API - INCIDENT RESPONSE QUICK GUIDE

🔴 ALERT RECEIVED
├─ Alert Type: Check email subject
├─ Timestamp: Note exact time
└─ Metric Value: Note current value

STEP 1: ASSESS (2 minutes)
├─ Is service responding? curl https://miyabi-web-api-ycw7g3zkva-an.a.run.app/api/v1/health
├─ Check dashboard: https://console.cloud.google.com/monitoring/dashboards?project=miyabi-476308
└─ Estimate impact: How many users affected?

STEP 2: RESPOND (5 minutes)
├─ Error Rate Alert   → Review logs, check for bad deployment
├─ Latency Alert      → Check database performance
└─ Availability Alert → Check if service is running

STEP 3: RECOVER (10-30 minutes)
├─ Rollback if deployment issue
├─ Restart if transient failure
├─ Scale up if resource constraint
└─ Page escalation if unresolved

STEP 4: FOLLOW-UP (After incident)
├─ Document what happened
├─ Update runbooks
├─ Schedule post-mortem
└─ Prevent recurrence
```

### Incident Severity Levels

**Level 1 (CRITICAL)**: Service completely down
- Response Time: <5 minutes
- Escalation: Page on-call manager + engineering lead

**Level 2 (HIGH)**: Service degraded but functional
- Response Time: <15 minutes
- Escalation: Notify team lead

**Level 3 (MEDIUM)**: Non-critical metrics elevated
- Response Time: <1 hour
- Escalation: No escalation required, team handles

---

## Escalation Procedures

### On-Call Escalation Matrix

```
Level 1 (Critical)           Level 2 (High)              Level 3 (Medium)
├─ Page: Platform Lead       ├─ Notify: Team Lead       └─ Log: Team Channel
├─ ETA: <5 min response      ├─ ETA: <15 min response
└─ Commit: Fix in progress   └─ Commit: Investigation

Escalation Path:
1. On-Call Engineer (you) - Immediate response
2. Team Lead - If not resolved in 15 minutes
3. Engineering Manager - If not resolved in 30 minutes
4. CTO/VP Engineering - Critical incidents affecting users
```

### Who to Contact

| Role | Contact | Phone | Slack |
|------|---------|-------|-------|
| **On-Call Engineer** | Team Rotation | See Oncall Tracker | #on-call |
| **Platform Team Lead** | TBD | TBD | #platform-team |
| **Database Admin** | TBD | TBD | #database-admins |
| **Infrastructure Lead** | TBD | TBD | #infrastructure |

---

## Training Exercise

### Hands-On Lab (15 minutes)

**Goal**: Familiarize team with monitoring and response procedures

**Exercise 1: Dashboard Familiarization (5 min)**
```
1. Open dashboard: https://console.cloud.google.com/monitoring/dashboards
2. Identify each widget: Health, Errors, Latency, Uptime, Resources
3. Find current values for each metric
4. Note: Are any metrics near alert thresholds?
```

**Exercise 2: Simulated Alert Response (5 min)**
```
1. Assume you got: "Error rate > 5%"
2. Access logs: gcloud logging read 'severity>=ERROR' --limit=10 --project=miyabi-476308
3. Identify top error types
4. Document what you would check next
```

**Exercise 3: Log Query Practice (5 min)**
```
1. Find slowest endpoint in last hour
2. Find most common error type today
3. Identify which request failed with HTTP 500
```

---

## Additional Resources

### Documentation Links

- **Deployment Guide**: [GCP_DEPLOYMENT_COMPLETE.md](GCP_DEPLOYMENT_COMPLETE.md)
- **Monitoring Setup**: [MONITORING_ALERTS_SETUP_COMPLETE.md](MONITORING_ALERTS_SETUP_COMPLETE.md)
- **Database Guide**: [DATABASE_URL_INTEGRATION_GUIDE.md](DATABASE_URL_INTEGRATION_GUIDE.md)
- **Telegram Bot**: [TELEGRAM_BOT_SETUP_GUIDE.md](TELEGRAM_BOT_SETUP_GUIDE.md)

### Quick Reference Commands

```bash
# Health check
curl https://miyabi-web-api-ycw7g3zkva-an.a.run.app/api/v1/health

# View dashboard
open "https://console.cloud.google.com/monitoring/dashboards?project=miyabi-476308"

# Check service status
gcloud run services describe miyabi-web-api --region=asia-northeast1 --project=miyabi-476308

# View recent logs
gcloud logging read 'resource.type=cloud_run_revision' --limit=50 --project=miyabi-476308

# Connect to database
gcloud sql connect miyabi-db --project=miyabi-476308 --user=postgres
```

---

## Feedback & Continuous Improvement

**How to improve this guide**:
1. As you respond to incidents, note gaps in this runbook
2. Update procedures when you discover better approaches
3. Share learnings in team retrospectives
4. Keep this document version-controlled and up-to-date

**Last Updated**: 2025-10-29
**Next Review**: 2025-11-05 (after 7 days of production traffic)

---

**This training guide becomes more valuable as you gain experience. Update it based on real incidents and learnings.**

