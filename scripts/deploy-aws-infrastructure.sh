#!/bin/bash
# Miyabi AWS Infrastructure Deployment Script
# Phase 0: RDS PostgreSQL + Lambda + API Gateway
# Created: 2025-11-26

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
    exit 1
}

# Configuration
ENVIRONMENT="${1:-production}"  # production or staging
AWS_REGION="us-east-1"
VPC_ID="vpc-08daa048a72579d17"
DB_INSTANCE_CLASS="db.t3.small"
DB_ENGINE="postgres"
DB_ENGINE_VERSION="15.4"
DB_NAME="miyabi"
DB_USERNAME="miyabi_admin"

# Generate secure password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

# Resource names
if [ "$ENVIRONMENT" = "production" ]; then
    DB_INSTANCE_ID="miyabi-postgres-prod"
    DB_SUBNET_GROUP="miyabi-db-subnet-prod"
    SECURITY_GROUP_NAME="miyabi-rds-sg-prod"
else
    DB_INSTANCE_ID="miyabi-postgres-staging"
    DB_SUBNET_GROUP="miyabi-db-subnet-staging"
    SECURITY_GROUP_NAME="miyabi-rds-sg-staging"
fi

log "🚀 Starting Miyabi AWS Infrastructure Deployment"
log "Environment: $ENVIRONMENT"
log "Region: $AWS_REGION"
log "VPC: $VPC_ID"

# Step 1: Create DB Subnet Group
log "📦 Step 1: Creating DB Subnet Group..."

SUBNET_IDS=$(aws ec2 describe-subnets \
    --region $AWS_REGION \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query 'Subnets[*].SubnetId' \
    --output text)

if aws rds describe-db-subnet-groups \
    --region $AWS_REGION \
    --db-subnet-group-name $DB_SUBNET_GROUP 2>/dev/null; then
    warn "DB Subnet Group already exists: $DB_SUBNET_GROUP"
else
    aws rds create-db-subnet-group \
        --region $AWS_REGION \
        --db-subnet-group-name $DB_SUBNET_GROUP \
        --db-subnet-group-description "Miyabi RDS Subnet Group ($ENVIRONMENT)" \
        --subnet-ids $SUBNET_IDS
    log "✅ Created DB Subnet Group: $DB_SUBNET_GROUP"
fi

# Step 2: Create Security Group
log "🔒 Step 2: Creating Security Group..."

SECURITY_GROUP_ID=$(aws ec2 describe-security-groups \
    --region $AWS_REGION \
    --filters "Name=group-name,Values=$SECURITY_GROUP_NAME" "Name=vpc-id,Values=$VPC_ID" \
    --query 'SecurityGroups[0].GroupId' \
    --output text 2>/dev/null || echo "None")

if [ "$SECURITY_GROUP_ID" = "None" ]; then
    SECURITY_GROUP_ID=$(aws ec2 create-security-group \
        --region $AWS_REGION \
        --group-name $SECURITY_GROUP_NAME \
        --description "Security group for Miyabi RDS ($ENVIRONMENT)" \
        --vpc-id $VPC_ID \
        --query 'GroupId' \
        --output text)

    # Allow PostgreSQL from anywhere (WARNING: Restrict in production!)
    aws ec2 authorize-security-group-ingress \
        --region $AWS_REGION \
        --group-id $SECURITY_GROUP_ID \
        --protocol tcp \
        --port 5432 \
        --cidr 0.0.0.0/0

    log "✅ Created Security Group: $SECURITY_GROUP_ID"
else
    warn "Security Group already exists: $SECURITY_GROUP_ID"
fi

# Step 3: Create RDS Instance
log "🗄️  Step 3: Creating RDS PostgreSQL Instance..."
log "   This will take 5-10 minutes..."

if aws rds describe-db-instances \
    --region $AWS_REGION \
    --db-instance-identifier $DB_INSTANCE_ID 2>/dev/null | grep -q "DBInstanceIdentifier"; then
    warn "RDS Instance already exists: $DB_INSTANCE_ID"
    DB_ENDPOINT=$(aws rds describe-db-instances \
        --region $AWS_REGION \
        --db-instance-identifier $DB_INSTANCE_ID \
        --query 'DBInstances[0].Endpoint.Address' \
        --output text)
else
    aws rds create-db-instance \
        --region $AWS_REGION \
        --db-instance-identifier $DB_INSTANCE_ID \
        --db-instance-class $DB_INSTANCE_CLASS \
        --engine $DB_ENGINE \
        --engine-version $DB_ENGINE_VERSION \
        --master-username $DB_USERNAME \
        --master-user-password "$DB_PASSWORD" \
        --allocated-storage 20 \
        --storage-type gp3 \
        --storage-encrypted \
        --db-subnet-group-name $DB_SUBNET_GROUP \
        --vpc-security-group-ids $SECURITY_GROUP_ID \
        --backup-retention-period 7 \
        --preferred-backup-window "03:00-04:00" \
        --preferred-maintenance-window "Mon:04:00-Mon:05:00" \
        --publicly-accessible true \
        --db-name $DB_NAME \
        --no-multi-az \
        --no-deletion-protection

    log "✅ RDS Instance creation initiated: $DB_INSTANCE_ID"
    log "   Waiting for instance to be available..."

    aws rds wait db-instance-available \
        --region $AWS_REGION \
        --db-instance-identifier $DB_INSTANCE_ID

    DB_ENDPOINT=$(aws rds describe-db-instances \
        --region $AWS_REGION \
        --db-instance-identifier $DB_INSTANCE_ID \
        --query 'DBInstances[0].Endpoint.Address' \
        --output text)

    log "✅ RDS Instance is available!"
fi

log "📝 Database Endpoint: $DB_ENDPOINT"

# Step 4: Save Configuration
log "💾 Step 4: Saving Configuration..."

CONFIG_FILE="config/aws-${ENVIRONMENT}.env"
mkdir -p config

cat > $CONFIG_FILE <<EOF
# Miyabi AWS Configuration - $ENVIRONMENT
# Generated: $(date)
# DO NOT COMMIT THIS FILE

# Database Configuration
DATABASE_URL="postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_ENDPOINT}:5432/${DB_NAME}"
DB_HOST="${DB_ENDPOINT}"
DB_PORT="5432"
DB_NAME="${DB_NAME}"
DB_USERNAME="${DB_USERNAME}"
DB_PASSWORD="${DB_PASSWORD}"

# AWS Configuration
AWS_REGION="${AWS_REGION}"
VPC_ID="${VPC_ID}"
SECURITY_GROUP_ID="${SECURITY_GROUP_ID}"
DB_SUBNET_GROUP="${DB_SUBNET_GROUP}"
DB_INSTANCE_ID="${DB_INSTANCE_ID}"

# Application Configuration
JWT_SECRET="$(openssl rand -base64 32)"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
SERVER_ADDRESS="0.0.0.0:8080"
RUST_LOG="info,miyabi_web_api=debug"
EOF

log "✅ Configuration saved to: $CONFIG_FILE"

# Step 5: Test Connection
log "🔌 Step 5: Testing Database Connection..."

if command -v psql &> /dev/null; then
    if psql "postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_ENDPOINT}:5432/${DB_NAME}" -c "SELECT version();" 2>/dev/null | grep -q "PostgreSQL"; then
        log "✅ Database connection successful!"
    else
        warn "⚠️  Could not connect to database. It may still be initializing."
        warn "   Wait 1-2 minutes and try manually:"
        warn "   psql \"postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_ENDPOINT}:5432/${DB_NAME}\""
    fi
else
    warn "⚠️  psql not installed. Skipping connection test."
fi

# Summary
log "🎉 Infrastructure Deployment Complete!"
log ""
log "📋 Summary:"
log "   Environment: $ENVIRONMENT"
log "   RDS Instance: $DB_INSTANCE_ID"
log "   Endpoint: $DB_ENDPOINT"
log "   Database: $DB_NAME"
log "   Username: $DB_USERNAME"
log "   Security Group: $SECURITY_GROUP_ID"
log ""
log "📝 Configuration File: $CONFIG_FILE"
log ""
log "🔐 IMPORTANT: Store credentials securely!"
log "   Password: $DB_PASSWORD"
log ""
log "📊 Monthly Cost Estimate:"
log "   RDS db.t3.small: ~$24/month"
log "   Storage (20GB): ~$2/month"
log "   Total: ~$26/month"
log ""
log "🚀 Next Steps:"
log "   1. Source configuration: source $CONFIG_FILE"
log "   2. Run migrations: cd crates/miyabi-web-api && sqlx migrate run"
log "   3. Build release: cargo build --release --package miyabi-web-api"
log "   4. Deploy to Lambda: ./scripts/deploy-lambda.sh"
