# Miyabi Society Backend - Infrastructure Status Report

**Date**: 2025-11-26
**Progress**: 85% Complete (11/13 tasks)
**Status**: Lambda deployed, debugging HTTP 500 errors

---

## 📊 Architecture Overview

```
Users → Internet → API Gateway → Lambda → RDS PostgreSQL
                      ↓
                  CloudWatch Logs
                      ↓
                  IAM Role
```

**View**: Open `infrastructure-diagram.drawio` in draw.io for detailed visualization

---

## ✅ Deployed Components

### 1. API Gateway HTTP API
- **ID**: `2zdtm81iyl`
- **Endpoint**: `https://2zdtm81iyl.execute-api.us-east-1.amazonaws.com`
- **Protocol**: HTTP API (not REST API)
- **Region**: us-east-1
- **Status**: ✅ Operational

### 2. AWS Lambda Function
- **Name**: `miyabi-api-production`
- **Runtime**: `provided.al2` (Custom Rust Runtime)
- **Handler**: `bootstrap`
- **Memory**: 512 MB
- **Timeout**: 30 seconds
- **Package Size**: 4.8 MB (compressed from 11 MB)
- **Environment Variables**:
  - `DATABASE_URL`: PostgreSQL connection string (SSL required)
  - `JWT_SECRET`: Authentication secret
  - `RUST_LOG`: info
- **Status**: ⚠️ Deployed but returning HTTP 500 errors

### 3. IAM Execution Role
- **Name**: `miyabi-lambda-execution-role`
- **ARN**: `arn:aws:iam::211234825975:role/miyabi-lambda-execution-role`
- **Attached Policies**:
  - `AWSLambdaBasicExecutionRole` (includes CloudWatch Logs permissions)
- **Status**: ✅ Configured

### 4. Amazon RDS PostgreSQL
- **Instance ID**: `miyabi-postgres-prod`
- **Endpoint**: `miyabi-postgres-prod.cileaca4iesh.us-east-1.rds.amazonaws.com:5432`
- **Engine**: PostgreSQL 15.15
- **Instance Class**: db.t3.small
- **Storage**: 20 GB GP3 (3000 IOPS, 125 MB/s throughput)
- **Database Name**: `miyabi`
- **Username**: `miyabi_admin`
- **Multi-AZ**: No
- **Publicly Accessible**: Yes
- **SSL/TLS**: Required (`sslmode=require`)
- **Backup Retention**: 7 days
- **Migrations Applied**: 7/7 ✅
- **Status**: ✅ Available

### 5. Security Group
- **ID**: `sg-065ba77c858a02964`
- **Inbound Rules**: PostgreSQL (5432) from anywhere (0.0.0.0/0)
- **VPC**: Default VPC
- **Subnets**: 6 availability zones (us-east-1a through us-east-1f)
- **Status**: ✅ Configured

### 6. CloudWatch Logs
- **Log Group**: `/aws/lambda/miyabi-api-production`
- **Status**: ⚠️ Created but no logs appearing

---

## 🔧 Build & Deployment Details

### Build Server (MUGEN)
- **Host**: MacBook @ 44.250.27.197
- **Build Command**: `cargo build --release --bin lambda-api --features lambda`
- **Build Time**: 3 minutes 41 seconds
- **Binary Size**: 11 MB (uncompressed) → 4.8 MB (zip compressed)
- **Compression Ratio**: 58% deflation

### Deployment Process
1. ✅ Built lambda-api binary on MUGEN (3m 41s)
2. ✅ Copied binary to `bootstrap` (Lambda convention)
3. ✅ Created bootstrap.zip package
4. ✅ Downloaded to local machine (4.8 MB)
5. ✅ Created IAM execution role
6. ✅ Deployed Lambda function via AWS CLI
7. ✅ Created API Gateway HTTP API
8. ✅ Configured Lambda integration

---

## ⚠️ Current Issues

### Issue #1: Lambda HTTP 500 Errors
**Symptom**: All API requests return `{"message":"Internal Server Error"}`

**Potential Causes**:
1. **Database Connection Timeout**: Lambda may not be able to reach RDS
   - Lambda is not in a VPC
   - RDS is publicly accessible
   - Security group allows all inbound traffic on 5432

2. **App Initialization Issue**: Lambda creates new app on every invocation
   - Each invocation calls `create_app()` which initializes DB pool
   - This is inefficient and may timeout
   - Should use lazy_static or once_cell for app initialization

3. **Environment Variable Issue**: DATABASE_URL may be malformed
   - Current: `postgresql://miyabi_admin:***@miyabi-postgres-prod.cileaca4iesh.us-east-1.rds.amazonaws.com:5432/miyabi?sslmode=require`
   - Should verify format is correct for lambda_http

4. **Missing Dependencies**: Lambda runtime may be missing required libraries
   - OpenSSL/TLS libraries
   - PostgreSQL client libraries

### Issue #2: No CloudWatch Logs
**Symptom**: Log group exists but contains no log streams

**Potential Causes**:
1. Lambda function may be crashing before logging initializes
2. Initialization failure prevents tracing setup
3. Runtime error occurs before first log statement

---

## 🔍 Debugging Steps (Next)

### Step 1: Check Lambda Configuration
```bash
aws lambda get-function-configuration \
  --function-name miyabi-api-production \
  --region us-east-1
```

### Step 2: Test Database Connectivity from Lambda VPC
Since Lambda is not in a VPC, it should be able to reach the public RDS endpoint.
Test connectivity:
```bash
# From local machine (to verify endpoint works)
psql "$DATABASE_URL" -c "SELECT version();"
```

### Step 3: Enable Debug Logging
Update Lambda environment variable:
```bash
aws lambda update-function-configuration \
  --function-name miyabi-api-production \
  --environment Variables="{DATABASE_URL=$DATABASE_URL,JWT_SECRET=$JWT_SECRET,RUST_LOG=debug}"
```

### Step 4: Add VPC Configuration (if needed)
If Lambda needs to be in VPC to access RDS:
1. Create VPC endpoints for Lambda
2. Update Lambda function to use VPC
3. Configure security groups for Lambda → RDS communication

### Step 5: Optimize Lambda Cold Start
Refactor `lambda-api.rs` to:
- Use `lazy_static!` or `once_cell::sync::Lazy` for app initialization
- Create DB pool once, reuse across invocations
- Reduce cold start time from ~5s to <1s

---

## 💰 Cost Estimation

| Resource | Configuration | Monthly Cost |
|----------|--------------|--------------|
| Lambda | 1M requests, 512MB, avg 1s execution | $0.20 (compute) + $0.20 (requests) = **$0.40** |
| API Gateway | 1M requests | **$1.00** |
| RDS PostgreSQL | db.t3.small, 20GB GP3, Single-AZ | **$24.82** (instance) + **$2.30** (storage) = **$27.12** |
| Data Transfer | Estimated 10GB/month | **$0.90** |
| CloudWatch Logs | 1GB logs/month | **$0.50** |
| **Total** | | **~$29.92/month** |

**Note**: Costs will be lower initially as traffic ramps up.

---

## 📈 Migration Status

All database migrations successfully applied:

1. ✅ `20251024000000_initial_schema.sql` (4.5KB) - Base tables
2. ✅ `20251024000001_execution_logs.sql` (1.1KB) - Execution tracking
3. ✅ `20251120000000_create_tasks_table.sql` (3.3KB) - Task management
4. ✅ `20251123000000_fix_github_id_type.sql` - GitHub ID type fix
5. ✅ `20251123000001_fix_timestamp_types.sql` - Timestamp standardization
6. ✅ `20251125000000_organizations_teams.sql` (8.1KB) - Org structure
7. ✅ `20251125000001_rbac_permissions.sql` (13KB) - RBAC system

**Total migration time**: ~6 seconds

---

## 🚀 Next Steps

### Immediate (Debug Lambda)
1. [ ] Investigate Lambda CloudWatch logs (empty)
2. [ ] Test RDS connectivity from Lambda
3. [ ] Verify DATABASE_URL format
4. [ ] Add debug logging
5. [ ] Check Lambda runtime initialization

### Short-term (Optimize)
1. [ ] Refactor Lambda handler for connection pooling
2. [ ] Implement proper error handling
3. [ ] Add API Gateway request validation
4. [ ] Configure CloudWatch alarms

### Long-term (Production Ready)
1. [ ] Update CloudFront API_BASE to API Gateway endpoint
2. [ ] Redeploy frontend with new API endpoint
3. [ ] Set up Multi-AZ RDS for high availability
4. [ ] Implement Lambda VPC configuration
5. [ ] Add X-Ray tracing
6. [ ] Set up automated backups
7. [ ] Configure auto-scaling for RDS
8. [ ] Implement API rate limiting

---

## 📝 Configuration Files

### Deployment Configuration
**Location**: `config/lambda-production.env`

Contains:
- Lambda function name and ARN
- IAM role ARN
- API Gateway ID and endpoint
- DATABASE_URL (sensitive)
- JWT_SECRET (sensitive)
- AWS region

**⚠️ DO NOT COMMIT**: This file contains production credentials

### Database Credentials
- `config/.database-url-prod.txt` - Full PostgreSQL connection string
- `config/.db-password-prod.txt` - RDS master password
- `config/.jwt-secret-production.txt` - JWT authentication secret

**⚠️ All credential files are in .gitignore**

---

## 🔗 Quick Links

**API Endpoints**:
- Health Check: `https://2zdtm81iyl.execute-api.us-east-1.amazonaws.com/api/v1/health`
- Base URL: `https://2zdtm81iyl.execute-api.us-east-1.amazonaws.com`

**AWS Console Links** (us-east-1):
- [Lambda Function](https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions/miyabi-api-production)
- [API Gateway](https://console.aws.amazon.com/apigateway/main/apis/2zdtm81iyl/resources?api=2zdtm81iyl&region=us-east-1)
- [RDS Instance](https://console.aws.amazon.com/rds/home?region=us-east-1#database:id=miyabi-postgres-prod)
- [CloudWatch Logs](https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/$252Faws$252Flambda$252Fmiyabi-api-production)

**Monitoring**:
```bash
# Tail Lambda logs (when available)
aws logs tail /aws/lambda/miyabi-api-production --follow --region us-east-1

# Check Lambda metrics
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

---

**Report Generated**: 2025-11-26 04:30:00 UTC
**AWS Account**: 211234825975
**Region**: us-east-1
**Project**: Miyabi Society Backend (Phase 0)
