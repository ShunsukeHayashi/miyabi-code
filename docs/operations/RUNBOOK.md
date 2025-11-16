# Miyabi Operations Runbook

**Version**: 1.0.0  
**Last Updated**: 2025-11-17  
**Owner**: Operations Team

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Daily Operations](#daily-operations)
3. [Common Tasks](#common-tasks)
4. [Emergency Procedures](#emergency-procedures)
5. [Monitoring & Alerting](#monitoring--alerting)
6. [Deployment Procedures](#deployment-procedures)

---

## System Overview

### Infrastructure

**Primary Servers**:
- **MUGEN** (AWS EC2): Main development server
  - IP: 44.250.27.197
  - Instance: r5.4xlarge (16 vCPU, 128GB RAM)
  - Purpose: Miyabi orchestration, development

- **Pixel Termux**: Mobile orchestration gateway
  - IP: 192.168.3.9 (dynamic)
  - Purpose: Remote access, mobile workflows

- **MacBook**: Orchestration coordination
  - IP: 100.112.127.63 (Tailscale)
  - Purpose: tmux orchestration, MacOS workflows

### Key Services

- **Git Repositories**: ~/miyabi-private, ~/miyabi-pr-worker-*
- **Claude Code**: AI development assistant
- **GitHub**: Issue tracking, PR management
- **Tmux**: Session management
- **SSH**: Remote connectivity

---

## Daily Operations

### Morning Checklist

```bash
# 1. Check system health
ssh mugen "uptime && df -h && free -h"

# 2. Verify services
ssh mugen "pgrep -f miyabi && tmux ls"

# 3. Check git status
ssh mugen "cd ~/miyabi-private && git status && git log -1"

# 4. Review open issues
ssh mugen "cd ~/miyabi-private && gh issue list --state open --limit 10"

# 5. Check recent PRs
ssh mugen "cd ~/miyabi-private && gh pr list --state merged --limit 5"
```

### Evening Checklist

```bash
# 1. Commit day's work
cd ~/miyabi-private
git status
git add .
git commit -m "Daily checkpoint"

# 2. Push to remote
git push origin main

# 3. Generate daily report
bash .claude/scripts/generate-report.sh daily

# 4. Backup critical data
rsync -av ~/.miyabi/ ~/backups/miyabi-$(date +%Y%m%d)/

# 5. Plan tomorrow
gh issue list --label "priority:P0-Critical" --state open
```

---

## Common Tasks

### Task 1: Process New Issue

```bash
# 1. Fetch latest
cd ~/miyabi-private
git pull origin main

# 2. View issue
ISSUE_NUM=XXX
gh issue view $ISSUE_NUM

# 3. Create worktree branch
git worktree add ~/miyabi-pr-worker-1 -b feat/issue-$ISSUE_NUM

# 4. Work on issue
cd ~/miyabi-pr-worker-1
# ... make changes ...

# 5. Commit and create PR
git add .
git commit -m "fix: Address issue #$ISSUE_NUM"
git push -u origin feat/issue-$ISSUE_NUM
gh pr create --title "fix: Issue #$ISSUE_NUM" --body "Closes #$ISSUE_NUM"

# 6. Merge PR
gh pr merge --squash --delete-branch
```

### Task 2: Emergency Hotfix

```bash
# 1. Create hotfix branch
cd ~/miyabi-private
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix

# 2. Apply fix
# ... make changes ...

# 3. Fast-track to production
git add .
git commit -m "hotfix: Critical production fix"
git push -u origin hotfix/critical-fix
gh pr create --title "HOTFIX: Critical fix" --body "Emergency fix"
gh pr merge --squash --delete-branch

# 4. Notify team
echo "Hotfix deployed" | mail -s "HOTFIX: Production" team@example.com
```

### Task 3: Backup & Restore

```bash
# Backup
tar -czf miyabi-backup-$(date +%Y%m%d).tar.gz ~/miyabi-private ~/.miyabi
scp miyabi-backup-$(date +%Y%m%d).tar.gz backup-server:/backups/

# Restore
scp backup-server:/backups/miyabi-backup-YYYYMMDD.tar.gz .
tar -xzf miyabi-backup-YYYYMMDD.tar.gz
```

---

## Emergency Procedures

### Scenario 1: Server Down

**Detection**: Cannot SSH to MUGEN

**Response**:
1. Check AWS Console for instance status
2. Verify network connectivity: `ping 44.250.27.197`
3. Check security groups: Port 22 open?
4. If instance stopped: Start via AWS Console
5. If instance terminated: Restore from snapshot

**Recovery Time**: 5-15 minutes

### Scenario 2: Git Repository Corruption

**Detection**: `git status` errors, corruption messages

**Response**:
```bash
# 1. Backup current state
cp -r ~/miyabi-private ~/miyabi-private.backup

# 2. Try repair
cd ~/miyabi-private
git fsck --full
git gc --aggressive --prune=now

# 3. If repair fails, re-clone
cd ~
mv miyabi-private miyabi-private.corrupted
gh repo clone customer-cloud/miyabi-private
```

**Recovery Time**: 10-30 minutes

### Scenario 3: Disk Full

**Detection**: `df -h` shows 100% usage

**Response**:
```bash
# 1. Identify large files
du -sh ~/.miyabi/* | sort -rh | head -10

# 2. Clean logs
find ~/.miyabi/logs -name "*.log" -mtime +30 -delete
find /tmp -name "claude-*" -mtime +7 -delete

# 3. Clean git worktrees
cd ~/miyabi-private
git worktree prune

# 4. Clean docker (if applicable)
docker system prune -af

# 5. Compress old files
gzip ~/.miyabi/logs/*.log
```

**Recovery Time**: 5-10 minutes

---

## Monitoring & Alerting

### Key Metrics

**System Health**:
- CPU usage: <70% normal, >90% alert
- Memory usage: <80% normal, >95% alert  
- Disk usage: <80% normal, >90% alert
- Network connectivity: 100% uptime target

**Application Health**:
- Git operations: 100% success rate
- PR merge rate: >95% success
- Issue closure rate: Track daily
- Claude Code availability: >99% uptime

### Manual Health Check

```bash
#!/bin/bash
# health-check.sh

echo "=== System Health Check $(date) ==="

# CPU
CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d% -f1)
echo "CPU: ${CPU}%"
[[ $(echo "$CPU > 90" | bc) -eq 1 ]] && echo "⚠️ CPU HIGH"

# Memory
MEM=$(free | grep Mem | awk '{print int($3/$2*100)}')
echo "Memory: ${MEM}%"
[[ $MEM -gt 95 ]] && echo "⚠️ MEMORY HIGH"

# Disk
DISK=$(df -h ~ | tail -1 | awk '{print $5}' | sed 's/%//')
echo "Disk: ${DISK}%"
[[ $DISK -gt 90 ]] && echo "⚠️ DISK HIGH"

# Services
pgrep sshd >/dev/null && echo "✅ SSH running" || echo "❌ SSH down"
tmux ls >/dev/null 2>&1 && echo "✅ Tmux running" || echo "⚠️ No tmux sessions"
```

---

## Deployment Procedures

### Standard Deployment

```bash
# 1. Pre-deployment checks
cd ~/miyabi-private
git status  # Ensure clean working directory
git pull origin main
cargo test  # Run tests

# 2. Deployment
git tag -a v$(date +%Y.%m.%d) -m "Deployment $(date)"
git push origin --tags

# 3. Post-deployment verification
# Verify services are running
# Check logs for errors
# Monitor metrics for anomalies

# 4. Rollback if needed
git reset --hard HEAD~1
git push -f origin main
```

### Emergency Rollback

```bash
# 1. Identify last good version
git log --oneline -10

# 2. Rollback
git reset --hard <commit-hash>
git push -f origin main

# 3. Notify team
echo "Rollback to <commit-hash>" | mail -s "ROLLBACK" team@example.com
```

---

## Contacts

**On-Call Rotation**:
- Primary: [Engineer 1]
- Secondary: [Engineer 2]
- Escalation: [Team Lead]

**External Support**:
- AWS Support: [Account details]
- GitHub Support: [Support ticket system]

---

## Related Documents

- [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)
- [Disaster Recovery Plan](./DR_PLAN.md)
- [Onboarding Guide](./ONBOARDING_GUIDE.md)

---

**Document Owner**: Operations Team  
**Review Schedule**: Monthly  
**Next Review**: 2025-12-17
