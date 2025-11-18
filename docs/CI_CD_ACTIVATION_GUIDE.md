# CI/CD Activation Guide

**Last Updated**: 2025-11-18
**Status**: Ready for Activation
**Prerequisites**: All infrastructure PRs merged (#1039-#1041, #1052-#1054, #1008)

---

## 🎯 Overview

This guide walks you through activating the complete CI/CD infrastructure deployed across 7 merged PRs. Once complete, you'll have:

- ✅ Automated 10-phase deployment pipeline
- ✅ 5-minute production health monitoring with auto-rollback
- ✅ Emergency manual deployment capabilities
- ✅ Docker builds automatically pushed to ECR
- ✅ ECS deployments with health checks
- ✅ Team notifications via Lark

**Estimated Time**: 30-45 minutes
**Difficulty**: Intermediate

---

## 📊 Current Infrastructure Status

### Deployed & Ready
- ✅ AWS Infrastructure (70 resources in us-west-2)
- ✅ GitHub Actions Workflows (3 workflows defined)
- ✅ Terraform Modules (EC2 runners, SSE gateway)
- ✅ Docker Configuration (Health checks enabled)
- ✅ Web API Enhancements (Caching, WebSockets, Logging)
- ✅ Comprehensive Documentation (14 KB+ guides)

### Requires Configuration
- ⚙️ GitHub Repository Secrets (5 required)
- ⚙️ CloudFront Distribution IDs (6 placeholders)
- ⚙️ Lark Webhook Configuration (notifications)

---

## 🚀 Phase 1: Configure GitHub Secrets (Required)

### Step 1.1: Access GitHub Repository Settings

```bash
# Navigate to repository in browser
open https://github.com/customer-cloud/miyabi-private/settings/secrets/actions
```

### Step 1.2: Add Required Secrets

Click "New repository secret" for each:

#### Secret 1: AWS_ACCESS_KEY_ID
```
Name: AWS_ACCESS_KEY_ID
Value: <Your AWS Access Key ID>
```

**How to Obtain**:
```bash
# From MUGEN or any AWS-configured environment
aws configure get aws_access_key_id
```

#### Secret 2: AWS_SECRET_ACCESS_KEY
```
Name: AWS_SECRET_ACCESS_KEY
Value: <Your AWS Secret Access Key>
```

**How to Obtain**:
```bash
aws configure get aws_secret_access_key
```

#### Secret 3: AWS_ACCOUNT_ID
```
Name: AWS_ACCOUNT_ID
Value: 211234825975
```

**Note**: This is the deployed infrastructure account ID.

#### Secret 4: LARK_WEBHOOK_URL
```
Name: LARK_WEBHOOK_URL
Value: <Your Lark Bot Webhook URL>
```

**How to Obtain**:
1. Open Lark and navigate to your bot
2. Settings → Webhooks → Copy URL
3. Format: `https://open.larksuite.com/open-apis/bot/v2/hook/...`

#### Secret 5: LARK_ESCALATION_EMAIL
```
Name: LARK_ESCALATION_EMAIL
Value: <Your email for critical alerts>
```

**Example**: `devops@your company.com` or your personal email

### Step 1.3: Verify Secrets

```bash
# List configured secrets (values hidden)
gh secret list
```

**Expected Output**:
```
AWS_ACCESS_KEY_ID         Updated 2025-11-18
AWS_SECRET_ACCESS_KEY     Updated 2025-11-18
AWS_ACCOUNT_ID            Updated 2025-11-18
LARK_WEBHOOK_URL          Updated 2025-11-18
LARK_ESCALATION_EMAIL     Updated 2025-11-18
```

---

## 🌐 Phase 2: Configure CloudFront Distribution IDs

### Step 2.1: Get CloudFront Distribution IDs

**If you don't have CloudFront distributions yet**, you'll need to create them or use placeholder IDs for now.

```bash
# List existing distributions
aws cloudfront list-distributions --query 'DistributionList.Items[*].[Id,Comment]' --output table
```

### Step 2.2: Update Workflow Files

Edit the following files to replace placeholder IDs:

#### File 1: `.github/workflows/ci-cd-main.yml`

**Lines to update** (approximately line 350-370):

```yaml
# PRODUCTION CloudFront IDs
- name: Deploy Console to Production CloudFront
  run: |
    aws cloudfront create-invalidation \
      --distribution-id E1234567890ABC \  # ← REPLACE THIS
      --paths "/*"

- name: Deploy Pantheon to Production CloudFront
  run: |
    aws cloudfront create-invalidation \
      --distribution-id E0987654321XYZ \  # ← REPLACE THIS
      --paths "/*"
```

**Replacement**:
- `E1234567890ABC` → Your **Console** distribution ID (production)
- `E0987654321XYZ` → Your **Pantheon** distribution ID (production)

#### File 2: `.github/workflows/deploy-manual.yml`

**Lines to update** (approximately line 280-320):

```yaml
# DEV Environment
if [ "$ENVIRONMENT" == "dev" ]; then
  CONSOLE_DIST="E3234567890GHI"    # ← REPLACE THIS
  PANTHEON_DIST="E2987654321RST"   # ← REPLACE THIS
# STAGING Environment
elif [ "$ENVIRONMENT" == "staging" ]; then
  CONSOLE_DIST="E2234567890DEF"    # ← REPLACE THIS
  PANTHEON_DIST="E1987654321UVW"   # ← REPLACE THIS
# PRODUCTION Environment
elif [ "$ENVIRONMENT" == "production" ]; then
  CONSOLE_DIST="E1234567890ABC"    # ← REPLACE THIS
  PANTHEON_DIST="E0987654321XYZ"   # ← REPLACE THIS
fi
```

### Step 2.3: Commit CloudFront ID Updates

```bash
git add .github/workflows/ci-cd-main.yml
git add .github/workflows/deploy-manual.yml
git commit -m "chore(ci): Update CloudFront distribution IDs"
git push origin docs/ci-cd-activation-guide
```

---

## 🔍 Phase 3: Verify Infrastructure (Pre-flight Check)

### Step 3.1: Check AWS Resources

```bash
# From MUGEN or AWS CLI-configured environment

# 1. Verify ECS Cluster
aws ecs describe-clusters \
  --clusters miyabi-cluster-dev \
  --region us-west-2 \
  --query 'clusters[0].status'
# Expected: ACTIVE

# 2. Verify ECR Repository
aws ecr describe-repositories \
  --repository-names miyabi-web-api \
  --region us-west-2 \
  --query 'repositories[0].repositoryUri'
# Expected: 211234825975.dkr.ecr.us-west-2.amazonaws.com/miyabi-web-api

# 3. Verify RDS Instance
aws rds describe-db-instances \
  --db-instance-identifier miyabi-db-dev \
  --region us-west-2 \
  --query 'DBInstances[0].DBInstanceStatus'
# Expected: available

# 4. Verify ElastiCache Cluster
aws elasticache describe-cache-clusters \
  --cache-cluster-id miyabi-redis-dev \
  --region us-west-2 \
  --query 'CacheClusters[0].CacheClusterStatus'
# Expected: available

# 5. Verify ALB
aws elbv2 describe-load-balancers \
  --names miyabi-alb-dev \
  --region us-west-2 \
  --query 'LoadBalancers[0].State.Code'
# Expected: active
```

### Step 3.2: Test ALB Health Endpoint

```bash
# Test ALB connectivity
curl -v http://miyabi-alb-dev-1086396144.us-west-2.elb.amazonaws.com/health

# Expected Response:
# HTTP/1.1 200 OK
# {"status":"healthy","timestamp":"2025-11-18T..."}
```

**If ALB returns 503**: ECS tasks not running yet (normal for fresh deployment)

---

## 🧪 Phase 4: Test CI/CD Pipeline (First Run)

### Step 4.1: Create Test Feature Branch

```bash
# Create a test branch
git checkout -b test/ci-cd-pipeline
```

### Step 4.2: Make a Trivial Change

```bash
# Add a comment to trigger CI/CD
echo "# CI/CD Test - $(date)" >> README.md
git add README.md
git commit -m "test(ci): Trigger CI/CD pipeline test run"
```

### Step 4.3: Push and Monitor

```bash
# Push to trigger workflow
git push origin test/ci-cd-pipeline

# Monitor workflow in browser
open https://github.com/customer-cloud/miyabi-private/actions
```

### Step 4.4: Observe Workflow Phases

The workflow should execute 10 phases:

| Phase | Duration | Status Check |
|-------|----------|--------------|
| 1. Quality Check | ~2 min | rustfmt, clippy |
| 2. Security Audit | ~1 min | cargo-audit, cargo-deny |
| 3. Backend Tests | ~5 min | PostgreSQL + Redis tests |
| 4. Frontend Tests | ~3 min | Console + Pantheon |
| 5. E2E Tests | ~4 min | Playwright |
| 6. Docker Build | ~8 min | Build + Push to ECR |
| 7. Backend Deploy | ~3 min | ECS deployment |
| 8. Frontend Deploy | ~2 min | S3 + CloudFront |
| 9. Smoke Tests | ~1 min | Health checks |
| 10. Notifications | <1 min | Lark messages |

**Total Expected Time**: ~30 minutes

### Step 4.5: Check Lark Notifications

You should receive 3 Lark messages:

1. **Workflow Started**: "CI/CD Pipeline Started for test/ci-cd-pipeline"
2. **Progress Updates**: Phase completions
3. **Workflow Complete**: "✅ CI/CD Pipeline Completed Successfully"

---

## 🔄 Phase 5: Enable Auto-Rollback Monitoring

### Step 5.1: Review Auto-Rollback Workflow

```bash
# View the workflow
cat .github/workflows/auto-rollback.yml | grep -A 5 "schedule:"
```

**Current Schedule**: Every 5 minutes (`*/5 * * * *`)

### Step 5.2: Test Manual Rollback Trigger

```bash
# Trigger manual health check (without waiting for cron)
gh workflow run auto-rollback.yml \
  --field environment=dev

# Monitor execution
gh run list --workflow=auto-rollback.yml --limit 1
```

### Step 5.3: Verify Health Check Logic

The workflow will:
1. Check backend health endpoint (3 retries, 30s intervals)
2. If all retries fail → Trigger automatic rollback
3. Send emergency Lark notification
4. Roll back ECS service to previous task definition

---

## 🛠️ Phase 6: Test Emergency Manual Deployment

### Step 6.1: Review Manual Deployment Workflow

```bash
# View available options
cat .github/workflows/deploy-manual.yml | grep -A 20 "workflow_dispatch:"
```

### Step 6.2: Trigger Manual Deployment

```bash
# Example: Deploy backend to staging
gh workflow run deploy-manual.yml \
  --field environment=staging \
  --field component=backend \
  --field skip_tests=false

# Monitor execution
gh run list --workflow=deploy-manual.yml --limit 1
```

### Step 6.3: Test Emergency Hotfix

```bash
# Example: Emergency production hotfix (skip tests)
gh workflow run deploy-manual.yml \
  --field environment=production \
  --field component=backend \
  --field skip_tests=true \
  --field rollback_version=""  # Leave empty for latest

# ⚠️ WARNING: Use skip_tests=true only for critical hotfixes!
```

---

## 📊 Phase 7: Monitoring & Observability

### Step 7.1: Configure CloudWatch Alarms

```bash
# SSH to MUGEN
ssh ubuntu@44.250.27.197

# Navigate to Terraform
cd ~/infrastructure/terraform/environments/dev

# Apply monitoring configuration
terraform plan -target=module.monitoring
terraform apply -target=module.monitoring
```

### Step 7.2: Key Metrics to Monitor

| Metric | Threshold | Action |
|--------|-----------|--------|
| **ECS CPU** | > 80% for 5 min | Scale up tasks |
| **ECS Memory** | > 85% for 5 min | Scale up tasks |
| **ALB Unhealthy Targets** | > 0 for 2 min | Alert team |
| **RDS Connections** | > 80 | Investigate queries |
| **Redis Memory** | > 90% | Increase cache size |

### Step 7.3: Access CloudWatch Dashboard

```bash
# Open CloudWatch dashboard
open "https://us-west-2.console.aws.amazon.com/cloudwatch/home?region=us-west-2#dashboards:name=miyabi-dev"
```

---

## ✅ Phase 8: Validation Checklist

### Infrastructure
- [ ] All AWS resources in `available` state
- [ ] ALB health endpoint returns 200 OK
- [ ] ECS tasks running (at least 1 per service)
- [ ] RDS and Redis accessible from ECS

### GitHub Secrets
- [ ] All 5 secrets configured correctly
- [ ] Secret values verified (test deployment successful)

### CloudFront
- [ ] Distribution IDs updated in workflows
- [ ] Invalidation commands tested

### CI/CD Workflows
- [ ] Main pipeline executes all 10 phases
- [ ] Test deployment completes successfully
- [ ] Lark notifications received
- [ ] Auto-rollback monitoring active

### Manual Operations
- [ ] Manual deployment workflow tested
- [ ] Emergency hotfix procedure documented
- [ ] Rollback tested on staging

---

## 🚨 Troubleshooting

### Issue 1: GitHub Secrets Not Working

**Symptom**: Workflow fails with "AWS credentials not found"

**Solution**:
```bash
# Verify secrets are set
gh secret list

# Re-add the secret
gh secret set AWS_ACCESS_KEY_ID < ~/.aws/credentials
```

### Issue 2: Docker Build Fails

**Symptom**: "error building image"

**Solution**:
```bash
# Check ECR repository exists
aws ecr describe-repositories \
  --repository-names miyabi-web-api \
  --region us-west-2

# If not exists, create it
aws ecr create-repository \
  --repository-name miyabi-web-api \
  --region us-west-2
```

### Issue 3: ECS Deployment Timeout

**Symptom**: "ECS service did not stabilize"

**Solution**:
```bash
# Check ECS task logs
aws logs tail /aws/ecs/miyabi-dev --follow

# Check task stopped reason
aws ecs describe-tasks \
  --cluster miyabi-cluster-dev \
  --tasks $(aws ecs list-tasks --cluster miyabi-cluster-dev --query 'taskArns[0]' --output text) \
  --query 'tasks[0].containers[0].reason'
```

### Issue 4: Health Check Failures

**Symptom**: Auto-rollback triggered unexpectedly

**Solution**:
```bash
# Check application logs
aws logs tail /aws/ecs/miyabi-dev --follow --filter-pattern "ERROR"

# Verify database connectivity
aws rds describe-db-instances \
  --db-instance-identifier miyabi-db-dev \
  --query 'DBInstances[0].Endpoint'
```

---

## 📚 Related Documentation

- **Main CI/CD Guide**: `.github/workflows/AUTOMATION_GUIDE.md` (14 KB)
- **AWS Infrastructure**: `docs/infrastructure/aws-deployment-summary.md` (11 KB)
- **Docker Build Guide**: `.ai/runbooks/docker-build-push-ecr.md`
- **Terraform Modules**: `infrastructure/terraform/modules/*/README.md`
- **Emergency Procedures**: `.github/workflows/deploy-manual.yml` (comments)

---

## 🎯 Next Steps

After completing this activation guide:

1. **Production Deployment**:
   - Create production environment variables
   - Enable multi-AZ for RDS and ElastiCache
   - Configure ACM certificate for HTTPS
   - Update ALB listener for SSL termination

2. **Security Hardening**:
   - Enable AWS GuardDuty
   - Configure AWS WAF rules
   - Set up VPC Flow Logs
   - Review IAM policies for least privilege

3. **Cost Optimization**:
   - Review CloudWatch metrics for right-sizing
   - Consider Reserved Instances for stable workloads
   - Implement S3 lifecycle policies
   - Use AWS Cost Explorer for analysis

4. **Team Onboarding**:
   - Document runbook procedures
   - Train team on emergency procedures
   - Set up on-call rotation
   - Create incident response playbooks

---

## 💰 Cost Impact

**Development Environment**: ~$108/month
**With CI/CD Active**: ~$613/month (includes self-hosted runners)
**Estimated Savings**: ~$576/year in GitHub Actions minutes

**ROI Timeline**: 13 months

---

## 📞 Support & Contact

**Primary Maintainer**: DevOps Team
**Emergency Contact**: LARK_ESCALATION_EMAIL
**Issue Tracker**: https://github.com/customer-cloud/miyabi-private/issues

---

**Version**: 1.0
**Last Validated**: 2025-11-18
**Next Review**: 2025-12-18

🚀 **Infrastructure Deployment Complete - Ready for Production!**
