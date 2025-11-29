# Miyabi Database Backup - Quick Start Guide

**Version**: 1.0.0
**Time to Complete**: 5 minutes

---

## TL;DR - 3 Steps to Automated Backups

```bash
# 1. Install backup schedule (runs daily at 3:00 AM)
cd /home/ubuntu/miyabi-private/scripts
./setup-backup-schedule.sh

# 2. Run manual backup to test
./backup-all.sh

# 3. Verify it worked
ls -lh ../backups/postgres/daily/
ls -lh ../backups/sqlite/daily/
```

That's it! Your databases are now backed up automatically.

---

## Installation (Detailed)

### Step 1: Prerequisites Check

```bash
# Check if required tools are installed
command -v pg_dump >/dev/null 2>&1 || echo "⚠️  Install: sudo apt-get install postgresql-client"
command -v sqlite3 >/dev/null 2>&1 || echo "⚠️  Install: sudo apt-get install sqlite3"

# Install if needed
sudo apt-get update
sudo apt-get install postgresql-client sqlite3 -y
```

### Step 2: Configure Database Connection

Edit `.env` file:

```bash
nano openai-apps/miyabi-app/server/.env
```

Verify these settings:

```bash
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_NAME=miyabi
DATABASE_USER=postgres
DATABASE_PASSWORD=your-password
```

### Step 3: Install Automated Backups

```bash
cd scripts
./setup-backup-schedule.sh
```

**Output**:
```
========================================
Miyabi Backup Schedule Setup
========================================
Method: systemd
Time: 03:00
Backup script: /home/ubuntu/miyabi-private/scripts/backup-all.sh

========================================
Setting up Systemd Timer
========================================
Systemd timer installed successfully!
Schedule: Daily at 03:00

Next scheduled run:
Fri 2025-11-29 03:00:00 UTC  miyabi-backup.timer

========================================
Setup Complete!
========================================
```

---

## Usage

### Run Manual Backup

```bash
# Full system backup (PostgreSQL + SQLite)
./scripts/backup-all.sh

# PostgreSQL only
./scripts/backup-postgres.sh

# SQLite only
./scripts/backup-sqlite.sh
```

### Restore from Backup

```bash
# List available backups
find backups/ -name "*.gz" -type f | sort

# Restore PostgreSQL
./scripts/restore-database.sh \
  --type postgres \
  --file backups/postgres/daily/postgres-miyabi-20251129-030000.sql.gz

# Restore SQLite
./scripts/restore-database.sh \
  --type sqlite \
  --file backups/sqlite/daily/sqlite-miyabi-20251129-030000.db.gz \
  --database data/miyabi.db
```

---

## Verification

### Check Backup Status

**Systemd**:
```bash
# View timer status
systemctl --user status miyabi-backup.timer

# View recent logs
journalctl --user -u miyabi-backup.service -n 20
```

**Cron**:
```bash
# View crontab
crontab -l

# View logs
tail -f logs/backup-cron.log
```

### Verify Backups Exist

```bash
# Check latest backups
ls -lht backups/postgres/daily/ | head -3
ls -lht backups/sqlite/daily/ | head -3

# Check backup sizes
du -sh backups/*/daily/

# Count total backups
echo "Total backups: $(find backups/ -name "*.gz" | wc -l)"
```

---

## Common Operations

### Change Backup Time

```bash
# Re-run setup with different time
./scripts/setup-backup-schedule.sh --time 02:30
```

### Disable Backups

```bash
# Uninstall backup schedule
./scripts/setup-backup-schedule.sh --uninstall
```

### Manual Cleanup

```bash
# Remove old backups (older than 30 days)
find backups/ -name "*.gz" -mtime +30 -delete
```

---

## Emergency Restore

### Scenario: Database Corruption

```bash
# 1. Stop services
sudo systemctl stop miyabi-web-api

# 2. Find latest good backup
ls -lht backups/postgres/daily/ | head -1

# 3. Restore
./scripts/restore-database.sh \
  --type postgres \
  --file backups/postgres/daily/latest-backup.sql.gz \
  --confirm

# 4. Restart services
sudo systemctl start miyabi-web-api
```

---

## Backup Schedule

| Type | Frequency | Retention | Location |
|------|-----------|-----------|----------|
| Daily | 3:00 AM daily | 7 days | `backups/*/daily/` |
| Weekly | 3:00 AM Monday | 4 weeks | `backups/*/weekly/` |
| Monthly | 3:00 AM 1st day | 6 months | `backups/*/monthly/` |

---

## File Structure

```
miyabi-private/
├── backups/
│   ├── postgres/
│   │   ├── daily/    # Last 7 days
│   │   ├── weekly/   # Last 4 weeks
│   │   └── monthly/  # Last 6 months
│   └── sqlite/
│       ├── daily/
│       ├── weekly/
│       └── monthly/
└── scripts/
    ├── backup-all.sh           # Run all backups
    ├── backup-postgres.sh      # PostgreSQL backup
    ├── backup-sqlite.sh        # SQLite backup
    ├── restore-database.sh     # Restore utility
    └── setup-backup-schedule.sh # Install automation
```

---

## Troubleshooting

### Backup Failed

```bash
# Check logs
journalctl --user -u miyabi-backup.service -n 50

# Test manual backup
./scripts/backup-all.sh

# Check disk space
df -h /home/ubuntu/miyabi-private
```

### Connection Error

```bash
# Test PostgreSQL connection
psql -h localhost -p 5433 -U postgres -d miyabi -c "SELECT 1;"

# Check .env settings
cat openai-apps/miyabi-app/server/.env | grep DATABASE
```

---

## Next Steps

1. **Enable S3 Uploads** (Optional):
   ```bash
   # Add to .env
   AWS_S3_BACKUP_BUCKET=your-backup-bucket

   # Test upload
   ./scripts/backup-all.sh
   ```

2. **Set Up Monitoring**:
   - Configure backup failure alerts
   - Monitor disk space usage
   - Schedule monthly restore drills

3. **Read Full Documentation**:
   - [BACKUP_STRATEGY.md](BACKUP_STRATEGY.md) - Complete guide
   - [Disaster Recovery](BACKUP_STRATEGY.md#disaster-recovery)
   - [Best Practices](BACKUP_STRATEGY.md#best-practices)

---

## Support

- Documentation: [BACKUP_STRATEGY.md](BACKUP_STRATEGY.md)
- Issues: https://github.com/customer-cloud/miyabi-private/issues
- Logs: `journalctl --user -u miyabi-backup.service`

---

**Quick Start Complete!** 🎉

Your databases are now protected with automated backups.
