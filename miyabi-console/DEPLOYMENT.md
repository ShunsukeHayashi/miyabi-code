# Miyabi Console - AWS Deployment Guide

## Deployment Status

✅ **Deployment Complete** - Development Environment

**Live URL**: http://miyabi-console-dev.s3-website-us-east-1.amazonaws.com

## Infrastructure Details

### S3 Static Website Hosting

- **Bucket Name**: `miyabi-console-dev`
- **Region**: `us-east-1`
- **AWS Account**: `112530848482`
- **Hosting Type**: S3 Static Website

### Configuration

- **Index Document**: `index.html`
- **Error Document**: `index.html` (for React Router support)
- **Public Access**: Enabled for static website hosting
- **Cache Control**:
  - Assets (CSS/JS): `public,max-age=31536000` (1 year)
  - index.html: `no-cache,no-store,must-revalidate`

## Deployment Script

Use the included `deploy-to-aws.sh` script for deployments:

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/miyabi-console
./deploy-to-aws.sh
```

### What the script does:

1. Checks if S3 bucket exists, creates if not
2. Configures bucket for static website hosting
3. Sets public read access policies
4. Builds the production bundle (`npm run build`)
5. Syncs dist folder to S3 with optimized cache headers
6. Provides the website URL

## Manual Deployment Steps

If you prefer manual deployment:

```bash
# 1. Build production bundle
npm run build

# 2. Sync to S3
aws s3 sync ./dist/ s3://miyabi-console-dev/ \
  --delete \
  --cache-control "public,max-age=31536000" \
  --exclude "index.html"

# 3. Upload index.html separately (no cache)
aws s3 cp ./dist/index.html s3://miyabi-console-dev/index.html \
  --cache-control "no-cache,no-store,must-revalidate"
```

## API Configuration

⚠️ **IMPORTANT**: The current build is configured to use API at:

```
http://localhost:3002/api/v1
```

This will NOT work from the AWS-hosted frontend. You need to:

### Option 1: Environment Variable (Recommended)

Update `.env.production`:

```bash
VITE_API_URL=https://your-api-domain.com/api/v1
```

Then rebuild and redeploy:

```bash
npm run build
./deploy-to-aws.sh
```

### Option 2: CloudFront with API Gateway

Set up CloudFront distribution that serves:
- `/` → S3 static website (miyabi-console)
- `/api/*` → API Gateway or ALB (miyabi-web-api)

This provides a unified domain for both frontend and backend.

## Production Checklist

Before deploying to production:

- [ ] Configure production API endpoint
- [ ] Set up custom domain (e.g., console.miyabi.ai)
- [ ] Add SSL/TLS certificate via CloudFront
- [ ] Configure CloudFront for CDN
- [ ] Set up CI/CD pipeline
- [ ] Enable CloudWatch logs
- [ ] Configure CORS on API for production domain
- [ ] Add health monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Review security headers
- [ ] Test API connectivity from AWS environment

## CloudFront Setup (Optional, Recommended)

For production, set up CloudFront for:
- Global CDN distribution
- SSL/TLS termination
- Custom domain support
- DDoS protection
- Better performance

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name miyabi-console-dev.s3.amazonaws.com \
  --default-root-object index.html
```

## Rollback Procedure

If issues occur:

```bash
# Restore previous version from git
git checkout <previous-commit>
npm run build
./deploy-to-aws.sh
```

## Monitoring

### Check deployment status:

```bash
# List S3 bucket contents
aws s3 ls s3://miyabi-console-dev/ --recursive

# Check bucket website configuration
aws s3api get-bucket-website --bucket miyabi-console-dev
```

### View website:

```bash
# macOS
open http://miyabi-console-dev.s3-website-us-east-1.amazonaws.com

# Linux
xdg-open http://miyabi-console-dev.s3-website-us-east-1.amazonaws.com
```

## Troubleshooting

### Issue: 403 Forbidden

**Solution**: Check bucket policy allows public read access

```bash
aws s3api get-bucket-policy --bucket miyabi-console-dev
```

### Issue: 404 Not Found on routes

**Solution**: Ensure error document is set to `index.html` for React Router

```bash
aws s3 website s3://miyabi-console-dev \
  --index-document index.html \
  --error-document index.html
```

### Issue: API calls failing (CORS)

**Solution**: Configure CORS on API backend to allow requests from:
- `http://miyabi-console-dev.s3-website-us-east-1.amazonaws.com`
- Your custom domain (if configured)

## Cost Estimation

Current setup (development):
- **S3 Storage**: ~$0.023/GB/month
- **S3 Requests**: ~$0.0004/1000 GET requests
- **Data Transfer**: First 1 GB free, then $0.09/GB

Estimated monthly cost: **< $1** for low-traffic development environment

## Next Steps

1. **Deploy API Backend**: Set up miyabi-web-api on AWS (ECS/EC2/Lambda)
2. **Configure Environment**: Update VITE_API_URL for production
3. **Custom Domain**: Set up Route 53 + CloudFront for console.miyabi.ai
4. **CI/CD**: Automate deployments via GitHub Actions
5. **Monitoring**: Set up CloudWatch + Sentry

## Security Notes

- Current setup is public for static website hosting (required)
- No sensitive data should be in frontend code
- API authentication required for all backend operations
- Consider WAF rules for production

## Support

For deployment issues, check:
1. AWS Console: S3 bucket settings
2. Browser DevTools: Network tab for API calls
3. CloudWatch Logs: If configured

---

**Last Updated**: 2025-11-18
**Deployed By**: Claude Code
**Environment**: Development
