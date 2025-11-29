# Miyabi Database Backup Strategy

**Version**: 1.0.0
**Last Updated**: 2025-11-29
**Author**: Miyabi Backup System

---

## Overview

This document describes the comprehensive database backup and restore strategy for the Miyabi project. The system supports both PostgreSQL and SQLite databases with automated backups, rotation policies, and easy restoration procedures.

---

## Table of Contents

1. [Database Architecture](#database-architecture)
2. [Backup Strategy](#backup-strategy)
3. [Installation & Setup](#installation--setup)
4. [Manual Backup Operations](#manual-backup-operations)
5. [Restore Procedures](#restore-procedures)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Disaster Recovery](#disaster-recovery)
8. [Troubleshooting](#troubleshooting)

---

## Database Architecture

### PostgreSQL (Primary Database)

**Location**: `postgresql://postgres:temppass@localhost:5433/miyabi`

**Purpose**: Web API data storage

**Tables**:
- `users` - User authentication and profiles
- `repositories` - Connected GitHub repositories
- `agent_executions` - Agent execution history and results
- `workflows` - Workflow definitions
- `line_messages` - LINE integration message logs
- `websocket_connections` - Active WebSocket connections

**Backup Method**: `pg_dump` with gzip compression

---

### SQLite (Persistence Layer)

**Locations**:
- `data/miyabi.db` - Main application database
- `crates/miyabi-persistence/miyabi-persistence.db` - Persistence layer

**Purpose**: Local state management, execution tracking

**Tables**:
- `execution_runs` - Agent execution records
- `checkpoints` - Execution checkpoints
- `worktrees` - Git worktree management

**Backup Method**: `sqlite3 .backup` with gzip compression

---

## Backup Strategy

### Backup Schedule

| Type | Frequency | Retention | Storage Location |
|------|-----------|-----------|------------------|
| **Daily** | Every day at 3:00 AM | 7 days | `backups/{postgres,sqlite}/daily/` |
| **Weekly** | Every Monday at 3:00 AM | 28 days (4 weeks) | `backups/{postgres,sqlite}/weekly/` |
| **Monthly** | 1st of each month at 3:00 AM | 180 days (6 months) | `backups/{postgres,sqlite}/monthly/` |

### Backup Types

#### Daily Backups
- **Purpose**: Short-term recovery
- **Retention**: 7 days
- **Format**: Compressed SQL dump (PostgreSQL) or database file (SQLite)
- **Size**: ~10-50MB (compressed)

#### Weekly Backups
- **Purpose**: Mid-term recovery
- **Retention**: 4 weeks
- **Format**: Same as daily
- **Trigger**: Automatically created on Mondays

#### Monthly Backups
- **Purpose**: Long-term archival
- **Retention**: 6 months
- **Format**: Same as daily
- **Trigger**: Automatically created on the 1st of each month

### Storage Strategy

```
miyabi-private/
├── backups/
│   ├── postgres/
│   │   ├── daily/
│   │   │   ├── postgres-miyabi-20251129-030000.sql.gz
│   │   │   └── postgres-miyabi-20251129-030000.sql.gz.meta
│   │   ├── weekly/
│   │   │   └── postgres-miyabi-20251202-030000.sql.gz
│   │   └── monthly/
│   │       └── postgres-miyabi-20251201-030000.sql.gz
│   └── sqlite/
│       ├── daily/
│       │   ├── sqlite-miyabi-20251129-030000.db.gz
│       │   └── manifest-20251129-030000.json
│       ├── weekly/
│       └── monthly/
```

### Metadata Files

Each backup includes metadata:

```json
{
  "timestamp": "2025-11-29T03:00:00+00:00",
  "database": "miyabi",
  "host": "localhost",
  "port": "5433",
  "backup_type": "daily",
  "size_bytes": 12345678,
  "size_human": "12M",
  "compression": "gzip -9",
  "format": "sql"
}
```

---

## Installation & Setup

### Prerequisites

**PostgreSQL Backups**:
```bash
# Install PostgreSQL client tools
sudo apt-get install postgresql-client

# Verify installation
pg_dump --version
```

**SQLite Backups**:
```bash
# Install SQLite
sudo apt-get install sqlite3

# Verify installation
sqlite3 --version
```

**AWS S3 Upload (Optional)**:
```bash
# Install AWS CLI
sudo apt-get install awscli

# Configure credentials
aws configure
```

### Initial Setup

#### 1. Configure Environment Variables

Edit `openai-apps/miyabi-app/server/.env`:

```bash
# Database connection
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_NAME=miyabi
DATABASE_USER=postgres
DATABASE_PASSWORD=your-secure-password

# Optional: S3 backup upload
AWS_S3_BACKUP_BUCKET=your-backup-bucket
```

#### 2. Install Automated Backups

```bash
# Navigate to scripts directory
cd /home/ubuntu/miyabi-private/scripts

# Run setup (auto-detects systemd or cron)
./setup-backup-schedule.sh

# Or specify method and time
./setup-backup-schedule.sh --method systemd --time 03:00
./setup-backup-schedule.sh --method cron --time 02:30
```

#### 3. Verify Installation

**For systemd**:
```bash
# Check timer status
systemctl --user status miyabi-backup.timer

# List all timers
systemctl --user list-timers

# View next scheduled run
systemctl --user list-timers miyabi-backup.timer
```

**For cron**:
```bash
# View crontab
crontab -l

# Expected output:
# 0 3 * * * /home/ubuntu/miyabi-private/scripts/backup-all.sh
```

---

## Manual Backup Operations

### Full System Backup

```bash
# Run all backups (PostgreSQL + SQLite)
./scripts/backup-all.sh
```

### PostgreSQL Only

```bash
# Run PostgreSQL backup
./scripts/backup-postgres.sh
```

### SQLite Only

```bash
# Run SQLite backup
./scripts/backup-sqlite.sh
```

### Verify Backup Integrity

**PostgreSQL**:
```bash
# Test restore to temporary database
gunzip -c backups/postgres/daily/postgres-miyabi-20251129-030000.sql.gz | \
  psql -h localhost -p 5433 -U postgres -d test_restore
```

**SQLite**:
```bash
# Extract and verify
gunzip -c backups/sqlite/daily/sqlite-miyabi-20251129-030000.db.gz > /tmp/test.db
sqlite3 /tmp/test.db "PRAGMA integrity_check;"
```

### List Available Backups

```bash
# List all backups
find backups/ -name "*.gz" -type f | sort

# List recent daily backups
ls -lh backups/postgres/daily/
ls -lh backups/sqlite/daily/

# Check total backup size
du -sh backups/
```

---

## Restore Procedures

### Quick Restore Guide

The restore script provides an interactive interface:

```bash
./scripts/restore-database.sh \
  --type postgres \
  --file backups/postgres/daily/postgres-miyabi-20251129-030000.sql.gz
```

### PostgreSQL Restore

#### Full Database Restore

```bash
# With confirmation prompt
./scripts/restore-database.sh \
  --type postgres \
  --file backups/postgres/daily/postgres-miyabi-20251129-030000.sql.gz

# Skip confirmation (for automation)
./scripts/restore-database.sh \
  --type postgres \
  --file backups/postgres/daily/postgres-miyabi-20251129-030000.sql.gz \
  --confirm
```

#### Restore to Different Database

```bash
./scripts/restore-database.sh \
  --type postgres \
  --file backups/postgres/daily/postgres-miyabi-20251129-030000.sql.gz \
  --database miyabi_restored
```

#### Manual Restore (Advanced)

```bash
# Stop application
sudo systemctl stop miyabi-web-api

# Drop existing database
psql -h localhost -p 5433 -U postgres -d postgres \
  -c "DROP DATABASE IF EXISTS miyabi;"

# Create new database
psql -h localhost -p 5433 -U postgres -d postgres \
  -c "CREATE DATABASE miyabi;"

# Restore from backup
gunzip -c backups/postgres/daily/postgres-miyabi-20251129-030000.sql.gz | \
  psql -h localhost -p 5433 -U postgres -d miyabi

# Restart application
sudo systemctl start miyabi-web-api
```

---

### SQLite Restore

#### Full Database Restore

```bash
./scripts/restore-database.sh \
  --type sqlite \
  --file backups/sqlite/daily/sqlite-miyabi-20251129-030000.db.gz \
  --database data/miyabi.db
```

**Note**: The existing database will be backed up automatically before restore as:
```
data/miyabi.db.before-restore-20251129-120000
```

#### Manual Restore (Advanced)

```bash
# Stop application
sudo systemctl stop miyabi-persistence

# Backup current database
cp data/miyabi.db data/miyabi.db.backup-$(date +%Y%m%d-%H%M%S)

# Restore from backup
gunzip -c backups/sqlite/daily/sqlite-miyabi-20251129-030000.db.gz > data/miyabi.db

# Verify integrity
sqlite3 data/miyabi.db "PRAGMA integrity_check;"

# Restart application
sudo systemctl start miyabi-persistence
```

---

## Monitoring & Maintenance

### Check Backup Status

**Systemd**:
```bash
# View recent backup logs
journalctl --user -u miyabi-backup.service -n 50

# View backup execution history
journalctl --user -u miyabi-backup.service --since today

# Real-time log monitoring
journalctl --user -u miyabi-backup.service -f
```

**Cron**:
```bash
# View backup log
tail -f logs/backup-cron.log

# View last 50 lines
tail -n 50 logs/backup-cron.log
```

### Backup Health Checks

```bash
# Check backup freshness
find backups/postgres/daily -name "*.sql.gz" -mtime -1 -ls
find backups/sqlite/daily -name "*.db.gz" -mtime -1 -ls

# Check backup sizes (should be consistent)
du -h backups/postgres/daily/*.sql.gz | tail -7
du -h backups/sqlite/daily/*.db.gz | tail -7

# Count backups
echo "Daily: $(find backups/*/daily -name "*.gz" | wc -l)"
echo "Weekly: $(find backups/*/weekly -name "*.gz" | wc -l)"
echo "Monthly: $(find backups/*/monthly -name "*.gz" | wc -l)"
```

### Disk Space Management

```bash
# Check backup directory size
du -sh backups/

# Check available disk space
df -h /home/ubuntu/miyabi-private/backups

# Estimate space needed for next 30 days
DAILY_SIZE=$(du -sb backups/postgres/daily | tail -1 | cut -f1)
echo "Estimated 30-day usage: $((DAILY_SIZE * 30 / 1024 / 1024 / 1024)) GB"
```

### Manual Rotation

```bash
# Force cleanup of old backups
find backups/postgres/daily -name "*.sql.gz" -mtime +7 -delete
find backups/sqlite/daily -name "*.db.gz" -mtime +7 -delete

find backups/postgres/weekly -name "*.sql.gz" -mtime +28 -delete
find backups/sqlite/weekly -name "*.db.gz" -mtime +28 -delete

find backups/postgres/monthly -name "*.sql.gz" -mtime +180 -delete
find backups/sqlite/monthly -name "*.db.gz" -mtime +180 -delete
```

---

## Disaster Recovery

### Recovery Time Objective (RTO)

| Scenario | Target RTO | Steps |
|----------|------------|-------|
| Single database corruption | 15 minutes | Restore from most recent daily backup |
| Complete system failure | 30 minutes | Restore from daily + reconfigure services |
| Data center disaster | 2 hours | Restore from S3 backup + rebuild infrastructure |

### Recovery Point Objective (RPO)

| Backup Type | Max Data Loss |
|-------------|---------------|
| Daily | 24 hours |
| Weekly | 1 week |
| Monthly | 1 month |

### Disaster Recovery Procedure

#### 1. Data Loss Incident

```bash
# 1. Stop affected services
sudo systemctl stop miyabi-web-api miyabi-persistence

# 2. Identify last good backup
ls -lht backups/postgres/daily/ | head -5
ls -lht backups/sqlite/daily/ | head -5

# 3. Restore databases
./scripts/restore-database.sh \
  --type postgres \
  --file backups/postgres/daily/latest-good-backup.sql.gz \
  --confirm

./scripts/restore-database.sh \
  --type sqlite \
  --file backups/sqlite/daily/latest-good-backup.db.gz \
  --database data/miyabi.db \
  --confirm

# 4. Verify data integrity
psql -h localhost -p 5433 -U postgres -d miyabi -c "SELECT COUNT(*) FROM users;"
sqlite3 data/miyabi.db "SELECT COUNT(*) FROM execution_runs;"

# 5. Restart services
sudo systemctl start miyabi-persistence miyabi-web-api

# 6. Verify application functionality
curl http://localhost:8000/health
```

#### 2. Download from S3 (if available)

```bash
# List available S3 backups
aws s3 ls s3://your-bucket/miyabi/postgres/daily/

# Download specific backup
aws s3 cp \
  s3://your-bucket/miyabi/postgres/daily/postgres-miyabi-20251129-030000.sql.gz \
  backups/postgres/daily/

# Restore as usual
./scripts/restore-database.sh \
  --type postgres \
  --file backups/postgres/daily/postgres-miyabi-20251129-030000.sql.gz
```

---

## Troubleshooting

### Backup Failures

#### PostgreSQL: "pg_dump: command not found"

```bash
# Install PostgreSQL client
sudo apt-get update
sudo apt-get install postgresql-client

# Verify version
pg_dump --version
```

#### PostgreSQL: Connection refused

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Verify connection settings
psql -h localhost -p 5433 -U postgres -d miyabi -c "SELECT 1;"

# Check .env file for correct credentials
cat openai-apps/miyabi-app/server/.env | grep DATABASE
```

#### SQLite: Database is locked

```bash
# Check for running processes
lsof data/miyabi.db

# Wait for transactions to complete or kill blocking process
kill -9 <PID>

# Retry backup
./scripts/backup-sqlite.sh
```

#### Disk space full

```bash
# Check disk usage
df -h /home/ubuntu/miyabi-private

# Clean up old backups
find backups/ -name "*.gz" -mtime +30 -delete

# Move backups to external storage
rsync -av backups/ /mnt/external-backup/
```

### Restore Issues

#### PostgreSQL: "database already exists"

```bash
# Drop existing database first
psql -h localhost -p 5433 -U postgres -d postgres \
  -c "DROP DATABASE miyabi;"

# Then restore
./scripts/restore-database.sh --type postgres --file ...
```

#### SQLite: Integrity check failed

```bash
# Try different backup
./scripts/restore-database.sh \
  --type sqlite \
  --file backups/sqlite/weekly/older-backup.db.gz \
  --database data/miyabi.db

# If all backups fail, check filesystem
fsck /dev/sda1
```

---

## Best Practices

### Security

1. **Encrypt sensitive backups**:
   ```bash
   # Encrypt before upload to S3
   gpg --symmetric --cipher-algo AES256 backup.sql.gz
   aws s3 cp backup.sql.gz.gpg s3://bucket/encrypted/
   ```

2. **Restrict backup file permissions**:
   ```bash
   chmod 600 backups/*/*.gz
   chown ubuntu:ubuntu backups/
   ```

3. **Use separate AWS credentials for backups**:
   - Create dedicated IAM user with S3-only permissions
   - Store credentials in `~/.aws/credentials`

### Testing

1. **Monthly restore drill**:
   - Schedule monthly restore test to verify backups
   - Document restore time and any issues

2. **Automated backup verification**:
   ```bash
   # Add to crontab for weekly verification
   0 4 * * 0 /home/ubuntu/miyabi-private/scripts/verify-backups.sh
   ```

### Monitoring

1. **Set up alerts**:
   - Failed backup notifications
   - Disk space warnings (< 10GB free)
   - Backup size anomalies (> 50% change)

2. **Dashboard metrics**:
   - Last successful backup timestamp
   - Backup size trend
   - Storage utilization

---

## Support & Contact

For issues with the backup system:

1. Check logs: `journalctl --user -u miyabi-backup.service`
2. Review this documentation
3. Create GitHub issue: https://github.com/customer-cloud/miyabi-private/issues
4. Contact: Miyabi DevOps Team

---

**Document Version**: 1.0.0
**Last Review**: 2025-11-29
**Next Review**: 2026-01-29
