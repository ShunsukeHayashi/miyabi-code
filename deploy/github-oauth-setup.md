# GitHub OAuth App Production Setup Guide

This document describes how to set up GitHub OAuth App for Miyabi Society production environment.

## Prerequisites

- GitHub account with admin access to the organization
- Domain configured: `miyabi-society.com`
- SSL certificate (via CloudFront/ACM)

## Step 1: Create GitHub OAuth App

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in the following:

| Field | Value |
|-------|-------|
| **Application name** | Miyabi Society |
| **Homepage URL** | https://miyabi-society.com |
| **Authorization callback URL** | https://miyabi-society.com/api/v1/auth/github/callback |
| **Enable Device Flow** | Unchecked |

4. Click "Register application"
5. Copy the **Client ID**
6. Generate and copy the **Client Secret**

## Step 2: Configure Scopes

The application requests the following OAuth scopes:

| Scope | Purpose |
|-------|---------|
| `read:user` | Access user profile information |
| `user:email` | Access user email addresses |
| `repo` | Access repositories for agent operations |

## Step 3: Environment Variables

Set the following environment variables in your production deployment:

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=Ov23li...          # From Step 1
GITHUB_CLIENT_SECRET=...             # From Step 1
GITHUB_CALLBACK_URL=https://miyabi-society.com/api/v1/auth/github/callback

# Frontend URL (for post-login redirect)
FRONTEND_URL=https://miyabi-society.com

# JWT Configuration
JWT_SECRET=<generate-secure-random-string>
JWT_EXPIRATION=3600                  # 1 hour
REFRESH_EXPIRATION=604800            # 7 days
```

### Generate JWT Secret

```bash
openssl rand -base64 64
```

## Step 4: AWS Parameter Store Setup

Store secrets in AWS Parameter Store:

```bash
# GitHub OAuth secrets
aws ssm put-parameter \
  --name "/miyabi/production/github-client-id" \
  --value "Ov23li..." \
  --type "SecureString" \
  --overwrite

aws ssm put-parameter \
  --name "/miyabi/production/github-client-secret" \
  --value "..." \
  --type "SecureString" \
  --overwrite

aws ssm put-parameter \
  --name "/miyabi/production/jwt-secret" \
  --value "$(openssl rand -base64 64)" \
  --type "SecureString" \
  --overwrite
```

## Step 5: Database Schema

Ensure the `users` table exists:

```sql
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_id BIGINT UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    access_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_github_id ON users(github_id);
CREATE INDEX idx_users_email ON users(email);
```

## Step 6: CloudFront/ALB Configuration

Ensure the API routes are correctly proxied:

```
/api/v1/auth/github          → API Server (Lambda/EC2)
/api/v1/auth/github/callback → API Server (Lambda/EC2)
/api/v1/auth/refresh         → API Server (Lambda/EC2)
/api/v1/auth/logout          → API Server (Lambda/EC2)
```

## Step 7: Testing

### Test OAuth Flow

1. Navigate to: `https://miyabi-society.com/api/v1/auth/github`
2. Should redirect to GitHub authorization page
3. After authorization, should redirect to `https://miyabi-society.com/dashboard?token=...`

### Test Token Refresh

```bash
curl -X POST https://miyabi-society.com/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "..."}'
```

## Security Checklist

- [ ] Client secret stored in Parameter Store (not in code)
- [ ] JWT secret is cryptographically random (64+ bytes)
- [ ] HTTPS enforced on all auth endpoints
- [ ] Callback URL matches exactly
- [ ] Rate limiting enabled on auth endpoints
- [ ] Token expiration configured appropriately

## Troubleshooting

### "redirect_uri_mismatch" Error

Ensure the callback URL in GitHub App settings matches exactly:
- Protocol: `https://` (not `http://`)
- Domain: `miyabi-society.com` (not `www.`)
- Path: `/api/v1/auth/github/callback` (exact match)

### "Bad credentials" Error

1. Verify Client ID and Secret are correct
2. Check if the OAuth App is active
3. Ensure secrets are loaded from Parameter Store correctly

### Token Not Persisted

1. Check database connection
2. Verify `users` table exists
3. Check for unique constraint violations
