# Database Setup Guide

**Version**: 1.0
**Last Updated**: 2025-11-29

Complete guide to setting up PostgreSQL and DynamoDB for Miyabi.

---

## Table of Contents

1. [PostgreSQL Setup](#postgresql-setup)
2. [DynamoDB Setup](#dynamodb-setup)
3. [Environment Configuration](#environment-configuration)
4. [Running Migrations](#running-migrations)
5. [Health Checks](#health-checks)
6. [Troubleshooting](#troubleshooting)

---

## 1. PostgreSQL Setup

### Option A: AWS RDS (Production)

#### 1.1 Create RDS Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier miyabi-production \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username miyabi_admin \
  --master-user-password "CHANGE_THIS_PASSWORD" \
  --allocated-storage 20 \
  --storage-type gp3 \
  --storage-encrypted \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name miyabi-db-subnet \
  --publicly-accessible false \
  --multi-az true \
  --enable-performance-insights \
  --performance-insights-retention-period 7
```

#### 1.2 Configure Security Group

```bash
# Allow PostgreSQL traffic from application servers
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 5432 \
  --source-group sg-app-servers
```

#### 1.3 Get Connection Details

```bash
aws rds describe-db-instances \
  --db-instance-identifier miyabi-production \
  --query 'DBInstances[0].Endpoint.{Address:Address,Port:Port}'
```

**Connection URL Format**:
```
postgresql://miyabi_admin:PASSWORD@endpoint-address:5432/postgres
```

### Option B: Local PostgreSQL (Development)

#### 1.1 Install PostgreSQL

**macOS (Homebrew)**:
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian**:
```bash
sudo apt update
sudo apt install postgresql-15 postgresql-contrib
sudo systemctl start postgresql
```

**Docker**:
```bash
docker run -d \
  --name miyabi-postgres \
  -e POSTGRES_USER=miyabi \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=miyabi_dev \
  -p 5432:5432 \
  postgres:15-alpine
```

#### 1.2 Create Database and User

```bash
# Connect to PostgreSQL
psql -U postgres

# Create user
CREATE USER miyabi WITH PASSWORD 'password';

# Create database
CREATE DATABASE miyabi_dev OWNER miyabi;

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE miyabi_dev TO miyabi;

# Enable UUID extension
\c miyabi_dev
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

# Exit
\q
```

#### 1.3 Verify Connection

```bash
psql postgresql://miyabi:password@localhost:5432/miyabi_dev -c "SELECT NOW();"
```

---

## 2. DynamoDB Setup

### Option A: AWS DynamoDB (Production)

#### 2.1 Create Tables

**MiyabiEvents Table**:

```bash
aws dynamodb create-table \
  --table-name MiyabiEvents \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=GSI1PK,AttributeType=S \
    AttributeName=GSI1SK,AttributeType=N \
    AttributeName=GSI2PK,AttributeType=S \
    AttributeName=GSI2SK,AttributeType=N \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --global-secondary-indexes \
    '[
      {
        "IndexName": "GSI1",
        "KeySchema": [
          {"AttributeName": "GSI1PK", "KeyType": "HASH"},
          {"AttributeName": "GSI1SK", "KeyType": "RANGE"}
        ],
        "Projection": {"ProjectionType": "ALL"},
        "ProvisionedThroughput": {
          "ReadCapacityUnits": 5,
          "WriteCapacityUnits": 5
        }
      },
      {
        "IndexName": "GSI2",
        "KeySchema": [
          {"AttributeName": "GSI2PK", "KeyType": "HASH"},
          {"AttributeName": "GSI2SK", "KeyType": "RANGE"}
        ],
        "Projection": {"ProjectionType": "ALL"},
        "ProvisionedThroughput": {
          "ReadCapacityUnits": 5,
          "WriteCapacityUnits": 5
        }
      }
    ]' \
  --billing-mode PAY_PER_REQUEST \
  --stream-specification \
    StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
  --tags Key=Project,Value=Miyabi Key=Environment,Value=Production
```

**MiyabiAgentState Table**:

```bash
aws dynamodb create-table \
  --table-name MiyabiAgentState \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=N \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --billing-mode PROVISIONED \
  --provisioned-throughput \
    ReadCapacityUnits=10,WriteCapacityUnits=5 \
  --tags Key=Project,Value=Miyabi
```

**MiyabiWebSocketMessages Table**:

```bash
aws dynamodb create-table \
  --table-name MiyabiWebSocketMessages \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=N \
    AttributeName=GSI1PK,AttributeType=S \
    AttributeName=GSI1SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --global-secondary-indexes \
    '[
      {
        "IndexName": "UndeliveredMessages",
        "KeySchema": [
          {"AttributeName": "GSI1PK", "KeyType": "HASH"},
          {"AttributeName": "GSI1SK", "KeyType": "RANGE"}
        ],
        "Projection": {"ProjectionType": "ALL"},
        "ProvisionedThroughput": {
          "ReadCapacityUnits": 5,
          "WriteCapacityUnits": 5
        }
      }
    ]' \
  --billing-mode PAY_PER_REQUEST \
  --tags Key=Project,Value=Miyabi
```

#### 2.2 Enable Point-in-Time Recovery

```bash
aws dynamodb update-continuous-backups \
  --table-name MiyabiEvents \
  --point-in-time-recovery-specification \
    PointInTimeRecoveryEnabled=true

aws dynamodb update-continuous-backups \
  --table-name MiyabiAgentState \
  --point-in-time-recovery-specification \
    PointInTimeRecoveryEnabled=true

aws dynamodb update-continuous-backups \
  --table-name MiyabiWebSocketMessages \
  --point-in-time-recovery-specification \
    PointInTimeRecoveryEnabled=true
```

#### 2.3 Enable Auto Scaling (for provisioned tables)

```bash
# MiyabiAgentState - Write Capacity
aws application-autoscaling register-scalable-target \
  --service-namespace dynamodb \
  --resource-id "table/MiyabiAgentState" \
  --scalable-dimension "dynamodb:table:WriteCapacityUnits" \
  --min-capacity 5 \
  --max-capacity 100

aws application-autoscaling put-scaling-policy \
  --service-namespace dynamodb \
  --resource-id "table/MiyabiAgentState" \
  --scalable-dimension "dynamodb:table:WriteCapacityUnits" \
  --policy-name "MiyabiAgentState-WriteAutoScaling" \
  --policy-type "TargetTrackingScaling" \
  --target-tracking-scaling-policy-configuration \
    '{"TargetValue": 70.0, "PredefinedMetricSpecification": {"PredefinedMetricType": "DynamoDBWriteCapacityUtilization"}}'

# MiyabiAgentState - Read Capacity
aws application-autoscaling register-scalable-target \
  --service-namespace dynamodb \
  --resource-id "table/MiyabiAgentState" \
  --scalable-dimension "dynamodb:table:ReadCapacityUnits" \
  --min-capacity 10 \
  --max-capacity 200

aws application-autoscaling put-scaling-policy \
  --service-namespace dynamodb \
  --resource-id "table/MiyabiAgentState" \
  --scalable-dimension "dynamodb:table:ReadCapacityUnits" \
  --policy-name "MiyabiAgentState-ReadAutoScaling" \
  --policy-type "TargetTrackingScaling" \
  --target-tracking-scaling-policy-configuration \
    '{"TargetValue": 70.0, "PredefinedMetricSpecification": {"PredefinedMetricType": "DynamoDBReadCapacityUtilization"}}'
```

### Option B: DynamoDB Local (Development)

#### 2.1 Run DynamoDB Local

**Docker**:
```bash
docker run -d \
  --name miyabi-dynamodb \
  -p 8000:8000 \
  amazon/dynamodb-local \
  -jar DynamoDBLocal.jar -sharedDb
```

**Download JAR** (alternative):
```bash
# Download
wget https://s3.ap-northeast-1.amazonaws.com/dynamodb-local-tokyo/dynamodb_local_latest.tar.gz
tar -xzf dynamodb_local_latest.tar.gz

# Run
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb -port 8000
```

#### 2.2 Create Tables (Local)

Use AWS CLI with `--endpoint-url`:

```bash
aws dynamodb create-table \
  --endpoint-url http://localhost:8000 \
  --table-name MiyabiEvents \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST
```

#### 2.3 Verify Tables

```bash
# List tables
aws dynamodb list-tables --endpoint-url http://localhost:8000

# Describe table
aws dynamodb describe-table \
  --endpoint-url http://localhost:8000 \
  --table-name MiyabiEvents
```

---

## 3. Environment Configuration

### 3.1 Copy .env.example

```bash
cd crates/miyabi-web-api
cp .env.example .env
```

### 3.2 Edit .env

**Development (Local PostgreSQL + DynamoDB Local)**:

```bash
# PostgreSQL
DATABASE_URL=postgresql://miyabi:password@localhost:5432/miyabi_dev
DB_MAX_CONNECTIONS=10
DB_MIN_CONNECTIONS=2

# DynamoDB Local
AWS_REGION=local
DYNAMODB_ENDPOINT=http://localhost:8000
DYNAMODB_TIMEOUT=5
```

**Production (AWS RDS + DynamoDB)**:

```bash
# PostgreSQL (RDS)
DATABASE_URL=postgresql://miyabi_admin:PASSWORD@miyabi-production.xxxx.ap-northeast-1.rds.amazonaws.com:5432/postgres
DB_MAX_CONNECTIONS=50
DB_MIN_CONNECTIONS=10

# DynamoDB
AWS_REGION=ap-northeast-1
DYNAMODB_TIMEOUT=5
DYNAMODB_MAX_ATTEMPTS=3

# Use IAM role (don't set AWS_ACCESS_KEY_ID)
```

### 3.3 Secure Secrets (Production)

**Store in AWS Secrets Manager**:

```bash
# Store database password
aws secretsmanager create-secret \
  --name miyabi/database/password \
  --secret-string "super-secret-password"

# Store JWT secret
aws secretsmanager create-secret \
  --name miyabi/jwt/secret \
  --secret-string "$(openssl rand -hex 32)"
```

**Retrieve in application**:

```rust
use aws_sdk_secretsmanager::Client;

async fn get_secret(secret_id: &str) -> Result<String> {
    let config = aws_config::load_from_env().await;
    let client = Client::new(&config);

    let resp = client
        .get_secret_value()
        .secret_id(secret_id)
        .send()
        .await?;

    Ok(resp.secret_string().unwrap().to_string())
}
```

---

## 4. Running Migrations

### 4.1 Install SQLx CLI

```bash
cargo install sqlx-cli --no-default-features --features postgres
```

### 4.2 Run Migrations

**From project root**:

```bash
# Check migration status
sqlx migrate info --source crates/miyabi-web-api/migrations

# Run all pending migrations
sqlx migrate run --source crates/miyabi-web-api/migrations

# Revert last migration
sqlx migrate revert --source crates/miyabi-web-api/migrations
```

**Using migration script** (from `/database`):

```bash
cd database

# Run all migrations
./migrate.sh

# Run migrations + seed data
./migrate.sh --seed

# Dry run (preview)
./migrate.sh --dry-run

# Rollback (WARNING: drops tables!)
./migrate.sh --rollback
```

### 4.3 Verify Migrations

```bash
# Check table count
psql $DATABASE_URL -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

# Check plugins
psql $DATABASE_URL -c "SELECT id, display_name, tier FROM plugins;"
```

---

## 5. Health Checks

### 5.1 PostgreSQL Health Check

```rust
use miyabi_web_api::database::{DatabaseConfig, create_pool};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = DatabaseConfig::from_env()?;
    let pool = create_pool(config).await?;

    // Health check
    sqlx::query("SELECT 1")
        .execute(&pool)
        .await?;

    println!("PostgreSQL: OK");
    Ok(())
}
```

### 5.2 DynamoDB Health Check

```rust
use miyabi_web_api::database::dynamodb::{DynamoDBConfig, create_dynamodb_client};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = DynamoDBConfig::from_env()?;
    let client = create_dynamodb_client(config).await?;

    // Health check
    client.list_tables().limit(1).send().await?;

    println!("DynamoDB: OK");
    Ok(())
}
```

### 5.3 Combined Health Check

```rust
use miyabi_web_api::database::DatabaseContext;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let ctx = DatabaseContext::from_env().await?;

    let health = ctx.health_check().await?;
    println!("Status: {}", health.message());

    if health.is_healthy() {
        println!("✅ All databases healthy");
    } else {
        eprintln!("❌ Some databases unhealthy");
    }

    Ok(())
}
```

---

## 6. Troubleshooting

### PostgreSQL Issues

#### Connection Refused

**Symptom**:
```
Error: Connection refused (os error 111)
```

**Solution**:
1. Check PostgreSQL is running: `pg_isready`
2. Verify host/port in `DATABASE_URL`
3. Check firewall rules (AWS Security Group)

#### Permission Denied

**Symptom**:
```
Error: permission denied for table users
```

**Solution**:
1. Check RLS policies are applied
2. Verify user has correct role
3. Use `service_role` for API backend

#### Too Many Connections

**Symptom**:
```
Error: FATAL: too many clients already
```

**Solution**:
1. Reduce `DB_MAX_CONNECTIONS`
2. Increase PostgreSQL `max_connections`:
   ```sql
   ALTER SYSTEM SET max_connections = 200;
   SELECT pg_reload_conf();
   ```
3. Check for connection leaks

### DynamoDB Issues

#### ResourceNotFoundException

**Symptom**:
```
Error: ResourceNotFoundException: Requested resource not found
```

**Solution**:
1. Verify table names: `aws dynamodb list-tables`
2. Check AWS region matches `AWS_REGION`
3. Ensure tables are created

#### ProvisionedThroughputExceededException

**Symptom**:
```
Error: ProvisionedThroughputExceededException
```

**Solution**:
1. Enable Auto Scaling (see section 2.3)
2. Switch to On-Demand billing
3. Implement exponential backoff

#### Credentials Error

**Symptom**:
```
Error: Unable to locate credentials
```

**Solution**:
1. For EC2: attach IAM role
2. For local: configure AWS CLI (`aws configure`)
3. Or set environment variables:
   ```bash
   export AWS_ACCESS_KEY_ID=...
   export AWS_SECRET_ACCESS_KEY=...
   ```

---

## Next Steps

1. ✅ Set up databases (PostgreSQL + DynamoDB)
2. ✅ Configure environment variables
3. ✅ Run migrations
4. ✅ Verify health checks
5. 📖 Read [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) for schema details
6. 🚀 Start building your application!

---

**Last Updated**: 2025-11-29
**Maintained By**: Miyabi Database Team
