# Troubleshooting Guide

**Environment**: Development (dev)
**Last Updated**: 2025-11-23

---

## Common Issues

### 1. Frontend Not Loading

**Symptoms**:
- Blank page
- Console errors
- Assets not loading

**Diagnosis**:
```bash
# Check S3 bucket contents
aws s3 ls s3://miyabi-web-dev-211234825975/

# Check CloudFront distribution (if enabled)
aws cloudfront list-distributions --query 'DistributionList.Items[*].{Id:Id,Domain:DomainName}'
```

**Resolution**:
1. Verify build artifacts exist in S3
2. Check browser console for CORS errors
3. Verify API_BASE_URL in environment variables
4. Clear browser cache

---

### 2. API Not Responding

**Symptoms**:
- Network timeout
- 502/503 errors
- Connection refused

**Diagnosis**:
```bash
# Check ALB health
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:us-west-2:112530848482:targetgroup/miyabi-tg-dev/8be3949ef237d5af

# Check ECS service status
aws ecs describe-services \
  --cluster miyabi-cluster-dev \
  --services miyabi-service-dev \
  --query 'services[0].{status:status,running:runningCount,desired:desiredCount}'
```

**Resolution**:
1. If no healthy targets, check ECS task logs
2. If tasks crashing, check for memory/CPU limits
3. Restart service if needed:
   ```bash
   aws ecs update-service \
     --cluster miyabi-cluster-dev \
     --service miyabi-service-dev \
     --force-new-deployment
   ```

---

### 3. WebSocket Connection Failed

**Symptoms**:
- "Disconnected" status in UI
- No real-time updates
- Console WebSocket errors

**Diagnosis**:
```bash
# Test WebSocket endpoint
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: $(openssl rand -base64 16)" \
  http://miyabi-alb-dev-42521683.us-west-2.elb.amazonaws.com/ws
```

**Resolution**:
1. Verify ALB listener supports WebSocket
2. Check security group allows WebSocket traffic
3. Ensure backend WebSocket handler is running
4. Check browser for mixed content (HTTP/HTTPS)

---

### 4. Authentication Failures

**Symptoms**:
- "Unauthorized" errors
- Redirect loops
- Token expired

**Diagnosis**:
```bash
# Test auth endpoint
curl -v http://miyabi-alb-dev-42521683.us-west-2.elb.amazonaws.com/auth/me

# Check environment variables
# In ECS task definition, verify:
# - GITHUB_CLIENT_ID
# - GITHUB_CLIENT_SECRET
# - JWT_SECRET
```

**Resolution**:
1. Clear browser cookies and retry
2. Verify GitHub OAuth app settings
3. Check callback URL configuration
4. Verify JWT secret is set correctly

---

### 5. Database Connection Errors

**Symptoms**:
- "Database unavailable" errors
- Timeout on queries
- Connection pool exhausted

**Diagnosis**:
```bash
# Check RDS status
aws rds describe-db-instances \
  --query 'DBInstances[*].{id:DBInstanceIdentifier,status:DBInstanceStatus}'

# Check security group
aws ec2 describe-security-groups \
  --group-ids sg-051602add5413aa27 \
  --query 'SecurityGroups[0].IpPermissions'
```

**Resolution**:
1. Verify ECS security group can reach RDS
2. Check database credentials in secrets
3. Review connection pool settings
4. Check RDS CloudWatch metrics for connection limits

---

### 6. Redis Cache Errors

**Symptoms**:
- Session not persisting
- Slow response times
- Cache miss errors

**Diagnosis**:
```bash
# Check ElastiCache status
aws elasticache describe-cache-clusters \
  --cache-cluster-id miyabi-cache-dev \
  --show-cache-node-info

# Check security group
aws ec2 describe-security-groups \
  --group-ids sg-0b13d6ffc744bb2a7
```

**Resolution**:
1. Verify ECS can reach Redis endpoint
2. Check Redis connection string in environment
3. Review Redis memory usage
4. Consider cache eviction policy

---

## ECS Task Troubleshooting

### View Running Tasks

```bash
# List tasks
aws ecs list-tasks \
  --cluster miyabi-cluster-dev \
  --service-name miyabi-service-dev

# Get task details
aws ecs describe-tasks \
  --cluster miyabi-cluster-dev \
  --tasks <task-id>
```

### Check Task Status

```bash
# Full service status
aws ecs describe-services \
  --cluster miyabi-cluster-dev \
  --services miyabi-service-dev \
  --query 'services[0].{
    status:status,
    desiredCount:desiredCount,
    runningCount:runningCount,
    pendingCount:pendingCount,
    events:events[0:5]
  }'
```

### Common Task Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| STOPPED | Out of memory | Increase task memory |
| PENDING | No capacity | Check cluster capacity |
| ACTIVATING | Health check failing | Check container health endpoint |

---

## CloudWatch Logs

### View Recent Logs

```bash
# Last 50 log entries
aws logs tail /ecs/miyabi-dev --since 1h

# Follow logs in real-time
aws logs tail /ecs/miyabi-dev --follow

# Filter for errors
aws logs tail /ecs/miyabi-dev --filter-pattern ERROR
```

### Search Logs

```bash
# Search for specific pattern
aws logs filter-log-events \
  --log-group-name /ecs/miyabi-dev \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s000)

# Search with time range
aws logs filter-log-events \
  --log-group-name /ecs/miyabi-dev \
  --start-time $(date -d '2025-11-23 10:00' +%s000) \
  --end-time $(date -d '2025-11-23 11:00' +%s000)
```

### Log Insights Query

```bash
# Use Log Insights for complex queries
aws logs start-query \
  --log-group-name /ecs/miyabi-dev \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --query-string 'fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 100'
```

---

## Deployment Rollback

### Quick Rollback

```bash
# Get previous task definition
aws ecs describe-services \
  --cluster miyabi-cluster-dev \
  --services miyabi-service-dev \
  --query 'services[0].taskDefinition'

# List all task definition revisions
aws ecs list-task-definitions \
  --family-prefix miyabi-app-dev \
  --sort DESC

# Rollback to specific revision
aws ecs update-service \
  --cluster miyabi-cluster-dev \
  --service miyabi-service-dev \
  --task-definition miyabi-app-dev:<previous-revision>
```

### Frontend Rollback

```bash
# List S3 versions (if versioning enabled)
aws s3api list-object-versions \
  --bucket miyabi-web-dev-211234825975 \
  --prefix index.html

# Restore previous version
aws s3api copy-object \
  --bucket miyabi-web-dev-211234825975 \
  --copy-source miyabi-web-dev-211234825975/index.html?versionId=<version-id> \
  --key index.html
```

### Full Rollback Procedure

1. **Identify the issue**
   ```bash
   aws logs tail /ecs/miyabi-dev --filter-pattern ERROR
   ```

2. **Find last working revision**
   ```bash
   aws ecs list-task-definitions --family-prefix miyabi-app-dev --sort DESC
   ```

3. **Rollback backend**
   ```bash
   aws ecs update-service \
     --cluster miyabi-cluster-dev \
     --service miyabi-service-dev \
     --task-definition miyabi-app-dev:<revision>
   ```

4. **Monitor deployment**
   ```bash
   aws ecs wait services-stable \
     --cluster miyabi-cluster-dev \
     --services miyabi-service-dev
   ```

5. **Verify health**
   ```bash
   curl http://miyabi-alb-dev-42521683.us-west-2.elb.amazonaws.com/health
   ```

---

## Performance Issues

### High CPU Usage

**Diagnosis**:
```bash
# Check ECS metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ClusterName,Value=miyabi-cluster-dev Name=ServiceName,Value=miyabi-service-dev \
  --start-time $(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 \
  --statistics Average
```

**Resolution**:
1. Scale up service
2. Increase task CPU allocation
3. Optimize application code

### High Memory Usage

**Diagnosis**:
```bash
# Check memory metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name MemoryUtilization \
  --dimensions Name=ClusterName,Value=miyabi-cluster-dev Name=ServiceName,Value=miyabi-service-dev \
  --start-time $(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 \
  --statistics Average
```

**Resolution**:
1. Check for memory leaks
2. Increase task memory
3. Review caching strategy

### Slow Response Times

**Diagnosis**:
```bash
# Check ALB latency
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --dimensions Name=LoadBalancer,Value=app/miyabi-alb-dev/5881ef6ae03743ba \
  --start-time $(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 \
  --statistics Average
```

**Resolution**:
1. Check database query performance
2. Review API endpoint optimization
3. Enable caching
4. Consider CDN for static assets

---

## Security Issues

### Unauthorized Access Attempts

**Check ALB access logs** (if enabled):
```bash
aws s3 ls s3://miyabi-alb-logs-dev/
```

### Security Group Verification

```bash
# Check all security groups
for sg in sg-041e093ea0d989f40 sg-0a57679e852c6abbf sg-051602add5413aa27 sg-0b13d6ffc744bb2a7; do
  echo "=== $sg ==="
  aws ec2 describe-security-groups --group-ids $sg --query 'SecurityGroups[0].{Name:GroupName,Ingress:IpPermissions}'
done
```

---

## Emergency Contacts

### Escalation Path

1. **Level 1**: Check this guide and CloudWatch logs
2. **Level 2**: Review AWS Console dashboards
3. **Level 3**: Contact infrastructure team

### Useful Links

- [ECS Cluster Console](https://us-west-2.console.aws.amazon.com/ecs/home?region=us-west-2#/clusters/miyabi-cluster-dev)
- [CloudWatch Logs](https://us-west-2.console.aws.amazon.com/cloudwatch/home?region=us-west-2#logsV2:log-groups/log-group/$252Fecs$252Fmiyabi-dev)
- [ALB Console](https://us-west-2.console.aws.amazon.com/ec2/v2/home?region=us-west-2#LoadBalancers:)

---

## Quick Reference Commands

### Health Checks

```bash
# API health
curl http://miyabi-alb-dev-42521683.us-west-2.elb.amazonaws.com/health

# ALB target health
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:us-west-2:112530848482:targetgroup/miyabi-tg-dev/8be3949ef237d5af

# ECS service status
aws ecs describe-services --cluster miyabi-cluster-dev --services miyabi-service-dev --query 'services[0].{running:runningCount,desired:desiredCount}'
```

### Restart Commands

```bash
# Force new deployment
aws ecs update-service --cluster miyabi-cluster-dev --service miyabi-service-dev --force-new-deployment

# Scale to 0 then back
aws ecs update-service --cluster miyabi-cluster-dev --service miyabi-service-dev --desired-count 0
# Wait 30 seconds
aws ecs update-service --cluster miyabi-cluster-dev --service miyabi-service-dev --desired-count 2
```

### Log Commands

```bash
# Recent errors
aws logs tail /ecs/miyabi-dev --filter-pattern ERROR --since 1h

# Real-time logs
aws logs tail /ecs/miyabi-dev --follow
```

---

**Maintained by**: Miyabi Infrastructure Team
**Version**: 1.0.0

