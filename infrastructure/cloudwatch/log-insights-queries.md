# CloudWatch Log Insights Queries

Issue: #847 - CloudWatch監視ダッシュボード構築

## API Service Queries

### Error Analysis

```sql
-- Find all errors in the last hour
fields @timestamp, @message, @logStream
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100
```

```sql
-- Error count by hour
fields @timestamp, @message
| filter @message like /ERROR/
| stats count(*) as error_count by bin(1h)
```

```sql
-- Top 10 error messages
fields @message
| filter @message like /ERROR/
| parse @message "ERROR * - *" as error_type, error_detail
| stats count(*) as count by error_type, error_detail
| sort count desc
| limit 10
```

### Request Analysis

```sql
-- Request latency percentiles
fields @timestamp, @message
| filter @message like /request completed/
| parse @message "latency=* ms" as latency
| stats avg(latency) as avg_latency,
        percentile(latency, 50) as p50,
        percentile(latency, 95) as p95,
        percentile(latency, 99) as p99
        by bin(5m)
```

```sql
-- Requests per endpoint
fields @timestamp, @message
| filter @message like /HTTP/
| parse @message 'method=* path=* status=*' as method, path, status
| stats count(*) as request_count by method, path
| sort request_count desc
| limit 20
```

```sql
-- Slow requests (> 1 second)
fields @timestamp, @message
| filter @message like /request completed/
| parse @message "latency=* ms" as latency
| filter latency > 1000
| sort latency desc
| limit 50
```

### Authentication Analysis

```sql
-- Failed login attempts
fields @timestamp, @message
| filter @message like /login failed/ or @message like /authentication failed/
| stats count(*) as failed_logins by bin(1h)
```

```sql
-- OAuth callback errors
fields @timestamp, @message
| filter @message like /OAuth/ and @message like /ERROR/
| sort @timestamp desc
| limit 50
```

### Database Queries

```sql
-- Slow database queries (> 100ms)
fields @timestamp, @message
| filter @message like /query/ and @message like /ms/
| parse @message "query=* duration=* ms" as query, duration
| filter duration > 100
| sort duration desc
| limit 50
```

```sql
-- Database connection pool stats
fields @timestamp, @message
| filter @message like /pool/ or @message like /connection/
| stats count(*) as events by bin(5m)
```

## WebApp (CloudFront/S3) Queries

### Access Patterns

```sql
-- Top requested pages
fields @timestamp, cs_uri_stem, sc_status
| stats count(*) as requests by cs_uri_stem
| sort requests desc
| limit 20
```

```sql
-- 4xx errors by path
fields @timestamp, cs_uri_stem, sc_status
| filter sc_status >= 400 and sc_status < 500
| stats count(*) as error_count by cs_uri_stem, sc_status
| sort error_count desc
| limit 20
```

```sql
-- 5xx errors timeline
fields @timestamp, cs_uri_stem, sc_status
| filter sc_status >= 500
| stats count(*) as error_count by bin(5m)
```

### Performance Analysis

```sql
-- Response time by path
fields @timestamp, cs_uri_stem, time_taken
| stats avg(time_taken) as avg_time,
        percentile(time_taken, 95) as p95_time
        by cs_uri_stem
| sort avg_time desc
| limit 20
```

```sql
-- Cache hit/miss ratio
fields @timestamp, x_edge_result_type
| stats count(*) as count by x_edge_result_type
```

### Geographic Analysis

```sql
-- Requests by country
fields @timestamp, c_ip, cs_uri_stem
| stats count(*) as requests by c_ip
| sort requests desc
| limit 20
```

## Agent Execution Logs

### Agent Performance

```sql
-- Agent execution times
fields @timestamp, @message
| filter @message like /agent/ and @message like /completed/
| parse @message "agent=* duration=* status=*" as agent_name, duration, status
| stats avg(duration) as avg_duration,
        count(*) as executions
        by agent_name
| sort avg_duration desc
```

```sql
-- Failed agent executions
fields @timestamp, @message
| filter @message like /agent/ and @message like /failed/
| parse @message "agent=* error=*" as agent_name, error
| stats count(*) as failures by agent_name, error
| sort failures desc
```

### Task Pipeline

```sql
-- Task status changes
fields @timestamp, @message
| filter @message like /task/ and @message like /status/
| parse @message "task_id=* status=*" as task_id, status
| stats count(*) as count by status
```

## Alerting Queries

### Real-time Monitoring

```sql
-- Anomaly detection: sudden spike in errors
fields @timestamp, @message
| filter @message like /ERROR/
| stats count(*) as error_count by bin(1m)
| filter error_count > 10
```

```sql
-- Service health check failures
fields @timestamp, @message
| filter @message like /health/ and @message like /failed/
| stats count(*) as failures by bin(5m)
```

## Useful Tips

### Time Ranges
- `@timestamp` is in UTC
- Use `| filter @timestamp > ago(1h)` for relative time filtering

### Common Parse Patterns
```sql
-- JSON parsing
| parse @message '{"level":"*","message":"*"}' as level, msg

-- Key-value parsing
| parse @message 'key1=* key2=*' as val1, val2

-- Regex parsing
| parse @message /user_id=(?<user_id>\d+)/
```

### Aggregation Functions
- `count(*)` - Total count
- `sum(field)` - Sum of values
- `avg(field)` - Average
- `min(field)`, `max(field)` - Min/Max
- `percentile(field, p)` - Percentile calculation
- `stats` - Multiple aggregations in one query
