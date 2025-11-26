# Miyabi Society Backend - Quick Start Guide

**Status**: 86% Complete | **API**: https://2zdtm81iyl.execute-api.us-east-1.amazonaws.com | **Issue**: HTTP 500 (Debugging)

---

## 🎯 Quick Links

### Infrastructure Diagrams
- **draw.io Diagram**: `docs/miyabi-infrastructure.drawio` ⭐ **OPEN THIS FIRST**
- **Alternative**: `docs/infrastructure-diagram.drawio`
- **Status Report**: `docs/infrastructure-status.md`

### AWS Console
- [Lambda Function](https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions/miyabi-api-production)
- [RDS Database](https://console.aws.amazon.com/rds/home?region=us-east-1#database:id=miyabi-postgres-prod)
- [API Gateway](https://console.aws.amazon.com/apigateway/main/apis/2zdtm81iyl?region=us-east-1)
- [CloudWatch Logs](https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/$252Faws$252Flambda$252Fmiyabi-api-production)

### Local Files
- **Lambda Config**: `config/lambda-production.env`
- **DB Password**: `config/.db-password-prod.txt`
- **DATABASE_URL**: `config/.database-url-prod.txt`
- **JWT Secret**: `config/.jwt-secret-production.txt`

---

## 📊 Current Status

```
┌─────────────────────────────────────────────────┐
│ Deployment Progress: 86% (12/14 tasks)         │
│ ✅ Infrastructure: Deployed                      │
│ ⚠️  Lambda: HTTP 500 (Debugging)                │
│ ⏳ CloudFront: Pending                          │
└─────────────────────────────────────────────────┘
```

### Deployed Resources

| Component | Status | Details |
|-----------|--------|---------|
| RDS PostgreSQL | ✅ **Operational** | miyabi-postgres-prod (db.t3.small) |
| Lambda Function | ⚠️ **Debugging** | miyabi-api-production (512MB, 30s) |
| API Gateway | ✅ **Operational** | 2zdtm81iyl (HTTP API) |
| IAM Roles | ✅ **Configured** | miyabi-lambda-execution-role |
| Security Groups | ✅ **Configured** | sg-065ba77c858a02964 |
| CloudWatch Logs | ⚠️ **No Logs** | /aws/lambda/miyabi-api-production |
| Migrations | ✅ **7/7 Applied** | Schema version: 20251125 |

---

## 🚀 How to Open the Diagram

### Method 1: draw.io Web (Recommended)

1. **Open draw.io**:
   ```bash
   open https://app.diagrams.net/
   ```

2. **Load the diagram**:
   - Click "Open Existing Diagram"
   - Navigate to: `docs/miyabi-infrastructure.drawio`
   - ⭐ This is the detailed version with all components

### Method 2: VS Code Extension

1. **Install Extension**:
   ```bash
   code --install-extension hediet.vscode-drawio
   ```

2. **Open Diagram**:
   ```bash
   code docs/miyabi-infrastructure.drawio
   ```

### Method 3: draw.io Desktop App

1. **Download**: https://github.com/jgraph/drawio-desktop/releases
2. **Install** the app
3. **Open**: `docs/miyabi-infrastructure.drawio`

---

## 🔍 What You'll See in the Diagram

The diagram shows:

1. **Internet Layer**
   - Users/Clients accessing the API
   - HTTPS connections

2. **API Gateway Layer** (Green)
   - HTTP API configuration
   - Endpoint details
   - Integration with Lambda

3. **Compute Layer** (Orange)
   - Lambda function details
   - Environment variables
   - Performance metrics
   - IAM roles
   - CloudWatch Logs

4. **Database Layer** (Green)
   - RDS PostgreSQL configuration
   - Security groups
   - Database metrics
   - Migration status

5. **Supporting Info** (Left Side)
   - Build server (MUGEN)
   - Status legend
   - Current issues
   - Progress tracker
   - Cost breakdown

---

## 💰 Cost Summary

```
RDS PostgreSQL:  $27.12/month  (88%)
API Gateway:     $ 1.00/month  ( 3%)
Lambda:          $ 0.40/month  ( 1%)
CloudWatch:      $ 0.50/month  ( 2%)
Data Transfer:   $ 0.90/month  ( 3%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total:           $29.92/month  (100%)
```

**Note**: Actual costs may be lower during initial rollout.

---

## ⚠️ Current Issues

### Issue #1: Lambda HTTP 500 Errors

**Symptom**:
```bash
$ curl https://2zdtm81iyl.execute-api.us-east-1.amazonaws.com/api/v1/health
{"message":"Internal Server Error"}
```

**Potential Causes**:
1. Database connection timeout
2. App initialization issue (creates DB pool on every invocation)
3. Environment variable misconfiguration
4. Missing runtime dependencies

**Debugging Steps**:
```bash
# 1. Check Lambda logs
aws logs tail /aws/lambda/miyabi-api-production --follow --region us-east-1

# 2. Test database connectivity
psql "$(cat config/.database-url-prod.txt)" -c "SELECT version();"

# 3. Check Lambda configuration
aws lambda get-function-configuration \
  --function-name miyabi-api-production \
  --region us-east-1

# 4. Enable debug logging
aws lambda update-function-configuration \
  --function-name miyabi-api-production \
  --environment Variables="{...RUST_LOG=debug...}"
```

### Issue #2: No CloudWatch Logs

**Symptom**: Log group exists but no log streams

**Possible Causes**:
- Lambda crashes before logging initializes
- Tracing setup fails
- Runtime error before first log

---

## 🔧 Quick Commands

### Test API
```bash
# Health check
curl https://2zdtm81iyl.execute-api.us-east-1.amazonaws.com/api/v1/health

# With verbose output
curl -v https://2zdtm81iyl.execute-api.us-east-1.amazonaws.com/api/v1/health
```

### Monitor Lambda
```bash
# Tail logs (when available)
aws logs tail /aws/lambda/miyabi-api-production --follow --region us-east-1

# Get function info
aws lambda get-function --function-name miyabi-api-production --region us-east-1

# Check invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=miyabi-api-production \
  --start-time $(date -u -v-1H +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-east-1
```

### Database Access
```bash
# Connect to RDS
psql "$(cat config/.database-url-prod.txt)"

# Check migrations
psql "$(cat config/.database-url-prod.txt)" -c "\dt"

# Check schema version
psql "$(cat config/.database-url-prod.txt)" -c "SELECT * FROM _sqlx_migrations ORDER BY installed_on DESC;"
```

### Redeploy Lambda
```bash
# Rebuild on MUGEN
ssh mugen "cd ~/miyabi-private && cargo build --release --bin lambda-api --features lambda"

# Package
ssh mugen "cd ~/miyabi-private && mkdir -p target/lambda && cp target/x86_64-unknown-linux-gnu/release/lambda-api target/lambda/bootstrap && cd target/lambda && zip bootstrap.zip bootstrap"

# Download
scp mugen:~/miyabi-private/target/lambda/bootstrap.zip target/lambda/

# Deploy
./scripts/deploy-lambda-simple.sh production
```

---

## 📋 Next Steps

### Immediate (Current Sprint)
- [ ] Debug Lambda HTTP 500 errors
- [ ] Investigate missing CloudWatch logs
- [ ] Verify database connectivity from Lambda
- [ ] Test DATABASE_URL format

### Short-term
- [ ] Optimize Lambda cold start (use connection pooling)
- [ ] Update CloudFront API_BASE
- [ ] Redeploy frontend
- [ ] Set up monitoring and alarms

### Long-term
- [ ] Enable Multi-AZ for RDS
- [ ] Implement VPC for Lambda
- [ ] Add X-Ray tracing
- [ ] Set up auto-scaling
- [ ] Implement API rate limiting

---

## 📚 Documentation Structure

```
docs/
├── miyabi-infrastructure.drawio        ⭐ Main diagram (open this!)
├── infrastructure-diagram.drawio       Alternative diagram
├── infrastructure-status.md            Detailed status report
├── QUICKSTART.md                       This file
└── phase0-investigation-report.md      Initial investigation
```

---

## 🔗 Important URLs

**API Endpoint**:
```
https://2zdtm81iyl.execute-api.us-east-1.amazonaws.com
```

**RDS Endpoint**:
```
miyabi-postgres-prod.cileaca4iesh.us-east-1.rds.amazonaws.com:5432
```

**Lambda ARN**:
```
arn:aws:lambda:us-east-1:211234825975:function:miyabi-api-production
```

**API Gateway ARN**:
```
arn:aws:execute-api:us-east-1:211234825975:2zdtm81iyl
```

---

## 🆘 Getting Help

### Check Logs
1. Lambda logs: `/aws/lambda/miyabi-api-production`
2. RDS logs: Check RDS console under "Logs & events"

### AWS Support
- Account: 211234825975
- Region: us-east-1
- Contact: AWS Support Console

### Documentation
- AWS Lambda: https://docs.aws.amazon.com/lambda/
- API Gateway: https://docs.aws.amazon.com/apigateway/
- RDS PostgreSQL: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/

---

**Last Updated**: 2025-11-26 13:35 UTC
**Progress**: 86% Complete (12/14 tasks)
**Status**: Lambda deployed, debugging HTTP 500 errors
**Next**: Investigate Lambda logs and database connectivity
