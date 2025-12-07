# Miyabi Character Studio - Technical Architecture

**Version**: 1.0
**Date**: 2025-12-07
**Stack**: Rust + React + Gemini 3 Pro + AWS
**Deployment**: Cloud-Native, Auto-Scaling

---

## 🏗️ Architecture Overview

### System Design Principles
1. **Microservices**: 疎結合なサービス分離
2. **Scalability**: 需要に応じた自動スケーリング
3. **Cost Optimization**: 従量課金の最適化
4. **Security**: データ暗号化、認証・認可の徹底
5. **Observability**: ログ・メトリクス・トレーシング

---

## 📊 System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                         User Layer                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  🌐 Web Browser (React SPA)                                    │
│     └─ React 19 + TypeScript + Vite                           │
│     └─ TailwindCSS + Headless UI                              │
│     └─ React Query (Data Fetching)                            │
│                                                                │
└───────────────────────────┬────────────────────────────────────┘
                            │ HTTPS (API Gateway)
┌───────────────────────────┴────────────────────────────────────┐
│                    API Gateway Layer                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  🔐 AWS API Gateway (REST API)                                 │
│     └─ Rate Limiting (100 req/min)                            │
│     └─ CORS Configuration                                     │
│     └─ API Key Authentication                                 │
│                                                                │
└───────────────────────────┬────────────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────────────┐
│                   Application Layer                            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  🦀 Backend API Server (Rust)                           │  │
│  │  ├─ Framework: Axum 0.7                                 │  │
│  │  ├─ Runtime: Tokio (Async)                              │  │
│  │  ├─ Database: SQLx (PostgreSQL)                         │  │
│  │  ├─ Auth: JWT (jsonwebtoken)                            │  │
│  │  ├─ Object Storage: AWS SDK for S3                      │  │
│  │  └─ Deployment: AWS Lambda (Serverless) or ECS Fargate │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  🤖 AI Generation Service (Python or Rust)              │  │
│  │  ├─ Gemini 3 Pro API Integration                        │  │
│  │  ├─ Job Queue: AWS SQS (Async Processing)              │  │
│  │  ├─ Image Processing: OpenCV / Pillow                   │  │
│  │  ├─ Consistency Checker: Custom ML Model (Optional)     │  │
│  │  └─ Deployment: AWS Lambda (Event-Driven)              │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  📦 Export Service (Rust or Node.js)                    │  │
│  │  ├─ ZIP Generation: zip crate (Rust)                    │  │
│  │  ├─ PSD Generation: ag-psd (Node.js)                    │  │
│  │  ├─ VTube Studio JSON: Custom Formatter                 │  │
│  │  └─ Deployment: AWS Lambda                              │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
└───────────────────────────┬────────────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────────────┐
│                      Data Layer                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  🗄️ PostgreSQL (AWS RDS)                                      │
│     ├─ Instance: db.t4g.micro (Free Tier) → db.t4g.small     │
│     ├─ Storage: 20GB SSD (Auto-Scaling)                      │
│     ├─ Backup: 7-day automated backups                       │
│     └─ Multi-AZ: Phase 2で有効化                              │
│                                                                │
│  🪣 AWS S3 (Object Storage)                                    │
│     ├─ Bucket: miyabi-character-studio-images                │
│     ├─ Base Images: /characters/{userId}/{characterId}/base  │
│     ├─ Differences: /characters/{userId}/{characterId}/diffs │
│     ├─ Lifecycle: 90日後にS3 Glacier移行                      │
│     └─ CDN: CloudFront (Global Distribution)                 │
│                                                                │
│  🔴 Redis (AWS ElastiCache)                                   │
│     ├─ Session Storage: JWT Token Blacklist                  │
│     ├─ Rate Limiting: API Rate Counter                       │
│     ├─ Job Queue: Generation Job Status                      │
│     └─ Instance: cache.t4g.micro                             │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                   External Services Layer                      │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  🤖 Google Gemini 3 Pro API                                    │
│     └─ Endpoint: https://generativelanguage.googleapis.com    │
│     └─ Model: gemini-3.0-pro-image-preview                    │
│     └─ Pricing: $0.02/image (2K resolution)                   │
│                                                                │
│  💳 Stripe API                                                 │
│     └─ Subscription Billing (Basic/Pro Plans)                 │
│     └─ Webhook: /api/v1/stripe/webhook                        │
│                                                                │
│  📧 SendGrid API                                               │
│     └─ Transactional Email (Welcome, Generation Complete)     │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                 Monitoring & Observability                     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  📊 AWS CloudWatch                                             │
│     ├─ Logs: API Server, Lambda Functions                    │
│     ├─ Metrics: CPU, Memory, Request Count                    │
│     └─ Alarms: Error Rate > 5%, Latency > 3s                 │
│                                                                │
│  🔍 AWS X-Ray                                                  │
│     └─ Distributed Tracing (API → Lambda → Gemini)           │
│                                                                │
│  📈 Grafana (Optional - Phase 2)                               │
│     └─ Custom Dashboards for Business Metrics                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack Detail

### Frontend (React SPA)

#### Core Technologies
```json
{
  "framework": "React 19",
  "language": "TypeScript 5.8",
  "build": "Vite 6.2",
  "styling": "TailwindCSS 4.0",
  "state": "React Query + Zustand",
  "router": "TanStack Router",
  "forms": "React Hook Form + Zod"
}
```

#### Key Libraries
```typescript
// package.json (Frontend)
{
  "dependencies": {
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "@tanstack/react-query": "^5.0.0",
    "@tanstack/react-router": "^1.0.0",
    "zustand": "^4.5.0",
    "react-hook-form": "^7.50.0",
    "zod": "^3.22.0",
    "axios": "^1.6.0",
    "jszip": "^3.10.1",
    "ag-psd": "^16.0.0" // For PSD export (client-side preview)
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "^5.8.2",
    "vite": "^6.2.0",
    "tailwindcss": "^4.0.0"
  }
}
```

#### Deployment
- **Hosting**: AWS S3 + CloudFront
- **Build**: GitHub Actions CI/CD
- **Environment Variables**: `.env.production` (Vite)

```bash
# Build Command
npm run build
# Output: dist/ (Static Assets)

# Deploy to S3
aws s3 sync dist/ s3://miyabi-character-studio-frontend/
aws cloudfront create-invalidation --distribution-id EXXX --paths "/*"
```

---

### Backend (Rust API Server)

#### Core Technologies
```toml
# Cargo.toml (Backend)
[package]
name = "miyabi-character-studio-api"
version = "0.1.0"
edition = "2021"

[dependencies]
# Web Framework
axum = "0.7"
tower = "0.4"
tower-http = { version = "0.5", features = ["cors", "trace"] }

# Async Runtime
tokio = { version = "1", features = ["full"] }

# Database
sqlx = { version = "0.7", features = ["postgres", "runtime-tokio-native-tls", "uuid", "chrono"] }

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Authentication
jsonwebtoken = "9.2"
bcrypt = "0.15"

# AWS SDK
aws-sdk-s3 = "1.0"
aws-sdk-sqs = "1.0"

# HTTP Client
reqwest = { version = "0.11", features = ["json"] }

# Utilities
uuid = { version = "1.0", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
tracing = "0.1"
tracing-subscriber = "0.3"

# Image Processing (Optional)
image = "0.24"
```

#### Project Structure
```
miyabi-character-studio-api/
├── src/
│   ├── main.rs                  # Entry point
│   ├── config.rs                # Environment config
│   ├── routes/
│   │   ├── mod.rs
│   │   ├── auth.rs              # POST /api/v1/auth/login
│   │   ├── characters.rs        # POST /api/v1/characters
│   │   ├── differences.rs       # POST /api/v1/differences/batch
│   │   ├── export.rs            # GET /api/v1/export/{batchId}
│   │   └── credits.rs           # GET /api/v1/credits/usage
│   ├── services/
│   │   ├── mod.rs
│   │   ├── character_service.rs
│   │   ├── difference_service.rs
│   │   ├── gemini_client.rs     # Gemini API Integration
│   │   ├── s3_service.rs        # AWS S3 Upload/Download
│   │   └── credit_service.rs
│   ├── models/
│   │   ├── mod.rs
│   │   ├── user.rs
│   │   ├── character.rs
│   │   ├── difference.rs
│   │   └── credit.rs
│   ├── middleware/
│   │   ├── mod.rs
│   │   ├── auth.rs              # JWT Verification
│   │   └── rate_limit.rs        # Rate Limiting
│   └── db/
│       ├── mod.rs
│       └── migrations/
│           ├── 001_create_users.sql
│           ├── 002_create_characters.sql
│           └── 003_create_differences.sql
├── Cargo.toml
└── Dockerfile
```

#### Deployment (AWS Lambda or ECS Fargate)

**Option 1: AWS Lambda (Serverless) - 推奨**
```dockerfile
# Dockerfile (AWS Lambda Custom Runtime)
FROM public.ecr.aws/lambda/provided:al2

# Install Rust
RUN yum install -y gcc openssl-devel && \
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

# Build Application
COPY Cargo.toml Cargo.lock ./
COPY src/ src/
RUN cargo build --release --target x86_64-unknown-linux-musl

# Copy binary
COPY --from=builder /app/target/x86_64-unknown-linux-musl/release/bootstrap ${LAMBDA_RUNTIME_DIR}

CMD ["lambda_handler"]
```

**Option 2: AWS ECS Fargate (Container)**
```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
```

---

### AI Generation Service (Python or Rust)

#### Technology Choice: **Python** (Gemini SDK公式サポート)

```python
# requirements.txt
google-generativeai==1.15.0
pillow==10.0.0
opencv-python==4.8.0
boto3==1.34.0  # AWS SDK
redis==5.0.0
```

#### Lambda Function Structure
```python
# lambda_function.py
import os
import json
import boto3
import google.generativeai as genai
from PIL import Image
import base64

s3_client = boto3.client('s3')
sqs_client = boto3.client('sqs')

genai.configure(api_key=os.environ['GEMINI_API_KEY'])

def lambda_handler(event, context):
    """
    SQS Trigger: { characterId, expression, prompt }
    Output: Generated Image → S3 → DynamoDB Update
    """
    for record in event['Records']:
        body = json.loads(record['body'])
        character_id = body['characterId']
        expression = body['expression']
        prompt = body['prompt']

        # Generate Image
        model = genai.GenerativeModel('gemini-3.0-pro-image-preview')
        response = model.generate_content(prompt)

        # Extract Image
        image_data = response.parts[0].inline_data.data

        # Upload to S3
        s3_key = f"differences/{character_id}/{expression}.png"
        s3_client.put_object(
            Bucket='miyabi-character-studio-images',
            Key=s3_key,
            Body=base64.b64decode(image_data),
            ContentType='image/png'
        )

        # Update Database (via API)
        # ... (Invoke Rust API to update DB)

    return {'statusCode': 200}
```

#### Deployment
```bash
# Package Lambda
pip install -r requirements.txt -t package/
cd package && zip -r ../lambda.zip . && cd ..
zip -g lambda.zip lambda_function.py

# Deploy
aws lambda update-function-code \
  --function-name miyabi-ai-generation \
  --zip-file fileb://lambda.zip
```

---

### Database Schema (PostgreSQL)

#### Tables

```sql
-- users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    plan VARCHAR(10) NOT NULL DEFAULT 'free', -- free, basic, pro
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- characters
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    base_image_url TEXT NOT NULL, -- S3 URL
    features JSONB NOT NULL, -- { hair: {...}, eyes: {...}, ... }
    gemini_prompt TEXT NOT NULL,
    consistency_score DECIMAL(5, 2), -- 0.00 - 100.00
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_characters_user_id ON characters(user_id);

-- differences
CREATE TABLE differences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    expression VARCHAR(50) NOT NULL, -- neutral, happy, angry, sad, surprised
    image_url TEXT NOT NULL, -- S3 URL
    consistency_score DECIMAL(5, 2),
    generation_time INT, -- seconds
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_differences_character_id ON differences(character_id);

-- user_credits
CREATE TABLE user_credits (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    monthly_quota INT NOT NULL,
    used_this_month INT DEFAULT 0,
    reset_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- credit_transactions
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    character_id UUID REFERENCES characters(id),
    differences_generated INT NOT NULL,
    credits_used INT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at);

-- generation_jobs (SQS Queue Management)
CREATE TABLE generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID REFERENCES characters(id),
    batch_id VARCHAR(255) UNIQUE NOT NULL,
    total_differences INT NOT NULL,
    completed INT DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_generation_jobs_batch_id ON generation_jobs(batch_id);
```

---

### AWS Infrastructure (Terraform - Phase 2)

#### Resource List

| Service | Resource | Purpose |
|---------|----------|---------|
| **Compute** | AWS Lambda | API Server (Rust), AI Generation (Python) |
| **Compute** | ECS Fargate | Optional: Long-running API Server |
| **Database** | RDS PostgreSQL | User, Character, Difference データ |
| **Cache** | ElastiCache Redis | Session, Rate Limiting, Job Queue |
| **Storage** | S3 | Base Images, Generated Differences |
| **CDN** | CloudFront | S3コンテンツ配信、Frontend配信 |
| **Queue** | SQS | AI生成ジョブキュー |
| **Auth** | Cognito (Optional) | User Authentication (JWT代替) |
| **Billing** | Stripe | Subscription管理 (外部サービス) |
| **Monitoring** | CloudWatch | Logs, Metrics, Alarms |
| **Tracing** | X-Ray | Distributed Tracing |

#### Cost Estimate (MVP Phase)

| Resource | Spec | Monthly Cost |
|----------|------|--------------|
| RDS PostgreSQL | db.t4g.micro | $13 |
| ElastiCache Redis | cache.t4g.micro | $11 |
| S3 (100GB) | Standard | $2.30 |
| CloudFront (100GB Transfer) | - | $8.50 |
| Lambda (1M requests) | 512MB, 5s avg | $10 |
| Gemini API (500 images/month) | $0.02/image | $10 |
| **Total** | - | **≈ $55/月** |

---

## 🔐 Security Architecture

### Authentication Flow
```
1. User Login
   └─> POST /api/v1/auth/login { email, password }
   └─> Server: Verify bcrypt(password)
   └─> Return: JWT Token (exp: 7 days)

2. Subsequent Requests
   └─> Header: Authorization: Bearer <JWT>
   └─> Middleware: Verify JWT Signature
   └─> Extract user_id from claims
   └─> Continue to Route Handler
```

### JWT Structure
```json
{
  "sub": "user_uuid",
  "email": "yume@example.com",
  "plan": "basic",
  "exp": 1738886400,
  "iat": 1738281600
}
```

### Data Encryption
- **At Rest**: RDS暗号化 (AES-256)
- **In Transit**: HTTPS (TLS 1.3)
- **S3 Objects**: Server-Side Encryption (SSE-S3)

### Rate Limiting
```rust
// middleware/rate_limit.rs
use tower_governor::{governor::GovernorConfigBuilder, GovernorLayer};

let governor_conf = Box::new(
    GovernorConfigBuilder::default()
        .per_second(2)  // 2 requests/second
        .burst_size(10) // Burst up to 10
        .finish()
        .unwrap(),
);

let governor_limiter = governor_conf.limiter().clone();
let governor_layer = GovernorLayer {
    config: Box::leak(governor_conf),
};
```

---

## 🚀 Deployment Strategy

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Frontend
        run: |
          cd frontend
          npm install
          npm run build
      - name: Deploy to S3
        run: |
          aws s3 sync dist/ s3://miyabi-character-studio-frontend/
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CF_DIST_ID }} --paths "/*"

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Rust Backend
        run: |
          cd backend
          cargo build --release
      - name: Deploy to Lambda
        run: |
          # Package & Deploy Lambda
          zip -j lambda.zip target/release/bootstrap
          aws lambda update-function-code --function-name miyabi-api --zip-file fileb://lambda.zip
```

---

## 📊 Monitoring & Observability

### Key Metrics

| Metric | Threshold | Alert |
|--------|-----------|-------|
| API Error Rate | > 5% | Critical |
| API Latency (p95) | > 3s | Warning |
| Gemini API Error Rate | > 10% | Critical |
| DB Connections | > 80% | Warning |
| S3 Upload Failure | > 2% | Warning |
| Credit Overage | User exceeds quota | Notification |

### Logging Strategy
```rust
// src/main.rs
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

fn init_tracing() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()),
        ))
        .init();
}

// Example Log
tracing::info!(
    user_id = %user_id,
    character_id = %character_id,
    generation_time = %generation_time,
    "Character generation completed"
);
```

---

## 🔗 Next Steps

このアーキテクチャを元に、次のドキュメントを作成:
1. **API設計** (`04-api-design.md`) - RESTful APIエンドポイント詳細
2. **データベース設計** (`05-database-schema.md`) - ERD、インデックス戦略
3. **開発ロードマップ** (`06-development-roadmap.md`) - 実装順序、マイルストーン

---

**Author**: ProductDesignAgent
**Last Updated**: 2025-12-07
**Status**: ✅ Completed
