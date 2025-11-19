# Miyabi → Orchestra 200-Parallel - Quick Start Guide

**Duration**: 5 minutes to get started

## Prerequisites

✅ Miyabi installed at `/Users/shunsuke/Dev/miyabi-private/`
✅ Orchestra 200 at `/Users/shunsuke/Dev/multi_codex_Mugen_miyabi-orchestra/`
✅ SSH access to MUGEN and MAJIN configured
✅ tmux installed on all systems

## 🚀 Quick Start (3 Steps)

### Step 1: Test Connection (30 seconds)

```bash
cd /Users/shunsuke/Dev/miyabi-private

# Test SSH connectivity
ssh mugen "hostname" && ssh majin "hostname"

# Test control script
./.claude/integrations/orchestra-200-control.sh status
```

**Expected Output**: Connection successful, orchestra status displayed

---

### Step 2: Start Orchestra (1 minute)

```bash
# Start 200-parallel orchestration
./.claude/integrations/orchestra-200-control.sh start 200 "mugen:100,majin:100"

# Wait for initialization (~30 seconds)
# Watch real-time dashboard
./.claude/integrations/orchestra-200-control.sh watch
```

**Expected Output**:
```
[2025-11-11 10:00:00] Starting 200-parallel orchestration...
[2025-11-11 10:00:00]   Total instances: 200
[2025-11-11 10:00:00]   Distribution: mugen:100,majin:100
[2025-11-11 10:00:30] Orchestra started successfully
```

---

### Step 3: Deploy Miyabi Agents (2 minutes)

```bash
# Deploy all 14 Business Agents to the orchestra
./.claude/integrations/orchestra-200-control.sh deploy-business-agents
```

**Expected Output**:
```
[2025-11-11 10:02:00] Deploying Miyabi's 20 Business Agents to orchestra...
[2025-11-11 10:02:01]   Deploying: ai-entrepreneur (instances=1)
[2025-11-11 10:02:02]   Deploying: product-concept (instances=15)
[2025-11-11 10:02:03]   Deploying: market-research (instances=15)
...
[2025-11-11 10:04:00] Business agents deployment completed
```

---

## ✅ Verification

```bash
# Check status
./.claude/integrations/orchestra-200-control.sh status

# Expected output (JSON):
{
  "total_instances": 200,
  "active_instances": 176,
  "idle_instances": 24,
  "agents_deployed": 14,
  "rate_limits": {
    "rpm_used": 1234,
    "rpm_limit": 5000
  }
}
```

---

## 🎯 Common Use Cases

### Use Case 1: Execute a Single Miyabi Agent

```bash
# Execute market-research agent on issue #270
./.claude/integrations/orchestra-200-control.sh agent-execute market-research 270
```

### Use Case 2: Batch Execute Multiple Agents

```bash
# Create batch file
cat > batch-tasks.csv <<EOF
market-research,270,high
content-creation,271,high
analytics,272,medium
EOF

# Execute batch
./.claude/integrations/orchestra-200-control.sh agent-batch batch-tasks.csv
```

### Use Case 3: Scale Dynamically

```bash
# Scale up to 200 instances
./.claude/integrations/orchestra-200-control.sh scale 200

# Scale down to 100 instances
./.claude/integrations/orchestra-200-control.sh scale 100
```

### Use Case 4: Monitor in Real-Time

```bash
# Open real-time dashboard
./.claude/integrations/orchestra-200-control.sh watch

# Export metrics
./.claude/integrations/orchestra-200-control.sh export-metrics
```

---

## 🛑 Emergency Stop

```bash
# Graceful stop (30s timeout)
./.claude/integrations/orchestra-200-control.sh stop 30

# Emergency stop (immediate)
./.claude/integrations/orchestra-200-control.sh emergency-stop "API_LIMIT_REACHED"
```

---

## 📊 Agent Distribution Reference

| Agent Type | Character | Instances | Distribution |
|------------|-----------|-----------|--------------|
| **Strategy (6 agents)** |
| AI Entrepreneur | あきんどさん | 1 | mugen:1 |
| Product Concept | けいかくん | 15 | mugen:8, majin:7 |
| Product Design | つくるん2号 | 15 | mugen:8, majin:7 |
| Funnel Design | みちしるべん | 10 | mugen:5, majin:5 |
| Persona | よみとるん | 10 | mugen:5, majin:5 |
| Self Analysis | しらべるん | 5 | mugen:3, majin:2 |
| **Marketing (5 agents)** |
| Market Research | しらべるん2号 | 15 | mugen:8, majin:7 |
| Marketing | ひろめるん | 15 | mugen:8, majin:7 |
| Content Creation | かくちゃん | 20 | mugen:10, majin:10 |
| SNS Strategy | つぶやくん | 10 | mugen:5, majin:5 |
| YouTube | どうがくん | 10 | mugen:5, majin:5 |
| **Sales (3 agents)** |
| Sales | うるん | 15 | mugen:8, majin:7 |
| CRM | ささえるん | 15 | mugen:8, majin:7 |
| Analytics | かぞえるん | 20 | mugen:10, majin:10 |
| **Total** | | **176** | mugen:90, majin:86 |
| **Reserved** | | **24** | Dynamic queue |

---

## 🔧 Troubleshooting

### Problem: "Connection refused" when starting orchestra

**Solution**:
```bash
# Check SSH keys
ssh-add ~/.ssh/mugen-key.pem
ssh-add ~/.ssh/majin-key.pem

# Test connectivity
ssh mugen "echo OK"
ssh majin "echo OK"
```

### Problem: "Rate limit exceeded"

**Solution**:
```bash
# Check current rate limit
./.claude/integrations/orchestra-200-control.sh status | jq .rate_limits

# Scale down if needed
./.claude/integrations/orchestra-200-control.sh scale 100
```

### Problem: "Agent not found"

**Solution**:
```bash
# List available agents
yq eval '.agents[].name' .claude/integrations/orchestra-200-agents.yaml

# Use correct agent name
./.claude/integrations/orchestra-200-control.sh agent-execute <correct-name> <issue>
```

---

## 📚 Next Steps

1. **Read full documentation**: `.claude/integrations/README.md`
2. **Customize configuration**: `.claude/integrations/orchestra-200-config.yaml`
3. **View agent manifest**: `.claude/integrations/orchestra-200-agents.yaml`
4. **Check orchestra docs**: `/Users/shunsuke/Dev/multi_codex_Mugen_miyabi-orchestra/CLAUDE.md`

---

## 💡 Pro Tips

1. **Always check status before starting**:
   ```bash
   ./.claude/integrations/orchestra-200-control.sh status
   ```

2. **Use watch mode for monitoring**:
   ```bash
   ./.claude/integrations/orchestra-200-control.sh watch
   ```

3. **Export metrics regularly**:
   ```bash
   ./.claude/integrations/orchestra-200-control.sh export-metrics
   ```

4. **Set up aliases**:
   ```bash
   # Add to ~/.bashrc or ~/.zshrc
   alias orch="$HOME/Dev/miyabi-private/.claude/integrations/orchestra-200-control.sh"

   # Then use:
   orch status
   orch watch
   orch scale 200
   ```

---

**Need Help?**
- Check logs: `tail -f ~/.miyabi/logs/orchestra-control-$(date +%Y%m%d).log`
- Full documentation: `.claude/integrations/README.md`
- Orchestra project: `/Users/shunsuke/Dev/multi_codex_Mugen_miyabi-orchestra/`

---

**Version**: 1.0.0
**Last Updated**: 2025-11-11
**Maintained by**: Miyabi Team
