# 📚 Miyabi PDCA Continuous Improvement - Operation Manual

**Version**: 1.0.0  
**Last Updated**: 2025-11-04  
**Status**: Production-Ready

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📖 Table of Contents

1. [System Overview](#system-overview)
2. [Daily Operations](#daily-operations)
3. [Monitoring & Observability](#monitoring--observability)
4. [PDCA Cycle Management](#pdca-cycle-management)
5. [Troubleshooting](#troubleshooting)
6. [Optimization Guide](#optimization-guide)
7. [Emergency Procedures](#emergency-procedures)
8. [Best Practices](#best-practices)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎯 System Overview

### What is PDCA?

**PDCA** (Plan-Do-Check-Act) is a continuous improvement methodology now running 24/7 on Miyabi infrastructure:

- **PLAN**: Analyze metrics and generate improvement plans (hourly)
- **DO**: Execute improvements automatically based on conditions
- **CHECK**: Collect and analyze operational metrics (every 5 minutes)
- **ACT**: Determine and execute next actions with priority levels

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Layer 5: OS Protection (launchd) - Optional            │
├─────────────────────────────────────────────────────────┤
│ Layer 4: PDCA Continuous Improvement (PID: 88641)      │
│   - Hourly cycles (24/day)                             │
│   - 5-minute metrics (288/day)                         │
├─────────────────────────────────────────────────────────┤
│ Layer 3: Ultimate Failsafe (PID: 88463)                │
│   - 15-second checks                                   │
│   - Monitors Water Spider itself                       │
├─────────────────────────────────────────────────────────┤
│ Layer 2: System Watchdog (PID: 60377)                  │
│   - 30-second checks                                   │
│   - Monitors Water Spider, Agent Monitor, VOICEVOX     │
├─────────────────────────────────────────────────────────┤
│ Layer 1: Core Infrastructure                            │
│   - Water Spider Monitor v2.0                          │
│   - Agent State Monitor (PID: 59962)                   │
│   - System Health Monitor (PID: 89247)                 │
└─────────────────────────────────────────────────────────┘
```

### Components

**Active Processes**:
- PDCA System: `/scripts/pdca-continuous-improvement.sh` (PID: 88641)
- Ultimate Failsafe: `/scripts/ultimate-failsafe-watchdog.sh` (PID: 88463)

**Data Directories**:
- Logs: `.ai/logs/pdca-improvement.log`, `.ai/logs/ultimate-failsafe.log`
- Metrics: `.ai/metrics/metrics-YYYYMMDD_HHMMSS.json`
- Improvements: `.ai/improvements/plan-cycle-N.md`, `analysis-cycle-N.md`, `actions-cycle-N.md`
- State: `.ai/state/pdca-state.json`, `.ai/state/ultimate-failsafe.json`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🗓️ Daily Operations

### Morning Checklist (5 minutes)

```bash
# 1. Verify all systems running
ps aux | grep -E "(pdca|ultimate-failsafe)" | grep -v grep

# 2. Check for critical alerts overnight
tail -50 .ai/logs/ultimate-failsafe-alerts.log

# 3. Review last PDCA cycle
ls -lt .ai/improvements/ | head -5
cat .ai/improvements/actions-cycle-*.md | tail -50

# 4. Check metrics collection health
ls -lt .ai/metrics/ | head -10
```

**Expected Output**:
- 2 processes running (PDCA + Ultimate Failsafe)
- 0 critical alerts (or only resolved alerts)
- Latest PDCA cycle within last hour
- ~288 metrics files per day

### Weekly Review (30 minutes)

```bash
# 1. Calculate PDCA cycles completed
ls .ai/improvements/plan-cycle-*.md | wc -l
# Expected: ~168 cycles per week

# 2. Review improvement trends
grep -h "Improvement Goals" .ai/improvements/plan-cycle-*.md | tail -20

# 3. Analyze restart frequency
grep "RESTARTED" .ai/logs/ultimate-failsafe.log | wc -l

# 4. Check resource optimization
grep "Memory" .ai/improvements/analysis-cycle-*.md | tail -20

# 5. Generate weekly report
cat > weekly-pdca-report-$(date +%Y%m%d).md << REPORT
# PDCA Weekly Report

**Period**: $(date -v-7d +%Y-%m-%d) to $(date +%Y-%m-%d)

## Cycles Completed
- Total: $(ls .ai/improvements/plan-cycle-*.md | wc -l) cycles
- Expected: 168 cycles

## Restarts
- Water Spider: $(grep "water_spider.*RESTARTED" .ai/logs/ultimate-failsafe.log | wc -l)
- System Watchdog: $(grep "system_watchdog.*RESTARTED" .ai/logs/ultimate-failsafe.log | wc -l)
- Health Monitor: $(grep "health_monitor.*RESTARTED" .ai/logs/ultimate-failsafe.log | wc -l)

## Improvements Implemented
$(grep "Auto-executing" .ai/logs/pdca-improvement.log | tail -10)

## Next Week Goals
- Continue automated optimization
- Monitor for new patterns
REPORT
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📊 Monitoring & Observability

### Real-Time Monitoring

**1. Live PDCA Activity**
```bash
# Watch PDCA cycles in real-time
tail -f .ai/logs/pdca-improvement.log

# Expected output every hour:
# [YYYY-MM-DD HH:MM:SS] [INFO] [PDCA] 🔄 Starting PDCA Cycle #N
# [YYYY-MM-DD HH:MM:SS] [INFO] [PDCA] 📋 PLAN Phase - Generating improvement plan
# [YYYY-MM-DD HH:MM:SS] [INFO] [PDCA] 🚀 DO Phase - Executing improvements
# [YYYY-MM-DD HH:MM:SS] [INFO] [PDCA] 📊 CHECK Phase - Collecting operational metrics
# [YYYY-MM-DD HH:MM:SS] [INFO] [PDCA] 🎬 ACT Phase - Determining next actions
# [YYYY-MM-DD HH:MM:SS] [INFO] [PDCA] ✅ PDCA Cycle #N complete
```

**2. Ultimate Failsafe Status**
```bash
# Watch failsafe monitoring
tail -f .ai/logs/ultimate-failsafe.log

# Expected output every 15 seconds:
# [YYYY-MM-DD HH:MM:SS] [INFO] [UltimateFailsafe] ✅ Failsafe check complete - All critical systems monitored

# Alert pattern (if component fails):
# [YYYY-MM-DD HH:MM:SS] [WARNING] [UltimateFailsafe] ⚠️ Component NOT RUNNING (failure count: 1)
# [YYYY-MM-DD HH:MM:SS] [CRITICAL] Component FAILURE - Taking action: Restarting
# [YYYY-MM-DD HH:MM:SS] [INFO] [UltimateFailsafe] ✅ Component successfully restarted
```

**3. Critical Alerts Only**
```bash
# Monitor critical events
tail -f .ai/logs/ultimate-failsafe-alerts.log

# This log only contains CRITICAL events requiring attention
```

**4. Metrics Collection**
```bash
# Watch metrics being collected (every 5 minutes)
watch -n 60 'ls -lth .ai/metrics/ | head -10'

# Verify metrics content
jq '.' .ai/metrics/metrics-*.json | tail -30
```

### Dashboards & Reports

**1. Latest PDCA Cycle Status**
```bash
# View latest improvement plan
cat .ai/improvements/plan-cycle-*.md | tail -100

# View latest analysis
cat .ai/improvements/analysis-cycle-*.md | tail -100

# View latest actions
cat .ai/improvements/actions-cycle-*.md | tail -100
```

**2. Health Metrics**
```bash
# Calculate average metrics over last 24 hours
jq -s 'map(.system.memory_percent) | add / length' .ai/metrics/metrics-*.json
jq -s 'map(.system.cpu_percent) | add / length' .ai/metrics/metrics-*.json
jq -s 'map(.operations.agent_availability) | add / length' .ai/metrics/metrics-*.json
```

**3. Restart Frequency**
```bash
# Count restarts by component
echo "Water Spider restarts:"
grep "water_spider.*RESTARTED" .ai/logs/ultimate-failsafe.log | wc -l

echo "Watchdog restarts:"
grep "system_watchdog.*RESTARTED" .ai/logs/ultimate-failsafe.log | wc -l

echo "Health Monitor restarts:"
grep "health_monitor.*RESTARTED" .ai/logs/ultimate-failsafe.log | wc -l

echo "Agent Monitor restarts:"
grep "agent_monitor.*RESTARTED" .ai/logs/ultimate-failsafe.log | wc -l
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🔄 PDCA Cycle Management

### Understanding PDCA Cycles

**Timeline**:
- **Metrics Collection**: Every 5 minutes
- **Full PDCA Cycle**: Every 1 hour
- **Expected per Day**: 24 cycles, 288 metrics

**Cycle Phases**:

1. **PLAN** (Every hour at :00)
   - Analyzes last 24 hours of metrics
   - Generates improvement plan markdown
   - Sets measurable goals (10-20% targets)
   - File: `.ai/improvements/plan-cycle-N.md`

2. **DO** (Immediately after PLAN)
   - Auto-adjusts monitoring intervals
   - Enables aggressive cleanup if needed
   - Updates configuration files
   - Logs: `.ai/logs/pdca-improvement.log`

3. **CHECK** (Every 5 minutes)
   - Collects system metrics (memory, CPU, disk)
   - Collects operational metrics (restarts, availability)
   - Calculates health scores
   - File: `.ai/metrics/metrics-YYYYMMDD_HHMMSS.json`
   - Also: Hourly trend analysis in `analysis-cycle-N.md`

4. **ACT** (Immediately after CHECK analysis)
   - Determines next actions with priorities
   - Auto-executes HIGH priority actions
   - Generates action plan markdown
   - File: `.ai/improvements/actions-cycle-N.md`

### Manual Cycle Trigger (Advanced)

If you need to trigger a PDCA cycle manually:

```bash
# This is rarely needed - cycles run automatically

# Method 1: Wait for next cycle (max 1 hour)
# No action needed

# Method 2: Restart PDCA system to reset cycle timer
pkill -f "pdca-continuous-improvement.sh"
sleep 2
nohup /Users/shunsuke/Dev/miyabi-private/scripts/pdca-continuous-improvement.sh >> .ai/logs/pdca-improvement.log 2>&1 &

# Verify restart
ps aux | grep pdca | grep -v grep
```

### Cycle History

```bash
# View all completed cycles
ls -lt .ai/improvements/ | grep "plan-cycle"

# Count total cycles
ls .ai/improvements/plan-cycle-*.md | wc -l

# View specific cycle
CYCLE_NUM=5
cat .ai/improvements/plan-cycle-${CYCLE_NUM}.md
cat .ai/improvements/analysis-cycle-${CYCLE_NUM}.md
cat .ai/improvements/actions-cycle-${CYCLE_NUM}.md
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🔧 Troubleshooting

### Common Issues

#### 1. PDCA System Not Running

**Symptoms**:
- No new metrics files in `.ai/metrics/`
- No log updates in `.ai/logs/pdca-improvement.log`
- Process not found: `ps aux | grep pdca`

**Resolution**:
```bash
# Check process status
ps aux | grep pdca | grep -v grep

# If not running, restart
cd /Users/shunsuke/Dev/miyabi-private
nohup ./scripts/pdca-continuous-improvement.sh >> .ai/logs/pdca-improvement.log 2>&1 &

# Verify startup
tail -20 .ai/logs/pdca-improvement.log

# Expected:
# [YYYY-MM-DD HH:MM:SS] [INFO] [PDCA] 🔄 PDCA Continuous Improvement System started
```

#### 2. Ultimate Failsafe Not Running

**Symptoms**:
- Components fail without automatic restart
- No updates in `.ai/logs/ultimate-failsafe.log`

**Resolution**:
```bash
# Restart Ultimate Failsafe
cd /Users/shunsuke/Dev/miyabi-private
nohup ./scripts/ultimate-failsafe-watchdog.sh >> .ai/logs/ultimate-failsafe.log 2>&1 &

# Verify
ps aux | grep ultimate-failsafe | grep -v grep
tail -20 .ai/logs/ultimate-failsafe.log
```

#### 3. Metrics Not Collecting

**Symptoms**:
- Old metrics files (> 5 minutes)
- PDCA log shows errors

**Resolution**:
```bash
# Check disk space
df -h /

# Check directory permissions
ls -ld .ai/metrics/

# Manually create missing directories
mkdir -p .ai/metrics .ai/improvements .ai/state/failsafe-failures

# Check PDCA log for errors
grep ERROR .ai/logs/pdca-improvement.log | tail -20
```

#### 4. High Restart Frequency

**Symptoms**:
- Ultimate Failsafe restarting components frequently
- Many RESTARTED entries in logs

**Analysis**:
```bash
# Check restart counts
grep "RESTARTED" .ai/logs/ultimate-failsafe.log | cut -d' ' -f4 | sort | uniq -c

# View failure patterns
grep "WARNING.*NOT RUNNING" .ai/logs/ultimate-failsafe.log | tail -50

# Check system resources
tail -20 .ai/logs/system-health.log
```

**Resolution**:
- If memory-related: Check `.ai/logs/system-health.log` for memory leaks
- If specific component: Check component's individual log
- If persistent: Review PDCA improvement recommendations

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🎯 Optimization Guide

### Interpreting PDCA Recommendations

**Example Improvement Plan**:
```markdown
## 🎯 Improvement Goals

### Goal 1: Reduce Restart Frequency
**Target**: Reduce restart count by 10%
**Current**: 15 restarts/24h
**Actions**:
- Analyze root causes of restarts
- Implement preventive measures
- Adjust monitoring thresholds
```

**How to Act**:
1. Review the specific component causing restarts
2. Check component-specific logs for patterns
3. PDCA will auto-adjust thresholds (in DO phase)
4. Monitor next cycle for improvement

### Manual Optimization

**Adjust PDCA Intervals** (if needed):
```bash
# Edit PDCA script
vim scripts/pdca-continuous-improvement.sh

# Change these variables:
PDCA_CYCLE_INTERVAL=3600           # 1 hour (default)
METRICS_COLLECTION_INTERVAL=300    # 5 minutes (default)

# Restart PDCA system
pkill -f "pdca-continuous-improvement.sh"
nohup ./scripts/pdca-continuous-improvement.sh >> .ai/logs/pdca-improvement.log 2>&1 &
```

**Adjust Ultimate Failsafe Sensitivity**:
```bash
# Edit Ultimate Failsafe script
vim scripts/ultimate-failsafe-watchdog.sh

# Change these variables:
CHECK_INTERVAL=15                  # 15 seconds (default)
MAX_CONSECUTIVE_FAILURES=2         # 2 failures (default)

# Restart Ultimate Failsafe
pkill -f "ultimate-failsafe-watchdog.sh"
nohup ./scripts/ultimate-failsafe-watchdog.sh >> .ai/logs/ultimate-failsafe.log 2>&1 &
```

### Long-Term Optimization Goals

**Week 1**:
- Establish baseline metrics
- Identify primary failure patterns
- Auto-adjust monitoring intervals

**Month 1**:
- 10-20% restart reduction
- Memory usage stabilization
- Failure detection time improvement

**Quarter 1**:
- Predictive failure detection
- Near-zero unplanned downtime
- 15-25% resource optimization

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 🚨 Emergency Procedures

### Emergency Stop (Rare)

**When to use**: System causing issues, need immediate stop

```bash
# Stop all PDCA systems
pkill -f "pdca-continuous-improvement.sh"
pkill -f "ultimate-failsafe-watchdog.sh"

# Verify stopped
ps aux | grep -E "(pdca|ultimate-failsafe)" | grep -v grep
# Should return nothing

# Note: Core infrastructure (Water Spider, Watchdog, Health Monitor) continues running
```

### Emergency Restart

**When to use**: After emergency stop, ready to resume

```bash
cd /Users/shunsuke/Dev/miyabi-private

# Restart Ultimate Failsafe first
nohup ./scripts/ultimate-failsafe-watchdog.sh >> .ai/logs/ultimate-failsafe.log 2>&1 &
sleep 2

# Then restart PDCA System
nohup ./scripts/pdca-continuous-improvement.sh >> .ai/logs/pdca-improvement.log 2>&1 &
sleep 2

# Verify both running
ps aux | grep -E "(pdca|ultimate-failsafe)" | grep -v grep

# Check logs
tail -20 .ai/logs/ultimate-failsafe.log
tail -20 .ai/logs/pdca-improvement.log
```

### Critical Component Failure

**If Ultimate Failsafe can't restart a component**:

```bash
# Check Ultimate Failsafe alerts
tail -50 .ai/logs/ultimate-failsafe-alerts.log

# Identify failed component
grep "restart FAILED" .ai/logs/ultimate-failsafe.log | tail -10

# Manual component restart
cd /Users/shunsuke/Dev/miyabi-private

# Example: Restart Water Spider
pkill -f "water-spider-monitor-v2.sh"
nohup ./scripts/water-spider-monitor-v2.sh >> .ai/logs/water-spider.log 2>&1 &

# Verify
ps aux | grep water-spider | grep -v grep
```

### System-Wide Health Check

```bash
# Comprehensive health check
echo "=== PDCA Infrastructure Health Check ==="
echo ""
echo "1. PDCA System:"
ps aux | grep pdca | grep -v grep | awk '{print "   Status: RUNNING (PID: "$2")"}'

echo ""
echo "2. Ultimate Failsafe:"
ps aux | grep ultimate-failsafe | grep -v grep | awk '{print "   Status: RUNNING (PID: "$2")"}'

echo ""
echo "3. Core Infrastructure:"
ps aux | grep -E "(water-spider|system-watchdog|agent-state-monitor|health-monitor)" | grep -v grep | wc -l | awk '{print "   Components: "$1" running"}'

echo ""
echo "4. Recent Metrics:"
ls -lt .ai/metrics/ | head -3

echo ""
echo "5. Recent PDCA Cycle:"
ls -lt .ai/improvements/ | grep plan-cycle | head -1

echo ""
echo "6. Critical Alerts (last 24h):"
grep CRITICAL .ai/logs/ultimate-failsafe-alerts.log | tail -5 || echo "   None"
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ✅ Best Practices

### Daily Operations

1. **Morning Check** (5 min)
   - Review critical alerts: `tail -50 .ai/logs/ultimate-failsafe-alerts.log`
   - Verify PDCA cycles: `ls -lt .ai/improvements/ | head -5`

2. **Let PDCA Work**
   - Trust the automated optimization
   - Don't manually intervene unless critical
   - Review weekly trends, not hourly changes

3. **Monitor Trends**
   - Weekly: Restart frequency, resource usage
   - Monthly: Improvement goal achievement
   - Quarterly: Predictive pattern identification

### Maintenance

1. **Log Rotation** (Monthly)
   ```bash
   # Archive old logs
   tar -czf pdca-logs-$(date +%Y%m).tar.gz .ai/logs/pdca-*.log .ai/logs/ultimate-failsafe*.log
   mv pdca-logs-*.tar.gz archive/
   
   # Truncate current logs (keep last 10000 lines)
   tail -10000 .ai/logs/pdca-improvement.log > .ai/logs/pdca-improvement.log.tmp
   mv .ai/logs/pdca-improvement.log.tmp .ai/logs/pdca-improvement.log
   ```

2. **Metrics Cleanup** (Monthly)
   ```bash
   # Keep last 30 days of metrics
   find .ai/metrics/ -name "metrics-*.json" -mtime +30 -delete
   ```

3. **Improvement History** (Quarterly)
   ```bash
   # Archive old improvement plans
   tar -czf improvements-$(date +%Y%m).tar.gz .ai/improvements/
   mv improvements-*.tar.gz archive/
   rm .ai/improvements/plan-cycle-*.md .ai/improvements/analysis-cycle-*.md .ai/improvements/actions-cycle-*.md
   ```

### Alerts & Notifications

**VOICEVOX Integration**:
- PDCA completion: "PDCAサイクルN完了なのだ。継続的改善中なのだ。"
- Critical failure: "最終防衛システム発動！[Component]が停止したのだ！緊急復旧開始なのだ！"
- Emergency cleanup: "緊急警告！システムリソース異常なのだ！[Component]が危険な状態なのだ！"

**Custom Alerts** (Optional):
```bash
# Add Slack/Discord webhook in scripts if desired
# Example: Send daily summary at 9 AM
0 9 * * * /path/to/send-daily-pdca-summary.sh
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 📞 Support & Resources

### Key Files

**Scripts**:
- PDCA System: `/scripts/pdca-continuous-improvement.sh`
- Ultimate Failsafe: `/scripts/ultimate-failsafe-watchdog.sh`

**Logs**:
- PDCA: `.ai/logs/pdca-improvement.log`
- Ultimate Failsafe: `.ai/logs/ultimate-failsafe.log`
- Critical Alerts: `.ai/logs/ultimate-failsafe-alerts.log`

**Data**:
- Metrics: `.ai/metrics/metrics-*.json`
- Improvements: `.ai/improvements/`
- State: `.ai/state/`

### Documentation

- System Overview: `/tmp/miyabi-pdca-deployment-20251104_004656.md`
- Water Spider: `scripts/water-spider-monitor-v2.sh`
- System Watchdog: `scripts/miyabi-system-watchdog.sh`

### Quick Reference Commands

```bash
# Status check
ps aux | grep -E "(pdca|ultimate-failsafe)" | grep -v grep

# Real-time monitoring
tail -f .ai/logs/pdca-improvement.log

# Latest improvements
cat .ai/improvements/actions-cycle-*.md | tail -50

# Critical alerts
tail -f .ai/logs/ultimate-failsafe-alerts.log

# Metrics summary
jq -s 'map(.system.memory_percent) | add / length' .ai/metrics/metrics-*.json
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Document Version**: 1.0.0  
**Last Updated**: 2025-11-04  
**Maintained by**: Miyabi Team

🎉 **PDCA Continuous Improvement is Operational**  
🔄 **The system improves itself with every operation**
