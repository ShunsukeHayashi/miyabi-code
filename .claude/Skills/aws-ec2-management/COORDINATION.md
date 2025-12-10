# AWS EC2 Management - Coordination Integration

**Skill**: aws-ec2-management
**Category**: Infrastructure
**Dependencies**: None
**Dependents**: docker-compose-workflow, ci-cd-pipeline

---

## Auto-Trigger Points

### Incoming Triggers
| From Skill | Trigger Condition | Action |
|------------|------------------|--------|
| ci-cd-pipeline | Deploy workflow starts | Verify instance running |
| docker-compose-workflow | Remote deployment | Start instance if stopped |
| miyabi-session-recovery | Infrastructure failure | Restart instance |

### Outgoing Triggers
| To Skill | Trigger Condition | Signal |
|----------|------------------|--------|
| docker-compose-workflow | Instance ready | `EC2_READY: {instance_id}` |
| ci-cd-pipeline | Instance status change | `EC2_STATUS: {status}` |
| objective-observation-reporting | Instance error | `EC2_ERROR: {details}` |

---

## Resource Sharing

### Produces
```yaml
- type: ec2_instance
  data:
    instance_id: "i-xxx"
    public_ip: "x.x.x.x"
    private_ip: "10.x.x.x"
    status: "running"
```

### Consumes
```yaml
- type: deployment_request
  from: ci-cd-pipeline
```

---

## Communication Protocol

### Status Report Format
```
[AWS-EC2] {STATUS}: {instance_name} ({instance_id}) - {details}
```

### Examples
```bash
# Report to coordination layer
tmux send-keys -t %1 '[AWS-EC2] STARTED: MUGEN (i-xxx) - Instance running' && sleep 0.5 && tmux send-keys -t %1 Enter

# Request instance check
tmux send-keys -t %1 '[AWS-EC2] CHECK: MUGEN' && sleep 0.5 && tmux send-keys -t %1 Enter
```

---

## Chain Sequences

### Sequence: Deploy to Production
```
aws-ec2-management [START]
    |
    v
[Verify instance running]
    |
    v
docker-compose-workflow [SIGNAL: EC2_READY]
    |
    v
ci-cd-pipeline [SIGNAL: CONTAINERS_READY]
```

### Sequence: Infrastructure Recovery
```
miyabi-session-recovery [SIGNAL: EC2_FAILED]
    |
    v
aws-ec2-management [RESTART]
    |
    v
[Wait for healthy status]
    |
    v
[SIGNAL: EC2_READY to all dependents]
```

---

## Momentum Multiplier

### Optimization 1: Parallel Instance Preparation
```bash
# Start multiple instances concurrently
aws ec2 start-instances --instance-ids i-mugen i-majin &
# Multiplier: 2x faster startup
```

### Optimization 2: Pre-warming
```bash
# Auto-start instances before workflow
# Trigger: ci-cd-pipeline detected
# Action: Start instances proactively
```

---

## Health Check Integration

```bash
# Health check for coordination layer
check_ec2_health() {
    local status=$(aws ec2 describe-instance-status --instance-ids $1 --query 'InstanceStatuses[0].InstanceStatus.Status' --output text)
    if [ "$status" != "ok" ]; then
        # Trigger recovery chain
        echo "[AWS-EC2] HEALTH_FAIL: $1"
    fi
}
```
