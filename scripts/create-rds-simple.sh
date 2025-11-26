#!/bin/bash
# Simplified RDS creation

set -e

DB_PASSWORD=$(openssl rand -base64 32 | tr -d '=+/' | cut -c1-32)

echo "🚀 Creating RDS PostgreSQL..."
echo "Password: $DB_PASSWORD"

aws rds create-db-instance \
  --region us-east-1 \
  --db-instance-identifier miyabi-postgres-prod \
  --db-instance-class db.t3.small \
  --engine postgres \
  --engine-version 15.15 \
  --master-username miyabi_admin \
  --master-user-password "$DB_PASSWORD" \
  --allocated-storage 20 \
  --storage-type gp3 \
  --storage-encrypted \
  --db-subnet-group-name miyabi-db-subnet-prod \
  --vpc-security-group-ids sg-065ba77c858a02964 \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "Mon:04:00-Mon:05:00" \
  --publicly-accessible \
  --db-name miyabi

mkdir -p config
echo "$DB_PASSWORD" > config/.db-password-prod.txt

echo "✅ RDS creation initiated"
echo "📝 Password saved to: config/.db-password-prod.txt"
echo "⏳ Waiting for instance to be available (5-10 min)..."

aws rds wait db-instance-available \
  --region us-east-1 \
  --db-instance-identifier miyabi-postgres-prod

echo "✅ RDS Instance is ready!"

# Get endpoint
ENDPOINT=$(aws rds describe-db-instances \
  --region us-east-1 \
  --db-instance-identifier miyabi-postgres-prod \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

echo "📍 Endpoint: $ENDPOINT"

# Create DATABASE_URL
DATABASE_URL="postgresql://miyabi_admin:${DB_PASSWORD}@${ENDPOINT}:5432/miyabi"
echo "$DATABASE_URL" > config/.database-url-prod.txt

echo ""
echo "DATABASE_URL saved to: config/.database-url-prod.txt"
