# Miyabi Deployment Guide

**Version**: 1.0.0
**Created**: 2025-10-24
**Status**: Production-Ready

---

## 📋 Overview

This guide describes the complete deployment architecture of Miyabi across five environments: Local Development, GitHub OS, Self-Hosted Runners, Kubernetes (Staging/Production), and Monitoring Stack.

**Diagram**: [Miyabi Deployment Architecture.png](Miyabi%20Deployment%20Architecture.png)

**Supported Platforms**:
- ✅ AWS (EKS)
- ✅ GCP (GKE)
- ✅ Azure (AKS)
- ✅ Self-hosted Kubernetes
- ✅ Firebase (optional)

---

## 🏗️ Architecture Layers

### Layer 1: Development Environment

**Components**:
- Miyabi CLI (`cargo install miyabi` or from source)
- VS Code + Claude Code extension
- Local Git worktrees (`.worktrees/`)
- Local SQLite database (state tracking)

**Developer Workflow**:
```bash
# 1. Create Issue on GitHub
gh issue create --title "Add feature X" --label "type:feature"

# 2. Run Coordinator Agent locally
miyabi agent run coordinator --issue 500

# 3. Agents execute in worktrees
# .worktrees/issue-500/ created automatically

# 4. Auto-commit + push
# Commits created with Conventional Commits format
```

**Local Development Setup**:
```bash
# Install dependencies
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install miyabi

# Clone repository
git clone https://github.com/your-org/miyabi-private.git
cd miyabi-private

# Configure GitHub token
export GITHUB_TOKEN=ghp_xxxxx

# Initialize Miyabi
miyabi init

# Run agents locally
miyabi agent run coordinator --issue 500
```

**Local Testing**:
```bash
# Run all tests
cargo test --all

# Run specific agent tests
cargo test --package miyabi-agents

# Run integration tests
cargo test --test integration

# Check code quality
cargo clippy --all-targets -- -D warnings
cargo fmt --all -- --check
cargo audit
```

---

### Layer 2: GitHub OS

**Components**:
- GitHub Issues (Task Queue)
- GitHub Pull Requests (Code Review)
- GitHub Actions (Execution Engine)
- GitHub Webhooks (Event Bus)
- GitHub Packages (Artifact Storage)
- GitHub Pages (Documentation)

**GitHub as Operating System**:

**Issues = Task Queue**:
```yaml
# Issue structure
Title: "Add user authentication"
Labels:
  - type:feature
  - priority:P1-High
  - state:pending
  - agent:codegen
  - estimated:16h
Body: |
  ## Requirements
  - JWT authentication
  - User model with validation
  - Middleware integration
```

**Labels = State Management**:
```
state:pending → state:analyzing → state:implementing →
state:reviewing → state:done
```

**PRs = Code Review**:
```markdown
## Automated PR Creation
- Created by PRAgent
- Linked to Issue
- Auto-merge if quality >= 90
- Conventional Commits format
```

**Actions = Execution Engine**:
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cargo test --all
      - run: cargo clippy
```

**Webhooks = Event Bus**:
```json
{
  "event": "issues.opened",
  "action": "opened",
  "issue": {
    "number": 500,
    "title": "Add user authentication",
    "labels": ["type:feature", "priority:P1-High"]
  }
}
```

**Configuration**:
```bash
# Set up GitHub webhook
gh api repos/$OWNER/$REPO/hooks \
  --method POST \
  --field name=web \
  --field active=true \
  --field events[]=issues \
  --field events[]=pull_request \
  --field config[url]="https://orchestrator.example.com/webhook" \
  --field config[content_type]=json \
  --field config[secret]="$WEBHOOK_SECRET"
```

---

### Layer 3: Self-Hosted Runners (24/7)

**Components**:
- Runner Pool (3 machines recommended)
- Water Spider Orchestrator (24/7 daemon)
- SQLite database (session state)
- Git worktrees (isolated execution)

**Runner Setup**:

#### Option A: GitHub-Hosted Runners (Easiest)
```yaml
# .github/workflows/agent-execution.yml
name: Agent Execution
on:
  workflow_dispatch:
    inputs:
      issue_number:
        required: true
jobs:
  execute:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cargo run --bin miyabi -- agent run coordinator --issue ${{ inputs.issue_number }}
```

#### Option B: Self-Hosted Runners (Recommended for Production)

**Machine Requirements**:
- **Minimum**: 4 CPU cores, 8 GB RAM, 100 GB SSD
- **Recommended**: 8 CPU cores, 16 GB RAM, 250 GB SSD
- **Network**: Stable internet, firewall rules for GitHub API

**Installation**:
```bash
# 1. Install runner
mkdir -p ~/actions-runner && cd ~/actions-runner
curl -o actions-runner-linux-x64-2.317.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.317.0/actions-runner-linux-x64-2.317.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.317.0.tar.gz

# 2. Configure runner
./config.sh --url https://github.com/your-org/miyabi-private \
  --token $RUNNER_TOKEN \
  --name runner-1 \
  --labels self-hosted,linux,x64

# 3. Install as systemd service
sudo ./svc.sh install
sudo ./svc.sh start

# 4. Verify
sudo ./svc.sh status
```

**Water Spider Orchestrator Setup**:
```bash
# 1. Build orchestrator
cargo build --release --bin miyabi-orchestrator

# 2. Create systemd service
sudo tee /etc/systemd/system/miyabi-orchestrator.service <<EOF
[Unit]
Description=Miyabi Water Spider Orchestrator
After=network.target

[Service]
Type=simple
User=miyabi
WorkingDirectory=/opt/miyabi
ExecStart=/opt/miyabi/target/release/miyabi-orchestrator
Restart=always
RestartSec=10
Environment="GITHUB_TOKEN=$GITHUB_TOKEN"
Environment="DATABASE_URL=/var/lib/miyabi/orchestrator.db"

[Install]
WantedBy=multi-user.target
EOF

# 3. Start service
sudo systemctl daemon-reload
sudo systemctl enable miyabi-orchestrator
sudo systemctl start miyabi-orchestrator

# 4. Check logs
sudo journalctl -u miyabi-orchestrator -f
```

**Configuration**:
```yaml
# config/orchestrator.yml
server:
  host: 0.0.0.0
  port: 8080
  webhook_secret: ${WEBHOOK_SECRET}

github:
  token: ${GITHUB_TOKEN}
  owner: your-org
  repo: miyabi-private

database:
  path: /var/lib/miyabi/orchestrator.db

worktrees:
  base_path: /var/lib/miyabi/worktrees
  max_concurrent: 10
  cleanup_after: 24h

agents:
  max_retries: 3
  timeout: 2h
  escalation_threshold: 7.0
```

**Monitoring**:
```bash
# Check runner status
./run.sh status

# View orchestrator logs
tail -f /var/log/miyabi/orchestrator.log

# Check active sessions
sqlite3 /var/lib/miyabi/orchestrator.db \
  "SELECT * FROM sessions WHERE status='running';"

# List worktrees
ls -la /var/lib/miyabi/worktrees/
```

---

### Layer 4: Kubernetes Cluster

**Cluster Requirements**:
- **Kubernetes version**: 1.28+
- **Node count**: 3+ (production), 1 (staging)
- **Node size**: 4 CPU, 8 GB RAM minimum
- **Storage**: Persistent volumes for databases
- **Network**: Load balancer, Ingress controller

#### Option A: AWS EKS

**Cluster Creation**:
```bash
# 1. Install eksctl
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin

# 2. Create cluster
eksctl create cluster \
  --name miyabi-cluster \
  --region us-west-2 \
  --nodegroup-name standard-workers \
  --node-type t3.large \
  --nodes 3 \
  --nodes-min 3 \
  --nodes-max 10 \
  --managed

# 3. Configure kubectl
aws eks update-kubeconfig --region us-west-2 --name miyabi-cluster

# 4. Verify
kubectl get nodes
```

#### Option B: GCP GKE

**Cluster Creation**:
```bash
# 1. Create cluster
gcloud container clusters create miyabi-cluster \
  --zone us-central1-a \
  --num-nodes 3 \
  --machine-type n1-standard-4 \
  --enable-autoscaling \
  --min-nodes 3 \
  --max-nodes 10

# 2. Configure kubectl
gcloud container clusters get-credentials miyabi-cluster --zone us-central1-a

# 3. Verify
kubectl get nodes
```

#### Option C: Azure AKS

**Cluster Creation**:
```bash
# 1. Create resource group
az group create --name miyabi-rg --location eastus

# 2. Create cluster
az aks create \
  --resource-group miyabi-rg \
  --name miyabi-cluster \
  --node-count 3 \
  --node-vm-size Standard_D4s_v3 \
  --enable-cluster-autoscaler \
  --min-count 3 \
  --max-count 10 \
  --generate-ssh-keys

# 3. Configure kubectl
az aks get-credentials --resource-group miyabi-rg --name miyabi-cluster

# 4. Verify
kubectl get nodes
```

**Namespace Setup**:
```bash
# Create namespaces
kubectl create namespace miyabi-staging
kubectl create namespace miyabi-production
kubectl create namespace miyabi-monitoring

# Set default namespace
kubectl config set-context --current --namespace=miyabi-production
```

**Deploy Miyabi Application**:

```yaml
# k8s/production/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: miyabi-api
  namespace: miyabi-production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: miyabi-api
  template:
    metadata:
      labels:
        app: miyabi-api
    spec:
      containers:
      - name: miyabi-api
        image: ghcr.io/your-org/miyabi:latest
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: miyabi-secrets
              key: database-url
        - name: GITHUB_TOKEN
          valueFrom:
            secretKeyRef:
              name: miyabi-secrets
              key: github-token
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: miyabi-api
  namespace: miyabi-production
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 8080
  selector:
    app: miyabi-api
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: miyabi-ingress
  namespace: miyabi-production
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - miyabi.example.com
    secretName: miyabi-tls
  rules:
  - host: miyabi.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: miyabi-api
            port:
              number: 80
```

**Deploy**:
```bash
# 1. Create secrets
kubectl create secret generic miyabi-secrets \
  --from-literal=database-url="postgresql://..." \
  --from-literal=github-token="ghp_..." \
  --namespace miyabi-production

# 2. Deploy application
kubectl apply -f k8s/production/

# 3. Verify deployment
kubectl get deployments -n miyabi-production
kubectl get pods -n miyabi-production
kubectl get services -n miyabi-production
kubectl get ingress -n miyabi-production

# 4. Check logs
kubectl logs -f deployment/miyabi-api -n miyabi-production

# 5. Port forward for testing
kubectl port-forward service/miyabi-api 8080:80 -n miyabi-production
curl http://localhost:8080/health
```

**Auto-Scaling**:
```yaml
# k8s/production/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: miyabi-api-hpa
  namespace: miyabi-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: miyabi-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

### Layer 5: Monitoring Stack

**Components**:
- Prometheus (metrics collection)
- Grafana (visualization)
- Loki (log aggregation)
- Jaeger (distributed tracing)

**Setup Monitoring Stack**:

#### Install Prometheus + Grafana (Helm)
```bash
# 1. Add Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# 2. Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace miyabi-monitoring \
  --create-namespace \
  --set grafana.enabled=true \
  --set grafana.adminPassword="$GRAFANA_PASSWORD"

# 3. Verify
kubectl get pods -n miyabi-monitoring

# 4. Access Grafana
kubectl port-forward -n miyabi-monitoring svc/prometheus-grafana 3000:80
# Open: http://localhost:3000 (admin / $GRAFANA_PASSWORD)
```

#### Install Loki (Log Aggregation)
```bash
# 1. Install Loki
helm install loki grafana/loki-stack \
  --namespace miyabi-monitoring \
  --set grafana.enabled=false \
  --set promtail.enabled=true

# 2. Configure Grafana data source
kubectl port-forward -n miyabi-monitoring svc/loki 3100:3100

# Add data source in Grafana:
# URL: http://loki.miyabi-monitoring:3100
```

#### Install Jaeger (Distributed Tracing)
```bash
# 1. Install Jaeger operator
kubectl create namespace observability
kubectl create -f https://github.com/jaegertracing/jaeger-operator/releases/download/v1.49.0/jaeger-operator.yaml -n observability

# 2. Create Jaeger instance
cat <<EOF | kubectl apply -f -
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: miyabi-jaeger
  namespace: miyabi-monitoring
spec:
  strategy: production
  storage:
    type: elasticsearch
EOF

# 3. Access Jaeger UI
kubectl port-forward -n miyabi-monitoring svc/miyabi-jaeger-query 16686:16686
# Open: http://localhost:16686
```

**Grafana Dashboards**:

```json
{
  "dashboard": {
    "title": "Miyabi Operations Dashboard",
    "panels": [
      {
        "title": "Active Issues",
        "targets": [{"expr": "miyabi_active_issues"}]
      },
      {
        "title": "Agent Execution Time",
        "targets": [{"expr": "histogram_quantile(0.95, miyabi_agent_duration_seconds)"}]
      },
      {
        "title": "Quality Scores",
        "targets": [{"expr": "avg(miyabi_quality_score)"}]
      },
      {
        "title": "Error Rate",
        "targets": [{"expr": "rate(miyabi_errors_total[5m])"}]
      }
    ]
  }
}
```

**Alerts**:
```yaml
# k8s/monitoring/alerts.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: miyabi-alerts
  namespace: miyabi-monitoring
spec:
  groups:
  - name: miyabi
    interval: 30s
    rules:
    - alert: HighErrorRate
      expr: rate(miyabi_errors_total[5m]) > 0.05
      for: 5m
      annotations:
        summary: "High error rate detected"
        description: "Error rate is {{ $value }} errors/sec"

    - alert: LowQualityScore
      expr: avg(miyabi_quality_score) < 70
      for: 10m
      annotations:
        summary: "Quality score dropped"
        description: "Average quality is {{ $value }}/100"

    - alert: AgentTimeout
      expr: miyabi_agent_timeouts_total > 3
      for: 1m
      annotations:
        summary: "Agent timeouts detected"
```

---

## 🚀 Deployment Process

### CI/CD Pipeline

**GitHub Actions Workflow**:
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: |
          cargo test --all
          cargo clippy -- -D warnings
          cargo audit

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker image
        run: docker build -t ghcr.io/${{ github.repository }}:${{ github.sha }} .
      - name: Push to registry
        run: |
          echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker push ghcr.io/${{ github.repository }}:${{ github.sha }}
          docker tag ghcr.io/${{ github.repository }}:${{ github.sha }} ghcr.io/${{ github.repository }}:latest
          docker push ghcr.io/${{ github.repository }}:latest

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: |
          kubectl set image deployment/miyabi-api \
            miyabi-api=ghcr.io/${{ github.repository }}:${{ github.sha }} \
            -n miyabi-staging
          kubectl rollout status deployment/miyabi-api -n miyabi-staging

      - name: Health check
        run: |
          kubectl run curl --image=curlimages/curl --rm -it --restart=Never -- \
            curl -f http://miyabi-api.miyabi-staging/health

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        run: |
          kubectl set image deployment/miyabi-api \
            miyabi-api=ghcr.io/${{ github.repository }}:${{ github.sha }} \
            -n miyabi-production
          kubectl rollout status deployment/miyabi-api -n miyabi-production

      - name: Health check
        run: |
          sleep 30
          curl -f https://miyabi.example.com/health

      - name: Rollback on failure
        if: failure()
        run: |
          kubectl rollout undo deployment/miyabi-api -n miyabi-production
```

---

## 🔒 Security Considerations

### Secrets Management

**Kubernetes Secrets**:
```bash
# Create secrets
kubectl create secret generic miyabi-secrets \
  --from-literal=github-token="ghp_..." \
  --from-literal=database-url="postgresql://..." \
  --from-literal=anthropic-api-key="sk-..." \
  --from-literal=webhook-secret="..." \
  --namespace miyabi-production

# Seal secrets (for GitOps)
kubeseal --format=yaml < secrets.yaml > sealed-secrets.yaml
kubectl apply -f sealed-secrets.yaml
```

### Network Policies

```yaml
# k8s/production/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: miyabi-api-policy
  namespace: miyabi-production
spec:
  podSelector:
    matchLabels:
      app: miyabi-api
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: miyabi-production
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 5432  # PostgreSQL
    - protocol: TCP
      port: 6379  # Redis
```

### TLS/SSL

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create Let's Encrypt issuer
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

---

## 📊 Cost Estimation

### AWS EKS (Monthly)

| Component | Cost | Details |
|-----------|------|---------|
| EKS Control Plane | $73 | Managed Kubernetes |
| EC2 Instances (t3.large × 3) | $189 | Worker nodes |
| EBS Volumes (100GB × 3) | $30 | Persistent storage |
| Load Balancer | $16 | Application LB |
| Data Transfer | $50 | 500 GB/month |
| **Total** | **~$358/month** | Production only |

**With Staging**: Add $150/month (1 smaller node)

### GCP GKE (Monthly)

| Component | Cost | Details |
|-----------|------|---------|
| GKE Control Plane | $73 | Managed Kubernetes |
| Compute (n1-standard-4 × 3) | $293 | Worker nodes |
| Persistent Disks (100GB × 3) | $24 | Storage |
| Load Balancer | $18 | HTTP(S) LB |
| Network Egress | $50 | 500 GB/month |
| **Total** | **~$458/month** | Production only |

### Cost Optimization Tips

1. **Use Spot/Preemptible Instances**: Save 60-80%
   ```bash
   # AWS Spot
   eksctl create nodegroup --cluster miyabi-cluster \
     --name spot-workers --spot --instance-types=t3.large

   # GCP Preemptible
   gcloud container node-pools create preemptible-pool \
     --cluster miyabi-cluster --preemptible
   ```

2. **Auto-scaling**: Scale down during off-hours
   ```yaml
   # k8s/production/node-autoscaler.yaml
   minReplicas: 1  # Night/weekends
   maxReplicas: 10 # Peak hours
   ```

3. **Use Self-Hosted Runners**: Free compute for CI/CD

4. **Leverage GitHub Free Tier**:
   - Free Actions minutes: 2,000/month
   - Free Packages storage: 500 MB
   - Free Pages: Unlimited

---

## 🔗 Related Documentation

- **End-to-End Workflow**: [END_TO_END_WORKFLOW.md](END_TO_END_WORKFLOW.md)
- **Water Spider Orchestrator**: [WATER_SPIDER_INDEX.md](WATER_SPIDER_INDEX.md)
- **Crates Architecture**: [DIAGRAM_INDEX.md](DIAGRAM_INDEX.md)
- **CI/CD Setup**: `.github/workflows/README.md`
- **Docker Images**: `Dockerfile`, `.dockerignore`

---

**Last Updated**: 2025-10-24
**Diagram**: Miyabi Deployment Architecture.png (466 KB)
**Supported Platforms**: AWS, GCP, Azure, Self-hosted
**Estimated Cost**: $358-458/month (production), $150/month (staging)
**Deployment Time**: 2-4 hours (initial setup), 10-15 minutes (updates)
