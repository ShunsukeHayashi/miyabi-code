# Pantheon Webapp Deployment Guide

**Issue**: #993 - Phase 4.6: Production Launch

## Overview

This document describes the deployment process for the Pantheon Webapp to AWS (S3 + CloudFront).

## Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│   Users     │────▶│   CloudFront    │────▶│  S3 Bucket  │
└─────────────┘     │  Distribution   │     │  (Static)   │
                    └────────┬────────┘     └─────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Lambda API     │
                    │  (miyabi-web)   │
                    └─────────────────┘
```

## Prerequisites

### 1. AWS Resources

The following resources must be provisioned using Terraform:

```hcl
module "pantheon_frontend" {
  source = "../../modules/frontend-hosting"

  project_name   = "pantheon"
  environment    = "production"
  domain_names   = ["pantheon.miyabi.example.com"]

  acm_certificate_arn = "arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID"
}
```

### 2. GitHub Secrets & Variables

Configure the following in GitHub repository settings:

**Secrets** (Settings → Secrets and variables → Actions → Secrets):
- `AWS_ACCESS_KEY_ID` - AWS access key with S3/CloudFront permissions
- `AWS_SECRET_ACCESS_KEY` - AWS secret key

**Variables** (Settings → Secrets and variables → Actions → Variables):
- `S3_BUCKET_STAGING` - S3 bucket name for staging
- `S3_BUCKET_PRODUCTION` - S3 bucket name for production
- `CLOUDFRONT_DISTRIBUTION_STAGING` - CloudFront distribution ID for staging
- `CLOUDFRONT_DISTRIBUTION_PRODUCTION` - CloudFront distribution ID for production
- `NEXT_PUBLIC_API_URL` - Production API URL
- `NEXT_PUBLIC_WS_URL` - Production WebSocket URL
- `NEXT_PUBLIC_GITHUB_CLIENT_ID` - GitHub OAuth App client ID
- `NEXT_PUBLIC_OAUTH_REDIRECT_URL` - OAuth callback URL

### 3. DNS Configuration

Create CNAME or A record pointing to CloudFront distribution:
- `pantheon.miyabi.example.com` → `d1234567890abc.cloudfront.net`

## Deployment Process

### Automatic Deployment (CI/CD)

Deployments are automatically triggered by:

1. **Push to main** (changes to `apps/pantheon-webapp/`)
   - Builds application
   - Runs E2E tests
   - Deploys to staging

2. **Manual workflow dispatch**
   - Select environment (staging/production)
   - Runs full pipeline including production deployment

### Manual Deployment

```bash
# 1. Build the application
cd apps/pantheon-webapp
npm ci
npm run build

# 2. Deploy to S3
aws s3 sync .next/static s3://BUCKET/_next/static --delete
aws s3 sync public s3://BUCKET/ --delete

# 3. Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id DISTRIBUTION_ID \
  --paths "/*"
```

## Pre-Launch Checklist

### Infrastructure
- [ ] S3 bucket created with proper permissions
- [ ] CloudFront distribution configured
- [ ] SSL certificate issued and validated
- [ ] DNS records configured
- [ ] CORS settings configured

### Application
- [ ] Environment variables configured
- [ ] API URL pointing to production Lambda
- [ ] GitHub OAuth app configured for production domain
- [ ] All E2E tests passing

### Security
- [ ] S3 bucket public access blocked
- [ ] CloudFront OAC configured
- [ ] HTTPS enforced
- [ ] CSP headers configured

### Monitoring
- [ ] CloudWatch alarms configured
- [ ] Error tracking (Sentry) configured
- [ ] Analytics enabled

## Post-Launch Validation

### Smoke Tests

```bash
# Test homepage
curl -s -o /dev/null -w "%{http_code}" https://pantheon.miyabi.example.com

# Test login page
curl -s -o /dev/null -w "%{http_code}" https://pantheon.miyabi.example.com/login

# Test dashboard
curl -s -o /dev/null -w "%{http_code}" https://pantheon.miyabi.example.com/dashboard

# Test API health
curl -s https://api.miyabi.example.com/api/v1/health
```

### E2E Tests

```bash
cd apps/pantheon-webapp
PLAYWRIGHT_BASE_URL=https://pantheon.miyabi.example.com npm run test:e2e
```

## Rollback Procedure

### Quick Rollback (CloudFront)

1. Find previous S3 object versions
2. Restore previous versions
3. Invalidate CloudFront cache

### Full Rollback (GitHub Actions)

1. Go to Actions → Deploy Pantheon Webapp
2. Select previous successful deployment
3. Re-run workflow

## Troubleshooting

### 403 Forbidden

- Check S3 bucket policy allows CloudFront OAC
- Verify CloudFront OAC is attached to origin
- Check file exists in S3

### CORS Errors

- Verify S3 CORS configuration
- Check CloudFront forwarding headers
- Verify API CORS settings

### Cache Issues

- Create CloudFront invalidation
- Check cache-control headers
- Verify browser cache cleared

## Contact

- **Deployment Issues**: #pantheon-ops channel
- **Application Bugs**: Create GitHub issue
