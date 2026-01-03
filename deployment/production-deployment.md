# AI Course Platform - Production Deployment Strategy

## Overview

This document outlines the complete production deployment strategy for the AI Course Platform, including infrastructure setup, monitoring, scaling, and maintenance procedures.

## Infrastructure Architecture

### Cloud Provider: Vercel + AWS Hybrid

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Cloudflare    │ -> │   Vercel     │ -> │      AWS        │
│   (CDN/WAF)     │    │  (Frontend)  │    │   (Backend)     │
└─────────────────┘    └──────────────┘    └─────────────────┘
                              │                     │
                              v                     v
                       ┌──────────────┐    ┌─────────────────┐
                       │  Edge API    │    │   Database      │
                       │  Routes      │    │   (RDS)         │
                       └──────────────┘    └─────────────────┘
```

### Core Services

1. **Frontend & API**: Vercel Edge Runtime
2. **Database**: AWS RDS PostgreSQL (Multi-AZ)
3. **Cache**: AWS ElastiCache Redis
4. **File Storage**: AWS S3 + CloudFront
5. **Video Processing**: AWS Lambda + MediaConvert
6. **Real-time**: Pusher Channels
7. **AI Services**: Google Generative AI + Anthropic Claude
8. **Monitoring**: DataDog + New Relic

## Deployment Pipeline

### 1. Environment Setup

```yaml
# environments/production.yml
production:
  database:
    url: ${DATABASE_URL}
    ssl: true
    pool_size: 20
    timeout: 30000

  cache:
    redis_url: ${REDIS_URL}
    cluster_mode: true

  ai:
    gemini_api_key: ${GEMINI_API_KEY}
    anthropic_api_key: ${ANTHROPIC_API_KEY}
    rate_limits:
      requests_per_minute: 1000
      tokens_per_minute: 500000

  security:
    jwt_secret: ${JWT_SECRET}
    encryption_key: ${ENCRYPTION_KEY}
    cors_origins: ${ALLOWED_ORIGINS}

  monitoring:
    datadog_api_key: ${DATADOG_API_KEY}
    newrelic_license_key: ${NEWRELIC_LICENSE_KEY}
    log_level: "info"
```

### 2. Build Process

```dockerfile
# Dockerfile.production
FROM node:20-alpine AS base
WORKDIR /app

# Dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# Builder
FROM base AS builder
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

# Runner
FROM base AS runner
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

### 3. CI/CD Pipeline

```yaml
# .github/workflows/production-deploy.yml
name: Production Deployment

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test
      - run: npm run test:e2e

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level high
      - uses: securecodewarrior/github-action-add-sarif@v1
        with:
          sarif-file: security-scan.sarif

  deploy:
    needs: [test, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run build

      # Deploy to Vercel
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

      # Update database schema
      - run: npm run db:migrate:deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      # Warm caches
      - run: npm run cache:warm

      # Health checks
      - run: npm run deploy:verify
```

## Database Migration Strategy

### 1. Zero-Downtime Migrations

```sql
-- migrations/001_initial_schema.sql
BEGIN;

-- Create tables with proper constraints
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'student',
    profile JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Course management tables
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    instructor_id UUID REFERENCES users(id),
    category VARCHAR(100),
    difficulty VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_status ON courses(status);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
```

### 2. Migration Scripts

```typescript
// scripts/migrate.ts
import { dbOptimizer } from '@/lib/database/query-optimizer';
import { readFile } from 'fs/promises';
import { glob } from 'glob';

export async function runMigrations() {
  console.log('🚀 Starting database migrations...');

  try {
    // Create migration tracking table
    await dbOptimizer.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Get applied migrations
    const { rows: appliedMigrations } = await dbOptimizer.query(
      'SELECT version FROM schema_migrations ORDER BY version'
    );
    const applied = new Set(appliedMigrations.map(row => row.version));

    // Find migration files
    const migrationFiles = await glob('migrations/*.sql');
    migrationFiles.sort();

    for (const file of migrationFiles) {
      const version = file.replace('migrations/', '').replace('.sql', '');

      if (applied.has(version)) {
        console.log(`⏭️  Skipping ${version} (already applied)`);
        continue;
      }

      console.log(`📦 Applying migration ${version}...`);

      const sql = await readFile(file, 'utf-8');
      await dbOptimizer.transaction(async (query) => {
        await query(sql);
        await query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [version]
        );
      });

      console.log(`✅ Applied migration ${version}`);
    }

    console.log('🎉 All migrations completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

if (require.main === module) {
  runMigrations().catch(process.exit);
}
```

## Monitoring & Observability

### 1. Application Performance Monitoring

```typescript
// lib/monitoring/apm.ts
import { NextRequest, NextResponse } from 'next/server';

interface MonitoringConfig {
  datadog?: {
    apiKey: string;
    service: string;
    env: string;
  };
  newrelic?: {
    licenseKey: string;
    appName: string;
  };
}

export class APMManager {
  private config: MonitoringConfig;

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.initializeAPM();
  }

  private initializeAPM() {
    // Initialize DataDog
    if (this.config.datadog && typeof window === 'undefined') {
      const tracer = require('dd-trace');
      tracer.init({
        service: this.config.datadog.service,
        env: this.config.datadog.env,
        profiling: true,
        runtimeMetrics: true
      });
    }

    // Initialize New Relic
    if (this.config.newrelic && typeof window === 'undefined') {
      process.env.NEW_RELIC_LICENSE_KEY = this.config.newrelic.licenseKey;
      process.env.NEW_RELIC_APP_NAME = this.config.newrelic.appName;
      require('newrelic');
    }
  }

  // Request monitoring middleware
  monitorRequest(handler: Function) {
    return async (req: NextRequest, ...args: any[]) => {
      const startTime = Date.now();
      const requestId = crypto.randomUUID();

      try {
        const response = await handler(req, ...args);

        this.recordMetric('request_duration', Date.now() - startTime, {
          method: req.method,
          path: req.nextUrl.pathname,
          status: response.status,
          request_id: requestId
        });

        return response;

      } catch (error) {
        this.recordError(error, {
          method: req.method,
          path: req.nextUrl.pathname,
          request_id: requestId
        });
        throw error;
      }
    };
  }

  recordMetric(name: string, value: number, tags: Record<string, any> = {}) {
    // Send to monitoring services
    console.log(`METRIC: ${name}=${value}`, tags);
  }

  recordError(error: any, context: Record<string, any> = {}) {
    console.error('APPLICATION_ERROR:', error, context);

    // Send to error tracking
    if (typeof window === 'undefined') {
      // Server-side error tracking
    }
  }
}
```

### 2. Health Checks

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { dbOptimizer } from '@/lib/database/query-optimizer';
import { cacheManager } from '@/lib/performance/cache-manager';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  checks: {
    database: { status: string; latency?: number; error?: string };
    cache: { status: string; hitRate?: number; error?: string };
    ai: { status: string; error?: string };
    external: { status: string; services: Record<string, string> };
  };
  metrics: {
    uptime: number;
    memory: NodeJS.MemoryUsage;
    cpu: number;
  };
}

export async function GET() {
  const startTime = Date.now();
  const health: HealthStatus = {
    status: 'healthy',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    checks: {
      database: { status: 'unknown' },
      cache: { status: 'unknown' },
      ai: { status: 'unknown' },
      external: { status: 'unknown', services: {} }
    },
    metrics: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: 0
    }
  };

  // Database health check
  try {
    const dbStart = Date.now();
    await dbOptimizer.query('SELECT 1');
    health.checks.database = {
      status: 'healthy',
      latency: Date.now() - dbStart
    };
  } catch (error) {
    health.checks.database = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    health.status = 'degraded';
  }

  // Cache health check
  try {
    const cacheStats = cacheManager.getStats();
    health.checks.cache = {
      status: 'healthy',
      hitRate: cacheStats.hitRate
    };
  } catch (error) {
    health.checks.cache = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    health.status = 'degraded';
  }

  // AI services health check
  try {
    // Test Gemini API
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: { 'Authorization': `Bearer ${process.env.GEMINI_API_KEY}` },
      signal: AbortSignal.timeout(5000)
    });

    health.checks.ai = {
      status: response.ok ? 'healthy' : 'degraded'
    };
  } catch (error) {
    health.checks.ai = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // External services health
  const externalChecks = [
    { name: 'pusher', url: 'https://api.pusherapp.com/health' },
    { name: 'sentry', url: 'https://sentry.io/api/0/health/' }
  ];

  for (const check of externalChecks) {
    try {
      const response = await fetch(check.url, {
        signal: AbortSignal.timeout(3000)
      });
      health.checks.external.services[check.name] = response.ok ? 'healthy' : 'degraded';
    } catch {
      health.checks.external.services[check.name] = 'unhealthy';
    }
  }

  health.checks.external.status = Object.values(health.checks.external.services).every(s => s === 'healthy') ? 'healthy' : 'degraded';

  // Determine overall status
  const allChecks = [
    health.checks.database.status,
    health.checks.cache.status,
    health.checks.ai.status,
    health.checks.external.status
  ];

  if (allChecks.includes('unhealthy')) {
    health.status = 'unhealthy';
  } else if (allChecks.includes('degraded')) {
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 :
                    health.status === 'degraded' ? 200 : 503;

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, must-revalidate',
      'X-Health-Check-Duration': `${Date.now() - startTime}ms`
    }
  });
}
```

## Security Configuration

### 1. Production Security Checklist

```typescript
// scripts/security-check.ts
import { SECURITY_CONFIG } from '@/lib/security/config';

const PRODUCTION_SECURITY_REQUIREMENTS = {
  environment_variables: [
    'JWT_SECRET',
    'NEXTAUTH_SECRET',
    'DATABASE_URL',
    'REDIS_URL',
    'ENCRYPTION_KEY'
  ],
  security_headers: [
    'Strict-Transport-Security',
    'Content-Security-Policy',
    'X-Frame-Options',
    'X-Content-Type-Options'
  ],
  ssl_requirements: {
    database: true,
    redis: true,
    external_apis: true
  }
};

export async function validateProductionSecurity() {
  console.log('🔒 Running production security validation...');

  const issues: string[] = [];

  // Check environment variables
  for (const envVar of PRODUCTION_SECURITY_REQUIREMENTS.environment_variables) {
    if (!process.env[envVar]) {
      issues.push(`Missing required environment variable: ${envVar}`);
    }
  }

  // Validate JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    issues.push('JWT_SECRET must be at least 32 characters long');
  }

  // Check SSL configuration
  if (!process.env.DATABASE_URL?.includes('sslmode=require')) {
    issues.push('Database SSL is not enforced');
  }

  if (!process.env.REDIS_URL?.includes('tls://')) {
    issues.push('Redis TLS is not configured');
  }

  // Validate CORS origins
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOWED_ORIGINS) {
    issues.push('ALLOWED_ORIGINS must be set in production');
  }

  if (issues.length > 0) {
    console.error('❌ Security validation failed:');
    issues.forEach(issue => console.error(`  - ${issue}`));
    process.exit(1);
  }

  console.log('✅ Production security validation passed!');
}

if (require.main === module) {
  validateProductionSecurity();
}
```

## Scaling Strategy

### 1. Auto-scaling Configuration

```yaml
# infrastructure/scaling-config.yml
auto_scaling:
  api:
    min_instances: 2
    max_instances: 50
    target_cpu: 70
    target_memory: 80
    scale_up_cooldown: 300
    scale_down_cooldown: 600

  database:
    read_replicas: 2
    connection_pool_size: 20
    max_connections: 100

  cache:
    cluster_nodes: 3
    memory_per_node: "4gb"
    eviction_policy: "allkeys-lru"

  cdn:
    cache_ttl: 86400  # 24 hours
    edge_locations: "global"
    compression: true

monitoring:
  alerts:
    high_response_time:
      threshold: 2000  # 2 seconds
      duration: 5      # minutes

    high_error_rate:
      threshold: 5     # 5%
      duration: 3      # minutes

    database_connections:
      threshold: 80    # 80% of max
      duration: 2      # minutes
```

## Disaster Recovery

### 1. Backup Strategy

```typescript
// scripts/backup.ts
import { dbOptimizer } from '@/lib/database/query-optimizer';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();

export async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupKey = `backups/database-${timestamp}.sql`;

  console.log('📦 Creating database backup...');

  try {
    // Create database dump
    const { exec } = require('child_process');
    const dumpCommand = `pg_dump ${process.env.DATABASE_URL} --no-owner --no-privileges`;

    const dumpPromise = new Promise<string>((resolve, reject) => {
      exec(dumpCommand, (error: any, stdout: string, stderr: string) => {
        if (error) reject(error);
        else resolve(stdout);
      });
    });

    const dumpData = await dumpPromise;

    // Upload to S3
    await s3.upload({
      Bucket: process.env.BACKUP_BUCKET!,
      Key: backupKey,
      Body: dumpData,
      ServerSideEncryption: 'AES256',
      Metadata: {
        type: 'database-backup',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      }
    }).promise();

    console.log(`✅ Backup created: ${backupKey}`);

    // Clean up old backups (keep last 30 days)
    await cleanupOldBackups();

  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

async function cleanupOldBackups() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);

  const objects = await s3.listObjectsV2({
    Bucket: process.env.BACKUP_BUCKET!,
    Prefix: 'backups/'
  }).promise();

  const oldObjects = objects.Contents?.filter(obj =>
    obj.LastModified && obj.LastModified < cutoffDate
  ) || [];

  if (oldObjects.length > 0) {
    await s3.deleteObjects({
      Bucket: process.env.BACKUP_BUCKET!,
      Delete: {
        Objects: oldObjects.map(obj => ({ Key: obj.Key! }))
      }
    }).promise();

    console.log(`🗑️  Cleaned up ${oldObjects.length} old backups`);
  }
}
```

## Performance Benchmarks

### Expected Performance Targets

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| Page Load Time | < 2s | > 3s |
| API Response Time | < 500ms | > 1s |
| Database Query Time | < 100ms | > 500ms |
| Cache Hit Rate | > 80% | < 60% |
| Uptime | > 99.9% | < 99.5% |
| Error Rate | < 0.1% | > 1% |

### Load Testing

```javascript
// scripts/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up
    { duration: '5m', target: 100 },  // Steady state
    { duration: '2m', target: 200 },  // Scale up
    { duration: '5m', target: 200 },  // Steady state
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.01'],    // Error rate under 1%
  },
};

export default function() {
  // Test course listing
  let response = http.get('https://your-domain.com/api/courses');
  check(response, {
    'courses API status 200': (r) => r.status === 200,
    'courses API response time < 1s': (r) => r.timings.duration < 1000,
  });

  sleep(1);

  // Test course details
  response = http.get('https://your-domain.com/api/courses/sample-id');
  check(response, {
    'course details status 200': (r) => r.status === 200,
  });

  sleep(1);
}
```

This comprehensive deployment strategy ensures the AI Course Platform is production-ready with proper monitoring, security, scaling, and disaster recovery capabilities.