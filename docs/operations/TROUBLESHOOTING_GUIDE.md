# Miyabi Troubleshooting Guide

**Version**: 1.0.0  
**Last Updated**: 2025-11-17

---

## Quick Reference

| Problem | Quick Fix | Details |
|---------|-----------|---------|
| SSH connection refused | Check SSHD: `pgrep sshd \|\| sshd` | [Link](#ssh-issues) |
| Git push rejected | `git pull --rebase` | [Link](#git-issues) |
| Disk full | Clean logs & tmp files | [Link](#storage-issues) |
| High memory | Restart services, check leaks | [Link](#performance-issues) |
| Claude Code timeout | Check API key, network | [Link](#claude-code-issues) |

---

## SSH Issues

### Problem: Cannot connect to MUGEN

**Symptoms**:
```
ssh: connect to host 44.250.27.197 port 22: Connection refused
```

**Diagnosis**:
```bash
# 1. Check if server is up
ping 44.250.27.197

# 2. Check port 22
nc -zv 44.250.27.197 22

# 3. Check AWS Console for instance status
```

**Solutions**:

**Solution 1**: SSHD not running
```bash
# On server (if you have console access)
pgrep sshd || sudo systemctl start sshd
```

**Solution 2**: Security group misconfigured
- Go to AWS Console → EC2 → Security Groups
- Ensure port 22 is open to your IP

**Solution 3**: Instance stopped
- AWS Console → EC2 → Instances
- Start the instance

---

## Git Issues

### Problem: Push rejected

**Symptoms**:
```
! [rejected] main -> main (fetch first)
```

**Solution**:
```bash
git pull --rebase origin main
git push origin main
```

### Problem: Merge conflicts

**Symptoms**:
```
CONFLICT (content): Merge conflict in file.rs
```

**Solution**:
```bash
# 1. View conflicts
git status

# 2. Resolve manually or use tool
git mergetool

# 3. Mark as resolved
git add <file>
git commit

# 4. Or abort merge
git merge --abort
```

### Problem: Detached HEAD

**Symptoms**:
```
HEAD detached at <commit>
```

**Solution**:
```bash
# Return to main
git checkout main

# Or create branch from detached state
git checkout -b new-branch-name
```

---

## Storage Issues

### Problem: Disk full

**Symptoms**:
```bash
df -h
# Filesystem  Size  Used Avail Use% Mounted on
# /dev/xvda1  100G  100G     0 100% /
```

**Solutions**:

**Quick Clean**:
```bash
# Clean logs
find ~/.miyabi/logs -name "*.log" -mtime +7 -delete
find /tmp -name "claude-*" -mtime +3 -delete

# Clean git
cd ~/miyabi-private
git gc --aggressive --prune=now
git worktree prune

# Clean package caches
cargo clean
npm cache clean --force
```

**Identify Large Files**:
```bash
du -sh ~/* | sort -rh | head -20
du -sh ~/.miyabi/* | sort -rh
```

---

## Performance Issues

### Problem: High CPU usage

**Diagnosis**:
```bash
top -bn1 | head -20
ps aux | sort -rk 3 | head -10
```

**Solutions**:
- Identify process: `kill -9 <PID>` if stuck
- Check for runaway processes
- Monitor with: `watch -n 1 'ps aux | sort -rk 3 | head -5'`

### Problem: High memory usage

**Diagnosis**:
```bash
free -h
ps aux | sort -rk 4 | head -10
```

**Solutions**:
```bash
# Clear cache
sync && echo 3 | sudo tee /proc/sys/vm/drop_caches

# Restart heavy services
# Identify and restart specific services

# Monitor memory
watch -n 1 free -h
```

---

## Claude Code Issues

### Problem: API timeout

**Symptoms**:
```
Error: Request timeout after 30000ms
```

**Solutions**:

**Check API key**:
```bash
echo $ANTHROPIC_API_KEY
# Should be set and valid
```

**Check network**:
```bash
ping -c 3 api.anthropic.com
curl -I https://api.anthropic.com
```

**Retry with timeout**:
```bash
claude -p "test" --timeout 60000
```

### Problem: Rate limiting

**Symptoms**:
```
Error: Rate limit exceeded
```

**Solution**:
- Wait 60 seconds and retry
- Implement exponential backoff
- Check API usage quota

---

## GitHub Issues

### Problem: gh command not found

**Solution**:
```bash
# Install GitHub CLI
# Ubuntu/Debian
sudo apt install gh

# macOS
brew install gh

# Authenticate
gh auth login
```

### Problem: API rate limit

**Symptoms**:
```
API rate limit exceeded
```

**Check limits**:
```bash
gh api rate_limit
```

**Solution**:
- Wait for rate limit reset
- Use authenticated requests
- Implement caching

---

## Tmux Issues

### Problem: Cannot attach to session

**Symptoms**:
```
error connecting to /tmp/tmux-*/default (No such file or directory)
```

**Solutions**:
```bash
# List sessions
tmux ls

# Kill dead sessions
tmux kill-server

# Create new session
tmux new-session -s main
```

### Problem: Lost session

**Recovery**:
```bash
# List all sessions
tmux ls

# Attach to session by name
tmux attach -t <session-name>

# Create if doesn't exist
tmux new-session -A -s <session-name>
```

---

## Network Issues

### Problem: Cannot reach external services

**Diagnosis**:
```bash
# Check DNS
nslookup github.com

# Check connectivity
ping -c 3 8.8.8.8
ping -c 3 github.com

# Check routes
traceroute github.com
```

**Solutions**:
- Check `/etc/resolv.conf` for DNS
- Verify security groups
- Check VPN/firewall

---

## Common Error Messages

### "Permission denied (publickey)"

**Cause**: SSH key authentication failed

**Solution**:
```bash
# Check SSH key
ssh-add -l

# Add key if missing
ssh-add ~/.ssh/id_rsa

# Verify key on GitHub
gh ssh-key list
```

### "fatal: not a git repository"

**Cause**: Not in git directory

**Solution**:
```bash
cd ~/miyabi-private
# Or initialize new repo
git init
```

### "cargo: command not found"

**Cause**: Rust not installed or not in PATH

**Solution**:
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add to PATH
source $HOME/.cargo/env
```

---

## Escalation Procedures

### Level 1: Self-Service
- Check this guide
- Search documentation
- Check GitHub issues

### Level 2: Team Support
- Ask in team Slack/Discord
- Create internal ticket
- Pair with teammate

### Level 3: On-Call Engineer
- Page on-call via PagerDuty/Lark
- Provide: symptoms, steps taken, urgency

### Level 4: External Support
- AWS Support (infrastructure)
- Anthropic Support (Claude API)
- GitHub Support (platform)

---

## Diagnostic Scripts

### Full System Diagnostic

```bash
#!/bin/bash
# full-diagnostic.sh

echo "=== Miyabi System Diagnostic ==="
echo "Date: $(date)"
echo ""

echo "=== System Info ==="
uname -a
uptime

echo ""
echo "=== Disk Usage ==="
df -h

echo ""
echo "=== Memory Usage ==="
free -h

echo ""
echo "=== CPU Load ==="
top -bn1 | head -5

echo ""
echo "=== Network ==="
ping -c 1 github.com && echo "✅ Internet OK" || echo "❌ Internet FAILED"

echo ""
echo "=== Services ==="
pgrep sshd && echo "✅ SSH running" || echo "❌ SSH down"
tmux ls >/dev/null 2>&1 && echo "✅ Tmux sessions exist" || echo "⚠️ No tmux sessions"

echo ""
echo "=== Git Status ==="
cd ~/miyabi-private
git status

echo ""
echo "=== Recent Errors ==="
tail -20 ~/.miyabi/logs/error.log 2>/dev/null || echo "No error log"
```

---

## Related Documents

- [Operations Runbook](./RUNBOOK.md)
- [Disaster Recovery Plan](./DR_PLAN.md)
- [Onboarding Guide](./ONBOARDING_GUIDE.md)

---

**Document Owner**: Operations Team  
**Last Updated**: 2025-11-17  
**Next Review**: 2025-12-17
