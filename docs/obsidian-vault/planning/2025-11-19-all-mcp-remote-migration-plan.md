---
title: "ALL Miyabi MCP Servers → Remote Migration Plan"
created: 2025-11-19
updated: 2025-11-19
author: "Claude Code"
category: "planning"
tags: ["miyabi", "mcp", "remote", "migration", "aws", "architecture", "deployment"]
status: "active"
version: "1.0.0"
priority: "P0"
---

# 🚀 ALL Miyabi MCP Servers → Remote Migration Plan

Complete plan to migrate all local Miyabi MCP servers to remote AWS-hosted infrastructure.

---

## 📊 Executive Summary

**Mission**: Migrate all 3 local STDIO MCP servers to unified remote SSE/HTTP gateway on AWS App Runner.

**Timeline**: 3 phases over 2 weeks

**Benefits**:
- Universal access from Claude.ai Web, Desktop, and Code
- Centralized authentication and monitoring
- Horizontal scalability
- Zero local setup required

---

## 🎯 Current State Analysis

### Local MCP Servers (STDIO)

| Server | Tools | Lines | Status | Dependencies |
|--------|-------|-------|--------|--------------|
| **miyabi-tmux** | 6 | ~437 | ✅ Production | tmux, Node.js |
| **miyabi-rules** | ~3 | ~300 | ✅ Production | API client |
| **miyabi-obsidian** | 9 | ~437 | ✅ Production | gray-matter, fs |
| **Total** | **18** | **~1,174** | - | - |

### Remote Infrastructure (Existing)

| Component | Status | Tech Stack | Endpoint |
|-----------|--------|------------|----------|
| **miyabi-sse-gateway** | ✅ Ready | Express, SSE, Winston | Port 3000 |
| **miyabi-society-aws** | ✅ Deployed | AWS App Runner | https://peehmbqw9f.us-east-1.awsapprunner.com/mcp |

**Key Finding**: miyabi-sse-gateway already implements:
- Express HTTP server
- Bearer Token authentication
- Audit logging (Winston)
- Rate limiting
- CORS support
- OAuth2 flow (GitHub)

---

## 🏗️ Target Architecture

### Unified Remote MCP Gateway

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS App Runner                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Miyabi Unified MCP Gateway                   │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │  Express Server (Port 3000)                    │ │  │
│  │  │  - Bearer Token Auth                           │ │  │
│  │  │  - Rate Limiting                               │ │  │
│  │  │  - Audit Logging                               │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  │                                                       │  │
│  │  Routing Layer                                        │  │
│  │  ├─ /mcp/tmux    → tmux MCP Handler (6 tools)       │  │
│  │  ├─ /mcp/rules   → rules MCP Handler (~3 tools)     │  │
│  │  ├─ /mcp/obsidian → obsidian MCP Handler (9 tools)  │  │
│  │  └─ /mcp/society → society MCP Handler (7 tools)    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↑
                     HTTPS/SSE
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   Claude.ai           Claude             Claude Code
     Web              Desktop               CLI
```

---

## 📅 Migration Roadmap

### Phase 1: Gateway Unification (Week 1, Days 1-3)

**Goal**: Create unified SSE gateway that proxies all 4 MCP servers

#### Tasks

1. **Extend miyabi-sse-gateway**
   - Add routing for `/mcp/tmux`, `/mcp/rules`, `/mcp/obsidian`
   - Implement MCP tool handler adapter
   - Add server-specific middleware

2. **Create HTTP/SSE Adapters**
   - Convert STDIO tool calls to HTTP requests
   - Implement SSE streaming for long-running operations
   - Handle tool response formatting

3. **Add Authentication Layer**
   - Extend Bearer Token to support per-server tokens
   - Implement token-based access control
   - Add audit logging for all tool calls

4. **Testing**
   - Unit tests for each adapter
   - Integration tests for gateway routing
   - Load testing (1000 concurrent connections)

**Deliverables**:
- ✅ Unified gateway running locally
- ✅ All 18 tools accessible via HTTP/SSE
- ✅ Authentication working
- ✅ Comprehensive test suite

---

### Phase 2: AWS Deployment (Week 1, Days 4-5)

**Goal**: Deploy unified gateway to AWS App Runner

#### Tasks

1. **Prepare AWS Infrastructure**
   - Update `apprunner.yaml` with new routes
   - Configure environment variables (tokens, URLs)
   - Set up CloudWatch logging
   - Configure auto-scaling (2-10 instances)

2. **Build & Deploy**
   - Build Docker image
   - Push to AWS ECR
   - Deploy to App Runner
   - Verify health checks

3. **Configure DNS & SSL**
   - Update DNS records (if using custom domain)
   - Verify SSL certificate
   - Test HTTPS endpoints

4. **Security Hardening**
   - Enable AWS WAF
   - Configure rate limiting (100 req/min per IP)
   - Set up DDoS protection
   - Enable encryption at rest

**Deliverables**:
- ✅ Gateway deployed to AWS App Runner
- ✅ All endpoints accessible via HTTPS
- ✅ CloudWatch monitoring active
- ✅ Security controls in place

---

### Phase 3: Client Migration (Week 2, Days 1-3)

**Goal**: Update all Claude clients to use remote endpoints

#### Tasks

1. **Update Claude Desktop Config**
   ```json
   {
     "mcpServers": {
       "miyabi-tmux-remote": {
         "url": "https://<your-domain>/mcp/tmux",
         "transport": { "type": "sse" },
         "headers": {
           "Authorization": "Bearer <tmux-token>"
         }
       },
       "miyabi-rules-remote": {
         "url": "https://<your-domain>/mcp/rules",
         "transport": { "type": "sse" },
         "headers": {
           "Authorization": "Bearer <rules-token>"
         }
       },
       "miyabi-obsidian-remote": {
         "url": "https://<your-domain>/mcp/obsidian",
         "transport": { "type": "sse" },
         "headers": {
           "Authorization": "Bearer <obsidian-token>"
         }
       },
       "miyabi-society-remote": {
         "url": "https://peehmbqw9f.us-east-1.awsapprunner.com/mcp",
         "transport": { "type": "sse" },
         "headers": {
           "Authorization": "Bearer c5887ae6e657980b8ee2ebd581c31e973ff9a19ea370db23101cd8e48fe64b4d"
         }
       }
     }
   }
   ```

2. **Update Claude.ai Web (Custom Connectors)**
   - Add 3 new custom connectors
   - Configure OAuth2 or Bearer Token auth
   - Test tool availability

3. **Update Claude Code CLI**
   - Remove local `.mcp.json` configs
   - Add remote server configurations
   - Test in multiple projects

4. **Create Migration Guide**
   - Step-by-step instructions
   - Troubleshooting section
   - Rollback procedures

**Deliverables**:
- ✅ All clients using remote servers
- ✅ Local servers decommissioned
- ✅ Migration guide published
- ✅ User acceptance testing complete

---

### Phase 4: Optimization & Documentation (Week 2, Days 4-5)

**Goal**: Optimize performance and complete documentation

#### Tasks

1. **Performance Optimization**
   - Implement caching layer (Redis)
   - Optimize tool response times
   - Add connection pooling
   - Enable HTTP/2

2. **Monitoring & Alerts**
   - Set up CloudWatch alarms
   - Configure PagerDuty integration
   - Create monitoring dashboard
   - Define SLOs (99.9% uptime)

3. **Documentation**
   - API documentation (OpenAPI spec)
   - Deployment guide
   - Runbook for operations
   - Architecture diagrams

4. **Backup & DR**
   - Set up automated backups
   - Document disaster recovery procedures
   - Test failover scenarios
   - Create DR runbook

**Deliverables**:
- ✅ Performance optimizations deployed
- ✅ Monitoring stack complete
- ✅ Comprehensive documentation
- ✅ DR plan validated

---

## 🛠️ Technical Implementation

### 1. Gateway Architecture

#### Core Components

**A) Express Server (`src/index.ts`)**
```typescript
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(rateLimiter);
app.use(bearerAuth);
app.use(auditMiddleware);

// MCP Routes
app.use('/mcp/tmux', tmuxRouter);
app.use('/mcp/rules', rulesRouter);
app.use('/mcp/obsidian', obsidianRouter);
app.use('/mcp/society', societyRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

app.listen(PORT);
```

**B) MCP Tool Handler (`src/handlers/mcp-handler.ts`)**
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

export class MCPHandler {
  constructor(private tools: Tool[]) {}

  async handleRequest(req: Request, res: Response) {
    const server = new Server({
      name: req.params.serverName,
      version: '1.0.0'
    }, {
      capabilities: { tools: {} }
    });

    // Register tools
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools: this.tools };
    });

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      // Execute tool and return result
      return await this.executeTool(request.params.name, request.params.arguments);
    });

    // Create SSE transport
    const transport = new SSEServerTransport('/message', res);
    await server.connect(transport);
  }

  private async executeTool(name: string, args: any) {
    // Tool execution logic
  }
}
```

**C) Server-Specific Adapters**

```typescript
// src/adapters/tmux-adapter.ts
export class TmuxAdapter extends MCPHandler {
  constructor() {
    super([
      {
        name: 'tmux_list_sessions',
        description: '...',
        inputSchema: { ... }
      },
      // ... 5 more tools
    ]);
  }

  async executeTool(name: string, args: any) {
    switch (name) {
      case 'tmux_list_sessions':
        return await this.listSessions();
      // ... other tools
    }
  }

  private async listSessions() {
    // Import logic from original STDIO server
    const { exec } = await import('child_process');
    // ...
  }
}
```

---

### 2. Authentication Strategy

#### Multi-Token System

```typescript
// Token structure
interface BearerToken {
  token: string;
  serverAccess: string[];  // ['tmux', 'rules', 'obsidian']
  createdAt: Date;
  expiresAt: Date;
  user: string;
}

// Token validation
function validateToken(token: string, serverName: string): boolean {
  const tokenData = tokenStore.get(token);
  if (!tokenData) return false;
  if (Date.now() > tokenData.expiresAt.getTime()) return false;
  if (!tokenData.serverAccess.includes(serverName)) return false;
  return true;
}
```

#### Token Generation

```bash
# Generate server-specific tokens
export TMUX_TOKEN=$(openssl rand -hex 32)
export RULES_TOKEN=$(openssl rand -hex 32)
export OBSIDIAN_TOKEN=$(openssl rand -hex 32)
export SOCIETY_TOKEN="c5887ae6e657980b8ee2ebd581c31e973ff9a19ea370db23101cd8e48fe64b4d"
```

---

### 3. Deployment Configuration

#### `apprunner.yaml`

```yaml
version: 1.0
runtime: nodejs20
build:
  commands:
    pre-build:
      - npm install
    build:
      - npm run build
    post-build:
      - echo "Build complete"
run:
  command: node dist/index.js
  network:
    port: 3000
  env:
    - name: NODE_ENV
      value: production
    - name: TMUX_TOKEN
      value: <from-secrets>
    - name: RULES_TOKEN
      value: <from-secrets>
    - name: OBSIDIAN_TOKEN
      value: <from-secrets>
    - name: SOCIETY_TOKEN
      value: <from-secrets>
  health-check:
    protocol: http
    path: /health
    interval: 10
    timeout: 5
    healthy-threshold: 2
    unhealthy-threshold: 5
```

#### Environment Variables

```bash
# Required
PORT=3000
NODE_ENV=production

# Authentication
TMUX_TOKEN=<generated>
RULES_TOKEN=<generated>
OBSIDIAN_TOKEN=<generated>
SOCIETY_TOKEN=<existing>

# Logging
LOG_LEVEL=info
AUDIT_LOG_ENABLED=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS=https://claude.ai,https://claude.com
```

---

## 📊 Migration Metrics & KPIs

### Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Uptime** | 99.9% | CloudWatch |
| **Latency (p95)** | <200ms | CloudWatch |
| **Error Rate** | <0.1% | Application logs |
| **Migration Time** | <10 days | Project timeline |
| **Zero Downtime** | 100% | No service interruption |

### Monitoring Dashboards

1. **Operational Metrics**
   - Request rate (req/sec)
   - Response time (p50, p95, p99)
   - Error rate (%)
   - Active connections

2. **Business Metrics**
   - Tool usage by type
   - User activity by server
   - Authentication failures
   - Token expiration events

3. **Infrastructure Metrics**
   - CPU utilization
   - Memory usage
   - Network I/O
   - Auto-scaling events

---

## 🔐 Security Considerations

### Authentication & Authorization

1. **Bearer Token Management**
   - Rotate tokens every 90 days
   - Store securely in AWS Secrets Manager
   - Implement token revocation API
   - Log all authentication attempts

2. **Access Control**
   - Server-specific tokens (least privilege)
   - IP whitelisting (optional)
   - Rate limiting per token
   - Geographic restrictions (if needed)

### Data Protection

1. **Encryption**
   - TLS 1.3 for all connections
   - Encrypt sensitive data at rest
   - Use AWS KMS for key management

2. **Audit Logging**
   - Log all tool executions
   - Include user, timestamp, parameters
   - Store logs for 90 days
   - Enable log analysis (CloudWatch Insights)

### Network Security

1. **AWS WAF Rules**
   - Block common attack patterns
   - Rate limiting by IP
   - Geographic blocking (if needed)

2. **DDoS Protection**
   - AWS Shield Standard (automatic)
   - CloudFront distribution (optional)
   - Elastic Load Balancer

---

## 🚨 Rollback Plan

### Scenario 1: Gateway Deployment Failure

**Steps**:
1. Revert to previous App Runner deployment
2. Notify users via status page
3. Investigate root cause
4. Fix and redeploy

**Rollback Time**: <15 minutes

---

### Scenario 2: Performance Degradation

**Steps**:
1. Scale up App Runner instances (manual)
2. Enable caching layer
3. Optimize slow queries
4. If severe: rollback to local servers

**Rollback Time**: <30 minutes

---

### Scenario 3: Security Incident

**Steps**:
1. Immediately rotate all tokens
2. Enable IP whitelisting
3. Review audit logs
4. Patch vulnerability
5. Notify affected users

**Rollback Time**: <1 hour

---

## 📚 Migration Checklist

### Pre-Migration

- [ ] Review current server implementations
- [ ] Design unified gateway architecture
- [ ] Create AWS infrastructure
- [ ] Generate authentication tokens
- [ ] Set up monitoring & logging
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Create deployment scripts

### Migration

- [ ] Deploy unified gateway to staging
- [ ] Test all 18+ tools
- [ ] Perform load testing
- [ ] Deploy to production
- [ ] Update Claude Desktop configs
- [ ] Update Claude.ai Web connectors
- [ ] Update Claude Code CLI configs
- [ ] User acceptance testing

### Post-Migration

- [ ] Monitor performance (24h)
- [ ] Review error logs
- [ ] Optimize slow endpoints
- [ ] Update documentation
- [ ] Decommission local servers
- [ ] Archive old configurations
- [ ] Conduct retrospective

---

## 💰 Cost Estimation

### AWS App Runner

| Component | Monthly Cost | Notes |
|-----------|--------------|-------|
| **Compute** | $25-50 | 2-10 instances @ $0.064/vCPU-hour |
| **Memory** | $10-20 | 2-10 GB @ $0.007/GB-hour |
| **Data Transfer** | $5-10 | 100 GB/month @ $0.09/GB |
| **CloudWatch Logs** | $5 | 10 GB/month |
| **Secrets Manager** | $2 | 4 secrets @ $0.40/secret |
| **Total** | **$47-87/month** | Average: $67/month |

### Comparison

| Deployment | Monthly Cost | Scalability | Maintenance |
|------------|--------------|-------------|-------------|
| **Local (Current)** | $0 | Limited | High |
| **Remote (Proposed)** | ~$67 | Unlimited | Low |

**ROI**: Remote deployment reduces maintenance overhead by ~10 hours/month ($1,000 value).

---

## 🎯 Next Steps

### Immediate Actions (This Week)

1. **Review & Approve Plan**
   - Stakeholder review
   - Technical review
   - Budget approval

2. **Begin Phase 1**
   - Set up development environment
   - Create feature branch
   - Start gateway unification

3. **Prepare Infrastructure**
   - Create AWS resources
   - Generate tokens
   - Set up monitoring

### Week 2 Actions

1. **Complete Phase 1**
   - Finish gateway implementation
   - Complete testing
   - Deploy to staging

2. **Execute Phase 2**
   - Deploy to production
   - Verify all endpoints
   - Performance testing

### Week 3 Actions

1. **Execute Phase 3**
   - Migrate clients
   - User acceptance testing
   - Decommission local servers

2. **Complete Phase 4**
   - Optimize performance
   - Complete documentation
   - Conduct retrospective

---

## 📖 Related Documentation

### Internal
- [[mcp-server-integration-complete-guide|MCP Server Integration Guide]]
- [[miyabi-sse-gateway-architecture|SSE Gateway Architecture]]
- [[aws-deployment-guide|AWS Deployment Guide]]

### External
- [MCP Remote Servers](https://modelcontextprotocol.io/docs/develop/connect-remote-servers)
- [AWS App Runner](https://docs.aws.amazon.com/apprunner/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

## ✅ Decision Log

| Date | Decision | Rationale | Approved By |
|------|----------|-----------|-------------|
| 2025-11-19 | Use unified gateway approach | Simplifies deployment, reduces cost | Guardian |
| 2025-11-19 | AWS App Runner for hosting | Auto-scaling, minimal ops overhead | Guardian |
| 2025-11-19 | Bearer Token authentication | Simple, secure, widely supported | Guardian |

---

**Version**: 1.0.0
**Status**: Active Planning
**Owner**: Miyabi Team
**Last Updated**: 2025-11-19
**Next Review**: 2025-11-20

---

**🚀 Ready to begin migration! All systems go!**
