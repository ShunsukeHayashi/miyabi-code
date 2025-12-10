# Docker Compose Workflow - Coordination Integration

**Skill**: docker-compose-workflow
**Category**: Infrastructure
**Dependencies**: aws-ec2-management (for remote)
**Dependents**: ci-cd-pipeline

---

## Auto-Trigger Points

### Incoming Triggers
| From Skill | Trigger Condition | Action |
|------------|------------------|--------|
| ci-cd-pipeline | Build artifacts ready | Build containers |
| aws-ec2-management | Instance ready | Deploy containers |
| rust-development | Tests pass | Local container test |

### Outgoing Triggers
| To Skill | Trigger Condition | Signal |
|----------|------------------|--------|
| ci-cd-pipeline | Containers ready | `DOCKER_READY: {services}` |
| aws-ec2-management | Remote deploy needed | `DOCKER_DEPLOY: {env}` |
| objective-observation-reporting | Container error | `DOCKER_ERROR: {details}` |

---

## Resource Sharing

### Produces
```yaml
- type: container_image
  data:
    image: "miyabi/api:v1.2.3"
    size: "250MB"
    layers: 12
- type: service_status
  data:
    services: ["api", "mcp", "db", "redis"]
    status: "running"
```

### Consumes
```yaml
- type: build_artifact
  from: ci-cd-pipeline
- type: ec2_instance
  from: aws-ec2-management
```

---

## Communication Protocol

### Status Report Format
```
[DOCKER] {STATUS}: {service_name} - {details}
```

### Examples
```bash
# Report to coordination layer
tmux send-keys -t %1 '[DOCKER] STARTED: all services running' && sleep 0.5 && tmux send-keys -t %1 Enter

# Signal to CI/CD
tmux send-keys -t %1 '[DOCKER->CI-CD] READY: api,mcp,worker' && sleep 0.5 && tmux send-keys -t %1 Enter
```

---

## Chain Sequences

### Sequence: Local Development
```
rust-development [SIGNAL: TESTS_PASS]
    |
    v
docker-compose-workflow [START]
    |
    +---> docker compose build
    +---> docker compose up -d
    |
    v
[SIGNAL: DOCKER_READY]
```

### Sequence: Remote Deployment
```
aws-ec2-management [SIGNAL: EC2_READY]
    |
    v
docker-compose-workflow [START]
    |
    +---> SSH to instance
    +---> docker compose pull
    +---> docker compose up -d
    |
    v
ci-cd-pipeline [SIGNAL: DOCKER_DEPLOYED]
```

---

## Momentum Multiplier

### Optimization 1: Multi-stage Builds
```dockerfile
# Smaller images, faster deploys
FROM node:20-alpine AS builder
...
FROM node:20-alpine AS production
COPY --from=builder ...
# Reduces image size by 60%
```

### Optimization 2: Build Cache
```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
# Speeds up builds by 50-80%
```

### Optimization 3: Parallel Service Start
```bash
docker compose up -d --no-deps api mcp worker
# Start independent services concurrently
```

---

## Health Check Integration

```bash
# Monitor container health
check_docker_health() {
    local unhealthy=$(docker compose ps --format json | jq -r 'select(.Health != "healthy") | .Name')
    if [ -n "$unhealthy" ]; then
        echo "[DOCKER] HEALTH_FAIL: $unhealthy"
        # Trigger recovery
    fi
}
```

### Auto-recovery
```bash
# Restart unhealthy containers
docker compose restart $(docker compose ps --filter "health=unhealthy" -q)
```

---

## Perpetual Activation

### Auto-triggers
- CI build complete: Build new images
- EC2 ready: Deploy containers
- Health check fail: Restart service
- Config change: Recreate containers

### Feedback Loop
```
docker-compose-workflow --> ci-cd-pipeline (image metrics)
                              |
                              v
                          [Optimize Dockerfile]
                              |
                              v
                          docker-compose-workflow (rebuild)
```
