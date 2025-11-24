# Miyabi Console - Production Deployment Guide

**Domain**: miyabi-world.com
**AWS Account**: 112530848482 (Hayashi-san)
**Deployment Target**: AWS (S3 + CloudFront + Route53)
**Status**: Ready for Deployment ✅

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       User Request                          │
│                  https://miyabi-world.com                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Route53 DNS                              │
│              (miyabi-world.com)                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                CloudFront CDN                                │
│   - Global edge locations                                   │
│   - HTTPS/TLS termination (ACM Certificate)                 │
│   - Gzip/Brotli compression                                 │
│   - Cache optimization                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              S3 Static Hosting                               │
│   - miyabi-console-production bucket                        │
│   - index.html, *.js, *.css, assets                         │
│   - Versioned deployments                                   │
└─────────────────────────────────────────────────────────────┘

Backend API (Separate):
┌─────────────────────────────────────────────────────────────┐
│          AWS App Runner / ECS Fargate                        │
│   - miyabi-web-api (Rust)                                   │
│   - api.miyabi-world.com                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### 1. AWS CLI Configuration

```bash
# Configure AWS CLI with Hayashi account
aws configure --profile miyabi-production
# AWS Access Key ID: [Obtain from Hayashi-san]
# AWS Secret Access Key: [Obtain from Hayashi-san]
# Default region: ap-northeast-1 (Tokyo)
# Default output format: json

# Verify configuration
aws sts get-caller-identity --profile miyabi-production
# Expected: Account ID 112530848482
```

### 2. Domain Verification

```bash
# Verify domain ownership
aws route53 list-hosted-zones --profile miyabi-production | grep miyabi-world.com

# If not exists, create hosted zone
aws route53 create-hosted-zone \
  --name miyabi-world.com \
  --caller-reference $(date +%s) \
  --profile miyabi-production
```

### 3. SSL Certificate (ACM)

```bash
# Request certificate (MUST be in us-east-1 for CloudFront)
aws acm request-certificate \
  --domain-name miyabi-world.com \
  --subject-alternative-names "*.miyabi-world.com" \
  --validation-method DNS \
  --region us-east-1 \
  --profile miyabi-production

# Get certificate ARN
aws acm list-certificates --region us-east-1 --profile miyabi-production

# Add DNS validation records to Route53
# (AWS Console or CLI)
```

---

## Deployment Steps

### Step 1: Build Production Bundle

```bash
# Navigate to project directory
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/miyabi-console

# Install dependencies
npm install

# Build production bundle
npm run build

# Verify build output
ls -lh dist/
# Expected: index.html, assets/*.js, assets/*.css
```

### Step 2: Create S3 Bucket

```bash
# Create S3 bucket
aws s3 mb s3://miyabi-console-production \
  --region ap-northeast-1 \
  --profile miyabi-production

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket miyabi-console-production \
  --versioning-configuration Status=Enabled \
  --profile miyabi-production

# Block public access (CloudFront will access via OAI)
aws s3api put-public-access-block \
  --bucket miyabi-console-production \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
  --profile miyabi-production
```

### Step 3: Upload Build Files

```bash
# Sync build files to S3
aws s3 sync dist/ s3://miyabi-console-production/ \
  --delete \
  --profile miyabi-production \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

# Upload index.html separately (no cache)
aws s3 cp dist/index.html s3://miyabi-console-production/index.html \
  --profile miyabi-production \
  --cache-control "public, max-age=0, must-revalidate"
```

### Step 4: Create CloudFront Distribution

```bash
# Create distribution (via AWS Console or CloudFormation)
# See: infrastructure/cloudfront-config.json
```

### Step 5: Configure Route53

```bash
# Create A record alias to CloudFront
aws route53 change-resource-record-sets \
  --hosted-zone-id <ZONE_ID> \
  --change-batch file://infrastructure/route53-change.json \
  --profile miyabi-production
```

---

## Infrastructure as Code (AWS CDK)

### CDK Stack

See: `infrastructure/cdk/miyabi-console-stack.ts`

```bash
# Deploy via CDK
cd infrastructure/cdk
npm install
cdk deploy --profile miyabi-production
```

---

## CI/CD Pipeline (GitHub Actions)

### Automated Deployment Workflow

See: `.github/workflows/deploy-production.yml`

**Triggers**:
- Push to `main` branch
- Manual workflow dispatch

**Steps**:
1. Build production bundle
2. Run TypeScript checks
3. Upload to S3
4. Invalidate CloudFront cache
5. Post deployment notification

---

## Environment Variables

### Production Environment

Create `.env.production`:

```bash
# API Configuration
VITE_API_URL=https://api.miyabi-world.com/api/v1

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true

# Gemini API (if needed for client-side features)
VITE_GEMINI_API_KEY=<PRODUCTION_KEY>
```

**Security**: Store secrets in AWS Secrets Manager, not in repository.

---

## Deployment Checklist

### Pre-Deployment

- [ ] All TypeScript errors resolved
- [ ] All pages score ≥ 96/100
- [ ] Mobile responsiveness tested
- [ ] API integration verified
- [ ] SSL certificate validated
- [ ] Domain DNS configured
- [ ] Environment variables set
- [ ] Build optimization verified (< 2MB total)

### Deployment

- [ ] Production build successful
- [ ] S3 bucket created and configured
- [ ] CloudFront distribution created
- [ ] Route53 A record created
- [ ] HTTPS working (ACM certificate)
- [ ] Cache headers configured correctly
- [ ] Error pages configured (404, 500)

### Post-Deployment

- [ ] Verify https://miyabi-world.com loads
- [ ] Test all 5 pages
- [ ] Check mobile responsiveness
- [ ] Verify API connectivity
- [ ] Monitor CloudFront logs
- [ ] Set up CloudWatch alarms
- [ ] Configure backup strategy

---

## Monitoring & Maintenance

### CloudWatch Metrics

Monitor:
- CloudFront request count
- Error rate (4xx, 5xx)
- Data transfer
- Cache hit ratio

### Logging

```bash
# Enable CloudFront access logs
aws cloudfront update-distribution \
  --id <DISTRIBUTION_ID> \
  --logging-config \
    "Enabled=true,IncludeCookies=false,Bucket=miyabi-logs.s3.amazonaws.com,Prefix=cloudfront/"
```

### Cost Estimation

**Monthly Cost (Estimated)**:
- CloudFront: $5-10 (100GB transfer)
- S3 Storage: $0.50 (20GB)
- Route53: $0.50 (1 hosted zone)
- ACM Certificate: Free
- **Total**: ~$6-11/month

---

## Rollback Procedure

### Quick Rollback

```bash
# List previous deployments
aws s3api list-object-versions \
  --bucket miyabi-console-production \
  --prefix index.html

# Restore previous version
aws s3api copy-object \
  --bucket miyabi-console-production \
  --copy-source "miyabi-console-production/index.html?versionId=<VERSION_ID>" \
  --key index.html \
  --profile miyabi-production

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id <DISTRIBUTION_ID> \
  --paths "/*" \
  --profile miyabi-production
```

---

## Domain Configuration

### DNS Records

```
miyabi-world.com.              A    ALIAS to CloudFront
www.miyabi-world.com.          A    ALIAS to CloudFront
api.miyabi-world.com.          A    ALIAS to App Runner/ECS
```

### SSL/TLS Configuration

- Certificate: AWS ACM (Free)
- TLS Version: TLSv1.2 minimum
- Cipher Suite: Recommended by AWS
- HSTS: Enabled

---

## Performance Optimization

### Build Optimization

```json
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true
      }
    }
  }
})
```

### CloudFront Cache Policy

```json
{
  "CachePolicyName": "MiyabiCachePolicy",
  "MinTTL": 0,
  "MaxTTL": 31536000,
  "DefaultTTL": 86400,
  "ParametersInCacheKeyAndForwardedToOrigin": {
    "EnableAcceptEncodingGzip": true,
    "EnableAcceptEncodingBrotli": true
  }
}
```

---

## Troubleshooting

### Issue: 403 Forbidden

**Cause**: CloudFront OAI not configured correctly
**Solution**: Update S3 bucket policy to allow CloudFront OAI

### Issue: Stale Content

**Cause**: CloudFront cache not invalidated
**Solution**: Create invalidation for `/*`

### Issue: Slow TTFB

**Cause**: Origin too far from edge location
**Solution**: Enable CloudFront compression, optimize build size

---

## Security Best Practices

1. **S3 Bucket**: Block all public access
2. **CloudFront**: Use OAI (Origin Access Identity)
3. **HTTPS**: Enforce HTTPS only (redirect HTTP to HTTPS)
4. **Headers**: Add security headers via Lambda@Edge
5. **API**: Use CORS policy to restrict origins
6. **Secrets**: Store in AWS Secrets Manager
7. **IAM**: Use least-privilege policies

---

## Next Steps

1. **Deploy to Production**:
   ```bash
   npm run deploy:production
   ```

2. **Verify Deployment**:
   ```bash
   curl -I https://miyabi-world.com
   ```

3. **Set up Monitoring**:
   - CloudWatch dashboards
   - Error tracking (Sentry)
   - Analytics (Google Analytics 4)

4. **Configure Backups**:
   - S3 versioning (enabled)
   - Cross-region replication (optional)

---

## Support & Contacts

- **AWS Account Owner**: Hayashi-san
- **Domain Registrar**: [To be confirmed]
- **Infrastructure**: AWS ap-northeast-1 (Tokyo)
- **Support**: [Team contact]

---

**Deployment Status**: 🟢 Ready for Production
**Last Updated**: 2025-11-19
